"""
Service métier pour le Dashboard PROSI.
Agrège les indicateurs clés de tous les projets d'un tenant.
"""
from datetime import datetime, timezone

from backend.src.databases.extensions import db
from backend.src.prosi.models.projects import Project
from backend.src.prosi.models.orcs import ORC
from backend.src.prosi.models.activities import Activity
from backend.src.prosi.models.reports import MonthlyReport
from backend.src.logger import get_backend_logger

logger = get_backend_logger(__name__)


def get_dashboard_stats(tenant_id: int) -> dict:
    today = datetime.now(timezone.utc).date()

    # ── Projets ───────────────────────────────────────────────────────────────
    projects = Project.query.filter_by(tenant_id=tenant_id, deleted=False).all()
    proj_by_status = {}
    for p in projects:
        proj_by_status[p.status] = proj_by_status.get(p.status, 0) + 1

    # ── ORCs ──────────────────────────────────────────────────────────────────
    orcs = ORC.query.filter_by(tenant_id=tenant_id, deleted=False).all()
    orc_by_status = {}
    for o in orcs:
        orc_by_status[o.status] = orc_by_status.get(o.status, 0) + 1

    avg_orc_progress = round(
        sum(o.progress_percent for o in orcs) / len(orcs), 1
    ) if orcs else 0

    # ── Activités ─────────────────────────────────────────────────────────────
    activities = Activity.query.filter_by(tenant_id=tenant_id, deleted=False).all()
    act_by_status = {}
    for a in activities:
        act_by_status[a.status] = act_by_status.get(a.status, 0) + 1

    overdue_count = sum(
        1 for a in activities
        if a.due_date and a.due_date < today and a.status not in ("DONE", "CANCELLED")
    )

    due_soon = [
        a.to_dict_safe() for a in sorted(
            [a for a in activities
             if a.due_date and a.due_date >= today and a.status not in ("DONE", "CANCELLED")],
            key=lambda x: x.due_date
        )[:5]
    ]

    avg_activity_progress = round(
        sum(a.progress for a in activities) / len(activities), 1
    ) if activities else 0

    # ── Tendance mensuelle (12 derniers mois) ─────────────────────────────────
    activity_trend = _get_activity_trend(tenant_id)

    # ── Rapports ──────────────────────────────────────────────────────────────
    reports_count = MonthlyReport.query.filter_by(tenant_id=tenant_id, deleted=False).count()

    return {
        "projects": {
            "total": len(projects),
            "by_status": proj_by_status,
            "active": proj_by_status.get("ACTIVE", 0),
        },
        "orcs": {
            "total": len(orcs),
            "by_status": orc_by_status,
            "avg_progress": avg_orc_progress,
            "at_risk": orc_by_status.get("AT_RISK", 0),
            "completed": orc_by_status.get("COMPLETED", 0),
        },
        "activities": {
            "total": len(activities),
            "by_status": act_by_status,
            "overdue": overdue_count,
            "avg_progress": avg_activity_progress,
            "due_soon": due_soon,
        },
        "reports_count": reports_count,
        "activity_trend": activity_trend,
    }


def _get_activity_trend(tenant_id: int) -> list[dict]:
    from sqlalchemy import extract, func

    rows = (
        db.session.query(
            extract('year',  Activity.due_date).label('year'),
            extract('month', Activity.due_date).label('month'),
            func.count(Activity.id).label('total'),
            func.sum(db.case((Activity.status == 'DONE', 1), else_=0)).label('done'),
        )
        .filter(
            Activity.tenant_id == tenant_id,
            Activity.deleted   == False,
            Activity.due_date.isnot(None),
        )
        .group_by('year', 'month')
        .order_by('year', 'month')
        .limit(12)
        .all()
    )
    return [
        {"year": int(r.year), "month": int(r.month), "total": r.total, "done": r.done}
        for r in rows
    ]
