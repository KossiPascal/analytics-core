import re
import asyncio
import aiohttp
from typing import Dict, Any
from datetime import datetime
from sqlalchemy import select, update, delete
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError

from config import Config
from models.couchdb import (
    CouchDBLastSeq, CouchDBLog, CouchDB, CouchDBUsers,
    CouchDBLogs, CouchDBSentinel, CouchDBMetas
)

from database.migrations.runner import run_view_migrations
from helpers.spinner import spinner


# -------------------- CONSTANTES --------------------
DEFAULT_LIMIT = 2000
IDLE_DELAY = 5  # secondes
LONGPOLL_TIMEOUT = 60  # secondes
ONE_MINUTE = 60  # secondes
MAX_RETRY_DELAY = 12 * 60 * 60  # 12 heures

# -------------------- EXCLUSIONS --------------------
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

# -------------------- CIBLES --------------------
cible_map = {
    "medic": {"index": 1, "name": "medic", "model": CouchDB},
    "users": {"index": 2, "name": "_users", "model": CouchDBUsers},
    "logs": {"index": 3, "name": "medic-logs", "model": CouchDBLogs},
    "sentinel": {"index": 4, "name": "medic-sentinel", "model": CouchDBSentinel},
    "users_meta": {"index": 5, "name": "medic-users-meta", "model": CouchDBMetas}
}


# -------------------- ENGINE ASYNC --------------------
DATABASE_URL_ASYNC = (
    f"postgresql+asyncpg://{Config.POSTGRES_USER}:"
    f"{Config.POSTGRES_PASSWORD}@{Config.POSTGRES_HOST}:"
    f"{Config.POSTGRES_PORT}/{Config.POSTGRES_DB}"
)
engine = create_async_engine(DATABASE_URL_ASYNC, echo=False)
async_session = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

# -------------------- SANITIZE --------------------
def sanitize_doc(doc: dict):
    def sanitize_value(value):
        if isinstance(value, bool):
            return int(value)
        if value is None:
            return ""
        if isinstance(value, dict):
            return {k: sanitize_value(v) for k, v in value.items()}
        if isinstance(value, list):
            return [sanitize_value(v) for v in value]
        return value
    return {k: sanitize_value(v) for k, v in doc.items()}


def clean_couchdb_doc(doc: dict) -> dict:
    return {
        k: v for k, v in doc.items()
        if not k.startswith("_")
    }

async def bulk_upsert(session, model, rows: list[dict]):
    if not rows:
        return

    stmt = insert(model).values(rows)

    update_cols = {
        c.name: stmt.excluded[c.name]
        for c in model.__table__.columns
        if c.name != "id"
    }

    stmt = stmt.on_conflict_do_update(index_elements=["id"],set_=update_cols)
    await session.execute(stmt)


# -------------------- LOGGING --------------------
async def log_message(message: str):
    async with async_session() as session:
        try:
            log = CouchDBLog(log=f"[{datetime.utcnow().isoformat()}] {message}")
            session.add(log)
            await session.commit()
            if Config.IS_DEBUG_MODE:
                print(f"{message}")
        except SQLAlchemyError as e:
            if Config.IS_DEBUG_MODE:
                print(f"⚠️ Failed to log message: {e}")

# -------------------- COUCHDB --------------------
async def fetch_couchdb_changes(session_http: aiohttp.ClientSession, db_name: str, since: str):
    url = f"{Config.COUCHDB_BASE_URL}/{db_name}/_changes"
    params = {
        "since": since,
        "include_docs": 'true',
        "limit": DEFAULT_LIMIT,
        "style": "all_docs",
        "feed": "longpoll",
        "timeout": LONGPOLL_TIMEOUT * 1000
    }
    try:
        async with session_http.get(url, params=params) as resp:
            resp.raise_for_status()
            return await resp.json()
    except Exception as e:
        await log_message(f"{db_name}: ⚠️ Failed to fetch CouchDB changes: {str(e)}")
        return 'error_found'

# -------------------- SEQUENCE --------------------
async def get_last_sequence(cible: str) -> str:
    """
    Récupère la dernière séquence CouchDB enregistrée pour une cible.
    Retourne "0" si aucune séquence n'est encore stockée.
    """
    index = cible_map[cible]["index"]

    async with async_session() as session:
        result = await session.execute(
            select(CouchDBLastSeq.seq)
            .where(CouchDBLastSeq.id == index)
            .limit(1)
        )
        return result.scalar_one_or_none() or "0"


async def update_last_sequence(cible: str, seq: str) -> None:
    """
    UPSERT PostgreSQL : insère ou met à jour la séquence CouchDB
    en une seule requête atomique.
    """
    index = cible_map[cible]["index"]

    stmt = (
        insert(CouchDBLastSeq)
        .values(id=index, seq=seq)
        .on_conflict_do_update(index_elements=[CouchDBLastSeq.id],set_={"seq": seq})
    )

    async with async_session() as session:
        await session.execute(stmt)
        await session.commit()

    await log_message('🚀 update_last_sequence upsert successfully !\n')


# -------------------- PROCESS BATCH --------------------
async def process_batch(cible: str, data: dict):
    results = data.get("results", [])
    if not results:
        return data.get("last_seq", "0")

    model = cible_map[cible]["model"]
    to_create, to_update, to_delete = [], [], []

    for item in results:
        raw_doc = item.get("doc") or {}
        doc = sanitize_doc(raw_doc)
        doc_id = raw_doc.get("_id") or item["id"]

        deleted = (
            item.get("deleted")
            or raw_doc.get("_deleted")
            or raw_doc.get("type") == "tombstone"
            or raw_doc.get("tombstone")
        )

        is_excluded = any(re.match(p, doc_id) for p in EXCLUDED_PATTERNS)

        if deleted or is_excluded:
            to_delete.append(doc_id)
            continue
        
        clean_doc = {"id": doc_id, "doc": doc}

        async with async_session() as session:
            exists = await session.get(model, doc_id)

        if exists:
            to_update.append(clean_doc)
        else:
            to_create.append(clean_doc)

    # --- SAVE (CREATE + UPDATE) ---
    if to_create or to_update:
        rows = to_create + to_update

        async with async_session() as session:
            try:
                await bulk_upsert(session, model, rows)
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    # --- DELETE ---
    if to_delete:
        async with async_session() as session:
            # await session.execute(delete(model).filter(model.id.in_(to_delete)))
            await session.execute(delete(model).where(model.id.in_(to_delete)))
            await session.commit()

    # --- UPDATE SEQUENCE ---
    await update_last_sequence(cible, data.get("last_seq", "0"))

    await log_message(f"{cible}: ✅ batch ok (create={len(to_create)}, update={len(to_update)}, delete={len(to_delete)})")

    # AFTER data sync → run view migrations
    await run_view_migrations()

    return data.get("last_seq", "0")

# -------------------- MAIN LOOP --------------------
async def run_cible(cible: str):
    async with aiohttp.ClientSession() as http_session:
        last_seq = await get_last_sequence(cible)
        db_name = cible_map[cible]["name"]
        retry_delay = ONE_MINUTE

        while True:
            data = await fetch_couchdb_changes(http_session, db_name, last_seq)

            if data == 'error_found':
                await asyncio.sleep(IDLE_DELAY)
                continue

            if not data or data.get("last_seq") == last_seq:
                await asyncio.sleep(IDLE_DELAY)
                continue

            try:
                last_seq = await process_batch(cible, data)
                retry_delay = ONE_MINUTE
            except Exception as e:
                await log_message(f"{cible}: ❌ error {str(e)} – retry in {retry_delay}s")
                await asyncio.sleep(retry_delay)
                retry_delay = min(retry_delay * 2, MAX_RETRY_DELAY)


async def start_sync_couchdb_to_postgres_job(cible_map_keys: Dict[str, Dict[str, Any]]):
    try:
        for c in cible_map_keys:
            await log_message(f"Start running {c}")
            await run_cible(c)
        
        await log_message("✅ Sync terminé")

    except Exception:
        await log_message("❌ Sync interrompue")
        raise

# -------------------- ENTRY POINT --------------------
async def sync_couchdb_to_postgres():
    await log_message("🚀 Starting CouchDB → Postgres sync")

    # stop_event = asyncio.Event()
    # spinner_task = asyncio.create_task(spinner("🔄 🚀 Sync CouchDB → Postgres en cours", stop_event))

    cible_map_keys = list(cible_map.keys())
    await start_sync_couchdb_to_postgres_job(cible_map_keys=cible_map_keys)
    
    # tasks = [asyncio.create_task() ]
    # await asyncio.gather(*tasks)

    # stop_event.set() # Arrête le spinner
    # await spinner_task  # Attend la fin du spinner

    await log_message("✅ Sync terminé\n")


# -------------------- RUN --------------------
if __name__ == "__main__":
    asyncio.run(sync_couchdb_to_postgres())




