from flask import Blueprint, request, jsonify, g
from backend.src.security.access_security import require_auth, currentUserId
from backend.src.project_orc import services as svc
from backend.src.logger import get_backend_logger

logger = get_backend_logger(__name__)
bp = Blueprint("prosi_pillars", __name__, url_prefix="/api/prosi/pillars")


@bp.get("")
@require_auth
def list_pillars():
    tenant_id  = int(g.current_user.get("tenant_id"))
    project_id = request.args.get("project_id", type=int)
    data = svc.pillar_service.list_pillars(tenant_id, project_id=project_id)
    return jsonify([p.to_dict_safe() for p in data]), 200


@bp.post("")
@require_auth
def create_pillar():
    tenant_id = int(g.current_user.get("tenant_id"))
    body = request.get_json(force=True) or {}
    p = svc.pillar_service.create_pillar(tenant_id, currentUserId(), body)
    return jsonify(p.to_dict_safe()), 201


@bp.put("/<int:id>")
@require_auth
def update_pillar(id):
    tenant_id = int(g.current_user.get("tenant_id"))
    pillar = svc.pillar_service.get_pillar(id, tenant_id)
    body   = request.get_json(force=True) or {}
    p = svc.pillar_service.update_pillar(pillar, currentUserId(), body)
    return jsonify(p.to_dict_safe()), 200


@bp.delete("/<int:id>")
@require_auth
def delete_pillar(id):
    tenant_id = int(g.current_user.get("tenant_id"))
    pillar = svc.pillar_service.get_pillar(id, tenant_id)
    svc.pillar_service.delete_pillar(pillar, currentUserId())
    return jsonify({"message": "Pilier supprimé"}), 200
