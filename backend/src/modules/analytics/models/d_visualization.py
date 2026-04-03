from sqlalchemy import text
from enum import Enum as PyEnum
from datetime import datetime, timezone
from backend.src.app.configs.extensions import db
from backend.src.app.models._controls import *
from backend.src.modules.analytics.logger import get_backend_logger
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



class Visualization(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "visualizations"
    __table_args__ = (
        db.UniqueConstraint("tenant_id", "name", name="uq_visualization_tenant_name"),
        db.Index("idx_visualization_tenant_status", "tenant_id", "status"),
        {"schema": "analy"},
    )
    parent_id = db.Column(db.String(11),db.ForeignKey("analy.visualizations.id",ondelete="SET NULL"),nullable=True)
   
    name = db.Column(db.String(255), nullable=False)
    type = db.Column(db.String(50), nullable=False)  # dashboard | report
    description = db.Column(db.Text)
    is_template = db.Column(db.Boolean, default=False)
    status = db.Column(db.Enum(VisualizationStatus, name="visualization_status"), nullable=False, default=VisualizationStatus.DRAFT)

    parent = db.relationship("Visualization",remote_side="Visualization.id",backref=db.backref("children", lazy="joined"))
    
    visualization_charts = db.relationship("VisualizationChart", back_populates="visualization",lazy="noload", cascade="all, delete-orphan")
    visualization_executions = db.relationship("VisualizationExecution", back_populates="visualization",lazy="noload", cascade="all, delete-orphan")
    visualization_shares = db.relationship("VisualizationShare", back_populates="visualization", lazy="noload", cascade="all, delete-orphan")
    visualization_views = db.relationship("VisualizationView", back_populates="visualization",lazy="noload", cascade="all, delete-orphan")
    visualization_definitions = db.relationship("VisualizationDefinition", back_populates="visualization",lazy="noload", cascade="all, delete-orphan")
    visualization_layouts = db.relationship("VisualizationLayout", back_populates="visualization",lazy="noload", cascade="all, delete-orphan")
    visualization_dhis2_validations = db.relationship("VisualizationDhis2Validation", back_populates="visualization",lazy="noload", cascade="all, delete-orphan")
    data_targets = db.relationship("DataTarget", back_populates="visualization",lazy="noload", cascade="all, delete-orphan")

    
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
                "visualization_charts": [d.to_dict(True) for d in  self.visualization_charts or []],
                "visualization_executions": [d.to_dict(False) for d in  self.visualization_executions or []],
                "visualization_shares": [d.to_dict(False) for d in  self.visualization_shares or []],
                "visualization_views": [d.to_dict(False) for d in  self.visualization_views or []],
                "visualization_definitions": [d.to_dict(False) for d in  self.visualization_definitions or []],
                "visualization_layouts": [d.to_dict(False) for d in  self.visualization_layouts or []],
                "visualization_dhis2_validations": [d.to_dict(False) for d in  self.visualization_dhis2_validations or []],
                "data_targets": [d.to_dict(False) for d in  self.data_targets or []] if self.type == "report" else [],
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

class VisualizationDefinition(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "visualization_definitions"
    __table_args__ = (
        db.UniqueConstraint("visualization_id", "version"),
        db.Index("idx_definition_active", "visualization_id", "is_active"),
        {"schema": "analy"},
    )

    visualization_id = db.Column(db.String(11), db.ForeignKey("analy.visualizations.id", ondelete="CASCADE"), nullable=False)
    
    version = db.Column(db.Integer, nullable=False)
    config = db.Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    filters = db.Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))

    visualization = db.relationship("Visualization", back_populates="visualization_definitions", lazy="noload", foreign_keys=[visualization_id])


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
                "visualization": self.visualization.to_dict(False) if self.visualization else None,
                # "views": [v.to_dict(False) for v in self.views or []],
            })

        return base

    def __repr__(self):
        return f"<VisualizationDefinition viz={self.visualization_id} id={self.id}>"
    
class VisualizationLayout(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "visualization_layouts"
    __table_args__ = (
        db.UniqueConstraint("visualization_id", "tenant_id", "version"),
        {"schema": "analy"},
    )

    visualization_id = db.Column(db.String(11), db.ForeignKey("analy.visualizations.id", ondelete="CASCADE"), nullable=False)
    
    version = db.Column(db.Integer, nullable=False)
    layout = db.Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    options = db.Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))

    visualization = db.relationship("Visualization", back_populates="visualization_layouts", lazy="noload", foreign_keys=[visualization_id])
    
    visualization_views = db.relationship("VisualizationView", back_populates="visualization_layout",lazy="noload", cascade="all, delete-orphan")
    visualization_charts = db.relationship("VisualizationChart",back_populates="visualization_layout",cascade="all, delete-orphan",lazy="noload")

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
                "tenant": self.tenant.to_dict(False) if self.tenant else None,
                "visualization": self.visualization.to_dict(False) if self.visualization else None,
                "visualization_views": [v.to_dict(False) for v in self.visualization_views or []],
                "visualization_charts": [v.to_dict(False) for v in self.visualization_charts or []],
            })

        return base

    def __repr__(self):
        return f"<VisualizationChart viz={self.visualization_id} dataset={self.dataset_id}>"

class VisualizationChart(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "visualization_charts"
    __table_args__ = (
        # db.UniqueConstraint("layout_id", "chart_id"),
        {"schema": "analy"},
    )
    dataset_id = db.Column(db.String(11),db.ForeignKey("analy.datasets.id", ondelete="CASCADE"),nullable=False)
    dataset_chart_id = db.Column(db.String(11),db.ForeignKey("analy.dataset_charts.id", ondelete="CASCADE"),nullable=False)
    
    visualization_id = db.Column(db.String(11),db.ForeignKey("analy.visualizations.id", ondelete="CASCADE"),nullable=False)
    visualization_layout_id = db.Column(db.String(11),db.ForeignKey("analy.visualization_layouts.id", ondelete="CASCADE"),nullable=False)

    # 🔥 lien avec le layout item
    position = db.Column(JSONB, nullable=False)  # { i: "block-id" }

    dataset = db.relationship("Dataset", back_populates="visualization_charts", lazy="noload", foreign_keys=[dataset_id])
    dataset_chart = db.relationship("DatasetChart", back_populates="visualization_charts",lazy="noload", foreign_keys=[dataset_chart_id])
    
    visualization = db.relationship("Visualization", back_populates="visualization_charts", lazy="noload", foreign_keys=[visualization_id])
    visualization_layout = db.relationship("VisualizationLayout", back_populates="visualization_charts", lazy="noload", foreign_keys=[visualization_layout_id])


    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "dataset_id": self.dataset_id,
            "dataset_chart_id": self.dataset_chart_id,
            "visualization_id": self.visualization_id,
            "visualization_layout_id": self.visualization_layout_id,
            "position": self.position or {"x":0,"y":0,"w":6,"h":4},
        }

        if include_relations:
            base.update({
                "tenant": self.tenant.to_dict(False) if self.tenant else None,
                "dataset": self.dataset.to_dict(False) if self.dataset else None,
                "dataset_chart": self.dataset_chart.to_dict(False) if self.dataset_chart else None,
                "visualization": self.visualization.to_dict(False) if self.visualization else None,
                "visualization_layout": self.visualization_layout.to_dict(False) if self.visualization_layout else None,
            })

        return base

    def __repr__(self):
        return f"<VisualizationChart viz={self.visualization_id} dataset={self.dataset_id}> chart={self.chart_id}>"

class VisualizationView(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "visualization_views"
    __table_args__ = {"schema": "analy"}

    visualization_id = db.Column(db.String(11), db.ForeignKey("analy.visualizations.id", ondelete="CASCADE"), nullable=False)
    visualization_layout_id = db.Column(db.String(11), db.ForeignKey("analy.visualization_layouts.id", ondelete="CASCADE"), nullable=False)

    name = db.Column(db.String(255), nullable=False)
    is_default = db.Column(db.Boolean, default=False)

    visualization = db.relationship("Visualization", back_populates="visualization_views", lazy="noload", foreign_keys=[visualization_id])
    visualization_layout = db.relationship("VisualizationLayout", back_populates="visualization_views", lazy="noload", foreign_keys=[visualization_layout_id])

    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "visualization_id": self.visualization_id,
            "visualization_layout_id": self.visualization_layout_id,
            "name": self.name,
            "is_default": self.is_default,
        }

        if include_relations:
            base.update({
                "tenant": self.tenant.to_dict(False) if self.tenant else None,
                "visualization": self.visualization.to_dict(False) if self.visualization else None,
                "visualization_layout": self.visualization_layout.to_dict(False) if self.visualization_layout else None,
            })

        return base

class VisualizationExecution(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "visualization_executions"
    __table_args__ = {"schema": "analy"}

    visualization_id = db.Column(db.String(11), db.ForeignKey("analy.visualizations.id", ondelete="CASCADE"), nullable=False)
    
    started_at = db.Column(db.DateTime(timezone=True))
    finished_at = db.Column(db.DateTime(timezone=True))
    
    state = db.Column(db.Enum(VisualizationState, name="visualization_state"), nullable=False,default=VisualizationState.PENDING)
    result = db.Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))

    error = db.Column(db.Text)
    
    visualization = db.relationship("Visualization", back_populates="visualization_executions", lazy="noload", foreign_keys=[visualization_id])
    visualization_execution_logs = db.relationship("VisualizationExecutionLog", back_populates="visualization_execution", cascade="all, delete-orphan")

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
            "executed_by": {"id": self.created_by.id, "name": self.created_by.username} if self.created_by else None,
        }

        if include_relations:
            base.update({
                "tenant": self.tenant.to_dict(False) if self.tenant else None,
                "visualization": self.visualization.to_dict(False) if self.visualization else None,
                "visualization_execution_logs": [v.to_dict(False) for v in self.visualization_execution_logs or []],
            })

        return base

    def __repr__(self):
        return f"<VisualizationExecution viz={self.visualization_id} state={self.state}>"

class VisualizationExecutionLog(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "visualization_execution_logs"
    __table_args__ = {"schema": "analy"}

    visualization_execution_id = db.Column(db.String(11), db.ForeignKey("analy.visualization_executions.id", ondelete="CASCADE"), nullable=False)
    
    details = db.Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    message = db.Column(db.Text)
    level = db.Column(db.String(20))  # info, error

    visualization_execution = db.relationship("VisualizationExecution", back_populates="visualization_execution_logs", lazy="noload", foreign_keys=[visualization_execution_id])

    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "visualization_execution_id": self.visualization_execution_id,
            "details": self.details,
            "message": self.message,
            "level": self.level,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

        if include_relations:
            base.update({
                "tenant": self.tenant.to_dict(False) if self.tenant else None,
                "visualization_execution": self.visualization_execution.to_dict(False) if self.visualization_execution else None,
            })

        return base

class VisualizationShare(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "visualization_shares"
    __table_args__ = {"schema": "analy"}

    visualization_id = db.Column(db.String(11), db.ForeignKey("analy.visualizations.id", ondelete="CASCADE"), nullable=False)
    
    user_id = db.Column(db.String(11),db.ForeignKey("core.users.id", ondelete="CASCADE"),nullable=True)
    permission_id = db.Column(db.String(11), db.ForeignKey("core.permissions.id", ondelete="CASCADE"), nullable=False)

    public_token = db.Column(db.String(255), nullable=False)
    can_view = db.Column(db.Boolean, default=True)
    can_edit = db.Column(db.Boolean, default=False)
    can_execute = db.Column(db.Boolean, default=False)
    
    visualization = db.relationship("Visualization", back_populates="visualization_shares", lazy="noload", foreign_keys=[visualization_id])
    permission = db.relationship("Permission", back_populates="visualization_shares", lazy="noload", foreign_keys=[permission_id])

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
                "tenant": self.tenant.to_dict(False) if self.tenant else None,
                "permission": self.permission.to_dict(False) if self.permission else None,
                "visualization": self.visualization.to_dict(False) if self.visualization else None,
            })

        return base

    def __repr__(self):
        return f"<VisualizationShare viz={self.visualization_id} role={self.permission_id} view={self.can_view}>"

class VisualizationDhis2Validation(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "visualization_dhis2_validations"
    __table_args__ = {"schema": "analy"}

    visualization_id = db.Column(db.String(11), db.ForeignKey("analy.visualizations.id", ondelete="CASCADE"), nullable=False)
    uid = db.Column(db.String, nullable=True)
    
    on_dhis2 = db.Column(db.Boolean, nullable=False, default=False)
    on_dhis2_at = db.Column(db.DateTime(timezone=True), nullable=True)
    on_dhis2_by_id = db.Column(db.String(11), db.ForeignKey("core.users.id"), nullable=True)
    
    is_validate = db.Column(db.Boolean, nullable=False, default=False)
    validated_at = db.Column(db.DateTime(timezone=True), nullable=True)
    validated_by_id = db.Column(db.String(11), db.ForeignKey("core.users.id"), nullable=True)
    
    canceled_at = db.Column(db.DateTime(timezone=True), nullable=True)
    canceled_by_id = db.Column(db.String(11), db.ForeignKey("core.users.id"), nullable=True)

    visualization = db.relationship("Visualization", back_populates="visualization_dhis2_validations", lazy="noload", foreign_keys=[visualization_id])

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
                "tenant": self.tenant.to_dict(False) if self.tenant else None,
                "visualization": self.visualization.to_dict(False) if self.visualization else None,
                # "on_dhis2_by": self.on_dhis2_by.to_dict(False) if self.on_dhis2_by else None,
                # "validated_by": self.validated_by.to_dict(False) if self.validated_by else None,
                # "canceled_by": self.canceled_by.to_dict(False) if self.canceled_by else None,
            })

        return base

    def __repr__(self):
        return f"<VisualizationDhis2Validation id={self.id} uid={self.uid} on_dhis2={self.on_dhis2} is_validate={self.is_validate}>"

class DataTarget(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "data_targets"
    __table_args__ = (
        db.Index("idx_data_target_tenant_type", "tenant_id", "type"),
        {"schema": "analy"},
    )

    dataset_id = db.Column(db.String(11), db.ForeignKey("analy.datasets.id", ondelete="CASCADE"), nullable=True, index=True)
    dataset_query_id = db.Column(db.String(11), db.ForeignKey("analy.dataset_queries.id", ondelete="CASCADE"), nullable=True, index=True)
    visualization_id = db.Column(db.String(11), db.ForeignKey("analy.visualizations.id", ondelete="CASCADE"), nullable=True)

    # type = db.Column(db.Enum("dataset", "query", "visualization", name="data_target_type"),nullable=False)
    type = db.Column(db.String(50), nullable=False)  # dataset | query | visualization | chart
    name = db.Column(db.String(255), nullable=False)

    dataset = db.relationship("Dataset", back_populates="data_targets", lazy="noload", foreign_keys=[dataset_id])
    dataset_query = db.relationship("DatasetQuery", back_populates="data_targets", lazy="noload", foreign_keys=[dataset_query_id])
    visualization = db.relationship("Visualization", back_populates="data_targets", lazy="noload", foreign_keys=[visualization_id])

    data_lineage_sources = db.relationship("DataLineage", back_populates="data_target_source", lazy="noload", cascade="all, delete-orphan", foreign_keys="DataLineage.data_target_source_id")
    data_lineage_targets = db.relationship("DataLineage", back_populates="data_target_target", lazy="noload", cascade="all, delete-orphan", foreign_keys="DataLineage.data_target_target_id")


    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "dataset_id": self.dataset_id,
            "dataset_query_id": self.dataset_query_id,
            "visualization_id": self.visualization_id,
            "type": self.type,
            "name": self.name,
        }

        if include_relations:
            base.update({
                "tenant": self.tenant.to_dict(False) if self.tenant else None,
                "dataset": self.dataset.to_dict(False) if self.dataset else None,
                "dataset_query": self.dataset_query.to_dict(False) if self.dataset_query else None,
                "visualization": self.visualization.to_dict(False) if self.visualization else None,
                "data_lineage_sources": [d.to_dict(False) for d in self.data_lineage_sources],
                "data_lineage_targets": [d.to_dict(False) for d in self.data_lineage_targets],
            })

        return base

    def __repr__(self):
        return f"<DataTarget id={self.id} type={self.type}>"

class DataLineage(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "data_lineages"
    __table_args__ = (
        db.Index("idx_lineage_source", "data_target_source_id"),
        db.Index("idx_lineage_target", "data_target_target_id"),
        db.CheckConstraint("data_target_source_id != data_target_target_id", name="ck_no_self_lineage"),
        {"schema": "analy"},
    )

    data_target_source_id = db.Column(db.String(11), db.ForeignKey("analy.data_targets.id", ondelete="CASCADE"), nullable=False)
    data_target_target_id = db.Column(db.String(11), db.ForeignKey("analy.data_targets.id", ondelete="CASCADE"), nullable=False)
    
    operation = db.Column(db.Enum(LineageOperation, name="lineage_operation"), nullable=False)
    
    data_target_source = db.relationship("DataTarget", back_populates="data_lineage_sources", lazy="noload", foreign_keys=[data_target_source_id])
    data_target_target = db.relationship("DataTarget", back_populates="data_lineage_targets", lazy="noload", foreign_keys=[data_target_target_id])


    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "data_target_source_id": self.data_target_source_id,
            "data_target_target_id": self.data_target_target_id,
            "operation": self.operation,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

        if include_relations:
            base.update({
                "tenant": self.tenant.to_dict(False) if self.tenant else None,
                "data_target_source": self.data_target_source.to_dict(False) if self.data_target_source else None,
                "data_target_target": self.data_target_target.to_dict(False) if self.data_target_target else None,
            })

        return base

    def __repr__(self):
        return f"<DataLineage {self.source_id} -> {self.target_id}>"

class AIQueryLog(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "ai_query_logs"
    __table_args__ = (
        db.Index("idx_ai_log_tenant", "tenant_id"),
        {"schema": "analy"},
    )

    visualization_id = db.Column(db.String(11), db.ForeignKey("analy.visualizations.id", ondelete="CASCADE"), nullable=False)
    
    prompt = db.Column(db.Text, nullable=False)
    generated_query_json = db.Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    validated = db.Column(db.Boolean, default=False)
    rejected_reason = db.Column(db.Text)

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
                "tenant": self.tenant.to_dict(False) if self.tenant else None,
            })

        return base

