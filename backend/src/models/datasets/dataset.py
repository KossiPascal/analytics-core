from typing import Any, Dict, List, Optional

from sqlalchemy import text
from enum import Enum as PyEnum
from datetime import datetime, timezone
from backend.src.databases.extensions import db
from backend.src.models.controls import AuditMixin
from sqlalchemy.dialects.postgresql import JSONB

from backend.src.logger import get_backend_logger
logger = get_backend_logger(__name__)
from jsonschema import validate, ValidationError

BASE_SCHEMA = {
    "type": "object",
    "properties": {
        "semantic": {"type": "object"},
        "visual": {"type": "object"},
        "interaction": {"type": "object"},
        "advanced": {"type": "object"}
    },
    "required": ["semantic"]
}

# ENUMS
class DatasetSqlType(str, PyEnum):
    TABLE = "table"
    VIEW = "view"
    MATVIEW = "matview"
    FUNCTION = "function"
    INDEX = "index"

class FieldType(str, PyEnum):
    DIMENSION = "dimension"
    CALCUL_METRIC = "calculated_metric"
    METRIC = "metric"

class ChartType(str, PyEnum):
    BAR = "bar"
    LINE = "line"
    PIE = "pie"
    TABLE = "table"
    AREA = "area"
    KPI = "kpi"

# DATASET
class Dataset(db.Model, AuditMixin):
    __tablename__ = "datasets"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255), nullable=False)
    view_name = db.Column(db.String(255), nullable=True)
    description = db.Column(db.Text)

    sql_type = db.Column(db.String(50),nullable=False,default=DatasetSqlType.MATVIEW.value)
    tenant_id = db.Column(db.BigInteger,db.ForeignKey("tenants.id", ondelete="CASCADE"),nullable=False)
    datasource_id = db.Column(db.BigInteger,db.ForeignKey("datasources.id", ondelete="RESTRICT"),nullable=False)
    connection_id = db.Column(db.BigInteger,db.ForeignKey("datasource_connections.id", ondelete="RESTRICT"),nullable=True)

    use_local_view = db.Column(db.Boolean, nullable=False, default=False)
    sql = db.Column(db.Text, nullable=True)
    columns = db.Column(JSONB,nullable=False,server_default=text("'[]'::jsonb"))

    refresh = db.Column(JSONB,nullable=False,server_default=text("'{}'::jsonb"))

    is_public = db.Column(db.Boolean, nullable=False, default=False)
    roles_allowed = db.Column(JSONB,nullable=False,server_default=text("'[]'::jsonb"))

    is_validated = db.Column(db.Boolean, nullable=False, default=False)
    validated_at = db.Column(db.DateTime(timezone=True))
    validated_by_id = db.Column(db.BigInteger, db.ForeignKey("users.id"))

    version = db.Column(db.BigInteger, nullable=False, default=1)
    parent_id = db.Column(db.BigInteger, db.ForeignKey("datasets.id", ondelete="SET NULL"))

    # RELATIONS
    tenant = db.relationship("Tenant", back_populates="datasets",lazy="selectin",foreign_keys=[tenant_id])
    datasource = db.relationship("DataSource", back_populates="datasets",lazy="selectin",foreign_keys=[datasource_id])
    connection = db.relationship("DataSourceConnection", back_populates="datasets",lazy="selectin",foreign_keys=[connection_id])
    validated_by = db.relationship("User",lazy="selectin",foreign_keys=[validated_by_id])
    
    fields = db.relationship("DatasetField",back_populates="dataset",cascade="all, delete-orphan",lazy="selectin",passive_deletes=True)
    queries = db.relationship("DatasetQuery",back_populates="dataset",cascade="all, delete-orphan",lazy="selectin",passive_deletes=True)
    charts = db.relationship("DatasetChart", back_populates="dataset",cascade="all, delete-orphan",lazy="selectin",passive_deletes=True)
    
    parent = db.relationship("Dataset",remote_side=[id],backref=db.backref("children", passive_deletes=True))

    __mapper_args__ = { "version_id_col": version }

    __table_args__ = (
        db.UniqueConstraint("tenant_id","name",name="uq_dataset_name_per_tenant"),
    )

    def mark_validated(self, user_id: int):
        self.is_validated = True
        self.validated_at = datetime.now(timezone.utc)
        self.validated_by_id = user_id

    @staticmethod
    def local_views():
        query = """
            SELECT schemaname, viewname AS name, 'view' AS type
            FROM pg_views
            WHERE schemaname = 'public'

            UNION ALL

            SELECT schemaname, matviewname AS name, 'matview' AS type
            FROM pg_matviews
            WHERE schemaname = 'public'
            ORDER BY type, name
        """

        results = db.session.execute(text(query)).fetchall()

        return [{"name":r.name, "type":r.type} for r in results]

    # SERIALIZATION
    def to_dict(self, include_relations:bool=True):
        data = {
            "id": self.id,
            "name": self.name,
            "view_name": self.view_name,
            "sql_type": self.sql_type,
            "use_local_view": self.use_local_view,
            "tenant_id": self.tenant_id,
            "datasource_id": self.datasource_id,
            "connection_id": self.connection_id,
            "is_active": self.is_active,
            "is_validated": self.is_validated,
            "validated_at": self.validated_at,
            "validated_by_id": self.validated_by_id,
            "sql": self.sql,
            "columns": self.columns,
            "version": self.version,
            "parent_id": self.parent_id,
        }

        # # hasEngine = bool(self.sql is None and self.view_name)
        # # data["sql"] = Dataset.get_view_sql_endpoint() if hasEngine else self.sql
        # sql_endpoint = Dataset.get_view_sql_endpoint(self.view_name, self.sql_type)
        # if sql_endpoint:
        #     data["sql"] = sql_endpoint.get('sql')
        #     data["columns"] = sql_endpoint.get("columns"),
            
        if include_relations:
            data.update({
                "tenant": self.tenant.to_dict(include_relations=False) if self.tenant else None,
                "connection": self.connection.to_dict(include_relations=False) if self.connection else None,
                "datasource": self.datasource.to_dict(include_relations=False) if self.datasource else None,
                "fields": [f.to_dict(include_relations=False) for f in self.fields],
                "queries": [q.to_dict(include_relations=False) for q in self.queries],
                # "children": [c.id for c in self.children],
            })

        return data

    @staticmethod
    def get_view_sql_endpoint(view_name:Optional[str]=None,sql_type:Optional[str]=None,schema: str = "public") -> (Dict[str, Any] | None):
        """
        Récupère le SQL réel de la view/table/function en base de données
        à partir de view_name et sql_type.
        """
        if not view_name or not sql_type:
            raise ValueError('view_name or sql_type is required !')
        
        viewname = view_name.lower()

        query = None
        if sql_type == DatasetSqlType.VIEW.value:
            query = """
                SELECT definition
                FROM pg_views
                WHERE schemaname = 'public' AND viewname = :view_name
            """
        elif sql_type == DatasetSqlType.MATVIEW.value:
            query = """
                SELECT definition
                FROM pg_matviews
                WHERE schemaname = 'public' AND matviewname = :view_name
            """
        elif sql_type == DatasetSqlType.FUNCTION.value:
            query = f"""
                SELECT pg_get_functiondef(p.oid) AS definition
                FROM pg_proc p
                JOIN pg_namespace n ON n.oid = p.pronamespace
                WHERE n.nspname = 'public' AND p.proname = :view_name
            """
        elif sql_type == DatasetSqlType.TABLE.value:
            # Pour une table, on peut reconstruire CREATE TABLE via pg_dump ou information_schema
            query = f"""
                SELECT 'table: ' || table_name AS definition
                FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name = :view_name
            """
        else:
            # Index et autres types → pas géré ici
            return None

        result = db.session.execute(text(query), {"view_name": viewname}).fetchone()
        columns = Dataset.dataset_columns(view_name,schema)

        return {
            "sql": result[0] if result else None,
            "columns": columns if columns else []
        }

    # @staticmethod  
    # def manage_materialized_view(engine, dataset, replace_if_exists: bool = False, refresh: bool = False):
    #     """
    #     Crée ou met à jour une materialized view PostgreSQL de façon sécurisée.

    #     Args:
    #         engine: SQLAlchemy engine
    #         dataset: instance Dataset (dataset.sql doit être validé)
    #         replace_if_exists: si True, remplace la MATVIEW existante
    #         refresh: si True, rafraîchit la MATVIEW existante
    #     """
    #     view_name = dataset.name.lower()

    #     # 1️⃣ Vérifier existence de la MATVIEW
    #     check_sql = text("""
    #         SELECT 1
    #         FROM pg_matviews
    #         WHERE schemaname = 'public' AND matviewname = :view_name
    #     """)
        
    #     with engine.connect() as conn:
    #         exists = conn.execute(check_sql, {"view_name": view_name}).fetchone() is not None

    #         if exists:
    #             logger.info(f"Materialized view '{view_name}' exists in DB")
    #             if replace_if_exists:
    #                 # ✅ Remplacer en validant le SQL
    #                 validator = QueryValidator(query_json=None, fields=dataset.fields)
    #                 compiled_sql = validator.validate_and_compile(dataset.sql)
    #                 create_sql = f"CREATE OR REPLACE MATERIALIZED VIEW {view_name} AS {compiled_sql}"
    #                 logger.info(f"Replacing MATVIEW '{view_name}'")
    #                 conn.execute(text(create_sql))
    #             elif refresh:
    #                 # ✅ Rafraîchir la vue existante
    #                 refresh_sql = f"REFRESH MATERIALIZED VIEW CONCURRENTLY {view_name}"
    #                 logger.info(f"Refreshing MATVIEW '{view_name}'")
    #                 conn.execute(text(refresh_sql))
    #             else:
    #                 logger.info(f"No action taken for MATVIEW '{view_name}'")
    #         else:
    #             # 2️⃣ Créer la MATVIEW si absente
    #             validator = QueryValidator(query_json=None, fields=dataset.fields)
    #             compiled_sql = validator.validate_and_compile(dataset.sql)
    #             create_sql = f"CREATE MATERIALIZED VIEW {view_name} AS {compiled_sql}"
    #             logger.info(f"Creating MATVIEW '{view_name}'")
    #             conn.execute(text(create_sql))

    @staticmethod
    def dataset_columns(view_name: str,schema: str = "public") -> List[Dict[str, str]]:

        if not view_name:
            return []

        query = """
            SELECT
                a.attname AS column_name,
                pg_catalog.format_type(a.atttypid, a.atttypmod) AS data_type
            FROM pg_attribute a
            JOIN pg_class c ON a.attrelid = c.oid
            JOIN pg_namespace n ON c.relnamespace = n.oid
            WHERE c.relname = :view_name
              AND n.nspname = :schema
              AND a.attnum > 0
              AND NOT a.attisdropped
            ORDER BY a.attnum;
        """

        result = db.session.execute(
            text(query),
            { "view_name": view_name, "schema": schema },
        ).mappings().all()

        return [
            { 
                "name": row["column_name"], 
                "type": Dataset._map_pg_type(row["data_type"]),
            }
            for row in result
        ]

    @staticmethod
    def _map_pg_type(pg_type: str) -> str:
        pg_type = pg_type.lower()

        if any(t in pg_type for t in ["int", "numeric", "decimal", "real", "double"]):
            return "number"
        if any(t in pg_type for t in ["timestamp", "date", "time"]):
            return "datetime"
        if "bool" in pg_type:
            return "boolean"
        return "string"

# DATASET FIELD
class DatasetField(db.Model, AuditMixin):
    __tablename__ = "dataset_fields"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id = db.Column(db.BigInteger,db.ForeignKey("tenants.id", ondelete="CASCADE"),nullable=False)
    dataset_id = db.Column(db.BigInteger,db.ForeignKey("datasets.id", ondelete="CASCADE"),nullable=False,index=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)

    # Expression SQL (colonne brute ou formule)
    expression = db.Column(db.Text, nullable=False)
    # Agrégation (utile uniquement pour metrics)
    aggregation = db.Column(db.String(50), nullable=True)
    # Type dimension / metric
    field_type = db.Column(db.String(50),nullable=False)
    # Optionnel : type logique (string, number, date…)
    data_type = db.Column(db.String(50), nullable=True)

    format = db.Column(JSONB,nullable=False,server_default=text("'{}'::jsonb")) # {"type": "currency", "currency": "USD", "precision": 2 }
    
    is_public = db.Column(db.Boolean, nullable=False, default=False)
    is_filterable = db.Column(db.Boolean, nullable=False, default=False)
    is_groupable = db.Column(db.Boolean, nullable=False, default=False)
    is_sortable = db.Column(db.Boolean, nullable=False, default=False)
    is_selectable = db.Column(db.Boolean, nullable=False, default=False)
    is_hidden = db.Column(db.Boolean, nullable=False, default=False)

    tenant = db.relationship("Tenant", back_populates="fields", lazy="selectin",foreign_keys=[tenant_id])
    dataset = db.relationship("Dataset", back_populates="fields", lazy="selectin",foreign_keys=[dataset_id])

    __table_args__ = (
        db.UniqueConstraint("dataset_id", "name", name="uq_dataset_field"),
        # db.Index("idx_field_dataset_type", "dataset_id", "field_type"),
        db.CheckConstraint(
            "(field_type = 'metric' AND aggregation IS NOT NULL) OR "
            "(field_type = 'dimension') OR "
            "(field_type = 'calculated_metric')",
            name="ck_metric_requires_aggregation",
        ),
    )

    def ensure_same_tenant(self):
        if self.dataset and self.dataset.tenant_id != self.tenant_id:
            raise ValueError("Tenant mismatch between Dataset and DatasetField")

    @property
    def is_dimension(self):
        return self.field_type == FieldType.DIMENSION.value

    @property
    def is_metric(self):
        return self.field_type == FieldType.METRIC.value or self.field_type == FieldType.CALCUL_METRIC.value

    def to_dict(self, include_relations:bool=True):
        data = {
            "id": self.id,
            "name": self.name,
            "tenant_id": self.tenant_id,
            "dataset_id": self.dataset_id,
            "description": self.description,
            "expression": self.expression,
            "aggregation": self.aggregation,
            "field_type": self.field_type,
            "data_type": self.data_type,
            "format": self.format,
            "is_public": self.is_public,
            "is_dimension": self.is_dimension,
            "is_metric": self.is_metric,
            "is_filterable": self.is_filterable,
            "is_groupable": self.is_groupable,
            "is_sortable": self.is_sortable,
            "is_selectable": self.is_selectable,
            "is_hidden": self.is_hidden,
            "is_active": self.is_active,
        }

        if include_relations:
            data.update({
                "dataset": self.dataset.to_dict(include_relations=False) if self.dataset else None,
                "tenant": self.tenant.to_dict(include_relations=False) if self.tenant else None,
            })

        return data

    def __repr__(self):
        return f"<DatasetField {self.name} ({self.field_type.value})>"

# DATASET QUERY
class DatasetQuery(db.Model, AuditMixin):
    __tablename__ = "dataset_queries"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    tenant_id = db.Column(db.BigInteger,db.ForeignKey("tenants.id", ondelete="CASCADE"),nullable=False)
    dataset_id = db.Column(db.BigInteger,db.ForeignKey("datasets.id", ondelete="CASCADE"),nullable=False,index=True)
    query_json = db.Column(JSONB,nullable=False,server_default=text("'{}'::jsonb"))
    values = db.Column(JSONB,nullable=False,server_default=text("'{}'::jsonb"))
    
    compiled_sql = db.Column(db.Text)

    sql_type = db.Column(db.String(50), nullable=False, default=DatasetSqlType.MATVIEW.value)

    is_validated = db.Column(db.Boolean, nullable=False, default=False)
    validated_at = db.Column(db.DateTime(timezone=True))

    cache = db.Column(JSONB,nullable=False,server_default=text("'{}'::jsonb")) # { "enabled": true, "ttl_seconds": 300 }

    dataset = db.relationship("Dataset", back_populates="queries", lazy="selectin",foreign_keys=[dataset_id])
    tenant = db.relationship("Tenant", back_populates="queries", lazy="selectin",foreign_keys=[tenant_id])
    # charts = db.relationship(
    #     "DatasetChart",
    #     secondary="visualization_charts",
    #     primaryjoin="DatasetQuery.dataset_id==VisualizationChart.visualization_id",
    #     secondaryjoin="VisualizationChart.chart_id==Chart.id",
    #     viewonly=True
    # )

    charts = db.relationship(
        "DatasetChart",
        back_populates="dataset_query",
        cascade="all, delete-orphan",
        lazy="selectin",
        passive_deletes=True,
        foreign_keys="DatasetChart.query_id",
    )

    __table_args__ = (
        db.UniqueConstraint("id", "dataset_id", name="uq_query_id_dataset"),
        db.Index("idx_query_dataset", "dataset_id"),
    )

    def mark_validated(self):
        self.is_validated = True
        self.validated_at = datetime.now(timezone.utc)

    def ensure_same_tenant(self):
        if self.dataset and self.dataset.tenant_id != self.tenant_id:
            raise ValueError("Tenant mismatch between Dataset and DatasetQuery")

    # def validate(self):
    #     try:
    #         validator = QueryValidator(
    #             query_json=self.query_json,
    #             fields=self.dataset.fields
    #         )
    #         validator.validate_all()
    #         self.is_validated = True
    #         self.validated_at = datetime.now(timezone.utc)
    #     except Exception as e:
    #         logger.error(f"Validation failed for query {self.id}: {e}")
    #         raise

    # def compile(self, engine):
    #     """Compile uniquement une query validée"""
    #     if not self.is_validated:
    #         raise ValueError("DatasetQuery must be validated before compilation")

    #     self.compiled_sql = engine.compile(self.query_json,self.dataset.fields)
    #     return self.compiled_sql

    def to_dict(self, include_relations=True):
        data = {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "tenant_id": self.tenant_id,
            "dataset_id": self.dataset_id,
            "query_json": self.query_json,
            "compiled_sql": self.compiled_sql,
            "values": self.values,
            "is_validated": self.is_validated,
            "validated_at": self.validated_at,
            "is_active": self.is_active,
            "cache": self.cache,
        }

        if include_relations:
            data.update({
                "fields": [f.to_dict(include_relations=False) for f in self.dataset.fields] if self.dataset and self.dataset.fields else None,
                "dataset": self.dataset.to_dict(include_relations=False) if self.dataset else None,
                "tenant": self.tenant.to_dict(include_relations=False) if self.tenant else None,
                # "charts": [c.to_dict() for c in self.charts] if self.charts else None,
            })

        return data

    def __repr__(self):
        return f"<DatasetQuery id={self.id} validated={self.is_validated}>"
