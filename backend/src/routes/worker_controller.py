from flask import Blueprint, jsonify, request
from backend.src.database.extensions import db
from backend.src.models.worker_control import WorkerControl
from workers.couchdb.sync_manager import start_async_single_source

bp = Blueprint("workers", __name__, url_prefix="/api/workers")

@bp.get("/status/<worker_name>")
def get_status(worker_name: str):
    control = db.session.query(WorkerControl).filter_by(name=worker_name).first()
    if not control:
        return jsonify({"error": "Worker not found"}), 404
    return jsonify({"worker": worker_name, "status": control.status})

@bp.post("/stop/<worker_name>")
def stop_worker(worker_name: str):
    control = db.session.query(WorkerControl).filter_by(name=worker_name).first()
    if not control:
        control = WorkerControl(name=worker_name, status="stop")
        db.session.add(control)
    else:
        control.status = "stop"
    db.session.commit()
    return jsonify({"worker": worker_name, "status": "stop"})

@bp.post("/start/<worker_name>")
def start_worker(worker_name: str):
    control = db.session.query(WorkerControl).filter_by(name=worker_name).first()
    if not control:
        control = WorkerControl(name=worker_name, status="run")
        db.session.add(control)
    else:
        control.status = "run"
    db.session.commit()
    return jsonify({"worker": worker_name, "status": "run"})

@bp.post("/sync/<worker_name>/<int:source_id>")
def trigger_sync(worker_name: str, source_id: int):
    # Permet de déclencher un sync ponctuel, même si le worker est arrêté
    try:
        start_async_single_source(source_id)
        return jsonify({"worker": worker_name, "source_id": source_id, "status": "sync triggered"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
