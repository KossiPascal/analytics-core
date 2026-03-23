import uuid
from typing import List, Optional
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, g
from backend.src.databases.extensions import db
from backend.src.models.visualization import Visualization, VisualizationDhis2Validation,VisualizationExecutionLog,VisualizationShare, VisualizationView
from backend.src.security.access_security import require_auth, currentUserId
from backend.src.logger import get_backend_logger

from werkzeug.exceptions import BadRequest, NotFound
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from sqlalchemy.orm import selectinload

logger = get_backend_logger(__name__)

bp = Blueprint("visualizations", __name__, url_prefix="/api/visualizations")


# Helper functions
def list_fields(field_id: Optional[int] = None, tenant_id: Optional[int] = None,dataset_id: Optional[int] = None, search: Optional[str] = None, all:bool = True):
    query = Visualization.query.options(
        selectinload(Visualization.tenant),
        # selectinload(Visualization.charts),
        # selectinload(Visualization.execution_logs),
        # selectinload(Visualization.shares),
        # selectinload(Visualization.views),
        # selectinload(Visualization.targets),
        # selectinload(Visualization.dhis2_validations),
    ).filter(Visualization.deleted == False)

    if field_id is not None:
        query = query.filter(Visualization.id == field_id)
    if tenant_id is not None:
        query = query.filter(Visualization.tenant_id == tenant_id)
    if dataset_id is not None:
        query = query.filter(Visualization.dataset_id == dataset_id)

    if search and search.strip() != '':
        query = query.filter(Visualization.name.ilike(f"%{search}%"))
        charts: List[Visualization] = query.all()
        return [chart.to_dict() for chart in charts]

    elif all == True:
        charts: List[Visualization] = query.all()
        return [chart.to_dict() for chart in charts]
    else:
        chart:Visualization = query.first()
        return chart.to_dict()


def commit_session():
    try:
        db.session.commit()
    except IntegrityError as e:
        db.session.rollback()
        raise BadRequest(f"Integrity error: {str(e.orig)}")
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.exception(e)
        raise BadRequest(f"Database error: {str(e)}")



# 📚 LIST Visualization
@bp.get("")
@require_auth
def list_visualizations():
    tenant_id = request.args.get("tenant_id", type=int)
    if not tenant_id:
        raise BadRequest("tenant_id is required", 400)
    
    query = Visualization.query.options(
        selectinload(Visualization.tenant),
        selectinload(Visualization.charts),
        # selectinload(Visualization.execution_logs),
        # selectinload(Visualization.shares),
        # selectinload(Visualization.dhis2_validations),
        # selectinload(Visualization.views),
        # selectinload(Visualization.targets),

    ).filter(
        Visualization.tenant_id==tenant_id,
        Visualization.deleted == False,
    )


    vtype = request.args.get("type", type=str)
    status = request.args.get("status", type=str)
    search = request.args.get("search", type=str)
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)

    if vtype:
        query = query.filter_by(type=vtype)
    if status:
        query = query.filter_by(status=status)
    if search:
        query = query.filter(Visualization.name.ilike(f"%{search}%"))

    vizs:List[Visualization] = query.all()

    # print([v.to_dict() for v in vizs])
    return jsonify([v.to_dict() for v in vizs])

    # paginated = query.order_by(Visualization.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)

    # return jsonify({
    #     "items": [v.serialize() for v in paginated.items],
    #     "total": paginated.total,
    #     "page": paginated.page,
    #     "pages": paginated.pages
    # }), 200


# 📄 GET ONE
@bp.get("/<int:vid>")
@require_auth
def get_visualization(vid:int):
    v:Visualization = Visualization.query.get(vid)
    if not v:
        raise BadRequest("Visualization not found", 404)
    return jsonify(v.to_dict()), 200


# ✅ CREATE Visualization
@bp.post("")
@require_auth
def create_visualization():
    payload = request.get_json() or {}
    tenant_id = payload.get("tenant_id") # g.current_user["tenant_id"]
    if not tenant_id:
        raise BadRequest("tenant_id is required", 400)

    viz = Visualization(
        tenant_id=tenant_id,
        name=payload.get("name"),
        type=payload.get("type", "dashboard"),
        description=payload.get("description"),
        status=payload.get("status", "draft"),
        state=payload.get("state", "pending"),
        layout=payload.get("layout") or {},
        filters=payload.get("filters") or {},
        config=payload.get("config") or {},
        created_by_id=currentUserId(),
    )

    db.session.add(viz)
    commit_session()
    return jsonify(viz.to_dict()), 201

# ✏️ UPDATE
@bp.put("/<int:vid>")
@require_auth
def update_visualization(vid:int):
    viz:Visualization = Visualization.query.get(vid)
    if not viz:
        raise BadRequest("Visualization not found", 404)

    payload = request.get_json() or {}
    for field in ["name", "type", "description", "status", "state", "layout", "filters", "config", "generated_data"]:
        if field in payload and hasattr(viz, field):
            setattr(viz, field, payload[field])

    commit_session()
    return jsonify(viz.to_dict())

# 🗑 DELETE + BULK DELETE
@bp.delete("/<int:vid>")
@require_auth
def delete_visualization(vid:int):
    v = Visualization.query.get(vid)
    if not v:
        raise BadRequest("Not found", 404)

    db.session.delete(v)
    commit_session()
    return jsonify({"message": "Deleted successfully"})

@bp.post("/bulk-delete")
@require_auth
def bulk_delete():

    payload = request.get_json() or {}

    ids = payload.get("ids") or []
    tenant_id = payload.get("tenant_id")

    if not tenant_id or not ids:
        raise BadRequest("Invalid input", 400)

    Visualization.query.filter(
        Visualization.tenant_id == tenant_id, 
        Visualization.id.in_(ids)
    ).delete(synchronize_session="fetch")

    commit_session()

    return jsonify({"deleted_ids": ids})



@bp.post("/<int:vid>/share")
@require_auth
def share_visualization(vid: int):
    payload = request.get_json() or {}

    tenant_id = payload.get("tenant_id")
    if not tenant_id:
        raise BadRequest("tenant_id is required", 400)
    
    viz:Visualization = (
        Visualization.query.filter(
            Visualization.id==vid, 
            Visualization.tenant_id==tenant_id,
            Visualization.deleted==False, 
        ).first()
    )

    if not viz:
        raise BadRequest("Visualization not found", 404)

    permission_id = payload.get("permission_id")
    if not permission_id:
        raise BadRequest("permission_id is required")
    
    share:VisualizationShare = (
        VisualizationShare.query.filter(
            VisualizationShare.visualization_id==vid, 
            VisualizationShare.tenant_id==tenant_id,
            VisualizationShare.permission_id==permission_id,
        ).first()
    )

    user_id = currentUserId()

    if not share:
        share = VisualizationShare(
            visualization_id=vid,
            tenant_id=tenant_id,
            user_id=payload.get("user_id"),
            permission_id=permission_id,
            public_token=payload.get("public_token", str(uuid.uuid4())),
            can_view=payload.get("can_view", True),
            can_edit=payload.get("can_edit", False),
            can_execute=payload.get("can_execute", False)
        )
        share.created_at = user_id

        db.session.add(share)

    else:
        # update permissions
        for k in ["can_view","can_edit","can_execute"]:
            if k in payload:
                setattr(share, k, payload[k])

        share.updated_by_id = user_id

    commit_session()

    return jsonify(share.to_dict()), 201




@bp.post("/<int:vid>/dhis2-validate")
@require_auth
def dhis2_validate(vid:int):
    payload = request.get_json() or {}

    tenant_id = payload.get("tenant_id")
    if not tenant_id:
        raise BadRequest("tenant_id is required", 400)
    
    viz:Visualization = (
        Visualization.query.filter(
            Visualization.id==vid, 
            Visualization.tenant_id==tenant_id,
            Visualization.deleted==False, 
        ).first()
    )
    if not viz:
        raise BadRequest("Visualization not found", 404)
    
    user_id = currentUserId()

    validation = VisualizationDhis2Validation(
        tenant_id=tenant_id,
        visualization_id=vid,
        uid=payload.get("uid"),
        on_dhis2=payload.get("on_dhis2", False),
        on_dhis2_at=datetime.now(timezone.utc) if payload.get("on_dhis2") else None,
        on_dhis2_by_id=user_id,
        is_validate=payload.get("is_validate", False),
        validated_at=datetime.now(timezone.utc) if payload.get("is_validate") else None,
        validated_by_id=user_id if payload.get("is_validate") else None
    )
    validation.created_by_id = user_id

    db.session.add(validation)
    commit_session()

    return jsonify(validation.to_dict()), 201


# VisualizationView
@bp.post("/<int:vid>/visual")
@require_auth
def create_visualization_view(vid:int):
    payload = request.get_json() or {}

    tenant_id = payload.get("tenant_id")
    if not tenant_id:
        raise BadRequest("tenant_id is required", 400)

    view = VisualizationView(
        tenant_id=tenant_id,
        visualization_id=vid,
        name=payload.get("name"),
        filters=payload.get("filters") or {},
        layout=payload.get("layout") or {},
    )
    view.created_by_id = currentUserId()

    db.session.add(view)

    commit_session()

    return jsonify(view.to_dict()), 201





@bp.post("/<int:vid>/execute-log")
@require_auth
def create_execution_log(vid:int):
    v:Visualization = Visualization.query.get(vid)
    if not v:
        raise BadRequest("Not found", 404)

    payload = request.get_json() or {}

    status = payload.get("status")
    tenant_id = payload.get("tenant_id")

    if not tenant_id or status not in ("success", "failed"):
        raise BadRequest("Invalid status", 400)
    
    viz:Visualization = (
        Visualization.query.filter(
            Visualization.id==vid, 
            Visualization.tenant_id==tenant_id,
            Visualization.deleted==False, 
        ).first()
    )
    if not viz:
        raise BadRequest("Visualization not found", 404)
    
    user_id = currentUserId()

    log = VisualizationExecutionLog(
        tenant_id=tenant_id,
        visualization_id=v.id,
        executed_by=user_id,
        status=status,
        message=payload.get("message"),
        details=payload.get("details") or {},
    )
    if v.type == "report":
        v.executed_at = datetime.now(timezone.utc)
    log.created_by_id = user_id

    db.session.add(log)
    commit_session()
    return jsonify(log.to_dict()), 201


@bp.get("/<int:vid>/execution-logs")
@require_auth
def list_execution_logs(vid:int):
    tenant_id = request.args.get("tenant_id", type=int)
    if not tenant_id:
        raise BadRequest("tenant_id is required", 400)

    logs:List[VisualizationExecutionLog] = (
        VisualizationExecutionLog.query
        .filter(
            VisualizationExecutionLog.tenant_id==tenant_id,
            VisualizationExecutionLog.visualization_id==vid,
        )
        .order_by(VisualizationExecutionLog.executed_at.desc())
        .all()
    )

    return jsonify([l.to_dict() for l in logs]), 200


