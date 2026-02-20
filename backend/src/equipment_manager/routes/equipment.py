from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, g
from sqlalchemy.exc import IntegrityError

from backend.src.databases.extensions import db, error_response
from backend.src.security.access_security import require_auth
import re
from backend.src.equipment_manager.models.equipment import (
    EquipmentCategoryGroup, EquipmentCategory, EquipmentBrand,
    Equipment, EquipmentImei, EquipmentHistory, Accessory,
    ACTIVE_STATUSES, INACTIVE_STATUSES, DECLARATION_ACTION_MAP,
)
from backend.src.equipment_manager.models.employees import Employee
from backend.src.docs_generetor.pdf_generator import pdf_response
from backend.src.logger import get_backend_logger

logger = get_backend_logger(__name__)

bp = Blueprint("em_equipment", __name__, url_prefix="/api/equipment/assets")


# ─── IMEI VALIDATION ─────────────────────────────────────────────────────────

def _luhn_check(imei: str) -> bool:
    """Algorithme de Luhn pour valider un IMEI."""
    total = 0
    for i, digit in enumerate(reversed(imei)):
        n = int(digit)
        if i % 2 == 1:
            n *= 2
            if n > 9:
                n -= 9
        total += n
    return total % 10 == 0


def validate_imei(imei: str) -> tuple:
    """Valide un IMEI. Retourne (True, '') ou (False, message)."""
    imei = imei.strip()
    if not imei:
        return False, "IMEI requis"
    if not re.match(r'^\d{15}$', imei):
        return False, "L'IMEI doit contenir exactement 15 chiffres"
    if not _luhn_check(imei):
        return False, f"IMEI '{imei}' invalide (échec validation Luhn)"
    return True, ""


# ─── CATEGORY GROUPS (Grandes catégories : Électronique, Meubles, Voitures…) ─

@bp.get("/category-groups")
@require_auth
def list_category_groups():
    items = EquipmentCategoryGroup.query.order_by(EquipmentCategoryGroup.name).all()
    return jsonify([g.to_dict_safe() for g in items]), 200


@bp.post("/category-groups")
@require_auth
def create_category_group():
    data = request.get_json(silent=True) or {}
    name = data.get("name", "").strip()
    code = data.get("code", "").strip()
    if not name or not code:
        return error_response("Le nom et le code sont requis", 400)
    try:
        grp = EquipmentCategoryGroup(
            name=name, code=code,
            description=data.get("description", ""),
            is_active=True,
        )
        db.session.add(grp)
        db.session.commit()
        return jsonify(grp.to_dict_safe()), 201
    except IntegrityError:
        db.session.rollback()
        return error_response("Une catégorie avec ce nom ou ce code existe déjà", 409)


@bp.put("/category-groups/<int:id>")
@require_auth
def update_category_group(id):
    grp = EquipmentCategoryGroup.query.get(id)
    if not grp:
        return error_response("Catégorie introuvable", 404)
    data = request.get_json(silent=True) or {}
    for field in ("name", "code", "description"):
        if field in data:
            setattr(grp, field, data[field].strip() if isinstance(data[field], str) else data[field])
    if "is_active" in data:
        grp.is_active = bool(data["is_active"])
    try:
        db.session.commit()
        return jsonify(grp.to_dict_safe()), 200
    except IntegrityError:
        db.session.rollback()
        return error_response("Une catégorie avec ce nom ou ce code existe déjà", 409)


# ─── CATEGORIES (Types d'équipement, FK → category_group) ────────────────────

@bp.get("/categories")
@require_auth
def list_categories():
    items = EquipmentCategory.query.order_by(EquipmentCategory.name).all()
    return jsonify([c.to_dict_safe() for c in items]), 200


@bp.post("/categories")
@require_auth
def create_category():
    data = request.get_json(silent=True) or {}
    name = data.get("name", "").strip()
    code = data.get("code", "").strip()
    if not name or not code:
        return error_response("Le nom et le code sont requis", 400)
    category_group_id = data.get("category_group_id")
    try:
        cat = EquipmentCategory(
            name=name, code=code,
            category_group_id=int(category_group_id) if category_group_id else None,
            description=data.get("description", ""),
            is_active=True,
        )
        db.session.add(cat)
        db.session.commit()
        return jsonify(cat.to_dict_safe()), 201
    except IntegrityError:
        db.session.rollback()
        return error_response("Un type avec ce nom ou ce code existe déjà", 409)


@bp.put("/categories/<int:id>")
@require_auth
def update_category(id):
    cat = EquipmentCategory.query.get(id)
    if not cat:
        return error_response("Type introuvable", 404)
    data = request.get_json(silent=True) or {}
    for field in ("name", "code", "description"):
        if field in data:
            setattr(cat, field, data[field].strip() if isinstance(data[field], str) else data[field])
    if "category_group_id" in data:
        cat.category_group_id = int(data["category_group_id"]) if data["category_group_id"] else None
    if "is_active" in data:
        cat.is_active = bool(data["is_active"])
    try:
        db.session.commit()
        return jsonify(cat.to_dict_safe()), 200
    except IntegrityError:
        db.session.rollback()
        return error_response("Un type avec ce nom ou ce code existe déjà", 409)


# ─── BRANDS (Marques) ────────────────────────────────────────────────────────

@bp.get("/brands")
@require_auth
def list_brands():
    items = EquipmentBrand.query.order_by(EquipmentBrand.name).all()
    return jsonify([b.to_dict_safe() for b in items]), 200


@bp.post("/brands")
@require_auth
def create_brand():
    data = request.get_json(silent=True) or {}
    name = data.get("name", "").strip()
    code = data.get("code", "").strip()
    if not name or not code:
        return error_response("name and code are required", 400)
    try:
        brand = EquipmentBrand(
            name=name, code=code,
            description=data.get("description", ""),
            is_active=True,
        )
        db.session.add(brand)
        db.session.commit()
        return jsonify(brand.to_dict_safe()), 201
    except IntegrityError:
        db.session.rollback()
        return error_response("Brand with this name or code already exists", 409)


@bp.put("/brands/<int:id>")
@require_auth
def update_brand(id):
    brand = EquipmentBrand.query.get(id)
    if not brand:
        return error_response("Brand not found", 404)
    data = request.get_json(silent=True) or {}
    for field in ("name", "code", "description"):
        if field in data:
            setattr(brand, field, data[field].strip() if isinstance(data[field], str) else data[field])
    if "is_active" in data:
        brand.is_active = bool(data["is_active"])
    try:
        db.session.commit()
        return jsonify(brand.to_dict_safe()), 200
    except IntegrityError:
        db.session.rollback()
        return error_response("Brand with this name or code already exists", 409)


# ─── EQUIPMENT ────────────────────────────────────────────────────────────────

def _generate_equipment_code(category_id: "int | None") -> str:
    """Génère un code unique SI/EQ/<cat_code>/<NNN> pour un équipement."""
    cat = EquipmentCategory.query.get(category_id) if category_id else None
    cat_code = cat.code if cat else "AUTRE"
    prefix = f"SI/EQ/{cat_code}/"
    last = db.session.query(
        db.func.max(Equipment.equipment_code)
    ).filter(
        Equipment.equipment_code.like(f"{prefix}%")
    ).scalar()
    if last:
        try:
            last_num = int(last.split("/")[-1])
        except (ValueError, IndexError):
            last_num = 0
        next_num = last_num + 1
    else:
        next_num = 1
    return f"{prefix}{next_num:03d}"


@bp.get("/next-code")
@require_auth
def get_next_equipment_code():
    """Retourne le prochain code disponible pour une catégorie donnée."""
    category_id = request.args.get("category_id")
    code = _generate_equipment_code(int(category_id) if category_id else None)
    return jsonify({"code": code}), 200


@bp.get("")
@require_auth
def list_equipment():
    query = Equipment.query

    owner_id = request.args.get("owner_id") or request.args.get("asc_id")
    employee_id = request.args.get("employee_id")
    status = request.args.get("status")
    eq_type = request.args.get("type")

    if owner_id:
        query = query.filter_by(owner_id=int(owner_id))
    if employee_id:
        query = query.filter_by(employee_id=int(employee_id))
    if status:
        query = query.filter_by(status=status)
    if eq_type:
        query = query.filter_by(equipment_type=eq_type)

    equipment = query.order_by(Equipment.created_at.desc()).all()
    return jsonify([e.to_dict_safe() for e in equipment]), 200


@bp.post("")
@require_auth
def create_equipment():
    data = request.get_json(silent=True) or {}

    category_id = data.get("category_id")
    brand = data.get("brand", "").strip()
    model_name = data.get("model_name", "").strip()
    imei = data.get("imei", "").strip()
    brand_id = data.get("brand_id")

    if not model_name:
        return error_response("Le modèle est requis", 400)

    # Déterminer si la catégorie est électronique
    cat = EquipmentCategory.query.get(int(category_id)) if category_id else None
    is_electronic = cat and cat.category_group and cat.category_group.code == "ELECTRONIQUE"

    # Gestion des IMEIs
    has_sim = bool(data.get("has_sim", False))
    imeis_list = data.get("imeis", [])  # liste de strings

    # Téléphone → has_sim implicite
    if is_electronic and cat and cat.code and "TEL" in cat.code.upper():
        has_sim = True

    if has_sim:
        if not imeis_list:
            return error_response("Au moins un IMEI est requis pour les équipements avec carte SIM", 400)
        for idx, raw_imei in enumerate(imeis_list):
            valid, msg = validate_imei(str(raw_imei))
            if not valid:
                return error_response(f"IMEI {idx + 1}: {msg}", 400)

    # Générer le code unique
    cat_id_int = int(category_id) if category_id else None
    equipment_code = _generate_equipment_code(cat_id_int)

    try:
        owner_id = int(data["owner_id"]) if data.get("owner_id") else None
        employee_id = int(data["employee_id"]) if data.get("employee_id") else None
        status = data.get("status", "PENDING")
        if (owner_id or employee_id) and status == "PENDING":
            status = "FUNCTIONAL"

        # Premier IMEI pour le champ legacy (backward compat)
        first_imei = imeis_list[0].strip() if has_sim and imeis_list else None

        eq = Equipment(
            equipment_code=equipment_code,
            equipment_type=cat.code if cat else "",
            category_id=cat_id_int,
            brand=brand,
            brand_id=int(brand_id) if brand_id else None,
            model_name=model_name,
            imei=first_imei,
            serial_number=data.get("serial_number", ""),
            has_sim=has_sim,
            owner_id=owner_id,
            employee_id=employee_id,
            status=status,
            is_unique=bool(data.get("is_unique", True)),
            acquisition_date=data.get("acquisition_date"),
            warranty_expiry_date=data.get("warranty_expiry_date"),
            assignment_date=data.get("assignment_date"),
            notes=data.get("notes", ""),
        )
        db.session.add(eq)
        db.session.flush()

        # Sauvegarder les IMEIs dans la table dédiée
        for slot, raw_imei in enumerate(imeis_list, start=1):
            db.session.add(EquipmentImei(
                equipment_id=eq.id,
                imei=raw_imei.strip(),
                slot_number=slot,
            ))

        user_id = int(g.current_user["id"]) if g.current_user else None
        history = EquipmentHistory(
            equipment_id=eq.id,
            action="CREATED",
            new_value=equipment_code,
            created_by_id=user_id,
        )
        db.session.add(history)
        db.session.commit()
        return jsonify(eq.to_dict_safe()), 201

    except IntegrityError:
        db.session.rollback()
        return error_response("Un équipement avec cet IMEI ou ce code existe déjà", 409)


@bp.get("/<int:id>")
@require_auth
def get_equipment(id):
    eq = Equipment.query.get(id)
    if not eq:
        return error_response("Equipment not found", 404)

    result = eq.to_dict_safe()
    result["history"] = [h.to_dict_safe() for h in sorted(eq.history, key=lambda h: h.created_at, reverse=True)]
    result["tickets"] = [t.to_dict_safe() for t in eq.repair_tickets]
    result["accessories"] = [a.to_dict_safe() for a in eq.accessories]

    # Sibling equipment (active, same employee/owner, excluding self)
    sibling_equipment = []
    if eq.employee_id:
        siblings = Equipment.query.filter(
            Equipment.employee_id == eq.employee_id,
            Equipment.id != eq.id,
            Equipment.status.in_(list(ACTIVE_STATUSES)),
        ).all()
        sibling_equipment = [s.to_dict_safe() for s in siblings]
    elif eq.owner_id:
        siblings = Equipment.query.filter(
            Equipment.owner_id == eq.owner_id,
            Equipment.id != eq.id,
            Equipment.status.in_(list(ACTIVE_STATUSES)),
        ).all()
        sibling_equipment = [s.to_dict_safe() for s in siblings]
    result["sibling_equipment"] = sibling_equipment

    return jsonify(result), 200


@bp.put("/<int:id>")
@require_auth
def update_equipment(id):
    eq = Equipment.query.get(id)
    if not eq:
        return error_response("Equipment not found", 404)

    # Block edits on inactive equipment (use cancel-declaration first)
    if not eq.is_active:
        return error_response(
            f"Équipement inactif ({eq.status}). Annulez la déclaration avant toute modification.",
            409
        )

    data = request.get_json(silent=True) or {}

    for field in ("equipment_type", "brand", "model_name", "imei", "serial_number", "notes", "reception_form_path"):
        if field in data:
            setattr(eq, field, data[field].strip() if isinstance(data[field], str) else data[field])
    if "is_unique" in data:
        eq.is_unique = bool(data["is_unique"])

    if "category_id" in data:
        eq.category_id = int(data["category_id"]) if data["category_id"] else None
    if "brand_id" in data:
        eq.brand_id = int(data["brand_id"]) if data["brand_id"] else None

    if "status" in data:
        old_status = eq.status
        new_status = data["status"]
        # Un équipement assigné ne peut pas être remis "En attente"
        effective_owner = data.get("owner_id", eq.owner_id)
        effective_employee = data.get("employee_id", eq.employee_id)
        if new_status == "PENDING" and (effective_owner or effective_employee):
            new_status = "FUNCTIONAL"
        if old_status != new_status:
            eq.status = new_status
            user_id = int(g.current_user["id"]) if g.current_user else None
            history = EquipmentHistory(
                equipment_id=eq.id,
                action="STATUS_CHANGED",
                old_value=old_status,
                new_value=new_status,
                created_by_id=user_id,
            )
            db.session.add(history)

    for date_field in ("acquisition_date", "warranty_expiry_date", "assignment_date"):
        if date_field in data:
            setattr(eq, date_field, data[date_field])

    try:
        db.session.commit()
        return jsonify(eq.to_dict_safe()), 200
    except IntegrityError:
        db.session.rollback()
        return error_response("Equipment with this IMEI already exists", 409)


@bp.post("/<int:id>/assign")
@require_auth
def assign_equipment(id):
    eq = Equipment.query.get(id)
    if not eq:
        return error_response("Equipment not found", 404)

    if not eq.is_active:
        return error_response(
            f"Équipement inactif ({eq.status}). Annulez la déclaration avant toute assignation.",
            409
        )

    # Un équipement unique déjà assigné ne peut pas être ré-assigné via ce endpoint
    # (utiliser la modification pour changer de propriétaire)
    if eq.is_unique and (eq.owner_id or eq.employee_id):
        current = eq.owner.get_full_name() if eq.owner else (eq.employee.get_full_name() if eq.employee else "quelqu'un")
        return error_response(
            f"Cet équipement unique est déjà assigné à {current}. "
            "Pour changer de propriétaire, utilisez la modification de l'équipement.",
            409
        )

    data = request.get_json(silent=True) or {}
    asc_id = data.get("owner_id") or data.get("asc_id")
    employee_id = data.get("employee_id")

    user_id = int(g.current_user["id"]) if g.current_user else None
    old_owner = eq.owner.get_full_name() if eq.owner else (eq.employee.get_full_name() if eq.employee else "None")

    if asc_id:
        owner = Employee.query.get(int(asc_id))
        if not owner:
            return error_response("Employee not found", 404)
        eq.owner_id = owner.id
        eq.employee_id = None
        eq.assignment_date = data.get("action_date") or datetime.now(timezone.utc).date()
        new_owner = owner.get_full_name()
        action = "ASSIGNED"
    elif employee_id:
        employee = Employee.query.get(int(employee_id))
        if not employee:
            return error_response("Employee not found", 404)
        eq.employee_id = employee.id
        eq.owner_id = None
        eq.assignment_date = data.get("action_date") or datetime.now(timezone.utc).date()
        new_owner = employee.get_full_name()
        action = "ASSIGNED_TO_EMPLOYEE"
    else:
        return error_response("owner_id or employee_id is required", 400)

    history = EquipmentHistory(
        equipment_id=eq.id,
        action=action,
        old_value=old_owner,
        new_value=new_owner,
        notes=data.get("notes", ""),
        created_by_id=user_id,
    )
    db.session.add(history)

    # Auto-transition PENDING → FUNCTIONAL when first assigned to someone
    if eq.status == "PENDING":
        db.session.add(EquipmentHistory(
            equipment_id=eq.id,
            action="STATUS_CHANGED",
            old_value="PENDING",
            new_value="FUNCTIONAL",
            notes="Passage automatique à Fonctionnel lors de l'assignation",
            created_by_id=user_id,
        ))
        eq.status = "FUNCTIONAL"

    db.session.commit()
    return jsonify(eq.to_dict_safe()), 200


@bp.post("/<int:id>/transfer")
@require_auth
def transfer_equipment(id):
    """Transfère un équipement d'un employé à un autre (autorisé même pour les équipements uniques)."""
    eq = Equipment.query.get(id)
    if not eq:
        return error_response("Equipment not found", 404)

    if not eq.is_active:
        return error_response(
            f"Équipement inactif ({eq.status}). Annulez la déclaration avant tout transfert.",
            409
        )

    data = request.get_json(silent=True) or {}
    employee_id = data.get("employee_id")
    if not employee_id:
        return error_response("employee_id est requis", 400)

    target = Employee.query.get(int(employee_id))
    if not target:
        return error_response("Employé cible introuvable", 404)

    if not target.is_active:
        return error_response("L'employé cible est inactif", 409)

    user_id = int(g.current_user["id"]) if g.current_user else None
    old_holder = eq.employee.get_full_name() if eq.employee else (eq.owner.get_full_name() if eq.owner else "Aucun")

    eq.employee_id = target.id
    eq.owner_id = None
    eq.assignment_date = data.get("action_date") or datetime.now(timezone.utc).date()
    if eq.status == "PENDING":
        eq.status = "FUNCTIONAL"

    db.session.add(EquipmentHistory(
        equipment_id=eq.id,
        action="TRANSFERRED",
        old_value=old_holder,
        new_value=target.get_full_name(),
        notes=data.get("notes", ""),
        created_by_id=user_id,
    ))
    db.session.commit()
    return jsonify(eq.to_dict_safe()), 200


@bp.post("/reserve")
@require_auth
def declare_reserve():
    """Assign multiple equipment to an employee as reserve (status stays PENDING)."""
    data = request.get_json(silent=True) or {}
    employee_id = data.get("employee_id")
    equipment_ids = data.get("equipment_ids", [])
    notes = data.get("notes", "").strip()
    action_date = data.get("action_date")

    if not employee_id or not equipment_ids:
        return error_response("employee_id et equipment_ids sont requis", 400)

    employee = Employee.query.get(int(employee_id))
    if not employee:
        return error_response("Employé introuvable", 404)
    if not employee.is_active:
        return error_response("L'employé est inactif", 409)

    user_id = int(g.current_user["id"]) if g.current_user else None
    assignment_date = action_date or datetime.now(timezone.utc).date().isoformat()
    updated = []

    for eq_id in equipment_ids:
        eq = Equipment.query.get(int(eq_id))
        if not eq or not eq.is_active:
            continue
        old_holder = (
            eq.employee.get_full_name() if eq.employee else
            (eq.owner.get_full_name() if eq.owner else "Aucun")
        )
        eq.employee_id = employee.id
        eq.owner_id = None
        eq.assignment_date = assignment_date
        # Status stays PENDING — reserve stock for distribution
        db.session.add(EquipmentHistory(
            equipment_id=eq.id,
            action="ASSIGNED_RESERVE",
            old_value=old_holder,
            new_value=employee.get_full_name(),
            notes=notes or "Déclaré en réserve",
            created_by_id=user_id,
        ))
        updated.append(eq)

    db.session.commit()
    return jsonify([e.to_dict_safe() for e in updated]), 200


@bp.post("/<int:id>/declare")
@require_auth
def declare_equipment(id):
    """Déclare un équipement actif comme Perdu / Volé / Emporté / Complètement gâté."""
    from backend.src.equipment_manager.models.tickets import RepairTicket, TicketEvent

    eq = Equipment.query.get(id)
    if not eq:
        return error_response("Equipment not found", 404)

    if not eq.is_active:
        return error_response(
            f"Équipement déjà inactif ({eq.status}). Annulez la déclaration existante pour en créer une nouvelle.",
            409
        )

    data = request.get_json(silent=True) or {}
    declaration = data.get("declaration", "").strip().upper()
    reason = data.get("reason", "").strip()
    notes = data.get("notes", "").strip()
    action_date = data.get("action_date", "").strip()

    valid = {"LOST", "STOLEN", "TAKEN_AWAY", "COMPLETELY_DAMAGED"}
    if declaration not in valid:
        return error_response(f"declaration doit être l'une de : {', '.join(sorted(valid))}", 400)
    if not reason:
        return error_response("reason est obligatoire", 400)

    user_id = int(g.current_user["id"]) if g.current_user else None
    old_status = eq.status

    eq.status = declaration  # LOST | STOLEN | TAKEN_AWAY | COMPLETELY_DAMAGED

    # If COMPLETELY_DAMAGED and there is an open repair ticket → close it
    if declaration == "COMPLETELY_DAMAGED":
        active_ticket = RepairTicket.query.filter(
            RepairTicket.equipment_id == eq.id,
            RepairTicket.status.notin_(["CLOSED", "CANCELLED"])
        ).first()
        if active_ticket:
            active_ticket.status = "CLOSED"
            active_ticket.closed_date = datetime.now(timezone.utc)
            db.session.add(TicketEvent(
                ticket_id=active_ticket.id,
                event_type="DAMAGED",
                user_id=user_id,
                from_role=active_ticket.current_stage,
                to_role=active_ticket.current_stage,
                comment=f"Équipement déclaré complètement gâté. {reason}",
            ))

    action = DECLARATION_ACTION_MAP[declaration]
    combined_notes = f"{('[' + action_date + '] ') if action_date else ''}{reason}{(' — ' + notes) if notes else ''}"
    db.session.add(EquipmentHistory(
        equipment_id=eq.id,
        action=action,
        old_value=old_status,
        new_value=declaration,
        notes=combined_notes,
        created_by_id=user_id,
    ))

    db.session.commit()
    return jsonify(eq.to_dict_safe()), 200


@bp.post("/<int:id>/cancel-declaration")
@require_auth
def cancel_declaration(id):
    """Annule une déclaration (LOST/STOLEN/TAKEN_AWAY/COMPLETELY_DAMAGED) → PENDING."""
    eq = Equipment.query.get(id)
    if not eq:
        return error_response("Equipment not found", 404)

    if eq.is_active:
        return error_response("Cet équipement n'a pas de déclaration active à annuler.", 409)

    data = request.get_json(silent=True) or {}
    notes = data.get("notes", "").strip()
    action_date = data.get("action_date", "").strip()
    user_id = int(g.current_user["id"]) if g.current_user else None
    old_status = eq.status

    # Si l'équipement est assigné à quelqu'un, le remettre Fonctionnel plutôt qu'En attente
    new_status = "FUNCTIONAL" if (eq.owner_id or eq.employee_id) else "PENDING"
    eq.status = new_status
    combined_notes = f"{('[' + action_date + '] ') if action_date else ''}{notes or 'Annulation de la déclaration'}"
    db.session.add(EquipmentHistory(
        equipment_id=eq.id,
        action="DECLARATION_CANCELLED",
        old_value=old_status,
        new_value=new_status,
        notes=combined_notes,
        created_by_id=user_id,
    ))

    db.session.commit()
    return jsonify(eq.to_dict_safe()), 200


@bp.get("/<int:id>/history")
@require_auth
def get_equipment_history(id):
    eq = Equipment.query.get(id)
    if not eq:
        return error_response("Equipment not found", 404)

    history = sorted(eq.history, key=lambda h: h.created_at, reverse=True)
    return jsonify([h.to_dict_safe() for h in history]), 200


# ─── ACCESSORIES ──────────────────────────────────────────────────────────────

@bp.get("/<int:id>/accessories")
@require_auth
def list_accessories(id):
    eq = Equipment.query.get(id)
    if not eq:
        return error_response("Equipment not found", 404)
    return jsonify([a.to_dict_safe() for a in eq.accessories]), 200


@bp.post("/<int:id>/accessories")
@require_auth
def create_accessory(id):
    eq = Equipment.query.get(id)
    if not eq:
        return error_response("Equipment not found", 404)

    data = request.get_json(silent=True) or {}
    name = data.get("name", "").strip()
    if not name:
        return error_response("name is required", 400)

    acc = Accessory(
        equipment_id=eq.id,
        name=name,
        description=data.get("description", ""),
        serial_number=data.get("serial_number", ""),
        status=data.get("status", "FUNCTIONAL"),
    )
    db.session.add(acc)
    db.session.commit()
    return jsonify(acc.to_dict_safe()), 201


@bp.put("/<int:id>/accessories/<int:acc_id>")
@require_auth
def update_accessory(id, acc_id):
    acc = Accessory.query.filter_by(id=acc_id, equipment_id=id).first()
    if not acc:
        return error_response("Accessory not found", 404)

    data = request.get_json(silent=True) or {}
    for field in ("name", "description", "serial_number", "status"):
        if field in data:
            setattr(acc, field, data[field].strip() if isinstance(data[field], str) else data[field])

    db.session.commit()
    return jsonify(acc.to_dict_safe()), 200


@bp.delete("/<int:id>/accessories/<int:acc_id>")
@require_auth
def delete_accessory(id, acc_id):
    acc = Accessory.query.filter_by(id=acc_id, equipment_id=id).first()
    if not acc:
        return error_response("Accessory not found", 404)

    db.session.delete(acc)
    db.session.commit()
    return jsonify({"message": "Accessory deleted"}), 200


# ─── GÉNÉRATION PDF ────────────────────────────────────────────────────────────

_STATUS_LABELS = {
    "PENDING":            "En attente",
    "FUNCTIONAL":         "Fonctionnel",
    "FAULTY":             "Défaillant",
    "UNDER_REPAIR":       "En réparation",
    "COMPLETELY_DAMAGED": "Complètement gâté",
    "LOST":               "Perdu",
    "STOLEN":             "Volé",
    "TAKEN_AWAY":         "Emporté",
}


@bp.get("/<int:id>/pdf/reception")
@require_auth
def generate_reception_pdf(id):
    from backend.src.docs_generetor.pdf_generator import IMG_DIR

    eq = Equipment.query.get(id)
    if not eq:
        return error_response("Equipment not found", 404)

    employee = eq.owner or eq.employee
    accessories = [a.name for a in eq.accessories]

    # Date de réception = date d'attribution de l'équipement
    if eq.assignment_date:
        date_reception = eq.assignment_date.strftime("%d/%m/%Y")
    else:
        date_reception = "—"

    # District = département de l'employé ; Zone = département racine (si différent)
    dept = employee.department if employee else None
    root = dept.root_department if dept else None
    district = dept.name if dept else "—"
    zone = root.name if (root and root.id != getattr(dept, "id", None)) else "—"

    context = {
        "logo_uri": (IMG_DIR / "Logo_Integrate_Health.png").as_uri(),
        # En-tête
        "date_reception": date_reception,
        "ref_ih": f"EQ-{eq.imei}",
        # Employé
        "employee_name": employee.get_full_name() if employee else "—",
        "employee_position": (
            employee.position_rel.name if employee and employee.position_rel else "—"
        ),
        "employee_district": district,
        "employee_zone": zone,
        "employee_phone": employee.phone if employee else "—",
        "employee_role_label": (
            employee.position_rel.name if employee and employee.position_rel else "ASC"
        ),
        # Équipement
        "equipment_type": (
            eq.category_rel.name if eq.category_rel else eq.equipment_type or "—"
        ),
        "equipment_brand": (
            eq.brand_rel.name if eq.brand_rel else eq.brand or "—"
        ),
        "equipment_model": eq.model_name or "—",
        "equipment_description": eq.serial_number or eq.notes or "—",
        "equipment_imei": eq.imei,
        "accessories_str": ", ".join(accessories) if accessories else "—",
    }

    filename = f"fiche_reception_{eq.imei}.pdf"
    return pdf_response("fiche_reception", context, filename)
