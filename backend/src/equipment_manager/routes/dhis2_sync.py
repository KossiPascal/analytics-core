from flask import Blueprint, request, jsonify

from backend.src.databases.extensions import error_response
from backend.src.security.access_security import require_auth
from backend.src.equipment_manager.services.dhis2_service import (
    sync_organizational_units, sync_ascs,
)
from backend.src.logger import get_backend_logger

logger = get_backend_logger(__name__)

bp = Blueprint("em_dhis2_sync", __name__, url_prefix="/api/equipment/sync")


@bp.post("/organizational-units")
@require_auth
def sync_org_units():
    data = request.get_json(silent=True) or {}
    program_id = data.get("program_id")
    org_unit_id = data.get("org_unit_id")

    try:
        result = sync_organizational_units(program_id=program_id, org_unit_id=org_unit_id)
        if "error" in result:
            return error_response(result["error"], 400)
        return jsonify(result), 200
    except Exception as e:
        logger.error(f"DHIS2 org unit sync error: {e}")
        return error_response(f"Sync failed: {str(e)}", 500)


@bp.post("/ascs")
@require_auth
def sync_ascs_route():
    data = request.get_json(silent=True) or {}
    program_id = data.get("program_id")
    org_unit_id = data.get("org_unit_id")

    try:
        result = sync_ascs(program_id=program_id, org_unit_id=org_unit_id)
        if "error" in result:
            return error_response(result["error"], 400)
        return jsonify(result), 200
    except Exception as e:
        logger.error(f"DHIS2 ASC sync error: {e}")
        return error_response(f"Sync failed: {str(e)}", 500)
