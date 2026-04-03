from typing import List
from flask import Blueprint, request, jsonify, g
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from werkzeug.exceptions import BadRequest, NotFound
from backend.src.app.configs.extensions import db
from backend.src.modules.analytics.models.d_visualization import DataTarget
from backend.src.app.middlewares.access_security import require_auth, currentUserId
from backend.src.modules.analytics.logger import get_backend_logger

logger = get_backend_logger(__name__)

bp = Blueprint("data_targets", __name__, url_prefix="/api/data-targets")



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



# DataTarget CRUD
@bp.post("")
@require_auth
def create_data_target():
    data = request.get_json() or {}

    tenant_id = data.get("tenant_id")
    if not tenant_id:
        raise BadRequest("bad Inputs", 400)

    required_fields = ["type", "name"]
    if not all(f in data for f in required_fields):
        raise BadRequest(f"Fields {required_fields} are required")
    
    target:DataTarget = DataTarget(
        tenant_id=tenant_id,
        type=data.get("type"),
        name=data.get("name"),
        dataset_id=data.get("dataset_id"),
        query_id=data.get("query_id"),
        visualization_id=data.get("visualization_id")
    )
    target.created_by_id = currentUserId()

    db.session.add(target)

    commit_session()

    return jsonify(target.to_dict()), 201


@bp.get("/<string:target_id>")
@require_auth
def get_data_target(target_id:int):
    tenant_id = request.args.get("tenant_id", type=str)
    # vid = request.args.get("visualization_id", type=str)
    if not tenant_id:
        raise BadRequest("bad Inputs", 400)

    target:DataTarget = (
        DataTarget.query.filter(
            DataTarget.id==target_id, 
            DataTarget.tenant_id==tenant_id,
            # DataTarget.visualization_id==vid, 
        ).first()
    )
    return jsonify(target.to_dict())

@bp.get("")
@require_auth
def list_data_targets():
    tenant_id = request.args.get("tenant_id", type=str)
    # vid = request.args.get("visualization_id", type=str)
    if not tenant_id:
        raise BadRequest("bad Inputs", 400)

    targets:List[DataTarget] = (
        DataTarget.query.filter(
            DataTarget.tenant_id==tenant_id,
            # DataTarget.visualization_id==vid, 
        ).all()
    )
    return jsonify([t.to_dict() for t in targets or []])


@bp.put("/<string:target_id>")
@require_auth
def update_data_target(target_id: str):
    payload = request.get_json() or {}

    tenant_id = payload.get("tenant_id")
    if not tenant_id:
        raise BadRequest("bad Inputs", 400)

    target:DataTarget = (
        DataTarget.query.filter(
            DataTarget.id==target_id, 
            DataTarget.tenant_id==tenant_id,
            # DataTarget.visualization_id==vid, 
        ).first()
    )
    if not target:
        raise NotFound("DataTarget not found")
    
    for field in ["type", "name", "dataset_id", "query_id", "visualization_id"]:
        if field in payload:
            setattr(target, field, payload[field])

    target.updated_by_id = currentUserId()
    
    commit_session()
    
    return jsonify(target.to_dict()), 200


@bp.delete("/<string:target_id>")
@require_auth
def delete_data_target(target_id: str):

    target:DataTarget = DataTarget.query.get(target_id)
    
    db.session.delete(target)

    commit_session()
    return jsonify({"message": "Deleted successfully"})
    

