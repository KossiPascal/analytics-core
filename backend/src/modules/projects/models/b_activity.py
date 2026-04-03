from backend.src.app.configs.extensions import db
from backend.src.app.models._controls import *
from backend.src.modules.okr.models._enums import ActivityStatusEnum, ActivityPriorityEnum

# ACTIVITIES
class Activity(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "activities"
    __table_args__ = {"schema": "proj"}

    country_id = db.Column(db.String(11), db.ForeignKey("core.countries.id", ondelete="CASCADE"), nullable=False, index=True)
    region_id = db.Column(db.String(11), db.ForeignKey("core.regions.id", ondelete="CASCADE"), nullable=False, index=True)
    
    project_id = db.Column(db.String(11), db.ForeignKey("proj.projects.id"))
    team_id = db.Column(db.String(11), db.ForeignKey("core.teams.id"))

    name = db.Column(db.String, nullable=False)
    description = db.Column(db.Text)
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    due_date = db.Column(db.Date)
    budget = db.Column(db.Float, default=0)
    spent_budget = db.Column(db.Float, default=0)
    currency = db.Column(db.String, default="USD")
    progress = db.Column(db.Float, default=0)
    beneficiaries = db.Column(db.Integer)

    status = db.Column(db.Enum(ActivityStatusEnum), default=ActivityStatusEnum.PLANNED)
    priority = db.Column(db.Enum(ActivityPriorityEnum), default=ActivityPriorityEnum.MEDIUM)
    
    country = db.relationship("Country", back_populates="activities", lazy="noload", foreign_keys=[country_id])
    region = db.relationship("Region", back_populates="activities", lazy="noload", foreign_keys=[region_id])
    
    project = db.relationship("Project", back_populates="activities", lazy="noload", foreign_keys=[project_id])
    team = db.relationship("Team", back_populates="activities", lazy="noload", foreign_keys=[team_id])

    owners = db.relationship("ActivityOwner", back_populates="activity",lazy="noload", cascade="all, delete-orphan")
    activity_keyresults = db.relationship("ActivityKeyResult", back_populates="activity",lazy="noload", cascade="all, delete-orphan")
    indicator_values = db.relationship("IndicatorValue", back_populates="activity", lazy="noload", cascade="all, delete-orphan")

    dependencies_from = db.relationship(
        "ActivityDependency",
        foreign_keys="ActivityDependency.activity_id",
        lazy="noload",
        cascade="all, delete-orphan"
    )
    dependencies_to = db.relationship(
        "ActivityDependency",
        foreign_keys="ActivityDependency.depends_on_id",
        lazy="noload",
        cascade="all, delete-orphan"
    )
    # completion = db.Column(db.Float, default=0)
    # progress = db.Column(db.Float, default=0)
    # owners = db.relationship("User", secondary="okrmanager.activity_owners", back_populates="activities")
    # dependencies_from = db.relationship("ActivityDependency",back_populates="from_activity",foreign_keys="ActivityDependency.from_id",lazy="noload", cascade="all, delete-orphan")
    # dependencies_to = db.relationship("ActivityDependency",back_populates="to_activity",foreign_keys="ActivityDependency.to_id",lazy="noload", cascade="all, delete-orphan")

    # krs = db.relationship("KeyResult", secondary="okrmanager.activity_keyresults")
    
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
                "tenant": self.tenant.to_dict(False) if self.tenant else None,
                "country": self.country.to_dict(False) if self.country else None,
                "region": self.region.to_dict(False) if self.region else None,
                "project": self.project.to_dict(False) if self.project else None,
                "team": self.team.to_dict(False) if self.team else None,
                "owners": [v.to_dict(False) for v in self.owners or []],
                # "kr_links": [v.to_dict(False) for v in self.kr_links or []],
                "indicator_values": [v.to_dict(False) for v in self.indicator_values or []],
            })

        return base

class ActivityOwner(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "activity_owners"
    __table_args__ = {"schema": "proj"}

    activity_id = db.Column(db.String(11), db.ForeignKey("proj.activities.id", ondelete="CASCADE"), nullable=False, primary_key=True)
    user_id = db.Column(db.String(11), db.ForeignKey("core.users.id", ondelete="CASCADE"), nullable=False, primary_key=True)
    
    activity = db.relationship("Activity", back_populates="owners", lazy="noload", foreign_keys=[activity_id])
    user = db.relationship("User", back_populates="activity_owners", lazy="noload", foreign_keys=[user_id])

    def to_dict(self, include_relations=True):
        base = {
            "activity_id": self.activity_id,
            "user_id": self.user_id,
        }

        if include_relations:
            base.update({
                "activity": self.activity.to_dict(False) if self.activity else None,
                "user": self.user.to_dict(False) if self.user else None,
                # "": [v.to_dict(False) for v in self. or []],
            })

        return base

class ActivityKeyResult(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "activity_keyresults"
    __table_args__ = {"schema": "proj"}

    activity_id = db.Column(db.String(11), db.ForeignKey("proj.activities.id", ondelete="CASCADE"), nullable=False, primary_key=True)
    keyresult_id = db.Column(db.String(11), db.ForeignKey("okr.keyresults.id", ondelete="CASCADE"), nullable=False, primary_key=True)
    impact = db.Column(db.Float, default=1)
    weight = db.Column(db.Float, default=1.0)

    activity = db.relationship("Activity", back_populates="activity_keyresults", lazy="noload", foreign_keys=[activity_id])
    keyresult = db.relationship("KeyResult", back_populates="activity_keyresults", lazy="noload", foreign_keys=[keyresult_id])
    
    def to_dict(self, include_relations=True):
        base = {
            "activity_id": self.activity_id,
            "keyresult_id": self.keyresult_id,
            "impact": self.impact,
            "weight": self.weight,
        }

        if include_relations:
            base.update({
                "activity": self.activity.to_dict(False) if self.activity else None,
                "keyresult": self.keyresult.to_dict(False) if self.keyresult else None,
                # "": [v.to_dict(False) for v in self. or []],
            })

        return base

class ActivityDependency(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "activity_dependencies"
    __table_args__ = {"schema": "proj"}

    activity_id = db.Column(db.String(11), db.ForeignKey("proj.activities.id", ondelete="CASCADE"), nullable=False, primary_key=True)
    depends_on_id = db.Column(db.String(11), db.ForeignKey("proj.activities.id", ondelete="CASCADE"), nullable=False, primary_key=True)
    
    activity = db.relationship("Activity", foreign_keys=[activity_id], lazy="noload")
    depends_on = db.relationship("Activity", foreign_keys=[depends_on_id], lazy="noload")
    
    type = db.Column(db.String)  # blocks / depends_on
    
    def to_dict(self, include_relations=True):
        base = {
            "activity_id": self.activity_id,
            "depends_on_id": self.depends_on_id,
            "type": self.type,
        }

        if include_relations:
            base.update({
                # "tenant": self.tenant.to_dict(False) if self.tenant else None,
                # "": [v.to_dict(False) for v in self. or []],
            })

        return base

