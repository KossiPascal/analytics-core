import enum
import uuid
from datetime import datetime, date as _date
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text
from backend.src.databases.extensions import db
from sqlalchemy.dialects.postgresql import JSONB

from backend.src.models.controls import AuditMixin


# Avec Strategy + Axis :
# STRATEGY -> AXIS -> OKR -> PROJECT -> ACTIVITY
# 👉 répondre à :
# Pourquoi ce projet existe ?
# À quel objectif stratégique il contribue ?
# Quelle vision globale il sert ?

# 🔥 un système de pilotage stratégique basé sur la donnée terrain
# 👉 le moteur automatique complet : Activity → KR → Objective → Score global


def generate_uuid():
    return str(uuid.uuid4())

# ENUMS
class DirectionEnum(enum.Enum):
    INCREASE = "increase"
    DECREASE = "decrease"
    MAINTAIN = "maintain"          # garder une valeur stable
    RANGE = "range"                # rester dans une plage (ex: 95-100%)

class ActivityStatusEnum(enum.Enum):
    DRAFT = "draft"
    PLANNED = "planned"
    APPROVED = "approved"
    IN_PROGRESS = "in_progress"
    BLOCKED = "blocked"
    ON_HOLD = "on_hold"
    DONE = "done"
    CANCELLED = "cancelled"

class ActivityPriorityEnum(enum.Enum):
    VERY_LOW = "very_low"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class TaskStatusEnum(enum.Enum):
    BACKLOG = "backlog"
    TODO = "todo"
    READY = "ready"
    DOING = "doing"
    REVIEW = "review"
    BLOCKED = "blocked"
    DONE = "done"
    CANCELLED = "cancelled"

class ProjectStatusEnum(enum.Enum):
    DRAFT = "draft"
    PLANNED = "planned"
    ACTIVE = "active"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class RiskLevelEnum(enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class MilestoneStatusEnum(enum.Enum):
    PENDING = "pending"
    ACHIEVED = "achieved"
    DELAYED = "delayed"

class OkrGlobalStatusEnum(enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    ARCHIVED = "archived"



# STRATEGY (vision globale)
class OkrStrategy(db.Model,AuditMixin):
    __tablename__ = "strategies"
    __table_args__ = {"schema": "okrmanager"}

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    name = db.Column(db.String, nullable=False)
    description = db.Column(db.Text)

    tenant = db.relationship("Tenant", back_populates="okr_strategies", lazy="noload", foreign_keys=[tenant_id])

    axes = db.relationship("OkrStrategicAxis", back_populates="strategy",lazy="noload", cascade="all, delete-orphan")

    
    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "name": self.name,
            "description": self.description,
        }

        if include_relations:
            base.update({
                "tenant": self.tenant.to_dict(include_relations=False) if self.tenant else None,
                "axes": [v.to_dict(include_relations=False) for v in self.axes or []],
            })

        return base
    
    
# STRATEGIC AXES (grands piliers)
class OkrStrategicAxis(db.Model,AuditMixin):
    __tablename__ = "strategic_axes"
    __table_args__ = {"schema": "okrmanager"}

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    strategy_id = db.Column(db.BigInteger, db.ForeignKey("okrmanager.strategies.id"), nullable=False)
    name = db.Column(db.String, nullable=False)
    description = db.Column(db.Text)
    
    tenant = db.relationship("Tenant", back_populates="okr_axes", lazy="noload", foreign_keys=[tenant_id])
    strategy = db.relationship("OkrStrategy", back_populates="axes", lazy="noload", foreign_keys=[strategy_id])

    programs = db.relationship("OkrProgram", back_populates="strategic_axis", lazy="noload", cascade="all, delete-orphan")
    
    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "strategy_id": self.strategy_id,
            "name": self.name,
            "description": self.description,
        }

        if include_relations:
            base.update({
                "tenant": self.tenant.to_dict(include_relations=False) if self.tenant else None,
                "strategy": self.strategy.to_dict(include_relations=False) if self.strategy else None,
                "programs": [v.to_dict(include_relations=False) for v in self.programs or []],
            })

        return base

# PROGRAMS / PROJECTS
class OkrProgram(db.Model,AuditMixin):
    __tablename__ = "programs"
    __table_args__ = {"schema": "okrmanager"}

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    team_id = db.Column(db.BigInteger, db.ForeignKey("teams.id"))
    strategic_axis_id = db.Column(db.BigInteger, db.ForeignKey("okrmanager.strategic_axes.id"))
    name = db.Column(db.String, nullable=False)
    description = db.Column(db.Text)
    status = db.Column(db.Enum(ProjectStatusEnum), default=ProjectStatusEnum.PLANNED)
    
    tenant = db.relationship("Tenant", back_populates="okr_programs", lazy="noload", foreign_keys=[tenant_id])
    team = db.relationship("Team", back_populates="programs", lazy="noload", foreign_keys=[team_id])
    strategic_axis = db.relationship("OkrStrategicAxis", back_populates="programs", lazy="noload", foreign_keys=[strategic_axis_id])
   
    projects = db.relationship("OkrProject", back_populates="program", lazy="noload", cascade="all, delete-orphan")

    
    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "team_id": self.team_id,
            "strategic_axis_id": self.strategic_axis_id,
            "name": self.name,
            "description": self.description,
            "status": self.status.value if self.status else None,
        }

        if include_relations:
            base.update({
                "tenant": self.tenant.to_dict(include_relations=False) if self.tenant else None,
                "team": self.team.to_dict(include_relations=False) if self.team else None,
                "strategic_axis": self.strategic_axis.to_dict(include_relations=False) if self.strategic_axis else None,
                "projects": [v.to_dict(include_relations=False) for v in self.projects or []],
            })

        return base

class OkrProject(db.Model,AuditMixin):
    __tablename__ = "projects"
    __table_args__ = {"schema": "okrmanager"}

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    program_id = db.Column(db.BigInteger, db.ForeignKey("okrmanager.programs.id", ondelete="CASCADE"), nullable=False, index=True)
    team_id = db.Column(db.BigInteger, db.ForeignKey("teams.id", ondelete="CASCADE"), nullable=False, index=True)
    okr_team_id = db.Column(db.BigInteger, db.ForeignKey("okrmanager.okr_team_scopes.id", ondelete="CASCADE"), nullable=False, index=True)
    
    name = db.Column(db.String, nullable=False)
    description = db.Column(db.Text)
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    budget = db.Column(db.Float)
    donor = db.Column(db.String)
    currency = db.Column(db.String, default="USD")
    spent_budget = db.Column(db.Float, default=0)
    status = db.Column(db.Enum(ProjectStatusEnum), default=ProjectStatusEnum.PLANNED)

    tenant = db.relationship("Tenant", back_populates="okr_projects", lazy="noload", foreign_keys=[tenant_id])
    program = db.relationship("OkrProgram", back_populates="projects", lazy="noload", foreign_keys=[program_id])
    team = db.relationship("Team", back_populates="projects", lazy="noload", foreign_keys=[team_id])
    okr_team = db.relationship("OkrTeamScope", back_populates="projects", lazy="noload", foreign_keys=[okr_team_id])

    fundings = db.relationship("Funding", back_populates="project", lazy="noload", cascade="all, delete-orphan")
    activities = db.relationship("OkrActivity", back_populates="project", lazy="noload", cascade="all, delete-orphan")
    tasks = db.relationship("OkrProjectTask", back_populates="project", lazy="noload", cascade="all, delete-orphan")
    milestones = db.relationship("ProjectMilestone", back_populates="project", lazy="noload", cascade="all, delete-orphan")
    risks = db.relationship("ProjectRisk", back_populates="project", lazy="noload", cascade="all, delete-orphan")
    phases = db.relationship("ProjectPhase", back_populates="project", lazy="noload", cascade="all, delete-orphan")
    project_objectives = db.relationship("OkrProjectObjective", back_populates="project", lazy="noload", cascade="all, delete-orphan")
    
    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "program_id": self.program_id,
            "team_id": self.team_id,
            "okr_team_id": self.okr_team_id,
            "name": self.name,
            "start_date": self.start_date,
            "end_date": self.end_date,
            "budget": self.budget,
            "donor": self.donor,
            "currency": self.currency,
            "spent_budget": self.spent_budget,
            "status": self.status.value if self.status else None,
        }

        if include_relations:
            base.update({
                "tenant": self.tenant.to_dict(include_relations=False) if self.tenant else None,
                "program": self.program.to_dict(include_relations=False) if self.program else None,
                "team": self.team.to_dict(include_relations=False) if self.team else None,
                "okr_team": self.okr_team.to_dict(include_relations=False) if self.okr_team else None,

                "fundings": [v.to_dict(include_relations=False) for v in self.fundings or []],
                "activities": [v.to_dict(include_relations=False) for v in self.activities or []],
                "tasks": [v.to_dict(include_relations=False) for v in self.tasks or []],
                "milestones": [v.to_dict(include_relations=False) for v in self.milestones or []],
                "risks": [v.to_dict(include_relations=False) for v in self.risks or []],
                "phases": [v.to_dict(include_relations=False) for v in self.phases or []],
                "project_objectives": [v.to_dict(include_relations=False) for v in self.project_objectives or []],
            })

        return base

class Funding(db.Model,AuditMixin):
    __tablename__ = "fundings"
    __table_args__ = {"schema": "okrmanager"}

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = db.Column(db.BigInteger, db.ForeignKey("okrmanager.projects.id"), nullable=False)
    donor = db.Column(db.String, nullable=False)
    amount = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String, default="USD")
    
    tenant = db.relationship("Tenant", back_populates="okr_fundings", lazy="noload", foreign_keys=[tenant_id])
    project = db.relationship("OkrProject", back_populates="fundings", lazy="noload", foreign_keys=[project_id])
    
    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "project_id": self.project_id,
            "donor": self.donor,
            "amount": self.amount,
            "currency": self.currency,
        }

        if include_relations:
            base.update({
                "tenant": self.tenant.to_dict(include_relations=False) if self.tenant else None,
                "project": self.project.to_dict(include_relations=False) if self.project else None,
                # "": [v.to_dict(include_relations=False) for v in self. or []],
            })

        return base

# OKR
class OkrGlobal(db.Model,AuditMixin):
    __tablename__ = "okr_globals"
    __table_args__ = {"schema": "okrmanager"}

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)

    name = db.Column(db.String, nullable=False)
    description = db.Column(db.Text)
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    
    tenant = db.relationship("Tenant", back_populates="okr_globals", lazy="noload", foreign_keys=[tenant_id])

    teams = db.relationship("OkrTeamScope", back_populates="okr_global", lazy="noload", cascade="all, delete-orphan")
    snapshots = db.relationship("OkrSnapshot", back_populates="okr_global", lazy="noload", cascade="all, delete-orphan")
    
    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "name": self.name,
            "description": self.description,
            "start_date": self.start_date,
            "end_date": self.end_date,
        }

        if include_relations:
            base.update({
                "tenant": self.tenant.to_dict(include_relations=False) if self.tenant else None,
                "teams": [v.to_dict(include_relations=False) for v in self.teams or []],
                "snapshots": [v.to_dict(include_relations=False) for v in self.snapshots or []],
            })

        return base

class OkrTeamScope(db.Model,AuditMixin):
    __tablename__ = "okr_team_scopes"
    __table_args__ = {"schema": "okrmanager"}

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    team_id = db.Column(db.BigInteger, db.ForeignKey("teams.id"), nullable=False)
    okr_global_id = db.Column(db.BigInteger, db.ForeignKey("okrmanager.okr_globals.id"), nullable=False)
    
    name = db.Column(db.String, nullable=False)
    description = db.Column(db.Text)
    status = db.Column(db.Enum(OkrGlobalStatusEnum), default=OkrGlobalStatusEnum.ACTIVE)
    
    tenant = db.relationship("Tenant", back_populates="okr_team_scopes", lazy="noload", foreign_keys=[tenant_id])
    team = db.relationship("Team", back_populates="teams", lazy="noload", foreign_keys=[team_id])
    okr_global = db.relationship("OkrGlobal", back_populates="teams", lazy="noload", foreign_keys=[okr_global_id])

    initiatives = db.relationship("OkrInitiative", back_populates="okr_team",lazy="noload", cascade="all, delete-orphan")
    projects = db.relationship("OkrProject", back_populates="okr_team",lazy="noload", cascade="all, delete-orphan")
    objectives = db.relationship("OkrObjective", back_populates="okr_team", lazy="noload", cascade="all, delete-orphan")

    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "team_id": self.team_id,
            "okr_global_id": self.okr_global_id,
            "name": self.name,
            "description": self.description,
            "status": self.status.value if self.status else None,
        }

        if include_relations:
            base.update({
                "tenant": self.tenant.to_dict(include_relations=False) if self.tenant else None,
                "team": self.team.to_dict(include_relations=False) if self.team else None,
                "okr_global": self.okr_global.to_dict(include_relations=False) if self.okr_global else None,
                "initiatives": [v.to_dict(include_relations=False) for v in self.initiatives or []],
                "projects": [v.to_dict(include_relations=False) for v in self.projects or []],
                "objectives": [v.to_dict(include_relations=False) for v in self.objectives or []],
            })

        return base

class OkrInitiative(db.Model,AuditMixin):
    __tablename__ = "initiatives"
    __table_args__ = {"schema": "okrmanager"}

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    okr_team_id = db.Column(db.BigInteger, db.ForeignKey("okrmanager.okr_team_scopes.id"), nullable=False)
    
    name = db.Column(db.String, nullable=False)
    description = db.Column(db.Text)
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    budget = db.Column(db.Float)
    currency = db.Column(db.String, default="USD")
    status = db.Column(db.Enum(ProjectStatusEnum), default=ProjectStatusEnum.PLANNED)
    
    tenant = db.relationship("Tenant", back_populates="okr_initiatives", lazy="noload", foreign_keys=[tenant_id])
    okr_team = db.relationship("OkrTeamScope", back_populates="initiatives", lazy="noload", foreign_keys=[okr_team_id])

    objectives = db.relationship("OkrObjective", back_populates="initiative",lazy="noload", cascade="all, delete-orphan")
    
    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "okr_team_id": self.okr_team_id,
            "name": self.name,
            "description": self.description,
            "start_date": self.start_date,
            "end_date": self.end_date,
            "budget": self.budget,
            "currency": self.currency,
            "status": self.status.value if self.status else None,
        }

        if include_relations:
            base.update({
                "tenant": self.tenant.to_dict(include_relations=False) if self.tenant else None,
                "okr_team": self.okr_team.to_dict(include_relations=False) if self.okr_team else None,
                "objectives": [v.to_dict(include_relations=False) for v in self.objectives or []],
            })

        return base

class OkrObjective(db.Model,AuditMixin):
    __tablename__ = "objectives"
    __table_args__ = {"schema": "okrmanager"}

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    initiative_id = db.Column(db.BigInteger, db.ForeignKey("okrmanager.initiatives.id"))
    okr_team_id = db.Column(db.BigInteger, db.ForeignKey("okrmanager.okr_team_scopes.id"))
    # project_id = db.Column(db.BigInteger, db.ForeignKey("okrmanager.projects.id"), nullable=True)
    name = db.Column(db.String, nullable=False)
    description = db.Column(db.Text)
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    status = db.Column(db.Enum(OkrGlobalStatusEnum), default=OkrGlobalStatusEnum.ACTIVE)
    
    tenant = db.relationship("Tenant", back_populates="okr_objectives", lazy="noload", foreign_keys=[tenant_id])
    initiative = db.relationship("OkrInitiative", back_populates="objectives", lazy="noload", foreign_keys=[initiative_id])
    okr_team = db.relationship("OkrTeamScope", back_populates="objectives", lazy="noload", foreign_keys=[okr_team_id])
    # project = db.relationship("OkrProject", back_populates="okr_objectives", lazy="noload", foreign_keys=[project_id])
    key_results = db.relationship("OkrKeyResult", back_populates="objective",lazy="noload", cascade="all, delete-orphan")
    project_objectives = db.relationship("OkrProjectObjective", back_populates="objective", lazy="noload", cascade="all, delete-orphan")
    
    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "initiative_id": self.initiative_id,
            "okr_team_id": self.okr_team_id,
            "name": self.name,
            "description": self.description,
            "start_date": self.start_date,
            "end_date": self.end_date,
            "status": self.status.value if self.status else None,
        }

        if include_relations:
            base.update({
                "tenant": self.tenant.to_dict(include_relations=False) if self.tenant else None,
                "initiative": self.initiative.to_dict(include_relations=False) if self.initiative else None,
                "okr_team": self.okr_team.to_dict(include_relations=False) if self.okr_team else None,
                "key_results": [v.to_dict(include_relations=False) for v in self.key_results or []],
                "project_objectives": [v.to_dict(include_relations=False) for v in self.project_objectives or []],
            })

        return base

class OkrProjectObjective(db.Model,AuditMixin):
    __tablename__ = "project_objectives"
    __table_args__ = {"schema": "okrmanager"}

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    project_id = db.Column(db.BigInteger, db.ForeignKey("okrmanager.projects.id"), nullable=False)
    objective_id = db.Column(db.BigInteger, db.ForeignKey("okrmanager.objectives.id"), nullable=False)

    project = db.relationship("OkrProject", back_populates="project_objectives", lazy="noload", foreign_keys=[project_id])
    objective = db.relationship("OkrObjective", back_populates="project_objectives", lazy="noload", foreign_keys=[objective_id])

    
    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "project_id": self.project_id,
            "objective_id": self.objective_id,
        }

        if include_relations:
            base.update({
                "project": self.project.to_dict(include_relations=False) if self.project else None,
                "objective": self.objective.to_dict(include_relations=False) if self.objective else None,
            })

        return base

class OkrKeyResult(db.Model,AuditMixin):
    __tablename__ = "key_results"
    __table_args__ = {"schema": "okrmanager"}

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    objective_id = db.Column(db.BigInteger, db.ForeignKey("okrmanager.objectives.id"), nullable=False)
    name = db.Column(db.String, nullable=False)
    description = db.Column(db.Text)
    direction = db.Column(db.Enum(DirectionEnum), default=DirectionEnum.INCREASE)
    target_value = db.Column(db.Float)
    current_value = db.Column(db.Float, default=0)
    status = db.Column(db.Enum(OkrGlobalStatusEnum), default=OkrGlobalStatusEnum.ACTIVE)

    type = db.Column(db.String)
    unit = db.Column(db.String)
    start_value = db.Column(db.Float, default=0)
    progress = db.Column(db.Float, default=0)
    weight = db.Column(db.Float, default=1)
    impact = db.Column(db.Float, default=1)
    
    tenant = db.relationship("Tenant", back_populates="key_results", lazy="noload", foreign_keys=[tenant_id])
    objective = db.relationship("OkrObjective", back_populates="key_results", lazy="noload", foreign_keys=[objective_id])

    events = db.relationship("OkrKREvent", back_populates="key_result", lazy="noload", cascade="all, delete-orphan")
    activity_links = db.relationship("OkrActivityLinkKR", back_populates="key_result", lazy="noload", cascade="all, delete-orphan")
    
    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "objective_id": self.objective_id,
            "name": self.name,
            "description": self.description,
            "direction": self.direction,
            "target_value": self.target_value,
            "current_value": self.current_value,
            "status": self.status.value if self.status else None,

            "type": self.type,
            "unit": self.unit,
            "start_value": self.start_value,
            "progress": self.progress,
            "weight": self.weight,
            "impact": self.impact,
        }

        if include_relations:
            base.update({
                "tenant": self.tenant.to_dict(include_relations=False) if self.tenant else None,
                "objective": self.objective.to_dict(include_relations=False) if self.objective else None,
                "events": [v.to_dict(include_relations=False) for v in self.events or []],
                "activity_links": [v.to_dict(include_relations=False) for v in self.activity_links or []],
            })

        return base

class OkrKREvent(db.Model,AuditMixin):
    __tablename__ = "kr_events"
    __table_args__ = {"schema": "okrmanager"}

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    key_result_id = db.Column(db.BigInteger, db.ForeignKey("okrmanager.key_results.id"), nullable=False)
    value = db.Column(db.Float, nullable=False)
    date = db.Column(db.Date, default=_date.today)
    source = db.Column(db.String)
    
    tenant = db.relationship("Tenant", back_populates="kr_events", lazy="noload", foreign_keys=[tenant_id])
    key_result = db.relationship("OkrKeyResult", back_populates="events", lazy="noload", foreign_keys=[key_result_id])
    
    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "key_result_id": self.key_result_id,
            "value": self.value,
            "date": self.date,
            "source": self.source,
        }

        if include_relations:
            base.update({
                "tenant": self.tenant.to_dict(include_relations=False) if self.tenant else None,
                "key_result": self.key_result.to_dict(include_relations=False) if self.key_result else None,
                # "": [v.to_dict(include_relations=False) for v in self. or []],
            })

        return base

# ACTIVITIES
class OkrActivity(db.Model,AuditMixin):
    __tablename__ = "activities"
    __table_args__ = {"schema": "okrmanager"}

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = db.Column(db.BigInteger, db.ForeignKey("okrmanager.projects.id"))
    team_id = db.Column(db.BigInteger, db.ForeignKey("teams.id"))

    name = db.Column(db.String, nullable=False)
    description = db.Column(db.Text)
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    due_date = db.Column(db.Date)
    status = db.Column(db.Enum(ActivityStatusEnum), default=ActivityStatusEnum.PLANNED)
    priority = db.Column(db.Enum(ActivityPriorityEnum), default=ActivityPriorityEnum.MEDIUM)
    budget = db.Column(db.Float, default=0)
    spent_budget = db.Column(db.Float, default=0)
    currency = db.Column(db.String, default="USD")
    progress = db.Column(db.Float, default=0)
    beneficiaries = db.Column(db.Integer)
    
    tenant = db.relationship("Tenant", back_populates="okr_activities", lazy="noload", foreign_keys=[tenant_id])
    project = db.relationship("OkrProject", back_populates="activities", lazy="noload", foreign_keys=[project_id])
    team = db.relationship("Team", back_populates="activities", lazy="noload", foreign_keys=[team_id])

    owners = db.relationship("OkrActivityOwner", back_populates="activity",lazy="noload", cascade="all, delete-orphan")
    kr_links = db.relationship("OkrActivityLinkKR", back_populates="activity",lazy="noload", cascade="all, delete-orphan")
    indicator_values = db.relationship("IndicatorValue", back_populates="activity", lazy="noload", cascade="all, delete-orphan")

    # completion = db.Column(db.Float, default=0)
    # progress = db.Column(db.Float, default=0)
    # owners = db.relationship("OkrUser", secondary="activity_owners", back_populates="activities")
    # dependencies_from = db.relationship("OkrActivityDependency",back_populates="from_activity",foreign_keys="ActivityDependency.from_id",lazy="noload", cascade="all, delete-orphan")
    # dependencies_to = db.relationship("OkrActivityDependency",back_populates="to_activity",foreign_keys="ActivityDependency.to_id",lazy="noload", cascade="all, delete-orphan")

    # krs = db.relationship("KeyResult", secondary="activity_link_kr")
    
    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "project_id": self.project_id,
            "team_id": self.team_id,
            "name": self.name,
            "description": self.description,
            "status": self.status.value if self.status else None,
            "priority": self.priority.value if self.priority else None,
            "start_date": self.start_date,
            "due_date": self.due_date,
            "progress": self.progress,
            "beneficiaries": self.beneficiaries,
        }

        if include_relations:
            base.update({
                "tenant": self.tenant.to_dict(include_relations=False) if self.tenant else None,
                "project": self.project.to_dict(include_relations=False) if self.project else None,
                "team": self.team.to_dict(include_relations=False) if self.team else None,
                "owners": [v.to_dict(include_relations=False) for v in self.owners or []],
                "kr_links": [v.to_dict(include_relations=False) for v in self.kr_links or []],
                "indicator_values": [v.to_dict(include_relations=False) for v in self.indicator_values or []],
            })

        return base

class OkrActivityOwner(db.Model,AuditMixin):
    __tablename__ = "activity_owners"
    __table_args__ = {"schema": "okrmanager"}

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    activity_id = db.Column(db.BigInteger, db.ForeignKey("okrmanager.activities.id"), nullable=False)
    user_id = db.Column(db.BigInteger, db.ForeignKey("users.id"), nullable=False)
    
    activity = db.relationship("OkrActivity", back_populates="owners", lazy="noload", foreign_keys=[activity_id])
    user = db.relationship("User", back_populates="okr_activity_owners", lazy="noload", foreign_keys=[user_id])

    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "activity_id": self.activity_id,
            "user_id": self.user_id,
        }

        if include_relations:
            base.update({
                "activity": self.activity.to_dict(include_relations=False) if self.activity else None,
                "user": self.user.to_dict(include_relations=False) if self.user else None,
                # "": [v.to_dict(include_relations=False) for v in self. or []],
            })

        return base

class OkrActivityLinkKR(db.Model,AuditMixin):
    __tablename__ = "activity_link_kr"
    __table_args__ = {"schema": "okrmanager"}

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    activity_id = db.Column(db.BigInteger, db.ForeignKey("okrmanager.activities.id"), nullable=False)
    key_result_id = db.Column(db.BigInteger, db.ForeignKey("okrmanager.key_results.id"), nullable=False)
    impact = db.Column(db.Float, default=1)
    weight = db.Column(db.Float, default=1.0)

    activity = db.relationship("OkrActivity", back_populates="kr_links", lazy="noload", foreign_keys=[activity_id])
    key_result = db.relationship("OkrKeyResult", back_populates="activity_links", lazy="noload", foreign_keys=[key_result_id])
    
    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "activity_id": self.activity_id,
            "key_result_id": self.key_result_id,
            "impact": self.impact,
            "weight": self.weight,
        }

        if include_relations:
            base.update({
                "activity": self.activity.to_dict(include_relations=False) if self.activity else None,
                "key_result": self.key_result.to_dict(include_relations=False) if self.key_result else None,
                # "": [v.to_dict(include_relations=False) for v in self. or []],
            })

        return base

class OkrActivityDependency(db.Model,AuditMixin):
    __tablename__ = "activity_dependencies"
    __table_args__ = {"schema": "okrmanager"}

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    activity_id = db.Column(db.BigInteger, db.ForeignKey("okrmanager.activities.id"), nullable=False)
    depends_on_id = db.Column(db.BigInteger, db.ForeignKey("okrmanager.activities.id"), nullable=False)
    
    type = db.Column(db.String)  # blocks / depends_on
    
    def to_dict(self, include_relations=True):
        base = {
            "from_id": self.activity_id,
            "to_id": self.depends_on_id,
            "type": self.type,
        }

        if include_relations:
            base.update({
                # "tenant": self.tenant.to_dict(include_relations=False) if self.tenant else None,
                # "": [v.to_dict(include_relations=False) for v in self. or []],
            })

        return base

# PROJECT MANAGEMENT
class OkrProjectTask(db.Model,AuditMixin):
    __tablename__ = "project_tasks"
    __table_args__ = {"schema": "okrmanager"}

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = db.Column(db.BigInteger, db.ForeignKey("okrmanager.projects.id"), nullable=False)
    assigned_to_id = db.Column(db.BigInteger, db.ForeignKey("users.id"))
    key_result_id = db.Column(db.BigInteger, db.ForeignKey("okrmanager.key_results.id"))
    parent_id = db.Column(db.BigInteger, db.ForeignKey("okrmanager.project_tasks.id"))
    name = db.Column(db.String, nullable=False)
    description = db.Column(db.Text)
    status = db.Column(db.Enum(TaskStatusEnum), default=TaskStatusEnum.TODO)
    progress = db.Column(db.Float)
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    
    tenant = db.relationship("Tenant", back_populates="okr_project_tasks", lazy="noload", foreign_keys=[tenant_id])
    project = db.relationship("OkrProject", back_populates="tasks", lazy="noload", foreign_keys=[project_id])
    assigned_to = db.relationship("User", back_populates="okr_project_tasks", lazy="noload", foreign_keys=[assigned_to_id])
    key_result = db.relationship("OkrKeyResult", lazy="noload", foreign_keys=[key_result_id])
    # parent = db.relationship("OkrProjectTask",remote_side=[id],backref=db.backref("children", lazy="joined"))
    parent_task = db.relationship("OkrProjectTask", remote_side=[id], back_populates="subtasks", lazy="noload")
    subtasks = db.relationship("OkrProjectTask", back_populates="parent_task", lazy="noload", cascade="all, delete-orphan")
    

    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "project_id": self.project_id,
            "assigned_to": self.assigned_to,
            "key_result_id": self.key_result_id,
            "parent_id": self.parent_id,
            "name": self.name,
            "description": self.description,
            "status": self.status.value if self.status else None,
            "progress": self.progress,
            "start_date": self.start_date,
            "end_date": self.end_date,
        }

        if include_relations:
            base.update({
                "tenant": self.tenant.to_dict(include_relations=False) if self.tenant else None,
                "project": self.project.to_dict(include_relations=False) if self.project else None,
                "assigned_to": self.assigned_to.to_dict(include_relations=False) if self.assigned_to else None,
                "key_result": self.key_result.to_dict(include_relations=False) if self.key_result else None,
                "parent": self.parent.to_dict(include_relations=False) if self.parent else None,
                "parent_task": self.parent_task.to_dict(include_relations=False) if self.parent_task else None,
                "subtasks": [t.to_dict(include_relations=False) for t in self.subtasks or []],
                # "": [v.to_dict(include_relations=False) for v in self. or []],
            })

        return base

class ProjectMilestone(db.Model,AuditMixin):
    __tablename__ = "project_milestones"
    __table_args__ = {"schema": "okrmanager"}

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = db.Column(db.BigInteger, db.ForeignKey("okrmanager.projects.id"), nullable=False)
    name = db.Column(db.String, nullable=False)
    description = db.Column(db.Text)
    due_date = db.Column(db.Date)
    status = db.Column(db.Enum(MilestoneStatusEnum), default=MilestoneStatusEnum.PENDING)
    
    tenant = db.relationship("Tenant", back_populates="project_milestones", lazy="noload", foreign_keys=[tenant_id])
    project = db.relationship("OkrProject", back_populates="milestones", lazy="noload", foreign_keys=[project_id])
    
    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "project_id": self.project_id,
            "name": self.name,
            "description": self.description,
            "due_date": self.due_date,
            "status": self.status,
        }

        if include_relations:
            base.update({
                "tenant": self.tenant.to_dict(include_relations=False) if self.tenant else None,
                "project": self.project.to_dict(include_relations=False) if self.project else None,
                # "": [v.to_dict(include_relations=False) for v in self. or []],
            })

        return base

class ProjectRisk(db.Model,AuditMixin):
    __tablename__ = "project_risks"
    __table_args__ = {"schema": "okrmanager"}

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = db.Column(db.BigInteger, db.ForeignKey("okrmanager.projects.id"), nullable=False)
    name = db.Column(db.String, nullable=False)
    description = db.Column(db.Text)
    level = db.Column(db.Enum(RiskLevelEnum), default=RiskLevelEnum.MEDIUM)
    mitigation_plan = db.Column(db.Text)
    probability = db.Column(db.Float)
    impact = db.Column(db.Float)
    
    tenant = db.relationship("Tenant", back_populates="project_risks", lazy="noload", foreign_keys=[tenant_id])
    project = db.relationship("OkrProject", back_populates="risks", lazy="noload", foreign_keys=[project_id])
    
    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "project_id": self.project_id,
            "name": self.name,
            "description": self.description,
            "level": self.level.value if self.level else None,
            "mitigation_plan": self.mitigation_plan,
            "probability": self.probability,
            "impact": self.impact,
        }

        if include_relations:
            base.update({
                "tenant": self.tenant.to_dict(include_relations=False) if self.tenant else None,
                "project": self.project.to_dict(include_relations=False) if self.project else None,
                # "": [v.to_dict(include_relations=False) for v in self. or []],
            })

        return base

class ProjectPhase(db.Model,AuditMixin):
    __tablename__ = "project_phases"
    __table_args__ = {"schema": "okrmanager"}

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = db.Column(db.BigInteger, db.ForeignKey("okrmanager.projects.id"), nullable=False)
    name = db.Column(db.String, nullable=False)
    description = db.Column(db.Text)
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    
    tenant = db.relationship("Tenant", back_populates="project_phases", lazy="noload", foreign_keys=[tenant_id])
    project = db.relationship("OkrProject", back_populates="phases", lazy="noload", foreign_keys=[project_id])
    
    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "project_id": self.project_id,
            "name": self.name,
            "description": self.description,
            "start_date": self.start_date,
            "end_date": self.end_date,
        }

        if include_relations:
            base.update({
                "tenant": self.tenant.to_dict(include_relations=False) if self.tenant else None,
                "project": self.project.to_dict(include_relations=False) if self.project else None,
                # "": [v.to_dict(include_relations=False) for v in self. or []],
            })

        return base

class ProjectOKRLink(db.Model,AuditMixin):
    __tablename__ = "project_okr_link"
    __table_args__ = {"schema": "okrmanager"}

    project_id = db.Column(db.BigInteger, db.ForeignKey("okrmanager.projects.id"), primary_key=True)
    objective_id = db.Column(db.BigInteger, db.ForeignKey("okrmanager.objectives.id"), primary_key=True)
    
    def to_dict(self, include_relations=True):
        base = {
            "project_id": self.project_id,
            "objective_id": self.objective_id,
        }

        if include_relations:
            base.update({
                # "tenant": self.tenant.to_dict(include_relations=False) if self.tenant else None,
                # "": [v.to_dict(include_relations=False) for v in self. or []],
            })

        return base

# INDICATORS / OUTCOMES
class Indicator(db.Model,AuditMixin):
    __tablename__ = "indicators"
    __table_args__ = {"schema": "okrmanager"}

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)

    name = db.Column(db.String, nullable=False)
    description = db.Column(db.Text)
    unit = db.Column(db.String)

    tenant = db.relationship("Tenant", back_populates="okr_indicators", lazy="noload", foreign_keys=[tenant_id])

    values = db.relationship("IndicatorValue", back_populates="indicator", lazy="noload", cascade="all, delete-orphan")
    
    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "name": self.name,
            "description": self.description,
            "unit": self.unit,
        }

        if include_relations:
            base.update({
                "tenant": self.tenant.to_dict(include_relations=False) if self.tenant else None,
                "values": [v.to_dict(include_relations=False) for v in self.values or []],
            })

        return base

class IndicatorValue(db.Model,AuditMixin):
    __tablename__ = "indicator_values"
    __table_args__ = {"schema": "okrmanager"}

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    indicator_id = db.Column(db.BigInteger, db.ForeignKey("okrmanager.indicators.id"), nullable=False)
    activity_id = db.Column(db.BigInteger, db.ForeignKey("okrmanager.activities.id"))
    value = db.Column(db.Float, nullable=False)
    date = db.Column(db.Date, default=datetime.utcnow)
    
    tenant = db.relationship("Tenant", back_populates="indicator_values", lazy="noload", foreign_keys=[tenant_id])
    indicator = db.relationship("Indicator", back_populates="values", lazy="noload", foreign_keys=[indicator_id])
    activity = db.relationship("OkrActivity", back_populates="indicator_values", lazy="noload", foreign_keys=[activity_id])
    
    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "indicator_id": self.indicator_id,
            "activity_id": self.activity_id,
            "value": self.value,
            "date": self.date,
        }

        if include_relations:
            base.update({
                "tenant": self.tenant.to_dict(include_relations=False) if self.tenant else None,
                "indicator": self.indicator.to_dict(include_relations=False) if self.indicator else None,
                "activity": self.activity.to_dict(include_relations=False) if self.activity else None,
                # "": [v.to_dict(include_relations=False) for v in self. or []],
            })

        return base

class Outcome(db.Model,AuditMixin):
    __tablename__ = "outcomes"
    __table_args__ = {"schema": "okrmanager"}

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    
    name = db.Column(db.String, nullable=False)
    description = db.Column(db.Text)
    
    tenant = db.relationship("Tenant", back_populates="okr_outcomes", lazy="noload", foreign_keys=[tenant_id])

    indicators = db.relationship("OutcomeIndicator", back_populates="outcome", lazy="noload", cascade="all, delete-orphan")
    
    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "name": self.name,
            "description": self.description,
        }

        if include_relations:
            base.update({
                "tenant": self.tenant.to_dict(include_relations=False) if self.tenant else None,
                "indicators": [v.to_dict(include_relations=False) for v in self.indicators or []],
            })

        return base

class OutcomeIndicator(db.Model,AuditMixin):
    __tablename__ = "outcome_indicators"
    __table_args__ = {"schema": "okrmanager"}

    outcome_id = db.Column(db.BigInteger, db.ForeignKey("okrmanager.outcomes.id"), primary_key=True)
    indicator_id = db.Column(db.BigInteger, db.ForeignKey("okrmanager.indicators.id"), primary_key=True)

    outcome = db.relationship("Outcome", back_populates="indicators", lazy="noload", foreign_keys=[outcome_id])
    indicator = db.relationship("Indicator", lazy="noload", foreign_keys=[indicator_id])
    
    def to_dict(self, include_relations=True):
        base = {
            "outcome_id": self.outcome_id,
            "indicator_id": self.indicator_id,
        }

        if include_relations:
            base.update({
                "outcome": self.outcome.to_dict(include_relations=False) if self.outcome else None,
                "indicator": self.indicator.to_dict(include_relations=False) if self.indicator else None,
                # "": [v.to_dict(include_relations=False) for v in self. or []],
            })

        return base

# SNAPSHOTS
class OkrSnapshot(db.Model,AuditMixin):
    __tablename__ = "snapshots"
    __table_args__ = {"schema": "okrmanager"}

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    okr_global_id = db.Column(db.BigInteger, db.ForeignKey("okrmanager.okr_globals.id"), nullable=False)
    
    name = db.Column(db.String, nullable=False)
    description = db.Column(db.Text)

    date = db.Column(db.Date, default=datetime.utcnow)
    breakdown = db.Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    progress = db.Column(db.Float)
    
    tenant = db.relationship("Tenant", back_populates="okr_snapshots", lazy="noload", foreign_keys=[tenant_id])
    okr_global = db.relationship("OkrGlobal", back_populates="snapshots", lazy="noload", foreign_keys=[okr_global_id])
    
    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "okr_global_id": self.okr_global_id,
            "name": self.name,
            "description": self.description,
            "date": self.date,
            "breakdown": self.breakdown,
            "progress": self.progress,
        }

        if include_relations:
            base.update({
                "tenant": self.tenant.to_dict(include_relations=False) if self.tenant else None,
                "okr_global": self.okr_global.to_dict(include_relations=False) if self.okr_global else None,
                # "": [v.to_dict(include_relations=False) for v in self. or []],
            })

        return base





# # 👉 Au lieu d’énums figés, tu rends les statuts :
# # Modèle dynamique des statuts

# class WorkflowType(db.Model):
#     __tablename__ = "workflow_types"

#     id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
#     tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
#     name = db.Column(db.String, nullable=False)  # activity, task, project, etc.

#     tenant_id = db.Column(db.BigInteger, db.ForeignKey("okrmanager.tenants.id"), nullable=False)

#     statuses = db.relationship("WorkflowStatus", back_populates="workflow_type",lazy="noload", cascade="all, delete-orphan")



# class WorkflowStatus(db.Model):
#     __tablename__ = "workflow_statuses"

#     id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
#     tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
#     name = db.Column(db.String, nullable=False)        # ex: "in_progress"
#     label = db.Column(db.String)                       # ex: "En cours"
#     color = db.Column(db.String)                       # UI

#     is_initial = db.Column(db.Boolean, default=False)
#     is_final = db.Column(db.Boolean, default=False)

#     workflow_type_id = db.Column(db.BigInteger, db.ForeignKey("okrmanager.workflow_types.id"), nullable=False)

#     transitions_from = db.relationship("WorkflowTransition", back_populates="from_status",foreign_keys="WorkflowTransition.from_status_id",,lazy="noload", cascade="all, delete-orphan")
#     transitions_to = db.relationship("WorkflowTransition", back_populates="to_status",foreign_keys="WorkflowTransition.to_status_id",lazy="noload", cascade="all, delete-orphan")


# class WorkflowTransition(db.Model):
#     __tablename__ = "workflow_transitions"

#     id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
#     tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)

#     from_status_id = db.Column(db.BigInteger, db.ForeignKey("okrmanager.workflow_statuses.id"), nullable=False)
#     to_status_id = db.Column(db.BigInteger, db.ForeignKey("okrmanager.workflow_statuses.id"), nullable=False)

#     condition = db.Column(db.String)   # ex: "manager_only"
#     auto = db.Column(db.Boolean, default=False)


# class Activity(db.Model):
#     __tablename__ = "activities"

#     id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
#     tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)

#     title = db.Column(db.String, nullable=False)

#     status_id = db.Column(db.BigInteger, db.ForeignKey("okrmanager.workflow_statuses.id"))
#     status = db.relationship("WorkflowStatus")

# OkrProject.status_id
# OkrProjectTask.status_id


# def can_transition(current_status: WorkflowStatus, next_status_id: str) -> bool:
#     return any(t.to_status_id == next_status_id for t in current_status.transitions_from)


# def apply_transition(entity, next_status: WorkflowStatus):
#     if not can_transition(entity.status, next_status.id):
#         raise Exception("Transition non autorisée")

#     entity.status = next_status



# class WorkflowTransition(db.Model):
#     __tablename__ = "workflow_transitions"

#     id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
#     tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)

#     from_status_id = db.Column(db.BigInteger, db.ForeignKey("okrmanager.workflow_statuses.id"))
#     to_status_id = db.Column(db.BigInteger, db.ForeignKey("okrmanager.workflow_statuses.id"))

#     required_role = db.Column(db.String)  # admin, manager


# class WorkflowHistory(db.Model):
#     __tablename__ = "workflow_history"

#     id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
#     tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)

#     entity_type = db.Column(db.String)
#     entity_id = db.Column(db.String)

#     from_status_id = db.Column(db.String)
#     to_status_id = db.Column(db.String)

#     changed_by = db.Column(db.BigInteger, db.ForeignKey("okrmanager.users.id"))
#     changed_at = db.Column(db.DateTime, default=datetime.utcnow)


