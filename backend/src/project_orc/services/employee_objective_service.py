"""
Service — Objectifs trimestriels individuels des employés.
Workflow : DRAFT → SUBMITTED → APPROVED | REJECTED → COMPLETED
"""
from datetime import datetime, timezone
from werkzeug.exceptions import NotFound, Forbidden, BadRequest

from backend.src.databases.extensions import db
from backend.src.project_orc.models.employee_objectives import EmployeeObjective
from backend.src.equipment_manager.models.employees import Employee
from backend.src.logger import get_backend_logger

logger = get_backend_logger(__name__)

VALID_TRANSITIONS = {
    "DRAFT":     ["SUBMITTED"],
    "SUBMITTED": ["APPROVED", "REJECTED"],
    "REJECTED":  ["DRAFT", "SUBMITTED"],
    "APPROVED":  ["COMPLETED"],
    "COMPLETED": [],
}


def _get_employee(employee_id: int, tenant_id: int) -> Employee:
    emp = Employee.query.filter_by(id=employee_id, tenant_id=tenant_id, deleted=False).first()
    if not emp:
        raise NotFound("Employé introuvable")
    return emp


def list_objectives(
    tenant_id: int, *,
    employee_id: int = None,
    user_id: int = None,
    project_id: int = None,
    fiscal_year: int = None,
    quarter: str = None,
    status: str = None,
    reviewer_id: int = None,
    pending_review: bool = False,
) -> list[EmployeeObjective]:
    q = EmployeeObjective.query.filter_by(tenant_id=tenant_id, deleted=False)
    if employee_id:    q = q.filter_by(employee_id=employee_id)
    if user_id:        q = q.filter_by(user_id=user_id)
    if project_id:     q = q.filter_by(project_id=project_id)
    if fiscal_year:    q = q.filter_by(fiscal_year=fiscal_year)
    if quarter:        q = q.filter_by(quarter=quarter)
    if status:         q = q.filter_by(status=status)
    if reviewer_id:    q = q.filter_by(reviewer_id=reviewer_id)
    if pending_review: q = q.filter_by(status="SUBMITTED")
    return q.order_by(
        EmployeeObjective.fiscal_year.desc(),
        EmployeeObjective.quarter.desc(),
        EmployeeObjective.employee_id,
        EmployeeObjective.id,
    ).all()


def get_objective(obj_id: int, tenant_id: int) -> EmployeeObjective:
    obj = EmployeeObjective.query.filter_by(id=obj_id, tenant_id=tenant_id, deleted=False).first()
    if not obj:
        raise NotFound("Objectif introuvable")
    return obj


def create_objective(tenant_id: int, user_id: int, data: dict) -> EmployeeObjective:
    employee_id = data.get("employee_id")
    if not employee_id:
        raise BadRequest("employee_id requis")
    _get_employee(int(employee_id), tenant_id)

    if not data.get("title", "").strip():
        raise BadRequest("title requis")
    if not data.get("fiscal_year"):
        raise BadRequest("fiscal_year requis")
    if not data.get("quarter"):
        raise BadRequest("quarter requis")

    obj = EmployeeObjective(
        tenant_id=tenant_id,
        employee_id=int(employee_id),
        user_id=int(data["user_id"]) if data.get("user_id") else None,
        project_id=int(data["project_id"]) if data.get("project_id") else None,
        orc_id=int(data["orc_id"]) if data.get("orc_id") else None,
        title=data["title"].strip(),
        description=data.get("description", ""),
        target_indicator=data.get("target_indicator", ""),
        target_value=data.get("target_value") or None,
        current_value=data.get("current_value") or 0,
        unit=data.get("unit", ""),
        fiscal_year=int(data["fiscal_year"]),
        quarter=data["quarter"],
        priority=data.get("priority", "MEDIUM"),
        status="DRAFT",
        notes=data.get("notes", ""),
        created_by=user_id,
        updated_by=user_id,
    )
    db.session.add(obj)
    db.session.commit()
    return obj


def update_objective(obj: EmployeeObjective, user_id: int, data: dict) -> EmployeeObjective:
    # Seul un DRAFT ou REJECTED peut être modifié par l'employé
    if obj.status not in ("DRAFT", "REJECTED"):
        raise Forbidden("Seul un objectif en brouillon ou rejeté peut être modifié")

    for field in ("title", "description", "target_indicator", "unit", "notes"):
        if field in data:
            val = data[field]
            setattr(obj, field, val.strip() if isinstance(val, str) else val)

    if "target_value"  in data: obj.target_value  = data["target_value"] or None
    if "current_value" in data: obj.current_value = data["current_value"] if data["current_value"] is not None else 0
    if "priority"      in data: obj.priority      = data["priority"]
    if "project_id"    in data: obj.project_id    = int(data["project_id"]) if data["project_id"] else None
    if "orc_id"        in data: obj.orc_id        = int(data["orc_id"])     if data["orc_id"]     else None
    if "fiscal_year"   in data: obj.fiscal_year   = int(data["fiscal_year"])
    if "quarter"       in data: obj.quarter       = data["quarter"]

    obj.updated_by = user_id
    db.session.commit()
    return obj


def submit_objective(obj: EmployeeObjective, user_id: int) -> EmployeeObjective:
    """L'employé soumet son objectif pour validation."""
    if obj.status not in ("DRAFT", "REJECTED"):
        raise BadRequest(f"Impossible de soumettre depuis le statut '{obj.status}'")
    obj.status = "SUBMITTED"
    obj.updated_by = user_id
    db.session.commit()
    return obj


def review_objective(
    obj: EmployeeObjective,
    reviewer_user_id: int,
    decision: str,          # "APPROVED" | "REJECTED"
    review_notes: str = "",
    score: float = None,
    current_value: float = None,
) -> EmployeeObjective:
    """Un manager approuve ou rejette l'objectif."""
    if obj.status != "SUBMITTED":
        raise BadRequest("Seul un objectif soumis peut être évalué")
    if decision not in ("APPROVED", "REJECTED"):
        raise BadRequest("decision doit être APPROVED ou REJECTED")

    obj.status       = decision
    obj.reviewer_id  = reviewer_user_id
    obj.reviewed_at  = datetime.now(timezone.utc)
    obj.review_notes = review_notes or ""
    if score is not None:
        obj.score = score
    if current_value is not None:
        obj.current_value = current_value
    obj.updated_by = reviewer_user_id
    db.session.commit()
    return obj


def complete_objective(obj: EmployeeObjective, user_id: int, score: float = None, current_value: float = None) -> EmployeeObjective:
    """Marque un objectif approuvé comme complété."""
    if obj.status != "APPROVED":
        raise BadRequest("Seul un objectif approuvé peut être marqué comme complété")
    obj.status = "COMPLETED"
    if score is not None:
        obj.score = score
    if current_value is not None:
        obj.current_value = current_value
    obj.updated_by = user_id
    db.session.commit()
    return obj


def delete_objective(obj: EmployeeObjective, user_id: int) -> None:
    if obj.status not in ("DRAFT", "REJECTED"):
        raise Forbidden("Seul un brouillon ou un objectif rejeté peut être supprimé")
    obj.deleted    = True
    obj.is_active  = False
    obj.updated_by = user_id
    db.session.commit()


def get_team_summary(tenant_id: int, fiscal_year: int, quarter: str) -> dict:
    """Résumé des objectifs d'équipe pour un trimestre donné."""
    from sqlalchemy import func
    from backend.src.equipment_manager.models.employees import Employee

    q = EmployeeObjective.query.filter_by(
        tenant_id=tenant_id, fiscal_year=fiscal_year, quarter=quarter, deleted=False
    )
    total       = q.count()
    by_status   = {}
    for s in ("DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "COMPLETED"):
        by_status[s] = q.filter_by(status=s).count()

    avg_score = db.session.query(
        func.avg(EmployeeObjective.score)
    ).filter(
        EmployeeObjective.tenant_id == tenant_id,
        EmployeeObjective.fiscal_year == fiscal_year,
        EmployeeObjective.quarter == quarter,
        EmployeeObjective.deleted == False,
        EmployeeObjective.score.isnot(None),
    ).scalar()

    return {
        "fiscal_year": fiscal_year,
        "quarter":     quarter,
        "total":       total,
        "by_status":   by_status,
        "avg_score":   round(float(avg_score), 2) if avg_score else None,
        "completion_rate": round(by_status["COMPLETED"] / total * 100, 1) if total else 0,
    }
