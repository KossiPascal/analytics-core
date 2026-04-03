from backend.src.app.configs.extensions import db
from backend.src.app.models._controls import *



class Organisation(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "organisations"
    __table_args__ = {"schema": "core"}

    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.String(255))

    regions = db.relationship("Region", back_populates="organisation", cascade="all, delete-orphan")
    countries = db.relationship("Country", back_populates="organisation", cascade="all, delete-orphan")
    team_templates = db.relationship("TeamTemplate", back_populates="organisation", cascade="all, delete-orphan")
    teams = db.relationship("Team", back_populates="organisation", cascade="all, delete-orphan")
    objectives = db.relationship("Objective", back_populates="organisation", cascade="all, delete-orphan")
    strategic_axes = db.relationship("StrategicAxis", back_populates="organisation", cascade="all, delete-orphan")

    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "name": self.name,
            "description": self.description,
        }

        if include_relations:
            base.update({
                "tenant": self.tenant.to_dict(False) if self.tenant else None,
                "regions": [v.to_dict(False) for v in self.regions or []],
                "countries": [v.to_dict(False) for v in self.countries or []],
                "team_templates": [v.to_dict(False) for v in self.team_templates or []],
                "teams": [v.to_dict(False) for v in self.teams or []],
                "objectives": [v.to_dict(False) for v in self.objectives or []],
            })

        return base

class Region(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "regions"
    __table_args__ = (
        db.UniqueConstraint("organisation_id", "name"),
        {"schema": "core"},
    )

    organisation_id = db.Column(db.String(11), db.ForeignKey("core.organisations.id"))

    name = db.Column(db.String(255), nullable=False)
    code = db.Column(db.String(50))

    organisation = db.relationship("Organisation", back_populates="regions", lazy="noload", foreign_keys=[organisation_id])

    countries = db.relationship("Country", back_populates="region", cascade="all, delete-orphan")
    teams = db.relationship("Team", back_populates="region", cascade="all, delete-orphan")
    memberships = db.relationship("Membership", back_populates="region", lazy="noload")
    activities = db.relationship("Activity", back_populates="region", lazy="noload")

    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "organisation_id": self.organisation_id,
            "name": self.name,
            "code": self.code,
        }

        if include_relations:
            base.update({
                "tenant": self.tenant.to_dict(False) if self.tenant else None,
                "organisation": self.organisation.to_dict(False) if self.organisation else None,
                "countries": [v.to_dict(False) for v in self.countries or []],
            })

        return base

class Country(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "countries"
    __table_args__ = (
        db.UniqueConstraint("organisation_id", "name"),
        {"schema": "core"},
    )

    organisation_id = db.Column(db.String(11), db.ForeignKey("core.organisations.id"))
    region_id = db.Column(db.String(11), db.ForeignKey("core.regions.id"))

    name = db.Column(db.String(255), nullable=False)
    code = db.Column(db.String(50))
    
    organisation = db.relationship("Organisation", back_populates="countries", lazy="noload", foreign_keys=[organisation_id])
    region = db.relationship("Region", back_populates="countries", lazy="noload", foreign_keys=[region_id])

    teams = db.relationship("Team", back_populates="country", cascade="all, delete-orphan")
    memberships = db.relationship("Membership", back_populates="country", lazy="noload")
    activities = db.relationship("Activity", back_populates="country", lazy="noload")
    
    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "organisation_id": self.organisation_id,
            "region_id": self.region_id,
            "name": self.name,
            "code": self.code,
        }

        if include_relations:
            base.update({
                "tenant": self.tenant.to_dict(False) if self.tenant else None,
                "organisation": self.organisation.to_dict(False) if self.organisation else None,
                "region": self.region.to_dict(False) if self.region else None,
                "teams": [v.to_dict(False) for v in self.teams or []],
            })

        return base

