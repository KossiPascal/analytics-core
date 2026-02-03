import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify, g
from database.extensions import db
from models.visualization import Visualization,VisualizationExecutionLog,VisualizationShare
from security.access_security import require_auth
from helpers.logger import get_logger

logger = get_logger(__name__)

bp = Blueprint("visualizations", __name__, url_prefix="/api/visualizations")


def serialize(v: Visualization):
    return {
        "id": str(v.id),
        "type": v.type,
        "name": v.name,
        "status": v.status,
        "created_by": str(v.created_by) if v.created_by else None,
        "created_at": v.created_at.isoformat() if v.created_at else None,
    }

def full_serialize(v: Visualization):
    base = {
        "id": str(v.id),
        "type": v.type,
        "name": v.name,
        "description": v.description,
        "config": v.config,
        "filters": v.filters,
        "layout": v.layout,
        "status": v.status,
        "created_by": str(v.created_by) if v.created_by else None,
        "created_at": v.created_at.isoformat(),
        "updated_at": v.updated_at.isoformat(),
    }

    if v.type == "report":
        base.update({
            "executed_at": v.executed_at.isoformat() if v.executed_at else None,
            "generated_data": v.generated_data,
        })

    return base


# ✅ CREATE Visualization
@bp.post("/")
@require_auth
def create_visualization():
    data = request.get_json() or {}
    vtype = data.get("type")

    if vtype not in ("dashboard", "report"):
        return jsonify({"error": "Invalid visualization type"}), 400

    try:
        vis = Visualization(
            id=uuid.uuid4(),
            tenant_id=g.current_user["tenant_id"],
            name=data.get("name"),
            type=vtype,
            description=data.get("description"),
            config=data.get("config", {}),
            filters=data.get("filters", {}),
            layout=data.get("layout", {}),
            status=data.get("status", "draft"),
            created_by=g.current_user["id"],
        )

        db.session.add(vis)
        db.session.commit()

        return jsonify({"message": "Visualization created", "id": str(vis.id)}), 201

    except Exception as e:
        db.session.rollback()
        logger.exception("Create visualization failed")
        return jsonify({"error": str(e)}), 500

# 📄 GET ONE
@bp.get("/<uuid:vid>")
@require_auth
def get_visualization(vid):
    v = Visualization.query.get(vid)
    if not v:
        return jsonify({"error": "Visualization not found"}), 404
    return jsonify(full_serialize(v)), 200

# 📚 LIST Visualization
@bp.get("/")
@require_auth
def list_visualizations():
    args = request.args
    vtype = args.get("type")
    status = args.get("status")
    search = args.get("search")

    page = int(args.get("page", 1))
    per_page = int(args.get("per_page", 20))

    q = Visualization.query.filter_by(tenant_id=g.current_user["tenant_id"])

    if vtype:
        q = q.filter_by(type=vtype)
    if status:
        q = q.filter_by(status=status)
    if search:
        q = q.filter(Visualization.name.ilike(f"%{search}%"))

    paginated = q.order_by(Visualization.created_at.desc()) \
                 .paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        "items": [serialize(v) for v in paginated.items],
        "total": paginated.total,
        "page": paginated.page,
        "pages": paginated.pages
    }), 200

# ✏️ UPDATE
@bp.put("/<uuid:vid>")
@require_auth
def update_visualization(vid):
    v = Visualization.query.get(vid)
    if not v:
        return jsonify({"error": "Visualization not found"}), 404

    data = request.get_json() or {}
    for field in ["name", "description", "config","filters", "layout", "status", "generated_data"]:
        if field in data and hasattr(v, field):
            setattr(v, field, data[field])

    db.session.commit()
    return jsonify({"message": "Visualization updated"}), 200

# 🗑 DELETE + BULK DELETE
@bp.delete("/<uuid:vid>")
@require_auth
def delete_visualization(vid):
    v = Visualization.query.get(vid)
    if not v:
        return jsonify({"error": "Not found"}), 404

    db.session.delete(v)
    db.session.commit()
    return jsonify({"message": "Deleted"}), 200

@bp.post("/bulk-delete")
@require_auth
def bulk_delete():
    ids = request.json.get("ids", [])
    if not ids:
        return jsonify({"error": "Invalid input"}), 400

    objs = Visualization.query.filter(Visualization.id.in_(ids)).all()
    for o in objs:
        db.session.delete(o)

    db.session.commit()
    return jsonify({"message": f"{len(objs)} deleted"}), 200

# 🧾 EXECUTION LOGS Visualization
@bp.post("/<uuid:vid>/execution-log")
@require_auth
def create_execution_log(vid):
    v = Visualization.query.get(vid)
    if not v:
        return jsonify({"error": "Not found"}), 404

    data = request.get_json() or {}
    status = data.get("status")

    if status not in ("success", "failed"):
        return jsonify({"error": "Invalid status"}), 400

    log = VisualizationExecutionLog(
        id=uuid.uuid4(),
        visualization_id=v.id,
        executed_by=g.current_user["id"],
        status=status,
        message=data.get("message"),
    )

    if v.type == "report":
        v.executed_at = datetime.utcnow()

    db.session.add(log)
    db.session.commit()
    return jsonify({"message": "Execution logged"}), 201

# 📜 LIST EXECUTION LOGS
@bp.get("/<uuid:vid>/execution-log")
@require_auth
def list_execution_logs(vid):
    logs = VisualizationExecutionLog.query \
        .filter_by(visualization_id=vid) \
        .order_by(VisualizationExecutionLog.executed_at.desc()) \
        .all()

    return jsonify({
        "logs": [{
            "id": str(l.id),
            "status": l.status,
            "message": l.message,
            "executed_by": str(l.executed_by),
            "executed_at": l.executed_at.isoformat()
        } for l in logs]
    }), 200

# 🌍 SHARE Visualization
@bp.post("/<uuid:vid>/share")
@require_auth
def share_visualization():
    vid = request.json.get("visualization_id")
    token = str(uuid.uuid4())
    share = VisualizationShare(visualization_id=vid,public_token=token)

    db.session.add(share)
    db.session.commit()

    return jsonify({ "share_url": f"/public/visualization/{token}" }), 201

# @bp.route("/<uuid:vid>/publish", methods=["POST"])
# @require_auth
# def publish_visualization(vid):
#     viz = Visualization.query.get_or_404(vid)
#     viz.publish()
#     db.session.commit()
#     return jsonify({"id": str(viz.id), "status": viz.status})
