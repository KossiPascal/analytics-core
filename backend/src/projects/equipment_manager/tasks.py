"""
Celery tasks for Equipment Manager — periodic ticket delay alerts.
"""
from datetime import datetime, timezone

import celery

from backend.src.projects.analytics_manager.logger import get_backend_logger
from backend.src.projects.equipment_manager.models.email_config import AlertConfig, AlertRecipientConfig
from backend.src.projects.equipment_manager.models.tickets import DelayAlertLog, RepairTicket
from backend.src.projects.equipment_manager.services.email_service import send_delay_alert_v2

logger = get_backend_logger(__name__)


def _get_employee_email(employee):
    """Return email from employee profile, or None."""
    if not employee:
        return None
    if hasattr(employee, "profile") and employee.profile and employee.profile.email:
        return employee.profile.email
    return None


def _collect_to_emails(ticket, level):
    """
    Build the TO list:
    1. The current holder's employee email.
    2. AlertRecipientConfig rows matching (level=level, stage in [ticket.stage, None]).
    """
    from backend.src.app.configs.extensions import db
    from backend.src.app.models.employee import Employee
    from backend.src.app.models.user import User

    emails = set()

    # 1. Current holder's email
    if ticket.current_holder_id:
        holder_user = db.session.get(User, ticket.current_holder_id)
        if holder_user:
            # Try to find linked employee via employee_profile
            emp = (
                Employee.query
                .join(Employee.profile)
                .filter_by(user_id=holder_user.id)
                .first()
            )
            email = _get_employee_email(emp)
            if email:
                emails.add(email)

    # 2. Configured recipients (for this stage or all stages)
    configs = AlertRecipientConfig.query.filter(
        AlertRecipientConfig.alert_level == level,
        AlertRecipientConfig.is_active.is_(True),
        db.or_(
            AlertRecipientConfig.stage == ticket.current_stage,
            AlertRecipientConfig.stage.is_(None),
        ),
    ).all()

    for cfg in configs:
        if cfg.recipient_type == "EMPLOYEE" and cfg.employee:
            email = _get_employee_email(cfg.employee)
            if email:
                emails.add(email)
        elif cfg.recipient_type == "POSITION" and cfg.position_id:
            employees_in_pos = Employee.query.filter(
                Employee.position_id == cfg.position_id,
                Employee.is_active.is_(True),
            ).all()
            for emp in employees_in_pos:
                email = _get_employee_email(emp)
                if email:
                    emails.add(email)

    return list(emails)


def _collect_bcc_emails(ticket):
    """
    Build the BCC list from AlertRecipientConfig rows with alert_level='BCC'.
    """
    from backend.src.app.configs.extensions import db
    from backend.src.app.models.employee import Employee

    emails = set()
    configs = AlertRecipientConfig.query.filter(
        AlertRecipientConfig.alert_level == "BCC",
        AlertRecipientConfig.is_active.is_(True),
        db.or_(
            AlertRecipientConfig.stage == ticket.current_stage,
            AlertRecipientConfig.stage.is_(None),
        ),
    ).all()

    for cfg in configs:
        if cfg.recipient_type == "EMPLOYEE" and cfg.employee:
            email = _get_employee_email(cfg.employee)
            if email:
                emails.add(email)
        elif cfg.recipient_type == "POSITION" and cfg.position_id:
            employees_in_pos = Employee.query.filter(
                Employee.position_id == cfg.position_id,
                Employee.is_active.is_(True),
            ).all()
            for emp in employees_in_pos:
                email = _get_employee_email(emp)
                if email:
                    emails.add(email)

    return list(emails)


@celery.task(name="backend.src.equipment_manager.tasks.check_ticket_delays")
def check_ticket_delays():
    """
    Periodic task (hourly): send delay alert emails for tickets
    that have been at their current stage longer than warning_days.
    Respects frequency_hours to avoid spamming.
    """
    from backend.src.app.configs.extensions import db

    config = AlertConfig.query.filter_by(is_active=True).first()
    if not config:
        logger.info("check_ticket_delays: no active AlertConfig found, skipping.")
        return

    tickets = RepairTicket.query.filter(
        RepairTicket.status.in_(["OPEN", "IN_PROGRESS", "RETURNING"]),
        RepairTicket.current_holder_id.isnot(None),
    ).all()

    sent_count = 0
    skipped_count = 0

    for ticket in tickets:
        days = ticket.get_time_at_current_stage()
        if days < config.warning_days:
            continue

        level = "ESCALATION" if days >= config.escalation_days else "WARNING"

        # Check frequency: skip if last alert for this ticket+stage was too recent
        last_log = (
            DelayAlertLog.query
            .filter_by(ticket_id=ticket.id, stage=ticket.current_stage)
            .order_by(DelayAlertLog.sent_at.desc())
            .first()
        )
        if last_log:
            elapsed_h = (datetime.now(timezone.utc) - last_log.sent_at).total_seconds() / 3600
            if elapsed_h < config.frequency_hours:
                skipped_count += 1
                continue

        to_emails = _collect_to_emails(ticket, level)
        bcc_emails = _collect_bcc_emails(ticket)

        if not to_emails and not bcc_emails:
            logger.info(f"Ticket {ticket.ticket_number}: no recipients configured for level={level}")
            continue

        success = send_delay_alert_v2(ticket, to_emails, bcc_emails, ticket.current_stage, days, level)

        log = DelayAlertLog(
            ticket_id=ticket.id,
            stage=ticket.current_stage,
            days_in_stage=days,
            recipients=",".join(to_emails),
            email_sent_successfully=success,
            error_message="" if success else "send failed",
        )
        db.session.add(log)
        db.session.commit()

        sent_count += 1

    logger.info(
        f"check_ticket_delays done: {sent_count} alert(s) sent, {skipped_count} skipped (frequency)."
    )
