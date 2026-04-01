# identities.py
from typing import List
from flask import Blueprint, jsonify
from backend.src.app.models.user import RolePermission, UserRole, UsersLog
from backend.src.app.middlewares.access_security import require_auth, currentUserId
from backend.src.projects.analytics_manager.logger import get_backend_logger

from werkzeug.exceptions import BadRequest
from sqlalchemy.exc import IntegrityError

logger = get_backend_logger(__name__)

bp = Blueprint("identities_user_utils", __name__, url_prefix="/api/identities/utils")

# ===================== ROLES =====================
@bp.get("/roles-permissions")
@require_auth
def list_role_permissions():
    try:
        rolePermission: List[RolePermission] = RolePermission.query.all()
        return jsonify([r.to_dict() for r in rolePermission if r is not None]), 200
    except Exception as e:
        logger.error(f"List roles error: {str(e)}")
        raise BadRequest("Failed to list roles", 500)


@bp.get("/users-logs")
@require_auth
def list_users_log():
    try:
        usersLog: List[UsersLog] = UsersLog.query.all()
        return jsonify([r.to_dict() for r in usersLog]), 200
    except Exception as e:
        logger.error(f"List roles error: {str(e)}")
        raise BadRequest("Failed to list roles", 500)
    

@bp.get("/users-roles")
@require_auth
def list_roles():
    try:
        Role: List[UserRole] = UserRole.query.all()
        return jsonify([r.to_dict() for r in Role]), 200
    except Exception as e:
        logger.error(f"List roles error: {str(e)}")
        raise BadRequest("Failed to list roles", 500)
