from sqlalchemy import text
from enum import Enum as PyEnum
from datetime import datetime, timezone
from backend.src.databases.extensions import db
from backend.src.models.datasource import AuditMixin
from backend.src.logger import get_backend_logger
from sqlalchemy.dialects.postgresql import JSONB

logger = get_backend_logger(__name__)


class VisualizationStatus(str, PyEnum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    REVIEWED = "reviewed"
    APPROVED = "approved"
    PUBLISHED = "published"
    ARCHIVED = "archived"

class VisualizationState(str, PyEnum):
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    CANCELED = "canceled"

class LineageOperation(str, PyEnum):
    DERIVED_FROM = "derived_from"
    AGGREGATED = "aggregated"
    FILTERED = "filtered"


class Visualization(db.Model, AuditMixin):
    __tablename__ = "visualizations"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    parent_id = db.Column(db.BigInteger,db.ForeignKey("visualizations.id",ondelete="SET NULL"),nullable=True)
   
    name = db.Column(db.String(255), nullable=False)
    type = db.Column(db.String(50), nullable=False)  # dashboard | report
    description = db.Column(db.Text)
    status = db.Column(db.Enum(VisualizationStatus, name="visualization_status"), nullable=False, default=VisualizationStatus.DRAFT)

    is_template = db.Column(db.Boolean, default=False)

    tenant = db.relationship("Tenant", back_populates="visualizations", lazy="noload", foreign_keys=[tenant_id])
    parent = db.relationship("Visualization",remote_side=[id],backref=db.backref("children", lazy="joined"))
    
    charts = db.relationship("VisualizationChart", back_populates="visualization",lazy="noload", cascade="all, delete-orphan")
    executions = db.relationship("VisualizationExecution", back_populates="visualization",lazy="noload", cascade="all, delete-orphan")
    shares = db.relationship("VisualizationShare", back_populates="visualization", lazy="noload", cascade="all, delete-orphan")
    views = db.relationship("VisualizationView", back_populates="visualization",lazy="noload", cascade="all, delete-orphan")
    targets = db.relationship("DataTarget", back_populates="visualization",lazy="noload", cascade="all, delete-orphan")
    definitions = db.relationship("VisualizationDefinition", back_populates="visualization",lazy="noload", cascade="all, delete-orphan")
    layouts = db.relationship("VisualizationLayout", back_populates="visualization",lazy="noload", cascade="all, delete-orphan")
    dhis2_validations = db.relationship("VisualizationDhis2Validation", back_populates="visualization",lazy="noload", cascade="all, delete-orphan")

    __table_args__ = (
        db.UniqueConstraint("tenant_id", "name", name="uq_visualization_tenant_name"),
        db.Index("idx_visualization_tenant_status", "tenant_id", "status"),
    )
    
    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "parent_id": self.parent_id,
            "name": self.name,
            "type": self.type,
            "description": self.description,
            "status": self.status.value if self.status else None,
            "is_template": self.is_template,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "created_by": {"id": self.created_by.id, "name": self.created_by.username} if self.created_by else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

        if include_relations:
            base.update({
                "charts": [d.to_dict(include_relations=True) for d in  self.charts or []],
                "executions": [d.to_dict(include_relations=False) for d in  self.executions or []],
                "shares": [d.to_dict(include_relations=False) for d in  self.shares or []],
                "views": [d.to_dict(include_relations=False) for d in  self.views or []],
                "definitions": [d.to_dict(include_relations=False) for d in  self.definitions or []],
                "layouts": [d.to_dict(include_relations=False) for d in  self.layouts or []],
                "targets": [d.to_dict(include_relations=False) for d in  self.targets or []],
                "dhis2_validations": [d.to_dict(include_relations=False) for d in  self.dhis2_validations or []] if self.type == "report" else [],
            })

        return base

    def add_chart(self, chart, position=None):
        position = position or {"x": 0, "y": 0, "w": 4, "h": 4}
        vc = VisualizationChart(visualization=self, chart=chart, position=position)
        db.session.add(vc)
        return vc

    def remove_chart(self, chart_id):
        vc = next((c for c in self.charts if c.chart_id == chart_id), None)
        if vc:
            db.session.delete(vc)

    def set_publish(self):
        self.status = VisualizationStatus.PUBLISHED

    def set_archive(self):
        self.status = VisualizationStatus.ARCHIVED

    def set_draft(self):
        self.status = VisualizationStatus.DRAFT

    def __repr__(self):
        return f"<Visualization {self.type} id={self.id} name={self.name}>"

class VisualizationDefinition(db.Model, AuditMixin):
    __tablename__ = "visualization_definitions"

    id = db.Column(db.BigInteger, primary_key=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    visualization_id = db.Column(db.BigInteger, db.ForeignKey("visualizations.id", ondelete="CASCADE"), nullable=False)
    
    version = db.Column(db.Integer, nullable=False)
    config = db.Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    filters = db.Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))

    tenant = db.relationship("Tenant", back_populates="definitions", lazy="noload", foreign_keys=[tenant_id])
    visualization = db.relationship("Visualization", back_populates="definitions", lazy="noload", foreign_keys=[visualization_id])

    __table_args__ = (
        db.UniqueConstraint("visualization_id", "version"),
        db.Index("idx_definition_active", "visualization_id", "is_active"),
    )

    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "visualization_id": self.visualization_id,
            "version": self.version,
            "filters": self.filters or {},
            "config": self.config or {},
            "is_active": self.is_active,
        }

        if include_relations:
            base.update({
                "visualization": self.visualization.to_dict(include_relations=False) if self.visualization else None,
                "views": [v.to_dict(include_relations=False) for v in self.views or []],
            })

        return base

    def __repr__(self):
        return f"<VisualizationDefinition viz={self.visualization_id} id={self.id}>"
    
class VisualizationLayout(db.Model, AuditMixin):
    __tablename__ = "visualization_layouts"

    id = db.Column(db.BigInteger, primary_key=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    visualization_id = db.Column(db.BigInteger, db.ForeignKey("visualizations.id", ondelete="CASCADE"), nullable=False)
    
    version = db.Column(db.Integer, nullable=False)

    # ⚠️ uniquement structure visuelle
    layout = db.Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    options = db.Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))

    tenant = db.relationship("Tenant", back_populates="layouts", lazy="noload", foreign_keys=[tenant_id])
    visualization = db.relationship("Visualization", back_populates="layouts", lazy="noload", foreign_keys=[visualization_id])
    views = db.relationship("VisualizationView", back_populates="layout",lazy="noload", cascade="all, delete-orphan")

    # 🔥 NOUVELLE RELATION
    charts = db.relationship("VisualizationChart",back_populates="layout",cascade="all, delete-orphan",lazy="noload")

    __table_args__ = (
        db.UniqueConstraint("visualization_id", "tenant_id", "version"),
    )

    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "visualization_id": self.visualization_id,
            "version": self.version,
            "layout": self.layout or {"lg": [], "md": [], "sm":[]},
            "options": self.options or {},
        }

        if include_relations:
            base.update({
                "tenant": self.tenant.to_dict(include_relations=False) if self.tenant else None,
                "visualization": self.visualization.to_dict(include_relations=False) if self.visualization else None,
                "views": [v.to_dict(include_relations=False) for v in self.views or []],
                "charts": [v.to_dict(include_relations=False) for v in self.charts or []],
            })

        return base

    def __repr__(self):
        return f"<VisualizationChart viz={self.visualization_id} dataset={self.dataset_id}>"

class VisualizationChart(db.Model, AuditMixin):
    __tablename__ = "visualization_charts"

    id = db.Column(db.BigInteger, primary_key=True)
    chart_id = db.Column(db.BigInteger,db.ForeignKey("dataset_charts.id", ondelete="CASCADE"),nullable=False)
    tenant_id = db.Column(db.BigInteger,db.ForeignKey("tenants.id", ondelete="CASCADE"),nullable=False)
    dataset_id = db.Column(db.BigInteger,db.ForeignKey("datasets.id", ondelete="CASCADE"),nullable=False)
    visualization_id = db.Column(db.BigInteger,db.ForeignKey("visualizations.id", ondelete="CASCADE"),nullable=False)
    layout_id = db.Column(db.BigInteger,db.ForeignKey("visualization_layouts.id", ondelete="CASCADE"),nullable=False)

    # 🔥 lien avec le layout item
    position = db.Column(JSONB, nullable=False)  # { i: "block-id" }

    tenant = db.relationship("Tenant", back_populates="visualization_charts", lazy="noload", foreign_keys=[tenant_id])
    dataset = db.relationship("Dataset", back_populates="visualization_charts", lazy="noload", foreign_keys=[dataset_id])
    chart = db.relationship("DatasetChart", back_populates="visualization_charts",lazy="noload", foreign_keys=[chart_id])
    
    visualization = db.relationship("Visualization", back_populates="charts", lazy="noload", foreign_keys=[visualization_id])
    layout = db.relationship("VisualizationLayout", back_populates="charts", lazy="noload", foreign_keys=[layout_id])
    
    # __table_args__ = (
    #     db.UniqueConstraint("layout_id", "chart_id"),
    # )

    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "dataset_id": self.dataset_id,
            "visualization_id": self.visualization_id,
            "layout_id": self.layout_id,
            "chart_id": self.chart_id,
            "position": self.position or {"x":0,"y":0,"w":6,"h":4},
        }

        if include_relations:
            base.update({
                "tenant": self.tenant.to_dict(include_relations=False) if self.tenant else None,
                "dataset": self.dataset.to_dict(include_relations=False) if self.dataset else None,
                "visualization": self.visualization.to_dict(include_relations=False) if self.visualization else None,
                "layout": self.layout.to_dict(include_relations=False) if self.layout else None,
                "chart": self.chart.to_dict(include_relations=False) if self.chart else None,
            })

        return base

    def __repr__(self):
        return f"<VisualizationChart viz={self.visualization_id} dataset={self.dataset_id}> chart={self.chart_id}>"

class VisualizationView(db.Model, AuditMixin):
    __tablename__ = "visualization_views"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id"), nullable=False)
    visualization_id = db.Column(db.BigInteger, db.ForeignKey("visualizations.id", ondelete="CASCADE"), nullable=False)
    layout_id = db.Column(db.BigInteger, db.ForeignKey("visualization_layouts.id", ondelete="CASCADE"), nullable=False)

    name = db.Column(db.String(255), nullable=False)
    is_default = db.Column(db.Boolean, default=False)

    tenant = db.relationship("Tenant", back_populates="visualization_views", lazy="noload", foreign_keys=[tenant_id])
    visualization = db.relationship("Visualization", back_populates="views", lazy="noload", foreign_keys=[visualization_id])
    layout = db.relationship("VisualizationLayout", back_populates="views", lazy="noload", foreign_keys=[layout_id])

    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "visualization_id": self.visualization_id,
            "layout_id": self.layout_id,
            "name": self.name,
            "is_default": self.is_default,
        }

        if include_relations:
            base.update({
                "tenant": self.tenant.to_dict(include_relations=False) if self.tenant else None,
                "visualization": self.visualization.to_dict(include_relations=False) if self.visualization else None,
                "layout": self.layout.to_dict(include_relations=False) if self.layout else None,
            })

        return base

class VisualizationExecution(db.Model, AuditMixin):
    __tablename__ = "visualization_executions"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id"), nullable=False)
    visualization_id = db.Column(db.BigInteger, db.ForeignKey("visualizations.id", ondelete="CASCADE"), nullable=False)
    
    started_at = db.Column(db.DateTime(timezone=True))
    finished_at = db.Column(db.DateTime(timezone=True))
    
    executed_by_id = db.Column(db.BigInteger, db.ForeignKey("users.id"), nullable=True)
    state = db.Column(db.Enum(VisualizationState, name="visualization_state"), nullable=False,default=VisualizationState.PENDING)

    # 🔥 RESULTAT isolé
    result = db.Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))

    error = db.Column(db.Text)
    
    tenant = db.relationship("Tenant", back_populates="executions", lazy="noload", foreign_keys=[tenant_id])
    visualization = db.relationship("Visualization", back_populates="executions", lazy="noload", foreign_keys=[visualization_id])
    executed_by = db.relationship("User", foreign_keys=[executed_by_id], lazy="noload")
    
    logs = db.relationship("VisualizationExecutionLog", back_populates="execution", cascade="all, delete-orphan")

    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "visualization_id": self.visualization_id,
            "error": self.error,
            "state": self.state.value if self.state else None,
            "result": self.result,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "finished_at": self.finished_at.isoformat() if self.finished_at else None,
            "executed_by": {"id": self.executed_by.id, "name": self.executed_by.username} if self.executed_by else None,
        }

        if include_relations:
            base.update({
                "tenant": self.tenant.to_dict(include_relations=False) if self.tenant else None,
                "visualization": self.visualization.to_dict(include_relations=False) if self.visualization else None,
            })

        return base

    def __repr__(self):
        return f"<VisualizationExecution viz={self.visualization_id} state={self.state}>"

class VisualizationExecutionLog(db.Model):
    __tablename__ = "visualization_execution_logs"

    id = db.Column(db.BigInteger, primary_key=True)
    execution_id = db.Column(db.BigInteger, db.ForeignKey("visualization_executions.id", ondelete="CASCADE"), nullable=False)
    details = db.Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    message = db.Column(db.Text)
    level = db.Column(db.String(20))  # info, error
    created_at = db.Column(db.DateTime(timezone=True), server_default=db.func.now())
    execution = db.relationship("VisualizationExecution", back_populates="logs")

    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "execution_id": self.execution_id,
            "details": self.details,
            "message": self.message,
            "level": self.level,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

        if include_relations:
            base.update({
                # "tenant": self.tenant.to_dict(include_relations=False) if self.tenant else None,
                # "visualization": self.visualization.to_dict(include_relations=False) if self.visualization else None,
                "execution": self.execution.to_dict(include_relations=False) if self.execution else None,
            })

        return base

class VisualizationShare(db.Model, AuditMixin):
    __tablename__ = "visualization_shares"

    id = db.Column(db.BigInteger, primary_key=True)
    visualization_id = db.Column(db.BigInteger, db.ForeignKey("visualizations.id", ondelete="CASCADE"), nullable=False)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id"), nullable=False)
    
    user_id = db.Column(db.BigInteger,db.ForeignKey("users.id", ondelete="CASCADE"),nullable=True)
    permission_id = db.Column(db.BigInteger, db.ForeignKey("user_permissions.id", ondelete="CASCADE"), nullable=False)

    public_token = db.Column(db.String(255), nullable=False)
    can_view = db.Column(db.Boolean, default=True)
    can_edit = db.Column(db.Boolean, default=False)
    can_execute = db.Column(db.Boolean, default=False)
    
    tenant = db.relationship("Tenant", back_populates="visualization_shares", lazy="noload", foreign_keys=[tenant_id])
    visualization = db.relationship("Visualization", back_populates="shares", lazy="noload", foreign_keys=[visualization_id])
    permission = db.relationship("UserPermission", back_populates="visualization_shares", lazy="noload", foreign_keys=[permission_id])

    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "visualization_id": self.visualization_id,
            "permission_id": self.permission_id,
            "public_token": self.public_token,
            "can_view": self.can_view,
            "can_edit": self.can_edit,
            "can_execute": self.can_execute,
        }

        if include_relations:
            base.update({
                "tenant": self.tenant.to_dict(include_relations=False) if self.tenant else None,
                "permission": self.permission.to_dict(include_relations=False) if self.permission else None,
                "visualization": self.visualization.to_dict(include_relations=False) if self.visualization else None,
            })

        return base

    def __repr__(self):
        return f"<VisualizationShare viz={self.visualization_id} role={self.permission_id} view={self.can_view}>"

class VisualizationDhis2Validation(db.Model, AuditMixin):
    __tablename__ = "visualization_dhis2_validations"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True) 
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id"), nullable=False)
    visualization_id = db.Column(db.BigInteger, db.ForeignKey("visualizations.id", ondelete="CASCADE"), nullable=False)
    uid = db.Column(db.String, nullable=True)
    
    on_dhis2 = db.Column(db.Boolean, nullable=False, default=False)
    on_dhis2_at = db.Column(db.DateTime(timezone=True), nullable=True)
    on_dhis2_by_id = db.Column(db.BigInteger, db.ForeignKey("users.id"), nullable=True)
    
    is_validate = db.Column(db.Boolean, nullable=False, default=False)
    validated_at = db.Column(db.DateTime(timezone=True), nullable=True)
    validated_by_id = db.Column(db.BigInteger, db.ForeignKey("users.id"), nullable=True)
    
    canceled_at = db.Column(db.DateTime(timezone=True), nullable=True)
    canceled_by_id = db.Column(db.BigInteger, db.ForeignKey("users.id"), nullable=True)

    tenant = db.relationship("Tenant", back_populates="dhis2_validations", lazy="noload", foreign_keys=[tenant_id])
    visualization = db.relationship("Visualization", back_populates="dhis2_validations", lazy="noload", foreign_keys=[visualization_id])

    on_dhis2_by = db.relationship("User", lazy="noload", foreign_keys=[on_dhis2_by_id])
    validated_by = db.relationship("User", lazy="noload", foreign_keys=[validated_by_id])
    canceled_by = db.relationship("User", lazy="noload", foreign_keys=[canceled_by_id])

    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "visualization_id": self.visualization_id,
            "uid": self.uid,
            "on_dhis2": self.on_dhis2,
            "on_dhis2_at": self.on_dhis2_at,
            "on_dhis2_by_id": self.on_dhis2_by_id,
            "is_validate": self.is_validate,
            "validated_at": self.validated_at,
            "validated_by_id": self.validated_by_id,
            "canceled_at": self.canceled_at,
            "canceled_by_id": self.canceled_by_id,
        }

        if include_relations:
            base.update({
                "tenant": self.tenant.to_dict(include_relations=False) if self.tenant else None,
                "visualization": self.visualization.to_dict(include_relations=False) if self.visualization else None,
                # "on_dhis2_by": self.on_dhis2_by.to_dict(include_relations=False) if self.on_dhis2_by else None,
                # "validated_by": self.validated_by.to_dict(include_relations=False) if self.validated_by else None,
                # "canceled_by": self.canceled_by.to_dict(include_relations=False) if self.canceled_by else None,
            })

        return base

    def __repr__(self):
        return f"<VisualizationDhis2Validation id={self.id} uid={self.uid} on_dhis2={self.on_dhis2} is_validate={self.is_validate}>"

class DataTarget(db.Model, AuditMixin):
    __tablename__ = "data_targets"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    dataset_id = db.Column(db.BigInteger, db.ForeignKey("datasets.id", ondelete="CASCADE"), nullable=True, index=True)
    query_id = db.Column(db.BigInteger, db.ForeignKey("dataset_queries.id", ondelete="CASCADE"), nullable=True, index=True)
    visualization_id = db.Column(db.BigInteger, db.ForeignKey("visualizations.id", ondelete="CASCADE"), nullable=True)
    # type = db.Column(db.Enum("dataset", "query", "visualization", name="data_target_type"),nullable=False)
    type = db.Column(db.String(50), nullable=False)  # dataset | query | visualization | chart
    name = db.Column(db.String(255), nullable=False)

    tenant = db.relationship("Tenant", back_populates="data_targets", lazy="noload", foreign_keys=[tenant_id])
    dataset = db.relationship("Dataset", back_populates="data_targets", lazy="noload", foreign_keys=[dataset_id])
    dataset_query = db.relationship("DatasetQuery", back_populates="data_targets", lazy="noload", foreign_keys=[query_id])
    visualization = db.relationship("Visualization", back_populates="targets", lazy="noload", foreign_keys=[visualization_id])

    source_lineages = db.relationship("DataLineage", back_populates="source", lazy="noload", cascade="all, delete-orphan", foreign_keys="DataLineage.source_id")
    target_lineages = db.relationship("DataLineage", back_populates="target", lazy="noload", cascade="all, delete-orphan", foreign_keys="DataLineage.target_id")

    __table_args__ = (
        # db.CheckConstraint(
        #     """
        #     (dataset_id IS NOT NULL)::int + (query_id IS NOT NULL)::int + (visualization_id IS NOT NULL)::int = 1
        #     """,
        #     name="ck_exactly_one_target"
        # ),
        # db.CheckConstraint(
        #     """
        #     (type = 'dataset' AND dataset_id IS NOT NULL AND query_id IS NULL AND visualization_id IS NULL) OR
        #     (type = 'query' AND query_id IS NOT NULL AND dataset_id IS NULL AND visualization_id IS NULL) OR
        #     (type = 'visualization' AND visualization_id IS NOT NULL AND dataset_id IS NULL AND query_id IS NULL)
        #     """,
        #     name="ck_data_target_type_match"
        # ),
        db.Index("idx_data_target_tenant_type", "tenant_id", "type"),
    )

    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "dataset_id": self.dataset_id,
            "query_id": self.query_id,
            "visualization_id": self.visualization_id,
            "type": self.type,
            "name": self.name,
        }

        if include_relations:
            base.update({
                "tenant": self.tenant.to_dict(include_relations=False) if self.tenant else None,
                "dataset": self.dataset.to_dict(include_relations=False) if self.dataset else None,
                "query": self.dataset_query.to_dict(include_relations=False) if self.dataset_query else None,
                "visualization": self.visualization.to_dict(include_relations=False) if self.visualization else None,
                "source_lineages": [d.to_dict(include_relations=False) for d in self.source_lineages],
                "target_lineages": [d.to_dict(include_relations=False) for d in self.target_lineages],
            })

        return base

    def __repr__(self):
        return f"<DataTarget id={self.id} type={self.type}>"

class DataLineage(db.Model, AuditMixin):
    __tablename__ = "data_lineages"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    source_id = db.Column(db.BigInteger, db.ForeignKey("data_targets.id", ondelete="CASCADE"), nullable=False)
    target_id = db.Column(db.BigInteger, db.ForeignKey("data_targets.id", ondelete="CASCADE"), nullable=False)
    operation = db.Column(db.Enum(LineageOperation, name="lineage_operation"), nullable=False)
    
    tenant = db.relationship("Tenant", back_populates="lineages", lazy="noload", foreign_keys=[tenant_id])
    source = db.relationship("DataTarget", back_populates="source_lineages", lazy="noload", foreign_keys=[source_id])
    target = db.relationship("DataTarget", back_populates="target_lineages", lazy="noload", foreign_keys=[target_id])

    __table_args__ = (
        db.Index("idx_lineage_source", "source_id"),
        db.Index("idx_lineage_target", "target_id"),
        db.CheckConstraint("source_id != target_id", name="ck_no_self_lineage"),
    )

    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "source_id": self.source_id,
            "target_id": self.target_id,
            "operation": self.operation,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

        if include_relations:
            base.update({
                "tenant": self.tenant.to_dict(include_relations=False) if self.tenant else None,
                "source": self.source.to_dict(include_relations=False) if self.source else None,
                "target": self.target.to_dict(include_relations=False) if self.target else None,
            })

        return base

    def __repr__(self):
        return f"<DataLineage {self.source_id} -> {self.target_id}>"

class AIQueryLog(db.Model, AuditMixin):
    __tablename__ = "ai_query_logs"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id"), nullable=False, index=True)
    visualization_id = db.Column(db.BigInteger, db.ForeignKey("visualizations.id", ondelete="CASCADE"), nullable=False)
    prompt = db.Column(db.Text, nullable=False)
    generated_query_json = db.Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    validated = db.Column(db.Boolean, default=False)
    rejected_reason = db.Column(db.Text)

    tenant = db.relationship("Tenant", back_populates="ai_query_logs")

    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "visualization_id": self.visualization_id,
            "prompt": self.prompt,
            "generated_query_json": self.generated_query_json,
            "validated": self.validated,
            "rejected_reason": self.rejected_reason,
        }

        if include_relations:
            base.update({
                "tenant": self.tenant.to_dict(include_relations=False) if self.tenant else None,
            })

        return base

    __table_args__ = (
        db.Index("idx_ai_log_tenant", "tenant_id"),
    )

