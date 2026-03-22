"""
Service métier pour les Rapports mensuels PROSI.
Contient toute la logique d'agrégation et de génération.
"""
from datetime import datetime, timezone
from werkzeug.exceptions import BadRequest, NotFound

from backend.src.databases.extensions import db
from backend.src.prosi.models.reports import MonthlyReport
from backend.src.prosi.models.projects import Project
from backend.src.prosi.models.orcs import ORC
from backend.src.prosi.models.activities import Activity
from backend.src.logger import get_backend_logger

logger = get_backend_logger(__name__)

MONTH_FR = [
    "", "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
]


def list_reports(tenant_id: int, *, project_id: int = None,
                 year: int = None, status: str = None) -> list[MonthlyReport]:
    query = MonthlyReport.query.filter_by(tenant_id=tenant_id, deleted=False)
    if project_id:
        query = query.filter(MonthlyReport.project_id == project_id)
    if year:
        query = query.filter(MonthlyReport.year == year)
    if status:
        query = query.filter(MonthlyReport.status == status)
    return query.order_by(MonthlyReport.year.desc(), MonthlyReport.month.desc()).all()


def get_report(report_id: int, tenant_id: int) -> MonthlyReport:
    report = MonthlyReport.query.filter_by(id=report_id, tenant_id=tenant_id, deleted=False).first()
    if not report:
        raise NotFound("Rapport introuvable")
    return report


def generate_report(tenant_id: int, user_id: int, data: dict) -> tuple[MonthlyReport, int]:
    """
    Génère (ou régénère) un rapport mensuel pour un projet.
    Retourne (rapport, http_status).
    """
    project_id = data.get("project_id")
    if not project_id:
        raise BadRequest("Le projet est requis")

    project = Project.query.filter_by(id=int(project_id), tenant_id=tenant_id, deleted=False).first()
    if not project:
        raise BadRequest("Projet introuvable")

    year  = int(data.get("year")  or datetime.now(timezone.utc).year)
    month = int(data.get("month") or datetime.now(timezone.utc).month)

    existing = MonthlyReport.query.filter_by(
        project_id=project.id, year=year, month=month
    ).first()

    if existing and not data.get("overwrite"):
        raise BadRequest(
            f"Un rapport existe déjà pour {MONTH_FR[month]} {year}. "
            "Utilisez overwrite=true pour le remplacer."
        )

    content = _build_report_content(project, year, month)
    title   = f"Rapport mensuel — {project.name} — {MONTH_FR[month]} {year}"
    summary = data.get("summary", "")

    if existing and data.get("overwrite"):
        existing.title      = title
        existing.summary    = summary
        existing.content    = content
        existing.status     = "DRAFT"
        existing.updated_by_id = user_id
        db.session.commit()
        return existing, 200

    report = MonthlyReport(
        tenant_id=tenant_id,
        project_id=project.id,
        year=year,
        month=month,
        title=title,
        summary=summary,
        status="DRAFT",
        is_active=True,
        created_by_id=user_id,
    )
    report.content = content
    db.session.add(report)
    db.session.commit()
    return report, 201


def update_report(report: MonthlyReport, user_id: int, data: dict) -> MonthlyReport:
    if "title" in data:
        report.title = (data["title"] or "").strip()
    if "summary" in data:
        report.summary = data["summary"] or ""
    if "status" in data:
        report.status = data["status"]
    if "content" in data:
        report.content = data["content"]

    report.updated_by_id = user_id
    db.session.commit()
    return report


def delete_report(report: MonthlyReport, user_id: int) -> None:
    report.deleted   = True
    report.is_active = False
    report.updated_by_id = user_id
    db.session.commit()


# ─── Logique d'agrégation (privé) ────────────────────────────────────────────

def _build_report_content(project: Project, year: int, month: int) -> dict:
    from sqlalchemy import extract

    activities_month = Activity.query.filter(
        Activity.project_id == project.id,
        Activity.deleted    == False,
        extract('year',  Activity.due_date) == year,
        extract('month', Activity.due_date) == month,
    ).all()

    all_orcs       = ORC.query.filter_by(project_id=project.id, deleted=False).all()
    all_activities = Activity.query.filter_by(project_id=project.id, deleted=False).all()

    # Statistiques activités du mois
    act_by_status = {}
    for a in activities_month:
        act_by_status[a.status] = act_by_status.get(a.status, 0) + 1

    avg_progress_month = round(
        sum(a.progress for a in activities_month) / len(activities_month), 1
    ) if activities_month else 0

    # Statistiques ORCs
    orc_by_status = {}
    for o in all_orcs:
        orc_by_status[o.status] = orc_by_status.get(o.status, 0) + 1

    # Taux de complétion global
    done_count      = sum(1 for a in all_activities if a.status == "DONE")
    completion_rate = round(done_count / len(all_activities) * 100, 1) if all_activities else 0

    return {
        "period": {"year": year, "month": month, "label": f"{MONTH_FR[month]} {year}"},
        "project": {
            "id": str(project.id), "name": project.name,
            "code": project.code, "status": project.status,
        },
        "summary_stats": {
            "activities_this_month": len(activities_month),
            "activities_by_status": act_by_status,
            "avg_progress_this_month": avg_progress_month,
            "orcs_total": len(all_orcs),
            "orcs_by_status": orc_by_status,
            "overall_completion_rate": completion_rate,
        },
        "activities": [
            {
                "id": str(a.id), "name": a.name, "status": a.status,
                "priority": a.priority, "progress": a.progress,
                "due_date": a.due_date.isoformat() if a.due_date else None,
                "assignee_name": (
                    f"{a.assignee.firstname or ''} {a.assignee.lastname or ''}".strip()
                    if a.assignee else None
                ),
                "orc_name": a.orc.name if a.orc else None,
            }
            for a in sorted(activities_month, key=lambda x: x.due_date or datetime.max.date())
        ],
        "orcs": [
            {
                "id": str(o.id), "name": o.name, "status": o.status,
                "progress_percent": o.progress_percent,
                "current_value": float(o.current_value or 0),
                "target_value": float(o.target_value) if o.target_value else None,
                "unit": o.unit,
            }
            for o in all_orcs
        ],
    }
