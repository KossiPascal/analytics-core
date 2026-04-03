from backend.src.app.configs.extensions import db
from backend.src.app.models._controls import *


class Funding(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "fundings"
    __table_args__ = {"schema": "fin"}

    project_id = db.Column(db.String(11), db.ForeignKey("proj.projects.id"), nullable=False) # shema = project
    donor = db.Column(db.String, nullable=False)
    amount = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String, default="USD")
    
    project = db.relationship("Project", back_populates="fundings", lazy="noload", foreign_keys=[project_id])
    
    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "project_id": self.project_id,
            "donor": self.donor,
            "amount": self.amount,
            "currency": self.currency,
        }

        if include_relations:
            base.update({
                "project": self.project.to_dict(False) if self.project else None,
                # "": [v.to_dict(False) for v in self. or []],
            })

        return base
    

class Budget(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "budgets"
    __table_args__ = {"schema": "fin"}

    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
        }

        if include_relations:
            base.update({
                # "project": self.project.to_dict(False) if self.project else None,
                # "": [v.to_dict(False) for v in self. or []],
            })

        return base

class Expense(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "expenses"
    __table_args__ = {"schema": "fin"}

    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
        }

        if include_relations:
            base.update({
                # "project": self.project.to_dict(False) if self.project else None,
                # "": [v.to_dict(False) for v in self. or []],
            })

        return base

class Transaction(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "transactions"
    __table_args__ = {"schema": "fin"}

    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
        }

        if include_relations:
            base.update({
                # "project": self.project.to_dict(False) if self.project else None,
                # "": [v.to_dict(False) for v in self. or []],
            })

        return base

class Donor(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "donors"
    __table_args__ = {"schema": "fin"}

    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
        }

        if include_relations:
            base.update({
                # "project": self.project.to_dict(False) if self.project else None,
                # "": [v.to_dict(False) for v in self. or []],
            })

        return base

class Invoice(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "invoices"
    __table_args__ = {"schema": "fin"}

    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
        }

        if include_relations:
            base.update({
                # "project": self.project.to_dict(False) if self.project else None,
                # "": [v.to_dict(False) for v in self. or []],
            })

        return base



