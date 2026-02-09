from flask import Blueprint, request, jsonify
from sqlalchemy.exc import IntegrityError
from backend.src.databases.extensions import db
from backend.src.models.auth import Permission

bp = Blueprint("permissions", __name__, url_prefix="/api/permissions")


# -------------------- HELPERS --------------------
def get_json():
    if not request.is_json:
        return None, jsonify({"error": "Invalid JSON payload"}), 400
    return request.get_json(), None, None


# -------------------- PERMISSIONS --------------------
@bp.route("", methods=["GET"])
def get_permissions():
    perms:list[Permission] = Permission.query.filter_by(deleted=False).order_by(Permission.name).all()
    return jsonify([p.to_dict_safe() for p in perms]), 200


@bp.route("/<uuid:id>", methods=["GET"])
def get_permission(id):
    p:Permission = Permission.query.filter_by(id=id, deleted=False).first()
    if not p:
        return jsonify({"error": "Permission not found"}), 404
    return jsonify(p.to_dict_safe()), 200


@bp.route("", methods=["POST"])
def create_permission():
    data, error, status = get_json()
    if error:
        return error, status

    name = data.get("name", "").strip()
    description = data.get("description")

    if not name:
        return jsonify({"error": "Permission name is required"}), 400

    # 🔐 Vérifie si une permission supprimée existe déjà
    existing = Permission.query.filter_by(name=name).first()
    if existing:
        if existing.deleted:
            existing.deleted = False
            existing.description = description
            db.session.commit()
            return jsonify(existing.to_dict_safe()), 200
        return jsonify({"error": "Permission already exists"}), 409

    p = Permission(name=name, description=description)
    db.session.add(p)

    try:
        db.session.commit()
        return jsonify(p.to_dict_safe()), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Permission already exists"}), 409


@bp.route("/<uuid:id>", methods=["PUT"])
def replace_permission(id):
    data, error, status = get_json()
    if error:
        return error, status

    p:Permission = Permission.query.filter_by(id=id, deleted=False).first()
    if not p:
        return jsonify({"error": "Permission not found"}), 404

    name = data.get("name", "").strip()
    if not name:
        return jsonify({"error": "Permission name is required"}), 400

    p.name = name
    p.description = data.get("description")

    try:
        db.session.commit()
        return jsonify(p.to_dict_safe()), 200
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Permission name already exists"}), 409


@bp.route("/<uuid:id>", methods=["PATCH"])
def update_permission(id):
    data, error, status = get_json()
    if error:
        return error, status

    p:Permission = Permission.query.filter_by(id=id, deleted=False).first()
    if not p:
        return jsonify({"error": "Permission not found"}), 404

    if "name" in data:
        name = data["name"].strip()
        if not name:
            return jsonify({"error": "Permission name cannot be empty"}), 400
        p.name = name

    if "description" in data:
        p.description = data["description"]

    try:
        db.session.commit()
        return jsonify(p.to_dict_safe()), 200
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Permission name already exists"}), 409


@bp.route("/<uuid:id>", methods=["DELETE"])
def delete_permission(id):
    p:Permission = Permission.query.filter_by(id=id, deleted=False).first()
    if not p:
        return jsonify({"error": "Permission not found"}), 404

    p.deleted = True
    db.session.commit()
    return jsonify({"success": True}), 200
