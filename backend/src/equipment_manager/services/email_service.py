"""
Email notification service for equipment manager tickets.
Uses SMTP via environment variables.
"""
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from backend.src.logger import get_backend_logger

logger = get_backend_logger(__name__)

# SMTP config from env
SMTP_HOST = os.environ.get("SMTP_HOST", "")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASS = os.environ.get("SMTP_PASS", "")
SMTP_FROM = os.environ.get("SMTP_FROM", SMTP_USER)
SITE_URL = os.environ.get("SITE_URL", "http://localhost:5000")

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


def _build_smtp_connection():
    """Create an SMTP connection. Returns None if not configured."""
    if not SMTP_HOST or not SMTP_USER:
        logger.warning("SMTP not configured, skipping email send")
        return None
    try:
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        return server
    except Exception as e:
        logger.error(f"SMTP connection failed: {e}")
        return None


def send_ticket_notification(ticket, recipient_email, sender_name, to_role, comment=""):
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
    if not SMTP_HOST:
        logger.info("SMTP not configured, skipping ticket notification email")
        return False

    try:
        from backend.src.equipment_manager.models.tickets import RepairTicket
        stage_label = RepairTicket.STAGE_LABELS.get(to_role, to_role)

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
                    <td style="padding: 8px; border: 1px solid #dee2e6;">{ticket.equipment.brand} {ticket.equipment.model_name} ({ticket.equipment.imei})</td>
                </tr>
                <tr style="background: #f8f9fa;">
                    <td style="padding: 8px; border: 1px solid #dee2e6;"><strong>Employe</strong></td>
                    <td style="padding: 8px; border: 1px solid #dee2e6;">{ticket.employee.get_full_name() if ticket.employee else ""}</td>
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
                <a href="{SITE_URL}/equipment/tickets/{ticket.id}"
                   style="background: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
                    Voir le ticket
                </a>
            </p>
        </body>
        </html>
        """

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = SMTP_FROM
        msg["To"] = recipient_email or ""
        msg.attach(MIMEText(html_body, "html"))

        if not recipient_email:
            logger.warning(f"No recipient email for ticket {ticket.ticket_number}")
            return False

        server = _build_smtp_connection()
        if not server:
            return False

        server.sendmail(SMTP_FROM, [recipient_email], msg.as_string())
        server.quit()

        logger.info(f"Ticket notification sent for {ticket.ticket_number} to {recipient_email}")
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
    if not SMTP_HOST or not recipients:
        return False

    try:
        from backend.src.equipment_manager.models.tickets import RepairTicket
        stage_label = RepairTicket.STAGE_LABELS.get(stage, stage)

        subject = f"[ALERTE] Ticket {ticket.ticket_number} - {days} jours a l'etape {stage_label}"

        color = "#e74c3c" if days > 14 else "#f39c12"

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
                        <td style="padding: 8px; border: 1px solid #dee2e6;">{ticket.equipment.brand} {ticket.equipment.model_name} ({ticket.equipment.imei})</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #dee2e6;"><strong>Employe</strong></td>
                        <td style="padding: 8px; border: 1px solid #dee2e6;">{ticket.employee.get_full_name() if ticket.employee else ""}</td>
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
        msg["From"] = SMTP_FROM
        msg["To"] = ", ".join(recipients)
        msg.attach(MIMEText(html_body, "html"))

        server = _build_smtp_connection()
        if not server:
            return False

        server.sendmail(SMTP_FROM, recipients, msg.as_string())
        server.quit()

        logger.info(f"Delay alert sent for {ticket.ticket_number} ({days} days at {stage})")
        return True

    except Exception as e:
        logger.error(f"Failed to send delay alert: {e}")
        return False
