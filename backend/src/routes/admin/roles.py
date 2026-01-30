from flask import Blueprint, request, jsonify
from sqlalchemy.exc import IntegrityError
from database.extensions import db
from models.auth import Role, RolePermission, Permission

bp = Blueprint("roles", __name__, url_prefix="/api/roles")


# -------------------- HELPERS --------------------
def get_json():
    if not request.is_json:
        return None, jsonify({"error": "Invalid JSON payload"}), 400
    return request.get_json(), None, None


# -------------------- ROLES --------------------
@bp.route("", methods=["GET"])
def get_roles():
    roles:list[Role] = Role.query.filter_by(deleted=False).order_by(Role.name).all()
    return jsonify([r.to_dict_safe() for r in roles]), 200


@bp.route("/<uuid:id>", methods=["GET"])
def get_role(id):
    role:Role = Role.query.filter_by(id=id, deleted=False).first()
    if not role:
        return jsonify({"error": "Role not found"}), 404
    return jsonify(role.to_dict_safe()), 200


@bp.route("", methods=["POST"])
def create_role():
    data, error, status = get_json()
    if error:
        return error, status

    name = data.get("name", "").strip()
    if not name:
        return jsonify({"error": "Role name is required"}), 400

    role = Role(name=name,tenant_id=data.get("tenant_id"),is_system=bool(data.get("is_system", False)))

    db.session.add(role)
    db.session.flush()  # 🔑 nécessaire pour role.id

    permission_ids = data.get("permission_ids", [])
    if not isinstance(permission_ids, list):
        return jsonify({"error": "permission_ids must be a list"}), 400
    
    permissions:list[Permission] = Permission.query.filter(Permission.id.in_(permission_ids)).all()

    # 🔐 Validation permissions
    valid_permissions = [p.id for p in permissions]

    for perm_id in valid_permissions:
        db.session.add(RolePermission(role_id=role.id, permission_id=perm_id))

    try:
        db.session.commit()
        return jsonify(role.to_dict_safe()), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Role already exists"}), 409


@bp.route("/<uuid:id>", methods=["PUT"])
def replace_role(id):
    data, error, status = get_json()
    if error:
        return error, status

    role:Role = Role.query.filter_by(id=id, deleted=False).first()
    if not role:
        return jsonify({"error": "Role not found"}), 404

    name = data.get("name", "").strip()
    if not name:
        return jsonify({"error": "Role name is required"}), 400

    role.name = name
    role.tenant_id = data.get("tenant_id")
    role.is_system = bool(data.get("is_system", False))

    # 🔥 Replace RolePermissions
    RolePermission.query.filter_by(role_id=id).delete()

    permission_ids = data.get("permission_ids", [])
    permissions:list[Permission] = Permission.query.filter(Permission.id.in_(permission_ids)).all()
    valid_permissions = [p.id for p in permissions]

    for perm_id in valid_permissions:
        db.session.add(RolePermission(role_id=id, permission_id=perm_id))

    db.session.commit()
    return jsonify(role.to_dict_safe()), 200


@bp.route("/<uuid:id>", methods=["PATCH"])
def update_role(id):
    data, error, status = get_json()
    if error:
        return error, status

    role:Role = Role.query.filter_by(id=id, deleted=False).first()
    if not role:
        return jsonify({"error": "Role not found"}), 404

    if "name" in data:
        name = data["name"].strip()
        if not name:
            return jsonify({"error": "Role name cannot be empty"}), 400
        role.name = name

    if "tenant_id" in data:
        role.tenant_id = data["tenant_id"]

    if "is_system" in data:
        role.is_system = bool(data["is_system"])

    if "permission_ids" in data:
        RolePermission.query.filter_by(role_id=id).delete()
        permissions:list[Permission] = Permission.query.filter(Permission.id.in_(data["permission_ids"])).all()
        valid_permissions = [p.id for p in permissions]
        for perm_id in valid_permissions:
            db.session.add(RolePermission(role_id=id, permission_id=perm_id))

    db.session.commit()
    return jsonify(role.to_dict_safe()), 200


@bp.route("/<uuid:id>", methods=["DELETE"])
def delete_role(id):
    role:Role = Role.query.filter_by(id=id, deleted=False).first()
    if not role:
        return jsonify({"error": "Role not found"}), 404

    # 🔐 soft delete
    role.deleted = True

    # Nettoyage des relations
    RolePermission.query.filter_by(role_id=id).delete()

    db.session.commit()
    return jsonify({"success": True}), 200
