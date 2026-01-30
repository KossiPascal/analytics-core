from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import decode_token

from models.auth import User
from config import Config


def auth_required():
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            data = request.get_json(silent=True) or {}
            user_id = data.get("userId")
            privileges = data.get("privileges")

            not_authenticated = {
                "status": 500,
                "action": "logout",
                "data": "Vous n'êtes pas authentifié!"
            }

            no_permission = {
                "status": 500,
                "action": "logout",
                "data": "Vous n'avez pas les permissions nécessaires"
            }

            if privileges is True:
                return fn(*args, **kwargs)

            auth_header = request.headers.get("Authorization")
            if not auth_header or not user_id:
                return jsonify(not_authenticated), 500

            token = auth_header.replace("Bearer ", "").strip()
            if not token:
                return jsonify(not_authenticated), 500

            user = User.query.filter_by(id=user_id)

            if not user:
                return jsonify(no_permission), 500

            try:
                decode_token(token)
            except Exception:
                return jsonify(not_authenticated), 500

            return fn(*args, **kwargs)

        return wrapper
    return decorator
