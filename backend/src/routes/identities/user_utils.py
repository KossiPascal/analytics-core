# identities.py
from typing import List
from flask import Blueprint, jsonify
from backend.src.databases.extensions import error_response
from backend.src.models.auth import RolePermissionLink, UserRoleLink, UsersLog
from backend.src.security.access_security import require_auth
from backend.src.logger import get_backend_logger

logger = get_backend_logger(__name__)

bp = Blueprint("identities_user_utils", __name__, url_prefix="/api/identities/utils")

# ===================== ROLES =====================
@bp.get("/roles-permissions")
@require_auth
def list_role_permissions():
    try:
        rolePermission: List[RolePermissionLink] = RolePermissionLink.query.all()
        return jsonify([r.to_dict() for r in rolePermission if r is not None]), 200
    except Exception as e:
        logger.error(f"List roles error: {str(e)}")
        return error_response("Failed to list roles", 500, str(e))


@bp.get("/users-logs")
@require_auth
def list_users_log():
    try:
        usersLog: List[UsersLog] = UsersLog.query.all()
        return jsonify([r.to_dict() for r in usersLog]), 200
    except Exception as e:
        logger.error(f"List roles error: {str(e)}")
        return error_response("Failed to list roles", 500, str(e))
    

@bp.get("/users-roles")
@require_auth
def list_user_roles():
    try:
        userRole: List[UserRoleLink] = UserRoleLink.query.all()
        return jsonify([r.to_dict() for r in userRole]), 200
    except Exception as e:
        logger.error(f"List roles error: {str(e)}")
        return error_response("Failed to list roles", 500, str(e))
