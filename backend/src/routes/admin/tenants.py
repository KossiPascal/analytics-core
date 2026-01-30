from flask import Blueprint, request, jsonify
from sqlalchemy.exc import IntegrityError
from datetime import datetime
from database.extensions import db
from models.auth import Tenant

bp = Blueprint("tenants", __name__, url_prefix="/api/tenants")


# -------------------- HELPERS --------------------
def get_json():
    if not request.is_json:
        return None, jsonify({"error": "Invalid JSON payload"}), 400
    return request.get_json(), None, None


# -------------------- TENANTS --------------------
@bp.route("", methods=["GET"])
def get_tenants():
    tenants:list[Tenant] = Tenant.query.filter_by(deleted=False).order_by(Tenant.name).all()
    return jsonify([t.to_dict_safe() for t in tenants]), 200


@bp.route("/<uuid:id>", methods=["GET"])
def get_tenant(id):
    tenant:Tenant = Tenant.query.filter_by(id=id, deleted=False).first()
    if not tenant:
        return jsonify({"error": "Tenant not found"}), 404
    return jsonify(tenant.to_dict_safe()), 200


@bp.route("", methods=["POST"])
def create_tenant():
    data, error, status = get_json()
    if error:
        return error, status

    name = data.get("name", "").strip()
    if not name:
        return jsonify({"error": "Tenant name is required"}), 400

    existing:Tenant = Tenant.query.filter_by(name=name).first()
    if existing:
        if existing.deleted:
            # 🔁 Réactivation
            existing.deleted = False
            existing.deleted_at = None
            db.session.commit()
            return jsonify(existing.to_dict_safe()), 200
        return jsonify({"error": "Tenant already exists"}), 409

    tenant = Tenant(name=name)
    db.session.add(tenant)

    try:
        db.session.commit()
        return jsonify(tenant.to_dict_safe()), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Tenant already exists"}), 409


@bp.route("/<uuid:id>", methods=["PUT"])
def replace_tenant(id):
    data, error, status = get_json()
    if error:
        return error, status

    tenant:Tenant = Tenant.query.filter_by(id=id, deleted=False).first()
    if not tenant:
        return jsonify({"error": "Tenant not found"}), 404

    name = data.get("name", "").strip()
    if not name:
        return jsonify({"error": "Tenant name is required"}), 400

    tenant.name = name

    try:
        db.session.commit()
        return jsonify(tenant.to_dict_safe()), 200
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Tenant name already exists"}), 409


@bp.route("/<uuid:id>", methods=["PATCH"])
def update_tenant(id):
    data, error, status = get_json()
    if error:
        return error, status

    tenant:Tenant = Tenant.query.filter_by(id=id, deleted=False).first()
    if not tenant:
        return jsonify({"error": "Tenant not found"}), 404

    if "name" in data:
        name = data["name"].strip()
        if not name:
            return jsonify({"error": "Tenant name cannot be empty"}), 400
        tenant.name = name

    try:
        db.session.commit()
        return jsonify(tenant.to_dict_safe()), 200
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Tenant name already exists"}), 409


@bp.route("/<uuid:id>", methods=["DELETE"])
def delete_tenant(id):
    tenant:Tenant = Tenant.query.filter_by(id=id, deleted=False).first()
    if not tenant:
        return jsonify({"error": "Tenant not found"}), 404

    # 🔐 Soft delete
    tenant.deleted = True
    tenant.deleted_at = datetime.utcnow()

    db.session.commit()
    return jsonify({"success": True}), 200
