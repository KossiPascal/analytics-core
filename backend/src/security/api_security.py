from functools import wraps
from flask import request, jsonify, redirect

from backend.src.config import Config
from backend.src.models.api_token import ApiToken


BASE_API = "/api"
PUBLIC_ROUTES = ["/documentations", "/vaccine"]
UNSECURE_PATHS = {"/documentations", "/api/documentations"}


def build_PUBLIC_DIRs():
    paths = set()
    for route in PUBLIC_ROUTES:
        paths |= {
            route,
            f"{BASE_API}{route}",
            f"{route}.json",
            f"{BASE_API}{route}.json",
            f"{route}.csv",
            f"{BASE_API}{route}.csv",
        }
    return paths


VALID_PATHS = build_PUBLIC_DIRs()


def api_security():
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):

            if request.method != "GET":
                return jsonify(error="Method Not Allowed"), 405

            if Config.IS_SECURE_HOST and not request.is_secure:
                return redirect(request.url.replace("http://", "https://"))

            path = request.path.rstrip("/")
            if path not in VALID_PATHS:
                return jsonify(error="Endpoint not allowed"), 404

            if path not in UNSECURE_PATHS:
                api_key = (
                    request.args.get("api_access_key")
                    or (request.json or {}).get("api_access_key")
                )

                if not api_key:
                    return jsonify(error="api_access_key is required"), 401

                tokens = ApiToken.query.filter_by(is_active=True)
                allowed = [t.token for t in tokens]

                if api_key not in allowed:
                    return jsonify(error="Unauthorized"), 401

            return fn(*args, **kwargs)

        return wrapper
    return decorator
