import threading
from functools import wraps
from flask import request, jsonify
from models.auth import User,UsersLog
from config import Config
import user_agents

EXCLUDED_PATHS = {
    "/icons", "/assets", "/ngsw.json", "/favicon.ico",
    "/index.html", "/publics", "/fa-solid-900"
}


def user_logger():
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            path = request.path.rstrip("/")
            if path in EXCLUDED_PATHS:
                return fn(*args, **kwargs)

            if request.method not in {"GET", "POST", "PUT", "DELETE"}:
                return jsonify(message="Method Not Allowed"), 405

            if Config.IS_SECURE_HOST and not request.is_secure:
                return jsonify(message="HTTPS required"), 403

            raw_user_id = (
                (request.json or {}).get("userId")
                or request.headers.get("x-user-id")
            )

            if raw_user_id:
                def log_task():
                    try:
                        user = User.query.filter_by(id=raw_user_id)
                        if not user:
                            return

                        ua = user_agents.parse(request.headers.get("User-Agent", ""))

                        UsersLog.save(
                            user=user,
                            method=request.method,
                            url=request.url,
                            user_agent=request.headers.get("User-Agent"),
                            client_ip=request.remote_addr,
                            referer=request.headers.get("Referer", ""),
                            accept_language=request.headers.get("Accept-Language", ""),
                            browser=str(ua.browser),
                            os=str(ua.os),
                            device=str(ua.device),
                        )
                    except Exception:
                        pass

                threading.Thread(target=log_task, daemon=True).start()

            return fn(*args, **kwargs)

        return wrapper
    return decorator
