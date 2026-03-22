from backend.src.databases.extensions import db
from backend.src.models.controls import AuditMixin


class ORC(db.Model, AuditMixin):
    """
    ORC — Objectif de Résultat Clé.
    Hiérarchique : un ORC peut avoir des sous-ORCs (parent_id).
    Rattaché à un Project.
    """
    __tablename__ = "orcs"
    __table_args__ = {'schema': 'prosi'}

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = db.Column(db.BigInteger, db.ForeignKey("prosi.projects.id", ondelete="CASCADE"), nullable=False, index=True)
    parent_id = db.Column(db.BigInteger, db.ForeignKey("prosi.orcs.id", ondelete="CASCADE"), nullable=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, default="")
    # Mesure du progrès
    target_value = db.Column(db.Numeric(15, 2), nullable=True)
    current_value = db.Column(db.Numeric(15, 2), nullable=True, default=0)
    unit = db.Column(db.String(50), default="")  # ex: %, nb, FCFA, km…
    # Statut
    status = db.Column(db.String(20), nullable=False, default="DRAFT")
    # DRAFT | ACTIVE | AT_RISK | COMPLETED | CANCELLED
    weight = db.Column(db.Numeric(5, 2), default=1.0)  # Pondération dans le calcul global
    start_date = db.Column(db.Date, nullable=True)
    end_date = db.Column(db.Date, nullable=True)
    responsible_id = db.Column(db.BigInteger, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    notes = db.Column(db.Text, default="")
    # Type explicite : OBJECTIF (racine) ou RESULTAT_CLE (enfant)
    orc_type = db.Column(db.String(20), nullable=False, default="OBJECTIF")

    # Relationships
    tenant = db.relationship("Tenant", lazy="noload", foreign_keys=[tenant_id])
    project = db.relationship("Project", back_populates="orcs", lazy="noload")
    parent = db.relationship("ORC", remote_side=[id], back_populates="children", lazy="noload")
    children = db.relationship("ORC", back_populates="parent", lazy="noload", cascade="all, delete-orphan")
    responsible = db.relationship("User", lazy="noload", foreign_keys=[responsible_id])
    activities = db.relationship("Activity", back_populates="orc", lazy="noload")

    @property
    def progress_percent(self):
        """Calcule le % de réalisation selon target_value / current_value."""
        if self.target_value and float(self.target_value) > 0 and self.current_value is not None:
            return min(round(float(self.current_value) / float(self.target_value) * 100, 1), 100.0)
        return 0.0

    def to_dict_safe(self):
        return {
            "id": str(self.id),
            "tenant_id": str(self.tenant_id),
            "project_id": str(self.project_id),
            "project_name": self.project.name if self.project else None,
            "parent_id": str(self.parent_id) if self.parent_id else None,
            "parent_name": self.parent.name if self.parent else None,
            "name": self.name,
            "description": self.description,
            "target_value": float(self.target_value) if self.target_value is not None else None,
            "current_value": float(self.current_value) if self.current_value is not None else 0.0,
            "unit": self.unit,
            "progress_percent": self.progress_percent,
            "status": self.status,
            "weight": float(self.weight) if self.weight is not None else 1.0,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "responsible_id": str(self.responsible_id) if self.responsible_id else None,
            "responsible_name": (
                f"{self.responsible.firstname or ''} {self.responsible.lastname or ''}".strip()
                if self.responsible else None
            ),
            "notes": self.notes,
            "orc_type": self.orc_type,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<ORC(id={self.id}, name={self.name})>"
