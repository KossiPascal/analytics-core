from flask import Blueprint, request, jsonify
from sqlalchemy.exc import IntegrityError
from backend.src.databases.extensions import db
from backend.src.models.auth import User, UserRole, Role

bp = Blueprint("users", __name__, url_prefix="/api/users")


# -------------------- HELPERS --------------------
def get_json():
    if not request.is_json:
        return None, jsonify({"error": "Invalid JSON payload"}), 400
    return request.get_json(), None, None


# -------------------- USERS --------------------
@bp.get("")
def get_users():
    users:list[User] = User.query.filter_by(is_deleted=False).order_by(User.username).all()
    return jsonify([u.to_dict_safe() for u in users]), 200


@bp.get("/<uuid:id>")
def get_user(id):
    user:User = User.query.filter_by(id=id, is_deleted=False).first()
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify(user.to_dict_safe()), 200


@bp.post("")
def create_user():
    data, error, status = get_json()
    if error:
        return error, status

    required_fields = ["username", "tenant_id", "password"]
    for field in required_fields:
        if not data.get(field):
            return jsonify({"error": f"{field} is required"}), 400

    user = User(
        username=data["username"].strip(),
        fullname=data.get("fullname"),
        tenant_id=data["tenant_id"],
        email=data.get("email"),
        phone=data.get("phone"),
        is_active=bool(data.get("is_active", True))
    )

    user.set_password(data["password"])
    db.session.add(user)
    db.session.flush()  # 🔑 user.id disponible

    # 🔥 TRAITEMENT UserRoles ICI
    role_ids = data.get("role_ids", [])
    if not isinstance(role_ids, list):
        return jsonify({"error": "role_ids must be a list"}), 400
    
    roles:list[Role] = Role.query.filter(Role.id.in_(role_ids)).all()
    valid_roles = [r.id for r in roles]

    for role_id in valid_roles:
        db.session.add(UserRole(user_id=user.id, role_id=role_id))

    try:
        db.session.commit()
        return jsonify(user.to_dict_safe()), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Username or email already exists"}), 409


@bp.put("/<uuid:id>")
def replace_user(id):
    data, error, status = get_json()
    if error:
        return error, status

    user:User = User.query.filter_by(id=id, is_deleted=False).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    required_fields = ["username", "tenant_id"]
    for field in required_fields:
        if not data.get(field):
            return jsonify({"error": f"{field} is required"}), 400

    user.username = data["username"].strip()
    user.fullname = data.get("fullname")
    user.tenant_id = data["tenant_id"]
    user.email = data.get("email")
    user.phone = data.get("phone")
    user.is_active = bool(data.get("is_active", user.is_active))

    if "password" in data and data["password"]:
        user.set_password(data["password"])

    # 🔁 Replace UserRoles
    UserRole.query.filter_by(user_id=id).delete()

    role_ids = data.get("role_ids", [])
    roles:list[Role] = Role.query.filter(Role.id.in_(role_ids)).all()
    valid_roles = { r.id for r in roles}

    for role_id in valid_roles:
        db.session.add(UserRole(user_id=id, role_id=role_id))

    db.session.commit()
    return jsonify(user.to_dict_safe()), 200


@bp.patch("/<uuid:id>")
def update_user(id):
    data, error, status = get_json()
    if error:
        return error, status

    user:User = User.query.filter_by(id=id, is_deleted=False).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    if "fullname" in data:
        user.fullname = data["fullname"]

    if "email" in data:
        user.email = data["email"]

    if "phone" in data:
        user.phone = data["phone"]

    if "is_active" in data:
        user.is_active = bool(data["is_active"])

    if "password" in data and data["password"]:
        user.set_password(data["password"])

    if "role_ids" in data:
        UserRole.query.filter_by(user_id=id).delete()
        roles:list[Role] = Role.query.filter(Role.id.in_(data["role_ids"])).all()
        valid_roles = { r.id for r in roles }
        for role_id in valid_roles:
            db.session.add(UserRole(user_id=id, role_id=role_id))

    db.session.commit()
    return jsonify(user.to_dict_safe()), 200


@bp.delete("/<uuid:id>")
def delete_user(id):
    user:User = User.query.filter_by(id=id, is_deleted=False).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    # 🔐 Soft delete
    user.is_deleted = True
    user.is_active = False

    # Nettoyage relations
    UserRole.query.filter_by(user_id=id).delete()

    db.session.commit()
    return jsonify({"success": True}), 200
