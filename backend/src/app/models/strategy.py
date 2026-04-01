from backend.src.app.configs.extensions import db
from backend.src.app.models._controls import AuditMixin


# STRATEGY (vision globale)
class Strategy(db.Model,AuditMixin):
    __tablename__ = "strategies"
    __table_args__ = {"schema": "okrmanager"}

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    name = db.Column(db.String, nullable=False)
    description = db.Column(db.Text)

    tenant = db.relationship("Tenant", back_populates="okr_strategies", lazy="noload", foreign_keys=[tenant_id])

    axes = db.relationship("StrategicAxis", back_populates="strategy",lazy="noload", cascade="all, delete-orphan")

    
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
class StrategicAxis(db.Model,AuditMixin):
    __tablename__ = "strategic_axes"
    __table_args__ = {"schema": "okrmanager"}

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    strategy_id = db.Column(db.BigInteger, db.ForeignKey("okrmanager.strategies.id"), nullable=False)
    organisation_id = db.Column(db.BigInteger, db.ForeignKey("organisations.id"), nullable=False)
    
    name = db.Column(db.String, nullable=False)
    description = db.Column(db.Text)

    tenant = db.relationship("Tenant", back_populates="okr_axes", lazy="noload", foreign_keys=[tenant_id])
    strategy = db.relationship("Strategy", back_populates="axes", lazy="noload", foreign_keys=[strategy_id])

    programs = db.relationship("Program", back_populates="strategic_axis", lazy="noload", cascade="all, delete-orphan")
    
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
