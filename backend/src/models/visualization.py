from datetime import datetime, timezone
from sqlalchemy import Enum, Index, UniqueConstraint
from sqlalchemy.orm import relationship
from backend.src.databases.extensions import db
from backend.src.models.query.query_validator import QueryValidator

class DataSource(db.Model):
    __tablename__ = "data_sources"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)  # keeps same type as TypeORM (text)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)

    type = db.Column(db.String(50), nullable=False)  # postgres | mysql | api
    name = db.Column(db.String(255), nullable=False)

    # credentials_ref = db.Column(db.String(255), nullable=False)  # vault / secret manager
    # options = db.Column(db.JSON, default=dict)

    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    tenant = relationship("Tenant", back_populates="data_sources")
    connections = relationship("DataSourceConnection", cascade="all, delete-orphan")
    credentials = relationship("DataSourceCredential", cascade="all, delete-orphan")
    permissions = relationship("DataSourcePermission", cascade="all, delete-orphan")
    datasets = relationship("Dataset", cascade="all, delete-orphan")
    # datasets = relationship("Dataset", back_populates="datasource", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_datasource_tenant", "tenant_id"),
        UniqueConstraint("tenant_id", "name", name="uq_datasource_name"),
    )

    def deactivate(self):
        self.is_active = False

    def __repr__(self):
        return f"<DataSource {self.name} ({self.type})>"

class DataSourceConnection(db.Model):
    __tablename__ = "datasource_connections"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    datasource_id = db.Column(db.BigInteger, db.ForeignKey("data_sources.id", ondelete="CASCADE"))
    environment = db.Column(db.String(20), nullable=False)  # prod | staging
    host = db.Column(db.String(255))
    port = db.Column(db.Integer)
    database = db.Column(db.String(255))
    is_active = db.Column(db.Boolean, default=True)

class DataSourceCredential(db.Model):
    __tablename__ = "datasource_credentials"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    datasource_id = db.Column(db.BigInteger, db.ForeignKey("data_sources.id", ondelete="CASCADE"))
    vault_ref = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class DataSourcePermission(db.Model):
    __tablename__ = "datasource_permissions"

    datasource_id = db.Column(db.BigInteger, db.ForeignKey("data_sources.id", ondelete="CASCADE"), primary_key=True)
    role_id = db.Column(db.BigInteger, db.ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True)

    can_read = db.Column(db.Boolean, default=True)
    can_write = db.Column(db.Boolean, default=False)

    datasource = relationship("DataSource", back_populates="permissions")
    role = relationship("Role")

# -------------------- DATASET --------------------
class Dataset(db.Model):
    __tablename__ = "datasets"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    datasource_id = db.Column(db.BigInteger, db.ForeignKey("data_sources.id", ondelete="RESTRICT"), nullable=False)

    name = db.Column(db.String(255), nullable=False)

    sql_type = db.Column(
        Enum("select", "view", "materialized", name="dataset_sql_type"),
        nullable=False,
        default="select"
    )
    
    is_validated = db.Column(db.Boolean, default=False)
    validated_at = db.Column(db.DateTime)
    validated_by_id = db.Column(db.BigInteger, db.ForeignKey("users.id"))

    sql = db.Column(db.Text, nullable=False)
    columns = db.Column(db.JSON, default=list)

    version = db.Column(db.Integer, default=1)
    parent_id = db.Column(db.BigInteger, db.ForeignKey("datasets.id"))

    is_active = db.Column(db.Boolean, default=True)
    is_deleted = db.Column(db.Boolean, default=False)

    # deleted_at = db.Column(db.DateTime(timezone=True), nullable=True)
    # deleted_by_id = db.Column(db.BigInteger, db.ForeignKey("users.id"), nullable=True)
    # deleted_by = relationship("User", foreign_keys=[deleted_by_id])

    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    created_by_id = db.Column(db.BigInteger, db.ForeignKey("users.id"), nullable=True)
    # created_by = relationship("User", foreign_keys=[created_by_id])

    # updated_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    # updated_by_id = db.Column(db.BigInteger, db.ForeignKey("users.id"), nullable=True)
    # updated_by = relationship("User", foreign_keys=[updated_by_id])

    tenant = relationship("Tenant", back_populates="datasets")
    datasource = relationship("DataSource", back_populates="datasets")
    semantic_dimensions = relationship("SemanticDimension", back_populates="dataset", cascade="all, delete-orphan")
    metrics = relationship("Metric", back_populates="dataset", cascade="all, delete-orphan")
    queries = relationship("Query", back_populates="dataset", cascade="all, delete-orphan")

    parent = relationship("Dataset", remote_side=[id])

    __table_args__ = (
        db.UniqueConstraint("tenant_id", "name", "version", name="uq_dataset_version"),
    )

    def soft_delete(self):
        self.is_deleted = True
        self.is_active = False

    def preview_sql(self):
        return f"SELECT * FROM ({self.sql}) AS dataset_preview LIMIT 10"

    def __repr__(self):
        return f"<Dataset {self.name} v{self.version}>"
    
class SemanticDimension(db.Model):
    __tablename__ = "semantic_dimensions"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    dataset_id = db.Column(db.BigInteger, db.ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False)
    # tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)

    name = db.Column(db.String(255), nullable=False)
    # field_type = db.Column(db.String(20), nullable=False)  # dimension | metric
    expression = db.Column(db.Text, nullable=False)
    aggregation = db.Column(db.String(50), nullable=True)
    description = db.Column(db.Text)

    dataset = relationship("Dataset", back_populates="semantic_dimensions")

    __table_args__ = (
        db.UniqueConstraint("dataset_id", "name", name="uq_semantic_dimension"),
        # CheckConstraint("field_type IN ('dimension','metric')"),
    )

    def __repr__(self):
        return f"<SemanticField {self.name} >"

class Metric(db.Model):
    __tablename__ = "metrics"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    # tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id"), nullable=False)
    dataset_id = db.Column(db.BigInteger, db.ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False)

    name = db.Column(db.String(255), nullable=False)
    formula = db.Column(db.Text, nullable=False)
    aggregation = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text)
    is_public = db.Column(db.Boolean, default=False)

    dataset = relationship("Dataset", back_populates="metrics")

    __table_args__ = (db.UniqueConstraint("dataset_id", "name", name="uq_metric"),)

# -------------------- QUERY --------------------
class Query(db.Model):
    __tablename__ = "queries"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    # tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    dataset_id = db.Column(db.BigInteger, db.ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False)

    query_json = db.Column(db.JSON, nullable=False)
    compiled_sql = db.Column(db.Text, nullable=False)
    values = db.Column(db.JSON, nullable=True)

    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    dataset = relationship("Dataset", back_populates="queries")
    charts = relationship("Chart", back_populates="query", cascade="all, delete-orphan")


    def validate(self):
        """
        Validation métier & sécurité avant compilation
        """
        validator = QueryValidator(
            query_json=self.query_json,
            dimensions=self.dataset.semantic_dimensions,
            metrics=self.dataset.metrics,
        )
        validator.validate_all()

        self.is_validated = True
        self.validated_at = datetime.now(timezone.utc)

    def compile(self, engine):
        """
        Compile uniquement une query validée
        """
        if not self.is_validated:
            raise ValueError("Query must be validated before compilation")

        self.compiled_sql = engine.compile(
            self.query_json,
            self.dataset.semantic_dimensions,
            self.dataset.metrics,
        )
        return self.compiled_sql

    def __repr__(self):
        return f"<Query id={self.id} validated={self.is_validated}>"

    # class QueryEngine:
    #     """Unique point SQL generation (IA SAFE)"""

    #     @staticmethod
    #     def compile(query_json, semantic_dimensions, metrics):
    #         # 🔒 sandbox here
    #         # validate fields
    #         # build SELECT / WHERE / GROUP BY
    #         return "SELECT ..."

# -------------------- CHART --------------------
class Chart(db.Model):
    __tablename__ = "charts"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    # tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    query_id = db.Column(db.BigInteger, db.ForeignKey("queries.id", ondelete="CASCADE"), nullable=False)

    type = db.Column(db.String(50), nullable=False)  # bar, line, pie, table
    options = db.Column(db.JSON, nullable=False, default=dict) # chart config: colors, labels...

    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    query = relationship("Query", back_populates="charts")

    def render_config(self, data):
        return {
            "type": self.type,
            "data": data,
            "options": self.options
        }
    
    def __repr__(self):
        return f"<Chart {self.type} query={self.query_id}>"

class Visualization(db.Model):
    __tablename__ = "visualizations"

    __table_args__ = (db.UniqueConstraint("name", "status", name="uq_viz_role"),)

    # Core fields
    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)

    name = db.Column(db.String(255), nullable=False)
    type = db.Column(db.String(50), nullable=False)  # dashboard | report
    description = db.Column(db.Text)

    # draft | published | archived | executed | failed  /// draft → submitted → reviewed → approved → published
    status = db.Column(
        db.Enum(
            "draft", "submitted", "reviewed", "approved",
            "published", "archived", "executed", "failed",
            name="visualization_workflow_status"
        ),
        default="draft",
        nullable=False
    )

    parent_id = db.Column(db.BigInteger, db.ForeignKey("visualizations.id"))

    # Config & layout

    layout = db.Column(db.JSON)
    filters = db.Column(db.JSON)
    config = db.Column(db.JSON)
    generated_data = db.Column(db.JSON)

    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    created_by_id = db.Column(db.BigInteger, db.ForeignKey("users.id"))
    created_by = relationship("User", foreign_keys=[created_by_id])

    updated_at = db.Column(db.DateTime(timezone=True), onupdate=lambda: datetime.now(timezone.utc))
    updated_by_id = db.Column(db.BigInteger, db.ForeignKey("users.id"))
    updated_by = relationship("User", foreign_keys=[updated_by_id])

    validated_at = db.Column(db.DateTime)
    validated_by_id = db.Column(db.BigInteger, db.ForeignKey("users.id"))
    validated_by = relationship("User", foreign_keys=[validated_by_id])
    validation_comment = db.Column(db.Text)

    tenant = relationship("Tenant", back_populates="visualizations")
    parent = relationship("Visualization", remote_side=[id])

    # Relationships
    charts = relationship("VisualizationChart", back_populates="visualization", cascade="all, delete-orphan")
    execution_logs = relationship("VisualizationExecutionLog", back_populates="visualization", cascade="all, delete-orphan")
    shares = relationship("VisualizationShare", back_populates="visualization", cascade="all, delete-orphan")

    executed_at = db.Column(db.DateTime)
    executed_by_id = db.Column(db.BigInteger, db.ForeignKey("users.id"))
    executed_by = relationship("User", foreign_keys=[executed_by_id])

    is_deleted = db.Column(db.Boolean, default=False)
    deleted_at = db.Column(db.DateTime)
    deleted_by_id = db.Column(db.BigInteger, db.ForeignKey("users.id"))
    deleted_by = relationship("User", foreign_keys=[deleted_by_id])


    # Business logic
    def add_chart(self, chart, position=None):
        if not position:
            position = {"x": 0, "y": 0, "w": 4, "h": 4}

        vc = VisualizationChart(visualization=self,chart=chart,position=position)
        db.session.add(vc)
        return vc

    def remove_chart(self, chart_id):
        vc = next((c for c in self.charts if c.chart_id == chart_id),None,)
        if vc:
            db.session.delete(vc)

    def publish(self):
        self.status = "published"

    def archive(self):
        self.status = "archived"

    def is_editable(self):
        return self.status in ("draft",)

    def refresh(self):
        """ Hook futur : recalcul dynamique si nécessaire """
        self.updated_at = datetime.now(timezone.utc)

    def mark_executed(self, data=None):
        self.executed_at = datetime.now(timezone.utc)
        self.status = "executed"
        if data is not None:
            self.generated_data = data

    def mark_failed(self):
        self.status = "failed"

    def __repr__(self):
        return f"<Visualization {self.type} id={self.id} name={self.name}>"

    def can_transition(self, user, target_status):
        pass

class VisualizationChart(db.Model):
    __tablename__ = "visualization_charts"

    visualization_id = db.Column(db.BigInteger,db.ForeignKey("visualizations.id", ondelete="CASCADE"),primary_key=True)
    chart_id = db.Column(db.BigInteger,db.ForeignKey("charts.id", ondelete="CASCADE"),primary_key=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id"), nullable=False)

    position = db.Column(db.JSON)

    visualization = relationship("Visualization",back_populates="charts")
    chart = relationship("Chart")

    def __repr__(self):
        return f"<VisualizationChart viz={self.visualization_id} chart={self.chart_id}>"
    
class VisualizationExecutionLog(db.Model):
    __tablename__ = "visualization_execution_logs"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id"), nullable=False)

    visualization_id = db.Column(db.BigInteger,db.ForeignKey("visualizations.id", ondelete="CASCADE"),nullable=False)
    
    executed_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    executed_by = db.Column(db.BigInteger, db.ForeignKey("users.id"), nullable=True)

    status = db.Column(
        db.Enum("success", "failed", name="visualization_execution_status"),
        default="success",
        nullable=False
    )
    message = db.Column(db.Text)
    details = db.Column(db.JSON)

    visualization = relationship("Visualization",back_populates="execution_logs")


    def __repr__(self):
        return f"<ExecutionLog viz={self.visualization_id} status={self.status}>"

class VisualizationShare(db.Model):
    __tablename__ = "visualization_shares"

    visualization_id = db.Column(db.BigInteger,db.ForeignKey("visualizations.id", ondelete="CASCADE"),primary_key=True)
    role_id = db.Column(db.BigInteger,db.ForeignKey("roles.id", ondelete="CASCADE"),primary_key=True)
    public_token = db.Column(db.String(255), nullable=False)
    can_view = db.Column(db.Boolean, default=True)
    can_edit = db.Column(db.Boolean, default=False)
    can_execute = db.Column(db.Boolean, default=False)
    visualization = relationship("Visualization",back_populates="shares")

    role = relationship("Role")

    def __repr__(self):
        return (
            f"<VisualizationShare viz={self.visualization_id} "
            f"role={self.role_id} view={self.can_view}>"
        )

class DataLineage(db.Model):
    __tablename__ = "data_lineage"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE"))

    source_type = db.Column(db.String(50), nullable=False)  # datasource | dataset | metric | chart
    source_id = db.Column(db.BigInteger, nullable=False)

    target_type = db.Column(db.String(50), nullable=False)
    target_id = db.Column(db.BigInteger, nullable=False)

    operation = db.Column(
        Enum("derived_from", "aggregated", "filtered", name="lineage_operation"),
        nullable=False
    )

    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class AIQueryLog(db.Model):
    __tablename__ = "ai_query_logs"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id"))

    prompt = db.Column(db.Text, nullable=False)
    generated_query_json = db.Column(db.JSON, nullable=False)

    validated = db.Column(db.Boolean, default=False)
    rejected_reason = db.Column(db.Text)

    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))




# Tenant
#  ├── DataSource
#  │    ├── DataSourceConnection
#  │    └── Permissions
#  ├── Dataset (versioned, validated)
#  │    ├── SemanticDimension
#  │    └── Metric
#  ├── Query (JSON only)
#  │    └── Execution
#  ├── Chart
#  ├── Visualization (Dashboard / Report)
#  │    ├── Charts
#  │    ├── Workflow
#  │    ├── ExecutionLogs
#  │    └── Shares
#  └── DataLineage (global)
