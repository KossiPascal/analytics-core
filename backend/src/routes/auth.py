# auth.py
import random
import string
from backend.src.config import Config
from datetime import datetime, timezone
from backend.src.helpers.hasher import hash_token
from backend.src.models.auth import User, RefreshToken
from flask import Blueprint, request, jsonify, g, current_app
from backend.src.security.access_security import require_auth

from backend.src.logger import get_backend_logger
logger = get_backend_logger(__name__)

bp = Blueprint("auth", __name__, url_prefix="/api/auth")


# ===================== UTILITIES =====================
def generate_short_id(length=11) -> str:
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

def available_uid(existing_ids: set) -> str:
    new_id = generate_short_id()
    while new_id in existing_ids:
        new_id = generate_short_id()
    return new_id

def utc(dt: datetime) -> datetime:
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


# ===================== LOGIN =====================
@bp.post("/login")
def login():
    try:
        data = request.get_json(silent=True) or {}
        username = data.get("username")
        password = data.get("password")

        if not username or not password:
            return jsonify({"error": "username anpostd password required"}), 400

        user: User = User.query.filter_by(username=username).first()
        if not user or not user.is_active or user.deleted:
            return jsonify({"error": "Invalid credentials or inactive account"}), 401

        if not user.check_password(password):
            return jsonify({"error": "Invalid credentials"}), 401

        # --- Refresh token ---
        raw_token, hashed_token, expires_at = RefreshToken.encode()
        RefreshToken.save_refresh_token(user.id, hashed_token, expires_at)

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
            resp.set_cookie("refresh_token",raw_token,httponly=True,secure=secure_flag,samesite="Lax",expires=expires_at)
            return resp, 200

        # Sinon refresh token en JSON
        return jsonify({**response, "refresh_token": raw_token}), 200

    except Exception as e:
        current_app.logger.error(f"Login error: {str(e)}")
        return jsonify({"error": f"Login failed: {str(e)}"}), 500

# ===================== REFRESH TOKEN =====================
@bp.post("/refresh")
def refresh():
    # print("Refresh token request received from:", request.remote_addr)
    """
    Rotate refresh token and return new access + refresh token.
    Accepts JSON body { "refresh_token": "..." } or cookie "refresh_token".
    """
    # client_id = request.remote_addr or "unknown"
    client_id = f"{request.remote_addr}:{request.headers.get('User-Agent','')}"

    if not RefreshToken.check_rate_limit(client_id):
        return jsonify({"error": "Too many attempts"}), 429

    data = request.get_json(silent=True) or {}
    incoming = data.get("refresh_token") or request.cookies.get("refresh_token")
    if not incoming:
        return jsonify({"error": "Missing refresh_token"}), 400

    try:
        hashed_incoming = hash_token(incoming)
        rt:RefreshToken = RefreshToken.query.filter_by(token=hashed_incoming).first()  # fallback
        now = datetime.now(timezone.utc)

        # print(f"Attempting to refresh token for client {client_id} at {now.isoformat()}")
        if not rt or not rt.expires_at:
            return jsonify({"error": "Invalid refresh token"}), 401

        # print(f"Found refresh token for user_id {rt.user_id}, expires at {rt.expires_at.isoformat()}, revoked: {rt.revoked}")
        if rt.revoked or utc(rt.expires_at) <= now:
            return jsonify({"error": "Refresh token invalid or expired"}), 401

        # print(f"Refresh token is valid. Issuing new tokens for user_id {rt.user_id}")
        user: User = User.query.get(rt.user_id)
        if not user or not user.is_active or user.deleted:
            return jsonify({"error": "User not found or inactive"}), 401

        # Issue new refresh token
        raw_token, hashed_token, expires_at = RefreshToken.encode()

        # Revoke old token -> ROTATE TOKEN
        RefreshToken.revoke_refresh_token(rt)
        RefreshToken.save_refresh_token(user.id, hashed_token, expires_at)

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
            resp.set_cookie("refresh_token",raw_token,httponly=True,secure=secure_flag,samesite="Lax",expires=expires_at)
            return resp, 200
        return jsonify({**response, "refresh_token": raw_token}), 200

    except Exception as e:
        logger.error(f"Unhandled error during refresh: {str(e)}")
        return jsonify({"error": "Internal error", "details": str(e)}), 500

# ===================== LOGOUT =====================
@bp.post("/logout")
@require_auth
def logout():
    """Invalidate a refresh token for the current user."""
    try:
        data = request.get_json(silent=True) or {}
        raw_token = data.get("refresh_token")

        if not raw_token:
            return jsonify({"error": "Missing refresh_token"}), 400

        hashed_token = RefreshToken.hash_token(raw_token)
        rt: RefreshToken = RefreshToken.query.filter_by(token=hashed_token).first()

        if not rt:
            return jsonify({"error": "Refresh token not found"}), 404

        if rt.user_id != g.current_user["id"]:
            return jsonify({"error": "Forbidden"}), 403

        RefreshToken.revoke_refresh_token(rt)
        return jsonify({"message": "Logged out successfully"}), 200

    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
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
        logger.error(f"Failed to return current user: {str(e)}")
        return jsonify({"error": "Failed", "details": str(e)}), 500
