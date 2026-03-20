import re
import sys
import time
import random
import asyncio
import threading
from typing import Any, Optional, Type, List
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor, as_completed

from flask import Flask
from aiohttp import ClientSession, ClientTimeout, BasicAuth, ClientError

from sqlalchemy import delete, literal_column
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.dialects.postgresql import insert as pg_insert

from backend.src.config import Config
from backend.src.databases.extensions import db
from backend.src.models.controls import WorkerControl
from backend.src.models.tenant import CHT_SOURCE_TYPES, ChtSources, Tenant, TenantSource, TargetTypes
from backend.src.server import create_flask_app

from workers.couchdb.models import CreateTableModel
from workers.couchdb.sql_migration import SQLStarter, SQLUtils
from workers.couchdb.utils import with_app_context
from workers.logger import get_workers_logger

from shared_libs.helpers.utils import sanitize_doc

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


# UPSERT / DELETE thread-safe
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

# FETCH CHANGES
async def fetch_changes(client: ClientSession, host: str, chtdb: str, last_seq: str, auth: tuple) -> dict:
    url = f"{host}/{chtdb}/_changes"
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


# SYNC SINGLE DB
async def sync_db_once(app: Flask, source: TenantSource, source_type: ChtSources, DataModel: Type[Any], SyncStateModel: Type[Any], SyncStatusModel: Type[Any]) -> int:
    """Sync CouchDB → Postgres pour une DB, async & thread-safe."""

    host:str = source.host if source else None
    source_name:str = source.name if source else None
    
    if not source or not source.is_active or not host or not source_name:
        logger.warning(f"[SYNC] Source {source_id} inactive", extra={"source": source_id})
        # return {"status": "skipped", "reason": "inactive"}
        return 0
    
    created = updated = deleted = 0

    source_id = source.id
    tenant_id = source.tenant_id
    chtdb = source_type.chtdb

    lock_key = f"{source_id}_{source_type.localdb}"
    lock = SOURCE_LOCKS.setdefault(lock_key, threading.Lock())
    if not lock.acquire(blocking=False):
        logger.warning(f"[source={source_id} | cible={chtdb}] Sync already running, skipping...")
        return created + updated + deleted
    
    try:
        with app.app_context():
            # --- Load last_seq and create RUNNING log ---
            with Session(db.engine) as session:
                sync_state = session.query(SyncStateModel).filter(
                    SyncStateModel.tenant_id==tenant_id, 
                    SyncStateModel.source_id==source_id
                ).first()

                if not sync_state:
                    sync_state = SyncStateModel(tenant_id=tenant_id, source_id=source_id, last_seq="0")
                    session.add(sync_state)
                    session.commit()
                    last_seq = "0"
                else:
                    last_seq = sync_state.last_seq or "0"

                sync_status = SyncStatusModel(
                    tenant_id=tenant_id, 
                    source_id=source_id, 
                    status="RUNNING", 
                    started_at=datetime.now(timezone.utc)
                )

                session.add(sync_status)
                session.commit()

        retry_count = 0
        while retry_count < MAX_RETRIES:
            try:
                async with ClientSession(timeout=ClientTimeout(total=Config.TIMEOUT)) as client:
                    payload = await fetch_changes(client, host, chtdb, last_seq, source.auth)
                break
            except (ClientError, asyncio.TimeoutError) as e:
                
                retry_count += 1
                wait = ERROR_RETRY_BASE * (2 ** (retry_count - 1)) + random.uniform(0, 1)
                logger.warning(f"[source={source_id}:{chtdb}] network error, retry {retry_count}/{MAX_RETRIES} in {wait:.1f}s: {e}")
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
                    "tenant_id": tenant_id,
                    "source_id": source_id,
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
                sync_state = session.query(SyncStateModel).filter(
                    SyncStateModel.tenant_id==tenant_id, 
                    SyncStateModel.source_id==source_id
                ).first()

                if sync_state:
                    sync_state.last_seq = payload.get("last_seq", last_seq)
                    sync_state.last_sync_at = datetime.now(timezone.utc)

                session.add(SyncStatusModel(
                    tenant_id=tenant_id,
                    source_id=source_id,
                    status="SUCCESS",
                    message=f"CREATED({created}) UPDATED({updated}) DELETED({deleted})",
                    started_at=datetime.now(timezone.utc),
                    finished_at=datetime.now(timezone.utc)
                ))
                session.commit()

        if not results:
            await asyncio.sleep(SYNC_IDLE_SLEEP)

        # return {"cible": cible.id, "status": "success"}
        return created + updated + deleted

    except (ClientError, asyncio.TimeoutError) as e:

        with app.app_context():
            with Session(db.engine) as session:
                session.add(SyncStatusModel(
                    tenant_id=tenant_id,
                    source_id=source_id, 
                    status="ERROR", 
                    message=str(e),
                    started_at=datetime.now(timezone.utc), 
                    finished_at=datetime.now(timezone.utc)
                ))
                session.commit()
        logger.warning(f"[source={source_id}:{chtdb}] network error → retry", extra={"source": source_id})
        await asyncio.sleep(ERROR_RETRY_BASE + random.uniform(0, 2))
        # return {"cible": cible.id, "status": "error", "error": str(e)}
        return created + updated + deleted

    except Exception as e:

        with app.app_context():
            with Session(db.engine) as session:
                session.add(SyncStatusModel(
                    tenant_id=tenant_id,
                    source_id=source_id, 
                    status="ERROR", 
                    message=str(e),
                    started_at=datetime.now(timezone.utc), 
                    finished_at=datetime.now(timezone.utc)
                ))
                session.commit()
        logger.error(f"[source={source_id}:{chtdb}] unexpected error: {str(e)}", extra={"source": source_id})
        # return {"cible": cible.id, "status": "error", "error": str(e)}
        return created + updated + deleted
    
    finally:
        lock.release()

# SYNC SINGLE SOURCE
@with_app_context
def start_async_single_source(source: TenantSource, app: Flask = None) -> dict:
    """Sync CouchDB → Postgres pour une source complète, async & thread-safe."""
    
    if not source or not source.tenant_id:
        logger.warning(f"[SYNC] Source tenant_id and source_id are required")
        return None
    
    with Session(db.engine) as session:

        # source = TenantSource.getTenantSourceQuery(session, tenant_id, source_id).first()
        
        if not source or not source.is_active or not source.host or not source.name:
            logger.warning(f"[SYNC] Source {source.id} inactive", extra={"source": source.id})
            # return {"status": "skipped", "reason": "inactive"}
            return None

        try:
            ModelMgr = CreateTableModel(db, source_name=source.name)
            SyncStateModel, _ = ModelMgr.create_sync_states_table()
            SyncStatusModel, _ = ModelMgr.create_sync_status_table()

            async def runner():
                tasks = []
                for source_type in CHT_SOURCE_TYPES:
                    DataModel, _ = ModelMgr.create_source_table(source_type.localdb)
                    syncdbonce = sync_db_once(
                        app, 
                        source, 
                        source_type, 
                        DataModel, 
                        SyncStateModel, 
                        SyncStatusModel
                    )
                    tasks.append(syncdbonce)
                return await asyncio.gather(*tasks, return_exceptions=True)

            results = asyncio.run(runner())

            # --- Update last_sync safely ---
            source.last_used_at = datetime.now(timezone.utc)
            source.last_sync = datetime.now(timezone.utc)

            session.commit()

            # return {"status": "success", "synced_dbs": len(DataSourceTypes), "details": results}
            return results

        except Exception as e:
    
            logger.error(f"[SYNC] Fatal error source={source.id}: {str(e)}", extra={"source": source.id})
            # return {"status": "error", "message": str(e)}
            return None
    return None

def is_worker_paused(session: Session) -> bool:
    control = session.query(WorkerControl).filter(
        WorkerControl.name==WORKER_CONTROL_NAME
    ).first()

    if not control:
        control = WorkerControl(name=WORKER_CONTROL_NAME, status="run")
        session.add(control)
        session.commit()
    return control.status.lower() == "stop"

# CouchDB Worker encapsulé
@with_app_context
def run_workers_logger_loop(poll_interval: int = 5, app: Flask=None):
    
    logger.info("🚀 CouchDB Sync Worker started")

    while not STOP_EVENT.is_set():
        try:
            with Session(db.engine) as session:
                if is_worker_paused(session):
                    logger.info("⏸ Worker paused", extra={"worker": WORKER_CONTROL_NAME})
                    time.sleep(poll_interval)
                    continue
                
                sources = TenantSource.getTenantSourceQuery(session=session, target=TargetTypes.COUCHDB).all()

            if not sources:
                logger.debug("⏸️ No active sources", extra={"worker": WORKER_CONTROL_NAME})
                time.sleep(poll_interval)
                continue

            for source in sources or []:
                if STOP_EVENT.is_set():
                    break
                # logger.info(f"\n🔄 Sync source_id={source.id}", extra={"source": source.id})

                results = start_async_single_source(source, app=app)
                # # logger.info(results, extra={"source": source.id})
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


# Entrée principale
if __name__ == "__main__":
    try:
        app = create_flask_app(initialize_database=False)
        run_workers_logger_loop(app=app)

        # starter = SQLStarter(source_name="kendeya", app=app)
        # starter.run("init")
        # starter.run("rebuild")

        # SQLUtils.convert_all_sql_metadata(source_name="kendeya")
        # SQLUtils.delete_all_meta_json(source_name="kendeya")
    except KeyboardInterrupt:
        stop_workers_logger_loop()
        logger.info("👋 CouchDB Sync Worker stopped manually")
        sys.exit(0)
