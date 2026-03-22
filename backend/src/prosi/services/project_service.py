"""
Service métier pour les Projets PROSI.
Pas de dépendance Flask (ni request, ni g) — uniquement de la logique DB.
"""
from sqlalchemy.exc import IntegrityError
from werkzeug.exceptions import BadRequest, NotFound

from backend.src.databases.extensions import db
from backend.src.prosi.models.projects import Project
from backend.src.logger import get_backend_logger

logger = get_backend_logger(__name__)


def list_projects(tenant_id: int, *, status: str = None, priority: str = None,
                  search: str = None, active: bool = None) -> list[Project]:
    query = Project.query.filter_by(tenant_id=tenant_id, deleted=False)
    if status:
        query = query.filter(Project.status == status)
    if priority:
        query = query.filter(Project.priority == priority)
    if search:
        query = query.filter(Project.name.ilike(f"%{search}%"))
    if active is not None:
        query = query.filter(Project.is_active == active)
    return query.order_by(Project.created_at.desc()).all()


def get_project(project_id: int, tenant_id: int) -> Project:
    project = Project.query.filter_by(id=project_id, tenant_id=tenant_id, deleted=False).first()
    if not project:
        raise NotFound("Projet introuvable")
    return project


def create_project(tenant_id: int, user_id: int, data: dict) -> Project:
    name = (data.get("name") or "").strip()
    code = (data.get("code") or "").strip()
    if not name or not code:
        raise BadRequest("Le nom et le code sont requis")

    try:
        project = Project(
            tenant_id=tenant_id,
            name=name,
            code=code.upper(),
            description=data.get("description", ""),
            start_date=data.get("start_date") or None,
            end_date=data.get("end_date") or None,
            status=data.get("status", "DRAFT"),
            priority=data.get("priority", "MEDIUM"),
            budget=data.get("budget") or None,
            budget_currency=data.get("budget_currency", "XOF"),
            owner_id=int(data["owner_id"]) if data.get("owner_id") else None,
            notes=data.get("notes", ""),
            is_active=True,
            created_by_id=user_id,
        )
        db.session.add(project)
        db.session.commit()
        return project
    except IntegrityError:
        db.session.rollback()
        raise BadRequest("Un projet avec ce code existe déjà pour ce tenant")


def update_project(project: Project, user_id: int, data: dict) -> Project:
    for field in ("name", "description", "notes", "budget_currency"):
        if field in data:
            setattr(project, field, (data[field] or "").strip() if isinstance(data[field], str) else data[field])

    if "code" in data and data["code"]:
        project.code = data["code"].strip().upper()
    if "status" in data:
        project.status = data["status"]
    if "priority" in data:
        project.priority = data["priority"]
    if "start_date" in data:
        project.start_date = data["start_date"] or None
    if "end_date" in data:
        project.end_date = data["end_date"] or None
    if "budget" in data:
        project.budget = data["budget"] or None
    if "owner_id" in data:
        project.owner_id = int(data["owner_id"]) if data["owner_id"] else None
    if "is_active" in data:
        project.is_active = bool(data["is_active"])

    project.updated_by_id = user_id
    try:
        db.session.commit()
        return project
    except IntegrityError:
        db.session.rollback()
        raise BadRequest("Un projet avec ce code existe déjà")


def delete_project(project: Project, user_id: int) -> None:
    project.deleted = True
    project.is_active = False
    project.updated_by_id = user_id
    db.session.commit()


def get_project_stats(project_id: int) -> dict:
    from backend.src.prosi.models.orcs import ORC
    from backend.src.prosi.models.activities import Activity

    orcs = ORC.query.filter_by(project_id=project_id, deleted=False).all()
    activities = Activity.query.filter_by(project_id=project_id, deleted=False).all()

    orc_by_status = {}
    for o in orcs:
        orc_by_status[o.status] = orc_by_status.get(o.status, 0) + 1

    act_by_status = {}
    for a in activities:
        act_by_status[a.status] = act_by_status.get(a.status, 0) + 1

    avg_progress = round(
        sum(a.progress for a in activities) / len(activities), 1
    ) if activities else 0

    return {
        "project_id": str(project_id),
        "orcs_total": len(orcs),
        "orcs_by_status": orc_by_status,
        "activities_total": len(activities),
        "activities_by_status": act_by_status,
        "activities_avg_progress": avg_progress,
    }
