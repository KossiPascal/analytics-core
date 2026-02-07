from __future__ import annotations
from functools import wraps
from typing import Optional, Callable, Awaitable
from flask import request, jsonify, g
from werkzeug.exceptions import Unauthorized, Forbidden
from backend.src.database.extensions import tokenManagement
from backend.src.models.auth import User
import inspect
from backend.src.database.extensions import db

# Decorator to protect routes (uses JWT access token)
def require_auth(f=None, *, roles: Optional[list[str]] = None):
    """ 
    @require_auth -> any logged-in user 
    @require_auth(roles=["admin", "super_admin"]) -> only roles allowed
    """
    def decorator(func):
        @wraps(func)
        def wrapped(*args, **kwargs):
            # 1. Read Authorization header
            auth_header = request.headers.get("Authorization", "")
            if not auth_header or not auth_header.startswith("Bearer "):
                raise Unauthorized("Authorization header missing")

            scheme, _, token = auth_header.partition(" ")
            if scheme.lower() != "bearer" or not token:
                raise Unauthorized("Invalid Authorization header format")
            
             # 2. Decode token (JWT / serializer abstraction)
            try:
                token = token or auth_header.split(" ", 1)[1]
                payload = tokenManagement.decode(token)
            except Exception as e:
                # Do NOT leak decoding errors
                raise Unauthorized("Invalid or expired access token")

            username = payload.get("username")
            user_id = payload.get("id")

            if not username or not user_id:
                raise Unauthorized("Invalid token payload")

            # 4. Validate user exists & is active
            user: User | None = (User.query.filter_by(id=user_id, username=username).first())
            if not user:
                raise Unauthorized("User not found")

            if hasattr(user, "is_active") and not user.is_active:
                raise Forbidden("User account is disabled")

            # 5. Role / permission validation
            if roles:
                user_roles = set(user.roles or [])
                required_roles = set(roles)

                if user_roles.isdisjoint(required_roles):
                    raise Forbidden("Insufficient permissions")

            # 6. Attach security context
            g.current_user = payload
            # g.current_user = user
            # g.current_user_permissions = set(payload.get("permissions", []))
            # g.current_user_roles = set(payload.get("roles", []))

            return func(*args, **kwargs)
        
        return wrapped
    
    return decorator if f is None else decorator(f)


def async_require_auth(f: Optional[Callable] = None, *, roles: Optional[list[str]] = None):
    """
    @async_require_auth
    @async_require_auth(roles=["admin", "super_admin"])
    """

    def decorator(func: Callable[..., Awaitable]):
        @wraps(func)
        async def wrapped(*args, **kwargs):

            # 1. Authorization header
            auth_header = request.headers.get("Authorization", "")
            if not auth_header.startswith("Bearer "):
                raise Unauthorized("Authorization header missing")

            token = auth_header.split(" ", 1)[1].strip()
            if not token:
                raise Unauthorized("Invalid Authorization header")

            # 2. Decode token
            try:
                payload = tokenManagement.decode(token)
            except Exception:
                raise Unauthorized("Invalid or expired access token")

            user_id = payload.get("id")
            username = payload.get("username")

            if not user_id or not username:
                raise Unauthorized("Invalid token payload")

            # 3. Load user (sync SQLAlchemy safe)
            user = User.query.filter_by(id=user_id, username=username).first()
            if not user:
                raise Unauthorized("User not found")

            if getattr(user, "is_active", True) is False:
                raise Forbidden("User account is disabled")

            # 4. Role check
            if roles:
                user_roles = set(user.roles or [])
                required_roles = set(roles)

                if user_roles.isdisjoint(required_roles):
                    raise Forbidden("Insufficient permissions")

            # 5. Attach context
            g.current_user = user
            g.current_user_payload = payload

            # 6. Call route (await if async)
            if inspect.iscoroutinefunction(func):
                return await func(*args, **kwargs)
            else:
                return func(*args, **kwargs)

        return wrapped

    return decorator if f is None else decorator(f)
