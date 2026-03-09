from flask import Blueprint, request, jsonify
from backend.src.databases.extensions import db
from backend.src.security.access_security import require_auth
from backend.src.equipment_manager.models.locations import Region, District, Site
from backend.src.logger import get_backend_logger

from werkzeug.exceptions import BadRequest
from sqlalchemy.exc import IntegrityError

logger = get_backend_logger(__name__)

bp = Blueprint("em_locations", __name__, url_prefix="/api/equipment/locations")


# ─── REGIONS ─────────────────────────────────────────────────────────────────

@bp.get("/regions")
@require_auth
def list_regions():
    regions = Region.query.order_by(Region.name).all()
    return jsonify([r.to_dict_safe() for r in regions]), 200


@bp.post("/regions")
@require_auth
def create_region():
    data = request.get_json(silent=True) or {}
    name = data.get("name", "").strip()
    code = data.get("code", "").strip()

    if not name or not code:
        raise BadRequest("name and code are required", 400)

    try:
        region = Region(name=name, code=code)
        db.session.add(region)
        db.session.commit()
        return jsonify(region.to_dict_safe()), 201
    
    except IntegrityError:
        db.session.rollback()
        raise BadRequest("Region with this name or code already exists", 409)


@bp.get("/regions/<int:id>")
@require_auth
def get_region(id):
    region = Region.query.get(id)
    if not region:
        raise BadRequest("Region not found", 404)
    
    result = region.to_dict_safe()
    result["districts"] = [d.to_dict_safe() for d in region.districts]
    return jsonify(result), 200


@bp.put("/regions/<int:id>")
@require_auth
def update_region(id):
    region = Region.query.get(id)
    if not region:
        raise BadRequest("Region not found", 404)

    data = request.get_json(silent=True) or {}
    if "name" in data:
        region.name = data["name"].strip()
    if "code" in data:
        region.code = data["code"].strip()

    try:
        db.session.commit()
        return jsonify(region.to_dict_safe()), 200
    except IntegrityError:
        db.session.rollback()
        raise BadRequest("Region with this name or code already exists", 409)


@bp.delete("/regions/<int:id>")
@require_auth
def delete_region(id):
    region = Region.query.get(id)
    if not region:
        raise BadRequest("Region not found", 404)
    db.session.delete(region)
    db.session.commit()
    return jsonify({"message": "Region deleted"}), 200


# ─── DISTRICTS ───────────────────────────────────────────────────────────────

@bp.get("/districts")
@require_auth
def list_districts():
    query = District.query
    region_id = request.args.get("region_id")
    if region_id:
        query = query.filter_by(region_id=int(region_id))
    districts = query.order_by(District.name).all()
    return jsonify([d.to_dict_safe() for d in districts]), 200


@bp.post("/districts")
@require_auth
def create_district():
    data = request.get_json(silent=True) or {}
    name = data.get("name", "").strip()
    code = data.get("code", "").strip()
    region_id = data.get("region_id")

    if not name or not code or not region_id:
        raise BadRequest("name, code and region_id are required", 400)

    region = Region.query.get(int(region_id))
    if not region:
        raise BadRequest("Region not found", 404)

    try:
        district = District(name=name, code=code, region_id=region.id)
        db.session.add(district)
        db.session.commit()
        return jsonify(district.to_dict_safe()), 201
    except IntegrityError:
        db.session.rollback()
        raise BadRequest("District with this code already exists in this region", 409)


@bp.get("/districts/<int:id>")
@require_auth
def get_district(id):
    district = District.query.get(id)
    if not district:
        raise BadRequest("District not found", 404)
    result = district.to_dict_safe()
    result["sites"] = [s.to_dict_safe() for s in district.sites]
    return jsonify(result), 200


@bp.put("/districts/<int:id>")
@require_auth
def update_district(id):
    district = District.query.get(id)
    if not district:
        raise BadRequest("District not found", 404)

    data = request.get_json(silent=True) or {}
    if "name" in data:
        district.name = data["name"].strip()
    if "code" in data:
        district.code = data["code"].strip()
    if "region_id" in data:
        district.region_id = int(data["region_id"])

    try:
        db.session.commit()
        return jsonify(district.to_dict_safe()), 200
    except IntegrityError:
        db.session.rollback()
        raise BadRequest("District with this code already exists in this region", 409)


# ─── SITES ───────────────────────────────────────────────────────────────────

@bp.get("/sites")
@require_auth
def list_sites():
    query = Site.query
    district_id = request.args.get("district_id")
    if district_id:
        query = query.filter_by(district_id=int(district_id))
    sites = query.order_by(Site.name).all()
    return jsonify([s.to_dict_safe() for s in sites]), 200


@bp.post("/sites")
@require_auth
def create_site():
    data = request.get_json(silent=True) or {}
    name = data.get("name", "").strip()
    code = data.get("code", "").strip()
    district_id = data.get("district_id")

    if not name or not code or not district_id:
        raise BadRequest("name, code and district_id are required", 400)

    district = District.query.get(int(district_id))
    if not district:
        raise BadRequest("District not found", 404)

    try:
        site = Site(
            name=name, code=code, district_id=district.id,
            address=data.get("address", ""),
            phone=data.get("phone", ""),
        )
        db.session.add(site)
        db.session.commit()
        return jsonify(site.to_dict_safe()), 201
    except IntegrityError:
        db.session.rollback()
        raise BadRequest("Site with this code already exists", 409)


@bp.get("/sites/<int:id>")
@require_auth
def get_site(id):
    site = Site.query.get(id)
    if not site:
        raise BadRequest("Site not found", 404)
    return jsonify(site.to_dict_safe()), 200


@bp.put("/sites/<int:id>")
@require_auth
def update_site(id):
    site = Site.query.get(id)
    if not site:
        raise BadRequest("Site not found", 404)

    data = request.get_json(silent=True) or {}
    for field in ("name", "code", "address", "phone"):
        if field in data:
            setattr(site, field, data[field].strip() if isinstance(data[field], str) else data[field])
    if "district_id" in data:
        site.district_id = int(data["district_id"])

    try:
        db.session.commit()
        return jsonify(site.to_dict_safe()), 200
    except IntegrityError:
        db.session.rollback()
        raise BadRequest("Site with this code already exists", 409)
