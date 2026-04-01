from dataclasses import dataclass
from enum import Enum
from typing import List
from backend.src.app.configs.extensions import db
from backend.src.app.models._controls import MetaxMixin
from sqlalchemy import text
from sqlalchemy.dialects.postgresql import JSONB


@dataclass
class ChtSources:
    chtdb: str
    localdb: str

CHT_SOURCE_TYPES: List[ChtSources] = [
    ChtSources("medic", "docs"),
    ChtSources("_users", "users"),
    ChtSources("medic-logs", "logs"),
    ChtSources("medic-sentinel", "metas"),
    ChtSources("medic-users-meta", "sentinel"),
]

def apply_tenant_scope(query, model, current_user):
    if current_user and current_user.is_superadmin:
        return query

    if hasattr(model, "tenant_id"):
        return query.filter(model.tenant_id == current_user.tenant_id)

    return query

# -------------------- TENANT --------------------
class Tenant(db.Model, MetaxMixin):
    __tablename__ = "tenants"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255), nullable=False, unique=True)
    options = db.Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    description = db.Column(db.String(255), nullable=True)

    organisations = db.relationship("Organisation", back_populates="tenant", cascade="all, delete-orphan")

    sources = db.relationship("CountryDatasource", back_populates="tenant",lazy="noload", cascade="all, delete-orphan")
    users = db.relationship("User", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    datasets = db.relationship("Dataset", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    datasources = db.relationship("DataSource", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    visualizations = db.relationship("Visualization", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    visualization_charts = db.relationship("VisualizationChart", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    permissions = db.relationship("DataSourcePermission", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    fields = db.relationship("DatasetField", back_populates="tenant", cascade="all, delete-orphan")
    connections = db.relationship("DataSourceConnection", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    ssh_configs = db.relationship("DataSourceSSHConfig", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    credentials = db.relationship("DataSourceCredential", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    histories = db.relationship("DataSourceHistory", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    executions = db.relationship("VisualizationExecution", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    dhis2_validations = db.relationship("VisualizationDhis2Validation", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    lineages = db.relationship("DataLineage", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    ai_query_logs = db.relationship("AIQueryLog", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    scripts = db.relationship("Script", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    scripts_execution_logs = db.relationship("ScriptExecutionLog", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    orgunit_levels = db.relationship("OrgUnitLevel", lazy="noload", cascade="all, delete-orphan")
    roles = db.relationship("Role", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    queries = db.relationship("DatasetQuery", back_populates="tenant",lazy="noload", cascade="all, delete-orphan")
    charts = db.relationship("DatasetChart", back_populates="tenant",lazy="noload", cascade="all, delete-orphan")
    visualization_views = db.relationship("VisualizationView", back_populates="tenant",lazy="noload", cascade="all, delete-orphan")
    visualization_shares = db.relationship("VisualizationShare", back_populates="tenant",lazy="noload", cascade="all, delete-orphan")
    data_targets = db.relationship("DataTarget", back_populates="tenant",lazy="noload", cascade="all, delete-orphan")
    layouts = db.relationship("VisualizationLayout", back_populates="tenant",lazy="noload", cascade="all, delete-orphan")
    definitions = db.relationship("VisualizationDefinition", back_populates="tenant",lazy="noload", cascade="all, delete-orphan")

    okr_strategies = db.relationship("Strategy", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    okr_axes = db.relationship("StrategicAxis", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    okr_programs = db.relationship("Program", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    okr_projects = db.relationship("Project", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    okr_fundings = db.relationship("Funding", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    okr_globals = db.relationship("Global", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    okr_team_scopes = db.relationship("TeamScope", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    okr_initiatives = db.relationship("Initiative", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    okr_objectives = db.relationship("Objective", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    key_results = db.relationship("KeyResult", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    kr_events = db.relationship("KREvent", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    okr_activities = db.relationship("Activity", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    okr_project_tasks = db.relationship("ProjectTask", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    project_milestones = db.relationship("ProjectMilestone", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    project_risks = db.relationship("ProjectRisk", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    project_phases = db.relationship("ProjectPhase", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    okr_indicators = db.relationship("Indicator", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    indicator_values = db.relationship("IndicatorValue", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    okr_outcomes = db.relationship("Outcome", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    okr_snapshots = db.relationship("Snapshot", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
   
    teams = db.relationship("Team", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")

    def to_dict(self, include_relations:bool=False):
        data = {
            "id": self.id, 
            "name": self.name, 
            "options": self.options, 
            "description": self.description, 
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "deleted_at": self.deleted_at.isoformat() if self.deleted_at else None,
            "sources": [c.to_dict() for c in self.sources or []],
        }

        if include_relations:
            data.update({
                "organisations": [d.to_dict(include_relations=False) for d in self.organisations],
                "users": [d.to_dict(include_relations=False) for d in self.users],
                "datasets": [d.to_dict(include_relations=False) for d in self.datasets],
                "datasources": [d.to_dict(include_relations=False) for d in self.datasources],
                "visualizations": [d.to_dict(include_relations=False) for d in self.visualizations],
                "visualization_charts": [d.to_dict(include_relations=False) for d in self.visualization_charts],
                "permissions": [d.to_dict(include_relations=False) for d in self.permissions],
                "fields": [d.to_dict(include_relations=False) for d in self.fields],
                "connections": [d.to_dict(include_relations=False) for d in self.connections],
                "ssh_configs": [d.to_dict(include_relations=False) for d in self.ssh_configs],
                "credentials": [d.to_dict(include_relations=False) for d in self.credentials],
                "histories": [d.to_dict(include_relations=False) for d in self.histories],
                "executions": [d.to_dict(include_relations=False) for d in self.executions],
                "dhis2_validations": [d.to_dict(include_relations=False) for d in self.dhis2_validations],
                "lineages": [d.to_dict(include_relations=False) for d in self.lineages],
                "ai_query_logs": [d.to_dict(include_relations=False) for d in self.ai_query_logs],
                "scripts": [d.to_dict(include_relations=False) for d in self.scripts],
                "scripts_execution_logs": [d.to_dict(include_relations=False) for d in self.scripts_execution_logs],
                "orgunits": [d.to_dict(include_relations=False) for d in self.orgunits],
                "roles": [d.to_dict(include_relations=False) for d in self.roles],
                "queries": [d.to_dict(include_relations=False) for d in self.queries],
                "charts": [d.to_dict(include_relations=False) for d in self.charts],
                "visualization_views": [d.to_dict(include_relations=False) for d in self.visualization_views],
            })

        return data
    
    @classmethod
    def active(cls):
        return cls.query.filter(cls.deleted.is_(False),cls.deleted_at.is_(None))

    
    def __repr__(self):
        return f"<Tenant {self.name}>"

