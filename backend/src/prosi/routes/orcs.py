from flask import Blueprint, request, jsonify, g
from backend.src.security.access_security import require_auth, currentUserId
from backend.src.prosi import services as svc
from backend.src.logger import get_backend_logger

logger = get_backend_logger(__name__)

bp = Blueprint("prosi_orcs", __name__, url_prefix="/api/prosi/orcs")


@bp.get("")
@require_auth
def list_orcs():
    tenant_id = int(g.current_user.get("tenant_id"))
    root_only = request.args.get("root_only", "false").lower() == "true"
    orcs = svc.orc_service.list_orcs(
        tenant_id,
        project_id=int(request.args["project_id"]) if request.args.get("project_id") else None,
        status=request.args.get("status") or None,
        orc_type=request.args.get("orc_type") or None,
        root_only=root_only,
        parent_id=request.args.get("parent_id"),
    )
    result = []
    for orc in orcs:
        item = orc.to_dict_safe()
        item["children"] = [c.to_dict_safe() for c in orc.children if not c.deleted]
        result.append(item)
    return jsonify(result), 200


@bp.post("")
@require_auth
def create_orc():
    data = request.get_json(silent=True) or {}
    orc = svc.orc_service.create_orc(
        int(g.current_user.get("tenant_id")), currentUserId(), data
    )
    return jsonify(orc.to_dict_safe()), 201


@bp.get("/<int:id>")
@require_auth
def get_orc(id):
    tenant_id = int(g.current_user.get("tenant_id"))
    orc = svc.orc_service.get_orc(id, tenant_id)
    result = orc.to_dict_safe()
    result["children"]   = [c.to_dict_safe() for c in orc.children   if not c.deleted]
    result["activities"] = [a.to_dict_safe() for a in orc.activities if not a.deleted]
    return jsonify(result), 200


@bp.put("/<int:id>")
@require_auth
def update_orc(id):
    tenant_id = int(g.current_user.get("tenant_id"))
    orc = svc.orc_service.get_orc(id, tenant_id)
    orc = svc.orc_service.update_orc(orc, currentUserId(), request.get_json(silent=True) or {})
    return jsonify(orc.to_dict_safe()), 200


@bp.delete("/<int:id>")
@require_auth
def delete_orc(id):
    tenant_id = int(g.current_user.get("tenant_id"))
    orc = svc.orc_service.get_orc(id, tenant_id)
    svc.orc_service.delete_orc(orc, currentUserId())
    return jsonify({"message": "ORC supprimé"}), 200
