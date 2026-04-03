from backend.src.app.configs.extensions import db
from backend.src.app.models._controls import *
from backend.src.modules.okr.models._enums import MilestoneStatusEnum, ProjectStatusEnum, TaskStatusEnum, RiskLevelEnum, DirectionEnum



class Task(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "tasks"
    __table_args__ = {"schema": "proj"}

    project_id = db.Column(db.String(11), db.ForeignKey("proj.projects.id"), nullable=True)
    keyresult_id = db.Column(db.String(11), db.ForeignKey("okr.keyresults.id"), nullable=True)

    parent_id = db.Column(db.String(11), db.ForeignKey("proj.tasks.id"), nullable=True)
    assigned_to_id = db.Column(db.String(11), db.ForeignKey("core.users.id"), nullable=True)

    name = db.Column(db.String, nullable=False)
    description = db.Column(db.Text)
    status = db.Column(db.Enum(TaskStatusEnum), default=TaskStatusEnum.TODO)
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    progress = db.Column(db.Float, default=0)

    # Meta & priorisation
    priority = db.Column(db.Integer, default=1)        # 1=High, 2=Medium, 3=Low
    risk_level = db.Column(db.Enum(RiskLevelEnum), default=RiskLevelEnum.MEDIUM)
    weight = db.Column(db.Float, default=1)
    impact = db.Column(db.Float, default=1)
    direction = db.Column(db.Enum(DirectionEnum), default=DirectionEnum.INCREASE)

    # Relations
    project = db.relationship("Project", back_populates="tasks", lazy="noload", foreign_keys=[project_id])
    keyresult = db.relationship("KeyResult", lazy="noload", foreign_keys=[keyresult_id])
    assigned_to = db.relationship("User", lazy="noload", foreign_keys=[assigned_to_id])
    parent_task = db.relationship("Task", remote_side="Task.id", back_populates="subtasks", lazy="noload")
    subtasks = db.relationship("Task", back_populates="parent_task", lazy="noload", cascade="all, delete-orphan")
    
    milestone_id = db.Column(db.String(11), db.ForeignKey("proj.milestones.id"))
    milestone = db.relationship("Milestone", back_populates="tasks", lazy="noload")

    phase_id = db.Column(db.String(11), db.ForeignKey("proj.phases.id"))
    phase = db.relationship("Phase", back_populates="tasks", lazy="noload")

    dependencies = db.relationship(
        "TaskDependency",
        foreign_keys="[TaskDependency.task_id]",
        back_populates="task",
        lazy="noload",
        cascade="all, delete-orphan"
    )
    dependents = db.relationship(
        "TaskDependency",
        foreign_keys="[TaskDependency.depends_on_id]",
        back_populates="depends_on",
        lazy="noload",
        cascade="all, delete-orphan"
    )

    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "project_id": self.project_id,
            "keyresult_id": self.keyresult_id,
            "parent_id": self.parent_id,
            "assigned_to_id": self.assigned_to_id,
            "name": self.name,
            "description": self.description,
            "status": self.status.value if self.status else None,
            "progress": self.progress,
            "start_date": self.start_date,
            "end_date": self.end_date,
            "priority": self.priority,
            "risk_level": self.risk_level.value if self.risk_level else None,
            "weight": self.weight,
            "impact": self.impact,
            "direction": self.direction.value if self.direction else None,
        }

        if include_relations:
            base.update({
                "tenant": self.tenant.to_dict(False) if self.tenant else None,
                "project": self.project.to_dict(False) if self.project else None,
                "keyresult": self.keyresult.to_dict(False) if self.keyresult else None,
                "assigned_to": self.assigned_to.to_dict(False) if self.assigned_to else None,
                "parent_task": self.parent_task.to_dict(False) if self.parent_task else None,
                "subtasks": [t.to_dict(False) for t in self.subtasks or []],
            })

        return base
    
# MILESTONE
class Milestone(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "milestones"
    __table_args__ = {"schema": "proj"}

    project_id = db.Column(db.String(11), db.ForeignKey("proj.projects.id"), nullable=False)

    name = db.Column(db.String, nullable=False)
    description = db.Column(db.Text)
    due_date = db.Column(db.Date)
    status = db.Column(db.Enum(MilestoneStatusEnum), default=MilestoneStatusEnum.PENDING)
    
    tasks = db.relationship("Task", back_populates="milestone", lazy="noload")
    project = db.relationship("Project", back_populates="milestones", lazy="noload")

    phase_id = db.Column(db.String(11), db.ForeignKey("proj.phases.id"))
    phase = db.relationship("Phase", back_populates="milestones", lazy="noload")
    
    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "project_id": self.project_id,
            "name": self.name,
            "description": self.description,
            "due_date": self.due_date,
            "status": self.status.value if self.status else None,
        }
        if include_relations:
            base.update({
                "tenant": self.tenant.to_dict(False) if self.tenant else None,
                "project": self.project.to_dict(False) if self.project else None,
                # "": [v.to_dict(False) for v in self. or []],
            })
        return base

# RISK
class Risk(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "risks"
    __table_args__ = {"schema": "proj"}

    project_id = db.Column(db.String(11), db.ForeignKey("proj.projects.id"), nullable=False)

    name = db.Column(db.String, nullable=False)
    description = db.Column(db.Text)
    level = db.Column(db.Enum(RiskLevelEnum), default=RiskLevelEnum.MEDIUM)
    mitigation_plan = db.Column(db.Text)
    probability = db.Column(db.Float)
    impact = db.Column(db.Float)

    project = db.relationship("Project", back_populates="risks", lazy="noload")

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
                "tenant": self.tenant.to_dict(False) if self.tenant else None,
                "project": self.project.to_dict(False) if self.project else None,
                # "": [v.to_dict(False) for v in self. or []],
            })
        return base

# PHASE
class Phase(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "phases"
    __table_args__ = {"schema": "proj"}

    project_id = db.Column(db.String(11), db.ForeignKey("proj.projects.id"), nullable=False)

    name = db.Column(db.String, nullable=False)
    description = db.Column(db.Text)
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    # status = db.Column(db.String)

    tasks = db.relationship("Task", back_populates="phase", lazy="noload")
    milestones = db.relationship("Milestone", back_populates="phase", lazy="noload")

    project = db.relationship("Project", back_populates="phases", lazy="noload")

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
                "tenant": self.tenant.to_dict(False) if self.tenant else None,
                "project": self.project.to_dict(False) if self.project else None,
                # "": [v.to_dict(False) for v in self. or []],
            })
        return base


class Initiative(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "initiatives"
    __table_args__ = {"schema": "proj"}

    scope_id = db.Column(db.String(11), db.ForeignKey("okr.team_scopes.id"), nullable=False)

    owner_id = db.Column(db.String(11), db.ForeignKey("core.users.id"), nullable=True)
    owner = db.relationship(
        "User",
        foreign_keys=[owner_id],        # <-- précise la colonne FK
        lazy="noload",
        back_populates="initiatives"    # <-- relation inverse à ajouter dans User
    )

    name = db.Column(db.String, nullable=False)
    description = db.Column(db.Text)
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    budget = db.Column(db.Float)
    currency = db.Column(db.String, default="USD")
    status = db.Column(db.Enum(ProjectStatusEnum), default=ProjectStatusEnum.PLANNED)
    
    scope = db.relationship(
        "TeamScope",
        back_populates="initiatives",
        lazy="noload",
        foreign_keys=[scope_id]
    )

    objectives = db.relationship(
        "Objective",
        back_populates="initiative",
        lazy="noload",
        cascade="all, delete-orphan"
    )
    
    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "scope_id": self.scope_id,
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
                "tenant": self.tenant.to_dict(False) if self.tenant else None,
                "scope": self.scope.to_dict(False) if self.scope else None,
                "objectives": [v.to_dict(False) for v in self.objectives or []],
                "owner": self.owner.to_dict(False) if self.owner else None,  # ajoute owner
            })

        return base

class TaskDependency(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "task_dependencies"
    __table_args__ = {"schema": "proj"}

    task_id = db.Column(db.String(11), db.ForeignKey("proj.tasks.id", ondelete="CASCADE"), nullable=False, primary_key=True)
    depends_on_id = db.Column(db.String(11), db.ForeignKey("proj.tasks.id", ondelete="CASCADE"), nullable=False, primary_key=True)
    
    task = db.relationship("Task", foreign_keys=[task_id], back_populates="dependencies")
    depends_on = db.relationship("Task", foreign_keys=[depends_on_id], back_populates="dependents")
    
    type = db.Column(db.String)  # blocks / depends_on
    
    def to_dict(self, include_relations=True):
        base = {
            "task_id": self.task_id,
            "depends_on_id": self.depends_on_id,
            "type": self.type,
        }

        if include_relations:
            base.update({
                "tenant": self.tenant.to_dict(False) if self.tenant else None,
                # "": [v.to_dict(False) for v in self. or []],
            })

        return base


