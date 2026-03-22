"""
Service métier pour les ORCs PROSI.
"""
from werkzeug.exceptions import BadRequest, NotFound

from backend.src.databases.extensions import db
from backend.src.prosi.models.orcs import ORC
from backend.src.prosi.models.projects import Project
from backend.src.logger import get_backend_logger

logger = get_backend_logger(__name__)


def list_orcs(tenant_id: int, *, project_id: int = None, status: str = None,
              orc_type: str = None, root_only: bool = False, parent_id=None) -> list[ORC]:
    query = ORC.query.filter_by(tenant_id=tenant_id, deleted=False)
    if project_id:
        query = query.filter(ORC.project_id == project_id)
    if status:
        query = query.filter(ORC.status == status)
    if orc_type:
        query = query.filter(ORC.orc_type == orc_type)
    if root_only:
        query = query.filter(ORC.parent_id.is_(None))
    elif parent_id == "null":
        query = query.filter(ORC.parent_id.is_(None))
    elif parent_id is not None:
        query = query.filter(ORC.parent_id == int(parent_id))
    return query.order_by(ORC.name).all()


def get_orc(orc_id: int, tenant_id: int) -> ORC:
    orc = ORC.query.filter_by(id=orc_id, tenant_id=tenant_id, deleted=False).first()
    if not orc:
        raise NotFound("ORC introuvable")
    return orc


def create_orc(tenant_id: int, user_id: int, data: dict) -> ORC:
    name = (data.get("name") or "").strip()
    project_id = data.get("project_id")
    if not name:
        raise BadRequest("Le nom est requis")
    if not project_id:
        raise BadRequest("Le projet est requis")

    _check_project(int(project_id), tenant_id)

    parent_id = data.get("parent_id")
    if parent_id:
        parent = ORC.query.filter_by(id=int(parent_id), tenant_id=tenant_id, deleted=False).first()
        if not parent:
            raise BadRequest("ORC parent introuvable")

    # Auto-dérive le type si non fourni : enfant → RESULTAT_CLE, racine → OBJECTIF
    orc_type = data.get("orc_type") or ("RESULTAT_CLE" if parent_id else "OBJECTIF")

    orc = ORC(
        tenant_id=tenant_id,
        project_id=int(project_id),
        parent_id=int(parent_id) if parent_id else None,
        orc_type=orc_type,
        name=name,
        description=data.get("description", ""),
        target_value=data.get("target_value") or None,
        current_value=data.get("current_value") or 0,
        unit=data.get("unit", ""),
        status=data.get("status", "DRAFT"),
        weight=data.get("weight") or 1.0,
        start_date=data.get("start_date") or None,
        end_date=data.get("end_date") or None,
        responsible_id=int(data["responsible_id"]) if data.get("responsible_id") else None,
        notes=data.get("notes", ""),
        is_active=True,
        created_by_id=user_id,
    )
    db.session.add(orc)
    db.session.commit()
    return orc


def update_orc(orc: ORC, user_id: int, data: dict) -> ORC:
    for field in ("name", "description", "notes", "unit"):
        if field in data:
            setattr(orc, field, (data[field] or "").strip() if isinstance(data[field], str) else data[field])

    if "status" in data:
        orc.status = data["status"]
    if "target_value" in data:
        orc.target_value = data["target_value"] or None
    if "current_value" in data:
        orc.current_value = data["current_value"] if data["current_value"] is not None else 0
    if "weight" in data:
        orc.weight = data["weight"] or 1.0
    if "start_date" in data:
        orc.start_date = data["start_date"] or None
    if "end_date" in data:
        orc.end_date = data["end_date"] or None
    if "responsible_id" in data:
        orc.responsible_id = int(data["responsible_id"]) if data["responsible_id"] else None
    if "is_active" in data:
        orc.is_active = bool(data["is_active"])
    if "parent_id" in data:
        orc.parent_id = int(data["parent_id"]) if data["parent_id"] else None
    if "orc_type" in data and data["orc_type"] in ("OBJECTIF", "RESULTAT_CLE"):
        orc.orc_type = data["orc_type"]

    orc.updated_by_id = user_id
    db.session.commit()
    return orc


def delete_orc(orc: ORC, user_id: int) -> None:
    orc.deleted = True
    orc.is_active = False
    orc.updated_by_id = user_id
    db.session.commit()


def _check_project(project_id: int, tenant_id: int) -> None:
    if not Project.query.filter_by(id=project_id, tenant_id=tenant_id, deleted=False).first():
        raise BadRequest("Projet introuvable")
