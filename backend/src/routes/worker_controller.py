from flask import Blueprint, jsonify, request
from backend.src.databases.extensions import db
from backend.src.models.controls import WorkerControl
# from workers.couchdb.sync_manager import start_async_single_source

from werkzeug.exceptions import BadRequest
from sqlalchemy.exc import SQLAlchemyError, IntegrityError

bp = Blueprint("workers", __name__, url_prefix="/api/workers")

@bp.get("/status/<int:tenant_id>/<worker_name>")
def get_status(tenant_id:int, worker_name: str):
    control = db.session.query(WorkerControl).filter_by(name=worker_name).first()
    if not control:
        raise BadRequest("Worker not found", 404)
    return jsonify({"worker": worker_name, "status": control.status})

@bp.post("/stop/<int:tenant_id>/<worker_name>")
def stop_worker(tenant_id:int, worker_name: str):
    control = db.session.query(WorkerControl).filter_by(name=worker_name).first()
    if not control:
        control = WorkerControl(name=worker_name, status="stop")
        db.session.add(control)
    else:
        control.status = "stop"
    db.session.commit()
    return jsonify({"worker": worker_name, "status": "stop"})

@bp.post("/start/<int:tenant_id>/<worker_name>")
def start_worker(tenant_id:int, worker_name: str):
    control = db.session.query(WorkerControl).filter_by(name=worker_name).first()
    if not control:
        control = WorkerControl(name=worker_name, status="run")
        db.session.add(control)
    else:
        control.status = "run"
    db.session.commit()
    return jsonify({"worker": worker_name, "status": "run"})

@bp.post("/sync/<int:tenant_id>/<worker_name>/<int:source_id>")
def trigger_sync(tenant_id:int,worker_name: str,source_id: int):
    # Permet de déclencher un sync ponctuel, même si le worker est arrêté
    try:
        # start_async_single_source(tenant_id, source_id)
        return jsonify({
            "tenant_id": tenant_id, 
            "source_id": source_id, 
            "worker": worker_name, 
            "status": "sync triggered"
        })
    except Exception as e:
        raise
