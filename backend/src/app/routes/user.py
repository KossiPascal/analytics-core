# auth.py
from typing import List
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, g

from shared_libs.helpers.hasher import verify_password

from backend.src.app.configs.extensions import db
from backend.src.app.models.b_user import Role, User
from backend.src.app.middlewares.access_security import require_auth, currentUserId
from backend.src.modules.analytics.models.c_dataset_chart import DatasetChart
from backend.src.modules.analytics.logger import get_backend_logger

from werkzeug.exceptions import BadRequest
from sqlalchemy.exc import SQLAlchemyError, IntegrityError


logger = get_backend_logger(__name__)

bp = Blueprint("identities_users", __name__, url_prefix="/api/identities/users")

# ===================== LIST USERS =====================
@bp.get("")
@require_auth
def list_users():
    users: List[User] = User.query.filter_by(is_active=True).order_by(User.username).all()
    results = [u.to_dict() for u in sorted((users or []), key=lambda c: c.id) if u is not None]
    return jsonify(results)

# ===================== GET USER BY ID =====================
@bp.get("/<int:user_id>")
@require_auth
def get_user_by_id(user_id: int):
    """ Retrieve a single user by ID. """
    user:User = User.query.get(user_id)
    if not user or user.deleted:
        raise BadRequest(f"User with id={user_id} not found")
    data = user.to_dict()
    data["roles"] = [r.to_dict() for r in user.roles]
    return jsonify(data), 200

# ===================== REGISTER =====================
@bp.post("")
@require_auth  # optionally, only admin can create users
def create_user():
    try:
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
            raise BadRequest("Les mot de passe ne concordent pas!")
        
        if not tenant_id or not username or not password:
            raise BadRequest("tenant_id, username and password are required")

        from sqlalchemy import or_
        conditions = [User.username == username]
        if email:
            conditions.append(User.email == email)
        existing = User.query.filter(or_(*conditions)).first()
        if existing:
            raise BadRequest("Username or email already exists")

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
            created_by=currentUserId()
        )
        user.set_password(password)

        if role_ids:
            roles:List[Role] = Role.query.filter(Role.id.in_(role_ids), Role.deleted == False).all()
            user.roles = roles

        user.created_by=currentUserId()

        db.session.add(user)
        db.session.commit()

        return jsonify({
            "success": True,
            "message": "User created", 
            "user_id": user.id
        }), 201

    except IntegrityError:
        db.session.rollback()
        raise BadRequest("Database integrity error")

    except ValueError:
        db.session.rollback()
        raise BadRequest("Invalid chart type")
    
    except Exception:
        db.session.rollback()
        raise

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
            raise DatasetChart(f"User with id={user_id} not found")

        data = request.get_json(silent=True) or {}

        if "password" in data and data["password"]:
            password = data.get("password")
            if password and len(password) > 0:
                password_confirm = data.get("password_confirm")
                if password != password_confirm:
                    raise BadRequest("Les mot de passe ne concordent pas!", 400)
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
            roles:List[Role] = Role.query.filter(Role.id.in_(role_ids), Role.deleted == False).all()
            user.roles = roles

        user.updated_by=currentUserId()

        db.session.commit()
        return jsonify({"message": "User updated"}), 200

    except IntegrityError:
        db.session.rollback()
        raise BadRequest("Duplicate or invalid data")

    except ValueError:
        db.session.rollback()
        raise BadRequest("Invalid chart type")
    
    except SQLAlchemyError:
        db.session.rollback()
        raise BadRequest("Failed to update user")
    except Exception:
        db.session.rollback()
        raise  # Let global handler return 500

# ===================== DELETE USER =====================
@bp.delete("/<int:user_id>")
@require_auth
def delete_user(user_id: int):
    try:
        user:User = User.query.get(user_id)
        if not user or user.deleted:
            raise BadRequest(f"User with id={user_id} not found", 404)
        user.is_active = False
        user.deleted = True
        user.deleted_at = datetime.now(timezone.utc)
        user.deleted_by=currentUserId()
        user.is_active = False

        user.roles = []  # supprime les relations automatiquement
        user.orgunits = []  # supprime les relations automatiquement

        db.session.commit()
        return jsonify({"message": "User deleted"}), 200
    
    except SQLAlchemyError:
        db.session.rollback()
        raise BadRequest("Failed to delete user")
    
    except Exception:
        db.session.rollback()
        raise # Let global handler return 500

# ===================== UPDATE PASSWORD =====================
@bp.post("/update-password")
@require_auth
def update_password():
    """ JSON body: { "oldPassword": str, "newPassword": str } """
    try:
        user: User = User.query.get(g.current_user["id"])
        if not user or user.deleted or not user.is_active:
            raise BadRequest("User not found or inactive")

        data = request.get_json(silent=True) or {}
        old_password = data.get("old_password")
        new_password = data.get("new_password")

        if not old_password or not new_password:
            raise BadRequest("Both old and new passwords are required")
        
        if not verify_password(old_password, user.salt, user.password_hash):
            raise BadRequest("Old password is incorrect")

        user.set_password(new_password)
        user.has_changed_default_password = True
        user.must_login = True
        user.updated_by=currentUserId()

        db.session.commit()

        token, exp, payload = user.generate_permission_payload()

        return jsonify({"message": "Password updated", "token": token}), 200

    except IntegrityError:
        db.session.rollback()
        raise BadRequest("Duplicate or invalid data")

    except ValueError:
        db.session.rollback()
        raise BadRequest("Invalid chart type")

    except Exception:
        db.session.rollback()
        raise  # Let global handler return 500

