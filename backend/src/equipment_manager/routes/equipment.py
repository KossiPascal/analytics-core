from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, g
from sqlalchemy.exc import IntegrityError

from backend.src.databases.extensions import db, error_response
from backend.src.security.access_security import require_auth
from backend.src.equipment_manager.models.equipment import Equipment, EquipmentHistory, Accessory
from backend.src.equipment_manager.models.asc import ASC
from backend.src.equipment_manager.models.employees import Employee
from backend.src.logger import get_backend_logger

logger = get_backend_logger(__name__)

bp = Blueprint("em_equipment", __name__, url_prefix="/api/equipment/assets")


@bp.get("")
@require_auth
def list_equipment():
    query = Equipment.query

    asc_id = request.args.get("asc_id")
    employee_id = request.args.get("employee_id")
    status = request.args.get("status")
    eq_type = request.args.get("type")

    if asc_id:
        query = query.filter_by(owner_id=int(asc_id))
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

    if not equipment_type or not brand or not model_name or not imei:
        return error_response("equipment_type, brand, model_name and imei are required", 400)

    if equipment_type not in ("PHONE", "TABLET", "OTHER"):
        return error_response("equipment_type must be PHONE, TABLET or OTHER", 400)

    try:
        eq = Equipment(
            equipment_type=equipment_type,
            brand=brand,
            model_name=model_name,
            imei=imei,
            serial_number=data.get("serial_number", ""),
            owner_id=int(data["owner_id"]) if data.get("owner_id") else None,
            employee_id=int(data["employee_id"]) if data.get("employee_id") else None,
            status=data.get("status", "FUNCTIONAL"),
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
    return jsonify(result), 200


@bp.put("/<int:id>")
@require_auth
def update_equipment(id):
    eq = Equipment.query.get(id)
    if not eq:
        return error_response("Equipment not found", 404)

    data = request.get_json(silent=True) or {}

    for field in ("equipment_type", "brand", "model_name", "imei", "serial_number", "notes", "reception_form_path"):
        if field in data:
            setattr(eq, field, data[field].strip() if isinstance(data[field], str) else data[field])

    if "status" in data:
        old_status = eq.status
        new_status = data["status"]
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

    data = request.get_json(silent=True) or {}
    asc_id = data.get("asc_id")
    employee_id = data.get("employee_id")

    user_id = int(g.current_user["id"]) if g.current_user else None
    old_owner = eq.owner.get_full_name() if eq.owner else (eq.employee.get_full_name() if eq.employee else "None")

    if asc_id:
        asc = ASC.query.get(int(asc_id))
        if not asc:
            return error_response("ASC not found", 404)
        eq.owner_id = asc.id
        eq.employee_id = None
        eq.assignment_date = datetime.now(timezone.utc).date()
        new_owner = asc.get_full_name()
        action = "ASSIGNED"
    elif employee_id:
        employee = Employee.query.get(int(employee_id))
        if not employee:
            return error_response("Employee not found", 404)
        eq.employee_id = employee.id
        eq.owner_id = None
        eq.assignment_date = datetime.now(timezone.utc).date()
        new_owner = employee.get_full_name()
        action = "ASSIGNED_TO_EMPLOYEE"
    else:
        return error_response("asc_id or employee_id is required", 400)

    history = EquipmentHistory(
        equipment_id=eq.id,
        action=action,
        old_value=old_owner,
        new_value=new_owner,
        notes=data.get("notes", ""),
        created_by_id=user_id,
    )
    db.session.add(history)
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
