from functools import wraps
from flask import request, jsonify

from backend.src.app.models.b_user import User
# from providers.authorizations_pages import role_authorizations


def require_permission(permission: str):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            data = request.get_json(silent=True) or {}
            user_id = data.get("userId")

            # if not user_id:
            #     return jsonify(status=400, data="Aucun utilisateur sélectionné"), 400

            # user_repo = get_users_repository()
            # user = user_repo.find_one(id=user_id)

            # if not user or not user.is_active or user.deleted:
            #     return jsonify(status=403, data="Utilisateur non autorisé ou inactif"), 403

            # token = user_token_generated(user)
            # if not token:
            #     return jsonify(status=401, data="Non autorisé"), 401

            # role = role_authorizations(token.authorizations or [], token.routes or [])

            # if not getattr(role, permission, False):
            #     return jsonify(status=403, data="Accès refusé"), 403

            return fn(*args, **kwargs)

        return wrapper
    return decorator
