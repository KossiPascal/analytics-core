from flask import Blueprint, jsonify, request
from backend.src.app.configs.extensions import db
from backend.src.app.models._controls import WorkerControl
from werkzeug.exceptions import BadRequest
from sqlalchemy.exc import SQLAlchemyError, IntegrityError

bp = Blueprint("workers", __name__, url_prefix="/api/workers")

@bp.get("/<worker_name>")
def get_status(tenant_id:int, worker_name: str):

    tenant_id = request.args.get("tenant_id", type=int)
    action = request.args.get("action", type=str) # status | stop | start | sync
    control = db.session.query(WorkerControl).filter_by(name=worker_name).first()
    
    if action == "sync":
        source_id = request.args.get("source_id", type=int)
        return jsonify({
            "tenant_id": tenant_id, 
            "source_id": source_id, 
            "worker": worker_name, 
            "status": "sync triggered"
        })
    
    if action == "stop":
        if not control:
            raise BadRequest("Worker not found", 404)
        return jsonify({"worker": worker_name, "status": control.status})
    
    elif action == "status":
        if not control:
            control = WorkerControl(name=worker_name, status="stop")
            db.session.add(control)
        else:
            control.status = "stop"
        db.session.commit()
        return jsonify({"worker": worker_name, "status": "stop"})

    elif action == "stop":
        if not control:
            control = WorkerControl(name=worker_name, status="run")
            db.session.add(control)
        else:
            control.status = "run"
        db.session.commit()
        return jsonify({"worker": worker_name, "status": "run"})




