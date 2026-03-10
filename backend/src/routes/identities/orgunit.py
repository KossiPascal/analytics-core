# identities.py
from typing import List
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, g
from backend.src.databases.extensions import db
from backend.src.models.auth import UserOrgunit
from backend.src.security.access_security import require_auth, currentUserId
from backend.src.logger import get_backend_logger

from werkzeug.exceptions import BadRequest
from sqlalchemy.exc import SQLAlchemyError, IntegrityError

logger = get_backend_logger(__name__)

bp = Blueprint("identities_orgunits", __name__, url_prefix="/api/identities/orgunits")


# ===================== ORGUNITS =====================
@bp.get("")
@require_auth
def list_orgunits():
    try:
        orgunits: List[UserOrgunit] = UserOrgunit.query.filter_by(deleted=False).order_by(UserOrgunit.name).all()
        return jsonify([o.to_dict() for o in orgunits if o is not None]), 200
    except Exception as e:
        logger.error(f"List orgunits error: {str(e)}")
        raise BadRequest("Failed to list orgunits", 500)


@bp.get("/<int:orgunit_id>")
@require_auth
def get_orgunit(orgunit_id: int):
    try:
        orgunit:UserOrgunit = UserOrgunit.query.get(orgunit_id)
        if not orgunit or orgunit.deleted:
            raise BadRequest(f"Orgunit with id={orgunit_id} not found", 404)
        return jsonify(orgunit.to_dict(include_children=True)), 200
    except Exception as e:
        logger.error(f"Get orgunit error: {str(e)}")
        raise BadRequest("Failed to get orgunit", 500)


@bp.post("")
@require_auth
def create_orgunit():
    try:
        data = request.get_json(silent=True) or {}

        name = (data.get("name") or "").strip()
        code = (data.get("code") or "").strip()
        description = (data.get("description") or "").strip()
        tenant_id = data.get("tenant_id")
        parent_id = data.get("parent_id")
        level_id = data.get("level_id")
        is_active = bool(data.get("is_active", True))

        if not name:
            raise BadRequest("Orgunit name is required", 400)
        if not tenant_id:
            raise BadRequest("tenant_id is required", 400)
        # if current_user.is_superadmin and parent_id is None:
        #     raise ValueError("Superadmin must specify tenant via parent orgunit")

        parent = None
        if parent_id:
            parent:UserOrgunit = UserOrgunit.query.get(parent_id)
            if not parent or parent.deleted:
                raise BadRequest("Parent orgunit not found", 404)
            if parent.tenant_id != tenant_id:
                raise BadRequest("Parent tenant mismatch", 400)
            # if not current_user.is_superadmin and parent.tenant_id != tenant_id:
            #     raise ValueError("Unauthorized cross-tenant parent")
        existing = UserOrgunit.query.filter(
                        UserOrgunit.name==name,
                        UserOrgunit.tenant_id==tenant_id,
                        UserOrgunit.deleted==False
                    ).first()
        if existing:
            raise BadRequest("Orgunit already exists in this tenant", 409)

        orgunit = UserOrgunit(
            name=name,
            code=code,
            is_active=is_active,
            description=description,
            parent_id=parent.id if parent else None,
            tenant_id=tenant_id,
            level_id=level_id,
        )

        orgunit.created_by=currentUserId()

        db.session.add(orgunit)
        db.session.commit()
        return jsonify({"message": "Orgunit created", "orgunit_id": orgunit.id}), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Create orgunit error: {str(e)}")
        raise BadRequest("Failed to create orgunit", 500)


@bp.put("/<int:orgunit_id>")
@require_auth
def update_orgunit(orgunit_id: int):
    try:
        orgunit:UserOrgunit = UserOrgunit.query.get(orgunit_id)
        if not orgunit or orgunit.deleted:
            raise BadRequest(f"Orgunit with id={orgunit_id} not found", 404)

        data = request.get_json(silent=True) or {}

        if "name" in data:
            orgunit.name = data["name"].strip()
        if "code" in data:
            orgunit.code = (data["code"] or "").strip()
        if "description" in data:
            orgunit.description = (data["description"] or "").strip()
        if "tenant_id" in data:
            orgunit.tenant_id = data["tenant_id"]
        if "level_id" in data:
            orgunit.level_id = data["level_id"]  # None = pas de niveau
        if "is_active" in data:
            orgunit.is_active = bool(data.get("is_active", True))
        if "parent_id" in data:
            new_parent:UserOrgunit = UserOrgunit.query.get(data["parent_id"])
            if not new_parent or new_parent.deleted:
                raise BadRequest("Parent not found", 404)
            if new_parent.id == orgunit.id:
                raise BadRequest("Cannot self-parent", 400)
            if orgunit in new_parent.get_descendants():
                raise BadRequest("Circular hierarchy not allowed", 400)
            orgunit.parent_id = new_parent.id


        orgunit.updated_by = currentUserId()

        db.session.commit()
        return jsonify(orgunit.to_dict()), 200

    except Exception as e:
        db.session.rollback()
        #logger.error(f"Update orgunit error: {e}")
        raise BadRequest("Failed to update orgunit", 500)


@bp.delete("/<int:orgunit_id>")
@require_auth
def delete_orgunit(orgunit_id: int):
    try:
        orgunit:UserOrgunit = UserOrgunit.query.get(orgunit_id)
        if not orgunit or orgunit.deleted:
            raise BadRequest(f"Orgunit with id={orgunit_id} not found", 404)

        orgunit.deleted = True
        orgunit.deleted_at = datetime.now(timezone.utc)
        orgunit.deleted_by=currentUserId()

        db.session.commit()
        return jsonify({"message": "Orgunit deleted"}), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        raise BadRequest("Failed to delete orgunit", 500)


