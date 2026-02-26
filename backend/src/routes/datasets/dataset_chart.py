from typing import List
from datetime import datetime, timezone
from sqlalchemy.exc import SQLAlchemyError
from flask import Blueprint, request, jsonify, g
from backend.src.databases.extensions import db, error_response
from backend.src.models.datasets.dataset import ChartType, DatasetChart
from backend.src.security.access_security import require_auth

from backend.src.logger import get_backend_logger
logger = get_backend_logger(__name__)

bp = Blueprint("dataset_charts", __name__, url_prefix="/api/dataset-charts")

# ===================== CHARTS =====================
@bp.get("/<int:tenant_id>")
@require_auth
def list_charts(tenant_id: int):
    try:
        charts: List[DatasetChart] = DatasetChart.query.filter(
            DatasetChart.tenant_id==tenant_id,
            DatasetChart.deleted==False
        ).all()
        return jsonify([r.to_dict() for r in charts]), 200
    except Exception as e:
        logger.error(f"List charts error: {str(e)}")
        return error_response("Failed to list charts", 500, str(e))

@bp.get("/<int:tenant_id>/<int:chart_id>")
@require_auth
def get_chart(tenant_id: int,chart_id: int):
    try:
        query:DatasetChart = DatasetChart.query.filter(
            DatasetChart.id==chart_id,
            DatasetChart.tenant_id==tenant_id,
            DatasetChart.deleted==False
        ).first()
        if not query or query.deleted:
            return error_response(f"DatasetChart with id={chart_id} not found", 404)
        data = query.to_dict()
        return jsonify(data), 200
    except Exception as e:
        logger.error(f"Get query error: {str(e)}")
        return error_response("Failed to get query", 500, str(e))

@bp.post("")
@require_auth
def create_chart():
    try:
        data = request.get_json(silent=True) or {}
        name = data.get("name")
        tenant_id = data.get("tenant_id")
        dataset_id = data.get("dataset_id")
        description = data.get("description")
        query_id = data.get("query_id")
        options = data.get("options")
        is_active = bool(data.get("is_active", False))

        if not name:
            return jsonify({"error": "DatasetChart name is required"}), 400

        query = DatasetChart(
            name=name,
            tenant_id=tenant_id,
            dataset_id=dataset_id,
            query_id=query_id,
            description=description,
            type=ChartType(data.get("type")),
            options=options,
            is_active=is_active,
        )

        query.created_by=g.current_user.get("id") if g.get("current_user") else None

        db.session.add(query)
        db.session.commit()
        return jsonify({"message": "DatasetChart created", "chart_id": query.id}), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Create query error: {str(e)}")
        return error_response("Failed to create query", 500, str(e))

@bp.put("/<int:chart_id>")
@require_auth
def update_chart(chart_id: int):
    try:
        query:DatasetChart = DatasetChart.query.get(chart_id)
        if not query or query.deleted:
            return error_response(f"DatasetChart with id={chart_id} not found", 404)

        data = request.get_json(silent=True) or {}
        if "name" in data:
            query.name = data["name"]
        if "tenant_id" in data:
            query.tenant_id = data["tenant_id"]
        if "dataset_id" in data:
            query.dataset_id = data["dataset_id"]
        if "query_id" in data:
            query.query_id = data["query_id"]
        if "description" in data:
            query.description = data["description"]
        if "type" in data:
            query.type = ChartType(data.get("type"))
        if "options" in data:
            query.options = data["options"]
        if "is_active" in data:
            query.is_active = bool(data.get("is_active", True))

        query.updated_by=g.current_user.get("id") if g.get("current_user") else None

        db.session.commit()
        return jsonify({"message": "DatasetChart updated"}), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        return error_response("Failed to update query", 500, str(e))

@bp.delete("/<int:chart_id>")
@require_auth
def delete_chart(chart_id: int):
    try:
        query:DatasetChart = DatasetChart.query.get(chart_id)
        if not query or query.deleted:
            return error_response(f"DatasetChart with id={chart_id} not found", 404)

        query.deleted = True
        query.deleted_at = datetime.now(timezone.utc)
        query.deleted_by=g.current_user.get("id") if g.get("current_user") else None
    
        db.session.commit()
        return jsonify({"message": "DatasetChart deleted"}), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        return error_response("Failed to delete query", 500, str(e))

