# identities.py
from typing import List
from datetime import datetime, timezone
from flask import Blueprint, g, request, jsonify
from backend.src.models.auth import UserPermission
from backend.src.logger import get_backend_logger
from backend.src.security.access_security import require_auth, currentUserId
from backend.src.databases.extensions import db

from werkzeug.exceptions import BadRequest
from sqlalchemy.exc import SQLAlchemyError, IntegrityError

logger = get_backend_logger(__name__)

bp = Blueprint("identities_permissions", __name__, url_prefix="/api/identities/permissions")

# ===================== PERMISSIONS =====================
@bp.get("")
@require_auth
def list_permissions():
    try:
        perms: List[UserPermission] = UserPermission.query.filter_by(deleted=False).order_by(UserPermission.name).all()
        return jsonify([p.to_dict() for p in perms if p is not None]), 200
    except Exception as e:
        logger.error(f"List permissions error: {str(e)}")
        raise BadRequest("Failed to list permissions", 500)

@bp.get("/<int:permission_id>")
@require_auth
def get_permission(permission_id: int):
    try:
        perm:UserPermission = UserPermission.query.get(permission_id)
        if not perm or perm.deleted:
            raise BadRequest(f"Permission with id={permission_id} not found", 404)
        return jsonify(perm.to_dict()), 200
    except Exception as e:
        logger.error(f"Get permission error: {str(e)}")
        raise BadRequest("Failed to get permission", 500)

@bp.post("")
@require_auth
def create_permission():
    try:
        data = request.get_json(silent=True) or {}
        name = data.get("name", "").strip()
        description = data.get("description", "")
        is_active = bool(data.get("is_active", False))
        if not name:
            raise BadRequest("Permission name is required", 400)

        existing = UserPermission.query.filter_by(name=name).first()
        if existing:
            raise BadRequest("Permission already exists", 409)

        perm = UserPermission(name=name, description=description, is_active=is_active)

        perm.created_by=currentUserId()

        db.session.add(perm)
        db.session.commit()
        return jsonify({"message": "Permission created", "permission_id": perm.id}), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Create permission error: {str(e)}")
        raise BadRequest("Failed to create permission", 500)

@bp.put("/<int:permission_id>")
@require_auth
def update_permission(permission_id: int):
    try:
        perm:UserPermission = UserPermission.query.get(permission_id)
        if not perm or perm.deleted:
            raise BadRequest(f"Permission with id={permission_id} not found", 404)

        data = request.get_json(silent=True) or {}
        if "name" in data:
            perm.name = data["name"].strip()
        if "description" in data:
            perm.description = data["description"]
        if "is_active" in data:
            perm.is_active = bool(data.get("is_active", True))

        perm.updated_by=currentUserId()

        db.session.commit()
        return jsonify({"message": "Permission updated"}), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        raise BadRequest("Failed to update permission", 500)

@bp.delete("/<int:permission_id>")
@require_auth
def delete_permission(permission_id: int):
    try:
        perm:UserPermission = UserPermission.query.get(permission_id)
        if not perm or perm.deleted:
            raise BadRequest(f"Permission with id={permission_id} not found", 404)
        perm.is_active = False
        perm.deleted = True
        perm.deleted_at = datetime.now(timezone.utc)
        perm.deleted_by=currentUserId()

        db.session.commit()
        return jsonify({"message": "Permission deleted"}), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        raise BadRequest("Failed to delete permission", 500)
