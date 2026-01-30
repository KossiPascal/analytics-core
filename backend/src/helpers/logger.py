import os
import json
import logging
from logging.handlers import RotatingFileHandler
from flask import g, request, has_request_context
from datetime import datetime

# =============================
# Configuration SAFE
# =============================

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
LOG_BASE_DIR = os.getenv("LOG_DIR", "logs")  # RELATIF par défaut
LOG_FILENAME = os.getenv("LOG_FILE", "backend.log")

MAX_SIZE = 5 * 1024 * 1024
BACKUP_COUNT = 3

# =============================
# Utils
# =============================

def _safe_mkdir(path: str) -> bool:
    try:
        os.makedirs(path, exist_ok=True)
        return True
    except PermissionError:
        return False

def _resolve_log_path() -> str | None:
    """
    Résout le chemin du log sans jamais lever d'exception
    """
    try:
        base_dir = os.path.abspath(LOG_BASE_DIR)
        if not _safe_mkdir(base_dir):
            return None
        return os.path.join(base_dir, LOG_FILENAME)
    except Exception:
        return None

def _get_context():
    if not has_request_context():
        return {
            "user_id": "-",
            "username": "-",
            "ip": "-",
            "method": "-",
            "path": "-"
        }

    user = g.get("current_user") or {}
    return {
        "user_id": user.get("id", "-"),
        "username": user.get("username", "-"),
        "ip": request.headers.get("X-Forwarded-For", request.remote_addr),
        "method": request.method,
        "path": request.path,
    }

# =============================
# Formatter
# =============================

class ContextFormatter(logging.Formatter):
    def format(self, record):
        ctx = _get_context()
        for k, v in ctx.items():
            setattr(record, k, getattr(record, k, v))
        return super().format(record)

# =============================
# Logger factory
# =============================

def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)

    # if getattr(logger, "_configured", False):
    #     return logger

    # logger.setLevel(LOG_LEVEL)
    # logger.propagate = False

    # formatter = ContextFormatter(
    #     "%(asctime)s [%(levelname)s] %(name)s "
    #     "[user=%(username)s id=%(user_id)s ip=%(ip)s] "
    #     "%(method)s %(path)s - %(message)s"
    # )

    # # -------- FILE HANDLER (SAFE) --------
    # log_path = _resolve_log_path()
    # if log_path:
    #     try:
    #         fh = RotatingFileHandler(
    #             log_path,
    #             maxBytes=MAX_SIZE,
    #             backupCount=BACKUP_COUNT,
    #             encoding="utf-8"
    #         )
    #         fh.setLevel(LOG_LEVEL)
    #         fh.setFormatter(formatter)
    #         logger.addHandler(fh)
    #     except Exception:
    #         pass  # fallback console only

    # # -------- CONSOLE HANDLER --------
    # ch = logging.StreamHandler()
    # ch.setLevel(LOG_LEVEL)
    # ch.setFormatter(formatter)
    # logger.addHandler(ch)

    # logger._configured = True
    return logger

# =============================
# Audit helper
# =============================

def audit_log(action: str, details: dict | None = None, level="INFO"):
    # logger = get_logger("audit")
    # try:
    #     payload = json.dumps(details or {}, ensure_ascii=False)
    # except Exception:
    #     payload = "{}"

    # logger.log(
    #     getattr(logging, level.upper(), logging.INFO),
    #     f"action={action} details={payload}"
    # )
    pass