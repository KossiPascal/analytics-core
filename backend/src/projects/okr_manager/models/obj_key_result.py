from datetime import datetime, date as _date
from sqlalchemy import text
from sqlalchemy.dialects.postgresql import JSONB

from backend.src.app.configs.extensions import db
from backend.src.app.models._controls import AuditMixin
from backend.src.projects.okr_manager.models._enums import (
    DirectionEnum,
    GlobalStatusEnum,
    GlobalStatusEnum,
    ProjectStatusEnum,
)


class Objective(db.Model,AuditMixin):
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
    status = db.Column(db.Enum(GlobalStatusEnum), default=GlobalStatusEnum.ACTIVE)
    
    tenant = db.relationship("Tenant", back_populates="okr_objectives", lazy="noload", foreign_keys=[tenant_id])
    initiative = db.relationship("Initiative", back_populates="objectives", lazy="noload", foreign_keys=[initiative_id])
    okr_team = db.relationship("TeamScope", back_populates="objectives", lazy="noload", foreign_keys=[okr_team_id])
    # project = db.relationship("Project", back_populates="okr_objectives", lazy="noload", foreign_keys=[project_id])
    key_results = db.relationship("KeyResult", back_populates="objective",lazy="noload", cascade="all, delete-orphan")
    project_objectives = db.relationship("ProjectObjective", back_populates="objective", lazy="noload", cascade="all, delete-orphan")
    
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

class ProjectObjective(db.Model,AuditMixin):
    __tablename__ = "project_objectives"
    __table_args__ = {"schema": "okrmanager"}

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    project_id = db.Column(db.BigInteger, db.ForeignKey("okrmanager.projects.id"), nullable=False)
    objective_id = db.Column(db.BigInteger, db.ForeignKey("okrmanager.objectives.id"), nullable=False)

    project = db.relationship("Project", back_populates="project_objectives", lazy="noload", foreign_keys=[project_id])
    objective = db.relationship("Objective", back_populates="project_objectives", lazy="noload", foreign_keys=[objective_id])

    
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

class KeyResult(db.Model,AuditMixin):
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
    status = db.Column(db.Enum(GlobalStatusEnum), default=GlobalStatusEnum.ACTIVE)

    type = db.Column(db.String)
    unit = db.Column(db.String)
    start_value = db.Column(db.Float, default=0)
    progress = db.Column(db.Float, default=0)
    weight = db.Column(db.Float, default=1)
    impact = db.Column(db.Float, default=1)
    
    tenant = db.relationship("Tenant", back_populates="key_results", lazy="noload", foreign_keys=[tenant_id])
    objective = db.relationship("Objective", back_populates="key_results", lazy="noload", foreign_keys=[objective_id])

    events = db.relationship("KREvent", back_populates="key_result", lazy="noload", cascade="all, delete-orphan")
    activity_links = db.relationship("ActivityLinkKR", back_populates="key_result", lazy="noload", cascade="all, delete-orphan")
    
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

class KREvent(db.Model,AuditMixin):
    __tablename__ = "kr_events"
    __table_args__ = {"schema": "okrmanager"}

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    key_result_id = db.Column(db.BigInteger, db.ForeignKey("okrmanager.key_results.id"), nullable=False)
    value = db.Column(db.Float, nullable=False)
    date = db.Column(db.Date, default=_date.today)
    source = db.Column(db.String)
    
    tenant = db.relationship("Tenant", back_populates="kr_events", lazy="noload", foreign_keys=[tenant_id])
    key_result = db.relationship("KeyResult", back_populates="events", lazy="noload", foreign_keys=[key_result_id])
    
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




# SNAPSHOTS
class Snapshot(db.Model,AuditMixin):
    __tablename__ = "snapshots"
    __table_args__ = {"schema": "okrmanager"}

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    okr_global_id = db.Column(db.BigInteger, db.ForeignKey("okrmanager.okr_globals.id"), nullable=False)
    
    name = db.Column(db.String, nullable=False)
    description = db.Column(db.Text)

    date = db.Column(db.Date, default=_date.today)
    breakdown = db.Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    progress = db.Column(db.Float)
    
    tenant = db.relationship("Tenant", back_populates="okr_snapshots", lazy="noload", foreign_keys=[tenant_id])
    okr_global = db.relationship("Global", back_populates="snapshots", lazy="noload", foreign_keys=[okr_global_id])
    
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


