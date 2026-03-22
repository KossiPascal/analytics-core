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
    tenant_id     = db.Column(db.BigInteger, db.ForeignKey("tenants.id",          ondelete="CASCADE"),  nullable=False, index=True)
    project_id    = db.Column(db.BigInteger, db.ForeignKey("prosi.projects.id",   ondelete="CASCADE"),  nullable=False, index=True)
    pillar_id     = db.Column(db.BigInteger, db.ForeignKey("prosi.pillars.id",    ondelete="SET NULL"), nullable=True,  index=True)
    parent_id     = db.Column(db.BigInteger, db.ForeignKey("prosi.orcs.id",       ondelete="CASCADE"),  nullable=True)
    department_id = db.Column(db.BigInteger, db.ForeignKey("eqpm.departments.id", ondelete="SET NULL"), nullable=True,  index=True)
    # Type explicite : OBJECTIF (racine) ou RESULTAT_CLE (enfant)
    orc_type      = db.Column(db.String(20), nullable=False, default="OBJECTIF")
    # Code hiérarchique OKR : ex "Obj 1", "RC 1.1", "RC 2.3"
    code          = db.Column(db.String(30), default="")
    name          = db.Column(db.String(255), nullable=False)
    description   = db.Column(db.Text, default="")
    # Indicateur cible descriptif (texte libre)
    target_indicator = db.Column(db.Text, default="")
    # Mesure du progrès quantitatif
    target_value  = db.Column(db.Numeric(15, 2), nullable=True)
    current_value = db.Column(db.Numeric(15, 2), nullable=True, default=0)
    unit          = db.Column(db.String(50), default="")   # ex: %, nb, FCFA, km…
    # Score OKR 0.00–1.00 (style Excel)
    score         = db.Column(db.Numeric(4, 2), nullable=True)
    # Statut
    status        = db.Column(db.String(20), nullable=False, default="DRAFT")
    # DRAFT | ACTIVE | AT_RISK | COMPLETED | CANCELLED
    priority      = db.Column(db.String(10), nullable=False, default="MEDIUM")
    # LOW | MEDIUM | HIGH | CRITICAL  (Basse=LOW, Haute=HIGH dans les Excel)
    weight        = db.Column(db.Numeric(5, 2), default=1.0)
    start_date    = db.Column(db.Date, nullable=True)
    end_date      = db.Column(db.Date, nullable=True)
    fiscal_year   = db.Column(db.Integer, nullable=True)       # Ex: 2026
    quarter       = db.Column(db.String(10), nullable=True)    # T1 | T2 | T3 | T4 | YEARLY
    responsible_id = db.Column(db.BigInteger, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    notes         = db.Column(db.Text, default="")

    # Relationships
    tenant     = db.relationship("Tenant",          lazy="noload", foreign_keys=[tenant_id])
    project    = db.relationship("Project",         back_populates="orcs",     lazy="noload")
    pillar     = db.relationship("StrategicPillar", back_populates="orcs",     lazy="noload")
    department = db.relationship("Department",      lazy="noload", foreign_keys=[department_id])
    parent     = db.relationship("ORC", remote_side=[id], back_populates="children", lazy="noload")
    children   = db.relationship("ORC", back_populates="parent", lazy="noload", cascade="all, delete-orphan")
    responsible = db.relationship("User", lazy="noload", foreign_keys=[responsible_id])
    activities  = db.relationship("Activity", back_populates="orc", lazy="noload")

    @property
    def progress_percent(self):
        """Calcule le % de réalisation selon target_value / current_value."""
        if self.target_value and float(self.target_value) > 0 and self.current_value is not None:
            return min(round(float(self.current_value) / float(self.target_value) * 100, 1), 100.0)
        return 0.0

    def to_dict_safe(self):
        return {
            "id":               str(self.id),
            "tenant_id":        str(self.tenant_id),
            "project_id":       str(self.project_id),
            "project_name":     self.project.name if self.project else None,
            "pillar_id":        str(self.pillar_id) if self.pillar_id else None,
            "pillar_name":      self.pillar.name if self.pillar else None,
            "pillar_code":      self.pillar.code if self.pillar else None,
            "parent_id":        str(self.parent_id) if self.parent_id else None,
            "parent_name":      self.parent.name if self.parent else None,
            "department_id":    str(self.department_id) if self.department_id else None,
            "department_name":  self.department.name if self.department else None,
            "orc_type":         self.orc_type,
            "code":             self.code,
            "name":             self.name,
            "description":      self.description,
            "target_indicator": self.target_indicator,
            "target_value":     float(self.target_value)  if self.target_value  is not None else None,
            "current_value":    float(self.current_value) if self.current_value is not None else 0.0,
            "unit":             self.unit,
            "score":            float(self.score) if self.score is not None else None,
            "progress_percent": self.progress_percent,
            "status":           self.status,
            "priority":         self.priority,
            "weight":           float(self.weight) if self.weight is not None else 1.0,
            "start_date":       self.start_date.isoformat() if self.start_date else None,
            "end_date":         self.end_date.isoformat()   if self.end_date   else None,
            "fiscal_year":      self.fiscal_year,
            "quarter":          self.quarter,
            "responsible_id":   str(self.responsible_id) if self.responsible_id else None,
            "responsible_name": (
                f"{self.responsible.firstname or ''} {self.responsible.lastname or ''}".strip()
                if self.responsible else None
            ),
            "notes":     self.notes,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<ORC(id={self.id}, name={self.name})>"
