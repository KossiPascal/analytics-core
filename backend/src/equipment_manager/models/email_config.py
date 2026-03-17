"""
Models for email/alert configuration in the Equipment Manager.
"""
from datetime import datetime, timezone
from cryptography.fernet import Fernet
from backend.src.databases.extensions import db
from backend.src.config import Config
from backend.src.models.controls import AuditMixin


def _fernet():
    return Fernet(Config.FERNET_KEY.encode() if isinstance(Config.FERNET_KEY, str) else Config.FERNET_KEY)


def encrypt_password(plain: str) -> str:
    return _fernet().encrypt(plain.encode()).decode()


def decrypt_password(token: str) -> str:
    return _fernet().decrypt(token.encode()).decode()


class EmailConfig(db.Model, AuditMixin):
    """SMTP configuration stored in DB (takes priority over .env)."""
    __tablename__ = "email_config"
    __table_args__ = {'schema': 'eqpm'}

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    host = db.Column(db.String(255), nullable=False)
    port = db.Column(db.Integer, default=587, nullable=False)
    username = db.Column(db.String(255), nullable=False)
    password_encrypted = db.Column(db.Text, nullable=False)
    from_email = db.Column(db.String(255), nullable=False)
    from_name = db.Column(db.String(255), default="IH Equipment Manager")
    use_tls = db.Column(db.Boolean, default=True, nullable=False)

    def to_dict_safe(self):
        return {
            "id": str(self.id),
            "host": self.host,
            "port": self.port,
            "username": self.username,
            "from_email": self.from_email,
            "from_name": self.from_name,
            "use_tls": self.use_tls,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<EmailConfig(id={self.id}, host={self.host})>"

class AlertConfig(db.Model, AuditMixin):
    """Global alert parameters (one active row at a time)."""
    __tablename__ = "alert_config"
    __table_args__ = {'schema': 'eqpm'}

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    warning_days = db.Column(db.Integer, default=7, nullable=False)
    escalation_days = db.Column(db.Integer, default=14, nullable=False)
    frequency_hours = db.Column(db.Integer, default=24, nullable=False)

    def to_dict_safe(self):
        return {
            "id": str(self.id),
            "warning_days": self.warning_days,
            "escalation_days": self.escalation_days,
            "frequency_hours": self.frequency_hours,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<AlertConfig(id={self.id}, warning={self.warning_days}j, escalation={self.escalation_days}j)>"


class AlertRecipientConfig(db.Model, AuditMixin):
    """
    Recipient configuration per stage and alert level.
    - stage=None means the rule applies to all stages.
    - alert_level: 'WARNING' | 'ESCALATION' | 'BCC'
    - recipient_type: 'EMPLOYEE' (one person) | 'POSITION' (all active employees of that position)
    """
    __tablename__ = "alert_recipient_configs"
    __table_args__ = {'schema': 'eqpm'}

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    stage = db.Column(db.String(30), nullable=True)  # null = all stages
    alert_level = db.Column(db.String(20), nullable=False)  # WARNING | ESCALATION | BCC
    recipient_type = db.Column(db.String(20), nullable=False)  # EMPLOYEE | POSITION
    employee_id = db.Column(
        db.BigInteger,
        db.ForeignKey("eqpm.employees.id", ondelete="CASCADE"),
        nullable=True,
    )
    position_id = db.Column(
        db.BigInteger,
        db.ForeignKey("eqpm.positions.id", ondelete="CASCADE"),
        nullable=True,
    )

    employee = db.relationship("Employee", foreign_keys=[employee_id], lazy="noload")
    position = db.relationship("Position", foreign_keys=[position_id], lazy="noload")

    def to_dict_safe(self):
        from backend.src.equipment_manager.models.tickets import RepairTicket
        return {
            "id": str(self.id),
            "stage": self.stage,
            "stage_label": RepairTicket.STAGE_LABELS.get(self.stage, self.stage) if self.stage else "Toutes les étapes",
            "alert_level": self.alert_level,
            "recipient_type": self.recipient_type,
            "employee_id": str(self.employee_id) if self.employee_id else None,
            "employee_name": self.employee.get_full_name() if self.employee else None,
            "position_id": str(self.position_id) if self.position_id else None,
            "position_name": self.position.name if self.position else None,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<AlertRecipientConfig(id={self.id}, level={self.alert_level}, stage={self.stage})>"
