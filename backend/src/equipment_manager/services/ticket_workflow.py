"""
Ticket workflow service - business logic for repair ticket transitions.
"""
import secrets
from datetime import datetime, timezone

from backend.src.logger import get_backend_logger

logger = get_backend_logger(__name__)

# Workflow transitions: current_stage -> list of valid next stages
WORKFLOW_TRANSITIONS = {
    "SUPERVISOR": ["PROGRAM"],
    "PROGRAM": ["LOGISTICS"],
    "LOGISTICS": ["REPAIRER", "ESANTE"],
    "REPAIRER": ["RETURNING_LOGISTICS"],
    "ESANTE": ["RETURNING_LOGISTICS"],
    "RETURNING_LOGISTICS": ["RETURNING_PROGRAM"],
    "RETURNING_PROGRAM": ["RETURNING_SUPERVISOR"],
    "RETURNING_SUPERVISOR": ["RETURNED_ASC"],
}

# Stage -> required user role mapping
STAGE_TO_ROLE = {
    "SUPERVISOR": "SUPERVISOR",
    "PROGRAM": "PROGRAM",
    "LOGISTICS": "LOGISTICS",
    "REPAIRER": "REPAIRER",
    "ESANTE": "ESANTE",
    "RETURNING_LOGISTICS": "LOGISTICS",
    "RETURNING_PROGRAM": "PROGRAM",
    "RETURNING_SUPERVISOR": "SUPERVISOR",
}


def generate_ticket_number():
    """Generate a unique ticket number: TKT-YYYYMMDD-XXXXXX"""
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d")
    random_str = secrets.token_hex(3).upper()  # 6 hex chars
    return f"TKT-{timestamp}-{random_str}"


def get_next_stages(current_stage):
    """Return list of valid next stages from current stage."""
    return WORKFLOW_TRANSITIONS.get(current_stage, [])


def validate_transition(current_stage, target_stage):
    """Check if transition from current_stage to target_stage is valid."""
    valid = get_next_stages(current_stage)
    return target_stage in valid


def get_role_for_stage(stage):
    """Return the user role required for a given stage."""
    return STAGE_TO_ROLE.get(stage)


def calculate_delay(ticket):
    """Calculate days since initial_send_date."""
    return ticket.get_delay_days()


def get_delay_color(days):
    """Return color based on delay days: green <= 7, yellow <= 14, red > 14."""
    if days <= 7:
        return "green"
    elif days <= 14:
        return "yellow"
    return "red"


def is_ticket_blocked(ticket):
    """Check if ticket is received but not sent (stuck)."""
    return ticket.is_blocked()
