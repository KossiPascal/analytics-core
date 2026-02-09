# auth.py
from __future__ import annotations
import jwt
import time
import secrets
from uuid import UUID
from backend.src.config import Config
from typing import Tuple, Optional, Dict
from sqlalchemy.exc import SQLAlchemyError
from backend.src.database.extensions import db
from backend.src.models.auth import RefreshToken
from backend.src.helpers.hasher import hash_token
from datetime import datetime, timedelta, timezone

from backend.src.logger import get_backend_logger
logger = get_backend_logger(__name__)

rate_limit_store: Dict[str, Tuple[int, int]] = {}  # client_id -> (count, first_ts)

# Helpers
def _now_ts() -> int:
    return int(datetime.now(timezone.utc).timestamp())

def _generate_refresh_token(nbytes: int = 64) -> str:
    """Generate a secure URL-safe refresh token (raw)."""
    return secrets.token_urlsafe(nbytes)

# def create_token(payload: dict, expires_minutes: Optional[int] = None) -> Tuple[str, int]:
#     """Return (jwt_string, expires_at_epoch_seconds)."""
#     expires_minutes = expires_minutes or Config.ACCESS_TOKEN_EXPIRES_MINUTES
#     now = datetime.now(timezone.utc)
#     exp = now + timedelta(minutes=expires_minutes)
#     p = payload.copy()
#     p.update({"iat": int(now.timestamp()), "exp": int(exp.timestamp())})
#     token = jwt.encode(p, Config.JWT_SECRET_KEY, algorithm=Config.JWT_ALGORITHM)
#     return token, int(exp.timestamp())

def create_token(payload: dict, expires_minutes: Optional[int] = None) -> Tuple[str, int]:
    expires_minutes = expires_minutes or Config.ACCESS_TOKEN_EXPIRES_MINUTES
    now = datetime.now(timezone.utc)
    exp = now + timedelta(minutes=expires_minutes)

    # 🔐 Nettoyage du payload (UUID → str)
    safe_payload = {}
    for k, v in payload.items():
        if isinstance(v, UUID):
            safe_payload[k] = str(v)
        else:
            safe_payload[k] = v

    safe_payload.update({"iat": int(now.timestamp()),"exp": int(exp.timestamp())})
    token = jwt.encode(safe_payload,Config.JWT_SECRET_KEY,algorithm=Config.JWT_ALGORITHM)

    return token, int(exp.timestamp())


def create_refresh_token(days: int | None = None):
    expires_days = days or Config.REFRESH_TOKEN_EXPIRES_DAYS
     # raw = _generate_refresh_token()
    # raw = hashlib.sha256(f"{datetime.now(timezone.utc).timestamp()}-{hashlib.sha256().hexdigest()}".encode()).hexdigest()  # random token
    raw = secrets.token_urlsafe(64)
    hashed = hash_token(raw)
    expires_at = datetime.now(timezone.utc) + timedelta(days=expires_days)
    return raw, hashed, expires_at


def check_rate_limit(client_id: str) -> bool:
    """Simple sliding window per-client rate limit (in-memory)."""
    now = int(time.time())
    entry = rate_limit_store.get(client_id)
    if not entry:
        rate_limit_store[client_id] = (1, now)
        return True
    count, first_ts = entry
    if now - first_ts > Config.REFRESH_RATE_LIMIT_WINDOW_SECONDS:
        rate_limit_store[client_id] = (1, now)
        return True
    if count >= Config.REFRESH_RATE_LIMIT_MAX:
        return False
    rate_limit_store[client_id] = (count + 1, first_ts)
    return True

# Utilities: DB helpers (SQLAlchemy)
def save_refresh_token(user_id: str, hashed_token: str, expires_at: datetime) -> RefreshToken:
    """Save a new refresh token in DB."""
    try:
        rt = RefreshToken(user_id=user_id, token=hashed_token, expires_at=expires_at, revoked=False)
        db.session.add(rt)
        db.session.commit()
        return rt
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f"Failed to save refresh token: {str(e)}")
        raise e

def get_refresh_token(hashed_token: str) -> Optional[RefreshToken]:
    return RefreshToken.query.filter_by(token=hashed_token).first()

def revoke_refresh_token(rt_obj: RefreshToken) -> None:
    """Revoke an existing refresh token."""
    try:
        rt_obj.revoked = True
        db.session.commit()
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f"Failed to revoke refresh token: {str(e)}")
        raise e
