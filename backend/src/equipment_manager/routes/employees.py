import re
import secrets
import string
from typing import List
import unicodedata
from flask import Blueprint, request, jsonify, g
from backend.src.databases.extensions import db
from backend.src.security.access_security import require_auth, currentUserId
from backend.src.equipment_manager.models.employees import Department, Position, Employee, EmployeeHistory
from backend.src.models.auth import User
from backend.src.models.tenant import Tenant
from backend.src.logger import get_backend_logger

from werkzeug.exceptions import BadRequest
from sqlalchemy.exc import IntegrityError

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
        raise BadRequest("name and code are required")

    # Validate parent if provided
    if parent_id:
        parent = Department.query.get(int(parent_id))
        if not parent:
            raise BadRequest("Parent department not found")

    try:
        dept = Department(
            name=name,
            code=code,
            parent_id=int(parent_id) if parent_id else None,
            description=data.get("description", ""),
            is_active=True,
            created_by_id=currentUserId()
        )
        db.session.add(dept)
        db.session.commit()
        return jsonify(dept.to_dict_safe()), 201
    except IntegrityError:
        db.session.rollback()
        raise BadRequest("Department with this name or code already exists")


@bp.get("/departments/<int:id>")
@require_auth
def get_department(id):
    dept:Department = Department.query.get(id)
    if not dept:
        raise BadRequest("Department not found")
    
    result = dept.to_dict_safe()
    result["children"] = [c.to_dict_safe() for c in dept.children]
    result["employees"] = [e.to_dict_safe() for e in dept.employees]
    return jsonify(result), 200


@bp.put("/departments/<int:id>")
@require_auth
def update_department(id):
    dept:Department = Department.query.get(id)
    if not dept:
        raise BadRequest("Department not found")

    data = request.get_json(silent=True) or {}
    for field in ("name", "code", "description"):
        if field in data:
            setattr(dept, field, data[field].strip() if isinstance(data[field], str) else data[field])
    if "parent_id" in data:
        dept.parent_id = int(data["parent_id"]) if data["parent_id"] else None
    if "is_active" in data:
        dept.is_active = bool(data["is_active"])
    
    dept.updated_by_id=currentUserId()
    try:
        db.session.commit()
        return jsonify(dept.to_dict_safe()), 200
    except IntegrityError:
        db.session.rollback()
        raise BadRequest("Department with this name or code already exists")


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
        raise BadRequest("Le nom et le code sont requis", 400)

    # Validate parent if provided
    # Un nouveau poste ne peut pas créer de référence circulaire (il n'a pas encore d'enfants)
    if parent_id:
        parent = Position.query.get(int(parent_id))
        if not parent:
            raise BadRequest("Poste parent introuvable", 404)

    department_id = data.get("department_id")
    if department_id:
        dept = Department.query.get(int(department_id))
        if not dept:
            raise BadRequest("Département introuvable", 404)

    try:
        pos = Position(
            name=name,
            code=code,
            parent_id=int(parent_id) if parent_id else None,
            department_id=int(department_id) if department_id else None,
            description=data.get("description", ""),
            is_active=True,
            is_zone_assignable=bool(data.get("is_zone_assignable", False)),
            created_by_id=currentUserId()
        )
        
        db.session.add(pos)
        db.session.commit()
        return jsonify(pos.to_dict_safe()), 201
    except IntegrityError:
        db.session.rollback()
        raise BadRequest("Un poste avec ce nom ou ce code existe déjà", 409)


@bp.put("/positions/<int:id>")
@require_auth
def update_position(id):
    pos:Position = Position.query.get(id)
    if not pos:
        raise BadRequest("Position not found", 404)

    data = request.get_json(silent=True) or {}

    if "parent_id" in data:
        new_parent_id = int(data["parent_id"]) if data["parent_id"] else None
        # Prevent a position from becoming its own ancestor
        if new_parent_id and (new_parent_id == id or _has_ancestor(Position.query.get(new_parent_id), id)):
            raise BadRequest("Référence circulaire détectée", 400)
        pos.parent_id = new_parent_id

    if "department_id" in data:
        pos.department_id = int(data["department_id"]) if data["department_id"] else None

    for field in ("name", "code", "description"):
        if field in data:
            setattr(pos, field, data[field].strip() if isinstance(data[field], str) else data[field])
    if "is_active" in data:
        pos.is_active = bool(data["is_active"])
    if "is_zone_assignable" in data:
        pos.is_zone_assignable = bool(data["is_zone_assignable"])

    pos.updated_by_id=currentUserId()

    try:
        db.session.commit()
        return jsonify(pos.to_dict_safe()), 200
    except IntegrityError:
        db.session.rollback()
        raise BadRequest("Un poste avec ce nom ou ce code existe déjà", 409)


def _has_ancestor(position: "Position | None", ancestor_id: int) -> bool:
    """Walk up the position tree; return True if ancestor_id is found."""
    if position is None:
        return False
    if position.parent_id is None:
        return False
    if position.parent_id == ancestor_id:
        return True
    return _has_ancestor(position.parent, ancestor_id)


# ─── HELPER HIÉRARCHIE ───────────────────────────────────────────────────────

def get_descendant_position_ids(root_position_id: int) -> list[int]:
    """Retourne tous les IDs de postes dans le sous-arbre enraciné à root_position_id (inclusif)."""
    visited: set[int] = set()
    stack = [root_position_id]
    while stack:
        pid = stack.pop()
        if pid in visited:
            continue
        visited.add(pid)
        children = Position.query.filter_by(parent_id=pid).with_entities(Position.id).all()
        stack.extend(c.id for c in children)
    return list(visited)


def get_allowed_employee_ids(caller_position_id: int) -> list[int]:
    """Retourne les IDs de tous les employés dont le poste est un descendant du poste donné."""
    pos_ids = get_descendant_position_ids(caller_position_id)
    rows = Employee.query.filter(Employee.position_id.in_(pos_ids)).with_entities(Employee.id).all()
    return [r.id for r in rows]


# ─── EMPLOYEES ───────────────────────────────────────────────────────────────

@bp.get("")
@require_auth
def list_employees():
    query = Employee.query

    tenant_id = request.args.get("tenant_id")
    active = request.args.get("active")
    search = request.args.get("search", "").strip()
    position_code = request.args.get("position_code", "").strip()
    department_code = request.args.get("department_code", "").strip()
    has_equipment = request.args.get("has_equipment", "").lower()

    if tenant_id:
        query = query.filter(Employee.tenant_id == int(tenant_id))
    if active is not None:
        query = query.filter_by(is_active=active.lower() == "true")
    if position_code:
        query = query.join(Position).filter(Position.code == position_code)
    if department_code:
        dept_pos_ids = (
            db.session.query(Position.id)
            .join(Department, Position.department_id == Department.id)
            .filter(Department.code == department_code)
            .subquery()
        )
        query = query.filter(Employee.position_id.in_(dept_pos_ids))
    if search:
        query = query.filter(
            db.or_(
                Employee.first_name.ilike(f"%{search}%"),
                Employee.last_name.ilike(f"%{search}%"),
                Employee.employee_id_code.ilike(f"%{search}%"),
            )
        )

    # Filtre équipement actif : uniquement les employés avec au moins un équipement actif assigné
    if has_equipment == "true":
        from backend.src.equipment_manager.models.equipment import Equipment, ACTIVE_STATUSES
        active_owner_subq = (
            db.session.query(Equipment.owner_id)
            .filter(Equipment.owner_id.isnot(None), Equipment.status.in_(ACTIVE_STATUSES))
            .subquery()
        )
        query = query.filter(Employee.id.in_(active_owner_subq))

    # Restriction hiérarchique + orgunits (union) :
    # - si l'appelant a un poste → ses subordonnés (descendants dans l'arbre des postes)
    # - si l'appelant a des orgunits → les employés dans ces orgunits (via leur compte user)
    caller_position_id = g.current_user.get("position_id")
    caller_orgunit_ids = [int(i) for i in (g.current_user.get("orgunit_ids") or []) if i]

    scope_filters = []

    if caller_position_id:
        allowed_pos_ids = get_descendant_position_ids(int(caller_position_id))
        if allowed_pos_ids:
            scope_filters.append(Employee.position_id.in_(allowed_pos_ids))

    if caller_orgunit_ids:
        from backend.src.models.auth import UserOrgunitLink
        user_ids_in_orgunits = (
            db.session.query(UserOrgunitLink.user_id)
            .filter(UserOrgunitLink.orgunit_id.in_(caller_orgunit_ids))
            .subquery()
        )
        scope_filters.append(Employee.user_id.in_(user_ids_in_orgunits))

    if scope_filters:
        query = query.filter(db.or_(*scope_filters))

    employees:List[Employee] = query.order_by(Employee.last_name, Employee.first_name).all()
    return jsonify([e.to_dict_safe() for e in employees]), 200


@bp.post("")
@require_auth
def create_employee():
    data = request.get_json(silent=True) or {}

    first_name = (data.get("first_name") or "").strip()
    last_name = (data.get("last_name") or "").strip()
    position_id = data.get("position_id")
    hire_date = data.get("hire_date")

    # Required: first_name, last_name, position_id
    if not first_name or not last_name:
        raise BadRequest("Le prénom et le nom sont requis", 400)
    if not position_id:
        raise BadRequest("Le poste est requis", 400)

    pos = Position.query.get(int(position_id))
    if not pos:
        raise BadRequest("Poste introuvable", 404)

    # Tenant (optional)
    tenant_id = data.get("tenant_id")
    if tenant_id:
        if not Tenant.query.filter_by(id=int(tenant_id), deleted=False).first():
            raise BadRequest("Tenant introuvable", 404)

    # employee_id_code is optional — use None if not provided
    raw_code = (data.get("employee_id_code") or "").strip()
    employee_id_code = raw_code if raw_code else None

    # Tenant pour le compte utilisateur : celui de l'employé, sinon celui de l'admin connecté
    user_tenant_id = int(tenant_id) if tenant_id else None
    if not user_tenant_id and g.current_user and g.current_user.get("tenant_id"):
        user_tenant_id = int(g.current_user["tenant_id"])

    try:
        emp = Employee(
            first_name=first_name,
            last_name=last_name,
            employee_id_code=employee_id_code,
            tenant_id=int(tenant_id) if tenant_id else None,
            position_id=pos.id,
            gender=(data.get("gender") or ""),
            hire_date=hire_date or None,
            notes=data.get("notes", ""),
            is_active=True,
            created_by_id=currentUserId()
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
        creator_id = currentUserId()
        dept_id    = pos.department_id
        history = EmployeeHistory(
            employee_id=emp.id,
            action="CREATED",
            new_department_id=dept_id,
            user_id=creator_id,
            notes=f"Employé créé : {first_name} {last_name} — Poste : {pos.name}",
            created_by_id=currentUserId()
        )
        db.session.add(history)
        db.session.commit()

        result = emp.to_dict_safe()
        if generated_credentials:
            result["generated_credentials"] = generated_credentials
        return jsonify(result), 201

    except IntegrityError:
        db.session.rollback()
        raise BadRequest("Un employé avec ce code existe déjà", 409)


@bp.get("/<int:id>")
@require_auth
def get_employee(id):
    emp = Employee.query.get(id)
    if not emp:
        raise BadRequest("Employee not found", 404)

    result = emp.to_dict_safe()
    result["history"] = [h.to_dict_safe() for h in sorted(emp.history, key=lambda h: h.timestamp, reverse=True)]
    result["equipments"] = [e.to_dict_safe() for e in emp.equipments]
    return jsonify(result), 200


@bp.put("/<int:id>")
@require_auth
def update_employee(id):
    emp:Employee = Employee.query.get(id)
    if not emp:
        raise BadRequest("Employee not found", 404)

    if not emp.is_active:
        raise BadRequest(
            "Employé inactif. Activez l'employé avant toute modification.",
            409
        )

    data = request.get_json(silent=True) or {}
    user_id = currentUserId()

    # Validate required fields if provided
    if "position_id" in data and not data.get("position_id"):
        raise BadRequest("Le poste est requis", 400)

    for field in ("first_name", "last_name", "gender", "notes"):
        if field in data:
            setattr(emp, field, data[field].strip() if isinstance(data[field], str) else data[field])

    # Tenant
    if "tenant_id" in data:
        new_tenant_id = data["tenant_id"]
        if new_tenant_id:
            if not Tenant.query.filter_by(id=int(new_tenant_id), deleted=False).first():
                raise BadRequest("Tenant introuvable", 404)
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

    emp.updated_by_id=currentUserId()

    new_dept_id = emp.position_rel.department_id if emp.position_rel else None
    
    history = EmployeeHistory(
        employee_id=emp.id,
        user_id=user_id,
        created_by_id=currentUserId()
    )

    if old_dept_id != new_dept_id and (old_dept_id or new_dept_id):
        history.action="TRANSFERRED"
        history.old_department_id=old_dept_id
        history.new_department_id=new_dept_id
        history.notes=data.get("transfer_notes", "")
    else:
        history.action="UPDATED"

    db.session.add(history)

    try:
        db.session.commit()
        return jsonify(emp.to_dict_safe()), 200
    except IntegrityError:
        db.session.rollback()
        raise BadRequest("Employee with this ID code already exists", 409)


@bp.patch("/<int:id>/toggle-active")
@require_auth
def toggle_active(id):
    emp:Employee = Employee.query.get(id)
    if not emp:
        raise BadRequest("Employee not found", 404)

    data = request.get_json(silent=True) or {}
    user_id = currentUserId()
    notes = (data.get("notes") or "").strip()
    action_date = (data.get("action_date") or "").strip()

    emp.is_active = not emp.is_active
    emp.updated_by_id=currentUserId()

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
        created_by_id=currentUserId()
    )
    db.session.add(history)
    db.session.commit()

    return jsonify(emp.to_dict_safe()), 200


# ─── CREATE ACCOUNT ──────────────────────────────────────────────────────────

@bp.post("/<int:id>/create-account")
@require_auth
def create_account(id):
    """Crée le compte utilisateur pour un employé (appelé après confirmation des credentials)."""
    emp:Employee = Employee.query.get(id)
    if not emp:
        raise BadRequest("Employé introuvable", 404)

    if emp.user_id and User.query.get(emp.user_id):
        raise BadRequest("Un compte utilisateur existe déjà pour cet employé", 409)

    data     = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = (data.get("password") or "").strip()

    if not username:
        raise BadRequest("Le nom d'utilisateur est requis", 400)
    if not re.fullmatch(r'[a-zA-Z0-9_-]+', username):
        raise BadRequest("Le nom d'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores", 400)
    if len(password) < 6:
        raise BadRequest("Le mot de passe doit contenir au moins 6 caractères", 400)

    if User.query.filter_by(username=username).first():
        raise BadRequest("Ce nom d'utilisateur est déjà pris", 409)

    # Tenant : celui de l'employé ou celui de l'admin connecté
    tenant_id = emp.tenant_id
    if not tenant_id and g.current_user and g.current_user.get("tenant_id"):
        tenant_id = int(g.current_user["tenant_id"])
    if not tenant_id:
        raise BadRequest("Impossible de déterminer le tenant pour ce compte", 400)

    role_ids    = data.get("role_ids") or []
    orgunit_ids = data.get("orgunit_ids") or []
    firstname   = (data.get("firstname") or "").strip() or emp.first_name
    lastname    = (data.get("lastname")  or "").strip() or emp.last_name

    try:
        user = User(
            username=username,
            tenant_id=tenant_id,
            is_active=True,
            has_changed_default_password=False,
        )
        user.firstname = firstname
        user.lastname  = lastname
        user.set_password(password)
        user.created_by=currentUserId()

        db.session.add(user)
        db.session.flush()

        if role_ids:
            from backend.src.models.auth import UserRole
            user.roles = UserRole.query.filter(UserRole.id.in_(role_ids)).all()
        if orgunit_ids:
            from backend.src.models.auth import UserOrgunit
            user.orgunits = UserOrgunit.query.filter(UserOrgunit.id.in_(orgunit_ids)).all()

        emp.user_id = user.id
        emp.updated_by_id=currentUserId()
        db.session.commit()

        return jsonify(user.to_dict()), 200

    except IntegrityError:
        db.session.rollback()
        raise BadRequest("Ce nom d'utilisateur ou email est déjà utilisé", 409)



# ─── GET ACCOUNT ─────────────────────────────────────────────────────────────

@bp.get("/<int:id>/account")
@require_auth
def get_employee_account(id):
    """Retourne les données du compte utilisateur lié à l'employé."""
    emp:Employee = Employee.query.get(id)
    if not emp:
        raise BadRequest("Employé introuvable", 404)
    if not emp.user_id:
        raise BadRequest("Cet employé n'a pas encore de compte utilisateur", 404)
    user:User = User.query.get(emp.user_id)
    if not user:
        raise BadRequest("Compte utilisateur introuvable", 404)
    return jsonify(user.to_dict()), 200


# ─── UPDATE ACCOUNT ───────────────────────────────────────────────────────────

@bp.put("/<int:id>/update-account")
@require_auth
def update_employee_account(id):
    """Met à jour le compte utilisateur lié à l'employé."""
    emp:Employee = Employee.query.get(id)
    if not emp:
        raise BadRequest("Employé introuvable", 404)
    if not emp.user_id:
        raise BadRequest("Cet employé n'a pas encore de compte utilisateur", 400)
    
    user:User = User.query.get(emp.user_id)
    if not user:
        raise BadRequest("Compte utilisateur introuvable", 404)

    data = request.get_json(silent=True) or {}

    for field in ("firstname", "lastname", "email", "phone"):
        if field in data:
            setattr(user, field, data[field] or None)

    if "is_active" in data:
        user.is_active = bool(data["is_active"])

    if "role_ids" in data:
        from backend.src.models.auth import UserRole
        user.roles = UserRole.query.filter(UserRole.id.in_(data["role_ids"])).all()

    if "orgunit_ids" in data:
        from backend.src.models.auth import UserOrgunit
        user.orgunits = UserOrgunit.query.filter(UserOrgunit.id.in_(data["orgunit_ids"])).all()

    if data.get("password"):
        if data["password"] != data.get("password_confirm", ""):
            raise BadRequest("Les mots de passe ne concordent pas", 400)
        if len(data["password"]) < 6:
            raise BadRequest("Le mot de passe doit contenir au moins 6 caractères", 400)
        user.set_password(data["password"])

    user.updated_by=currentUserId()

    try:
        db.session.commit()
        return jsonify(user.to_dict()), 200
    except IntegrityError:
        db.session.rollback()
        raise BadRequest("Cet email est déjà utilisé par un autre compte", 409)
