from __future__ import annotations
from functools import wraps
from typing import Optional, Callable, Awaitable
from flask import request, g
from werkzeug.exceptions import Unauthorized, Forbidden
from backend.src.models.auth import User
import inspect

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
                raise Unauthorized(f"[REQUIRE_AUTH] Authorization header missing: {auth_header} | {request.headers}")

            scheme, _, token = auth_header.partition(" ")
            if scheme.lower() != "bearer" or not token:
                raise Unauthorized("[REQUIRE_AUTH] Invalid Authorization header format")
            
             # 2. Decode token (JWT / serializer abstraction)
            token = token or auth_header.split(" ", 1)[1]
            if not token:
                raise Unauthorized("[REQUIRE_AUTH] Invalid or expired access token")
            
            try:
                payload = User.decode(token)
            except Exception as e:
                # Do NOT leak decoding errors
                raise Unauthorized(f"[REQUIRE_AUTH] Error on loading payload: {str(e)}")

            username = payload.get("username")
            user_id = payload.get("id")

            if not username or not user_id:
                raise Unauthorized("[REQUIRE_AUTH] Invalid token payload")

            # 4. Validate user exists & is active
            user: User | None = (User.query.filter_by(id=user_id, username=username).first())
            if not user:
                raise Unauthorized("[REQUIRE_AUTH] User not found")

            if hasattr(user, "is_active") and not user.is_active:
                raise Forbidden("[REQUIRE_AUTH] User account is disabled")

            # 5. Role / permission validation
            if roles:
                user_roles = set(user.roles or [])
                required_roles = set(roles)

                if user_roles.isdisjoint(required_roles):
                    raise Forbidden("[REQUIRE_AUTH] Insufficient permissions")

            # 6. Attach security context
            g.current_user = payload
            # g.current_user = user
            # g.current_user_payload = payload

            # g.current_user_permissions = set(payload.get("permissions", []))
            # g.current_user_roles = set(payload.get("roles", []))

            return func(*args, **kwargs)
        
        return wrapped
    
    return decorator if f is None else decorator(f)
