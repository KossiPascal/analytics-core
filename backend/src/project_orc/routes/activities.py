from flask import Blueprint, request, jsonify, g
from backend.src.security.access_security import require_auth, currentUserId
from backend.src.project_orc import services as svc
from backend.src.logger import get_backend_logger

logger = get_backend_logger(__name__)

bp = Blueprint("prosi_activities", __name__, url_prefix="/api/prosi/activities")


@bp.get("")
@require_auth
def list_activities():
    tenant_id = int(g.current_user.get("tenant_id"))
    activities = svc.activity_service.list_activities(
        tenant_id,
        project_id=int(request.args["project_id"]) if request.args.get("project_id") else None,
        orc_id=int(request.args["orc_id"])          if request.args.get("orc_id")     else None,
        status=request.args.get("status")           or None,
        priority=request.args.get("priority")       or None,
        assignee_id=int(request.args["assignee_id"]) if request.args.get("assignee_id") else None,
        search=request.args.get("search", "").strip() or None,
        month=request.args.get("month")             or None,
        overdue=request.args.get("overdue") == "true",
    )
    return jsonify([a.to_dict_safe() for a in activities]), 200


@bp.post("")
@require_auth
def create_activity():
    data = request.get_json(silent=True) or {}
    activity = svc.activity_service.create_activity(
        int(g.current_user.get("tenant_id")), currentUserId(), data
    )
    return jsonify(activity.to_dict_safe()), 201


@bp.get("/<int:id>")
@require_auth
def get_activity(id):
    tenant_id = int(g.current_user.get("tenant_id"))
    activity = svc.activity_service.get_activity(id, tenant_id)
    result = activity.to_dict_safe()
    result["progress_logs"] = [
        p.to_dict_safe() for p in sorted(
            activity.progress_logs, key=lambda x: x.log_date, reverse=True
        )
    ]
    return jsonify(result), 200


@bp.put("/<int:id>")
@require_auth
def update_activity(id):
    tenant_id = int(g.current_user.get("tenant_id"))
    activity = svc.activity_service.get_activity(id, tenant_id)
    activity = svc.activity_service.update_activity(activity, currentUserId(), request.get_json(silent=True) or {})
    return jsonify(activity.to_dict_safe()), 200


@bp.delete("/<int:id>")
@require_auth
def delete_activity(id):
    tenant_id = int(g.current_user.get("tenant_id"))
    activity = svc.activity_service.get_activity(id, tenant_id)
    svc.activity_service.delete_activity(activity, currentUserId())
    return jsonify({"message": "Activité supprimée"}), 200


@bp.post("/<int:id>/progress")
@require_auth
def log_progress(id):
    tenant_id = int(g.current_user.get("tenant_id"))
    activity = svc.activity_service.get_activity(id, tenant_id)
    log = svc.activity_service.log_progress(activity, currentUserId(), request.get_json(silent=True) or {})
    return jsonify(log.to_dict_safe()), 201
