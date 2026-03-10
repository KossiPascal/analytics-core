from flask import Blueprint, request, jsonify
from backend.src.security.access_security import require_auth, currentUserId
from backend.src.equipment_manager.services.dhis2_service import sync_organizational_units, sync_ascs
from backend.src.logger import get_backend_logger

from werkzeug.exceptions import BadRequest
from sqlalchemy.exc import IntegrityError

logger = get_backend_logger(__name__)

bp = Blueprint("em_dhis2_sync", __name__, url_prefix="/api/equipment/sync")


@bp.post("/organizational-units")
@require_auth
def sync_org_units():
    data = request.get_json(silent=True) or {}
    program_id = data.get("program_id")
    org_unit_id = data.get("org_unit_id")
    
    result = sync_organizational_units(program_id=program_id, org_unit_id=org_unit_id)
    if "error" in result:
        raise BadRequest(result["error"])
    return jsonify(result), 200


@bp.post("/ascs")
@require_auth
def sync_ascs_route():
    data = request.get_json(silent=True) or {}
    program_id = data.get("program_id")
    org_unit_id = data.get("org_unit_id")

    result = sync_ascs(program_id=program_id, org_unit_id=org_unit_id)
    if "error" in result:
        raise BadRequest(result["error"])
    return jsonify(result), 200
