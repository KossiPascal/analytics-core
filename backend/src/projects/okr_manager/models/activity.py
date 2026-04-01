import uuid
from backend.src.app.configs.extensions import db
from backend.src.app.models._controls import AuditMixin
from backend.src.projects.okr_manager.models._enums import (
    ActivityStatusEnum,
    ActivityPriorityEnum,
)


# ACTIVITIES
class Activity(db.Model,AuditMixin):
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
    project = db.relationship("Project", back_populates="activities", lazy="noload", foreign_keys=[project_id])
    team = db.relationship("Team", back_populates="activities", lazy="noload", foreign_keys=[team_id])

    owners = db.relationship("ActivityOwner", back_populates="activity",lazy="noload", cascade="all, delete-orphan")
    kr_links = db.relationship("ActivityLinkKR", back_populates="activity",lazy="noload", cascade="all, delete-orphan")
    indicator_values = db.relationship("IndicatorValue", back_populates="activity", lazy="noload", cascade="all, delete-orphan")

    # completion = db.Column(db.Float, default=0)
    # progress = db.Column(db.Float, default=0)
    # owners = db.relationship("User", secondary="activity_owners", back_populates="activities")
    # dependencies_from = db.relationship("ActivityDependency",back_populates="from_activity",foreign_keys="ActivityDependency.from_id",lazy="noload", cascade="all, delete-orphan")
    # dependencies_to = db.relationship("ActivityDependency",back_populates="to_activity",foreign_keys="ActivityDependency.to_id",lazy="noload", cascade="all, delete-orphan")

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

class ActivityOwner(db.Model,AuditMixin):
    __tablename__ = "activity_owners"
    __table_args__ = {"schema": "okrmanager"}

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    activity_id = db.Column(db.BigInteger, db.ForeignKey("okrmanager.activities.id"), nullable=False)
    user_id = db.Column(db.BigInteger, db.ForeignKey("users.id"), nullable=False)
    
    activity = db.relationship("Activity", back_populates="owners", lazy="noload", foreign_keys=[activity_id])
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

class ActivityLinkKR(db.Model,AuditMixin):
    __tablename__ = "activity_link_kr"
    __table_args__ = {"schema": "okrmanager"}

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    activity_id = db.Column(db.BigInteger, db.ForeignKey("okrmanager.activities.id"), nullable=False)
    key_result_id = db.Column(db.BigInteger, db.ForeignKey("okrmanager.key_results.id"), nullable=False)
    impact = db.Column(db.Float, default=1)
    weight = db.Column(db.Float, default=1.0)

    activity = db.relationship("Activity", back_populates="kr_links", lazy="noload", foreign_keys=[activity_id])
    key_result = db.relationship("KeyResult", back_populates="activity_links", lazy="noload", foreign_keys=[key_result_id])
    
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

class ActivityDependency(db.Model,AuditMixin):
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
