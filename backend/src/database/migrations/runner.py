import re
import asyncio
from datetime import datetime
from typing import List,Optional,Iterable
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from backend.src.database.extensions import AsyncSessionLocal
from backend.src.database.migrations.types import BaseViewMigration, SqlView
from backend.src.database.migrations.registration import FormatViewMigration
from asyncpg.exceptions import UndefinedTableError
from backend.src.config import Config
from backend.src.helpers.spinner import spinner
from sqlalchemy.exc import SQLAlchemyError

MIGRATION_REGISTRY = FormatViewMigration()


# CONSTANTS
MIGRATIONS_TABLE = "revision_migrations"
MAX_ITERATIONS = 50
SLEEP_BETWEEN_ROUNDS = 0.3

async def log_message(message: str):
    # async with AsyncSessionLocal() as session:
    #     try:
    #         log = MigrationLog(log=f"[{datetime.utcnow().isoformat()}] {message}")
    #         session.add(log)
    #         await session.commit()
    #         if Config.IS_DEBUG_MODE:
    #             print(f"{message}")
    #     except SQLAlchemyError as e:
    #         if Config.IS_DEBUG_MODE:
    #             print(f"⚠️ Failed to log message: {e}")
    print(f"{message}")


def extract_missing_relation(error: Exception) -> str | None:
    # 1️⃣ Cas asyncpg direct
    orig = getattr(error, "orig", None)

    if isinstance(orig, UndefinedTableError):
        # asyncpg fournit parfois directement le nom
        table = getattr(orig, "table_name", None)
        if table and table.lower() != "none":
            return table

    # 2️⃣ Fallback regex sur le message SQL brut
    msg = str(error)

    match = re.search(r'relation\s+"([^"]+)"\s+does not exist', msg, re.IGNORECASE)
    if match:
        name = match.group(1)
        if name.lower() != "none":
            return name

    return None

# INIT REVISION TABLE
async def init_revision_table(session: Optional[AsyncSession] = None):
    async def executeSql(sess: AsyncSession):
        try:
            await sess.execute(text(f"""
                CREATE TABLE IF NOT EXISTS {MIGRATIONS_TABLE} (
                    revision BIGINT PRIMARY KEY,
                    name TEXT NOT NULL,
                    applied_at TIMESTAMP NOT NULL DEFAULT now()
                );
            """))
            await sess.commit()
            # await log_message(f"✅ Table {MIGRATIONS_TABLE} initialisée.")
        except Exception as e:
            await sess.rollback()
            await log_message(f"❌ Erreur lors de l'initialisation de {MIGRATIONS_TABLE}: {e}")
            raise
    if session:
        await executeSql(session)
    else:
        async with AsyncSessionLocal() as session:
            await executeSql(session)

async def drop_revision_table(session: Optional[AsyncSession] = None):
    async def executeSql(sess: AsyncSession):
        try:
            await sess.execute(text(f"DROP TABLE IF EXISTS {MIGRATIONS_TABLE} CASCADE;"))
            await sess.commit()
            await log_message(f"🗑️ Table {MIGRATIONS_TABLE} supprimée.")
        except Exception as e:
            await sess.rollback()
            await log_message(f"❌ Erreur lors de la suppression de {MIGRATIONS_TABLE}: {e}")
            raise

    if session:
        await executeSql(session)
    else:
        async with AsyncSessionLocal() as session:
            await executeSql(session)

# REVISION UTILITIES
async def has_revision(session: AsyncSession, revision: int) -> bool:
    res = await session.execute(
        text(f"SELECT 1 FROM {MIGRATIONS_TABLE} WHERE revision = :v"),
        {"v": revision}
    )
    return res.scalar() is not None

async def register_revision(session: AsyncSession, migration: BaseViewMigration):
    await session.execute(
        text(f"""
            INSERT INTO {MIGRATIONS_TABLE}(revision, name)
            VALUES (:v, :n)
            ON CONFLICT (revision) DO NOTHING
        """),
        {"v": migration.revision, "n": migration.name}
    )
    
async def unregister_revision(session: AsyncSession, migration: BaseViewMigration):
    """
    Supprime la révision de la table de suivi après drop de la vue.
    """
    await session.execute(
        text(f"DELETE FROM {MIGRATIONS_TABLE} WHERE revision = :v"),
        {"v": migration.revision}
    )
    await log_message(f"🗑️ Révision {migration.revision} supprimée pour {migration.name}")

def find_migration_by_view(view_name: str) -> BaseViewMigration | None:
    # return next((m for m in MIGRATION_REGISTRY if view_name in m.views),None)
    for migration in MIGRATION_REGISTRY:
        for vn in (migration.views or []):
            if view_name == vn:
                return migration
    return None

# CREATE / DROP / REFRESH HELPERS
async def execute_sql_list(session: AsyncSession,sql_view: list[SqlView] | SqlView,action: str,migration: BaseViewMigration):
    if not sql_view:
        return

    sql_list = sql_view if isinstance(sql_view, list) else [sql_view]

    for s in sql_list:
        try:
            # 1️⃣ DROP avant CREATE
            if action == "create_view":
                if migration.drop_before_create:
                    for d_index in migration.drop_index_sqls(s.view_name):
                        await session.execute(text(d_index.sql))

                    if migration.type in {"materialized", "view"}:
                        for d_view in migration.drop_view_sql(s.view_name):
                            await session.execute(text(d_view.sql))

                    await session.commit()

            # 2️⃣ ACTION PRINCIPALE
            await session.execute(text(s.sql))

        except Exception as e:
            error_msg = str(e)

            # 3️⃣ REFRESH sur vue inexistante → CREATE
            if (action == "refresh_views" and migration.type == "materialized" and "does not exist" in error_msg):
                await log_message(f"🆕 Vue absente → CREATE {s.view_name}")
                for create_sql in migration.create_view_sql():
                    if create_sql.view_name == s.view_name:
                        await session.execute(text(create_sql.sql))
                continue

            # 4️⃣ REFRESH CONCURRENTLY impossible → fallback
            if (action == "refresh_views" and migration.type == "materialized" and "cannot refresh materialized view" in error_msg):
                await log_message(f"⚠️ Fallback REFRESH (non concurrent) → {s.view_name}")
                await session.execute(text(f"REFRESH MATERIALIZED VIEW {s.view_name};"))
                continue

            # 5️⃣ ERREUR BLOQUANTE
            raise RuntimeError(
                f"""
                    ❌ {action} échoué
                    Migration : {migration.name}
                    Vue       : {s.view_name}
                    Type      : {migration.type}
                    Erreur    : {e}
                    SQL       :
                    {s.sql}
                """
            ) from e

# CREATE / DROP HELPERS
async def create_view(session: AsyncSession, migration: BaseViewMigration):
    await execute_sql_list(session, migration.create_view_sql(), "create_view", migration)

async def create_indexes(session: AsyncSession, migration: BaseViewMigration):
    if migration.requires_unique_index() and not migration.has_unique_index():
        message = f"❌ {migration.name} : REFRESH MATERIALIZED VIEW CONCURRENTLY nécessite un UNIQUE INDEX"
        raise RuntimeError(message)
    await execute_sql_list(session, migration.create_index_sqls(), "create_indexes", migration)

async def drop_view(session: AsyncSession, migration: BaseViewMigration):
    await execute_sql_list(session, migration.drop_view_sql(), "drop_view", migration)

async def drop_indexes(session: AsyncSession, migration: BaseViewMigration):
    await execute_sql_list(session, migration.drop_index_sqls(), "drop_indexes", migration)

async def refresh_views(session: AsyncSession, migration: BaseViewMigration):
    await execute_sql_list(session, migration.refresh_view_sql(), "refresh_views", migration)

# DROP + UNREGISTER
async def drop_and_unregister_view(session: AsyncSession, migration: BaseViewMigration):
    await drop_indexes(session, migration)
    await drop_view(session, migration)
    await unregister_revision(session, migration)
    await log_message(f"🔥 Drop complet de {migration.name}")

# RECREATE VIEW
async def recreate_view(session: AsyncSession, migration: BaseViewMigration, drop: bool = True):
    if drop and migration.drop_before_create:
        await drop_and_unregister_view(session, migration)
    await create_view(session, migration)
    await create_indexes(session, migration)
    await register_revision(session, migration)
    await log_message(f"🔥 Recréation complète de {migration.name}")

# DEPENDENCIES
async def assert_dependencies(session: AsyncSession, migration: BaseViewMigration, recreate: bool = False, refresh: bool = False, visited: set[int] | None = None):
    """Vérifie et applique automatiquement les dépendances manquantes."""
    if not migration.depends_on:
        return

    if not isinstance(migration.depends_on, list):
        raise TypeError("depends_on must be a list of revisions")

    for dep_rev in migration.depends_on:
        # Dépendance déjà appliquée → OK
        if await has_revision(session, dep_rev):
            continue

        # await log_message(f"⏳ Migration {migration.name} attend la révision {dep_rev}")

        # Dépendance connue mais non appliquée → on la crée
        dep_mig = next((m for m in MIGRATION_REGISTRY if m.revision == dep_rev),None)

        if not dep_mig:
            raise RuntimeError(f"❌ Dépendance inconnue: revision {dep_rev} requise par {migration.name}")

        # await log_message(f"⏳ Création automatique de la dépendance {dep_mig.name} (v{dep_rev})")
        await apply_view_migration(session,dep_mig,recreate=recreate,refresh=refresh,visited=visited)
        await session.commit()  # <-- rend la vue visible pour la migration suivante
        await log_message(f"✅ Dépendance {dep_mig.name} créée (v{dep_mig.revision})")

# HELPER: CREATE VIEW WITH DEPENDENCY HANDLING
async def apply_view_migration(session: AsyncSession, migration: BaseViewMigration, recreate: bool = False, refresh: bool = False, visited: set[int] | None = None):
    """
    Applique une migration de vue en gérant les dépendances explicites et implicites.
    visited : empêche les boucles infinies
    """
    if visited is None:
        visited = set()

    if migration.revision in visited:
        raise RuntimeError(f"❌ Dépendance circulaire détectée sur {migration.name} (v{migration.revision})")

    visited.add(migration.revision)

    try:
        # 🔗 ⛔ Vérification des Dépendances (création auto si absentes)
        await assert_dependencies(session, migration, recreate, refresh, visited)

        already_applied = await has_revision(session, migration.revision)

        # 2️⃣ RECREATE MODE
        if recreate:
            # await log_message(f"🔥 RECREATE {migration.name}")
            await recreate_view(session, migration)
            await session.commit()
            await log_message(f"🔥 recréée -> v{migration.revision}: {migration.views[0]}")
            return True

        # 3️⃣ REFRESH MODE
        if already_applied and refresh and migration.refresh:
            # await log_message(f"♻️ REFRESH {migration.name}")
            await refresh_views(session, migration)
            await session.commit()
            await log_message(f"♻️ rafraîchie -> v{migration.revision}: {migration.views[0]}")
            return True

        # 4️⃣ CREATE MODE
        if not already_applied:
            # await log_message(f"⚡ CREATE {migration.name}")
            try:
                await create_view(session, migration)
                await create_indexes(session, migration)
                await register_revision(session, migration)
                await session.commit()
                await log_message(f"✅ créée -> v{migration.revision}: {migration.views[0]}")
                return True
            except Exception as e:
                # 🔍 Détecte vue manquante dans l'erreur
                missing_view = extract_missing_relation(e)
                if missing_view:
                    dep_mig = find_migration_by_view(missing_view)
                    if not dep_mig:
                        raise RuntimeError(f"❌ Vue manquante '{missing_view}' sans migration associée") from e
                    
                    await log_message(f"⏳ Création automatique de la vue dépendante {dep_mig.name}")
                    # ⛔ éviter boucle infinie
                    if dep_mig.revision == migration.revision:
                        message = f"❌ Dépendance circulaire détectée ({dep_mig.revision} -> {dep_mig.views[0]})"
                        raise RuntimeError(message)

                    await log_message(f"⚠️ Vue manquante détectée: {missing_view}, création automatique de {dep_mig.name}")
                    # Crée la dépendance
                    await apply_view_migration(session, dep_mig, recreate=recreate, refresh=refresh, visited=visited)
                    await session.commit()
                    # Rejoue la migration courante
                    await log_message(f"🔁 Reprise de la migration {migration.name}")
                    return await apply_view_migration(session, migration, recreate=recreate, refresh=refresh, visited=visited)
                raise e  # autre erreur → on stop

        return True

    except Exception as e:
        await session.rollback()
        await log_message(f"❌ Migration error [{migration.name}]: {e}")
        return False

async def start_view_migrations_job(session: AsyncSession, migrations: List[BaseViewMigration], recreate: bool = False, refresh: bool = True):
    try:
        for migration in migrations:
                await apply_view_migration(session=session,migration=migration,recreate=recreate,refresh=refresh)

        await log_message("✅ Migrations terminées")

    except Exception:
        await log_message("❌ Migration interrompue")
        raise

# ENTRYPOINT
async def run_view_migrations(recreate: bool = False, refresh: bool = True):
    async with AsyncSessionLocal() as session:
        # await drop_revision_table(session)
        await init_revision_table(session)
        # stop_event = asyncio.Event()
        # spinner_task = asyncio.create_task(spinner("🔄 🚀 Migrations en cours", stop_event))

        migrations = sorted(MIGRATION_REGISTRY, key=lambda m: m.revision)
        await start_view_migrations_job(session=session, migrations=migrations, recreate=recreate, refresh=refresh)
        # stop_event.set() # Arrête le spinner
        # await spinner_task  # Attend la fin du spinner


if __name__ == "__main__":
    asyncio.run(run_view_migrations())
