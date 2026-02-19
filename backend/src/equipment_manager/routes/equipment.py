from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, g
from sqlalchemy.exc import IntegrityError

from backend.src.databases.extensions import db, error_response
from backend.src.security.access_security import require_auth
from backend.src.equipment_manager.models.equipment import (
    EquipmentCategory, EquipmentBrand, Equipment, EquipmentHistory, Accessory,
    ACTIVE_STATUSES, INACTIVE_STATUSES, DECLARATION_ACTION_MAP,
)
from backend.src.equipment_manager.models.employees import Employee
from backend.src.docs_generetor.pdf_generator import pdf_response
from backend.src.logger import get_backend_logger

logger = get_backend_logger(__name__)

bp = Blueprint("em_equipment", __name__, url_prefix="/api/equipment/assets")


# ─── CATEGORIES (Types d'equipement) ─────────────────────────────────────────

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
        return error_response("name and code are required", 400)
    try:
        cat = EquipmentCategory(
            name=name, code=code,
            description=data.get("description", ""),
            is_active=True,
        )
        db.session.add(cat)
        db.session.commit()
        return jsonify(cat.to_dict_safe()), 201
    except IntegrityError:
        db.session.rollback()
        return error_response("Category with this name or code already exists", 409)


@bp.put("/categories/<int:id>")
@require_auth
def update_category(id):
    cat = EquipmentCategory.query.get(id)
    if not cat:
        return error_response("Category not found", 404)
    data = request.get_json(silent=True) or {}
    for field in ("name", "code", "description"):
        if field in data:
            setattr(cat, field, data[field].strip() if isinstance(data[field], str) else data[field])
    if "is_active" in data:
        cat.is_active = bool(data["is_active"])
    try:
        db.session.commit()
        return jsonify(cat.to_dict_safe()), 200
    except IntegrityError:
        db.session.rollback()
        return error_response("Category with this name or code already exists", 409)


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

    equipment_type = data.get("equipment_type", "").strip()
    brand = data.get("brand", "").strip()
    model_name = data.get("model_name", "").strip()
    imei = data.get("imei", "").strip()
    category_id = data.get("category_id")
    brand_id = data.get("brand_id")

    if not model_name or not imei:
        return error_response("model_name and imei are required", 400)

    try:
        owner_id = int(data["owner_id"]) if data.get("owner_id") else None
        employee_id = int(data["employee_id"]) if data.get("employee_id") else None
        status = data.get("status", "PENDING")
        # Un équipement assigné à quelqu'un ne peut pas rester "En attente"
        if (owner_id or employee_id) and status == "PENDING":
            status = "FUNCTIONAL"

        eq = Equipment(
            equipment_type=equipment_type,
            category_id=int(category_id) if category_id else None,
            brand=brand,
            brand_id=int(brand_id) if brand_id else None,
            model_name=model_name,
            imei=imei,
            serial_number=data.get("serial_number", ""),
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

        # Log creation
        user_id = int(g.current_user["id"]) if g.current_user else None
        history = EquipmentHistory(
            equipment_id=eq.id,
            action="CREATED",
            new_value=f"{brand} {model_name} ({imei})",
            created_by_id=user_id,
        )
        db.session.add(history)
        db.session.commit()
        return jsonify(eq.to_dict_safe()), 201

    except IntegrityError:
        db.session.rollback()
        return error_response("Equipment with this IMEI already exists", 409)


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
