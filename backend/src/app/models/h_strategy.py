from backend.src.app.configs.extensions import db
from backend.src.app.models._controls import *


# STRATEGY (vision globale)
class Strategy(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "strategies"
    __table_args__ = {"schema": "okr"}

    name = db.Column(db.String, nullable=False)
    description = db.Column(db.Text)

    strategic_axes = db.relationship("StrategicAxis", back_populates="strategy",lazy="noload", cascade="all, delete-orphan")

    
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
                "axes": [v.to_dict(False) for v in self.axes or []],
            })

        return base
    
# STRATEGIC AXES (grands piliers)
class StrategicAxis(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "strategic_axes"
    __table_args__ = {"schema": "okr"}

    strategy_id = db.Column(db.String(11), db.ForeignKey("okr.strategies.id"), nullable=False)
    organisation_id = db.Column(db.String(11), db.ForeignKey("core.organisations.id"), nullable=False)
    
    name = db.Column(db.String, nullable=False)
    description = db.Column(db.Text)

    strategy = db.relationship("Strategy", back_populates="strategic_axes", lazy="noload", foreign_keys=[strategy_id])
    organisation = db.relationship("Organisation", back_populates="strategic_axes", lazy="noload", foreign_keys=[organisation_id])

    programs = db.relationship("Program", back_populates="strategic_axis", lazy="noload", cascade="all, delete-orphan")

    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "strategy_id": self.strategy_id,
            "organisation_id": self.organisation_id,

            "name": self.name,
            "description": self.description,
        }

        if include_relations:
            base.update({
                "tenant": self.tenant.to_dict(False) if self.tenant else None,
                "strategy": self.strategy.to_dict(False) if self.strategy else None,
                "programs": [v.to_dict(False) for v in self.programs or []],
            })

        return base
