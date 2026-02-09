import sys
from workers.couchdb.sync_worker import run_worker_loop
from workers.logger import get_workers_logger
logger = get_workers_logger(__name__)


if __name__ == "__main__":
    try:
        run_worker_loop()
    except KeyboardInterrupt:
        logger.info("👋 CouchDB Sync Worker stopped manually")
        sys.exit(0)
