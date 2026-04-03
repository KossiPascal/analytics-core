from flask import Blueprint, jsonify

from backend.src.app.middlewares.access_security import require_auth, currentUserId
from backend.src.modules.equipments.models.equipment import Equipment
from backend.src.app.models.f_employee import Employee, Position
from backend.src.modules.analytics.logger import get_backend_logger
from backend.src.modules.equipments.models.tickets import RepairTicket

logger = get_backend_logger(__name__)

bp = Blueprint("em_dashboard", __name__, url_prefix="/api/equipment/dashboard")


@bp.get("/stats")
@require_auth
def global_stats():
    total_tickets = RepairTicket.query.count()
    open_tickets = RepairTicket.query.filter_by(status="OPEN").count()
    in_progress = RepairTicket.query.filter_by(status="IN_PROGRESS").count()
    repaired = RepairTicket.query.filter_by(status="REPAIRED").count()
    closed = RepairTicket.query.filter_by(status="CLOSED").count()
    cancelled = RepairTicket.query.filter_by(status="CANCELLED").count()

    total_ascs = Employee.query.join(Position, Employee.position_id == Position.id).filter(
        Position.code == "ASC", Employee.is_active == True
    ).count()
    total_equipment = Equipment.query.count()

    # Average processing duration for closed tickets
    closed_tickets = RepairTicket.query.filter(
        RepairTicket.status == "CLOSED",
        RepairTicket.closed_date.isnot(None),
    ).all()

    avg_duration = None
    if closed_tickets:
        durations = [(t.closed_date - t.initial_send_date).days for t in closed_tickets]
        avg_duration = round(sum(durations) / len(durations), 1)

    return jsonify({
        "total_tickets": total_tickets,
        "open_tickets": open_tickets,
        "in_progress_tickets": in_progress,
        "repaired_tickets": repaired,
        "closed_tickets": closed,
        "cancelled_tickets": cancelled,
        "total_ascs": total_ascs,
        "total_equipment": total_equipment,
        "avg_duration_days": avg_duration,
    }), 200


@bp.get("/tickets-by-status")
@require_auth
def tickets_by_status():
    result = {}
    for status in RepairTicket.STATUS_CHOICES:
        result[status] = RepairTicket.query.filter_by(status=status).count()
    return jsonify(result), 200


@bp.get("/tickets-by-delay")
@require_auth
def tickets_by_delay():
    active_tickets = RepairTicket.query.filter(
        RepairTicket.status.notin_(["CLOSED", "CANCELLED"])
    ).all()

    green = 0
    yellow = 0
    red = 0

    for t in active_tickets:
        days = t.get_delay_days()
        if days <= 7:
            green += 1
        elif days <= 14:
            yellow += 1
        else:
            red += 1

    return jsonify({
        "green": green,
        "yellow": yellow,
        "red": red,
    }), 200


@bp.get("/blockage-points")
@require_auth
def blockage_points():
    active_tickets = RepairTicket.query.filter(
        RepairTicket.status.notin_(["CLOSED", "CANCELLED"])
    ).all()

    stage_counts = {}
    for ticket in active_tickets:
        if ticket.is_blocked():
            label = RepairTicket.STAGE_LABELS.get(ticket.current_stage, ticket.current_stage)
            stage_counts[label] = stage_counts.get(label, 0) + 1

    # Top 5
    top = sorted(stage_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    return jsonify([{"stage": s, "count": c} for s, c in top]), 200
