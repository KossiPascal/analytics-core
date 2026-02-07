# # src/couchdb/sync_manager.py

# import re
# import time
# import threading
# import asyncio
# import random
# from datetime import datetime
# from typing import Optional, List, Dict, Tuple, Type, Any
# from flask import Flask
# from sqlalchemy import delete, literal_column
# from sqlalchemy.exc import SQLAlchemyError
# from sqlalchemy.orm import Session, DeclarativeMeta
# from sqlalchemy.dialects.postgresql import insert as pg_insert
# from aiohttp import ClientSession, ClientTimeout, ClientError, BasicAuth
# from concurrent.futures import ThreadPoolExecutor, as_completed
# from backend.src.database.extensions import db
# from backend.src.models.couchdb import CouchdbSource

# from workers.couchdb.models import CreateTableModel
# from workers.couchdb.utils import DEFAULT_LIMIT, TIMEOUT, EXCLUDED_PATTERNS, SYNC_IDLE_SLEEP, ERROR_RETRY_BASE, sanitize_doc

# from workers.logger import get_workers_logger

# logger = get_workers_logger(__name__)



# # def bulk_apply_changes(session: Session,source: CouchdbSource,DataModel: Type[Any],host_db: str,rows_upsert: List[dict],ids_delete: List[str]) -> Tuple[int, int, int]:
# #     """
# #     Apply UPSERT + DELETE operations safely in PostgreSQL using SQLAlchemy ORM.
# #     Returns: (created, updated, deleted)
# #     """

# #     created, updated, deleted = 0, 0, 0

# #     # ---------- UPSERT ----------
# #     for row in rows_upsert:
# #         doc_id = row.get("id")
# #         try:
# #             saved = session.get(DataModel, doc_id)  # SQLAlchemy 2.0 style

# #             if saved:
# #                 # ⚡ Mise à jour existante
# #                 for key, value in row.items():
# #                     if key != "id":
# #                         setattr(saved, key, value)
# #                 updated += 1
# #             else:
# #                 # ⚡ Nouvelle insertion
# #                 new_row = DataModel(**row)
# #                 session.add(new_row)
# #                 created += 1

# #             session.flush()  # valide localement pour éviter conflit

# #         except SQLAlchemyError as e:
# #             session.rollback()
# #             logger.error(f"[UPSERT] Failed for id={doc_id} on source={source.name}: {e}")

# #     # ---------- DELETE ----------
# #     for del_id in ids_delete:
# #         try:
# #             # ORM delete
# #             obj = session.get(DataModel, del_id)
# #             if obj:
# #                 session.delete(obj)
# #                 deleted += 1

# #             session.flush()  # valide localement

# #         except SQLAlchemyError as e:
# #             session.rollback()
# #             logger.error(f"[DELETE] Failed for id={del_id} on source={source.name}: {e}")

# #     logger.info(f"{source.name.upper()} → CREATED: {created}, UPDATED: {updated}, DELETED: {deleted}")

# #     return created, updated, deleted

# # def bulk_apply_changes(session: Session,source: CouchdbSource,DataModel: Type[Any],host_db: str,rows_upsert: List[dict],ids_delete: List[str]) -> Tuple[int, int, int]:
# #     """
# #     ⚡ Bulk UPSERT + DELETE for PostgreSQL
# #     - UPSERT via ON CONFLICT
# #     - DELETE via single query
# #     Returns: (created, updated, deleted)
# #     """

# #     created, updated, deleted = 0, 0, 0

# #     # ---------- BULK UPSERT ----------
# #     if rows_upsert:
# #         try:
# #             insert_stmt = pg_insert(DataModel).values(rows_upsert)
# #             update_stmt = {
# #                 c.name: getattr(insert_stmt.excluded, c.name)
# #                 for c in DataModel.__table__.columns
# #                 if c.name != "id"
# #             }

# #             stmt = insert_stmt.on_conflict_do_update(
# #                 index_elements=["id"],
# #                 set_=update_stmt
# #             ).returning(literal_column("xmax = 0").label("inserted"))

# #             result = session.execute(stmt)
# #             session.flush()

# #             # Comptage created/updated
# #             for row in result:
# #                 if row.inserted:
# #                     created += 1
# #                 else:
# #                     updated += 1

# #         except SQLAlchemyError as e:
# #             session.rollback()
# #             logger.error(f"[UPSERT BULK] Failed on source={source.name}: {e}")

# #     # ---------- BULK DELETE ----------
# #     if ids_delete:
# #         try:
# #             stmt = delete(DataModel).where(DataModel.id.in_(ids_delete))
# #             result = session.execute(stmt)
# #             session.flush()
# #             deleted = result.rowcount
# #         except SQLAlchemyError as e:
# #             session.rollback()
# #             logger.error(f"[DELETE BULK] Failed on source={source.name}: {e}")

# #     logger.info(f"{source.name.upper()} → CREATED: {created}, UPDATED: {updated}, DELETED: {deleted}")

# #     return created, updated, deleted

# # def bulk_apply_changes(session: Session,source: CouchdbSource,DataModel: Type[Any],host_db: str,rows_upsert: List[dict],ids_delete: List[str]) -> Tuple[int, int, int]:
# #     """
# #     ⚡ Bulk UPSERT + DELETE for PostgreSQL
# #     - UPSERT via ON CONFLICT
# #     - DELETE via single query
# #     Returns: (created, updated, deleted)
# #     """

# #     created, updated, deleted = 0, 0, 0

# #     # ---------- BULK UPSERT ----------
# #     if rows_upsert:
# #         try:
# #             insert_stmt = pg_insert(DataModel).values(rows_upsert)
# #             update_stmt = {
# #                 c.name: getattr(insert_stmt.excluded, c.name)
# #                 for c in DataModel.__table__.columns
# #                 if c.name != "id"
# #             }

# #             stmt = insert_stmt.on_conflict_do_update(
# #                 index_elements=["id"],
# #                 set_=update_stmt
# #             ).returning(literal_column("xmax = 0").label("inserted"))

# #             result = session.execute(stmt)
# #             session.flush()

# #             # Comptage created/updated
# #             for row in result:
# #                 if row.inserted:
# #                     created += 1
# #                 else:
# #                     updated += 1

# #         except SQLAlchemyError as e:
# #             session.rollback()
# #             logger.error(f"[UPSERT BULK] Failed on source={source.name}: {e}")

# #     # ---------- BULK DELETE ----------
# #     if ids_delete:
# #         try:
# #             stmt = delete(DataModel).where(DataModel.id.in_(ids_delete))
# #             result = session.execute(stmt)
# #             session.flush()
# #             deleted = result.rowcount
# #         except SQLAlchemyError as e:
# #             session.rollback()
# #             logger.error(f"[DELETE BULK] Failed on source={source.name}: {e}")

# #     logger.info(f"{source.name.upper()} → CREATED: {created}, UPDATED: {updated}, DELETED: {deleted}")

# #     return created, updated, deleted

# # def bulk_apply_changes(session: Session,source: CouchdbSource,DataModel: Type[Any],host_db: str,rows_upsert: List[dict],ids_delete: List[str],chunk_size: int = 1000) -> Tuple[int, int, int]:
# #     """
# #     ⚡ Bulk UPSERT + DELETE for PostgreSQL with chunking
# #     - UPSERT via ON CONFLICT
# #     - DELETE via single query per chunk
# #     Returns: (created, updated, deleted)
# #     """

# #     created, updated, deleted = 0, 0, 0

# #     # ---------- BULK UPSERT EN CHUNKS ----------
# #     for i in range(0, len(rows_upsert), chunk_size):
# #         chunk = rows_upsert[i:i + chunk_size]
# #         try:
# #             insert_stmt = pg_insert(DataModel).values(chunk)
# #             update_stmt = {
# #                 c.name: getattr(insert_stmt.excluded, c.name)
# #                 for c in DataModel.__table__.columns
# #                 if c.name != "id"
# #             }

# #             stmt = insert_stmt.on_conflict_do_update(
# #                 index_elements=["id"],
# #                 set_=update_stmt
# #             ).returning(literal_column("xmax = 0").label("inserted"))

# #             result = session.execute(stmt)
# #             session.flush()

# #             # Comptage created/updated
# #             for row in result:
# #                 if row.inserted:
# #                     created += 1
# #                 else:
# #                     updated += 1

# #         except SQLAlchemyError as e:
# #             session.rollback()
# #             logger.error(f"[UPSERT BULK] Failed on source={source.name} (chunk {i//chunk_size+1}): {e}")

# #     # ---------- BULK DELETE EN CHUNKS ----------
# #     for i in range(0, len(ids_delete), chunk_size):
# #         chunk = ids_delete[i:i + chunk_size]
# #         try:
# #             stmt = delete(DataModel).where(DataModel.id.in_(chunk))
# #             result = session.execute(stmt)
# #             session.flush()
# #             deleted += result.rowcount
# #         except SQLAlchemyError as e:
# #             session.rollback()
# #             logger.error(f"[DELETE BULK] Failed on source={source.name} (chunk {i//chunk_size+1}): {e}")

# #     logger.info(f"{source.name.upper()} → CREATED: {created}, UPDATED: {updated}, DELETED: {deleted}")

# #     return created, updated, deleted



# MAX_WORKERS = 4  # ⚡ Ajuster selon le CPU / Postgres

# def _upsert_chunk(session: Session, DataModel: Type[Any], chunk: List[dict], source_name: str) -> Tuple[int,int]:
#     created, updated = 0, 0
#     try:
#         insert_stmt = pg_insert(DataModel).values(chunk)
#         update_stmt = {
#             c.name: getattr(insert_stmt.excluded, c.name)
#             for c in DataModel.__table__.columns
#             if c.name != "id"
#         }
#         stmt = insert_stmt.on_conflict_do_update(
#             index_elements=["id"],
#             set_=update_stmt
#         ).returning(literal_column("xmax = 0").label("inserted"))

#         result = session.execute(stmt)
#         session.flush()

#         for row in result:
#             if row.inserted:
#                 created += 1
#             else:
#                 updated += 1

#     except SQLAlchemyError as e:
#         session.rollback()
#         logger.error(f"[UPSERT BULK] Failed on source={source_name}: {e}")

#     return created, updated

# def _delete_chunk(session: Session, DataModel: Type[Any], chunk: List[str], source_name: str) -> int:
#     deleted = 0
#     try:
#         stmt = delete(DataModel).where(DataModel.id.in_(chunk))
#         result = session.execute(stmt)
#         session.flush()
#         deleted += result.rowcount
#     except SQLAlchemyError as e:
#         session.rollback()
#         logger.error(f"[DELETE BULK] Failed on source={source_name}: {e}")
#     return deleted

# def bulk_apply_changes(session: Session,source: CouchdbSource,DataModel: Type[Any],host_db: str,rows_upsert: List[dict],ids_delete: List[str],chunk_size: int = 1000) -> Tuple[int, int, int]:
#     """
#     ⚡ Bulk UPSERT + DELETE in parallel chunks
#     """
#     created, updated, deleted = 0, 0, 0

#     # ---------- UPSERT ----------
#     upsert_chunks = [rows_upsert[i:i+chunk_size] for i in range(0, len(rows_upsert), chunk_size)]
#     delete_chunks = [ids_delete[i:i+chunk_size] for i in range(0, len(ids_delete), chunk_size)]

#     with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
#         # UPSERT parallel
#         futures_upsert = [executor.submit(_upsert_chunk, session, DataModel, chunk, source.name) for chunk in upsert_chunks]
#         for fut in as_completed(futures_upsert):
#             c, u = fut.result()
#             created += c
#             updated += u

#         # DELETE parallel
#         futures_delete = [executor.submit(_delete_chunk, session, DataModel, chunk, source.name) for chunk in delete_chunks]
#         for fut in as_completed(futures_delete):
#             deleted += fut.result()

#     logger.info(f"{source.name.upper()} → CREATED: {created}, UPDATED: {updated}, DELETED: {deleted}")
#     return created, updated, deleted

# async def fetch_changes(client: ClientSession, source: CouchdbSource, host_db: str, last_seq: str) -> Dict[str, Any]:
#     """Fetch CouchDB _changes feed"""
#     url = f"{source.base_url}/{host_db}/_changes"
#     params = {
#         "since": last_seq or "0",
#         "include_docs": "true",
#         "limit": DEFAULT_LIMIT,
#         "style": "all_docs",
#         "feed": "longpoll",
#         "timeout": TIMEOUT
#     }
#     username, password = source.auth
#     async with client.get(url, params=params, auth=BasicAuth(username, password)) as resp:
#         resp.raise_for_status()
#         return await resp.json()

# async def sync_db_once(source: CouchdbSource, host_db: str, DataModel: Type[DeclarativeMeta],SyncStateModel: Type[DeclarativeMeta], SyncStatusModel: Type[DeclarativeMeta]):
#     # source_id: int = source.id
#     # source_name: str = source.name
#     """Sync CouchDB → Postgres pour une DB avec session isolée"""
#     with Session(db.engine) as session:
#         # --- Init / get last_seq ---
#         sync_state = session.query(SyncStateModel).filter_by(source_id=source.id).first()
#         if not sync_state:
#             sync_state = SyncStateModel(source_id=source.id, last_seq="0")
#             session.add(sync_state)
#             session.commit()

#         log = SyncStatusModel(source_id=source.id, status="RUNNING", started_at=datetime.utcnow())
#         session.add(log)
#         session.commit()

#         try:
#             print(f'\n{sync_state.last_seq}')
#             async with ClientSession(timeout=ClientTimeout(total=TIMEOUT)) as client:
#                 payload = await fetch_changes(client, session.get(CouchdbSource, source.id), host_db, sync_state.last_seq)
#                 results = payload.get("results", [])
#                 rows_upsert, ids_delete = [], []

#                 for item in results:
#                     doc_id = item.get("id")
#                     doc = item.get("doc") or {}

#                     isExcluded = any(re.match(p, doc_id) for p in EXCLUDED_PATTERNS)
#                     isTombstone = doc.get("type") == "tombstone" or doc.get("tombstone")

#                     if item.get("deleted") or doc.get("_deleted") or isExcluded or isTombstone:
#                         ids_delete.append(doc_id)
#                     else:
#                         rows_upsert.append({
#                             "id": doc_id,
#                             "doc": sanitize_doc(doc),
#                             "form": doc.get("form"),
#                             "type": doc.get("type"),
#                             "reported_date": doc.get("reported_date"),
#                         })

#                 created, updated, deleted = bulk_apply_changes(session, source, DataModel, host_db, rows_upsert, ids_delete)

#                 # Update state & log
#                 sync_state.last_seq = payload.get("last_seq")
#                 sync_state.last_sync_at = datetime.utcnow()
#                 log.status = "SUCCESS"
#                 log.message = f"CREATED({created}) UPDATED({updated}) DELETED({deleted})"
#                 log.finished_at = datetime.utcnow()
#                 session.commit()

#                 if not results:
#                     await asyncio.sleep(SYNC_IDLE_SLEEP)

#         except (ClientError, asyncio.TimeoutError) as e:
#             session.rollback()
#             log.status = "ERROR"
#             log.message = str(e)
#             log.finished_at = datetime.utcnow()
#             session.commit()
#             logger.warning(f"[source={source.id}:{host_db}] network error → retry")
#             await asyncio.sleep(ERROR_RETRY_BASE + random.uniform(0,2))

#         except Exception as e:
#             session.rollback()
#             log.status = "ERROR"
#             log.message = str(e)
#             log.finished_at = datetime.utcnow()
#             session.commit()
#             logger.exception(f"[source={source.id}:{host_db}] unexpected error")
#             raise

# # -------------------------------
# # Runner async pour toutes les DBs d'une source
# # -------------------------------
# async def runner_async(source:CouchdbSource, model_mgr: CreateTableModel) -> List[Dict[str, Any]]:


#     SyncStateModel, _ = model_mgr.create_sync_states_table()
#     SyncStatusModel, _ = model_mgr.create_sync_status_table()

#     CIBLE = []

#     for db_info in source.couchdb_names:
#         local = db_info["local"]
#         DataModel, _ = model_mgr.create_source_table(local)

#         CIBLE.append(DbCible(local=local, host=db_info["host"], model=DataModel))

#         tasks.append(sync_db_once(source, , DataModel, SyncStateModel, SyncStatusModel))

#     tasks = []
#     for db_info in source.couchdb_names:
#         DataModel, _ = model_mgr.create_source_table(db_info["local"])
#         tasks.append(sync_db_once(source, db_info["host"], DataModel, SyncStateModel, SyncStatusModel))
    

#     results = await asyncio.gather(*tasks, return_exceptions=True)
#     output = []
#     for idx, res in enumerate(results):
#         source_db = source.couchdb_names[idx]["local"]
#         if isinstance(res, Exception):
#             output.append({"db": source_db, "status": "error", "error": f"{type(res).__name__}: {str(res)[:200]}"})
#         else:
#             output.append({"db": source_db, "status": "success"})
#     return output


# class DbCible:
#     def __init__(self, local:str, host:str, model:Type[Any]):
#         self.local = local
#         self.host = host
#         self.model = model
# # -------------------------------
# # Entry point pour une source
# # -------------------------------
# def start_async_single_source(source_id: int) -> dict:
#     with Session(db.engine) as session:
#         try:
#             source = session.get(CouchdbSource, source_id)
#             if not source or not source.is_active:
#                 logger.warning(f"[SYNC] Source {source_id} not found or inactive")
#                 return {"status": "skipped", "reason": "inactive"}

#             model_mgr = CreateTableModel(db, project_name=source.name)

#             results = asyncio.run(runner_async(source, model_mgr))

#             # --- Mise à jour source ---
#             now = datetime.utcnow()
#             source.last_used_at = now
#             source.last_sync = now
#             session.commit()

#             return {
#                 "status": "success",
#                 "synced_dbs": len(source.couchdb_names),
#                 "details": results
#             }

#         except Exception as exc:
#             logger.exception(f"[SYNC] Fatal error source={source_id}")
#             return {"status": "error", "message": str(exc)}

#         finally:
#             db.session.remove()

# # -------------------------------
# # Scheduler / Manager
# # -------------------------------
# class SyncCouchdbManager:
#     def __init__(self, app: Flask, interval: int = 5):
#         self.app = app
#         self.interval = interval
#         self._thread: Optional[threading.Thread] = None
#         self._stop_event = threading.Event()
#         self._running = False

#     def start(self) -> None:
#         if self._running:
#             logger.warning("⚠ Sync manager already running")
#             return
#         self._stop_event.clear()
#         self._thread = threading.Thread(target=self._run, daemon=True, name="couchdb-sync-manager")
#         self._thread.start()
#         self._running = True
#         logger.info("🚀 CouchDB Sync Manager started")

#     def stop(self) -> None:
#         if not self._running:
#             return
#         self._stop_event.set()
#         self._thread.join(timeout=10)
#         self._running = False
#         logger.info("✅ CouchDB Sync Manager stopped")

#     def status(self) -> dict:
#         return {
#             "running": self._running,
#             "interval": self.interval,
#             "thread_alive": self._thread.is_alive() if self._thread else False,
#             "checked_at": datetime.utcnow().isoformat()
#         }

#     def _run(self) -> None:
#         with self.app.app_context():
#             CouchdbSource.ensure_default_couchdb_dbs()
#             while not self._stop_event.is_set():
#                 try:
#                     self._dispatch_once()
#                 except Exception:
#                     logger.exception("Unhandled error in sync loop")
#                 time.sleep(self.interval)

#     def _dispatch_once(self) -> None:
#         sources = db.session.query(CouchdbSource).filter(
#             CouchdbSource.is_active.is_(True),
#             CouchdbSource.auto_sync.is_(True)
#         ).all()
#         if not sources:
#             logger.info("No active CouchDB sources to sync")
#             return
#         for source in sources:
#             self._sync_single_source(source.id)

#     def _sync_single_source(self, source_id: int) -> None:
#         with self.app.app_context():
#             try:
#                 start_async_single_source(source_id)
#             except Exception:
#                 logger.exception(f"[SYNC] Failed for source {source_id}")













# # def bulk_apply_changes(session: Session,source: CouchdbSource,model: Type[Any],host_db:str, rows_upsert: List[dict],ids_delete: List[str]) -> Tuple[int, int, int]:
# #     """
# #     Apply UPSERT + DELETE operations safely in PostgreSQL.
# #     Returns: (created, updated, deleted)
# #     """

# #     created, updated, deleted = 0, 0, 0

# #     # ---------- UPSERT ----------
# #     for row in rows_upsert:
# #         try:
# #             insert_stmt = pg_insert(model).values(row)

# #             update_stmt = (
# #                 insert_stmt.on_conflict_do_update(
# #                     index_elements=["id"],
# #                     set_={
# #                         c.name: getattr(insert_stmt.excluded, c.name)
# #                         for c in model.__table__.columns
# #                         if c.name != "id"
# #                     },
# #                 ).returning(literal_column("xmax = 0").label("inserted"))
# #             )
# #             result = session.execute(update_stmt).first()
# #             session.commit()

# #             if result and result.inserted:
# #                 created += 1
# #                 # logger.debug(f"[UPSERT] Created id={row.get('id')}")
# #             else:
# #                 updated += 1
# #                 # logger.debug(f"[UPSERT] Updated id={row.get('id')}")

# #         except SQLAlchemyError as e:
# #             session.rollback()
# #             logger.error(f"[UPSERT] Failed for id={row.get('id')} on source={source.name}: {e}")

# #     # ---------- DELETE ----------
# #     for del_id in ids_delete:
# #         try:
# #             stmt = delete(model).where(model.id == del_id)
# #             result = session.execute(stmt)
# #             session.commit()

# #             if result.rowcount:
# #                 deleted += result.rowcount
# #                 # logger.debug(f"[DELETE] Deleted id={del_id}")

# #         except SQLAlchemyError as e:
# #             session.rollback()
# #             logger.error(f"[DELETE] Failed for id={del_id} on source={source.name}: {e}")

# #     logger.info(f"{source.name.upper()} → CREATED: {created}, UPDATED: {updated}, DELETED: {deleted}")


# #     return created, updated, deleted
