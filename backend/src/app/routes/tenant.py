# identities.py
from typing import List
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, g
from backend.src.app.configs.extensions import db
from backend.src.app.models.a_tenant import Tenant
from backend.src.app.middlewares.access_security import require_auth, currentUserId
from backend.src.app.models.x_worker import HostLinks
from backend.src.modules.analytics.logger import get_backend_logger

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


@bp.get("/<string:tenant_id>")
@require_auth
def get_tenant(tenant_id:int):
    try:
        if not tenant_id:
            raise BadRequest("tenant_id is required", 400)
        
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
        name = data.get("name")
        description = data.get("description")
        options = data.get("options", {})
        is_active = bool(data.get("is_active", True))

        if not name:
            raise BadRequest("Tenant name is required", 400)

        if not isinstance(options,dict):
            raise BadRequest("options must be a dict and is required", 400)

        existing = Tenant.query.filter_by(name=name).first()
        if existing:
            raise BadRequest("Tenant already exists", 409)

        tenant = Tenant(
            name=name.strip(),
            options=options,
            description=description,
            is_active=is_active
        )
        tenant.created_by=currentUserId()

        db.session.add(tenant)
        db.session.commit()
        return jsonify({"message": "Tenant created", "tenant_id": tenant.id}), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Create tenant error: {str(e)}")
        raise BadRequest("Failed to create tenant", 500)


@bp.put("/<string:tenant_id>")
@require_auth
def update_tenant(tenant_id: str):
    try:
        tenant:Tenant = Tenant.query.get(tenant_id)
        if not tenant or tenant.deleted:
            raise BadRequest(f"Tenant with id={tenant_id} not found", 404)

        data = request.get_json(silent=True) or {}
        if "name" in data:
            tenant.name = data["name"].strip()
        if "options" in data:
            options = data.get("options", {})
            if not isinstance(options,dict):
                raise BadRequest("options must be a dict and is required", 400)
            tenant.options = options
        if "description" in data:
            tenant.description = data["description"].strip()
        if "is_active" in data:
            tenant.is_active = bool(data.get("is_active", True))

        tenant.updated_by=currentUserId()

        db.session.commit()
        return jsonify({"message": "Tenant updated"}), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        raise BadRequest("Failed to update tenant", 500)


@bp.delete("/<string:tenant_id>")
@require_auth
def delete_tenant(tenant_id: str):
    try:
        tenant:Tenant = Tenant.query.get(tenant_id)
        if not tenant or tenant.deleted:
            raise BadRequest(f"Tenant with id={tenant_id} not found", 404)
        tenant.is_active = False
        tenant.deleted = True
        tenant.deleted_at = datetime.now(timezone.utc)
        tenant.deleted_by=currentUserId()
        # tenant.deleted_by = g.current_user.id
        db.session.commit()
        return jsonify({"message": "Tenant deleted"}), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        raise BadRequest("Failed to delete tenant", 500)


@bp.delete("/<string:tenant_id>/forever")
@require_auth
def delete_tenant_forever(tenant_id: str):
    try:
        tenant:Tenant = Tenant.query.get(tenant_id)
        if not tenant or tenant.deleted:
            raise BadRequest(f"Tenant with id={tenant_id} not found", 404)
        db.session.delete(tenant)

        all_versioned = HostLinks.query.filter(
            HostLinks.tenant_id == tenant.id
        ).all()
        for versioned in all_versioned or []:
            db.session.delete(versioned)

        db.session.commit()
        return jsonify({"message": "Tenant deleted"}), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        raise BadRequest("Failed to delete tenant", 500)

