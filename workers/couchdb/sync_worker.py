import asyncio
import random
import re
import sys
import time
import threading
from datetime import datetime, timezone
from typing import Any, Type, List, Dict, Optional
from functools import wraps
from concurrent.futures import ThreadPoolExecutor, as_completed

from flask import Flask
from sqlalchemy import delete, literal_column
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.dialects.postgresql import insert as pg_insert
from aiohttp import ClientSession, ClientTimeout, BasicAuth, ClientError

from backend.src.config import Config
from backend.src.database.extensions import db
from backend.src.models.couchdb import CibleDatabase, CouchdbSource
from backend.src.models.worker_control import WorkerControl
from backend.src.server import create_flask_app
from shared_libs.helpers.utils import sanitize_doc
from workers.couchdb.models import CreateTableModel
from workers.logger import get_workers_logger

logger = get_workers_logger(__name__)

MAX_WORKERS = 4
CHUNK_SIZE = 1000
DEFAULT_LIMIT = 2000
SYNC_IDLE_SLEEP = 3
ERROR_RETRY_BASE = 5
MAX_RETRIES = 3

EXCLUDED_PATTERNS = [
    r"^target~.*~org\.couchdb\.user",
    r"^settings",
    r"^service-worker-meta",
    r"^resources",
    r"^privacy-policies",
    r"^partners",
    r"^migration-log",
    r"^form:",
    r"^_design",
    r"^extension-libs",
    r"^messages-"
]

STOP_EVENT = threading.Event()
WORKER_CONTROL_NAME = "couchdb_worker"
SOURCE_LOCKS = {}  # Verrouillage par source_id


# -------------------------------
# Decorator Flask app context
# -------------------------------
def with_app_context(func):
    """Wrap function in Flask app context to safely use db.session and extensions."""
    @wraps(func)
    def wrapper(*args, **kwargs):
        app: Flask = kwargs.get("app")
        if not app:
            raise ValueError("Flask app must be passed as keyword arg 'app'")
        with app.app_context():
            return func(*args, **kwargs)
    return wrapper


# -------------------------------
# UPSERT / DELETE thread-safe
# -------------------------------
@with_app_context
def _upsert_chunk(DataModel: Type[Any], chunk: List[dict], source_name: str, app=None) -> tuple[int, int]:
    created, updated = 0, 0
    with Session(db.engine) as session:
        try:
            insert_stmt = pg_insert(DataModel).values(chunk)
            update_stmt = {c.name: getattr(insert_stmt.excluded, c.name)
                           for c in DataModel.__table__.columns if c.name != "id"}
            stmt = insert_stmt.on_conflict_do_update(
                index_elements=["id"],
                set_=update_stmt
            ).returning(literal_column("xmax = 0").label("inserted"))

            result = session.execute(stmt)
            session.flush()
            for row in result:
                if row.inserted:
                    created += 1
                else:
                    updated += 1
            session.commit()
        except SQLAlchemyError as e:
            session.rollback()
            logger.error(f"[UPSERT BULK] Failed on source={source_name}: {e}", extra={"source": source_name})
    return created, updated


@with_app_context
def _delete_chunk(DataModel: Type[Any], chunk: List[str], source_name: str, app=None) -> int:
    deleted = 0
    with Session(db.engine) as session:
        try:
            stmt = delete(DataModel).where(DataModel.id.in_(chunk))
            result = session.execute(stmt)
            session.flush()
            deleted += result.rowcount
            session.commit()
        except SQLAlchemyError as e:
            session.rollback()
            logger.error(f"[DELETE BULK] Failed on source={source_name}: {e}", extra={"source": source_name})
    return deleted


@with_app_context
def bulk_apply_changes(source_name: str, DataModel: Type[Any], rows_upsert: List[dict], ids_delete: List[str], app=None) -> tuple[int, int, int]:
    """Apply bulk upsert/delete concurrently."""
    created, updated, deleted = 0, 0, 0

    upsert_chunks = [rows_upsert[i:i + CHUNK_SIZE] for i in range(0, len(rows_upsert), CHUNK_SIZE)]
    delete_chunks = [ids_delete[i:i + CHUNK_SIZE] for i in range(0, len(ids_delete), CHUNK_SIZE)]

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures_upsert = [executor.submit(_upsert_chunk, DataModel, chunk, source_name, app=app) for chunk in upsert_chunks]
        for fut in as_completed(futures_upsert):
            try:
                c, u = fut.result()
                created += c
                updated += u
            except Exception as e:
                logger.error(f"[bulk_upsert_thread] exception: {e}", extra={"source": source_name})

        futures_delete = [executor.submit(_delete_chunk, DataModel, chunk, source_name, app=app) for chunk in delete_chunks]
        for fut in as_completed(futures_delete):
            try:
                deleted += fut.result()
            except Exception as e:
                logger.error(f"[bulk_delete_thread] exception: {e}", extra={"source": source_name})

    return created, updated, deleted


# -------------------------------
# FETCH CHANGES
# -------------------------------
async def fetch_changes(client: ClientSession, base_url: str, host_db: str, last_seq: str, auth: tuple) -> dict:
    url = f"{base_url}/{host_db}/_changes"
    params = {
        "since": last_seq or "0",
        "include_docs": "true",
        "limit": DEFAULT_LIMIT,
        "style": "all_docs",
        "feed": "longpoll",
        "timeout": Config.TIMEOUT
    }
    username, password = auth
    async with client.get(url, params=params, auth=BasicAuth(username, password)) as resp:
        resp.raise_for_status()
        return await resp.json()


# -------------------------------
# SYNC SINGLE DB
# -------------------------------
async def sync_db_once(app: Flask, source: dict, cible: CibleDatabase, DataModel: Type[Any], SyncStateModel: Type[Any], SyncStatusModel: Type[Any]) -> dict:
    """Sync CouchDB → Postgres pour une DB, async & thread-safe."""
    created = updated = deleted = 0

    source_id = source["id"]
    source_name = source["name"]

    lock_key = f"{source_id}_{cible.id}"
    lock = SOURCE_LOCKS.setdefault(lock_key, threading.Lock())
    if not lock.acquire(blocking=False):
        logger.warning(f"[source={source_id} | cible={cible.id}] Sync already running, skipping...")
        # return {"cible": cible.local_name, "status": "skipped"}
        return created + updated + deleted
    
    try:
        with app.app_context():
            # --- Load last_seq and create RUNNING log ---
            with Session(db.engine) as session:
                sync_state = session.query(SyncStateModel).filter_by(source_id=source["id"], cible_id=cible.id).first()
                if not sync_state:
                    sync_state = SyncStateModel(source_id=source["id"], cible_id=cible.id, last_seq="0")
                    session.add(sync_state)
                    session.commit()
                    last_seq = "0"
                else:
                    last_seq = sync_state.last_seq or "0"

                sync_status = SyncStatusModel(source_id=source["id"], cible_id=cible.id, status="RUNNING", started_at=datetime.now(timezone.utc))
                session.add(sync_status)
                session.commit()

        retry_count = 0
        while retry_count < MAX_RETRIES:
            try:
                async with ClientSession(timeout=ClientTimeout(total=Config.TIMEOUT)) as client:
                    payload = await fetch_changes(client, source["base_url"], cible.host_name, last_seq, source["auth"])
                break
            except (ClientError, asyncio.TimeoutError) as e:
                retry_count += 1
                wait = ERROR_RETRY_BASE * (2 ** (retry_count - 1)) + random.uniform(0, 1)
                logger.warning(f"[source={source_id}:{cible.local_name}] network error, retry {retry_count}/{MAX_RETRIES} in {wait:.1f}s: {e}")
                await asyncio.sleep(wait)
        else:
            raise RuntimeError("Max retries exceeded")

        results = payload.get("results", [])
        rows_upsert, ids_delete = [], []

        for item in results:
            doc_id = item.get("id")
            doc = item.get("doc") or {}
            isExcluded = any(re.match(p, doc_id) for p in EXCLUDED_PATTERNS)
            isTombstone = doc.get("type") == "tombstone" or doc.get("tombstone")

            if item.get("deleted") or doc.get("_deleted") or isExcluded or isTombstone:
                ids_delete.append(doc_id)
            else:
                rows_upsert.append({
                    "id": doc_id,
                    "doc": sanitize_doc(doc),
                    "form": doc.get("form"),
                    "type": doc.get("type"),
                    "source_id": source["id"],
                    "cible_id": cible.id,
                    "reported_date": doc.get("reported_date"),
                })

        created, updated, deleted = bulk_apply_changes(source_name, DataModel, rows_upsert, ids_delete, app=app)

        if created or updated or deleted:
            logger.info(f"{source_name.upper()} → CREATED: {created}, UPDATED: {updated}, DELETED: {deleted}", extra={"source": source_name})
        else:
            logger.debug(f"{source_name} → no changes", extra={"source": source_name})

        # --- Update last_seq and SUCCESS log ---
        with app.app_context():
            with Session(db.engine) as session:
                sync_state = session.query(SyncStateModel).filter_by(source_id=source["id"], cible_id=cible.id).first()
                if sync_state:
                    sync_state.last_seq = payload.get("last_seq", last_seq)
                    sync_state.last_sync_at = datetime.now(timezone.utc)

                session.add(SyncStatusModel(
                    source_id=source["id"], cible_id=cible.id,
                    status="SUCCESS",
                    message=f"CREATED({created}) UPDATED({updated}) DELETED({deleted})",
                    started_at=datetime.now(timezone.utc),
                    finished_at=datetime.now(timezone.utc)
                ))
                session.commit()

        if not results:
            await asyncio.sleep(SYNC_IDLE_SLEEP)

        # return {"cible": cible.local_name, "status": "success"}
        return created + updated + deleted

    except (ClientError, asyncio.TimeoutError) as e:
        with app.app_context():
            with Session(db.engine) as session:
                session.add(SyncStatusModel(
                    source_id=source["id"], 
                    cible_id=cible.id,
                    status="ERROR", 
                    message=str(e),
                    started_at=datetime.now(timezone.utc), 
                    finished_at=datetime.now(timezone.utc)
                ))
                session.commit()
        logger.warning(f"[source={source['id']}:{cible.local_name}] network error → retry", extra={"source": source["id"], "cible": cible.local_name})
        await asyncio.sleep(ERROR_RETRY_BASE + random.uniform(0, 2))
        # return {"cible": cible.local_name, "status": "error", "error": str(e)}
        return created + updated + deleted

    except Exception as e:
        with app.app_context():
            with Session(db.engine) as session:
                session.add(SyncStatusModel(
                    source_id=source["id"], 
                    cible_id=cible.id,
                    status="ERROR", 
                    message=str(e),
                    started_at=datetime.now(timezone.utc), 
                    finished_at=datetime.now(timezone.utc)
                ))
                session.commit()
        logger.error(f"[source={source['id']}:{cible.local_name}] unexpected error: {str(e)}", extra={"source": source["id"], "cible": cible.local_name})
        # return {"cible": cible.local_name, "status": "error", "error": str(e)}
        return created + updated + deleted
    
    finally:
        lock.release()

# -------------------------------
# SYNC SINGLE SOURCE
# -------------------------------
@with_app_context
def start_async_single_source(source_id: int, app: Flask = None) -> dict:
    """Sync CouchDB → Postgres pour une source complète, async & thread-safe."""
    with Session(db.engine) as session:
        source = session.get(CouchdbSource, source_id)
        if not source or not source.is_active:
            logger.warning(f"[SYNC] Source {source_id} inactive", extra={"source": source_id})
            # return {"status": "skipped", "reason": "inactive"}
            return None

        source_data = {
            "id": source.id,
            "name": source.name,
            "base_url": source.base_url,
            "auth": source.auth
        }

    try:
        ModelMgr = CreateTableModel(db, project_name=source_data["name"])
        CibleDbList = CibleDatabase.couchdb_names()
        SyncStateModel, _ = ModelMgr.create_sync_states_table()
        SyncStatusModel, _ = ModelMgr.create_sync_status_table()

        async def runner():
            tasks = []
            for cible in CibleDbList:
                DataModel, _ = ModelMgr.create_source_table(cible.local_name)
                tasks.append(sync_db_once(app, source_data, cible, DataModel, SyncStateModel, SyncStatusModel))
            return await asyncio.gather(*tasks, return_exceptions=True)

        results = asyncio.run(runner())

        # --- Update last_sync safely ---
        with Session(db.engine) as session:
            s = session.get(CouchdbSource, source_id)
            s.last_used_at = datetime.now(timezone.utc)
            s.last_sync = datetime.now(timezone.utc)
            session.commit()

        # return {"status": "success", "synced_dbs": len(CibleDbList), "details": results}
        return results

    except Exception as e:
        logger.error(f"[SYNC] Fatal error source={source_id}: {str(e)}", extra={"source": source_id})
        # return {"status": "error", "message": str(e)}
        return None



def is_worker_paused(session: Session) -> bool:
    control = session.query(WorkerControl).filter_by(name=WORKER_CONTROL_NAME).first()
    if not control:
        control = WorkerControl(name=WORKER_CONTROL_NAME, status="run")
        session.add(control)
        session.commit()
    return control.status.lower() == "stop"
# -------------------------------
# CouchDB Worker encapsulé
# -------------------------------
def run_workers_logger_loop(poll_interval: int = 5):
    app = create_flask_app(create_default_elements=False)
    with app.app_context():
        logger.info("🚀 CouchDB Sync Worker started")
        while not STOP_EVENT.is_set():
            try:
                with Session(db.engine) as session:
                    if is_worker_paused(session):
                        logger.info("⏸ Worker paused", extra={"worker": WORKER_CONTROL_NAME})
                        time.sleep(poll_interval)
                        continue

                    source_ids = [s.id for s in session.query(CouchdbSource.id).filter_by(is_active=True).all()]

                if not source_ids:
                    logger.debug("⏸️ No active sources", extra={"worker": WORKER_CONTROL_NAME})
                    time.sleep(poll_interval)
                    continue

                for source_id in source_ids:
                    if STOP_EVENT.is_set():
                        break
                    # logger.info(f"\n🔄 Sync source_id={source_id}", extra={"source": source_id})
                    results = start_async_single_source(source_id, app=app)
                    # # logger.info(results, extra={"source": source_id})
                    # if results and isinstance(results, list):
                    #     found = 0
                    #     for r in results:
                    #         found += r
                    #     if found > 0:
                    #         print(f"\n")

                    

            except Exception as e:
                logger.error(f"🔥 Worker loop error: {str(e)}", extra={"worker": WORKER_CONTROL_NAME})

            time.sleep(poll_interval)

        logger.info("👋 CouchDB Sync Worker stopped")

def stop_workers_logger_loop():
    STOP_EVENT.set()


# -------------------------------
# Entrée principale
# -------------------------------
if __name__ == "__main__":
    
    try:
        run_workers_logger_loop()
    except KeyboardInterrupt:
        stop_workers_logger_loop()
        logger.info("👋 CouchDB Sync Worker stopped manually")
        sys.exit(0)
