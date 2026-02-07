# workers/couchdb/sync_worker.py
import sys
import time
import signal
import threading
from sqlalchemy.orm import Session

from backend.src.server import create_flask_app
from backend.src.database.extensions import db
from backend.src.models.couchdb import CibleDatabase, CouchdbSource
from backend.src.models.worker_control import WorkerControl

from workers.couchdb.sync_manager import start_async_single_source
from workers.logger import get_workers_logger

logger = get_workers_logger(__name__)

# ------------------------
# Stop event thread-safe
# ------------------------
stop_event = threading.Event()
STOP = False

# ------------------------
# Signal handler
# ------------------------
def handle_signal(signum, frame):
    global STOP
    # logger.info(f"🛑 Signal {signum} reçu, arrêt du worker…")
    STOP = True
    stop_event.set()  # juste lever le flag

signal.signal(signal.SIGINT, handle_signal)
signal.signal(signal.SIGTERM, handle_signal)

WORKER_CONTROL_NAME = "couchdb_worker"

# ------------------------
# Vérification table de contrôle
# ------------------------
def check_control_table(session: Session) -> bool:
    """Retourne True si le worker doit s'arrêter via la DB"""
    control = session.query(WorkerControl).filter_by(name=WORKER_CONTROL_NAME).first()
    if control and control.status.lower() == "stop":
        global STOP
        STOP = True
        logger.info("🛑 Worker stopped via WorkerControl table")
        return True
    return False

def is_worker_paused(session) -> bool:
    control = session.query(WorkerControl).filter_by(name=WORKER_CONTROL_NAME).first()
    if not control:
        control = WorkerControl(name=WORKER_CONTROL_NAME, status="run")
        session.add(control)
        session.commit()
    return control.status == "stop"


# ------------------------
# Worker loop principal
# ------------------------
def run_workers_logger_loop(poll_interval: int = 5):
    app = create_flask_app(create_default_elements = False)

    with app.app_context():
        # db.create_all()  # creates WorkerControl and other tables

        logger.info("🚀 CouchDB Sync Worker started")

        while not stop_event.is_set() and not STOP:
            try:
                with Session(db.engine) as session:
                    # check_control_table(session)
                    if is_worker_paused(session) or STOP:
                        logger.info("⏸ Worker paused (STOP=True)")
                        time.sleep(poll_interval)
                        continue  # ⬅️ PAS DE EXIT

                    CibleDatabase.ensure_default_couchdb_dbs()

                    # Récupère les sources actives
                    sources:list[CouchdbSource] = CouchdbSource.sources_list()

                if not sources:
                    logger.debug("⏸️ Aucune source active à synchroniser")
                    time.sleep(poll_interval)
                    continue

                # Sync des sources
                for source in sources:
                    logger.debug("Aucune source active à synchroniser")
                    if stop_event.is_set() or is_worker_paused(session):
                        logger.info("⏸ Pause detected during iteration")
                        break

                    logger.info(f"\n🔄 Sync source={source.id} ({source.name})")
                    start_async_single_source(source.id)

            except Exception:
                logger.exception("🔥 Worker loop error")

            time.sleep(poll_interval)

    logger.info("👋 CouchDB Sync Worker stopped")

# ------------------------
# Entrée principale
# ------------------------
if __name__ == "__main__":
    try:
        run_workers_logger_loop()
    except KeyboardInterrupt:
        logger.info("👋 CouchDB Sync Worker stopped manually")
        sys.exit(0)
