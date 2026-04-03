from datetime import datetime, timezone

from flask import Blueprint, request, jsonify
from backend.src.app.configs.extensions import db
from backend.src.app.middlewares.access_security import require_auth, currentUserId
from backend.src.app.models.f_employee import Employee, Position
from backend.src.modules.analytics.logger import get_backend_logger

from werkzeug.exceptions import BadRequest
from sqlalchemy.exc import IntegrityError

logger = get_backend_logger(__name__)

bp = Blueprint("em_ascs", __name__, url_prefix="/api/equipment/ascs")

ASC_POSITION_CODE = "ASC"


def _asc_query():
    """Base query returning only employees with position code 'ASC'."""
    return Employee.query.join(Position, Employee.position_id == Position.id).filter(
        Position.code == ASC_POSITION_CODE
    )

@bp.get("")
@require_auth
def list_ascs():
    query = _asc_query().filter(Employee.is_active == True)

    supervisor_id = request.args.get("supervisor_id")
    search = request.args.get("search", "").strip()

    # if supervisor_id:
    #     query = query.join(EmployeeProfile, Employee.id == EmployeeProfile.employee_id)
    #     query = query.filter(EmployeeProfile.supervisor_employee_id == int(supervisor_id))

    if search:
        query = query.filter(
            db.or_(
                Employee.employee_id_code.ilike(f"%{search}%"),
                Employee.first_name.ilike(f"%{search}%"),
                Employee.last_name.ilike(f"%{search}%"),
            )
        )

    ascs = query.order_by(Employee.last_name, Employee.first_name).all()
    return jsonify([a.to_dict_safe() for a in ascs]), 200

@bp.post("")
@require_auth
def create_asc():
    data = request.get_json(silent=True) or {}

    first_name = data.get("first_name", "").strip()
    last_name = data.get("last_name", "").strip()
    code = data.get("code", "").strip()

    if not first_name or not last_name or not code:
        raise BadRequest("first_name, last_name and code are required")

    # Resolve ASC position
    position = Position.query.filter_by(code=ASC_POSITION_CODE).first()
    if not position:
        raise BadRequest(f"Position '{ASC_POSITION_CODE}' not found in database")

    supervisor_employee_id = int(data["supervisor_id"]) if data.get("supervisor_id") else None

    try:
        employee = Employee(
            first_name=first_name,
            last_name=last_name,
            employee_id_code=code,
            position_id=position.id,
            gender=data.get("gender", ""),
            phone=data.get("phone", ""),
            email=data.get("email", ""),
            notes=data.get("notes", ""),
            is_active=True,
            created_by_id=currentUserId()
        )
        db.session.add(employee)
        db.session.flush()

        # if supervisor_employee_id or data.get("start_date"):
        #     profile = EmployeeProfile(
        #         employee_id=employee.id,
        #         supervisor_employee_id=supervisor_employee_id,
        #         start_date=data.get("start_date"),
        #         created_by_id=currentUserId()
        #     )
        #     db.session.add(profile)

        db.session.commit()
        return jsonify(employee.to_dict_safe()), 201
    except IntegrityError:
        db.session.rollback()
        raise BadRequest("Employee with this code already exists")

    except ValueError:
        db.session.rollback()
        raise BadRequest("Invalid chart type")

    except Exception:
        db.session.rollback()
        raise  # Let global handler return 500

@bp.get("/<int:id>")
@require_auth
def get_asc(id):
    employee = Employee.query.get(id)
    if not employee:
        raise BadRequest("ASC not found")

    result = employee.to_dict_safe()
    result["equipments"] = [e.to_dict_safe() for e in employee.owned_equipments]
    result["tickets"] = [t.to_dict_safe() for t in employee.repair_tickets]
    return jsonify(result), 200

@bp.put("/<int:id>")
@require_auth
def update_asc(id):
    employee:Employee = Employee.query.get(id)
    if not employee:
        raise BadRequest("ASC not found")

    data = request.get_json(silent=True) or {}

    for field in ("first_name", "last_name", "employee_id_code", "gender", "phone", "email", "notes"):
        key = "code" if field == "employee_id_code" else field
        if key in data:
            setattr(employee, field, data[key].strip() if isinstance(data[key], str) else data[key])

    if "is_active" in data:
        employee.is_active = bool(data["is_active"])
        employee.updated_by_id=currentUserId()

    # Update profile
    if "supervisor_id" in data or "start_date" in data or "end_date" in data:
        pass
        # profile = employee.profile
        # if profile is None:
        #     profile:EmployeeProfile = EmployeeProfile(employee_id=employee.id)
        #     profile.created_by_id=currentUserId()
        #     db.session.add(profile)
        # else:
        #     profile.updated_by_id=currentUserId()

        # if "supervisor_id" in data:
        #     profile.supervisor_employee_id = int(data["supervisor_id"]) if data["supervisor_id"] else None
        # if "start_date" in data:
        #     profile.start_date = data["start_date"]
        # if "end_date" in data:
        #     profile.end_date = data["end_date"]

    try:
        db.session.commit()
        return jsonify(employee.to_dict_safe()), 200
    except IntegrityError:
        db.session.rollback()
        raise BadRequest("Employee with this code already exists")

    except ValueError:
        db.session.rollback()
        raise BadRequest("Invalid action")

    except Exception:
        db.session.rollback()
        raise  # Let global handler return 500

@bp.delete("/<int:id>")
@require_auth
def delete_asc(id):
    employee:Employee = Employee.query.get(id)
    if not employee:
        raise BadRequest("ASC not found")

    # Soft delete
    employee.is_active = False
    employee.deleted = True
    employee.deleted_at = datetime.now(timezone.utc)
    employee.deleted_by_id=currentUserId()

    db.session.commit()
    return jsonify({"message": "ASC deactivated"}), 200

