from flask import Blueprint, request, jsonify, g
from sqlalchemy.exc import IntegrityError

from backend.src.databases.extensions import db, error_response
from backend.src.security.access_security import require_auth
from backend.src.equipment_manager.models.employees import Department, Position, Employee, EmployeeHistory
from backend.src.logger import get_backend_logger

logger = get_backend_logger(__name__)

bp = Blueprint("em_employees", __name__, url_prefix="/api/equipment/employees")


# ─── DEPARTMENTS (self-referential: root + sub) ─────────────────────────────

@bp.get("/departments")
@require_auth
def list_departments():
    """List root departments (parent_id IS NULL)."""
    departments = Department.query.filter_by(parent_id=None, is_active=True).order_by(Department.name).all()
    result = []
    for d in departments:
        item = d.to_dict_safe()
        item["children"] = [c.to_dict_safe() for c in d.children]
        result.append(item)
    return jsonify(result), 200


@bp.post("/departments")
@require_auth
def create_department():
    data = request.get_json(silent=True) or {}
    name = data.get("name", "").strip()
    code = data.get("code", "").strip()
    parent_id = data.get("parent_id")

    if not name or not code:
        return error_response("name and code are required", 400)

    # Validate parent if provided
    if parent_id:
        parent = Department.query.get(int(parent_id))
        if not parent:
            return error_response("Parent department not found", 404)

    try:
        dept = Department(
            name=name,
            code=code,
            parent_id=int(parent_id) if parent_id else None,
            description=data.get("description", ""),
            is_active=True,
        )
        db.session.add(dept)
        db.session.commit()
        return jsonify(dept.to_dict_safe()), 201
    except IntegrityError:
        db.session.rollback()
        return error_response("Department with this name or code already exists", 409)


@bp.get("/departments/<int:id>")
@require_auth
def get_department(id):
    dept = Department.query.get(id)
    if not dept:
        return error_response("Department not found", 404)
    result = dept.to_dict_safe()
    result["children"] = [c.to_dict_safe() for c in dept.children]
    result["employees"] = [e.to_dict_safe() for e in dept.employees]
    return jsonify(result), 200


@bp.put("/departments/<int:id>")
@require_auth
def update_department(id):
    dept = Department.query.get(id)
    if not dept:
        return error_response("Department not found", 404)

    data = request.get_json(silent=True) or {}
    for field in ("name", "code", "description"):
        if field in data:
            setattr(dept, field, data[field].strip() if isinstance(data[field], str) else data[field])
    if "parent_id" in data:
        dept.parent_id = int(data["parent_id"]) if data["parent_id"] else None
    if "is_active" in data:
        dept.is_active = bool(data["is_active"])

    try:
        db.session.commit()
        return jsonify(dept.to_dict_safe()), 200
    except IntegrityError:
        db.session.rollback()
        return error_response("Department with this name or code already exists", 409)


# ─── POSITIONS ────────────────────────────────────────────────────────────────

@bp.get("/positions")
@require_auth
def list_positions():
    """Return flat list of positions ordered hierarchically (parents before children)."""
    positions = Position.query.order_by(
        db.func.coalesce(Position.parent_id, 0),
        Position.name,
    ).all()
    return jsonify([p.to_dict_safe() for p in positions]), 200


@bp.post("/positions")
@require_auth
def create_position():
    data = request.get_json(silent=True) or {}
    name = data.get("name", "").strip()
    code = data.get("code", "").strip()
    parent_id = data.get("parent_id")

    if not name or not code:
        return error_response("Le nom et le code sont requis", 400)

    # Validate parent if provided
    # Un nouveau poste ne peut pas créer de référence circulaire (il n'a pas encore d'enfants)
    if parent_id:
        parent = Position.query.get(int(parent_id))
        if not parent:
            return error_response("Poste parent introuvable", 404)

    try:
        pos = Position(
            name=name,
            code=code,
            parent_id=int(parent_id) if parent_id else None,
            description=data.get("description", ""),
            is_active=True,
        )
        db.session.add(pos)
        db.session.commit()
        return jsonify(pos.to_dict_safe()), 201
    except IntegrityError:
        db.session.rollback()
        return error_response("Un poste avec ce nom ou ce code existe déjà", 409)


@bp.put("/positions/<int:id>")
@require_auth
def update_position(id):
    pos = Position.query.get(id)
    if not pos:
        return error_response("Position not found", 404)

    data = request.get_json(silent=True) or {}

    if "parent_id" in data:
        new_parent_id = int(data["parent_id"]) if data["parent_id"] else None
        # Prevent a position from becoming its own ancestor
        if new_parent_id and (new_parent_id == id or _has_ancestor(Position.query.get(new_parent_id), id)):
            return error_response("Référence circulaire détectée", 400)
        pos.parent_id = new_parent_id

    for field in ("name", "code", "description"):
        if field in data:
            setattr(pos, field, data[field].strip() if isinstance(data[field], str) else data[field])
    if "is_active" in data:
        pos.is_active = bool(data["is_active"])

    try:
        db.session.commit()
        return jsonify(pos.to_dict_safe()), 200
    except IntegrityError:
        db.session.rollback()
        return error_response("Un poste avec ce nom ou ce code existe déjà", 409)


def _has_ancestor(position: "Position | None", ancestor_id: int) -> bool:
    """Walk up the position tree; return True if ancestor_id is found."""
    if position is None:
        return False
    if position.parent_id is None:
        return False
    if position.parent_id == ancestor_id:
        return True
    return _has_ancestor(position.parent, ancestor_id)


# ─── EMPLOYEES ───────────────────────────────────────────────────────────────

@bp.get("")
@require_auth
def list_employees():
    query = Employee.query

    department_id = request.args.get("department_id")
    active = request.args.get("active")
    search = request.args.get("search", "").strip()

    if department_id:
        dept_id = int(department_id)
        # Include employees from this department and all its children
        dept = Department.query.get(dept_id)
        if dept:
            dept_ids = [dept_id] + [c.id for c in dept.children]
            query = query.filter(Employee.department_id.in_(dept_ids))
    if active is not None:
        query = query.filter_by(is_active=active.lower() == "true")
    if search:
        query = query.filter(
            db.or_(
                Employee.first_name.ilike(f"%{search}%"),
                Employee.last_name.ilike(f"%{search}%"),
                Employee.employee_id_code.ilike(f"%{search}%"),
            )
        )

    employees = query.order_by(Employee.last_name, Employee.first_name).all()
    return jsonify([e.to_dict_safe() for e in employees]), 200


@bp.post("")
@require_auth
def create_employee():
    data = request.get_json(silent=True) or {}

    first_name = data.get("first_name", "").strip()
    last_name = data.get("last_name", "").strip()
    phone = data.get("phone", "").strip()
    department_id = data.get("department_id")
    position_id = data.get("position_id")
    hire_date = data.get("hire_date")

    # Required fields: first_name, last_name, phone, department_id, position_id
    if not first_name or not last_name:
        return error_response("Le prénom et le nom sont requis", 400)
    if not phone:
        return error_response("Le téléphone est requis", 400)
    if not department_id:
        return error_response("Le département est requis", 400)
    if not position_id:
        return error_response("Le poste est requis", 400)

    dept = Department.query.get(int(department_id))
    if not dept:
        return error_response("Département introuvable", 404)

    pos = Position.query.get(int(position_id))
    if not pos:
        return error_response("Poste introuvable", 404)

    # employee_id_code is optional — use None if not provided
    raw_code = data.get("employee_id_code", "").strip()
    employee_id_code = raw_code if raw_code else None

    try:
        emp = Employee(
            first_name=first_name,
            last_name=last_name,
            employee_id_code=employee_id_code,
            department_id=dept.id,
            position_id=pos.id,
            gender=data.get("gender", ""),
            phone=phone,
            email=data.get("email", "").strip(),
            hire_date=hire_date or None,
            notes=data.get("notes", ""),
            is_active=True,
        )
        db.session.add(emp)
        db.session.flush()

        # Log creation
        user_id = int(g.current_user["id"]) if g.current_user else None
        history = EmployeeHistory(
            employee_id=emp.id,
            action="CREATED",
            new_department_id=dept.id,
            user_id=user_id,
            notes=f"Employé créé : {first_name} {last_name} — Poste : {pos.name}",
        )
        db.session.add(history)
        db.session.commit()
        return jsonify(emp.to_dict_safe()), 201

    except IntegrityError:
        db.session.rollback()
        return error_response("Un employé avec ce code existe déjà", 409)


@bp.get("/<int:id>")
@require_auth
def get_employee(id):
    emp = Employee.query.get(id)
    if not emp:
        return error_response("Employee not found", 404)

    result = emp.to_dict_safe()
    result["history"] = [h.to_dict_safe() for h in sorted(emp.history, key=lambda h: h.timestamp, reverse=True)]
    result["equipments"] = [e.to_dict_safe() for e in emp.equipments]
    return jsonify(result), 200


@bp.put("/<int:id>")
@require_auth
def update_employee(id):
    emp = Employee.query.get(id)
    if not emp:
        return error_response("Employee not found", 404)

    if not emp.is_active:
        return error_response(
            "Employé inactif. Activez l'employé avant toute modification.",
            409
        )

    data = request.get_json(silent=True) or {}
    user_id = int(g.current_user["id"]) if g.current_user else None

    # Validate required fields if provided
    if "phone" in data and not data.get("phone", "").strip():
        return error_response("Le téléphone est requis", 400)
    if "position_id" in data and not data.get("position_id"):
        return error_response("Le poste est requis", 400)

    for field in ("first_name", "last_name", "gender", "phone", "email", "notes"):
        if field in data:
            setattr(emp, field, data[field].strip() if isinstance(data[field], str) else data[field])

    # employee_id_code is optional — store None if empty
    if "employee_id_code" in data:
        raw_code = data["employee_id_code"].strip() if isinstance(data["employee_id_code"], str) else data["employee_id_code"]
        emp.employee_id_code = raw_code if raw_code else None

    if "position_id" in data:
        emp.position_id = int(data["position_id"]) if data["position_id"] else None

    if "hire_date" in data:
        emp.hire_date = data["hire_date"] or None

    # Handle department transfer
    if "department_id" in data and int(data["department_id"]) != emp.department_id:
        old_dept_id = emp.department_id
        new_dept_id = int(data["department_id"])
        emp.department_id = new_dept_id

        history = EmployeeHistory(
            employee_id=emp.id,
            action="TRANSFERRED",
            old_department_id=old_dept_id,
            new_department_id=new_dept_id,
            user_id=user_id,
            notes=data.get("transfer_notes", ""),
        )
        db.session.add(history)
    else:
        history = EmployeeHistory(
            employee_id=emp.id,
            action="UPDATED",
            user_id=user_id,
        )
        db.session.add(history)

    try:
        db.session.commit()
        return jsonify(emp.to_dict_safe()), 200
    except IntegrityError:
        db.session.rollback()
        return error_response("Employee with this ID code already exists", 409)


@bp.patch("/<int:id>/toggle-active")
@require_auth
def toggle_active(id):
    emp = Employee.query.get(id)
    if not emp:
        return error_response("Employee not found", 404)

    data = request.get_json(silent=True) or {}
    user_id = int(g.current_user["id"]) if g.current_user else None
    notes = data.get("notes", "").strip()
    action_date = data.get("action_date", "").strip()

    emp.is_active = not emp.is_active

    action = "REACTIVATED" if emp.is_active else "DEACTIVATED"
    note_parts = []
    if action_date:
        note_parts.append(f"Date : {action_date}")
    if notes:
        note_parts.append(notes)

    history = EmployeeHistory(
        employee_id=emp.id,
        action=action,
        user_id=user_id,
        notes=" — ".join(note_parts) if note_parts else "",
    )
    db.session.add(history)
    db.session.commit()

    return jsonify(emp.to_dict_safe()), 200
