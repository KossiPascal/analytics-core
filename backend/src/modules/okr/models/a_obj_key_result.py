from sqlalchemy import text
from datetime import datetime, date as _date
from backend.src.app.models._controls import *
from sqlalchemy.dialects.postgresql import JSONB
from backend.src.app.configs.extensions import db
from backend.src.modules.okr.models._enums import DirectionEnum,GlobalStatusEnum,ProjectStatusEnum


class Objective(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "objectives"
    __table_args__ = {"schema": "okr"}

    scope_id = db.Column(db.String(11), db.ForeignKey("okr.team_scopes.id"))
    team_id = db.Column(db.String(11), db.ForeignKey("core.teams.id", ondelete="CASCADE"))
    initiative_id = db.Column(db.String(11), db.ForeignKey("proj.initiatives.id"))
    project_id = db.Column(db.String(11), db.ForeignKey("proj.projects.id"), nullable=True)
    organisation_id = db.Column(db.String(11), db.ForeignKey("core.organisations.id"), nullable=False)

    name = db.Column(db.String, nullable=False)
    description = db.Column(db.Text)
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    status = db.Column(db.Enum(GlobalStatusEnum), default=GlobalStatusEnum.ACTIVE)

    initiative = db.relationship("Initiative", back_populates="objectives", lazy="noload", foreign_keys=[initiative_id])
    organisation = db.relationship("Organisation", back_populates="objectives", lazy="noload", foreign_keys=[organisation_id])
    team = db.relationship("Team", back_populates="objectives", lazy="noload", foreign_keys=[team_id])
    scope = db.relationship("TeamScope", back_populates="objectives", lazy="noload", foreign_keys=[scope_id])
    project = db.relationship("Project", back_populates="objectives", lazy="noload", foreign_keys=[project_id])

    keyresults = db.relationship("KeyResult", back_populates="objective", lazy="noload", cascade="all, delete-orphan")
    project_objectives = db.relationship("ProjectObjective", back_populates="objective", lazy="noload", cascade="all, delete-orphan")
    snapshots = db.relationship("Snapshot", back_populates="objective", lazy="noload", cascade="all, delete-orphan")
    team_objectives = db.relationship("TeamObjective", back_populates="objective", lazy="noload", cascade="all, delete-orphan")
    objective_keyresults = db.relationship("ObjectiveKeyResult", back_populates="objective", lazy="noload", cascade="all, delete-orphan")

    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "initiative_id": self.initiative_id,
            "team_id": self.team_id,
            "scope_id": self.scope_id,
            "project_id": self.project_id,
            "organisation_id": self.organisation_id,
            "name": self.name,
            "description": self.description,
            "start_date": self.start_date,
            "end_date": self.end_date,
            "status": self.status.value if self.status else None,
        }

        if include_relations:
            base.update({
                "tenant": self.tenant.to_dict(False) if self.tenant else None,
                "initiative": self.initiative.to_dict(False) if self.initiative else None,
                "team": self.team.to_dict(False) if self.team else None,
                "scope": self.scope.to_dict(False) if self.scope else None,
                "keyresults": [kr.to_dict(False) for kr in self.keyresults or []],
                "project_objectives": [po.to_dict(False) for po in self.project_objectives or []],
                "team_objectives": [to.to_dict(False) for to in self.team_objectives or []],
            })

        return base
    
class KeyResult(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "keyresults"
    __table_args__ = {"schema": "okr"}

    objective_id = db.Column(db.String(11), db.ForeignKey("okr.objectives.id"), nullable=False)

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
    
    objective = db.relationship("Objective", back_populates="keyresults", lazy="noload", foreign_keys=[objective_id])

    events = db.relationship("KeyresultEvent", back_populates="keyresult", lazy="noload", cascade="all, delete-orphan")
    activity_keyresults = db.relationship("ActivityKeyResult", back_populates="keyresult", lazy="noload", cascade="all, delete-orphan")
    # snapshots = db.relationship("Snapshot", back_populates="keyresult", lazy="noload", cascade="all, delete-orphan")
    team_keyresults = db.relationship("TeamKeyResult", back_populates="keyresult", lazy="noload", cascade="all, delete-orphan")
    objective_keyresults = db.relationship("ObjectiveKeyResult", back_populates="keyresult", lazy="noload", cascade="all, delete-orphan")
    
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
                "tenant": self.tenant.to_dict(False) if self.tenant else None,
                "objective": self.objective.to_dict(False) if self.objective else None,
                "events": [v.to_dict(False) for v in self.events or []],
                "activity_keyresults": [v.to_dict(False) for v in self.activity_keyresults or []],
            })

        return base

class ObjectiveKeyResult(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "objective_keyresults"
    __table_args__ = {"schema": "okr"}

    keyresult_id = db.Column(db.String(11), db.ForeignKey("okr.keyresults.id", ondelete="CASCADE"), nullable=False)
    objective_id = db.Column(db.String(11), db.ForeignKey("okr.objectives.id", ondelete="CASCADE"), nullable=False)

    keyresult = db.relationship("KeyResult", back_populates="objective_keyresults", lazy="noload", foreign_keys=[keyresult_id])
    objective = db.relationship("Objective", back_populates="objective_keyresults", lazy="noload", foreign_keys=[objective_id])

    def to_dict(self, include_relations=True):
        base = {
            "keyresult_id": self.keyresult_id,
            "objective_id": self.objective_id,
        }

        if include_relations:
            base.update({
                "keyresult": self.keyresult.to_dict(False) if self.keyresult else None,
                "objective": self.objective.to_dict(False) if self.objective else None,
            })

        return base

class KeyresultEvent(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "keyresult_events"
    __table_args__ = {"schema": "okr"}

    keyresult_id = db.Column(db.String(11), db.ForeignKey("okr.keyresults.id"), nullable=False)
    
    value = db.Column(db.Float, nullable=False)
    date = db.Column(db.Date, default=_date.today)
    source = db.Column(db.String)
    
    keyresult = db.relationship("KeyResult", back_populates="events", lazy="noload", foreign_keys=[keyresult_id])
    
    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "keyresult_id": self.keyresult_id,
            "value": self.value,
            "date": self.date,
            "source": self.source,
        }

        if include_relations:
            base.update({
                "tenant": self.tenant.to_dict(False) if self.tenant else None,
                "keyresult": self.keyresult.to_dict(False) if self.keyresult else None,
                # "": [v.to_dict(False) for v in self. or []],
            })

        return base

# SNAPSHOTS
class Snapshot(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "snapshots"
    __table_args__ = {"schema": "okr"}

    objective_id = db.Column(db.String(11), db.ForeignKey("okr.objectives.id", ondelete="CASCADE"), nullable=False, index=True)
    
    name = db.Column(db.String, nullable=False)
    description = db.Column(db.Text)

    date = db.Column(db.Date, default=_date.today)
    progress = db.Column(db.Float)
    
    period_type = db.Column(db.String)  # DAILY / WEEKLY / MONTHLY
    period_value = db.Column(db.String) # "2026-01"
    
    objective = db.relationship("Objective", back_populates="snapshots", lazy="noload", foreign_keys=[objective_id])

    
    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "name": self.name,
            "description": self.description,
            "date": self.date,
            "progress": self.progress,
        }

        if include_relations:
            base.update({
                "tenant": self.tenant.to_dict(False) if self.tenant else None,
                # "": [v.to_dict(False) for v in self. or []],
            })

        return base

class SnapshotItem(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "snapshot_items"
    __table_args__ = {"schema": "okr"}

    snapshot_id = db.Column(db.String(11), db.ForeignKey("okr.snapshots.id"))
    
    entity_type = db.Column(db.String)  
    # GLOBAL / REGION / COUNTRY / TEAM

    entity_id = db.Column(db.String(11))

    progress = db.Column(db.Float)

    options = db.Column(JSONB)  # optionnel (nom, code, etc.)



# # 👉 Au lieu d’énums figés, tu rends les statuts :
# # Modèle dynamique des statuts

# class WorkflowType(db.Model):
#     __tablename__ = "workflow_types"

#     id = db.Column(db.String(11), primary_key=True)
#     tenant_id = db.Column(db.String(11), db.ForeignKey("core.tenants.id", ondelete="CASCADE"), nullable=False, index=True)
#     name = db.Column(db.String, nullable=False)  # activity, task, project, etc.

#     tenant_id = db.Column(db.String(11), db.ForeignKey("okr.tenants.id"), nullable=False)

#     statuses = db.relationship("WorkflowStatus", back_populates="workflow_type",lazy="noload", cascade="all, delete-orphan")



# class WorkflowStatus(db.Model):
#     __tablename__ = "workflow_statuses"

#     id = db.Column(db.String(11), primary_key=True)
#     tenant_id = db.Column(db.String(11), db.ForeignKey("core.tenants.id", ondelete="CASCADE"), nullable=False, index=True)
#     name = db.Column(db.String, nullable=False)        # ex: "in_progress"
#     label = db.Column(db.String)                       # ex: "En cours"
#     color = db.Column(db.String)                       # UI

#     is_initial = db.Column(db.Boolean, default=False)
#     is_final = db.Column(db.Boolean, default=False)

#     workflow_type_id = db.Column(db.String(11), db.ForeignKey("okr.workflow_types.id"), nullable=False)

#     transitions_from = db.relationship("WorkflowTransition", back_populates="from_status",foreign_keys="WorkflowTransition.from_status_id",,lazy="noload", cascade="all, delete-orphan")
#     transitions_to = db.relationship("WorkflowTransition", back_populates="to_status",foreign_keys="WorkflowTransition.to_status_id",lazy="noload", cascade="all, delete-orphan")


# class WorkflowTransition(db.Model):
#     __tablename__ = "workflow_transitions"

#     id = db.Column(db.String(11), primary_key=True)
#     tenant_id = db.Column(db.String(11), db.ForeignKey("core.tenants.id", ondelete="CASCADE"), nullable=False, index=True)

#     from_status_id = db.Column(db.String(11), db.ForeignKey("okr.workflow_statuses.id"), nullable=False)
#     to_status_id = db.Column(db.String(11), db.ForeignKey("okr.workflow_statuses.id"), nullable=False)

#     condition = db.Column(db.String)   # ex: "manager_only"
#     auto = db.Column(db.Boolean, default=False)


# class Activity(db.Model):
#     __tablename__ = "activities"

#     id = db.Column(db.String(11), primary_key=True)
#     tenant_id = db.Column(db.String(11), db.ForeignKey("core.tenants.id", ondelete="CASCADE"), nullable=False, index=True)

#     title = db.Column(db.String, nullable=False)

#     status_id = db.Column(db.String(11), db.ForeignKey("okr.workflow_statuses.id"))
#     status = db.relationship("WorkflowStatus")



# def can_transition(current_status: WorkflowStatus, next_status_id: str) -> bool:
#     return any(t.to_status_id == next_status_id for t in current_status.transitions_from)


# def apply_transition(entity, next_status: WorkflowStatus):
#     if not can_transition(entity.status, next_status.id):
#         raise Exception("Transition non autorisée")

#     entity.status = next_status



# class WorkflowTransition(db.Model):
#     __tablename__ = "workflow_transitions"

#     id = db.Column(db.String(11), primary_key=True)
#     tenant_id = db.Column(db.String(11), db.ForeignKey("core.tenants.id", ondelete="CASCADE"), nullable=False, index=True)

#     from_status_id = db.Column(db.String(11), db.ForeignKey("okr.workflow_statuses.id"))
#     to_status_id = db.Column(db.String(11), db.ForeignKey("okr.workflow_statuses.id"))

#     required_role = db.Column(db.String)  # admin, manager


# class WorkflowHistory(db.Model):
#     __tablename__ = "workflow_history"

#     id = db.Column(db.String(11), primary_key=True)
#     tenant_id = db.Column(db.String(11), db.ForeignKey("core.tenants.id", ondelete="CASCADE"), nullable=False, index=True)

#     entity_type = db.Column(db.String)
#     entity_id = db.Column(db.String)

#     from_status_id = db.Column(db.String)
#     to_status_id = db.Column(db.String)

#     changed_by = db.Column(db.String(11), db.ForeignKey("okr.users.id"))
#     changed_at = db.Column(db.DateTime, default=datetime.utcnow)


