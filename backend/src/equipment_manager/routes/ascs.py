from flask import Blueprint, request, jsonify
from sqlalchemy.exc import IntegrityError

from backend.src.databases.extensions import db, error_response
from backend.src.security.access_security import require_auth
from backend.src.equipment_manager.models.asc import ASC
from backend.src.equipment_manager.models.locations import Site, ZoneASC
from backend.src.logger import get_backend_logger

logger = get_backend_logger(__name__)

bp = Blueprint("em_ascs", __name__, url_prefix="/api/equipment/ascs")


@bp.get("")
@require_auth
def list_ascs():
    query = ASC.query.filter_by(is_active=True)

    supervisor_id = request.args.get("supervisor_id")
    site_id = request.args.get("site_id")
    search = request.args.get("search", "").strip()

    if supervisor_id:
        query = query.filter_by(supervisor_id=int(supervisor_id))
    if site_id:
        query = query.filter_by(site_id=int(site_id))
    if search:
        query = query.filter(
            db.or_(
                ASC.code.ilike(f"%{search}%"),
                ASC.first_name.ilike(f"%{search}%"),
                ASC.last_name.ilike(f"%{search}%"),
            )
        )

    ascs = query.order_by(ASC.last_name, ASC.first_name).all()
    return jsonify([a.to_dict_safe() for a in ascs]), 200


@bp.post("")
@require_auth
def create_asc():
    data = request.get_json(silent=True) or {}

    first_name = data.get("first_name", "").strip()
    last_name = data.get("last_name", "").strip()
    code = data.get("code", "").strip()
    site_id = data.get("site_id")

    if not first_name or not last_name or not code:
        return error_response("first_name, last_name and code are required", 400)

    site = None
    if site_id:
        site = Site.query.get(int(site_id))
        if not site:
            return error_response("Site not found", 404)

    try:
        asc = ASC(
            first_name=first_name,
            last_name=last_name,
            code=code,
            gender=data.get("gender", ""),
            phone=data.get("phone", ""),
            email=data.get("email", ""),
            site_id=site.id if site else None,
            supervisor_id=int(data["supervisor_id"]) if data.get("supervisor_id") else None,
            start_date=data.get("start_date"),
            notes=data.get("notes", ""),
            is_active=True,
        )
        db.session.add(asc)
        db.session.flush()

        # Auto-create ZoneASC
        if site:
            zone = ZoneASC.query.filter_by(site_id=site.id, code=code).first()
            if not zone:
                zone = ZoneASC(site_id=site.id, code=code, name=f"Zone {first_name} {last_name}")
                db.session.add(zone)
                db.session.flush()
            asc.zone_asc_id = zone.id

        db.session.commit()
        return jsonify(asc.to_dict_safe()), 201
    except IntegrityError:
        db.session.rollback()
        return error_response("ASC with this code already exists", 409)


@bp.get("/<int:id>")
@require_auth
def get_asc(id):
    asc = ASC.query.get(id)
    if not asc:
        return error_response("ASC not found", 404)

    result = asc.to_dict_safe()
    result["equipments"] = [e.to_dict_safe() for e in asc.equipments]
    result["tickets"] = [t.to_dict_safe() for t in asc.repair_tickets]
    return jsonify(result), 200


@bp.put("/<int:id>")
@require_auth
def update_asc(id):
    asc = ASC.query.get(id)
    if not asc:
        return error_response("ASC not found", 404)

    data = request.get_json(silent=True) or {}

    for field in ("first_name", "last_name", "code", "gender", "phone", "email", "notes"):
        if field in data:
            setattr(asc, field, data[field].strip() if isinstance(data[field], str) else data[field])

    if "site_id" in data:
        asc.site_id = int(data["site_id"]) if data["site_id"] else None
    if "zone_asc_id" in data:
        asc.zone_asc_id = int(data["zone_asc_id"]) if data["zone_asc_id"] else None
    if "supervisor_id" in data:
        asc.supervisor_id = int(data["supervisor_id"]) if data["supervisor_id"] else None
    if "is_active" in data:
        asc.is_active = bool(data["is_active"])
    if "start_date" in data:
        asc.start_date = data["start_date"]
    if "end_date" in data:
        asc.end_date = data["end_date"]

    try:
        db.session.commit()
        return jsonify(asc.to_dict_safe()), 200
    except IntegrityError:
        db.session.rollback()
        return error_response("ASC with this code already exists", 409)


@bp.delete("/<int:id>")
@require_auth
def delete_asc(id):
    asc = ASC.query.get(id)
    if not asc:
        return error_response("ASC not found", 404)

    # Soft delete
    asc.is_active = False
    db.session.commit()
    return jsonify({"message": "ASC deactivated"}), 200
