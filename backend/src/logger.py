import logging
from shared_libs.helpers.logger import logger_maker


def get_backend_logger(name: str) -> logging.Logger:

    return logger_maker("backend", name)



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