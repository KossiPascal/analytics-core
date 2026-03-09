# identities.py
from typing import List
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, g
from backend.src.databases.extensions import db
from backend.src.models.auth import Tenant
from backend.src.security.access_security import require_auth
from backend.src.logger import get_backend_logger

from werkzeug.exceptions import BadRequest
from sqlalchemy.exc import SQLAlchemyError, IntegrityError

logger = get_backend_logger(__name__)

bp = Blueprint("identities_tenants", __name__, url_prefix="/api/identities/tenants")


# ===================== TENANTS =====================
@bp.get("")
@require_auth
def list_tenants():
    try:
        tenants: List[Tenant] = Tenant.query.filter_by(deleted=False).order_by(Tenant.name).all()
        return jsonify([t.to_dict() for t in tenants if t is not None]), 200
    except Exception as e:
        logger.error(f"List tenants error: {str(e)}")
        raise BadRequest("Failed to list tenants", 500)


@bp.get("/<int:tenant_id>")
@require_auth
def get_tenant(tenant_id: int):
    try:
        tenant:Tenant = Tenant.query.get(tenant_id)
        if not tenant or tenant.deleted:
            raise BadRequest(f"Tenant with id={tenant_id} not found", 404)
        return jsonify(tenant.to_dict()), 200
    except Exception as e:
        logger.error(f"Get tenant error: {str(e)}")
        raise BadRequest("Failed to get tenant", 500)


@bp.post("")
@require_auth
def create_tenant():
    try:
        data = request.get_json(silent=True) or {}
        name = data.get("name", "").strip()
        description = data.get("description", "").strip()
        is_active = bool(data.get("is_active", False))

        if not name:
            raise BadRequest("Tenant name is required", 400)

        existing = Tenant.query.filter_by(name=name).first()
        if existing:
            raise BadRequest("Tenant already exists", 409)

        tenant = Tenant(name=name,description=description,is_active=is_active)
        tenant.created_by=g.current_user.get("id") if g.get("current_user") else None

        db.session.add(tenant)
        db.session.commit()
        return jsonify({"message": "Tenant created", "tenant_id": tenant.id}), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Create tenant error: {str(e)}")
        raise BadRequest("Failed to create tenant", 500)


@bp.put("/<int:tenant_id>")
@require_auth
def update_tenant(tenant_id: int):
    try:
        tenant:Tenant = Tenant.query.get(tenant_id)
        if not tenant or tenant.deleted:
            raise BadRequest(f"Tenant with id={tenant_id} not found", 404)

        data = request.get_json(silent=True) or {}
        if "name" in data:
            tenant.name = data["name"].strip()
        if "description" in data:
            tenant.description = data["description"].strip()
        if "is_active" in data:
            tenant.is_active = bool(data.get("is_active", True))

        tenant.updated_by=g.current_user.get("id") if g.get("current_user") else None

        db.session.commit()
        return jsonify({"message": "Tenant updated"}), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        raise BadRequest("Failed to update tenant", 500)


@bp.delete("/<int:tenant_id>")
@require_auth
def delete_tenant(tenant_id: int):
    try:
        tenant:Tenant = Tenant.query.get(tenant_id)
        if not tenant or tenant.deleted:
            raise BadRequest(f"Tenant with id={tenant_id} not found", 404)

        tenant.deleted = True
        tenant.deleted_at = datetime.now(timezone.utc)
        tenant.deleted_by=g.current_user.get("id") if g.get("current_user") else None
        # tenant.deleted_by = g.current_user.id
        db.session.commit()
        return jsonify({"message": "Tenant deleted"}), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        raise BadRequest("Failed to delete tenant", 500)

