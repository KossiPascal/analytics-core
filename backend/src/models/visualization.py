from sqlalchemy import text
from enum import Enum as PyEnum
from datetime import datetime, timezone
from backend.src.databases.extensions import db
from backend.src.models.datasource import AuditMixin
from backend.src.logger import get_backend_logger

logger = get_backend_logger(__name__)


class VisualizationStatus(PyEnum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    REVIEWED = "reviewed"
    APPROVED = "approved"
    PUBLISHED = "published"
    ARCHIVED = "archived"
    EXECUTED = "executed"
    FAILED = "failed"

class LineageOperation(PyEnum):
    DERIVED_FROM = "derived_from"
    AGGREGATED = "aggregated"
    FILTERED = "filtered"

class Visualization(db.Model, AuditMixin):
    __tablename__ = "visualizations"
    __table_args__ = (db.UniqueConstraint("tenant_id", "name", "status", name="uq_viz_role"),)

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    name = db.Column(db.String(255), nullable=False)
    type = db.Column(db.String(50), nullable=False)  # dashboard | report
    description = db.Column(db.Text)

    status = db.Column(
        db.Enum(VisualizationStatus, name="visualization_workflow_status"), 
        default=VisualizationStatus.DRAFT, native_enum=True, 
        create_constraint=True, validate_strings=True, nullable=False
    )

    parent_id = db.Column(db.BigInteger, db.ForeignKey("visualizations.id"))

    layout = db.Column(db.JSON, nullable=False, server_default=text("'{}'::json"))
    filters = db.Column(db.JSON, nullable=False, server_default=text("'{}'::json"))
    config = db.Column(db.JSON, nullable=False, server_default=text("'{}'::json"))
    generated_data = db.Column(db.JSON, nullable=False, server_default=text("'{}'::json"))

    executed_at = db.Column(db.DateTime(timezone=True))
    executed_by_id = db.Column(db.BigInteger, db.ForeignKey("users.id"))
    executed_by = db.relationship("User", foreign_keys=[executed_by_id])

    validated_at = db.Column(db.DateTime(timezone=True))
    validated_by_id = db.Column(db.BigInteger, db.ForeignKey("users.id"))
    validated_by = db.relationship("User", foreign_keys=[validated_by_id])
    validation_comment = db.Column(db.Text)

    tenant = db.relationship("Tenant", back_populates="visualizations")
    parents = db.relationship("Visualization", remote_side=[id], backref=db.backref("children", lazy="joined"))

    charts = db.relationship("VisualizationChart", back_populates="visualization", cascade="all, delete-orphan")
    execution_logs = db.relationship("VisualizationExecutionLog", back_populates="visualization", cascade="all, delete-orphan")
    shares = db.relationship("VisualizationShare", back_populates="visualization", cascade="all, delete-orphan")

    dhis2_validations = db.relationship("VisualizationDhis2Validation", back_populates="visualization", cascade="all, delete-orphan")

    __table_args__ = (
        db.Index("idx_viz_status", "status"),
    )
    
    def serialize(self):
        return {
            "id": self.id,
            "type": self.type,
            "description": self.description,
            "name": self.name,
            "status": self.status.value,
            "created_by": {"id": self.created_by.id, "name": self.created_by.name} if self.created_by else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def full_serialize(self):
        base = self.serialize()
        base.update({
            "config": self.config,
            "filters": self.filters,
            "layout": self.layout,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        })
        if self.type == "report":
            base.update({
                "executed_at": self.executed_at.isoformat() if self.executed_at else None,
                "generated_data": self.generated_data,
            })
        return base

    def add_chart(self, chart, position=None):
        if not position:
            position = {"x": 0, "y": 0, "w": 4, "h": 4}
        vc = VisualizationChart(visualization=self, chart=chart, position=position)
        db.session.add(vc)
        return vc

    def remove_chart(self, chart_id):
        vc = next((c for c in self.charts if c.chart_id == chart_id), None)
        if vc:
            db.session.delete(vc)

    def publish(self):
        self.status = VisualizationStatus.PUBLISHED

    def archive(self):
        self.status = VisualizationStatus.ARCHIVED

    def is_editable(self):
        return self.status == VisualizationStatus.DRAFT

    def refresh(self):
        self.updated_at = datetime.now(timezone.utc)

    def mark_executed(self, data=None):
        self.executed_at = datetime.now(timezone.utc)
        self.status = VisualizationStatus.EXECUTED
        if data is not None:
            self.generated_data = data

    def mark_failed(self):
        self.status = VisualizationStatus.FAILED

    def can_transition(self, user, target_status: str):
        allowed_transitions = {
            "draft": ["submitted"],
            "submitted": ["reviewed", "archived"],
            "reviewed": ["approved", "archived"],
            "approved": ["published", "archived"],
            "published": ["archived"],
            "archived": [],
            "executed": ["archived", "failed"],
            "failed": ["draft"]
        }
        return target_status in allowed_transitions.get(self.status.value, [])

    def __repr__(self):
        return f"<Visualization {self.type} id={self.id} name={self.name}>"

class VisualizationChart(db.Model, AuditMixin):
    __tablename__ = "visualization_charts"

    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id"), nullable=False)
    tenant = db.relationship("Tenant", back_populates="visualization_charts")

    visualization_id = db.Column(db.BigInteger, db.ForeignKey("visualizations.id", ondelete="CASCADE"), primary_key=True, nullable=False)
    visualization = db.relationship("Visualization", back_populates="charts")

    chart_id = db.Column(db.BigInteger, db.ForeignKey("dataset_charts.id", ondelete="CASCADE"), primary_key=True, nullable=False)
    chart = db.relationship("DatasetChart", back_populates="visualizations")
    
    position = db.Column(db.JSON, nullable=False, server_default=text("'{}'::json"))

    def __repr__(self):
        return f"<VisualizationChart viz={self.visualization_id} chart={self.chart_id}>"

class VisualizationExecutionLog(db.Model, AuditMixin):
    __tablename__ = "visualization_execution_logs"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)

    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id"), nullable=False)
    tenant = db.relationship("Tenant", back_populates="visualization_execution_logs")

    visualization_id = db.Column(db.BigInteger, db.ForeignKey("visualizations.id", ondelete="CASCADE"), nullable=False)
    visualization = db.relationship("Visualization", back_populates="execution_logs")
    
    executed_at = db.Column(db.DateTime(timezone=True), server_default=db.func.now(), nullable=False)
    executed_by_id = db.Column(db.BigInteger, db.ForeignKey("users.id"), nullable=True)
    executed_by = db.relationship("User", foreign_keys=[executed_by_id], lazy="joined")

    status = db.Column(db.Enum("success", "failed", name="visualization_execution_status"), nullable=False, server_default="success")
    message = db.Column(db.Text)
    details = db.Column(db.JSON, nullable=False, server_default=text("'{}'::json"))

    def __repr__(self):
        return f"<VisualizationExecutionLog viz={self.visualization_id} status={self.status}>"

class VisualizationShare(db.Model, AuditMixin):
    __tablename__ = "visualization_shares"

    visualization_id = db.Column(db.BigInteger, db.ForeignKey("visualizations.id", ondelete="CASCADE"), primary_key=True)
    role_id = db.Column(db.BigInteger, db.ForeignKey("user_roles.id", ondelete="CASCADE"), primary_key=True)
    public_token = db.Column(db.String(255), nullable=False)
    can_view = db.Column(db.Boolean, default=True)
    can_edit = db.Column(db.Boolean, default=False)
    can_execute = db.Column(db.Boolean, default=False)
    
    visualization = db.relationship("Visualization", back_populates="shares")
    role = db.relationship("UserRole")

    def __repr__(self):
        return f"<VisualizationShare viz={self.visualization_id} role={self.role_id} view={self.can_view}>"

class VisualizationDhis2Validation(db.Model, AuditMixin):
    __tablename__ = "visualization_dhis2_validations"

    # Primary key
    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True) 

    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id"), nullable=False)
    tenant = db.relationship("Tenant", back_populates="dhis2_validations")

    visualization_id = db.Column(db.BigInteger, db.ForeignKey("visualizations.id", ondelete="CASCADE"), primary_key=True, nullable=False)
    visualization = db.relationship("Visualization", back_populates="dhis2_validations")
    # Fields
    uid = db.Column(db.String, nullable=True)

    on_dhis2 = db.Column(db.Boolean, nullable=False, default=False)
    on_dhis2_at = db.Column(db.DateTime(timezone=True), nullable=True)
    on_dhis2_by_id = db.Column(db.BigInteger, db.ForeignKey("users.id"), nullable=True)
    on_dhis2_by = db.relationship("User", foreign_keys=[on_dhis2_by_id], lazy="joined")

    # Foreign key references to User
    is_validate = db.Column(db.Boolean, nullable=False, default=False)

    validated_at = db.Column(db.DateTime(timezone=True), nullable=True)
    validated_by_id = db.Column(db.BigInteger, db.ForeignKey("users.id"), nullable=True)
    validated_by = db.relationship("User", foreign_keys=[validated_by_id], lazy="joined")

    canceled_at = db.Column(db.DateTime(timezone=True), nullable=True)
    canceled_by_id = db.Column(db.BigInteger, db.ForeignKey("users.id"), nullable=True)
    canceled_by = db.relationship("User", foreign_keys=[canceled_by_id], lazy="joined")

    def __repr__(self):
        return f"<VisualizationDhis2Validation id={self.id} uid={self.uid} on_dhis2={self.on_dhis2} is_validate={self.is_validate}>"


class DataTarget(db.Model, AuditMixin):
    __tablename__ = "data_targets"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    type = db.Column(db.String(50), nullable=False)  # dataset | query | visualization | chart
    name = db.Column(db.String(255), nullable=False)

    dataset_id = db.Column(db.BigInteger, db.ForeignKey("datasets.id", ondelete="CASCADE"), nullable=True, index=True)
    query_id = db.Column(db.BigInteger, db.ForeignKey("dataset_queries.id", ondelete="CASCADE"), nullable=True, index=True)
    visualization_id = db.Column(db.BigInteger, db.ForeignKey("visualizations.id", ondelete="CASCADE"), nullable=True)

    dataset = db.relationship("Dataset")
    dataset_query = db.relationship("DatasetQuery")
    visualization = db.relationship("Visualization")

    db.CheckConstraint(
        """
        (dataset_id IS NOT NULL)::int +
        (query_id IS NOT NULL)::int +
        (visualization_id IS NOT NULL)::int = 1
        """,
        name="ck_exactly_one_target"
    )

    __table_args__ = (
        db.Index("idx_data_target_tenant_type", "tenant_id", "type"),
    )

    def __repr__(self):
        return f"<DataTarget id={self.id} type={self.type}>"

class DataLineage(db.Model, AuditMixin):
    __tablename__ = "data_lineages"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)

    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    tenant = db.relationship("Tenant", back_populates="data_lineages")

    source_id = db.Column(db.BigInteger, db.ForeignKey("data_targets.id", ondelete="CASCADE"), nullable=False)
    source = db.relationship("DataTarget", foreign_keys=[source_id])

    target_id = db.Column(db.BigInteger, db.ForeignKey("data_targets.id", ondelete="CASCADE"), nullable=False)
    target = db.relationship("DataTarget", foreign_keys=[target_id])

    operation = db.Column(db.Enum(LineageOperation, name="lineage_operation"), nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), server_default=db.func.now())

    __table_args__ = (
        db.Index("idx_lineage_source", "source_id"),
        db.Index("idx_lineage_target", "target_id"),
        db.CheckConstraint("source_id != target_id", name="ck_no_self_lineage"),
    )

    def __repr__(self):
        return f"<DataLineage {self.source_id} -> {self.target_id}>"

class AIQueryLog(db.Model, AuditMixin):
    __tablename__ = "ai_query_logs"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id"), nullable=False, index=True)
    tenant = db.relationship("Tenant", back_populates="ai_query_logs")

    prompt = db.Column(db.Text, nullable=False)
    generated_query_json = db.Column(db.JSON, nullable=False, server_default=text("'{}'::json"))

    validated = db.Column(db.Boolean, default=False)
    rejected_reason = db.Column(db.Text)

    __table_args__ = (
        db.Index("idx_ai_log_tenant", "tenant_id"),
    )
