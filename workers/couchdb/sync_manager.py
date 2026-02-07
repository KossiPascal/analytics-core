# -------------------------------
# sync_manager.py (optimisé)
# -------------------------------
import re
import time
import asyncio
import random
from datetime import datetime
from typing import Type, Any, List, Dict, Tuple
from sqlalchemy import delete, literal_column
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert as pg_insert
from aiohttp import ClientSession, ClientTimeout, ClientError, BasicAuth
from concurrent.futures import ThreadPoolExecutor, as_completed

from backend.src.database.extensions import db
from backend.src.models.couchdb import CibleDatabase, CouchdbSource
from workers.couchdb.models import CreateTableModel
from workers.couchdb.utils import (
    DEFAULT_LIMIT, TIMEOUT, EXCLUDED_PATTERNS,
    SYNC_IDLE_SLEEP, ERROR_RETRY_BASE, sanitize_doc
)
from workers.logger import get_workers_logger

logger = get_workers_logger(__name__)
MAX_WORKERS = 4


# -------------------------------
# BULK UPSERT / DELETE
# -------------------------------
def _upsert_chunk(session: Session, DataModel: Type[Any], chunk: List[dict], source_name: str) -> Tuple[int, int]:
    created, updated = 0, 0
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
    except SQLAlchemyError as e:
        session.rollback()
        logger.error(f"[UPSERT BULK] Failed on source={source_name}: {e}")
    return created, updated


def _delete_chunk(session: Session, DataModel: Type[Any], chunk: List[str], source_name: str) -> int:
    deleted = 0
    try:
        stmt = delete(DataModel).where(DataModel.id.in_(chunk))
        result = session.execute(stmt)
        session.flush()
        deleted += result.rowcount
    except SQLAlchemyError as e:
        session.rollback()
        logger.error(f"[DELETE BULK] Failed on source={source_name}: {e}")
    return deleted


def bulk_apply_changes(session: Session, source: CouchdbSource, DataModel: Type[Any],cible: CibleDatabase, rows_upsert: List[dict], ids_delete: List[str],chunk_size: int = 1000) -> Tuple[int, int, int]:
    created, updated, deleted = 0, 0, 0

    upsert_chunks = [rows_upsert[i:i+chunk_size] for i in range(0, len(rows_upsert), chunk_size)]
    delete_chunks = [ids_delete[i:i+chunk_size] for i in range(0, len(ids_delete), chunk_size)]

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        # UPSERT
        futures_upsert = [executor.submit(_upsert_chunk, session, DataModel, chunk, source.name) for chunk in upsert_chunks]
        for fut in as_completed(futures_upsert):
            c, u = fut.result()
            created += c
            updated += u

        # DELETE
        futures_delete = [executor.submit(_delete_chunk, session, DataModel, chunk, source.name) for chunk in delete_chunks]
        for fut in as_completed(futures_delete):
            deleted += fut.result()

    if created or updated or deleted:
        logger.info(f"{source.name.upper()} → CREATED: {created}, UPDATED: {updated}, DELETED: {deleted}")
    else:
        logger.debug(f"{source.name} → no changes")


    return created, updated, deleted


# -------------------------------
# FETCH CHANGES
# -------------------------------
async def fetch_changes(client: ClientSession, source: CouchdbSource, host_db: str, last_seq: str) -> Dict[str, Any]:
    url = f"{source.base_url}/{host_db}/_changes"
    params = {
        "since": last_seq or "0",
        "include_docs": "true",
        "limit": DEFAULT_LIMIT,
        "style": "all_docs",
        "feed": "longpoll",
        "timeout": TIMEOUT
    }
    username, password = source.auth
    async with client.get(url, params=params, auth=BasicAuth(username, password)) as resp:
        resp.raise_for_status()
        return await resp.json()


# -------------------------------
# SYNC SINGLE DB (isolé)
# -------------------------------
async def sync_db_once(source: CouchdbSource, cible: CibleDatabase, DataModel: Type[Any], SyncStateModel: Type[Any], SyncStatusModel: Type[Any]):
    """Sync CouchDB → Postgres pour une DB avec son propre last_seq"""
    with Session(db.engine) as session:
        # --- last_seq spécifique à la DB ---
        sync_state = session.query(SyncStateModel).filter_by(source_id=source.id, cible_id=cible.id).first()
        if not sync_state:
            sync_state = SyncStateModel(source_id=source.id, cible_id=cible.id, last_seq="0")
            session.add(sync_state)
            session.commit()

        log = SyncStatusModel(source_id=source.id, cible_id=cible.id, status="RUNNING", started_at=datetime.utcnow())
        session.add(log)
        session.commit()

        try:
            async with ClientSession(timeout=ClientTimeout(total=TIMEOUT)) as client:
                payload = await fetch_changes(client, source, cible.host_name, sync_state.last_seq)
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
                            "source_id": source.id,
                            "cible_id": cible.id,
                            "reported_date": doc.get("reported_date"),
                        })

                # Apply UPSERT + DELETE
                created, updated, deleted = bulk_apply_changes(session, source, DataModel, cible, rows_upsert, ids_delete)

                # Update state & log
                sync_state.last_seq = payload.get("last_seq")
                sync_state.last_sync_at = datetime.utcnow()
                log.status = "SUCCESS"
                log.message = f"CREATED({created}) UPDATED({updated}) DELETED({deleted})"
                log.finished_at = datetime.utcnow()
                session.commit()

                if not results:
                    await asyncio.sleep(SYNC_IDLE_SLEEP)

        except (ClientError, asyncio.TimeoutError) as e:
            session.rollback()
            log.status = "ERROR"
            log.message = str(e)
            log.finished_at = datetime.utcnow()
            session.commit()
            logger.warning(f"[source={source.id}:{cible.local_name}] network error → retry")
            await asyncio.sleep(ERROR_RETRY_BASE + random.uniform(0,2))

        except Exception as e:
            session.rollback()
            log.status = "ERROR"
            log.message = str(e)
            log.finished_at = datetime.utcnow()
            session.commit()
            logger.exception(f"[source={source.id}:{cible.local_name}] unexpected error")
            raise


# -------------------------------
# RUNNER ASYNC POUR TOUTES LES DBs
# -------------------------------
async def runner_async(source: CouchdbSource, ModelMgr: CreateTableModel,CibleDbList: list[CibleDatabase],SyncStateModel:Type[Any], SyncStatusModel:Type[Any]) -> List[Dict[str, Any]]:
    tasks = []
    for cible in CibleDbList:
        DataModel, _ = ModelMgr.create_source_table(cible.local_name)
        tasks.append(sync_db_once(source, cible, DataModel, SyncStateModel, SyncStatusModel))

    results = await asyncio.gather(*tasks, return_exceptions=True)
    output = []
    for idx, res in enumerate(results):
        local_name = CibleDbList[idx].local_name
        if isinstance(res, Exception):
            output.append({"cible": local_name, "status": "error", "error": f"{type(res).__name__}: {str(res)[:200]}"})
        else:
            output.append({"cible": local_name, "status": "success"})
    return output


# -------------------------------
# ENTRY POINT POUR UNE SOURCE
# -------------------------------
def start_async_single_source(source_id: int) -> dict:
    with Session(db.engine) as session:
        try:
            source = session.get(CouchdbSource, source_id)
            if not source or not source.is_active:
                logger.warning(f"[SYNC] Source {source_id} not found or inactive")
                return {"status": "skipped", "reason": "inactive"}

            ModelMgr = CreateTableModel(db, project_name=source.name)
            SyncStateModel, _ = ModelMgr.create_sync_states_table()
            SyncStatusModel, _ = ModelMgr.create_sync_status_table()
            CibleDbList = CibleDatabase.couchdb_names()

            results = asyncio.run(runner_async(source, ModelMgr, CibleDbList, SyncStateModel, SyncStatusModel))

            # --- Mise à jour source ---
            now = datetime.utcnow()
            source.last_used_at = now
            source.last_sync = now
            session.commit()

            return {
                "status": "success",
                "synced_dbs": len(CibleDbList),
                "details": results
            }

        except Exception as exc:
            logger.exception(f"[SYNC] Fatal error source={source_id}")
            return {"status": "error", "message": str(exc)}

        finally:
            db.session.remove()
