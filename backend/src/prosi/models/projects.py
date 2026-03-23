from backend.src.databases.extensions import db
from backend.src.models.controls import AuditMixin


class Project(db.Model, AuditMixin):
    """
    Projet PROSI — entité racine.
    Un projet regroupe des ORCs et des activités.
    """
    __tablename__ = "projects"
    __table_args__ = (
        db.UniqueConstraint("tenant_id", "code", name="uq_prosi_project_tenant_code"),
        {'schema': 'prosi'},
    )

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    name = db.Column(db.String(255), nullable=False)
    code = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text, default="")
    start_date = db.Column(db.Date, nullable=True)
    end_date = db.Column(db.Date, nullable=True)
    status = db.Column(db.String(20), nullable=False, default="DRAFT")
    # DRAFT | ACTIVE | ON_HOLD | COMPLETED | CANCELLED
    priority = db.Column(db.String(10), nullable=False, default="MEDIUM")
    # LOW | MEDIUM | HIGH | CRITICAL
    budget = db.Column(db.Numeric(15, 2), nullable=True)
    budget_currency = db.Column(db.String(10), default="XOF")
    owner_id = db.Column(db.BigInteger, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    notes = db.Column(db.Text, default="")

    # Relationships
    tenant     = db.relationship("Tenant",   lazy="noload", foreign_keys=[tenant_id])
    owner      = db.relationship("User",     lazy="noload", foreign_keys=[owner_id])
    pillars    = db.relationship("StrategicPillar", back_populates="project", lazy="noload", cascade="all, delete-orphan")
    orcs       = db.relationship("ORC",      back_populates="project", lazy="noload", cascade="all, delete-orphan")
    activities = db.relationship("Activity", back_populates="project", lazy="noload", cascade="all, delete-orphan")
    reports    = db.relationship("MonthlyReport", back_populates="project", lazy="noload", cascade="all, delete-orphan")

    def to_dict_safe(self):
        return {
            "id": str(self.id),
            "tenant_id": str(self.tenant_id),
            "name": self.name,
            "code": self.code,
            "description": self.description,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "status": self.status,
            "priority": self.priority,
            "budget": float(self.budget) if self.budget is not None else None,
            "budget_currency": self.budget_currency,
            "owner_id": str(self.owner_id) if self.owner_id else None,
            "owner_name": self.owner.get_full_name() if self.owner and hasattr(self.owner, 'get_full_name') else (
                f"{self.owner.firstname or ''} {self.owner.lastname or ''}".strip() if self.owner else None
            ),
            "notes": self.notes,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<Project(id={self.id}, code={self.code})>"
