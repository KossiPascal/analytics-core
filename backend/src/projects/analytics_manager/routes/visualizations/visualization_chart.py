from typing import List
from flask import Blueprint, request, jsonify
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from werkzeug.exceptions import BadRequest, NotFound
from backend.src.app.configs.extensions import db
from backend.src.projects.analytics_manager.models.visualization import Visualization, VisualizationChart, DataLineage, AIQueryLog
from backend.src.app.middlewares.access_security import require_auth, currentUserId
from backend.src.projects.analytics_manager.logger import get_backend_logger
from sqlalchemy.orm import selectinload

logger = get_backend_logger(__name__)
bp = Blueprint("visualization_charts", __name__, url_prefix="/api/visualization-charts")


# from reportlab.platypus import SimpleDocTemplate, Paragraph

# def export_pdf(data):
#     doc = SimpleDocTemplate("report.pdf")
#     content = [Paragraph(str(data))]
#     doc.build(content)

# import pandas as pd

# df = pd.DataFrame(data)
# df.to_excel("report.xlsx")



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


@bp.get("")
@require_auth
def list_visualization_charts():
    tenant_id = request.args.get("tenant_id", type=int)
    if not tenant_id:
        raise BadRequest("tenant_id is required", 400)

    charts:List[VisualizationChart] = VisualizationChart.query.options(
        selectinload(VisualizationChart.tenant),
        selectinload(VisualizationChart.dataset),
        selectinload(VisualizationChart.chart),
        # selectinload(VisualizationChart.visualization),
    ).filter(
        VisualizationChart.tenant_id==tenant_id,
        VisualizationChart.deleted == False,
    ).all()

    return jsonify([v.to_dict() for v in charts])


@bp.post("")
@require_auth
def create_visualization_chart():
    payload = request.get_json() or {}

    tenant_id = payload.get("tenant_id")
    vid = payload.get("visualization_id")
    if not tenant_id or not vid:
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

    chart = VisualizationChart(
        visualization_id=vid,
        tenant_id=tenant_id,
        chart_id=payload.get("chart_id"),
        position=payload.get("position") or {}
    )
    chart.created_by_id = user_id

    db.session.add(chart)

    commit_session()

    return jsonify(chart.to_dict()), 201

@bp.get("/<int:chart_id>")
@require_auth
def get_visualization_chart(chart_id:int):
    tenant_id = request.args.get("tenant_id", type=int)
    vid = request.args.get("visualization_id", type=int)
    if not tenant_id or not vid or not chart_id:
        raise BadRequest("bad Inputs", 400)
    
    chart:VisualizationChart = (
        VisualizationChart.query.filter(
            VisualizationChart.chart_id==chart_id, 
            VisualizationChart.tenant_id==tenant_id,
            VisualizationChart.visualization_id==vid,
            VisualizationChart.deleted==False, 
        ).first()
    )

    if not chart:
        raise NotFound("VisualizationChart not found")
    
    return jsonify(chart.to_dict())

@bp.put("/<int:chart_id>")
@require_auth
def update_visualization_chart(chart_id:int):
    tenant_id = request.args.get("tenant_id", type=int)
    vid = request.args.get("visualization_id", type=int)
    if not tenant_id or not vid or not chart_id:
        raise BadRequest("bad Inputs", 400)

    chart:VisualizationChart = (
        VisualizationChart.query.filter(
            VisualizationChart.visualization_id==vid, 
            VisualizationChart.chart_id==chart_id, 
            VisualizationChart.tenant_id==tenant_id,
            VisualizationChart.deleted==False, 
        ).first()
    )
    if not chart:
        raise NotFound("VisualizationChart not found")

    payload = request.get_json() or {}
    if "position" in payload:
        chart.position = payload.get("position")
        chart.updated_by_id = currentUserId()

    commit_session()

    return jsonify(chart.to_dict())


@bp.delete("/<int:chart_id>")
@require_auth
def delete_visualization_chart(chart_id:int):
    tenant_id = request.args.get("tenant_id", type=int)
    vid = request.args.get("visualization_id", type=int)
    if not tenant_id or not vid or not chart_id:
        raise BadRequest("bad Inputs", 400)

    chart:VisualizationChart = (
        VisualizationChart.query.filter(
            VisualizationChart.visualization_id==vid, 
            VisualizationChart.chart_id==chart_id, 
            VisualizationChart.tenant_id==tenant_id,
        ).first()
    )
    if not chart:
        raise NotFound("VisualizationChart not found")
    
    db.session.delete(chart)

    commit_session()

    return jsonify({"message": "Deleted successfully"})



#########################################################

# DataLineage CRUD
@bp.post("/data-lineages")
@require_auth
def create_data_lineage():
    payload = request.get_json() or {}

    tenant_id = payload.get("tenant_id")
    # vid = request.args.get("visualization_id", type=int)
    if not tenant_id:
        raise BadRequest("bad Inputs", 400)
    
    lineage:DataLineage = DataLineage(
        tenant_id=tenant_id,
        source_id=payload.get("source_id"),
        target_id=payload.get("target_id"),
        operation=payload.get("operation"),
    )
    lineage.created_by_id = currentUserId()

    db.session.add(lineage)

    commit_session()

    return jsonify(lineage.to_dict()), 201


#########################################################


# AIQueryLog CRUD
@bp.post("/ai-query-logs")
@require_auth
def create_ai_query_log():
    payload = request.get_json() or {}

    tenant_id = payload.get("tenant_id")
    # vid = request.args.get("visualization_id", type=int)
    if not tenant_id:
        raise BadRequest("bad Inputs", 400)
    
    log = AIQueryLog(
        tenant_id=tenant_id,
        prompt=payload.get("prompt"),
        generated_query_json=payload.get("generated_query_json") or {},
        validated=payload.get("validated", False),
        rejected_reason=payload.get("rejected_reason")
    )
    log.created_by_id = currentUserId()

    db.session.add(log)
    commit_session()
    return jsonify({"id": log.id, "prompt": log.prompt, "validated": log.validated}), 201


@bp.get("/ai-query-logs")
@require_auth
def list_ai_query_logs():

    tenant_id = request.args.get("tenant_id", type=int)
    if not tenant_id:
        raise BadRequest("bad Inputs", 400)

    logs:List[AIQueryLog] = AIQueryLog.query.filter_by(tenant_id=tenant_id).all()

    return jsonify([l.to_dict() for l in logs])


#########################################################


