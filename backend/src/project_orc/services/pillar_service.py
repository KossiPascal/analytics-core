from werkzeug.exceptions import NotFound

from backend.src.databases.extensions import db
from backend.src.project_orc.models.pillars import StrategicPillar


def list_pillars(tenant_id, *, project_id=None) -> list[StrategicPillar]:
    q = StrategicPillar.query.filter_by(tenant_id=tenant_id, deleted=False)
    if project_id:
        q = q.filter_by(project_id=project_id)
    return q.order_by(StrategicPillar.order_index, StrategicPillar.id).all()


def get_pillar(pillar_id, tenant_id) -> StrategicPillar:
    p = StrategicPillar.query.filter_by(id=pillar_id, tenant_id=tenant_id, deleted=False).first()
    if not p:
        raise NotFound("Pilier introuvable")
    return p


def create_pillar(tenant_id, user_id, data) -> StrategicPillar:
    p = StrategicPillar(
        tenant_id=tenant_id,
        project_id=int(data["project_id"]),
        name=data["name"].strip(),
        code=data.get("code", "").strip(),
        description=data.get("description", ""),
        order_index=int(data.get("order_index", 0)),
        fiscal_year=data.get("fiscal_year"),
        created_by=user_id,
        updated_by=user_id,
    )
    db.session.add(p)
    db.session.commit()
    return p


def update_pillar(pillar, user_id, data) -> StrategicPillar:
    for field in ("name", "code", "description", "order_index", "fiscal_year"):
        if field in data:
            setattr(pillar, field, data[field])
    pillar.updated_by = user_id
    db.session.commit()
    return pillar


def delete_pillar(pillar, user_id) -> None:
    pillar.deleted    = True
    pillar.is_active  = False
    pillar.updated_by = user_id
    db.session.commit()
