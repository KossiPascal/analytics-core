from backend.src.app.configs.extensions import db
from backend.src.app.models._controls import *
from backend.src.modules.okr.models._enums import MilestoneStatusEnum, RiskLevelEnum, TaskStatusEnum
from backend.src.modules.okr.models.b_program import ProjectStatusEnum


# PROJECT MANAGEMENT
class Project(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "projects"
    __table_args__ = {"schema": "proj"}

    team_id = db.Column(db.String(11), db.ForeignKey("core.teams.id", ondelete="CASCADE"), nullable=False, index=True)
    program_id = db.Column(db.String(11), db.ForeignKey("okr.programs.id", ondelete="CASCADE"), nullable=True, index=True)
    scope_id = db.Column(db.String(11), db.ForeignKey("okr.team_scopes.id", ondelete="CASCADE"), nullable=False, index=True)  # <-- renommer

    name = db.Column(db.String, nullable=False)
    description = db.Column(db.Text)
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    budget = db.Column(db.Float)
    donor = db.Column(db.String)
    currency = db.Column(db.String, default="USD")
    spent_budget = db.Column(db.Float, default=0)
    status = db.Column(db.Enum(ProjectStatusEnum), default=ProjectStatusEnum.PLANNED)

    program = db.relationship("Program", back_populates="projects", lazy="noload", foreign_keys=[program_id])
    team = db.relationship("Team", back_populates="projects", lazy="noload", foreign_keys=[team_id])
    scope = db.relationship("TeamScope", back_populates="projects", lazy="noload", foreign_keys=[scope_id])

    fundings = db.relationship("Funding", back_populates="project", lazy="noload", cascade="all, delete-orphan")
    activities = db.relationship("Activity", back_populates="project", lazy="noload", cascade="all, delete-orphan")
    tasks = db.relationship("Task", back_populates="project", lazy="noload", cascade="all, delete-orphan")
    milestones = db.relationship("Milestone", back_populates="project", lazy="noload", cascade="all, delete-orphan")
    risks = db.relationship("Risk", back_populates="project", lazy="noload", cascade="all, delete-orphan")
    phases = db.relationship("Phase", back_populates="project", lazy="noload", cascade="all, delete-orphan")
    project_objectives = db.relationship("ProjectObjective", back_populates="project", lazy="noload", cascade="all, delete-orphan")
    objectives = db.relationship("Objective", back_populates="project", lazy="noload", cascade="all, delete-orphan")
    
    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "program_id": self.program_id,
            "team_id": self.team_id,
            "scope_id": self.scope_id,
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
                "tenant": self.tenant.to_dict(False) if self.tenant else None,
                "program": self.program.to_dict(False) if self.program else None,
                "team": self.team.to_dict(False) if self.team else None,
                "scope": self.scope.to_dict(False) if self.scope else None,

                "fundings": [v.to_dict(False) for v in self.fundings or []],
                "activities": [v.to_dict(False) for v in self.activities or []],
                "tasks": [v.to_dict(False) for v in self.tasks or []],
                "milestones": [v.to_dict(False) for v in self.milestones or []],
                "risks": [v.to_dict(False) for v in self.risks or []],
                "phases": [v.to_dict(False) for v in self.phases or []],
                "project_objectives": [v.to_dict(False) for v in self.project_objectives or []],
            })

        return base

class ProjectObjective(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "project_objectives"
    __table_args__ = {"schema": "proj"}

    project_id = db.Column(db.String(11), db.ForeignKey("proj.projects.id", ondelete="CASCADE"), nullable=False, primary_key=True)
    objective_id = db.Column(db.String(11), db.ForeignKey("okr.objectives.id", ondelete="CASCADE"), nullable=False, primary_key=True)

    project = db.relationship("Project", back_populates="project_objectives", lazy="noload", foreign_keys=[project_id])
    objective = db.relationship("Objective", back_populates="project_objectives", lazy="noload", foreign_keys=[objective_id])

    def to_dict(self, include_relations=True):
        base = {
            "project_id": self.project_id,
            "objective_id": self.objective_id,
        }

        if include_relations:
            base.update({
                "project": self.project.to_dict(False) if self.project else None,
                "objective": self.objective.to_dict(False) if self.objective else None,
            })

        return base
    
# PROJECT ↔ TASK LINK
class ProjectTask(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "project_tasks"
    __table_args__ = {"schema": "proj"}

    project_id = db.Column(db.String(11), db.ForeignKey("proj.projects.id"), primary_key=True)
    task_id = db.Column(db.String(11), db.ForeignKey("proj.tasks.id"), primary_key=True)

    project = db.relationship("Project", lazy="noload", foreign_keys=[project_id])
    task = db.relationship("Task", lazy="noload", foreign_keys=[task_id])

    def to_dict(self, include_relations=True):
        base = {"project_id": self.project_id, "task_id": self.task_id}
        if include_relations:
            base.update({
                "project": self.project.to_dict(False) if self.project else None,
                "task": self.task.to_dict(False) if self.task else None,
            })
        return base

# PROJECT ↔ MILESTONE LINK
class ProjectMilestone(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "project_milestones"
    __table_args__ = {"schema": "proj"}

    project_id = db.Column(db.String(11), db.ForeignKey("proj.projects.id"), primary_key=True)
    milestone_id = db.Column(db.String(11), db.ForeignKey("proj.milestones.id"), primary_key=True)

    project = db.relationship("Project", lazy="noload", foreign_keys=[project_id])
    milestone = db.relationship("Milestone", lazy="noload", foreign_keys=[milestone_id])

    def to_dict(self, include_relations=True):
        base = {"project_id": self.project_id, "milestone_id": self.milestone_id}
        if include_relations:
            base.update({
                "project": self.project.to_dict(False) if self.project else None,
                "milestone": self.milestone.to_dict(False) if self.milestone else None,
            })
        return base

# PROJECT ↔ RISK LINK
class ProjectRisk(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "project_risks"
    __table_args__ = {"schema": "proj"}

    project_id = db.Column(db.String(11), db.ForeignKey("proj.projects.id"), primary_key=True)
    risk_id = db.Column(db.String(11), db.ForeignKey("proj.risks.id"), primary_key=True)

    project = db.relationship("Project", lazy="noload", foreign_keys=[project_id])
    risk = db.relationship("Risk", lazy="noload", foreign_keys=[risk_id])

    def to_dict(self, include_relations=True):
        base = {"project_id": self.project_id, "risk_id": self.risk_id}
        if include_relations:
            base.update({
                "project": self.project.to_dict(False) if self.project else None,
                "risk": self.risk.to_dict(False) if self.risk else None,
            })
        return base

# PROJECT ↔ PHASE LINK
class ProjectPhase(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "project_phases"
    __table_args__ = {"schema": "proj"}

    project_id = db.Column(db.String(11), db.ForeignKey("proj.projects.id"), primary_key=True)
    phase_id = db.Column(db.String(11), db.ForeignKey("proj.phases.id"), primary_key=True)

    project = db.relationship("Project", lazy="noload", foreign_keys=[project_id])
    phase = db.relationship("Phase", lazy="noload", foreign_keys=[phase_id])

    def to_dict(self, include_relations=True):
        base = {"project_id": self.project_id, "phase_id": self.phase_id}
        if include_relations:
            base.update({
                "project": self.project.to_dict(False) if self.project else None,
                "phase": self.phase.to_dict(False) if self.phase else None,
            })
        return base

# PROJECT ↔ OBJECTIVE/KEYRESULT LINK
class ProjectKeyResult(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "project_keyresults"
    __table_args__ = {"schema": "proj"}

    project_id = db.Column(db.String(11), db.ForeignKey("proj.projects.id"), primary_key=True)
    objective_id = db.Column(db.String(11), db.ForeignKey("okr.objectives.id"), primary_key=True)
    keyresult_id = db.Column(db.String(11), db.ForeignKey("okr.keyresults.id"), nullable=True)

    project = db.relationship("Project", lazy="noload", foreign_keys=[project_id])
    objective = db.relationship("Objective", lazy="noload", foreign_keys=[objective_id])
    keyresult = db.relationship("KeyResult", lazy="noload", foreign_keys=[keyresult_id])

    def to_dict(self, include_relations=True):
        base = {
            "project_id": self.project_id,
            "objective_id": self.objective_id,
            "keyresult_id": self.keyresult_id,
        }
        if include_relations:
            base.update({
                "project": self.project.to_dict(False) if self.project else None,
                "objective": self.objective.to_dict(False) if self.objective else None,
                "keyresult": self.keyresult.to_dict(False) if self.keyresult else None,
            })
        return base
    

