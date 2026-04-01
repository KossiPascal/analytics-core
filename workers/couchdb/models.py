from typing import Type, Any
from sqlalchemy import inspect, text
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.exc import ProgrammingError, OperationalError
from shared_libs.helpers.utils import normalize_name
from sqlalchemy.dialects.postgresql import JSONB

from workers.logger import get_workers_logger
logger = get_workers_logger(__name__)

class CreateTableModel:
    """
    Gestion des tables dynamiques pour chaque source/projet dans Flask + SQLAlchemy.
    Fournit création, vérification, suppression et listing.
    """

    def __init__(self, db: SQLAlchemy, source_name: str, create_table: bool = False):
        self.db = db
        self.source_name = normalize_name(source_name)
        self._models: dict[str, Any] = {}
        self.create_table = create_table

    
    def source_tablename(self, localdb: str):
        return normalize_name(f"{self.source_name}_{localdb}")
    
    def sync_states_tablename(self):
        return normalize_name(f"{self.source_name}_sync_states")
    
    def sync_status_tablename(self):
        return normalize_name(f"{self.source_name}_sync_status")
    
    # Création des tables dynamiques
    def create_source_table(self, localdb: str, create_table: bool = False) -> tuple[Any, str]:
        table_name = self.source_tablename(localdb)

        if table_name in self._models:
            return self._models[table_name], table_name

        class_name = f"SourceDataTable_{table_name}"

        # ⚡ Création dynamique de la classe
        attrs = {
            "__tablename__": table_name,
            "__table_args__": {"extend_existing": True},
            "id": self.db.Column(self.db.Text, primary_key=True, nullable=False),
            "tenant_id": self.db.Column(self.db.BigInteger,self.db.ForeignKey("tenants.id", ondelete="CASCADE"),nullable=False),
            "source_id": self.db.Column(self.db.BigInteger,self.db.ForeignKey("country_datasource.id", ondelete="CASCADE"),nullable=False),
            "doc": self.db.Column(JSONB, nullable=False, server_default=text("'{}'::jsonb")),
            "form": self.db.Column(self.db.String(255), nullable=True),
            "type": self.db.Column(self.db.Text, nullable=True),
            "reported_date": self.db.Column(self.db.BigInteger, nullable=True),  # timestamp brut
        }

        # Méthode __repr__ claire
        def _repr(self):
            return f"<{table_name}(id={self.id},form={self.form},type={self.type})>"
        
        attrs["__repr__"] = _repr

        SourceDataTable = type(class_name, (self.db.Model,), attrs)

        return self._register_table(SourceDataTable, table_name, create_table)

    def create_sync_states_table(self, create_table: bool = False) -> tuple[Any, str]:
        table_name = self.sync_states_tablename()

        if table_name in self._models:
            return self._models[table_name], table_name

        class_name = f"SourceLastSyncStateTable_{table_name}"

        attrs = {
            "__tablename__": table_name,
            "__table_args__": {"extend_existing": True},
            "id": self.db.Column(self.db.BigInteger, primary_key=True, autoincrement=True),
            "tenant_id": self.db.Column(self.db.BigInteger,self.db.ForeignKey("tenants.id", ondelete="CASCADE"),nullable=False),
            "source_id": self.db.Column(self.db.BigInteger,self.db.ForeignKey("country_datasource.id", ondelete="CASCADE"),nullable=False),
            "dbname": self.db.Column(self.db.String(100), nullable=False),
            "last_seq": self.db.Column(self.db.Text, nullable=True),
            "last_sync_at": self.db.Column(self.db.DateTime(timezone=True), nullable=True),
        }

        def _repr(self):
            return f"<{table_name}(tenant_id={self.tenant_id},source_id={self.source_id},last_seq={self.last_seq})>"
        
        attrs["__repr__"] = _repr

        SourceLastSyncStateTable = type(class_name, (self.db.Model,), attrs)

        return self._register_table(SourceLastSyncStateTable, table_name, create_table)

    def create_sync_status_table(self, create_table: bool = False) -> tuple[Any, str]:
        table_name = self.sync_status_tablename()

        if table_name in self._models:
            return self._models[table_name], table_name

        class_name = f"SourceSyncStatusTable_{table_name}"

        attrs = {
            "__tablename__": table_name,
            "__table_args__": {"extend_existing": True},
            "id": self.db.Column(self.db.BigInteger, primary_key=True, autoincrement=True),
            "tenant_id": self.db.Column(self.db.BigInteger,self.db.ForeignKey("tenants.id", ondelete="CASCADE"),nullable=False),
            "source_id": self.db.Column(self.db.BigInteger,self.db.ForeignKey("country_datasource.id", ondelete="CASCADE"),nullable=False),
            "dbname": self.db.Column(self.db.String(100), nullable=False),
            "message": self.db.Column(self.db.Text, nullable=True),
            "action": self.db.Column(self.db.Text, nullable=True),  # INSERT, UPDATE, DELETE, ERROR
            "status": self.db.Column(self.db.String(32), nullable=False),  # STARTED, SUCCESS, ERROR
            "started_at": self.db.Column(self.db.DateTime(timezone=True), server_default=self.db.func.now(), nullable=False),
            "finished_at": self.db.Column(self.db.DateTime(timezone=True), nullable=True),
        }

        def _repr(self):
            return f"<{table_name}(id={self.id},tenant_id={self.tenant_id},source_id={self.source_id},status={self.status})>"
        attrs["__repr__"] = _repr

        SourceSyncStatusTable = type(class_name, (self.db.Model,), attrs)

        return self._register_table(SourceSyncStatusTable, table_name, create_table)


    def _register_table(self, model: Type[Any], table_name: str, create_table: bool = False):
        # ⚡ Crée la table si demandé

        exists = self.table_exists(table_name)

        must_create = not exists or self.create_table or create_table

        if must_create and table_name not in self._models:
            try:
                model.__table__.create(self.db.engine, checkfirst=True)
                logger.info(f"Table '{model.__tablename__}' ready.")
            except (ProgrammingError, OperationalError) as e:
                logger.error(f"[ERROR] Création table '{model.__tablename__}': {e}")
                raise

        # ⚡ Enregistrement du modèle pour éviter recréation
        self._models[table_name] = model
        return model, table_name

    # Méthodes utilitaires publiques
    def table_exists(self, table_name: str) -> bool:
        inspector = inspect(self.db.engine)
        return table_name in inspector.get_table_names()

    def drop_table(self, table_class: Type[Any]):
        try:
            table_class.__table__.drop(self.db.engine, checkfirst=True)
            logger.info(f"Table '{table_class.__tablename__}' dropped.")
        except (ProgrammingError, OperationalError) as e:
            logger.error(f"[ERROR] Suppression table '{table_class.__tablename__}': {e}")
            raise

    def list_dynamic_tables(self, prefix: str = "") -> list[str]:
        inspector = inspect(self.db.engine)
        tables = inspector.get_table_names()
        if prefix:
            tables = [t for t in tables if t.startswith(prefix)]
        return tables

