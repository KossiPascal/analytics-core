from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, g
from backend.src.databases.extensions import db
from backend.src.security.access_security import require_auth
from backend.src.equipment_manager.models.tickets import (
    RepairTicket, Issue, TicketEvent, TicketComment, ProblemType,
    DelayAlertRecipient, DelayAlertLog,
)
from backend.src.equipment_manager.models.equipment import Equipment
from backend.src.equipment_manager.models.employees import Employee, Position
from backend.src.equipment_manager.routes.employees import get_allowed_employee_ids
from backend.src.equipment_manager.services.ticket_workflow import generate_ticket_number, validate_transition, get_next_stages
from backend.src.equipment_manager.services.email_service import send_ticket_notification
from backend.src.logger import get_backend_logger

from werkzeug.exceptions import BadRequest
from sqlalchemy.exc import IntegrityError

logger = get_backend_logger(__name__)

bp = Blueprint("em_tickets", __name__, url_prefix="/api/equipment/tickets")


@bp.get("")
@require_auth
def list_tickets():
    query = RepairTicket.query

    status = request.args.get("status")
    stage = request.args.get("stage")
    search = request.args.get("search", "").strip()

    if status:
        query = query.filter_by(status=status)
    if stage:
        query = query.filter_by(current_stage=stage)
    if search:
        query = query.filter(RepairTicket.ticket_number.ilike(f"%{search}%"))

    # Restriction hiérarchique : si l'appelant a un poste, il ne voit que les tickets de ses subordonnés
    caller_position_id = g.current_user.get("position_id")
    if caller_position_id:
        allowed_ids = get_allowed_employee_ids(int(caller_position_id))
        query = query.filter(RepairTicket.employee_id.in_(allowed_ids))

    tickets = query.order_by(RepairTicket.created_at.desc()).all()
    return jsonify([t.to_dict_safe() for t in tickets]), 200


@bp.post("")
@require_auth
def create_ticket():
    data = request.get_json(silent=True) or {}

    equipment_id = data.get("equipment_id")
    employee_id = data.get("employee_id") or data.get("asc_id")
    problem_description = data.get("problem_description", "").strip()
    problem_type_ids = data.get("problem_type_ids", [])
    initial_send_date_str = data.get("initial_send_date", "").strip()

    if not equipment_id or not problem_description:
        raise BadRequest("equipment_id and problem_description are required", 400)

    equipment = Equipment.query.get(int(equipment_id))
    if not equipment:
        raise BadRequest("Equipment not found", 404)

    if not equipment.is_active:
        raise BadRequest(
            f"Impossible de créer un ticket : l'équipement est inactif ({equipment.status}).",
            409
        )

    # Use provided employee or equipment's owner
    employee = None
    if employee_id:
        employee = Employee.query.get(int(employee_id))
    elif equipment.owner_id:
        employee = equipment.owner

    if not employee:
        raise BadRequest("employee_id is required (or assign equipment to an employee first)", 400)

    user_id = int(g.current_user["id"]) if g.current_user else None

    from datetime import date as _date
    initial_send_date = datetime.now(timezone.utc)
    if initial_send_date_str:
        try:
            parsed = _date.fromisoformat(initial_send_date_str)
            initial_send_date = datetime(parsed.year, parsed.month, parsed.day, tzinfo=timezone.utc)
        except ValueError:
            pass

    try:
        ticket = RepairTicket(
            ticket_number=generate_ticket_number(),
            equipment_id=equipment.id,
            employee_id=employee.id,
            created_by_id=user_id,
            initial_problem_description=problem_description,
            initial_send_date=initial_send_date,
            current_stage="SUPERVISOR",
            current_holder_id=user_id,
        )
        db.session.add(ticket)
        db.session.flush()

        # Create issues
        for pt_id in problem_type_ids:
            pt = ProblemType.query.get(int(pt_id))
            if pt:
                issue = Issue(
                    ticket_id=ticket.id,
                    problem_type_id=pt.id,
                    description=data.get("issue_description", ""),
                )
                db.session.add(issue)

        # Create CREATED event
        event = TicketEvent(
            ticket_id=ticket.id,
            event_type="CREATED",
            user_id=user_id,
            from_role="SUPERVISOR",
            to_role="SUPERVISOR",
            comment="Ticket cree",
        )
        db.session.add(event)

        # Mark equipment as under repair
        equipment.status = "UNDER_REPAIR"

        db.session.commit()
        return jsonify(ticket.to_dict_safe()), 201

    except IntegrityError:
        db.session.rollback()
        raise BadRequest("Failed to create ticket", 409)


@bp.get("/<int:id>")
@require_auth
def get_ticket(id):
    ticket = RepairTicket.query.get(id)
    if not ticket:
        raise BadRequest("Ticket not found", 404)

    result = ticket.to_dict_safe()
    result["events"] = [e.to_dict_safe() for e in sorted(ticket.events, key=lambda e: e.timestamp)]
    result["comments"] = [c.to_dict_safe() for c in sorted(ticket.comments, key=lambda c: c.created_at)]
    result["issues"] = [i.to_dict_safe() for i in ticket.issues]
    return jsonify(result), 200


@bp.get("/<int:id>/candidates")
@require_auth
def ticket_candidates(id):
    """Return next stages + all active employees for this ticket's send form."""
    ticket = RepairTicket.query.get(id)
    if not ticket:
        raise BadRequest("Ticket not found", 404)

    next_stages = get_next_stages(ticket.current_stage)
    is_final = next_stages == ["RETURNED_ASC"]

    employees = []
    if not is_final:
        employees = (
            Employee.query
            .filter(Employee.is_active == True)
            .order_by(Employee.last_name, Employee.first_name)
            .all()
        )

    return jsonify({
        "is_final": is_final,
        "next_stages": next_stages,
        "employees": [e.to_dict_safe() for e in employees],
    }), 200


@bp.post("/<int:id>/receive")
@require_auth
def receive_ticket(id):
    ticket = RepairTicket.query.get(id)
    if not ticket:
        raise BadRequest("Ticket not found", 404)

    data = request.get_json(silent=True) or {}
    user_id = int(g.current_user["id"]) if g.current_user else None
    user_roles = set(g.current_user.get("roles", []))
    is_admin = bool(user_roles & {"admin", "superadmin"})

    # Find the last SENT event to identify who sent the ticket
    last_sent = (
        TicketEvent.query
        .filter_by(ticket_id=ticket.id, event_type="SENT")
        .order_by(TicketEvent.timestamp.desc())
        .first()
    )

    # Block the sender from confirming their own dispatch (only admin can bypass)
    if last_sent and last_sent.user_id == user_id and not is_admin:
        raise BadRequest(
            "Vous ne pouvez pas confirmer la réception d'un ticket que vous venez d'envoyer.", 403
        )

    event = TicketEvent(
        ticket_id=ticket.id,
        event_type="RECEIVED",
        user_id=user_id,
        from_role=ticket.current_stage,
        to_role=ticket.current_stage,
        comment=data.get("comment", "Reception confirmee"),
    )
    db.session.add(event)

    ticket.current_holder_id = user_id
    ticket.status = "IN_PROGRESS"

    db.session.commit()
    return jsonify(ticket.to_dict_safe()), 200


@bp.post("/<int:id>/send")
@require_auth
def send_ticket(id):
    ticket = RepairTicket.query.get(id)
    if not ticket:
        raise BadRequest("Ticket not found", 404)

    data = request.get_json(silent=True) or {}
    to_role = data.get("to_role", "").strip()
    comment = data.get("comment", "")
    recipient_employee_id = data.get("recipient_employee_id")

    # Resolve recipient email: prefer explicitly chosen recipient, fallback to ticket owner
    recipient_email = ""
    if recipient_employee_id:
        dest_emp = Employee.query.get(int(recipient_employee_id))
        recipient_email = (dest_emp.email or "").strip() if dest_emp else ""
    elif ticket.employee:
        recipient_email = (ticket.employee.email or "").strip()

    if not to_role:
        raise BadRequest("to_role is required", 400)

    # Validate transition
    if not validate_transition(ticket.current_stage, to_role):
        valid = get_next_stages(ticket.current_stage)
        raise BadRequest(f"Invalid transition. Valid next stages: {valid}", 400)

    user_id = int(g.current_user["id"]) if g.current_user else None
    sender_name = g.current_user.get("fullname", g.current_user.get("username", ""))

    # Create SENT event
    event = TicketEvent(
        ticket_id=ticket.id,
        event_type="SENT",
        user_id=user_id,
        from_role=ticket.current_stage,
        to_role=to_role,
        comment=comment,
        recipient_employee_id=int(recipient_employee_id) if recipient_employee_id else None,
    )
    db.session.add(event)

    ticket.current_stage = to_role
    ticket.current_holder_id = None  # Will be set on receive

    # Update status based on direction
    if to_role.startswith("RETURNING"):
        ticket.status = "RETURNING"

    # Close ticket if returned to ASC
    if to_role == "RETURNED_ASC":
        ticket.status = "CLOSED"
        ticket.closed_date = datetime.now(timezone.utc)
        ticket.equipment.status = "FUNCTIONAL"

    db.session.commit()

    # Send email notification (non-blocking)
    try:
        send_ticket_notification(ticket, recipient_email, sender_name, to_role, comment)
    except Exception as e:
        logger.error(f"Email notification failed: {e}")

    return jsonify(ticket.to_dict_safe()), 200


LOGISTICS_DEPT_CODES = {"LOG", "ETH", "TIC"}


@bp.post("/<int:id>/receive-from-repairer")
@require_auth
def receive_from_repairer(id):
    """
    Action réservée Logistique/E-Santé/TIC : réceptionner l'équipement venant du réparateur
    et déclarer son état (REPAIRED → retour lancé | COMPLETELY_DAMAGED → clôture).
    """
    ticket = RepairTicket.query.get(id)
    if not ticket:
        raise BadRequest("Ticket not found", 404)

    if ticket.current_stage != "RETURNING_LOGISTICS":
        raise BadRequest(
            "Cette action n'est disponible qu'à l'étape Retour - Logistique.", 400
        )

    if ticket.current_holder_id is not None:
        raise BadRequest("Le ticket a déjà été réceptionné à cette étape.", 400)

    # Vérification du département (LOG / ETH / TIC) ou admin
    user_id = int(g.current_user["id"]) if g.current_user else None
    user_roles = set(g.current_user.get("roles", []))
    is_admin = bool(user_roles & {"admin", "superadmin"})

    if not is_admin:
        position_id = g.current_user.get("position_id")
        authorized = False
        if position_id:
            from backend.src.equipment_manager.models.employees import Position
            pos = Position.query.get(int(position_id))
            if pos and pos.department and pos.department.code in LOGISTICS_DEPT_CODES:
                authorized = True
        if not authorized:
            raise BadRequest(
                "Accès réservé aux départements Logistique (LOG), E-Santé (ETH) ou TIC.", 403
            )

    data = request.get_json(silent=True) or {}
    equipment_state = data.get("equipment_state", "").strip()
    comment = data.get("comment", "").strip()

    if equipment_state not in ("REPAIRED", "COMPLETELY_DAMAGED"):
        raise BadRequest(
            "equipment_state doit être REPAIRED (réparé) ou COMPLETELY_DAMAGED (non récupérable).", 400
        )

    if equipment_state == "REPAIRED":
        # Confirmer réception, équipement fonctionnel → processus de retour continue
        ticket.current_holder_id = user_id
        ticket.equipment.status = "FUNCTIONAL"

        event = TicketEvent(
            ticket_id=ticket.id,
            event_type="RECEIVED",
            user_id=user_id,
            from_role=ticket.current_stage,
            to_role=ticket.current_stage,
            comment=comment or "Équipement réceptionné depuis le réparateur — état fonctionnel. Retour en cours.",
        )
        db.session.add(event)
    else:
        # Équipement non récupérable → clôture du ticket
        ticket.status = "CLOSED"
        ticket.closed_date = datetime.now(timezone.utc)
        ticket.current_holder_id = user_id
        ticket.equipment.status = "COMPLETELY_DAMAGED"

        event = TicketEvent(
            ticket_id=ticket.id,
            event_type="CLOSED",
            user_id=user_id,
            from_role=ticket.current_stage,
            to_role=ticket.current_stage,
            comment=comment or "Équipement non récupérable — complètement endommagé. Ticket clôturé.",
        )
        db.session.add(event)

    db.session.commit()
    return jsonify(ticket.to_dict_safe()), 200


@bp.post("/<int:id>/mark-repaired")
@require_auth
def mark_repaired(id):
    ticket = RepairTicket.query.get(id)
    if not ticket:
        raise BadRequest("Ticket not found", 404)

    data = request.get_json(silent=True) or {}
    user_id = int(g.current_user["id"]) if g.current_user else None

    ticket.status = "REPAIRED"
    ticket.repair_completed_date = datetime.now(timezone.utc)
    ticket.resolution_notes = data.get("resolution_notes", "")

    event = TicketEvent(
        ticket_id=ticket.id,
        event_type="REPAIRED",
        user_id=user_id,
        from_role=ticket.current_stage,
        to_role=ticket.current_stage,
        comment=f"Reparation terminee. {ticket.resolution_notes}",
    )
    db.session.add(event)
    db.session.commit()

    return jsonify(ticket.to_dict_safe()), 200


@bp.post("/<int:id>/cancel")
@require_auth
def cancel_ticket(id):
    ticket = RepairTicket.query.get(id)
    if not ticket:
        raise BadRequest("Ticket not found", 404)

    if ticket.status in ("CLOSED", "CANCELLED"):
        raise BadRequest(f"Ticket is already {ticket.status}", 400)

    data = request.get_json(silent=True) or {}
    cancellation_reason = data.get("cancellation_reason", "").strip()

    if not cancellation_reason:
        raise BadRequest("cancellation_reason is required", 400)

    user_id = int(g.current_user["id"]) if g.current_user else None

    ticket.status = "CANCELLED"
    ticket.cancelled_date = datetime.now(timezone.utc)
    ticket.cancellation_reason = cancellation_reason

    event = TicketEvent(
        ticket_id=ticket.id,
        event_type="CANCELLED",
        user_id=user_id,
        from_role=ticket.current_stage,
        to_role=ticket.current_stage,
        comment=f"Ticket annule. Raison: {cancellation_reason}",
    )
    db.session.add(event)

    # Set equipment back to FAULTY
    ticket.equipment.status = "FAULTY"

    db.session.commit()
    return jsonify(ticket.to_dict_safe()), 200


@bp.post("/<int:id>/comment")
@require_auth
def add_comment(id):
    ticket = RepairTicket.query.get(id)
    if not ticket:
        raise BadRequest("Ticket not found", 404)

    data = request.get_json(silent=True) or {}
    comment_text = data.get("comment", "").strip()

    if not comment_text:
        raise BadRequest("comment is required", 400)

    user_id = int(g.current_user["id"]) if g.current_user else None

    comment = TicketComment(
        ticket_id=ticket.id,
        user_id=user_id,
        comment=comment_text,
    )
    db.session.add(comment)
    db.session.commit()

    return jsonify(comment.to_dict_safe()), 201


@bp.get("/overdue")
@require_auth
def overdue_tickets():
    tickets = RepairTicket.query.filter(RepairTicket.status.notin_(["CLOSED", "CANCELLED"])).all()
    overdue = [t.to_dict_safe() for t in tickets if t.get_delay_days() > 14]
    return jsonify(overdue), 200


@bp.get("/warning")
@require_auth
def warning_tickets():
    tickets = RepairTicket.query.filter(RepairTicket.status.notin_(["CLOSED", "CANCELLED"])).all()
    warning = [t.to_dict_safe() for t in tickets if 7 < t.get_delay_days() <= 14]
    return jsonify(warning), 200


# ─── PROBLEM TYPES ───────────────────────────────────────────────────────────

@bp.get("/problem-types")
@require_auth
def list_problem_types():
    types = ProblemType.query.filter_by(is_active=True).order_by(
        ProblemType.category, ProblemType.display_order, ProblemType.name
    ).all()
    return jsonify([t.to_dict_safe() for t in types]), 200


@bp.post("/problem-types")
@require_auth
def create_problem_type():
    data = request.get_json(silent=True) or {}
    name = data.get("name", "").strip()
    code = data.get("code", "").strip()
    category = data.get("category", "").strip()

    if not name or not code or not category:
        raise BadRequest("name, code and category are required", 400)

    if category not in ("HARDWARE", "SOFTWARE", "OTHER"):
        raise BadRequest("category must be HARDWARE, SOFTWARE or OTHER", 400)

    try:
        pt = ProblemType(
            name=name,
            code=code,
            category=category,
            display_order=data.get("display_order", 0),
            is_active=data.get("is_active", True),
        )
        db.session.add(pt)
        db.session.commit()
        return jsonify(pt.to_dict_safe()), 201
    except IntegrityError:
        db.session.rollback()
        raise BadRequest("Problem type with this code already exists", 409)


# ─── ALERT RECIPIENTS ────────────────────────────────────────────────────────

@bp.get("/alert-recipients")
@require_auth
def list_alert_recipients():
    recipients = DelayAlertRecipient.query.all()
    return jsonify([r.to_dict_safe() for r in recipients]), 200


@bp.post("/alert-recipients")
@require_auth
def create_alert_recipient():
    data = request.get_json(silent=True) or {}
    user_id = data.get("user_id")
    email = data.get("email", "").strip()

    if not user_id or not email:
        raise BadRequest("user_id and email are required", 400)

    try:
        recipient = DelayAlertRecipient(
            user_id=int(user_id),
            email=email,
            recipient_type=data.get("recipient_type", "PRIMARY"),
            is_active=True,
        )
        db.session.add(recipient)
        db.session.commit()
        return jsonify(recipient.to_dict_safe()), 201
    except IntegrityError:
        db.session.rollback()
        raise BadRequest("This user is already an alert recipient", 409)


@bp.patch("/alert-recipients/<int:id>")
@require_auth
def toggle_alert_recipient(id):
    recipient = DelayAlertRecipient.query.get(id)
    if not recipient:
        raise BadRequest("Recipient not found", 404)

    recipient.is_active = not recipient.is_active
    db.session.commit()
    return jsonify(recipient.to_dict_safe()), 200


# ─── ALERT RECIPIENT CONFIGS (new per-stage/level system) ────────────────────

@bp.get("/alert-recipient-configs")
@require_auth
def list_alert_recipient_configs():
    from backend.src.equipment_manager.models.email_config import AlertRecipientConfig
    query = AlertRecipientConfig.query

    level = request.args.get("level")
    stage = request.args.get("stage")
    if level:
        query = query.filter(AlertRecipientConfig.alert_level == level)
    if stage:
        query = query.filter(AlertRecipientConfig.stage == stage)

    configs = query.order_by(AlertRecipientConfig.alert_level, AlertRecipientConfig.created_at).all()
    return jsonify([c.to_dict_safe() for c in configs]), 200


@bp.post("/alert-recipient-configs")
@require_auth
def create_alert_recipient_config():
    from backend.src.equipment_manager.models.email_config import AlertRecipientConfig
    data = request.get_json(silent=True) or {}

    alert_level = data.get("alert_level", "").strip()
    recipient_type = data.get("recipient_type", "").strip()

    if alert_level not in ("WARNING", "ESCALATION", "BCC"):
        raise BadRequest("alert_level must be WARNING, ESCALATION or BCC", 400)
    if recipient_type not in ("EMPLOYEE", "POSITION"):
        raise BadRequest("recipient_type must be EMPLOYEE or POSITION", 400)

    employee_id = data.get("employee_id")
    position_id = data.get("position_id")

    if recipient_type == "EMPLOYEE" and not employee_id:
        raise BadRequest("employee_id required for EMPLOYEE recipient_type", 400)
    if recipient_type == "POSITION" and not position_id:
        raise BadRequest("position_id required for POSITION recipient_type", 400)

    stage = data.get("stage") or None  # null = all stages

    cfg = AlertRecipientConfig(
        stage=stage,
        alert_level=alert_level,
        recipient_type=recipient_type,
        employee_id=int(employee_id) if employee_id else None,
        position_id=int(position_id) if position_id else None,
        is_active=True,
    )
    db.session.add(cfg)
    db.session.commit()
    return jsonify(cfg.to_dict_safe()), 201


@bp.delete("/alert-recipient-configs/<int:id>")
@require_auth
def delete_alert_recipient_config(id):
    from backend.src.equipment_manager.models.email_config import AlertRecipientConfig
    cfg = db.session.get(AlertRecipientConfig, id)
    if not cfg:
        raise BadRequest("Configuration introuvable", 404)
    db.session.delete(cfg)
    db.session.commit()
    return jsonify(success=True), 200


@bp.patch("/alert-recipient-configs/<int:id>")
@require_auth
def toggle_alert_recipient_config(id):
    from backend.src.equipment_manager.models.email_config import AlertRecipientConfig
    cfg = db.session.get(AlertRecipientConfig, id)
    if not cfg:
        raise BadRequest("Configuration introuvable", 404)
    cfg.is_active = not cfg.is_active
    db.session.commit()
    return jsonify(cfg.to_dict_safe()), 200
