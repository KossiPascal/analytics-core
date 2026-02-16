from flask import Blueprint, request, jsonify, g
from sqlalchemy.exc import IntegrityError

from backend.src.databases.extensions import db, error_response
from backend.src.security.access_security import require_auth
from backend.src.equipment_manager.models.asc import Supervisor, em_supervisor_sites
from backend.src.models.auth import User
from backend.src.equipment_manager.models.locations import District, Site
from backend.src.logger import get_backend_logger

logger = get_backend_logger(__name__)

bp = Blueprint("em_supervisors", __name__, url_prefix="/api/equipment/supervisors")


@bp.get("")
@require_auth
def list_supervisors():
    supervisors = Supervisor.query.order_by(Supervisor.last_name, Supervisor.first_name).all()
    return jsonify([s.to_dict_safe() for s in supervisors]), 200


@bp.post("")
@require_auth
def create_supervisor():
    data = request.get_json(silent=True) or {}

    first_name = data.get("first_name", "").strip()
    last_name = data.get("last_name", "").strip()
    email = data.get("email", "").strip()
    phone = data.get("phone", "").strip()
    district_id = data.get("district_id")
    site_ids = data.get("site_ids", [])

    if not first_name or not last_name:
        return error_response("first_name and last_name are required", 400)
    if not district_id:
        return error_response("district_id is required", 400)

    district = District.query.get(int(district_id))
    if not district:
        return error_response("District not found", 404)

    # Validate sites belong to district
    sites = []
    if site_ids:
        sites = Site.query.filter(Site.id.in_([int(s) for s in site_ids]), Site.district_id == district.id).all()

    # Generate supervisor code: [DISTRICT_CODE]-SUP-[###]
    existing_count = db.session.query(Supervisor).join(
        em_supervisor_sites, Supervisor.id == em_supervisor_sites.c.supervisor_id
    ).join(Site, em_supervisor_sites.c.site_id == Site.id).filter(
        Site.district_id == district.id
    ).distinct().count()

    seq = existing_count + 1
    code = f"{district.code}-SUP-{str(seq).zfill(3)}"
    while Supervisor.query.filter_by(code=code).first():
        seq += 1
        code = f"{district.code}-SUP-{str(seq).zfill(3)}"

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

        # Create supervisor profile
        supervisor = Supervisor(
            user_id=user.id,
            code=code,
            first_name=first_name,
            last_name=last_name,
            email=email,
            phone=phone,
        )
        db.session.add(supervisor)
        db.session.flush()

        # Assign sites
        for site in sites:
            db.session.execute(
                em_supervisor_sites.insert().values(supervisor_id=supervisor.id, site_id=site.id)
            )

        db.session.commit()

        result = supervisor.to_dict_safe()
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
    supervisor = Supervisor.query.get(id)
    if not supervisor:
        return error_response("Supervisor not found", 404)
    return jsonify(supervisor.to_dict_safe()), 200


@bp.put("/<int:id>")
@require_auth
def update_supervisor(id):
    supervisor = Supervisor.query.get(id)
    if not supervisor:
        return error_response("Supervisor not found", 404)

    data = request.get_json(silent=True) or {}

    for field in ("first_name", "last_name", "email", "phone"):
        if field in data:
            setattr(supervisor, field, data[field].strip() if isinstance(data[field], str) else data[field])

    # Update associated user
    user = User.query.get(supervisor.user_id)
    if user:
        if "first_name" in data or "last_name" in data:
            user.fullname = f"{supervisor.first_name} {supervisor.last_name}"
        if "email" in data:
            user.email = data["email"].strip() or None
        if "phone" in data:
            user.phone = data["phone"].strip()

    # Update sites
    site_ids = data.get("site_ids")
    if site_ids is not None:
        district_id = data.get("district_id")
        if district_id:
            sites = Site.query.filter(
                Site.id.in_([int(s) for s in site_ids]),
                Site.district_id == int(district_id),
            ).all()
        else:
            sites = Site.query.filter(Site.id.in_([int(s) for s in site_ids])).all()

        # Clear and reassign
        db.session.execute(em_supervisor_sites.delete().where(em_supervisor_sites.c.supervisor_id == supervisor.id))
        for site in sites:
            db.session.execute(
                em_supervisor_sites.insert().values(supervisor_id=supervisor.id, site_id=site.id)
            )

    try:
        db.session.commit()
        return jsonify(supervisor.to_dict_safe()), 200
    except IntegrityError:
        db.session.rollback()
        return error_response("Update failed (duplicate data)", 409)
