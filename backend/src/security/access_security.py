from __future__ import annotations
from functools import wraps
from typing import Optional
from flask import request, g
from werkzeug.exceptions import Unauthorized, Forbidden
from backend.src.models.auth import User, UserPermission, UserRole


def currentUserId():
    return g.current_user.get("id") if g.get("current_user") else None


# Decorator to protect routes (uses JWT access token)
def require_auth(f=None, *, roles_names: Optional[list[str]] = None, permissions_names: Optional[list[str]] = None):
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
            user: User = (User.query.filter(
                User.id==user_id, 
                User.username==username
            ).first())
            if not user:
                raise Unauthorized("[REQUIRE_AUTH] User not found")

            if hasattr(user, "is_active") and not user.is_active:
                raise Forbidden("[REQUIRE_AUTH] User account is disabled")

            # 5. Role / permission validation
            if roles_names or permissions_names: 
                # permissions_names
                mainRoles:list[UserRole] = user.roles or []

                if roles_names:
                    user_roles:set[str] = set([r.name for r in mainRoles if r.name])
                    required_roles = [role for role in roles_names]
                    if user_roles.isdisjoint(required_roles):
                        raise Forbidden("[REQUIRE_AUTH] Insufficient permissions")
                    
                if permissions_names:
                    mainPermissions:list[str] = []
                    for rp in mainRoles:
                        permissions:list[UserPermission] = rp.permissions
                        for p in permissions:
                            mainPermissions.append(p.name)

                    user_permissions:set[str] = set(mainPermissions)
                    required_permissions = [perm for perm in permissions_names]

                    if user_permissions.isdisjoint(required_permissions):
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



# def require_auth(f=None, *, roles_names=None, permissions_names=None):

#     def decorator(func):

#         @wraps(func)
#         def wrapped(*args, **kwargs):

#             auth = request.headers.get("Authorization")

#             if not auth or not auth.startswith("Bearer "):
#                 raise Unauthorized("Missing token")

#             token = auth.split(" ", 1)[1]

#             try:
#                 payload = User.decode(token)
#             except Exception:
#                 raise Unauthorized("Invalid token")

#             if not payload.get("id"):
#                 raise Unauthorized("Invalid token payload")

#             roles = set(payload.get("roles", []))
#             permissions = set(payload.get("permissions", []))

#             if roles_names and roles.isdisjoint(roles_names):
#                 raise Forbidden("Missing role")

#             if permissions_names and permissions.isdisjoint(permissions_names):
#                 raise Forbidden("Missing permission")

#             g.current_user = payload

#             return func(*args, **kwargs)

#         return wrapped

#     return decorator if f is None else decorator(f)