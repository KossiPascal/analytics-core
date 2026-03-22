from flask import Blueprint, request, jsonify, g
from backend.src.security.access_security import require_auth, currentUserId
from backend.src.prosi import services as svc
from backend.src.logger import get_backend_logger

logger = get_backend_logger(__name__)

bp = Blueprint("prosi_reports", __name__, url_prefix="/api/prosi/reports")


@bp.get("")
@require_auth
def list_reports():
    tenant_id = int(g.current_user.get("tenant_id"))
    reports = svc.report_service.list_reports(
        tenant_id,
        project_id=int(request.args["project_id"]) if request.args.get("project_id") else None,
        year=int(request.args["year"])              if request.args.get("year")        else None,
        status=request.args.get("status")          or None,
    )
    return jsonify([r.to_dict_safe() for r in reports]), 200


@bp.post("/generate")
@require_auth
def generate_report():
    data = request.get_json(silent=True) or {}
    report, status_code = svc.report_service.generate_report(
        int(g.current_user.get("tenant_id")), currentUserId(), data
    )
    return jsonify(report.to_dict_safe()), status_code


@bp.get("/<int:id>")
@require_auth
def get_report(id):
    tenant_id = int(g.current_user.get("tenant_id"))
    report = svc.report_service.get_report(id, tenant_id)
    return jsonify(report.to_dict_safe()), 200


@bp.put("/<int:id>")
@require_auth
def update_report(id):
    tenant_id = int(g.current_user.get("tenant_id"))
    report = svc.report_service.get_report(id, tenant_id)
    report = svc.report_service.update_report(report, currentUserId(), request.get_json(silent=True) or {})
    return jsonify(report.to_dict_safe()), 200


@bp.delete("/<int:id>")
@require_auth
def delete_report(id):
    tenant_id = int(g.current_user.get("tenant_id"))
    report = svc.report_service.get_report(id, tenant_id)
    svc.report_service.delete_report(report, currentUserId())
    return jsonify({"message": "Rapport supprimé"}), 200
