# identities.py
from typing import List
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, g
from backend.src.app.configs.extensions import db
from backend.src.app.models.user import Role, Permission
from backend.src.app.middlewares.access_security import require_auth, currentUserId
from backend.src.projects.analytics_manager.logger import get_backend_logger

from werkzeug.exceptions import BadRequest
from sqlalchemy.exc import SQLAlchemyError, IntegrityError

logger = get_backend_logger(__name__)

bp = Blueprint("identities_roles", __name__, url_prefix="/api/identities/roles")

# ===================== ROLES =====================
@bp.get("")
@require_auth
def list_roles():
    try:
        roles: List[Role] = Role.query.filter_by(deleted=False).all()
        return jsonify([r.to_dict() for r in roles if r is not None]), 200
    except Exception as e:
        logger.error(f"List roles error: {str(e)}")
        raise BadRequest("Failed to list roles", 500)


@bp.get("/<int:role_id>")
@require_auth
def get_role(role_id: int):
    try:
        role:Role = Role.query.get(role_id)
        if not role or role.deleted:
            raise BadRequest(f"Role with id={role_id} not found", 404)
        data = role.to_dict()
        data["permissions"] = [p.to_dict() for p in role.permissions]
        return jsonify(data), 200
    except Exception as e:
        logger.error(f"Get role error: {str(e)}")
        raise BadRequest("Failed to get role", 500)


@bp.post("")
@require_auth
def create_role():
    try:
        data = request.get_json(silent=True) or {}
        name = data.get("name")
        tenant_id = data.get("tenant_id")
        permission_ids = data.get("permission_ids", [])
        description = data.get("description")
        is_system = bool(data.get("is_system", False))
        is_active = bool(data.get("is_active", False))

        if not name:
            raise BadRequest("Role name is required", 400)

        existing = Role.query.filter(
            Role.name==name, 
            Role.tenant_id==tenant_id
        ).first()
        if existing:
            raise BadRequest("Role already exists for this tenant", 409)

        role = Role(name=name, tenant_id=tenant_id, description=description, is_system=is_system, is_active=is_active)
        if permission_ids:
            perms:List[Permission] = Permission.query.filter(Permission.id.in_(permission_ids), Permission.deleted == False).all()
            role.permissions = perms # SQLAlchemy gère la table role_permission_links

        role.created_by=currentUserId()

        db.session.add(role)
        db.session.commit()
        return jsonify({"message": "Role created", "role_id": role.id}), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Create role error: {str(e)}")
        raise BadRequest("Failed to create role", 500)


@bp.put("/<int:role_id>")
@require_auth
def update_role(role_id: int):
    try:
        role:Role = Role.query.get(role_id)
        if not role or role.deleted:
            raise BadRequest(f"Role with id={role_id} not found", 404)

        data = request.get_json(silent=True) or {}
        if "name" in data:
            role.name = data["name"]
        if "tenant_id" in data:
            role.tenant_id = data["tenant_id"]
        if "is_active" in data:
            role.is_active = bool(data.get("is_active", True))
        if "permission_ids" in data:
            perms:List[Permission] = Permission.query.filter(
                Permission.id.in_(data["permission_ids"]), 
                Permission.deleted == False
            ).all()
            role.permissions = perms

        role.updated_by=currentUserId()

        db.session.commit()
        return jsonify({"message": "Role updated"}), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        raise BadRequest("Failed to update role", 500)


@bp.delete("/<int:role_id>")
@require_auth
def delete_role(role_id: int):
    try:
        role:Role = Role.query.get(role_id)
        if not role or role.deleted:
            raise BadRequest(f"Role with id={role_id} not found", 404)
        role.is_active = False
        role.deleted = True
        role.deleted_at = datetime.now(timezone.utc)
        role.deleted_by=currentUserId()
        role.permissions = []  # supprime les relations automatiquement
    
        db.session.commit()
        return jsonify({"message": "Role deleted"}), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        raise BadRequest("Failed to delete role", 500)

