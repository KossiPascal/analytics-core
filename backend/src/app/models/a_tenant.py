from sqlalchemy import text
from backend.src.app.configs.extensions import db
from backend.src.app.models._controls import *
from sqlalchemy.dialects.postgresql import JSONB


def apply_tenant_scope(query, model, current_user):
    if current_user and current_user.is_superadmin:
        return query

    if hasattr(model, "tenant_id"):
        return query.filter(model.tenant_id == current_user.tenant_id)

    return query

# -------------------- TENANT --------------------
class Tenant(db.Model, BaseModel, TimestampMixin, SoftDeleteMixin, NullableAuditMixin, StatusMixin):
    __tablename__ = "tenants"
    __table_args__ = {"schema": "core"}

    name = db.Column(db.String(255), nullable=False, unique=True)
    options = db.Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    description = db.Column(db.String(255), nullable=True)

    organisations = db.relationship("Organisation", back_populates="tenant", cascade="all, delete-orphan")
    regions = db.relationship("Region", back_populates="tenant", cascade="all, delete-orphan")
    countries = db.relationship("Country", back_populates="tenant", cascade="all, delete-orphan")
    host_links = db.relationship("HostLinks", back_populates="tenant",lazy="noload", cascade="all, delete-orphan")
    
    api_tokens = db.relationship("ApiToken", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    users = db.relationship("User", back_populates="tenant", lazy="noload", cascade="all, delete-orphan", foreign_keys="User.tenant_id")
    user_logs = db.relationship("UsersLog", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    users_roles = db.relationship("UserRole", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    users_permissions = db.relationship("UserPermission", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    refresh_tokens = db.relationship("RefreshToken", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")

    visualizations = db.relationship("Visualization", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    visualization_charts = db.relationship("VisualizationChart", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    visualization_executions = db.relationship("VisualizationExecution", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    visualization_execution_logs = db.relationship("VisualizationExecutionLog", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    
    visualization_dhis2_validations = db.relationship("VisualizationDhis2Validation", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    visualization_views = db.relationship("VisualizationView", back_populates="tenant",lazy="noload", cascade="all, delete-orphan")
    visualization_shares = db.relationship("VisualizationShare", back_populates="tenant",lazy="noload", cascade="all, delete-orphan")
    visualization_layouts = db.relationship("VisualizationLayout", back_populates="tenant",lazy="noload", cascade="all, delete-orphan")
    visualization_definitions = db.relationship("VisualizationDefinition", back_populates="tenant",lazy="noload", cascade="all, delete-orphan")

    datasources = db.relationship("DataSource", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    datasource_permissions = db.relationship("DataSourcePermission", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    datasource_connections = db.relationship("DataSourceConnection", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    datasource_ssh_configs = db.relationship("DataSourceSSHConfig", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    datasource_credentials = db.relationship("DataSourceCredential", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    datasource_histories = db.relationship("DataSourceHistory", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    
    datasets = db.relationship("Dataset", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    dataset_fields = db.relationship("DatasetField", back_populates="tenant", cascade="all, delete-orphan")
    dataset_charts = db.relationship("DatasetChart", back_populates="tenant",lazy="noload", cascade="all, delete-orphan")
    dataset_queries = db.relationship("DatasetQuery", back_populates="tenant",lazy="noload", cascade="all, delete-orphan")
    data_targets = db.relationship("DataTarget", back_populates="tenant",lazy="noload", cascade="all, delete-orphan")
    dataset_versioneds = db.relationship("DatasetVersioned", back_populates="tenant",cascade="all, delete-orphan",lazy="noload",passive_deletes=True)
    data_lineages = db.relationship("DataLineage", back_populates="tenant",cascade="all, delete-orphan",lazy="noload",passive_deletes=True)
    
    lineages = db.relationship("DataLineage", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    ai_query_logs = db.relationship("AIQueryLog", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    scripts = db.relationship("Script", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    scripts_execution_logs = db.relationship("ScriptExecutionLog", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    # orgunit_levels = db.relationship("OrgUnitLevel", lazy="noload", cascade="all, delete-orphan")

    roles = db.relationship("Role", back_populates="tenant",foreign_keys="Role.tenant_id", lazy="noload", cascade="all, delete-orphan")
    permissions = db.relationship("Permission", back_populates="tenant",foreign_keys="Permission.tenant_id", lazy="noload", cascade="all, delete-orphan")
    roles_permissions = db.relationship("RolePermission", back_populates="tenant",foreign_keys="RolePermission.tenant_id", lazy="noload", cascade="all, delete-orphan")
    
    teams = db.relationship("Team", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    team_templates = db.relationship("TeamTemplate", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    team_memberships = db.relationship("TeamMembership", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    team_scopes = db.relationship("TeamScope", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    team_assignments = db.relationship("TeamAssignment", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    team_objectives = db.relationship("TeamObjective", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    team_keyresults = db.relationship("TeamKeyResult", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")

    memberships = db.relationship("Membership", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    strategies = db.relationship("Strategy", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    strategic_axes = db.relationship("StrategicAxis", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    
    positions = db.relationship("Position", back_populates="tenant",lazy="noload", cascade="all, delete-orphan")
    employees = db.relationship("Employee", back_populates="tenant",lazy="noload", cascade="all, delete-orphan")
    employee_positions = db.relationship("EmployeePosition", back_populates="tenant",lazy="noload", cascade="all, delete-orphan")
    
    activities = db.relationship("Activity", back_populates="tenant",lazy="noload", cascade="all, delete-orphan")
    activity_owners = db.relationship("ActivityOwner", back_populates="tenant",lazy="noload", cascade="all, delete-orphan")
    activity_keyresults = db.relationship("ActivityKeyResult", back_populates="tenant",lazy="noload", cascade="all, delete-orphan")
    activity_dependencies = db.relationship("ActivityDependency", back_populates="tenant",lazy="noload", cascade="all, delete-orphan")

    indicators = db.relationship("Indicator", back_populates="tenant",lazy="noload", cascade="all, delete-orphan")
    indicator_values = db.relationship("IndicatorValue", back_populates="tenant",lazy="noload", cascade="all, delete-orphan")
    outcomes = db.relationship("Outcome", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    outcome_indicators = db.relationship("OutcomeIndicator", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    
    objectives = db.relationship("Objective", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    keyresults = db.relationship("KeyResult", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    objective_keyresults = db.relationship("ObjectiveKeyResult", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    keyresult_events = db.relationship("KeyresultEvent", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    snapshots = db.relationship("Snapshot", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    snapshot_items = db.relationship("SnapshotItem", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")

    programs = db.relationship("Program", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    fundings = db.relationship("Funding", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")

    projects = db.relationship("Project", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    project_objectives = db.relationship("ProjectObjective", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    project_tasks = db.relationship("ProjectTask", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    project_milestones = db.relationship("ProjectMilestone", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    project_risks = db.relationship("ProjectRisk", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    project_phases = db.relationship("ProjectPhase", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    project_keyresults = db.relationship("ProjectKeyResult", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")

    tasks = db.relationship("Task", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    task_dependencies = db.relationship("TaskDependency", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    
    meetings = db.relationship("Meeting", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    meeting_transcriptions = db.relationship("MeetingTranscription", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    meeting_summaries = db.relationship("MeetingSummary", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")

    milestones = db.relationship("Milestone", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    risks = db.relationship("Risk", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    phases = db.relationship("Phase", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    initiatives = db.relationship("Initiative", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    
    budgets = db.relationship("Budget", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    expenses = db.relationship("Expense", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    transactions = db.relationship("Transaction", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    donors = db.relationship("Donor", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    invoices = db.relationship("Invoice", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    
    problem_types = db.relationship("ProblemType", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    repair_tickets = db.relationship("RepairTicket", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    issues = db.relationship("Issue", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    ticket_events = db.relationship("TicketEvent", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    ticket_comments = db.relationship("TicketComment", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    delay_alert_recipients = db.relationship("DelayAlertRecipient", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    delay_alert_logs = db.relationship("DelayAlertLog", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    
    email_config = db.relationship("EmailConfig", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    alert_config = db.relationship("AlertConfig", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    alert_recipient_configs = db.relationship("AlertRecipientConfig", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    
    equipment_category_groups = db.relationship("EquipmentCategoryGroup", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    equipment_categories = db.relationship("EquipmentCategory", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    equipment_brands = db.relationship("EquipmentBrand", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    equipment = db.relationship("Equipment", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    equipment_history = db.relationship("EquipmentHistory", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    accessories = db.relationship("Accessory", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    equipment_imeis = db.relationship("EquipmentImei", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")

    sites = db.relationship("Site", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")

    def to_dict(self, include_relations:bool=False):
        data = {
            "id": self.id, 
            "name": self.name, 
            "options": self.options, 
            "description": self.description, 
            # "created_at": self.created_at.isoformat() if self.created_at else None,
            # "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            # "deleted_at": self.deleted_at.isoformat() if self.deleted_at else None,
        }

        if include_relations:
            data.update({
                "organisations": [d.to_dict(False) for d in self.organisations],
                "host_links": [c.to_dict() for c in self.host_links or []],

                "datasources": [d.to_dict(False) for d in self.datasources],
                "datasource_connections": [d.to_dict(False) for d in self.datasource_connections],
                "datasource_ssh_configs": [d.to_dict(False) for d in self.datasource_ssh_configs],
                "datasource_credentials": [d.to_dict(False) for d in self.datasource_credentials],
                "datasource_histories": [d.to_dict(False) for d in self.datasource_histories],

                "visualizations": [d.to_dict(False) for d in self.visualizations],
                "visualization_charts": [d.to_dict(False) for d in self.visualization_charts],
                "visualization_executions": [d.to_dict(False) for d in self.visualization_executions],
                "visualization_dhis2_validations": [d.to_dict(False) for d in self.visualization_dhis2_validations],
                "visualization_views": [d.to_dict(False) for d in self.visualization_views],

                "datasets": [d.to_dict(False) for d in self.datasets],
                "dataset_fields": [d.to_dict(False) for d in self.dataset_fields],
                "dataset_queries": [d.to_dict(False) for d in self.dataset_queries],
                "dataset_charts": [d.to_dict(False) for d in self.dataset_charts],

                "scripts": [d.to_dict(False) for d in self.scripts],
                "scripts_execution_logs": [d.to_dict(False) for d in self.scripts_execution_logs],

                "users": [d.to_dict(False) for d in self.users],
                "roles": [d.to_dict(False) for d in self.roles],
                "permissions": [d.to_dict(False) for d in self.permissions],
                "lineages": [d.to_dict(False) for d in self.lineages],
                "ai_query_logs": [d.to_dict(False) for d in self.ai_query_logs],
            })

        return data
    
    @classmethod
    def active(cls):
        return cls.query.filter(cls.deleted.is_(False),cls.deleted_at.is_(None))

    
    def __repr__(self):
        return f"<Tenant {self.name}>"

