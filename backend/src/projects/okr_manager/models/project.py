from backend.src.app.configs.extensions import db
from backend.src.app.models._controls import AuditMixin
from backend.src.projects.okr_manager.models._enums import MilestoneStatusEnum, RiskLevelEnum, TaskStatusEnum
from backend.src.projects.okr_manager.models.program import ProjectStatusEnum


# PROJECT MANAGEMENT
class Project(db.Model,AuditMixin):
    __tablename__ = "projects"
    __table_args__ = {"schema": "okrmanager"}

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    program_id = db.Column(db.BigInteger, db.ForeignKey("okrmanager.programs.id", ondelete="CASCADE"), nullable=True, index=True)
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
    program = db.relationship("Program", back_populates="projects", lazy="noload", foreign_keys=[program_id])
    team = db.relationship("Team", back_populates="projects", lazy="noload", foreign_keys=[team_id])
    okr_team = db.relationship("TeamScope", back_populates="projects", lazy="noload", foreign_keys=[okr_team_id])

    fundings = db.relationship("Funding", back_populates="project", lazy="noload", cascade="all, delete-orphan")
    activities = db.relationship("Activity", back_populates="project", lazy="noload", cascade="all, delete-orphan")
    tasks = db.relationship("ProjectTask", back_populates="project", lazy="noload", cascade="all, delete-orphan")
    milestones = db.relationship("ProjectMilestone", back_populates="project", lazy="noload", cascade="all, delete-orphan")
    risks = db.relationship("ProjectRisk", back_populates="project", lazy="noload", cascade="all, delete-orphan")
    phases = db.relationship("ProjectPhase", back_populates="project", lazy="noload", cascade="all, delete-orphan")
    project_objectives = db.relationship("ProjectObjective", back_populates="project", lazy="noload", cascade="all, delete-orphan")
    
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


class ProjectTask(db.Model,AuditMixin):
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
    project = db.relationship("Project", back_populates="tasks", lazy="noload", foreign_keys=[project_id])
    assigned_to = db.relationship("User", back_populates="okr_project_tasks", lazy="noload", foreign_keys=[assigned_to_id])
    key_result = db.relationship("KeyResult", lazy="noload", foreign_keys=[key_result_id])
    # parent = db.relationship("ProjectTask",remote_side=[id],backref=db.backref("children", lazy="joined"))
    parent_task = db.relationship("ProjectTask", remote_side=[id], back_populates="subtasks", lazy="noload")
    subtasks = db.relationship("ProjectTask", back_populates="parent_task", lazy="noload", cascade="all, delete-orphan")
    

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
    project = db.relationship("Project", back_populates="milestones", lazy="noload", foreign_keys=[project_id])
    
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
    project = db.relationship("Project", back_populates="risks", lazy="noload", foreign_keys=[project_id])
    
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
    # status = db.Column(db.String)
    
    tenant = db.relationship("Tenant", back_populates="project_phases", lazy="noload", foreign_keys=[tenant_id])
    project = db.relationship("Project", back_populates="phases", lazy="noload", foreign_keys=[project_id])
    
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

