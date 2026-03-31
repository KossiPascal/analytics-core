from backend.src.databases.extensions import db
from backend.src.models.controls import AuditMixin


class StrategicPillar(db.Model, AuditMixin):
    """
    Pilier Stratégique — niveau au-dessus des Objectifs dans la hiérarchie OKR.
    Ex: "Pilier 1 — Fournir des soins de santé de qualité"
    """
    __tablename__ = "pillars"
    __table_args__ = (
        db.UniqueConstraint("project_id", "code", name="uq_prosi_pillar_project_code"),
        {'schema': 'prosi'},
    )

    id          = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id   = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id  = db.Column(db.BigInteger, db.ForeignKey("prosi.projects.id", ondelete="CASCADE"), nullable=False, index=True)
    name        = db.Column(db.String(255), nullable=False)
    code        = db.Column(db.String(30),  nullable=False, default="")
    description = db.Column(db.Text, default="")
    order_index = db.Column(db.Integer, default=0)
    fiscal_year = db.Column(db.Integer, nullable=True)   # Ex: 2026

    # Relationships
    tenant  = db.relationship("Tenant",  lazy="noload", foreign_keys=[tenant_id])
    project = db.relationship("Project", back_populates="pillars", lazy="noload")
    orcs    = db.relationship("ORC", back_populates="pillar", lazy="noload")

    def to_dict_safe(self):
        return {
            "id":           str(self.id),
            "tenant_id":    str(self.tenant_id),
            "project_id":   str(self.project_id),
            "project_name": self.project.name if self.project else None,
            "name":         self.name,
            "code":         self.code,
            "description":  self.description,
            "order_index":  self.order_index,
            "fiscal_year":  self.fiscal_year,
            "is_active":    self.is_active,
            "created_at":   self.created_at.isoformat() if self.created_at else None,
            "updated_at":   self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<StrategicPillar(id={self.id}, code={self.code}, name={self.name})>"
