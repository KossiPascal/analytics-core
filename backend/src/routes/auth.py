# auth.py
import uuid
import random
import string
from config import Config
from datetime import datetime
from database.extensions import db
from helpers.logger import get_logger
from sqlalchemy.exc import IntegrityError
from models.auth import User, RefreshToken
from flask import Blueprint, request, jsonify, g, current_app
from helpers.hasher import hash_password, verify_password, hash_token
from helpers.auth import create_token,create_refresh_token,save_refresh_token,get_refresh_token,revoke_refresh_token,check_rate_limit
from security.access_security import require_auth

logger = get_logger(__name__)

bp = Blueprint("auth", __name__, url_prefix="/api/auth")


# ===================== UTILITIES =====================
def generate_short_id(length=11) -> str:
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

def available_uid(existing_ids: set) -> str:
    new_id = generate_short_id()
    while new_id in existing_ids:
        new_id = generate_short_id()
    return new_id


# ===================== LOGIN =====================
@bp.post("/login")
def login():
    try:
        data = request.get_json(silent=True) or {}
        username = data.get("username")
        password = data.get("password")

        if not username or not password:
            return jsonify({"error": "username and password required"}), 400

        user: User = User.query.filter_by(username=username).first()
        if not user or not user.is_active or user.is_deleted:
            return jsonify({"error": "Invalid credentials or inactive account"}), 401

        if not user.check_password(password):
            return jsonify({"error": "Invalid credentials"}), 401

        # --- Refresh token ---
        raw_refresh, hashed_refresh, expires_at = create_refresh_token()
        save_refresh_token(user.id, hashed_refresh, expires_at)

        # --- Access token ---
        token, expire, payload = user.generate_permission_payload()
        response = {
            "access_token": token,
            "access_token_exp": expire,
            "refresh_token_exp": int(expires_at.timestamp()),
            "payload": payload
        }

        set_cookie = bool(request.args.get("cookie") or current_app.config.get("AUTH_SET_COOKIE", False))
        if set_cookie:
            secure_flag = bool(current_app.config.get("USE_SSL", False))
            resp = jsonify(response)
            resp.set_cookie("refresh_token",raw_refresh,httponly=True,secure=secure_flag,samesite="Lax",expires=expires_at)
            return resp, 200

        # Sinon refresh token en JSON
        return jsonify({**response, "refresh_token": raw_refresh}), 200

    except Exception:
        current_app.logger.exception("Login error")
        return jsonify({"error": "Login failed"}), 500


# ===================== REGISTER =====================
@bp.post("/register")
@require_auth  # optionally, only admin can create users
def register():
    """
    Register a new user.
    JSON body: { "username": "", "password": "", "fullname": "", "email": "", "phone": "", "roles": [] }
    """
    try:
        data = request.get_json(silent=True) or {}
        username = data.get("username")
        password = data.get("password")
        fullname = data.get("fullname")
        email = data.get("email")
        phone = data.get("phone")
        roles = data.get("roles", [])

        if not username or not password:
            return jsonify({"error": "Username and password are required"}), 400

        # check duplicates
        existing = User.query.filter((User.username == username) | (User.email == email)).first()
        if existing:
            return jsonify({"error": "Username or email already exists"}), 409

        # Hash password
        salt, hashed = hash_password(password)

        # Generate unique ID
        user_id = uuid.uuid4()

        new_user = User(
            id=user_id,
            username=username,
            fullname=fullname,
            email=email,
            phone=phone,
            password=hashed,
            salt=salt,
            roles=roles,
            is_active=True,
            is_deleted=False,
            must_login=True,
            has_changed_default_password=False,
            created_by=g.current_user.get("id") if g.get("current_user") else None
        )

        db.session.add(new_user)
        db.session.commit()

        return jsonify({"message": "User registered successfully", "user_id": str(user_id)}), 201

    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Database integrity error"}), 500
    except Exception as e:
        logger.exception("Register error")
        return jsonify({"error": "Registration failed", "details": str(e)}), 500

# ===================== UPDATE PASSWORD =====================
@bp.post("/update-password")
@require_auth
def update_password():
    """
    Update user password.
    JSON body: { "oldPassword": "...", "newPassword": "..." }
    """
    try:
        user: User = User.query.get(g.current_user["id"])
        if not user or not user.is_active or user.is_deleted:
            return jsonify({"error": "User not found or inactive"}), 404

        data = request.get_json(silent=True) or {}
        old_password = data.get("oldPassword")
        new_password = data.get("newPassword")

        if not old_password or not new_password:
            return jsonify({"error": "Both old and new passwords are required"}), 400

        if not verify_password(old_password, user.salt, user.password):
            return jsonify({"error": "Old password is incorrect"}), 401

        # Hash new password
        salt, hashed = hash_password(new_password)
        user.password_hash = hashed
        user.salt = salt
        user.has_changed_default_password = True
        user.must_login = True

        db.session.commit()

        # Optionally issue new access token
        token, access_exp = create_token(user.to_dict_safe())

        return jsonify({"message": "Password updated successfully", "token": token}), 200

    except Exception as e:
        logger.exception("Update password error")
        return jsonify({"error": "Failed to update password", "details": str(e)}), 500

# ===================== REFRESH TOKEN =====================
@bp.post("/refresh")
@require_auth
def refresh():
    """
    Rotate refresh token and return new access + refresh token.
    Accepts JSON body { "refresh_token": "..." } or cookie "refresh_token".
    """
    client_id = request.remote_addr or "unknown"
    if not check_rate_limit(client_id):
        return jsonify({"error": "Too many attempts"}), 429

    data = request.get_json(silent=True) or {}
    incoming = data.get("refresh_token") or request.cookies.get("refresh_token")
    if not incoming:
        return jsonify({"error": "Missing refresh_token"}), 400

    try:
        hashed_incoming = hash_token(incoming)
        rt:RefreshToken = RefreshToken.query.filter_by(token=hashed_incoming).first()  # fallback
        
        if not rt:
            return jsonify({"error": "Invalid refresh token"}), 401

        if rt.revoked or rt.expires_at < datetime.datetime.utcnow():
            return jsonify({"error": "Refresh token invalid or expired"}), 401

        user: User = User.query.get(rt.user_id)
        if not user or not user.is_active or user.is_deleted:
            return jsonify({"error": "User not found or inactive"}), 401

        # Revoke old token -> ROTATE TOKEN
        revoke_refresh_token(rt)

        # Issue new refresh token
        raw_new, hashed_new, expires_at = create_refresh_token()
        save_refresh_token(user.id, hashed_new, expires_at)

        # token, access_exp = create_token(user.to_dict_safe())
        token, expire, payload = user.generate_permission_payload()
        response = {
            "access_token": token,
            "access_token_exp": expire,
            "refresh_token_exp": int(expires_at.timestamp()),
            "payload": payload
        }

        set_cookie = bool(request.args.get("cookie", False)) or current_app.config.get("AUTH_SET_COOKIE", False)
        if set_cookie:
            secure_flag = bool(getattr(Config, "USE_SSL", False))
            resp = jsonify(response)
            resp.set_cookie("refresh_token",raw_new,httponly=True,secure=secure_flag,samesite="Lax",expires=expires_at)
            return resp, 200
        return jsonify({**response, "refresh_token": raw_new}), 200

    except Exception as e:
        logger.exception("Unhandled error during refresh")
        return jsonify({"error": "Internal error", "details": str(e)}), 500

# ===================== LOGOUT =====================
@bp.post("/logout")
@require_auth
def logout():
    """Invalidate a refresh token for the current user."""
    try:
        data = request.get_json(silent=True) or {}
        incoming = data.get("refresh_token")
        if not incoming:
            return jsonify({"error": "Missing refresh_token"}), 400

        hashed = hash_token(incoming)
        rt: RefreshToken = get_refresh_token(hashed)
        if not rt:
            rt = RefreshToken.query.filter_by(token=incoming).first()
            if not rt:
                return jsonify({"error": "Refresh token not found"}), 404

        if rt.user_id != g.current_user["id"]:
            return jsonify({"error": "Forbidden"}), 403

        revoke_refresh_token(rt)
        return jsonify({"message": "Logged out successfully"}), 200

    except Exception as e:
        logger.exception("Logout error")
        return jsonify({"error": "Logout failed", "details": str(e)}), 500

# ===================== CURRENT USER =====================
@bp.get("/me")
@require_auth
def me():
    """Return current user info (from require_auth -> g.current_user)."""
    try:
        current = g.get("current_user")
        if not current:
            return jsonify({"error": "Unauthorized"}), 401
        return jsonify({"user": current}), 200
    except Exception as e:
        logger.exception("Failed to return current user")
        return jsonify({"error": "Failed", "details": str(e)}), 500
