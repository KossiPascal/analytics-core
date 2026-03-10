from datetime import datetime, timezone
from typing import List
from flask import Blueprint, g, jsonify, request
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from werkzeug.exceptions import BadRequest
from backend.src.databases.extensions import db
from backend.src.models.auth import OrgUnitLevel
from backend.src.security.access_security import require_auth, currentUserId
from backend.src.logger import get_backend_logger

logger = get_backend_logger(__name__)

bp = Blueprint("identities_levels", __name__, url_prefix="/api/identities/levels")


# ─────────────────────────────────────────────────────────────────────────────
# LIST
# ─────────────────────────────────────────────────────────────────────────────
@bp.get("")
@require_auth
def list_levels():
    try:
        levels: List[OrgUnitLevel] = (
            OrgUnitLevel.query
            .filter_by(deleted=False)
            .order_by(OrgUnitLevel.level)
            .all()
        )
        return jsonify([lv.to_dict() for lv in levels]), 200
    except Exception as e:
        logger.error(f"List levels error: {e}")
        raise BadRequest("Impossible de lister les niveaux", 500)


# ─────────────────────────────────────────────────────────────────────────────
# GET ONE
# ─────────────────────────────────────────────────────────────────────────────
@bp.get("/<int:level_id>")
@require_auth
def get_level(level_id: int):
    try:
        lv: OrgUnitLevel = OrgUnitLevel.query.get(level_id)
        if not lv or lv.deleted:
            raise BadRequest(f"Niveau id={level_id} introuvable", 404)
        return jsonify(lv.to_dict()), 200
    except Exception as e:
        logger.error(f"Get level error: {e}")
        raise BadRequest("Impossible de récupérer le niveau", 500)


# ─────────────────────────────────────────────────────────────────────────────
# CREATE
# ─────────────────────────────────────────────────────────────────────────────
@bp.post("")
@require_auth
def create_level():
    try:
        data = request.get_json(silent=True) or {}

        name      = (data.get("name") or "").strip()
        code      = (data.get("code") or "").strip()
        level_num = data.get("level")
        tenant_id = data.get("tenant_id")
        display_name = (data.get("display_name") or "").strip() or None
        is_active = bool(data.get("is_active", True))

        if not name:
            raise BadRequest("Le nom est requis", 400)
        if level_num is None:
            raise BadRequest("Le numéro de niveau est requis", 400)
        if not tenant_id:
            raise BadRequest("tenant_id est requis", 400)

        lv = OrgUnitLevel(
            tenant_id=tenant_id,
            name=name,
            code=code,
            level=int(level_num),
            display_name=display_name,
            is_active=is_active,
        )
        db.session.add(lv)
        db.session.commit()
        return jsonify(lv.to_dict()), 201

    except IntegrityError:
        db.session.rollback()
        raise BadRequest("Ce numéro de niveau existe déjà pour ce tenant", 409)
    except Exception as e:
        db.session.rollback()
        logger.error(f"Create level error: {e}")
        raise BadRequest("Impossible de créer le niveau", 500)


# ─────────────────────────────────────────────────────────────────────────────
# UPDATE
# ─────────────────────────────────────────────────────────────────────────────
@bp.put("/<int:level_id>")
@require_auth
def update_level(level_id: int):
    try:
        lv: OrgUnitLevel = OrgUnitLevel.query.get(level_id)
        if not lv or lv.deleted:
            raise BadRequest(f"Niveau id={level_id} introuvable", 404)

        data = request.get_json(silent=True) or {}

        if "name" in data:
            lv.name = data["name"].strip()
        if "code" in data:
            lv.code = (data["code"] or "").strip()
        if "level" in data:
            lv.level = int(data["level"])
        if "display_name" in data:
            lv.display_name = (data["display_name"] or "").strip() or None
        if "is_active" in data:
            lv.is_active = bool(data["is_active"])
        if "tenant_id" in data:
            lv.tenant_id = data["tenant_id"]

        lv.updated_by = currentUserId()

        db.session.commit()
        return jsonify(lv.to_dict()), 200

    except IntegrityError:
        db.session.rollback()
        raise BadRequest("Ce numéro de niveau existe déjà pour ce tenant", 409)
    except SQLAlchemyError as e:
        db.session.rollback()
        raise BadRequest("Impossible de mettre à jour le niveau", 500)


# ─────────────────────────────────────────────────────────────────────────────
# DELETE (soft)
# ─────────────────────────────────────────────────────────────────────────────
@bp.delete("/<int:level_id>")
@require_auth
def delete_level(level_id: int):
    try:
        lv: OrgUnitLevel = OrgUnitLevel.query.get(level_id)
        if not lv or lv.deleted:
            raise BadRequest(f"Niveau id={level_id} introuvable", 404)

        lv.deleted    = True
        lv.deleted_at = datetime.now(timezone.utc)
        lv.deleted_by = currentUserId()

        db.session.commit()
        return jsonify({"message": "Niveau supprimé"}), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        raise BadRequest("Impossible de supprimer le niveau", 500)
