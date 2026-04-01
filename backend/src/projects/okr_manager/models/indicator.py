from datetime import datetime
from backend.src.app.configs.extensions import db
from backend.src.app.models._controls import AuditMixin



# INDICATORS / OUTCOMES
class Indicator(db.Model,AuditMixin):
    __tablename__ = "indicators"
    __table_args__ = {"schema": "okrmanager"}

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)

    name = db.Column(db.String, nullable=False)
    description = db.Column(db.Text)
    unit = db.Column(db.String)

    tenant = db.relationship("Tenant", back_populates="okr_indicators", lazy="noload", foreign_keys=[tenant_id])

    values = db.relationship("IndicatorValue", back_populates="indicator", lazy="noload", cascade="all, delete-orphan")
    
    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "name": self.name,
            "description": self.description,
            "unit": self.unit,
        }

        if include_relations:
            base.update({
                "tenant": self.tenant.to_dict(include_relations=False) if self.tenant else None,
                "values": [v.to_dict(include_relations=False) for v in self.values or []],
            })

        return base

class IndicatorValue(db.Model,AuditMixin):
    __tablename__ = "indicator_values"
    __table_args__ = {"schema": "okrmanager"}

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    indicator_id = db.Column(db.BigInteger, db.ForeignKey("okrmanager.indicators.id"), nullable=False)
    activity_id = db.Column(db.BigInteger, db.ForeignKey("okrmanager.activities.id"))
    value = db.Column(db.Float, nullable=False)
    date = db.Column(db.Date, default=datetime.utcnow)
    
    tenant = db.relationship("Tenant", back_populates="indicator_values", lazy="noload", foreign_keys=[tenant_id])
    indicator = db.relationship("Indicator", back_populates="values", lazy="noload", foreign_keys=[indicator_id])
    activity = db.relationship("Activity", back_populates="indicator_values", lazy="noload", foreign_keys=[activity_id])
    
    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "indicator_id": self.indicator_id,
            "activity_id": self.activity_id,
            "value": self.value,
            "date": self.date,
        }

        if include_relations:
            base.update({
                "tenant": self.tenant.to_dict(include_relations=False) if self.tenant else None,
                "indicator": self.indicator.to_dict(include_relations=False) if self.indicator else None,
                "activity": self.activity.to_dict(include_relations=False) if self.activity else None,
                # "": [v.to_dict(include_relations=False) for v in self. or []],
            })

        return base

class Outcome(db.Model,AuditMixin):
    __tablename__ = "outcomes"
    __table_args__ = {"schema": "okrmanager"}

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    
    name = db.Column(db.String, nullable=False)
    description = db.Column(db.Text)
    
    tenant = db.relationship("Tenant", back_populates="okr_outcomes", lazy="noload", foreign_keys=[tenant_id])

    indicators = db.relationship("OutcomeIndicator", back_populates="outcome", lazy="noload", cascade="all, delete-orphan")
    
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
                "indicators": [v.to_dict(include_relations=False) for v in self.indicators or []],
            })

        return base

class OutcomeIndicator(db.Model,AuditMixin):
    __tablename__ = "outcome_indicators"
    __table_args__ = {"schema": "okrmanager"}

    outcome_id = db.Column(db.BigInteger, db.ForeignKey("okrmanager.outcomes.id"), primary_key=True)
    indicator_id = db.Column(db.BigInteger, db.ForeignKey("okrmanager.indicators.id"), primary_key=True)

    outcome = db.relationship("Outcome", back_populates="indicators", lazy="noload", foreign_keys=[outcome_id])
    indicator = db.relationship("Indicator", lazy="noload", foreign_keys=[indicator_id])
    
    def to_dict(self, include_relations=True):
        base = {
            "outcome_id": self.outcome_id,
            "indicator_id": self.indicator_id,
        }

        if include_relations:
            base.update({
                "outcome": self.outcome.to_dict(include_relations=False) if self.outcome else None,
                "indicator": self.indicator.to_dict(include_relations=False) if self.indicator else None,
                # "": [v.to_dict(include_relations=False) for v in self. or []],
            })

        return base
