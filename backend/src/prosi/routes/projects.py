from flask import Blueprint, request, jsonify, g
from backend.src.security.access_security import require_auth, currentUserId
from backend.src.prosi import services as svc
from backend.src.logger import get_backend_logger

logger = get_backend_logger(__name__)

bp = Blueprint("prosi_projects", __name__, url_prefix="/api/prosi/projects")


@bp.get("")
@require_auth
def list_projects():
    tenant_id = int(g.current_user.get("tenant_id"))
    projects = svc.project_service.list_projects(
        tenant_id,
        status=request.args.get("status") or None,
        priority=request.args.get("priority") or None,
        search=request.args.get("search", "").strip() or None,
        active=request.args.get("active", type=lambda v: v.lower() == "true") if "active" in request.args else None,
    )
    return jsonify([p.to_dict_safe() for p in projects]), 200


@bp.post("")
@require_auth
def create_project():
    data = request.get_json(silent=True) or {}
    project = svc.project_service.create_project(
        int(g.current_user.get("tenant_id")), currentUserId(), data
    )
    return jsonify(project.to_dict_safe()), 201


@bp.get("/<int:id>")
@require_auth
def get_project(id):
    tenant_id = int(g.current_user.get("tenant_id"))
    project = svc.project_service.get_project(id, tenant_id)
    result = project.to_dict_safe()
    result["orcs_count"]       = len([o for o in project.orcs       if not o.deleted])
    result["activities_count"] = len([a for a in project.activities if not a.deleted])
    return jsonify(result), 200


@bp.put("/<int:id>")
@require_auth
def update_project(id):
    tenant_id = int(g.current_user.get("tenant_id"))
    project = svc.project_service.get_project(id, tenant_id)
    project = svc.project_service.update_project(project, currentUserId(), request.get_json(silent=True) or {})
    return jsonify(project.to_dict_safe()), 200


@bp.delete("/<int:id>")
@require_auth
def delete_project(id):
    tenant_id = int(g.current_user.get("tenant_id"))
    project = svc.project_service.get_project(id, tenant_id)
    svc.project_service.delete_project(project, currentUserId())
    return jsonify({"message": "Projet supprimé"}), 200


@bp.get("/<int:id>/stats")
@require_auth
def project_stats(id):
    tenant_id = int(g.current_user.get("tenant_id"))
    svc.project_service.get_project(id, tenant_id)   # vérif accès
    stats = svc.project_service.get_project_stats(id)
    return jsonify(stats), 200
