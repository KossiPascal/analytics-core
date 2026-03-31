import json
from backend.src.databases.extensions import db
from backend.src.models.controls import AuditMixin


class MonthlyReport(db.Model, AuditMixin):
    """
    Rapport mensuel d'activités généré pour un projet.
    Le contenu (content_json) est un objet JSON structuré.
    """
    __tablename__ = "monthly_reports"
    __table_args__ = (
        db.UniqueConstraint("project_id", "year", "month", name="uq_prosi_report_project_period"),
        {'schema': 'prosi'},
    )

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = db.Column(db.BigInteger, db.ForeignKey("prosi.projects.id", ondelete="CASCADE"), nullable=False)
    year = db.Column(db.Integer, nullable=False)
    month = db.Column(db.Integer, nullable=False)   # 1-12
    title = db.Column(db.String(255), nullable=False)
    summary = db.Column(db.Text, default="")
    content_json = db.Column(db.Text, default="{}")  # JSON structuré
    status = db.Column(db.String(20), nullable=False, default="DRAFT")
    # DRAFT | PUBLISHED

    # Relationships
    tenant = db.relationship("Tenant", lazy="noload", foreign_keys=[tenant_id])
    project = db.relationship("Project", back_populates="reports", lazy="noload")

    @property
    def content(self):
        try:
            return json.loads(self.content_json or "{}")
        except Exception:
            return {}

    @content.setter
    def content(self, value):
        self.content_json = json.dumps(value, ensure_ascii=False)

    def to_dict_safe(self):
        return {
            "id": str(self.id),
            "tenant_id": str(self.tenant_id),
            "project_id": str(self.project_id),
            "project_name": self.project.name if self.project else None,
            "year": self.year,
            "month": self.month,
            "title": self.title,
            "summary": self.summary,
            "content": self.content,
            "status": self.status,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<MonthlyReport(id={self.id}, project_id={self.project_id}, {self.year}-{self.month:02d})>"
