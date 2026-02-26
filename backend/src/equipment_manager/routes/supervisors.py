from flask import Blueprint, request, jsonify, g
from sqlalchemy.exc import IntegrityError

from backend.src.databases.extensions import db, error_response
from backend.src.security.access_security import require_auth
from backend.src.equipment_manager.models.employees import Employee, Position
from backend.src.models.auth import User
from backend.src.logger import get_backend_logger

logger = get_backend_logger(__name__)

bp = Blueprint("em_supervisors", __name__, url_prefix="/api/equipment/supervisors")

SUPERVISOR_POSITION_CODE = "SUPERVISEUR"


def _supervisor_query():
    """Base query returning only employees with position code 'SUPERVISEUR'."""
    return Employee.query.join(Position, Employee.position_id == Position.id).filter(
        Position.code == SUPERVISOR_POSITION_CODE
    )


@bp.get("")
@require_auth
def list_supervisors():
    supervisors = _supervisor_query().order_by(Employee.last_name, Employee.first_name).all()
    return jsonify([s.to_dict_safe() for s in supervisors]), 200


@bp.post("")
@require_auth
def create_supervisor():
    data = request.get_json(silent=True) or {}

    first_name = data.get("first_name", "").strip()
    last_name = data.get("last_name", "").strip()
    email = data.get("email", "").strip()
    phone = data.get("phone", "").strip()
    code = data.get("code", "").strip()

    if not first_name or not last_name:
        return error_response("first_name and last_name are required", 400)

    # Resolve supervisor position
    position = Position.query.filter_by(code=SUPERVISOR_POSITION_CODE).first()
    if not position:
        return error_response(f"Position '{SUPERVISOR_POSITION_CODE}' not found in database", 500)

    if not code:
        # Auto-generate code from name
        base = f"SUP-{last_name[:3].upper()}{first_name[0].upper()}"
        code = base
        counter = 1
        while Employee.query.filter_by(employee_id_code=code).first():
            code = f"{base}{counter}"
            counter += 1

    # Generate username: [lastname][first_letter][last_letter]
    first_clean = first_name.strip()
    last_clean = last_name.strip()
    first_letter = first_clean[0].lower() if first_clean else ""
    last_letter = first_clean[-1].lower() if first_clean else ""
    username = f"{last_clean.lower()}{first_letter}{last_letter}"

    original_username = username
    counter = 1
    while User.query.filter_by(username=username).first():
        username = f"{original_username}{counter}"
        counter += 1

    # Generate password: [username reversed]@2026
    password = f"{username[::-1]}@2026"

    try:
        # Get the current user's tenant_id
        current_user = User.query.get(int(g.current_user["id"]))
        tenant_id = current_user.tenant_id if current_user else 1

        # Create user account
        user = User(
            username=username,
            fullname=f"{first_name} {last_name}",
            email=email or None,
            phone=phone,
            tenant_id=tenant_id,
            is_active=True,
        )
        user.set_password(password)
        db.session.add(user)
        db.session.flush()

        # Create Employee record linked to user
        employee = Employee(
            user_id=user.id,
            employee_id_code=code,
            first_name=first_name,
            last_name=last_name,
            email=email,
            phone=phone,
            position_id=position.id,
            is_active=True,
        )
        db.session.add(employee)
        db.session.commit()

        result = employee.to_dict_safe()
        result["username"] = username
        result["password"] = password
        return jsonify(result), 201

    except IntegrityError:
        db.session.rollback()
        return error_response("Supervisor creation failed (duplicate data)", 409)
    except Exception as e:
        db.session.rollback()
        logger.error(f"Supervisor creation error: {e}")
        return error_response(f"Supervisor creation failed: {str(e)}", 500)


@bp.get("/<int:id>")
@require_auth
def get_supervisor(id):
    employee = Employee.query.get(id)
    if not employee:
        return error_response("Supervisor not found", 404)
    return jsonify(employee.to_dict_safe()), 200


@bp.put("/<int:id>")
@require_auth
def update_supervisor(id):
    employee = Employee.query.get(id)
    if not employee:
        return error_response("Supervisor not found", 404)

    data = request.get_json(silent=True) or {}

    for field in ("first_name", "last_name", "email", "phone"):
        if field in data:
            setattr(employee, field, data[field].strip() if isinstance(data[field], str) else data[field])

    # Update associated user account
    if employee.user_id:
        user = User.query.get(employee.user_id)
        if user:
            if "first_name" in data or "last_name" in data:
                user.fullname = f"{employee.first_name} {employee.last_name}"
            if "email" in data:
                user.email = data["email"].strip() or None
            if "phone" in data:
                user.phone = data["phone"].strip()

    try:
        db.session.commit()
        return jsonify(employee.to_dict_safe()), 200
    except IntegrityError:
        db.session.rollback()
        return error_response("Update failed (duplicate data)", 409)
