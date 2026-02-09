import logging
from shared_libs.helpers.logger import logger_maker


def get_workers_logger(name: str) -> logging.Logger:
    return logger_maker("ai", name)