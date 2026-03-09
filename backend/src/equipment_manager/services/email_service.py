"""
Email notification service for equipment manager tickets.
Uses SMTP via environment variables (read at call time, not at import).
"""
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from backend.src.logger import get_backend_logger

logger = get_backend_logger(__name__)

# Stage -> role mapping for email recipients
STAGE_ROLE_MAP = {
    "SUPERVISOR": "SUPERVISOR",
    "PROGRAM": "PROGRAM",
    "LOGISTICS": "LOGISTICS",
    "REPAIRER": "REPAIRER",
    "ESANTE": "ESANTE",
    "RETURNING_LOGISTICS": "LOGISTICS",
    "RETURNING_PROGRAM": "PROGRAM",
    "RETURNING_SUPERVISOR": "SUPERVISOR",
}


def _get_smtp_config():
    """Read SMTP config from env at call time (after load_dotenv has run)."""
    host = os.environ.get("EMAIL_HOST", os.environ.get("SMTP_HOST", ""))
    port = int(os.environ.get("EMAIL_PORT", os.environ.get("SMTP_PORT", "587")))
    user = os.environ.get("EMAIL_HOST_USER", os.environ.get("SMTP_USER", ""))
    password = os.environ.get("EMAIL_HOST_PASSWORD", os.environ.get("SMTP_PASS", ""))
    from_addr = os.environ.get("DEFAULT_FROM_EMAIL", os.environ.get("SMTP_FROM", user))
    use_tls = os.environ.get("EMAIL_USE_TLS", "True").lower() not in ("false", "0", "no")
    site_url = os.environ.get("SITE_URL", "http://localhost:8000")
    return host, port, user, password, from_addr, use_tls, site_url


def get_smtp_config_from_db():
    """
    Return SMTP config with DB priority over .env.
    Returns (host, port, user, password, from_addr, use_tls, site_url).
    """
    try:
        from backend.src.equipment_manager.models.email_config import EmailConfig, decrypt_password
        config = EmailConfig.query.filter_by(is_active=True).first()
        if config:
            site_url = os.environ.get("SITE_URL", "http://localhost:8000")
            return (
                config.host,
                config.port,
                config.username,
                decrypt_password(config.password_encrypted),
                config.from_email,
                config.use_tls,
                site_url,
            )
    except Exception as e:
        logger.warning(f"Could not load SMTP config from DB: {e}")
    return _get_smtp_config()


def send_ticket_notification(ticket, recipient_email, sender_name, to_role, comment="", cc_emails: list | None = None):
    """
    Send email notification when a ticket is sent to the next stage.

    Args:
        ticket: RepairTicket instance
        recipient_email: primary recipient email (or None)
        sender_name: name of the person sending
        to_role: destination stage/role
        comment: optional comment
    Returns:
        bool: True if email sent successfully
    """
    host, _, _, _, from_addr, _, site_url = get_smtp_config_from_db()

    if not host:
        logger.info("SMTP not configured, skipping ticket notification email")
        return False

    if not recipient_email:
        logger.warning(f"No recipient email for ticket {ticket.ticket_number}")
        return False

    try:
        from backend.src.equipment_manager.models.tickets import RepairTicket
        stage_label = RepairTicket.STAGE_LABELS.get(to_role, to_role)

        employee_name = ticket.employee.get_full_name() if ticket.employee else ""
        equipment_info = (
            f"{ticket.equipment.brand} {ticket.equipment.model_name} ({ticket.equipment.imei})"
            if ticket.equipment else ""
        )

        subject = f"[IH Equipment Manager] Nouveau ticket a traiter - {ticket.ticket_number}"

        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">Ticket de reparation - {ticket.ticket_number}</h2>
            <p>Un ticket vous a ete envoye par <strong>{sender_name}</strong>.</p>

            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr style="background: #f8f9fa;">
                    <td style="padding: 8px; border: 1px solid #dee2e6;"><strong>Numero</strong></td>
                    <td style="padding: 8px; border: 1px solid #dee2e6;">{ticket.ticket_number}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #dee2e6;"><strong>Equipement</strong></td>
                    <td style="padding: 8px; border: 1px solid #dee2e6;">{equipment_info}</td>
                </tr>
                <tr style="background: #f8f9fa;">
                    <td style="padding: 8px; border: 1px solid #dee2e6;"><strong>Employe</strong></td>
                    <td style="padding: 8px; border: 1px solid #dee2e6;">{employee_name}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #dee2e6;"><strong>Destination</strong></td>
                    <td style="padding: 8px; border: 1px solid #dee2e6;">{stage_label}</td>
                </tr>
                <tr style="background: #f8f9fa;">
                    <td style="padding: 8px; border: 1px solid #dee2e6;"><strong>Probleme</strong></td>
                    <td style="padding: 8px; border: 1px solid #dee2e6;">{ticket.initial_problem_description}</td>
                </tr>
            </table>

            {"<p><strong>Commentaire :</strong> " + comment + "</p>" if comment else ""}

            <p style="margin-top: 20px;">
                <a href="{site_url}/equipment/tickets/{ticket.id}"
                   style="background: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
                    Voir le ticket
                </a>
            </p>
        </body>
        </html>
        """

        valid_cc = [e for e in (cc_emails or []) if e and e != recipient_email]

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = from_addr
        msg["To"] = recipient_email
        if valid_cc:
            msg["Cc"] = ", ".join(valid_cc)
        msg.attach(MIMEText(html_body, "html"))

        server, _ = _build_smtp_connection_from_db()
        if not server:
            return False

        all_recipients = [recipient_email] + valid_cc
        server.sendmail(from_addr, all_recipients, msg.as_string())
        server.quit()

        logger.info(f"Ticket notification sent for {ticket.ticket_number} to {recipient_email}" +
                    (f" (CC: {', '.join(valid_cc)})" if valid_cc else ""))
        return True

    except Exception as e:
        logger.error(f"Failed to send ticket notification: {e}")
        return False


def send_delay_alert(ticket, recipients, stage, days):
    """
    Send delay alert email for tickets stuck at a stage.

    Args:
        ticket: RepairTicket instance
        recipients: list of email addresses
        stage: current stage name
        days: number of days in stage
    Returns:
        bool: True if email sent successfully
    """
    host, _, _, _, from_addr, _, _ = get_smtp_config_from_db()

    if not host or not recipients:
        return False

    try:
        from backend.src.equipment_manager.models.tickets import RepairTicket
        stage_label = RepairTicket.STAGE_LABELS.get(stage, stage)

        subject = f"[ALERTE] Ticket {ticket.ticket_number} - {days} jours a l'etape {stage_label}"

        color = "#e74c3c" if days > 14 else "#f39c12"

        employee_name = ticket.employee.get_full_name() if ticket.employee else ""
        equipment_info = (
            f"{ticket.equipment.brand} {ticket.equipment.model_name} ({ticket.equipment.imei})"
            if ticket.equipment else ""
        )

        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: {color}; color: white; padding: 15px; border-radius: 4px 4px 0 0;">
                <h2 style="margin: 0;">Alerte de delai - {ticket.ticket_number}</h2>
            </div>

            <div style="padding: 20px; border: 1px solid #dee2e6; border-top: none;">
                <p>Le ticket <strong>{ticket.ticket_number}</strong> est a l'etape
                <strong>{stage_label}</strong> depuis <strong>{days} jours</strong>.</p>

                <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                    <tr style="background: #f8f9fa;">
                        <td style="padding: 8px; border: 1px solid #dee2e6;"><strong>Equipement</strong></td>
                        <td style="padding: 8px; border: 1px solid #dee2e6;">{equipment_info}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #dee2e6;"><strong>Employe</strong></td>
                        <td style="padding: 8px; border: 1px solid #dee2e6;">{employee_name}</td>
                    </tr>
                    <tr style="background: #f8f9fa;">
                        <td style="padding: 8px; border: 1px solid #dee2e6;"><strong>Jours dans l'etape</strong></td>
                        <td style="padding: 8px; border: 1px solid #dee2e6; color: {color}; font-weight: bold;">{days} jours</td>
                    </tr>
                </table>

                <p>Merci de prendre les mesures necessaires pour faire avancer ce ticket.</p>
            </div>
        </body>
        </html>
        """

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = from_addr
        msg["To"] = ", ".join(recipients)
        msg.attach(MIMEText(html_body, "html"))

        server, _ = _build_smtp_connection_from_db()
        if not server:
            return False

        server.sendmail(from_addr, recipients, msg.as_string())
        server.quit()

        logger.info(f"Delay alert sent for {ticket.ticket_number} ({days} days at {stage})")
        return True

    except Exception as e:
        logger.error(f"Failed to send delay alert: {e}")
        return False


def _build_smtp_connection_from_db():
    """Create an SMTP connection using DB config (with .env fallback). Returns (server, error)."""
    host, port, user, password, _, use_tls, _ = get_smtp_config_from_db()
    if not host or not user:
        logger.warning("SMTP not configured")
        return None, "SMTP non configuré"
    try:
        server = smtplib.SMTP(host, port)
        if use_tls:
            server.starttls()
        server.login(user, password)
        return server, None
    except Exception as e:
        logger.error(f"SMTP connection failed: {e}")
        return None, str(e)


def send_delay_alert_v2(ticket, to_emails, bcc_emails, stage, days, level):
    """
    Send a delay alert email (WARNING or ESCALATION) with optional BCC.

    Args:
        ticket: RepairTicket instance
        to_emails: list of TO email addresses
        bcc_emails: list of BCC email addresses (hidden from TO recipients)
        stage: current stage code
        days: number of days in stage
        level: 'WARNING' | 'ESCALATION'
    Returns:
        bool: True if sent successfully
    """
    _, _, _, _, from_addr, _, site_url = get_smtp_config_from_db()

    all_recipients = list(set(to_emails + bcc_emails))
    if not all_recipients:
        return False

    try:
        from backend.src.equipment_manager.models.tickets import RepairTicket
        stage_label = RepairTicket.STAGE_LABELS.get(stage, stage)

        is_escalation = level == "ESCALATION"
        color = "#c0392b" if is_escalation else "#e67e22"
        level_label = "ESCALADE" if is_escalation else "RAPPEL"
        level_text = (
            "Ce ticket dépasse les délais critiques et nécessite une attention immédiate des responsables."
            if is_escalation
            else "Merci de prendre les mesures nécessaires pour faire avancer ce ticket."
        )

        employee_name = ticket.employee.get_full_name() if ticket.employee else ""
        equipment_info = (
            f"{ticket.equipment.brand} {ticket.equipment.model_name} ({ticket.equipment.imei})"
            if ticket.equipment else ""
        )

        subject = (
            f"[{'ESCALADE' if is_escalation else 'ALERTE'}] "
            f"Ticket {ticket.ticket_number} — {days} jours à {stage_label}"
        )

        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: {color}; color: white; padding: 15px; border-radius: 4px 4px 0 0;">
                <h2 style="margin: 0;">{level_label} — {ticket.ticket_number}</h2>
                <p style="margin: 4px 0 0;">{days} jours à l'étape <strong>{stage_label}</strong></p>
            </div>

            <div style="padding: 20px; border: 1px solid #dee2e6; border-top: none;">
                <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                    <tr style="background: #f8f9fa;">
                        <td style="padding: 8px; border: 1px solid #dee2e6;"><strong>Équipement</strong></td>
                        <td style="padding: 8px; border: 1px solid #dee2e6;">{equipment_info}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #dee2e6;"><strong>Employé</strong></td>
                        <td style="padding: 8px; border: 1px solid #dee2e6;">{employee_name}</td>
                    </tr>
                    <tr style="background: #f8f9fa;">
                        <td style="padding: 8px; border: 1px solid #dee2e6;"><strong>Étape actuelle</strong></td>
                        <td style="padding: 8px; border: 1px solid #dee2e6;">{stage_label}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #dee2e6;"><strong>Jours en attente</strong></td>
                        <td style="padding: 8px; border: 1px solid #dee2e6; color: {color}; font-weight: bold;">{days} jours</td>
                    </tr>
                </table>

                <p>{level_text}</p>

                <p style="margin-top: 20px;">
                    <a href="{site_url}/equipment/tickets/{ticket.id}"
                       style="background: {color}; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
                        Voir le ticket
                    </a>
                </p>
            </div>
        </body>
        </html>
        """

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = from_addr
        msg["To"] = ", ".join(to_emails) if to_emails else ""
        if bcc_emails:
            msg["Bcc"] = ", ".join(bcc_emails)
        msg.attach(MIMEText(html_body, "html"))

        server, err = _build_smtp_connection_from_db()
        if not server:
            logger.warning(f"SMTP unavailable for delay alert: {err}")
            return False

        server.sendmail(from_addr, all_recipients, msg.as_string())
        server.quit()

        logger.info(
            f"Delay alert v2 [{level}] sent for {ticket.ticket_number} "
            f"({days}j at {stage}) → TO={to_emails}, BCC={bcc_emails}"
        )
        return True

    except Exception as e:
        logger.error(f"Failed to send delay alert v2: {e}")
        return False
