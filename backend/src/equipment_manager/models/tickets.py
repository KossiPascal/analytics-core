from datetime import datetime, timezone
from backend.src.databases.extensions import db


class ProblemType(db.Model):
    __tablename__ = "em_problem_types"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255), nullable=False)
    code = db.Column(db.String(50), unique=True, nullable=False)
    category = db.Column(db.String(20), nullable=False)  # HARDWARE, SOFTWARE, OTHER
    display_order = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), onupdate=lambda: datetime.now(timezone.utc))

    issues = db.relationship("Issue", back_populates="problem_type", lazy="selectin")

    def to_dict_safe(self):
        return {
            "id": str(self.id),
            "name": self.name,
            "code": self.code,
            "category": self.category,
            "display_order": self.display_order,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<ProblemType(id={self.id}, code={self.code})>"


class RepairTicket(db.Model):
    __tablename__ = "em_repair_tickets"

    STATUS_CHOICES = ["OPEN", "IN_PROGRESS", "REPAIRED", "RETURNING", "CLOSED", "CANCELLED"]
    STAGE_CHOICES = [
        "SUPERVISOR", "PROGRAM", "LOGISTICS", "REPAIRER", "ESANTE",
        "RETURNING_LOGISTICS", "RETURNING_PROGRAM", "RETURNING_SUPERVISOR", "RETURNED_ASC",
    ]
    STAGE_LABELS = {
        "SUPERVISOR": "Superviseur",
        "PROGRAM": "Programme",
        "LOGISTICS": "Logistique",
        "REPAIRER": "Réparateur",
        "ESANTE": "E-Santé",
        "RETURNING_LOGISTICS": "Retour - Logistique",
        "RETURNING_PROGRAM": "Retour - Programme",
        "RETURNING_SUPERVISOR": "Retour - Superviseur",
        "RETURNED_ASC": "Retourné à l'ASC",
    }

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    ticket_number = db.Column(db.String(30), unique=True, nullable=False)
    equipment_id = db.Column(db.BigInteger, db.ForeignKey("em_equipment.id", ondelete="CASCADE"), nullable=False)
    asc_id = db.Column(db.BigInteger, db.ForeignKey("em_ascs.id", ondelete="CASCADE"), nullable=False)
    status = db.Column(db.String(20), default="OPEN", nullable=False)
    current_stage = db.Column(db.String(30), default="SUPERVISOR", nullable=False)
    current_holder_id = db.Column(db.BigInteger, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    initial_send_date = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    repair_completed_date = db.Column(db.DateTime(timezone=True), nullable=True)
    closed_date = db.Column(db.DateTime(timezone=True), nullable=True)
    cancelled_date = db.Column(db.DateTime(timezone=True), nullable=True)
    cancellation_reason = db.Column(db.Text, default="")

    created_by_id = db.Column(db.BigInteger, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    initial_problem_description = db.Column(db.Text, nullable=False)
    resolution_notes = db.Column(db.Text, default="")

    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), onupdate=lambda: datetime.now(timezone.utc))

    equipment = db.relationship("Equipment", back_populates="repair_tickets", lazy="selectin")
    asc = db.relationship("ASC", back_populates="repair_tickets", lazy="selectin")
    events = db.relationship("TicketEvent", back_populates="ticket", lazy="selectin", cascade="all, delete-orphan")
    issues = db.relationship("Issue", back_populates="ticket", lazy="selectin", cascade="all, delete-orphan")
    comments = db.relationship("TicketComment", back_populates="ticket", lazy="selectin", cascade="all, delete-orphan")
    delay_alerts = db.relationship("DelayAlertLog", back_populates="ticket", lazy="selectin", cascade="all, delete-orphan")

    def get_delay_days(self):
        if self.closed_date:
            delta = self.closed_date - self.initial_send_date
        else:
            delta = datetime.now(timezone.utc) - self.initial_send_date
        return delta.days

    def get_delay_color(self):
        days = self.get_delay_days()
        if days <= 7:
            return "green"
        elif days <= 14:
            return "yellow"
        return "red"

    def get_time_at_current_stage(self):
        last_arrival = None
        for event in sorted(self.events, key=lambda e: e.timestamp, reverse=True):
            if event.to_role == self.current_stage:
                last_arrival = event
                break
        if last_arrival:
            return (datetime.now(timezone.utc) - last_arrival.timestamp).days
        return 0

    def is_blocked(self):
        sorted_events = sorted(self.events, key=lambda e: e.timestamp, reverse=True)
        if sorted_events and sorted_events[0].event_type == "RECEIVED":
            for ev in sorted_events:
                if ev.event_type == "SENT" and ev.timestamp > sorted_events[0].timestamp:
                    return False
            return True
        return False

    def to_dict_safe(self):
        return {
            "id": str(self.id),
            "ticket_number": self.ticket_number,
            "equipment_id": str(self.equipment_id),
            "equipment_imei": self.equipment.imei if self.equipment else None,
            "equipment_brand": self.equipment.brand if self.equipment else None,
            "equipment_model": self.equipment.model_name if self.equipment else None,
            "asc_id": str(self.asc_id),
            "asc_name": self.asc.get_full_name() if self.asc else None,
            "status": self.status,
            "current_stage": self.current_stage,
            "current_stage_label": self.STAGE_LABELS.get(self.current_stage, self.current_stage),
            "current_holder_id": str(self.current_holder_id) if self.current_holder_id else None,
            "initial_send_date": self.initial_send_date.isoformat() if self.initial_send_date else None,
            "repair_completed_date": self.repair_completed_date.isoformat() if self.repair_completed_date else None,
            "closed_date": self.closed_date.isoformat() if self.closed_date else None,
            "cancelled_date": self.cancelled_date.isoformat() if self.cancelled_date else None,
            "cancellation_reason": self.cancellation_reason,
            "created_by_id": str(self.created_by_id) if self.created_by_id else None,
            "initial_problem_description": self.initial_problem_description,
            "resolution_notes": self.resolution_notes,
            "delay_days": self.get_delay_days(),
            "delay_color": self.get_delay_color(),
            "days_at_current_stage": self.get_time_at_current_stage(),
            "is_blocked": self.is_blocked(),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<RepairTicket(id={self.id}, number={self.ticket_number})>"


class Issue(db.Model):
    __tablename__ = "em_issues"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    ticket_id = db.Column(db.BigInteger, db.ForeignKey("em_repair_tickets.id", ondelete="CASCADE"), nullable=False)
    problem_type_id = db.Column(db.BigInteger, db.ForeignKey("em_problem_types.id", ondelete="RESTRICT"), nullable=False)
    description = db.Column(db.Text, default="")
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    ticket = db.relationship("RepairTicket", back_populates="issues", lazy="selectin")
    problem_type = db.relationship("ProblemType", back_populates="issues", lazy="selectin")

    def to_dict_safe(self):
        return {
            "id": str(self.id),
            "ticket_id": str(self.ticket_id),
            "problem_type_id": str(self.problem_type_id),
            "problem_type_name": self.problem_type.name if self.problem_type else None,
            "problem_type_category": self.problem_type.category if self.problem_type else None,
            "description": self.description,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<Issue(id={self.id}, ticket_id={self.ticket_id})>"


class TicketEvent(db.Model):
    __tablename__ = "em_ticket_events"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    ticket_id = db.Column(db.BigInteger, db.ForeignKey("em_repair_tickets.id", ondelete="CASCADE"), nullable=False)
    event_type = db.Column(db.String(20), nullable=False)
    from_role = db.Column(db.String(30), default="")
    to_role = db.Column(db.String(30), default="")
    user_id = db.Column(db.BigInteger, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    timestamp = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    comment = db.Column(db.Text, default="")
    attachment_path = db.Column(db.String(500), default="")

    ticket = db.relationship("RepairTicket", back_populates="events", lazy="selectin")

    def to_dict_safe(self):
        return {
            "id": str(self.id),
            "ticket_id": str(self.ticket_id),
            "event_type": self.event_type,
            "from_role": self.from_role,
            "to_role": self.to_role,
            "from_role_label": RepairTicket.STAGE_LABELS.get(self.from_role, self.from_role),
            "to_role_label": RepairTicket.STAGE_LABELS.get(self.to_role, self.to_role),
            "user_id": str(self.user_id) if self.user_id else None,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "comment": self.comment,
            "attachment_path": self.attachment_path,
        }

    def __repr__(self):
        return f"<TicketEvent(id={self.id}, type={self.event_type})>"


class TicketComment(db.Model):
    __tablename__ = "em_ticket_comments"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    ticket_id = db.Column(db.BigInteger, db.ForeignKey("em_repair_tickets.id", ondelete="CASCADE"), nullable=False)
    user_id = db.Column(db.BigInteger, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    comment = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    ticket = db.relationship("RepairTicket", back_populates="comments", lazy="selectin")

    def to_dict_safe(self):
        return {
            "id": str(self.id),
            "ticket_id": str(self.ticket_id),
            "user_id": str(self.user_id) if self.user_id else None,
            "comment": self.comment,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<TicketComment(id={self.id})>"


class DelayAlertRecipient(db.Model):
    __tablename__ = "em_delay_alert_recipients"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    user_id = db.Column(db.BigInteger, db.ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    email = db.Column(db.String(255), nullable=False)
    recipient_type = db.Column(db.String(20), default="PRIMARY", nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), onupdate=lambda: datetime.now(timezone.utc))

    def to_dict_safe(self):
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "email": self.email,
            "recipient_type": self.recipient_type,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<DelayAlertRecipient(id={self.id}, email={self.email})>"


class DelayAlertLog(db.Model):
    __tablename__ = "em_delay_alert_logs"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    ticket_id = db.Column(db.BigInteger, db.ForeignKey("em_repair_tickets.id", ondelete="CASCADE"), nullable=False)
    stage = db.Column(db.String(30), nullable=False)
    days_in_stage = db.Column(db.Integer, nullable=False)
    recipients = db.Column(db.Text, nullable=False)
    sent_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    email_sent_successfully = db.Column(db.Boolean, default=False, nullable=False)
    error_message = db.Column(db.Text, default="")

    ticket = db.relationship("RepairTicket", back_populates="delay_alerts", lazy="selectin")

    def to_dict_safe(self):
        return {
            "id": str(self.id),
            "ticket_id": str(self.ticket_id),
            "ticket_number": self.ticket.ticket_number if self.ticket else None,
            "stage": self.stage,
            "days_in_stage": self.days_in_stage,
            "recipients": self.recipients,
            "sent_at": self.sent_at.isoformat() if self.sent_at else None,
            "email_sent_successfully": self.email_sent_successfully,
            "error_message": self.error_message,
        }

    def __repr__(self):
        return f"<DelayAlertLog(id={self.id}, ticket_id={self.ticket_id})>"
