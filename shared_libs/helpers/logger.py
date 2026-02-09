# src/logger/logger.py
import logging
import os
from pathlib import Path
from logging.handlers import RotatingFileHandler, TimedRotatingFileHandler
import gzip
import shutil
import glob
from datetime import datetime, timezone
from threading import Lock

# -------------------------
# Thread-safe compression lock
# -------------------------
_compress_lock = Lock()


class CompressedTimedRotatingFileHandler(TimedRotatingFileHandler):
    """ TimedRotatingFileHandler with gzip compression. """
    def doRollover(self):
        super().doRollover()
        with _compress_lock:
            for old_log in self.getFilesToDelete():
                if not old_log.endswith(".gz"):
                    try:
                        with open(old_log, "rb") as f_in, gzip.open(
                            f"{old_log}.gz", "wb"
                        ) as f_out:
                            shutil.copyfileobj(f_in, f_out)
                        os.remove(old_log)
                    except Exception:
                        pass


def _compress_old_logs(log_file: Path):
    """
    Compress old rotated logs (.1, .2...) automatically.
    """
    with _compress_lock:
        for f in glob.glob(f"{log_file}.*"):
            f_path = Path(f)
            if f_path.suffix != ".gz":
                try:
                    with open(f_path, 'rb') as fin, gzip.open(f"{f}.gz", 'wb') as fout:
                        shutil.copyfileobj(fin, fout)
                    f_path.unlink()
                except Exception:
                    # Avoid crash if compression fails
                    pass


def logger_maker(folder: str, name: str) -> logging.Logger:
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
    LOG_TO_CONSOLE = os.getenv("LOG_TO_CONSOLE", "true").lower() == "true"

    base_dir = Path(os.getenv("LOG_DIR", Path.cwd() / "logs"))

    log_dir = base_dir / folder
    log_dir.mkdir(parents=True, exist_ok=True)

    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, LOG_LEVEL, logging.INFO))
    logger.propagate = False

    # Prevent duplicate handlers
    if any(isinstance(h, TimedRotatingFileHandler) for h in logger.handlers):
        return logger

    formatter = logging.Formatter(
        # "%(asctime)s [%(levelname)s] %(process)d %(name)s | %(message)s",
        "%(message)s",
        "%Y-%m-%dT%H:%M:%SZ",
    )

    # -------- File handler --------
    file_handler = CompressedTimedRotatingFileHandler(
        filename=str(log_dir / f"{name}.log"),
        when="midnight",
        backupCount=14,
        encoding="utf-8",
        utc=True,
    )
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

    # -------- Console (optional) --------
    if LOG_TO_CONSOLE:
        console = logging.StreamHandler()
        console.setFormatter(formatter)
        logger.addHandler(console)

    return logger


def full_logger_maker(folder: str,name: str,log_level: str = None,max_bytes: int = 50 * 1024 * 1024,backup_count: int = 14,when: str = "midnight",interval: int = 1) -> logging.Logger:
    """
    Senior-grade logger for Dockerized services with:
    - Rotation by size and time
    - 14 backups
    - Compression
    - Stream to stdout
    - Configurable log level
    """

    # -------------------------
    # Paths
    # -------------------------
    base_dir = Path(os.getenv("LOG_DIR", Path.cwd() / "logs"))

    log_dir = base_dir / folder
    # log_dir = Path(os.getenv("COUSTOM_LOG_DIR", f"/logs/{folder}"))

    log_dir.mkdir(parents=True, exist_ok=True)
    log_file = log_dir / f"{name}.log"

    # -------------------------
    # Logger instance
    # -------------------------
    logger = logging.getLogger(name)
    logger.propagate = False
    if logger.hasHandlers():
        return logger

    # -----------------------
    # Log level
    # -------------------------
    level = log_level or os.getenv("COUSTOM_LOG_LEVEL", "INFO").upper()
    logger.setLevel(getattr(logging, level, logging.INFO))

    # -------------------------
    # File Handler: Size-based + Time-based
    # -------------------------
    # Use TimedRotatingFileHandler for daily rotation
    time_handler = TimedRotatingFileHandler(
        filename=str(log_file),
        when=when,
        interval=interval,
        backupCount=backup_count,
        encoding="utf-8",
        utc=True,
    )
    # Wrap with size limit
    size_handler = RotatingFileHandler(
        filename=str(log_file),
        maxBytes=max_bytes,
        backupCount=backup_count,
        encoding="utf-8"
    )

    # -------------------------
    # Formatter
    # -------------------------
    formatter = logging.Formatter(
        # fmt="%(asctime)s [%(levelname)s] %(name)s | %(message)s",
        fmt="%(message)s",
        datefmt="%Y-%m-%dT%H:%M:%SZ"
    )
    time_handler.setFormatter(formatter)
    size_handler.setFormatter(formatter)

    # -------------------------
    # Stream Handler for Docker stdout
    # -------------------------
    stream_handler = logging.StreamHandler()
    stream_handler.setFormatter(formatter)

    # -------------------------
    # Add handlers
    # -------------------------
    logger.addHandler(time_handler)
    logger.addHandler(size_handler)
    logger.addHandler(stream_handler)

    # -------------------------
    # Attach compress function
    # -------------------------
    logger.compress_old_logs = lambda: _compress_old_logs(log_file)

    # -------------------------
    # Optional hook for critical errors
    # Example: send Slack/Email if level >= ERROR
    # -------------------------
    def critical_hook(record):
        if record.levelno >= logging.ERROR:
            # Placeholder: send alert
            # send_alert(record.getMessage())
            pass

    logger.addFilter(lambda record: critical_hook(record) or True)



    LOG_TO_CONSOLE = os.getenv("LOG_TO_CONSOLE", "true").lower() == "true"

    # -------------------
    # Console handler (OPTIONAL)
    # -------------------
    if LOG_TO_CONSOLE:
        console = logging.StreamHandler()
        console.setFormatter(formatter)
        logger.addHandler(console)

    return logger
















# # src/logger/logger.py
# import logging
# import os
# from pathlib import Path
# from logging.handlers import TimedRotatingFileHandler, RotatingFileHandler
# import gzip
# import shutil
# import glob
# from datetime import datetime, timezone



# def logger_maker(folder:str, name: str) -> logging.Logger:
#     """
#     Create a senior-grade logger for Dockerized services.
    
#     Features:
#     - Logs go to LOG_DIR/<name>.log
#     - Daily rotation
#     - Max file size limit (50MB)
#     - Keep 14 backups
#     - Compress old log files automatically
#     - Output to stdout for Docker logs
#     """

#     log_dir = Path(f"/analytics-code/logs/{folder}")
#     log_dir.mkdir(parents=True, exist_ok=True)
    
#     log_file = log_dir / f"{name}.log"

#     logger = logging.getLogger(name)
#     logger.setLevel(logging.INFO)
#     logger.propagate = False  # Avoid duplicate logs if root logger is configured

#     # Prevent adding multiple handlers if logger already exists
#     if logger.hasHandlers():
#         return logger

#     # -------------------------
#     # File Handler: Timed + Size
#     # -------------------------
#     file_handler = TimedRotatingFileHandler(
#         filename=str(log_file),
#         when="midnight",
#         interval=1,
#         backupCount=14,  # keep 14 old files
#         encoding="utf-8",
#         utc=True
#     )
#     # Limit file size
#     file_handler = RotatingFileHandler(
#         filename=str(log_file),
#         maxBytes=50 * 1024 * 1024,  # 50 MB per file
#         backupCount=14,
#         encoding="utf-8"
#     )

#     # -------------------------
#     # Formatter
#     # -------------------------
#     formatter = logging.Formatter(
#         fmt="%(asctime)s [%(levelname)s] %(name)s | %(message)s",
#         datefmt="%Y-%m-%dT%H:%M:%SZ"
#     )
#     file_handler.setFormatter(formatter)

#     # -------------------------
#     # Stream Handler (stdout)
#     # -------------------------
#     stream_handler = logging.StreamHandler()
#     stream_handler.setFormatter(formatter)

#     # -------------------------
#     # Add handlers
#     # -------------------------
#     logger.addHandler(file_handler)
#     logger.addHandler(stream_handler)

#     # -------------------------
#     # Compress old log files
#     # -------------------------
#     def compress_old_logs():
#         for f in glob.glob(f"{log_file}.*"):
#             if not f.endswith(".gz"):
#                 with open(f, 'rb') as fin, gzip.open(f"{f}.gz", 'wb') as fout:
#                     shutil.copyfileobj(fin, fout)
#                 os.remove(f)

#     # Attach to logger for manual call if needed
#     logger.compress_old_logs = compress_old_logs

#     return logger






##########################################################################################
# import os
# import json
# import logging
# from logging.handlers import RotatingFileHandler
# from flask import g, request, has_request_context
# from datetime import datetime, timezone

# # =============================
# # Configuration SAFE
# # =============================

# LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
# LOG_BASE_DIR = os.getenv("LOG_DIR", "logs")  # RELATIF par défaut
# LOG_FILENAME = os.getenv("LOG_FILE", "backend.log")

# MAX_SIZE = 5 * 1024 * 1024
# BACKUP_COUNT = 3

# # =============================
# # Utils
# # =============================

# def _safe_mkdir(path: str) -> bool:
#     try:
#         os.makedirs(path, exist_ok=True)
#         return True
#     except PermissionError:
#         return False

# def _resolve_log_path() -> str | None:
#     """
#     Résout le chemin du log sans jamais lever d'exception
#     """
#     try:
#         base_dir = os.path.abspath(LOG_BASE_DIR)
#         if not _safe_mkdir(base_dir):
#             return None
#         return os.path.join(base_dir, LOG_FILENAME)
#     except Exception:
#         return None

# def _get_context():
#     if not has_request_context():
#         return {
#             "user_id": "-",
#             "username": "-",
#             "ip": "-",
#             "method": "-",
#             "path": "-"
#         }

#     user = g.get("current_user") or {}
#     return {
#         "user_id": user.get("id", "-"),
#         "username": user.get("username", "-"),
#         "ip": request.headers.get("X-Forwarded-For", request.remote_addr),
#         "method": request.method,
#         "path": request.path,
#     }

# # =============================
# # Formatter
# # =============================

# class ContextFormatter(logging.Formatter):
#     def format(self, record):
#         ctx = _get_context()
#         for k, v in ctx.items():
#             setattr(record, k, getattr(record, k, v))
#         return super().format(record)

# # =============================
# # Logger factory
# # =============================

# def get_logger(name: str) -> logging.Logger:
#     logger = logging.getLogger(name)

#     # if getattr(logger, "_configured", False):
#     #     return logger

#     # logger.setLevel(LOG_LEVEL)
#     # logger.propagate = False

#     # formatter = ContextFormatter(
#     #     "%(asctime)s [%(levelname)s] %(name)s "
#     #     "[user=%(username)s id=%(user_id)s ip=%(ip)s] "
#     #     "%(method)s %(path)s - %(message)s"
#     # )

#     # # -------- FILE HANDLER (SAFE) --------
#     # log_path = _resolve_log_path()
#     # if log_path:
#     #     try:
#     #         fh = RotatingFileHandler(
#     #             log_path,
#     #             maxBytes=MAX_SIZE,
#     #             backupCount=BACKUP_COUNT,
#     #             encoding="utf-8"
#     #         )
#     #         fh.setLevel(LOG_LEVEL)
#     #         fh.setFormatter(formatter)
#     #         logger.addHandler(fh)
#     #     except Exception:
#     #         pass  # fallback console only

#     # # -------- CONSOLE HANDLER --------
#     # ch = logging.StreamHandler()
#     # ch.setLevel(LOG_LEVEL)
#     # ch.setFormatter(formatter)
#     # logger.addHandler(ch)

#     # logger._configured = True
#     return logger

# # =============================
# # Audit helper
# # =============================

