# auth.py
from datetime import datetime, timezone
from typing import List
from flask import Blueprint, request, jsonify, g
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from backend.src.databases.extensions import db, error_response
from backend.src.models.auth import UserOrgunit, UserRole, User
from backend.src.helpers.hasher import verify_password
from backend.src.security.access_security import require_auth
from backend.src.logger import get_backend_logger

logger = get_backend_logger(__name__)

bp = Blueprint("identities_users", __name__, url_prefix="/api/identities/users")

# ===================== LIST USERS =====================
@bp.get("")
@require_auth
def list_users():
    try:
        users: List[User] = User.query.filter_by(is_active=True).order_by(User.username).all()
        results = [u.to_dict() for u in sorted((users or []), key=lambda c: c.id) if u is not None]
        return jsonify(results)
    except Exception as e:
        logger.error(f"Failed to list users: {str(e)}")
        return error_response("Failed to list users", 500, str(e))


# ===================== GET USER BY ID =====================
@bp.get("/<int:user_id>")
@require_auth
def get_user_by_id(user_id: int):
    """
    Retrieve a single user by ID.
    """
    try:
        user:User = User.query.get(user_id)
        if not user or user.deleted:
            return error_response(f"User with id={user_id} not found", 404)
        data = user.to_dict()
        data["roles"] = [r.to_dict() for r in user.roles]
        return jsonify(data), 200
    except Exception as e:
        logger.error(f"Get user by ID error: {str(e)}")
        return error_response("Failed to get user", 500, str(e))


# ===================== REGISTER =====================
@bp.post("")
@require_auth  # optionally, only admin can create users
def create_user():
    """
    Register a new user.
        JSON body: {
        "tenant_id": int,
        "username": str,
        "password": str,
        "lastname": str,
        "firstname": str,
        "email": str,
        "phone": str,
        "roles": [role_id, ...]
    }
    """
    # try:
    data = request.get_json(silent=True) or {}
    tenant_id = data.get("tenant_id")
    username = data.get("username")
    lastname = data.get("lastname")
    firstname = data.get("firstname")
    email = data.get("email")
    password = data.get("password")
    password_confirm = data.get("password_confirm")
    phone = data.get("phone")
    role_ids = data.get("role_ids", [])
    orgunit_ids = data.get("orgunit_ids", [])
    is_active=bool(data.get("is_active", True))

    if password != password_confirm:
        return jsonify({"error": "Les mot de passe ne concordent pas!"}), 400
    
    if not tenant_id or not username or not password:
        return jsonify({"error": "tenant_id, username and password are required"}), 400

    existing = User.query.filter((User.username == username) | (User.email == email)).first()
    if existing:
        return jsonify({"error": "Username or email already exists"}), 409

    user = User(
        tenant_id=tenant_id,
        username=username,
        lastname=lastname,
        firstname=firstname,
        email=email,
        phone=phone,
        is_active=is_active,
        deleted=False,
        must_login=True,
        has_changed_default_password=False,
        created_by=g.current_user.get("id") if g.get("current_user") else None
    )
    user.set_password(password)

    if role_ids:
        roles:List[UserRole] = UserRole.query.filter(UserRole.id.in_(role_ids), UserRole.deleted == False).all()
        user.roles = roles

    if orgunit_ids:
        orgunits:List[UserOrgunit] = UserOrgunit.query.filter(UserOrgunit.id.in_(orgunit_ids), UserOrgunit.deleted == False).all()
        user.orgunits = orgunits

    user.created_by=g.current_user.get("id") if g.get("current_user") else None

    db.session.add(user)
    db.session.commit()

    return jsonify({"message": "User created", "user_id": user.id}), 201

    # except IntegrityError:
    #     db.session.rollback()
    #     return jsonify({"error": "Database integrity error"}), 500
    # except Exception as e:
    #     db.session.rollback()
    #     logger.error(f"Create user error: {str(e)}")
    #     print(str(e))
    #     return error_response("Failed to create user", 500, str(e))


# ===================== UPDATE USER =====================
@bp.put("/<int:user_id>")
@require_auth
def update_user(user_id: int):
    """
    JSON body: {
        "lastname": str,
        "firstname": str,
        "email": str,
        "phone": str,
        "roles": [role_id, ...],
        "is_active": bool
    }
    """
    try:
        user:User = User.query.get(user_id)
        if not user or user.deleted:
            return error_response(f"User with id={user_id} not found", 404)

        data = request.get_json(silent=True) or {}


        if "password" in data and data["password"]:
            password = data.get("password")
            if password and len(password) > 0:
                password_confirm = data.get("password_confirm")
                if password != password_confirm:
                    return jsonify({"error": "Les mot de passe ne concordent pas!"}), 400
                user.set_password(password)

        if "lastname" in data:
            user.lastname = data["lastname"]
        if "firstname" in data:
            user.firstname = data["firstname"]
        if "email" in data:
            user.email = data["email"]
        if "phone" in data:
            user.phone = data["phone"]
        if "is_active" in data:
            user.is_active = bool(data["is_active"])
        if "role_ids" in data:
            role_ids = data.get("role_ids", [])
            roles:List[UserRole] = UserRole.query.filter(UserRole.id.in_(role_ids), UserRole.deleted == False).all()
            user.roles = roles
        if "orgunit_ids" in data:
            orgunit_ids = data.get("orgunit_ids", [])
            orgunits:List[UserOrgunit] = UserOrgunit.query.filter(UserOrgunit.id.in_(orgunit_ids), UserOrgunit.deleted == False).all()
            user.orgunits = orgunits

        user.updated_by=g.current_user.get("id") if g.get("current_user") else None

        db.session.commit()
        return jsonify({"message": "User updated"}), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        return error_response("Failed to update user", 500, str(e))
    except Exception as e:
        logger.error(f"Update user error: {str(e)}")
        return error_response("Failed to update user", 500, str(e))


# ===================== DELETE USER =====================
@bp.delete("/<int:user_id>")
@require_auth
def delete_user(user_id: int):
    try:
        user:User = User.query.get(user_id)
        if not user or user.deleted:
            return error_response(f"User with id={user_id} not found", 404)

        user.deleted = True
        user.deleted_at = datetime.now(timezone.utc)
        user.deleted_by=g.current_user.get("id") if g.get("current_user") else None
        user.is_active = False

        user.roles = []  # supprime les relations automatiquement
        user.orgunits = []  # supprime les relations automatiquement

        db.session.commit()
        return jsonify({"message": "User deleted"}), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        return error_response("Failed to delete user", 500, str(e))
    except Exception as e:
        logger.error(f"Delete user error: {str(e)}")
        return error_response("Failed to delete user", 500, str(e))


# ===================== UPDATE PASSWORD =====================
@bp.post("/update-password")
@require_auth
def update_password():
    """
    JSON body: { "oldPassword": str, "newPassword": str }
    """
    try:
        user: User = User.query.get(g.current_user["id"])
        if not user or user.deleted or not user.is_active:
            return jsonify({"error": "User not found or inactive"}), 404

        data = request.get_json(silent=True) or {}
        old_password = data.get("old_password")
        new_password = data.get("new_password")

        if not old_password or not new_password:
            return jsonify({"error": "Both old and new passwords are required"}), 400
        if not verify_password(old_password, user.salt, user.password_hash):
            return jsonify({"error": "Old password is incorrect"}), 401

        user.set_password(new_password)
        user.has_changed_default_password = True
        user.must_login = True
        user.updated_by=g.current_user.get("id") if g.get("current_user") else None

        db.session.commit()

        token, exp, payload = user.generate_permission_payload()

        return jsonify({"message": "Password updated", "token": token}), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Update password error: {str(e)}")
        return error_response("Failed to update password", 500, str(e))

