from datetime import datetime, timezone
from backend.src.databases.extensions import db
from backend.src.models.controls import AuditMixin


class EmployeeObjective(db.Model, AuditMixin):
    """
    Objectif trimestriel individuel d'un employé.
    Peut être rattaché à un ORC organisationnel (cascade).
    Workflow : DRAFT → SUBMITTED → APPROVED / REJECTED → COMPLETED
    """
    __tablename__ = "employee_objectives"
    __table_args__ = {'schema': 'prosi'}

    id          = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id   = db.Column(db.BigInteger, db.ForeignKey("tenants.id",          ondelete="CASCADE"),  nullable=False, index=True)
    employee_id = db.Column(db.BigInteger, db.ForeignKey("eqpm.employees.id",   ondelete="CASCADE"),  nullable=False, index=True)
    user_id     = db.Column(db.BigInteger, db.ForeignKey("users.id",            ondelete="SET NULL"), nullable=True,  index=True)
    # Liens organisationnels (optionnels)
    project_id  = db.Column(db.BigInteger, db.ForeignKey("prosi.projects.id",   ondelete="SET NULL"), nullable=True,  index=True)
    orc_id      = db.Column(db.BigInteger, db.ForeignKey("prosi.orcs.id",       ondelete="SET NULL"), nullable=True,  index=True)
    # Contenu
    title            = db.Column(db.String(255), nullable=False)
    description      = db.Column(db.Text, default="")
    target_indicator = db.Column(db.Text, default="")       # indicateur mesurable
    target_value     = db.Column(db.Numeric(15, 2), nullable=True)
    current_value    = db.Column(db.Numeric(15, 2), nullable=True, default=0)
    unit             = db.Column(db.String(50), default="")
    score            = db.Column(db.Numeric(4, 2), nullable=True)   # 0.00–1.00
    # Période
    fiscal_year = db.Column(db.Integer, nullable=False)
    quarter     = db.Column(db.String(10), nullable=False)  # T1 | T2 | T3 | T4
    # Priorité & statut
    priority = db.Column(db.String(10), nullable=False, default="MEDIUM")
    # LOW | MEDIUM | HIGH | CRITICAL
    status   = db.Column(db.String(20), nullable=False, default="DRAFT")
    # DRAFT | SUBMITTED | APPROVED | REJECTED | COMPLETED
    # Validation manager
    reviewer_id  = db.Column(db.BigInteger, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewed_at  = db.Column(db.DateTime(timezone=True), nullable=True)
    review_notes = db.Column(db.Text, default="")
    notes        = db.Column(db.Text, default="")

    # Relationships
    tenant   = db.relationship("Tenant",   lazy="noload", foreign_keys=[tenant_id])
    employee = db.relationship("Employee", lazy="noload", foreign_keys=[employee_id])
    user     = db.relationship("User",     lazy="noload", foreign_keys=[user_id])
    project  = db.relationship("Project",  lazy="noload", foreign_keys=[project_id])
    orc      = db.relationship("ORC",      lazy="noload", foreign_keys=[orc_id])
    reviewer = db.relationship("User",     lazy="noload", foreign_keys=[reviewer_id])

    @property
    def progress_percent(self) -> float:
        if self.target_value and float(self.target_value) > 0 and self.current_value is not None:
            return min(round(float(self.current_value) / float(self.target_value) * 100, 1), 100.0)
        return 0.0

    def to_dict_safe(self):
        employee_name = self.employee.get_full_name() if self.employee else None
        reviewer_name = None
        if self.reviewer:
            reviewer_name = f"{self.reviewer.firstname or ''} {self.reviewer.lastname or ''}".strip()
        return {
            "id":               str(self.id),
            "tenant_id":        str(self.tenant_id),
            "employee_id":      str(self.employee_id),
            "employee_name":    employee_name,
            "user_id":          str(self.user_id) if self.user_id else None,
            "project_id":       str(self.project_id) if self.project_id else None,
            "project_name":     self.project.name if self.project else None,
            "orc_id":           str(self.orc_id) if self.orc_id else None,
            "orc_name":         self.orc.name if self.orc else None,
            "title":            self.title,
            "description":      self.description,
            "target_indicator": self.target_indicator,
            "target_value":     float(self.target_value)  if self.target_value  is not None else None,
            "current_value":    float(self.current_value) if self.current_value is not None else 0.0,
            "unit":             self.unit,
            "score":            float(self.score) if self.score is not None else None,
            "progress_percent": self.progress_percent,
            "fiscal_year":      self.fiscal_year,
            "quarter":          self.quarter,
            "priority":         self.priority,
            "status":           self.status,
            "reviewer_id":      str(self.reviewer_id) if self.reviewer_id else None,
            "reviewer_name":    reviewer_name,
            "reviewed_at":      self.reviewed_at.isoformat() if self.reviewed_at else None,
            "review_notes":     self.review_notes,
            "notes":            self.notes,
            "is_active":        self.is_active,
            "created_at":       self.created_at.isoformat() if self.created_at else None,
            "updated_at":       self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<EmployeeObjective(id={self.id}, employee_id={self.employee_id}, {self.fiscal_year}-{self.quarter})>"
