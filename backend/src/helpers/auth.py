# auth.py
from __future__ import annotations
import jwt
import time
import secrets
from config import Config
from functools import wraps
from database.extensions import db, tokenManagement
from helpers.hasher import hash_token
from datetime import datetime, timedelta
from typing import Tuple, Optional, Dict
from flask import request, jsonify, g
from models.auth import User, RefreshToken
from uuid import UUID


rate_limit_store: Dict[str, Tuple[int, int]] = {}  # client_id -> (count, first_ts)

# Helpers
def _now_ts() -> int:
    return int(datetime.utcnow().timestamp())

def _generate_refresh_token(nbytes: int = 64) -> str:
    """Generate a secure URL-safe refresh token (raw)."""
    return secrets.token_urlsafe(nbytes)

# def create_token(payload: dict, expires_minutes: Optional[int] = None) -> Tuple[str, int]:
#     """Return (jwt_string, expires_at_epoch_seconds)."""
#     expires_minutes = expires_minutes or Config.ACCESS_TOKEN_EXPIRES_MINUTES
#     now = datetime.utcnow()
#     exp = now + timedelta(minutes=expires_minutes)
#     p = payload.copy()
#     p.update({"iat": int(now.timestamp()), "exp": int(exp.timestamp())})
#     token = jwt.encode(p, Config.JWT_SECRET_KEY, algorithm=Config.JWT_ALGORITHM)
#     return token, int(exp.timestamp())

def create_token(payload: dict, expires_minutes: Optional[int] = None) -> Tuple[str, int]:
    expires_minutes = expires_minutes or Config.ACCESS_TOKEN_EXPIRES_MINUTES
    now = datetime.utcnow()
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

def create_refresh_token(expires_days: Optional[int] = None) -> Tuple[str, str, datetime]:
    expires_days = expires_days or Config.REFRESH_TOKEN_EXPIRES_DAYS
    raw = _generate_refresh_token()
    hashed = hash_token(raw)
    expires_at = datetime.utcnow() + timedelta(days=expires_days)
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
    rt = RefreshToken(user_id=user_id, token=hashed_token, issued_at=datetime.utcnow(), expires_at=expires_at, revoked=False)
    db.session.add(rt)
    db.session.commit()
    return rt

def get_refresh_token(hashed_token: str) -> Optional[RefreshToken]:
    return RefreshToken.query.filter_by(token=hashed_token).first()

def revoke_refresh_token(rt_obj: RefreshToken) -> None:
    rt_obj.revoked = True
    db.session.add(rt_obj)
    db.session.commit()
