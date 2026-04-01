# auth.py
import random
import string
from backend.src.app.configs.environment import Config
from datetime import datetime, timezone
from backend.src.app.models.user import User, RefreshToken, Role, Role
from flask import Blueprint, request, jsonify, g
from backend.src.app.middlewares.access_security import require_auth, currentUserId
from sqlalchemy.orm import selectinload
from werkzeug.exceptions import BadRequest
from sqlalchemy.exc import SQLAlchemyError, IntegrityError

from backend.src.projects.analytics_manager.logger import get_backend_logger
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
    data = request.get_json(silent=True) or {}
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        raise BadRequest("username anpostd password required", 400)

    user: User = User.query.filter_by(username=username).first()
    if not user or not user.is_active or user.deleted:
        raise BadRequest("Invalid credentials or inactive account", 401)

    if not user.check_password(password):
        raise BadRequest("Invalid credentials", 401)

    # --- Refresh token ---
    raw_token, hashed_token, expires_at = RefreshToken.encode()

    RefreshToken.save_refresh_token(user.id, hashed_token, expires_at)

    user: User = (
        User.query
        .options(
            selectinload(User.roles).selectinload(Role.permissions),
            # selectinload(User.datasource_permissions),
            # selectinload(User.tenant),
            # selectinload(User.refresh_tokens),
            # selectinload(User.logs),
            # selectinload(User.histories),
        )
        .filter_by(username=username)
        .first()
    )

    # --- Access token ---
    token, expire, payload = user.generate_permission_payload()
    response = {
        "access_token": token,
        "access_token_exp": expire,
        # "refresh_token_exp": int(expires_at.timestamp()),
        "payload": payload
    }

    
    cookie = request.args.get("cookie")
    set_cookie = Config.AUTH_SET_COOKIE if cookie is None else cookie.lower() in ("1", "true", "yes")
    if set_cookie:
        secure_flag = bool(getattr(Config, "USE_SSL", False))
        resp = jsonify(response)
        resp.set_cookie(
            "refresh_token",
            raw_token,
            httponly=True,
            secure=secure_flag,
            samesite="Lax",
            # samesite="None",     # 🔥 OBLIGATOIRE cross-site
            expires=expires_at
        )
        return resp, 200

    # Sinon refresh token en JSON
    # return jsonify({**response, "refresh_token": raw_token}), 200
    return jsonify(response), 200

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
        raise BadRequest("Too many attempts", 429)

    data = request.get_json(silent=True) or {}
    cookie = request.cookies.get("refresh_token")
    
    incoming = cookie if cookie is not None else data.get("refresh_token")
    if not incoming:
        raise BadRequest("Missing refresh_token", 400)

    hashed_incoming = RefreshToken.hash_token(incoming)
    rt:RefreshToken = RefreshToken.query.filter_by(token=hashed_incoming).first()  # fallback
    now = datetime.now(timezone.utc)

    # print(f"Attempting to refresh token for client {client_id} at {now.isoformat()}")
    if not rt or not rt.expires_at:
        raise BadRequest("Invalid refresh token", 401)

    # print(f"Found refresh token for user_id {rt.user_id}, expires at {rt.expires_at.isoformat()}, revoked: {rt.revoked}")
    if rt.revoked or utc(rt.expires_at) <= now:
        raise BadRequest("Refresh token invalid or expired", 401)

    # print(f"Refresh token is valid. Issuing new tokens for user_id {rt.user_id}")
    user: User = User.query.get(rt.user_id)
    if not user or not user.is_active or user.deleted:
        raise BadRequest("User not found or inactive", 401)

    # Issue new refresh token
    raw_token, hashed_token, expires_at = RefreshToken.encode()

    # Revoke old token -> ROTATE TOKEN
    RefreshToken.revoke_refresh_token(rt)
    RefreshToken.save_refresh_token(user.id, hashed_token, expires_at)


    user: User = (
        User.query
        .options(
            selectinload(User.roles).selectinload(Role.permissions),
            # selectinload(User.datasource_permissions),
            # selectinload(User.tenant),
            # selectinload(User.refresh_tokens),
            # selectinload(User.logs),
            # selectinload(User.histories),
        )
        .filter_by(id=rt.user_id)
        .first()
    )

    token, expire, payload = user.generate_permission_payload()
    response = {
        "access_token": token,
        "access_token_exp": expire,
        # "refresh_token_exp": int(expires_at.timestamp()),
        "payload": payload
    }
    
    cookie = request.args.get("cookie")
    set_cookie = Config.AUTH_SET_COOKIE if cookie is None else cookie.lower() in ("1", "true", "yes")

    if set_cookie:
        secure_flag = bool(getattr(Config, "USE_SSL", False))
        resp = jsonify(response)
        resp.set_cookie(
            "refresh_token",
            raw_token,
            httponly=True,
            secure=secure_flag,
            samesite="Lax",
            # samesite="None",     # 🔥 OBLIGATOIRE cross-site
            expires=expires_at
        )
        return resp, 200
    # return jsonify({**response, "refresh_token": raw_token}), 200
    return jsonify(response), 200

# ===================== LOGOUT =====================
@bp.post("/logout")
@require_auth
def logout():
    try:
        """Invalidate a refresh token for the current user."""
        data = request.get_json(silent=True) or {}
        raw_token = data.get("refresh_token")

        if not raw_token:
            raise BadRequest("Missing refresh_token", 400)

        hashed_token = RefreshToken.hash_token(raw_token)
        rt: RefreshToken = RefreshToken.query.filter_by(token=hashed_token).first()

        if not rt:
            raise BadRequest("Refresh token not found", 404)

        if rt.user_id != g.current_user["id"]:
            raise BadRequest("Forbidden", 403)

        RefreshToken.revoke_refresh_token(rt)
        return jsonify({"message": "Logged out successfully"}), 200
    except:
        raise BadRequest("Bad request", 500)


# ===================== CURRENT USER =====================
@bp.get("/me")
@require_auth
def me():
    """Return current user info (from require_auth -> g.current_user)."""
    current = g.get("current_user")
    if not current:
        raise BadRequest("Unauthorized", 401)
    return jsonify({"user": current}), 200

