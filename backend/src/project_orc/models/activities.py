from datetime import datetime, timezone
from backend.src.databases.extensions import db
from backend.src.models.controls import AuditMixin


class Activity(db.Model, AuditMixin):
    """
    Activité planifiée rattachée à un projet (et optionnellement à un ORC).
    """
    __tablename__ = "activities"
    __table_args__ = {'schema': 'prosi'}

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = db.Column(db.BigInteger, db.ForeignKey("prosi.projects.id", ondelete="CASCADE"), nullable=False, index=True)
    orc_id = db.Column(db.BigInteger, db.ForeignKey("prosi.orcs.id", ondelete="SET NULL"), nullable=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, default="")
    start_date = db.Column(db.Date, nullable=True)
    end_date = db.Column(db.Date, nullable=True)
    due_date = db.Column(db.Date, nullable=True)
    status = db.Column(db.String(20), nullable=False, default="TODO")
    # TODO | IN_PROGRESS | DONE | BLOCKED | CANCELLED
    priority = db.Column(db.String(10), nullable=False, default="MEDIUM")
    # LOW | MEDIUM | HIGH | CRITICAL
    progress = db.Column(db.Integer, default=0)  # 0-100
    assignee_id = db.Column(db.BigInteger, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    notes = db.Column(db.Text, default="")
    tags = db.Column(db.String(500), default="")  # Comma-separated

    # Relationships
    tenant = db.relationship("Tenant", lazy="noload", foreign_keys=[tenant_id])
    project = db.relationship("Project", back_populates="activities", lazy="noload")
    orc = db.relationship("ORC", back_populates="activities", lazy="noload")
    assignee = db.relationship("User", lazy="noload", foreign_keys=[assignee_id])
    progress_logs = db.relationship(
        "ActivityProgress", back_populates="activity",
        lazy="noload", cascade="all, delete-orphan"
    )

    def to_dict_safe(self):
        return {
            "id": str(self.id),
            "tenant_id": str(self.tenant_id),
            "project_id": str(self.project_id),
            "project_name": self.project.name if self.project else None,
            "orc_id": str(self.orc_id) if self.orc_id else None,
            "orc_name": self.orc.name if self.orc else None,
            "name": self.name,
            "description": self.description,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "status": self.status,
            "priority": self.priority,
            "progress": self.progress,
            "assignee_id": str(self.assignee_id) if self.assignee_id else None,
            "assignee_name": (
                f"{self.assignee.firstname or ''} {self.assignee.lastname or ''}".strip()
                if self.assignee else None
            ),
            "notes": self.notes,
            "tags": [t.strip() for t in self.tags.split(",") if t.strip()] if self.tags else [],
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<Activity(id={self.id}, name={self.name})>"


class ActivityProgress(db.Model, AuditMixin):
    """
    Journal de progression d'une activité.
    """
    __tablename__ = "activity_progress"
    __table_args__ = {'schema': 'prosi'}

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    activity_id = db.Column(db.BigInteger, db.ForeignKey("prosi.activities.id", ondelete="CASCADE"), nullable=False, index=True)
    progress_percent = db.Column(db.Integer, nullable=False, default=0)  # 0-100
    notes = db.Column(db.Text, default="")
    log_date = db.Column(db.Date, nullable=False, default=lambda: datetime.now(timezone.utc).date())

    activity = db.relationship("Activity", back_populates="progress_logs", lazy="noload")

    def to_dict_safe(self):
        return {
            "id": str(self.id),
            "activity_id": str(self.activity_id),
            "progress_percent": self.progress_percent,
            "notes": self.notes,
            "log_date": self.log_date.isoformat() if self.log_date else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<ActivityProgress(id={self.id}, activity_id={self.activity_id}, progress={self.progress_percent}%)>"
