from typing import Any, Dict, List, Optional

from sqlalchemy import text
from enum import Enum as PyEnum
from datetime import datetime, timezone
from backend.src.app.configs.extensions import db
from backend.src.app.models._controls import AuditMixin
from sqlalchemy.dialects.postgresql import JSONB

from backend.src.projects.analytics_manager.logger import get_backend_logger
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
class DbObjectType(str, PyEnum):
    TABLE = "table"
    VIEW = "view"
    MATVIEW = "matview"
    FUNCTION = "function"
    INDEX = "index"
    SEQUENCE = "sequence"
    FOREIGN_TABLE = "foreign_table"

    @classmethod
    def list(cls):
        return [e.value for e in cls]


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
    view_name = db.Column(db.String(255), nullable=False)
    options = db.Column(JSONB,nullable=False,server_default=text("'{}'::jsonb"))
    description = db.Column(db.Text)
    sql_type = db.Column(db.String(50),nullable=False,default=DbObjectType.MATVIEW.value)
    tenant_id = db.Column(db.BigInteger,db.ForeignKey("tenants.id", ondelete="CASCADE"),nullable=False)
    datasource_id = db.Column(db.BigInteger,db.ForeignKey("datasources.id", ondelete="RESTRICT"),nullable=False)
    connection_id = db.Column(db.BigInteger,db.ForeignKey("datasource_connections.id", ondelete="RESTRICT"),nullable=True)
    sql = db.Column(db.Text, nullable=True)
    values = db.Column(JSONB,nullable=False,server_default=text("'{}'::jsonb"))
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
    tenant = db.relationship("Tenant", back_populates="datasets",lazy="noload",foreign_keys=[tenant_id])
    datasource = db.relationship("DataSource", back_populates="datasets",lazy="noload",foreign_keys=[datasource_id])
    connection = db.relationship("DataSourceConnection", back_populates="datasets",lazy="noload",foreign_keys=[connection_id])
    validated_by = db.relationship("User",lazy="noload",foreign_keys=[validated_by_id])
    
    fields = db.relationship("DatasetField",back_populates="dataset",cascade="all, delete-orphan",lazy="noload",passive_deletes=True)
    queries = db.relationship("DatasetQuery",back_populates="dataset",cascade="all, delete-orphan",lazy="noload",passive_deletes=True)
    charts = db.relationship("DatasetChart", back_populates="dataset",cascade="all, delete-orphan",lazy="noload",passive_deletes=True)
    all_versioned = db.relationship("DatasetVersioned", back_populates="dataset",cascade="all, delete-orphan",lazy="noload",passive_deletes=True)
    visualization_charts = db.relationship("VisualizationChart", back_populates="dataset", lazy="noload", cascade="all, delete-orphan")
    data_targets = db.relationship("DataTarget",back_populates="dataset",cascade="all, delete-orphan",lazy="noload",passive_deletes=True)
    
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
            "tenant_id": self.tenant_id,
            "datasource_id": self.datasource_id,
            "connection_id": self.connection_id,
            "is_active": self.is_active,
            "is_public": self.is_public,
            "is_validated": self.is_validated,
            "validated_at": self.validated_at,
            "validated_by_id": self.validated_by_id,
            "sql": self.sql,
            "columns": self.columns,
            "version": self.version,
            "parent_id": self.parent_id,  
            "options": self.options, 
            "values": self.values, 
            "refresh": self.refresh, 
            "description": self.description,
            # "roles_allowed": self.roles_allowed,
        }

        if include_relations:
            data.update({
                "parent": self.parent.to_dict(include_relations=False) if self.parent else None,
                "tenant": self.tenant.to_dict(include_relations=False) if self.tenant else None,
                "connection": self.connection.to_dict(include_relations=False) if self.connection else None,
                "datasource": self.datasource.to_dict(include_relations=False) if self.datasource else None,
                "fields": [f.to_dict(include_relations=False) for f in self.fields or []],
                "queries": [q.to_dict(include_relations=False) for q in self.queries or []],
                "charts": [c.to_dict(include_relations=False) for c in self.charts or []],
                "all_versioned": [v.to_dict(include_relations=False) for v in self.all_versioned or []],
                "visualization_charts": [v.to_dict(include_relations=False) for v in self.visualization_charts or []],
            })

        return data


# DATASET
class DatasetVersioned(db.Model):
    __tablename__ = "datasets_versioned"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    dataset_id = db.Column(db.BigInteger,db.ForeignKey("datasets.id", ondelete="CASCADE"),nullable=True)
    sql = db.Column(db.Text, nullable=True)
    values = db.Column(JSONB,nullable=False,server_default=text("'{}'::jsonb"))
    version = db.Column(db.BigInteger, nullable=False, default=1)
    options = db.Column(JSONB,nullable=False,server_default=text("'{}'::jsonb"))

    dataset = db.relationship("Dataset", back_populates="all_versioned",lazy="noload",foreign_keys=[dataset_id])

    archived_by = db.Column(db.BigInteger, db.ForeignKey("users.id"), nullable=False)
    archived_at = db.Column(db.DateTime(timezone=True), server_default=db.func.now(), nullable=False)

    # SERIALIZATION
    def to_dict(self, include_relations:bool=True):
        data = {
            "id": self.id,
            "dataset_id": self.dataset_id,
            "sql": self.sql,
            "values": self.values, 
            "version": self.version,
            "options": self.options, 
            "archived_by": self.archived_by,
            "archived_at": self.archived_at,
        }

        if include_relations:
            data.update({
                "dataset": self.dataset.to_dict(include_relations=False) if self.dataset else None,
            })

        return data


# DATASET FIELD
class DatasetField(db.Model, AuditMixin):
    __tablename__ = "dataset_fields"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id = db.Column(db.BigInteger,db.ForeignKey("tenants.id", ondelete="CASCADE"),nullable=False)
    dataset_id = db.Column(db.BigInteger,db.ForeignKey("datasets.id", ondelete="CASCADE"),nullable=False,index=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)

    raw_field = db.Column(JSONB,nullable=False,server_default=text("'{}'::jsonb")) #{"name": "hhhk;", "type": "dfdf"}

    # Expression SQL (colonne brute ou formule)
    expression = db.Column(db.Text, nullable=False)
    # Agrégation (utile uniquement pour metrics)
    aggregation = db.Column(db.String(50), nullable=True)
    # Type dimension / metric
    field_type = db.Column(db.String(50),nullable=False)
    # Optionnel : type logique (string, number, date…)
    data_type = db.Column(db.String(50), nullable=False)

    format = db.Column(JSONB,nullable=False,server_default=text("'{}'::jsonb")) # {"type": "currency", "currency": "USD", "precision": 2 }
        
    is_public = db.Column(db.Boolean, nullable=False, default=False)
    is_filterable = db.Column(db.Boolean, nullable=False, default=False)
    is_groupable = db.Column(db.Boolean, nullable=False, default=False)
    is_sortable = db.Column(db.Boolean, nullable=False, default=False)
    is_selectable = db.Column(db.Boolean, nullable=False, default=False)
    is_hidden = db.Column(db.Boolean, nullable=False, default=False)

    tenant = db.relationship("Tenant", back_populates="fields", lazy="noload",foreign_keys=[tenant_id])
    dataset = db.relationship("Dataset", back_populates="fields", lazy="noload",foreign_keys=[dataset_id])

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
            "raw_field": self.raw_field,
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
        return f"<DatasetField {self.name} ({self.field_type})>"

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

    sql_type = db.Column(db.String(50), nullable=False, default=DbObjectType.MATVIEW.value)

    is_validated = db.Column(db.Boolean, nullable=False, default=False)
    validated_at = db.Column(db.DateTime(timezone=True))

    cache = db.Column(JSONB,nullable=False,server_default=text("'{}'::jsonb")) # { "enabled": true, "ttl_seconds": 300 }
    fields_ids = db.Column(JSONB,nullable=False,server_default=text("'[]'::jsonb"))

    dataset = db.relationship("Dataset", back_populates="queries", lazy="noload",foreign_keys=[dataset_id])
    tenant = db.relationship("Tenant", back_populates="queries", lazy="noload",foreign_keys=[tenant_id])
    
    data_targets = db.relationship("DataTarget",back_populates="dataset_query",cascade="all, delete-orphan",lazy="noload",passive_deletes=True)


    charts = db.relationship(
        "DatasetChart",
        back_populates="dataset_query",
        cascade="all, delete-orphan",
        lazy="noload",
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
            "fields_ids": self.fields_ids,
        }

        if include_relations:
            data.update({
                "fields": [f.to_dict(include_relations=False) for f in self.dataset.fields] if self.dataset and self.dataset.fields else None,
                "dataset": self.dataset.to_dict(include_relations=False) if self.dataset else None,
                "tenant": self.tenant.to_dict(include_relations=False) if self.tenant else None,
                "data_targets": [c.to_dict() for c in self.data_targets or []],
            })

        return data

    def __repr__(self):
        return f"<DatasetQuery id={self.id} validated={self.is_validated}>"
