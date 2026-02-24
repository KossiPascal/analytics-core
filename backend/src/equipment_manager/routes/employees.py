import re
import secrets
import string
import unicodedata

from flask import Blueprint, request, jsonify, g
from sqlalchemy.exc import IntegrityError

from backend.src.databases.extensions import db, error_response
from backend.src.security.access_security import require_auth
from backend.src.equipment_manager.models.employees import Department, Position, Employee, EmployeeHistory
from backend.src.models.auth import Tenant, User
from backend.src.logger import get_backend_logger

logger = get_backend_logger(__name__)

bp = Blueprint("em_employees", __name__, url_prefix="/api/equipment/employees")


# ─── HELPERS : génération de compte utilisateur ─────────────────────────────

def _normalize(text: str) -> str:
    """Minuscules + suppression des accents."""
    return ''.join(
        c for c in unicodedata.normalize('NFD', text.lower())
        if unicodedata.category(c) != 'Mn'
    )

def _build_base_username(first_name: str, last_name: str, code: str | None) -> str:
    """Username : lettres, chiffres, tirets et underscores uniquement."""
    if code:
        base = re.sub(r'[^a-z0-9_-]', '', _normalize(code).replace(' ', '_'))
        if base:
            return base
    first = re.sub(r'[^a-z]', '', _normalize(first_name))[:10]
    last  = re.sub(r'[^a-z]', '', _normalize(last_name))[:10]
    return f"{first}_{last}" or "employe"

def _unique_username(base: str) -> str:
    username = base
    counter  = 2
    while User.query.filter_by(username=username).first():
        username = f"{base}{counter}"
        counter += 1
    return username

def _temp_password(length: int = 10) -> str:
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))


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

    department_id = data.get("department_id")
    if department_id:
        dept = Department.query.get(int(department_id))
        if not dept:
            return error_response("Département introuvable", 404)

    try:
        pos = Position(
            name=name,
            code=code,
            parent_id=int(parent_id) if parent_id else None,
            department_id=int(department_id) if department_id else None,
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

    if "department_id" in data:
        pos.department_id = int(data["department_id"]) if data["department_id"] else None

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
    tenant_id = request.args.get("tenant_id")
    active = request.args.get("active")
    search = request.args.get("search", "").strip()

    if tenant_id:
        query = query.filter(Employee.tenant_id == int(tenant_id))
    if department_id:
        dept_id = int(department_id)
        dept = Department.query.get(dept_id)
        if dept:
            dept_ids = [dept_id] + [c.id for c in dept.children]
            # Filtrer par département via le poste de l'employé
            matching_positions = Position.query.filter(Position.department_id.in_(dept_ids)).all()
            pos_ids = [p.id for p in matching_positions]
            query = query.filter(Employee.position_id.in_(pos_ids))
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

    first_name = (data.get("first_name") or "").strip()
    last_name = (data.get("last_name") or "").strip()
    phone = (data.get("phone") or "").strip()
    position_id = data.get("position_id")
    hire_date = data.get("hire_date")

    # Required: first_name, last_name, phone, position_id
    # Le département est déduit du poste — plus de department_id direct
    if not first_name or not last_name:
        return error_response("Le prénom et le nom sont requis", 400)
    if not phone:
        return error_response("Le téléphone est requis", 400)
    if not position_id:
        return error_response("Le poste est requis", 400)

    pos = Position.query.get(int(position_id))
    if not pos:
        return error_response("Poste introuvable", 404)

    # Tenant (optional)
    tenant_id = data.get("tenant_id")
    if tenant_id:
        if not Tenant.query.filter_by(id=int(tenant_id), deleted=False).first():
            return error_response("Tenant introuvable", 404)

    # employee_id_code is optional — use None if not provided
    raw_code = (data.get("employee_id_code") or "").strip()
    employee_id_code = raw_code if raw_code else None

    # Tenant pour le compte utilisateur : celui de l'employé, sinon celui de l'admin connecté
    user_tenant_id = int(tenant_id) if tenant_id else None
    if not user_tenant_id and g.current_user and g.current_user.get("tenant_id"):
        user_tenant_id = int(g.current_user["tenant_id"])

    email_val = (data.get("email") or "").strip() or None

    try:
        emp = Employee(
            first_name=first_name,
            last_name=last_name,
            employee_id_code=employee_id_code,
            tenant_id=int(tenant_id) if tenant_id else None,
            position_id=pos.id,
            gender=(data.get("gender") or ""),
            phone=phone,
            email=email_val or "",
            hire_date=hire_date or None,
            notes=data.get("notes", ""),
            is_active=True,
        )
        db.session.add(emp)
        db.session.flush()  # emp.id disponible

        # ── Suggestion de credentials (compte créé par l'admin via create-account) ──
        generated_credentials = None
        if user_tenant_id:
            base_username = _build_base_username(first_name, last_name, employee_id_code)
            suggested_username = _unique_username(base_username)
            suggested_password = _temp_password()
            generated_credentials = {
                "username": suggested_username,
                "password": suggested_password,
            }
        else:
            logger.warning("Employé créé sans tenant → suggestion de compte impossible.")

        # ── Historique ──────────────────────────────────────────────────────
        creator_id = int(g.current_user["id"]) if g.current_user else None
        dept_id    = pos.department_id
        history = EmployeeHistory(
            employee_id=emp.id,
            action="CREATED",
            new_department_id=dept_id,
            user_id=creator_id,
            notes=f"Employé créé : {first_name} {last_name} — Poste : {pos.name}",
        )
        db.session.add(history)
        db.session.commit()

        result = emp.to_dict_safe()
        if generated_credentials:
            result["generated_credentials"] = generated_credentials
        return jsonify(result), 201

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
    if "phone" in data and not (data.get("phone") or "").strip():
        return error_response("Le téléphone est requis", 400)
    if "position_id" in data and not data.get("position_id"):
        return error_response("Le poste est requis", 400)

    for field in ("first_name", "last_name", "gender", "phone", "email", "notes"):
        if field in data:
            setattr(emp, field, data[field].strip() if isinstance(data[field], str) else data[field])

    # Tenant
    if "tenant_id" in data:
        new_tenant_id = data["tenant_id"]
        if new_tenant_id:
            if not Tenant.query.filter_by(id=int(new_tenant_id), deleted=False).first():
                return error_response("Tenant introuvable", 404)
            emp.tenant_id = int(new_tenant_id)
        else:
            emp.tenant_id = None

    # employee_id_code is optional — store None if empty
    if "employee_id_code" in data:
        raw_code = data["employee_id_code"].strip() if isinstance(data["employee_id_code"], str) else data["employee_id_code"]
        emp.employee_id_code = raw_code if raw_code else None

    if "hire_date" in data:
        emp.hire_date = data["hire_date"] or None

    # Si le poste change, on enregistre un transfert de département si le département a changé
    old_dept_id = emp.position_rel.department_id if emp.position_rel else None

    if "position_id" in data:
        emp.position_id = int(data["position_id"]) if data["position_id"] else None

    new_dept_id = emp.position_rel.department_id if emp.position_rel else None

    if old_dept_id != new_dept_id and (old_dept_id or new_dept_id):
        history = EmployeeHistory(
            employee_id=emp.id,
            action="TRANSFERRED",
            old_department_id=old_dept_id,
            new_department_id=new_dept_id,
            user_id=user_id,
            notes=data.get("transfer_notes", ""),
        )
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
    notes = (data.get("notes") or "").strip()
    action_date = (data.get("action_date") or "").strip()

    emp.is_active = not emp.is_active

    # Synchroniser le compte utilisateur lié
    if emp.user_id:
        linked_user = User.query.get(emp.user_id)
        if linked_user:
            linked_user.is_active = emp.is_active

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


# ─── CREATE ACCOUNT ──────────────────────────────────────────────────────────

@bp.post("/<int:id>/create-account")
@require_auth
def create_account(id):
    """Crée le compte utilisateur pour un employé (appelé après confirmation des credentials)."""
    emp = Employee.query.get(id)
    if not emp:
        return error_response("Employé introuvable", 404)

    if emp.user_id and User.query.get(emp.user_id):
        return error_response("Un compte utilisateur existe déjà pour cet employé", 409)

    data     = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = (data.get("password") or "").strip()

    if not username:
        return error_response("Le nom d'utilisateur est requis", 400)
    if not re.fullmatch(r'[a-zA-Z0-9_-]+', username):
        return error_response("Le nom d'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores", 400)
    if len(password) < 6:
        return error_response("Le mot de passe doit contenir au moins 6 caractères", 400)

    if User.query.filter_by(username=username).first():
        return error_response("Ce nom d'utilisateur est déjà pris", 409)

    # Tenant : celui de l'employé ou celui de l'admin connecté
    tenant_id = emp.tenant_id
    if not tenant_id and g.current_user and g.current_user.get("tenant_id"):
        tenant_id = int(g.current_user["tenant_id"])
    if not tenant_id:
        return error_response("Impossible de déterminer le tenant pour ce compte", 400)

    try:
        user_account = User(
            username=username,
            fullname=emp.get_full_name(),
            tenant_id=tenant_id,
            email=emp.email or None,
            phone=emp.phone or None,
            is_active=True,
            has_changed_default_password=False,
        )
        user_account.set_password(password)
        db.session.add(user_account)
        db.session.flush()

        emp.user_id = user_account.id
        db.session.commit()

        return jsonify(emp.to_dict_safe()), 200

    except IntegrityError:
        db.session.rollback()
        return error_response("Ce nom d'utilisateur ou email est déjà utilisé", 409)
