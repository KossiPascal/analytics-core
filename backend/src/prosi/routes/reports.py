from datetime import datetime, timezone

from flask import Blueprint, request, jsonify, g
from backend.src.security.access_security import require_auth, currentUserId
from backend.src.prosi import services as svc
from backend.src.logger import get_backend_logger

logger = get_backend_logger(__name__)

bp = Blueprint("prosi_reports", __name__, url_prefix="/api/prosi/reports")

MONTHS_FR = [
    '', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

PROJECT_STATUS_FR = {
    'DRAFT': 'Brouillon', 'ACTIVE': 'Actif',
    'ON_HOLD': 'En pause', 'COMPLETED': 'Terminé', 'CANCELLED': 'Annulé',
}

ORC_STATUS_FR = {
    'DRAFT': 'Brouillon', 'ACTIVE': 'Actif',
    'AT_RISK': 'À risque', 'COMPLETED': 'Atteint', 'CANCELLED': 'Annulé',
}

ACT_STATUS_FR = {
    'TODO': 'À faire', 'IN_PROGRESS': 'En cours',
    'DONE': 'Terminé', 'BLOCKED': 'Bloqué', 'CANCELLED': 'Annulé',
}

PRIORITY_FR = {
    'LOW': 'Basse', 'MEDIUM': 'Moyenne', 'HIGH': 'Haute', 'CRITICAL': 'Critique',
}

STATUS_BAR_COLORS = ['#94a3b8', '#6366f1', '#10b981', '#ef4444', '#cbd5e1']


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


@bp.get("/<int:id>/pdf")
@require_auth
def download_report_pdf(id):
    from backend.src.docs_generetor.pdf_generator import pdf_response, IMG_DIR

    tenant_id = int(g.current_user.get("tenant_id"))
    report    = svc.report_service.get_report(id, tenant_id)
    content   = report.content

    # ── Statistiques ──────────────────────────────────────────────────────
    stats        = content.get("summary_stats", {})
    by_status    = stats.get("activities_by_status", {})
    orcs_stat    = stats.get("orcs_by_status", {})
    act_total    = stats.get("activities_this_month", 0)
    avg_progress = round(stats.get("avg_progress_this_month", 0), 1)
    completion   = round(stats.get("overall_completion_rate", 0), 1)
    orcs_total   = stats.get("orcs_total", 0)
    orcs_done    = orcs_stat.get("COMPLETED", 0)

    # Barres de statuts : [(label, count, pct), ...]
    total_for_pct = max(act_total, 1)
    acts_by_status = [
        (ACT_STATUS_FR.get(k, k), v, round(v / total_for_pct * 100))
        for k, v in by_status.items()
    ]

    # ── Contexte template ─────────────────────────────────────────────────
    proj_info = content.get("project", {})
    context = {
        "logo_uri":       (IMG_DIR / "Logo_Integrate_Health.png").as_uri(),
        "title":          report.title,
        "period_label":   f"{MONTHS_FR[report.month]} {report.year}",
        "status":         report.status,
        "summary":        report.summary or "",
        "generated_at":   datetime.now(timezone.utc).strftime("%d/%m/%Y à %H:%M"),
        # Projet
        "project_name":   proj_info.get("name",   report.project.name if report.project else "—"),
        "project_code":   proj_info.get("code",   "—"),
        "project_status": PROJECT_STATUS_FR.get(proj_info.get("status", ""), "—"),
        # KPIs
        "activities_total": act_total,
        "activities_done":  by_status.get("DONE", 0),
        "avg_progress":     avg_progress,
        "orcs_total":       orcs_total,
        "orcs_completed":   orcs_done,
        "completion_rate":  completion,
        # Barres statuts
        "activities_by_status": acts_by_status,
        "status_colors":        STATUS_BAR_COLORS,
        # Tableaux
        "orcs":       content.get("orcs", []),
        "activities": content.get("activities", []),
        # Labels
        "orc_status_labels": ORC_STATUS_FR,
        "act_status_labels": ACT_STATUS_FR,
        "priority_labels":   PRIORITY_FR,
    }

    filename = f"rapport_mensuel_{report.year}_{report.month:02d}_{id}.pdf"
    return pdf_response("rapport_mensuel", context, filename)
