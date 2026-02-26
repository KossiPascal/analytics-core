from typing import List
from datetime import datetime, timezone
from sqlalchemy.exc import SQLAlchemyError
from flask import Blueprint, request, jsonify, g
from backend.src.databases.extensions import db, error_response
from backend.src.models.datasets.dataset import DatasetQuery
from backend.src.security.access_security import require_auth

from backend.src.logger import get_backend_logger
logger = get_backend_logger(__name__)

bp = Blueprint("dataset_queries", __name__, url_prefix="/api/dataset-queries")

# ===================== QUERIES =====================
@bp.get("/<int:tenant_id>")
@require_auth
def list_queries(tenant_id: int):
    try:
        queries: List[DatasetQuery] = DatasetQuery.query.filter(
            DatasetQuery.tenant_id==tenant_id,
            DatasetQuery.deleted==False
        ).all()
        return jsonify([r.to_dict() for r in queries]), 200
    except Exception as e:
        logger.error(f"List queries error: {str(e)}")
        return error_response("Failed to list queries", 500, str(e))

@bp.get("/<int:tenant_id>/<int:query_id>")
@require_auth
def get_query(tenant_id: int,query_id: int):
    try:
        query:DatasetQuery = DatasetQuery.query.filter(
            DatasetQuery.id==query_id,
            DatasetQuery.tenant_id==tenant_id,
            DatasetQuery.deleted==False
        ).first()
        if not query or query.deleted:
            return error_response(f"DatasetQuery with id={query_id} not found", 404)
        data = query.to_dict()
        return jsonify(data), 200
    except Exception as e:
        logger.error(f"Get query error: {str(e)}")
        return error_response("Failed to get query", 500, str(e))

@bp.post("")
@require_auth
def create_query():
    try:
        data = request.get_json(silent=True) or {}
        name = data.get("name")
        tenant_id = data.get("tenant_id")
        dataset_id = data.get("dataset_id")
        description = data.get("description")
        query_json = data.get("query_json")
        compiled_sql = data.get("compiled_sql")
        values = data.get("values")
        is_validated = bool(data.get("is_validated", False))
        is_active = bool(data.get("is_active", False))
        cache = data.get("cache")


        if not name:
            return jsonify({"error": "DatasetQuery name is required"}), 400

        query = DatasetQuery(
            name=name,
            cache=cache,
            tenant_id=tenant_id,
            dataset_id=dataset_id,
            description=description,
            query_json=query_json,
            compiled_sql=compiled_sql,
            values=values,
            is_active=is_active,
        )
        if is_validated:
            query.is_validated=is_validated,
            query.validated_at = datetime.now(timezone.utc)

        query.created_by_id=g.current_user.get("id") if g.get("current_user") else None

        db.session.add(query)
        db.session.commit()
        return jsonify({"message": "DatasetQuery created", "query_id": query.id}), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Create query error: {str(e)}")
        return error_response("Failed to create query", 500, str(e))

@bp.put("/<int:query_id>")
@require_auth
def update_query(query_id: int):
    try:
        query:DatasetQuery = DatasetQuery.query.get(query_id)
        if not query or query.deleted:
            return error_response(f"DatasetQuery with id={query_id} not found", 404)

        data = request.get_json(silent=True) or {}
        if "name" in data:
            query.name = data["name"]
        if "tenant_id" in data:
            query.tenant_id = data["tenant_id"]
        if "dataset_id" in data:
            query.dataset_id = data["dataset_id"]
        if "description" in data:
            query.description = data["description"]
        if "query_json" in data:
            query.query_json = data["query_json"]
        if "compiled_sql" in data:
            query.compiled_sql = data["compiled_sql"]
        if "values" in data:
            query.values = data["values"]
        if "cache" in data:
            query.cache = data["cache"]
        if "is_active" in data:
            query.is_active = bool(data.get("is_active", True))
        if "is_validated" in data:
            is_validated = bool(data.get("is_validated", True))
            if is_validated:
                query.is_validated = is_validated,
                query.validated_at = datetime.now(timezone.utc)

        query.updated_by_id=g.current_user.get("id") if g.get("current_user") else None

        db.session.commit()
        return jsonify({"message": "DatasetQuery updated"}), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        return error_response("Failed to update query", 500, str(e))

@bp.delete("/<int:query_id>")
@require_auth
def delete_query(query_id: int):
    try:
        query:DatasetQuery = DatasetQuery.query.get(query_id)
        if not query or query.deleted:
            return error_response(f"DatasetQuery with id={query_id} not found", 404)

        query.deleted = True
        query.deleted_at = datetime.now(timezone.utc)
        query.deleted_by_id=g.current_user.get("id") if g.get("current_user") else None
    
        db.session.commit()
        return jsonify({"message": "DatasetQuery deleted"}), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        return error_response("Failed to delete query", 500, str(e))

@bp.post("/<uuid:q_id>/validate")
@require_auth
def validate_query(q_id):
    try:
        query = DatasetQuery.query.get_or_404(q_id)
        query.validate()
        db.session.commit()
        return jsonify({"message": "Query validated"})
    except Exception as e:
        return jsonify({"error": str(e)}), 400