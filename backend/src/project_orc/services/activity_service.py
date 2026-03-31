"""
Service métier pour les Activités PROSI.
"""
from datetime import datetime, timezone
from werkzeug.exceptions import BadRequest, NotFound

from backend.src.databases.extensions import db
from backend.src.project_orc.models.activities import Activity, ActivityProgress
from backend.src.project_orc.models.projects import Project
from backend.src.logger import get_backend_logger

logger = get_backend_logger(__name__)


def list_activities(tenant_id: int, *, project_id: int = None, orc_id: int = None,
                    status: str = None, priority: str = None, assignee_id: int = None,
                    search: str = None, month: str = None, overdue: bool = False) -> list[Activity]:
    query = Activity.query.filter_by(tenant_id=tenant_id, deleted=False)

    if project_id:
        query = query.filter(Activity.project_id == project_id)
    if orc_id:
        query = query.filter(Activity.orc_id == orc_id)
    if status:
        query = query.filter(Activity.status == status)
    if priority:
        query = query.filter(Activity.priority == priority)
    if assignee_id:
        query = query.filter(Activity.assignee_id == assignee_id)
    if search:
        query = query.filter(Activity.name.ilike(f"%{search}%"))

    if month:
        try:
            from sqlalchemy import extract
            y, m = month.split("-")
            query = query.filter(
                extract('year',  Activity.due_date) == int(y),
                extract('month', Activity.due_date) == int(m),
            )
        except Exception:
            pass

    if overdue:
        today = datetime.now(timezone.utc).date()
        query = query.filter(
            Activity.due_date < today,
            Activity.status.notin_(["DONE", "CANCELLED"])
        )

    return query.order_by(Activity.due_date.asc().nullslast(), Activity.name).all()


def get_activity(activity_id: int, tenant_id: int) -> Activity:
    activity = Activity.query.filter_by(id=activity_id, tenant_id=tenant_id, deleted=False).first()
    if not activity:
        raise NotFound("Activité introuvable")
    return activity


def create_activity(tenant_id: int, user_id: int, data: dict) -> Activity:
    name = (data.get("name") or "").strip()
    project_id = data.get("project_id")
    if not name:
        raise BadRequest("Le nom de l'activité est requis")
    if not project_id:
        raise BadRequest("Le projet est requis")

    _check_project(int(project_id), tenant_id)

    tags = data.get("tags") or []
    tags_str = ",".join(tags) if isinstance(tags, list) else str(tags)

    activity = Activity(
        tenant_id=tenant_id,
        project_id=int(project_id),
        orc_id=int(data["orc_id"]) if data.get("orc_id") else None,
        name=name,
        description=data.get("description", ""),
        start_date=data.get("start_date") or None,
        end_date=data.get("end_date") or None,
        due_date=data.get("due_date") or None,
        status=data.get("status", "TODO"),
        priority=data.get("priority", "MEDIUM"),
        progress=int(data.get("progress") or 0),
        assignee_id=int(data["assignee_id"]) if data.get("assignee_id") else None,
        notes=data.get("notes", ""),
        tags=tags_str,
        is_active=True,
        created_by_id=user_id,
    )
    db.session.add(activity)
    db.session.commit()
    return activity


def update_activity(activity: Activity, user_id: int, data: dict) -> Activity:
    for field in ("name", "description", "notes"):
        if field in data:
            setattr(activity, field, (data[field] or "").strip() if isinstance(data[field], str) else data[field])

    if "status" in data:
        activity.status = data["status"]
        if data["status"] == "DONE":
            activity.progress = 100
    if "priority" in data:
        activity.priority = data["priority"]
    if "progress" in data:
        activity.progress = max(0, min(100, int(data["progress"] or 0)))
    if "start_date" in data:
        activity.start_date = data["start_date"] or None
    if "end_date" in data:
        activity.end_date = data["end_date"] or None
    if "due_date" in data:
        activity.due_date = data["due_date"] or None
    if "assignee_id" in data:
        activity.assignee_id = int(data["assignee_id"]) if data["assignee_id"] else None
    if "orc_id" in data:
        activity.orc_id = int(data["orc_id"]) if data["orc_id"] else None
    if "tags" in data:
        tags = data["tags"] or []
        activity.tags = ",".join(tags) if isinstance(tags, list) else str(tags)
    if "is_active" in data:
        activity.is_active = bool(data["is_active"])

    activity.updated_by_id = user_id
    db.session.commit()
    return activity


def delete_activity(activity: Activity, user_id: int) -> None:
    activity.deleted = True
    activity.is_active = False
    activity.updated_by_id = user_id
    db.session.commit()


def log_progress(activity: Activity, user_id: int, data: dict) -> ActivityProgress:
    percent = max(0, min(100, int(data.get("progress_percent") or 0)))

    log = ActivityProgress(
        activity_id=activity.id,
        progress_percent=percent,
        notes=data.get("notes", ""),
        log_date=data.get("log_date") or datetime.now(timezone.utc).date(),
        is_active=True,
        created_by_id=user_id,
    )
    db.session.add(log)

    activity.progress = percent
    if percent == 100 and activity.status not in ("DONE", "CANCELLED"):
        activity.status = "DONE"
    activity.updated_by_id = user_id

    db.session.commit()
    return log


def _check_project(project_id: int, tenant_id: int) -> None:
    if not Project.query.filter_by(id=project_id, tenant_id=tenant_id, deleted=False).first():
        raise BadRequest("Projet introuvable")
