from typing import List
from datetime import datetime, timezone
from sqlalchemy.exc import SQLAlchemyError
from flask import Blueprint, request, jsonify, g
from backend.src.databases.extensions import db, error_response
from backend.src.models.datasets.dataset import DatasetField
from backend.src.security.access_security import require_auth

from backend.src.logger import get_backend_logger
logger = get_backend_logger(__name__)

bp = Blueprint("dataset_fields", __name__, url_prefix="/api/dataset-fields")

# ===================== FIELDS =====================
@bp.get("/<int:tenant_id>")
@require_auth
def list_fields(tenant_id: int):
    try:
        fields: List[DatasetField] = DatasetField.query.filter(
            DatasetField.tenant_id==tenant_id,
            DatasetField.deleted==False
        ).all()
        return jsonify([r.to_dict() for r in fields]), 200
    except Exception as e:
        logger.error(f"List fields error: {str(e)}")
        return error_response("Failed to list fields", 500, str(e))

@bp.get("/<int:tenant_id>/<int:field_id>")
@require_auth
def get_field(tenant_id: int,field_id: int):
    try:
        field:DatasetField = DatasetField.query.filter(
            DatasetField.tenant_id==tenant_id,
            DatasetField.id==field_id,
            DatasetField.deleted==False
        ).first()
        if not field or field.deleted:
            return error_response(f"DatasetField with id={field_id} not found", 404)
        data = field.to_dict()
        return jsonify(data), 200
    except Exception as e:
        logger.error(f"Get field error: {str(e)}")
        return error_response("Failed to get field", 500, str(e))

@bp.post("")
@require_auth
def create_field():
    try:
        data = request.get_json(silent=True) or {}

        name = data.get("name")
        tenant_id = data.get("tenant_id")
        dataset_id = data.get("dataset_id")
        description = data.get("description")
        expression = data.get("expression")
        aggregation = data.get("aggregation")
        field_type = data.get("field_type")
        data_type = data.get("data_type")
        format = data.get("data_type") or {}
        is_public = bool(data.get("is_public", False))
        is_filterable = bool(data.get("is_filterable", False))
        is_groupable = bool(data.get("is_groupable", False))
        is_sortable = bool(data.get("is_sortable", False))
        is_active = bool(data.get("is_active", False))

        if not name:
            return jsonify({"error": "DatasetField name is required"}), 400

        field = DatasetField(
            name=name,
            tenant_id=tenant_id,
            dataset_id=dataset_id,
            description=description,
            expression=expression,
            aggregation=aggregation,
            field_type=field_type,
            data_type=data_type,
            format=format,
            is_public=is_public,
            is_filterable=is_filterable,
            is_groupable=is_groupable,
            is_sortable=is_sortable,
            is_active=is_active,
        )

        field.created_by_id=g.current_user.get("id") if g.get("current_user") else None

        db.session.add(field)
        db.session.commit()
        return jsonify({"message": "DatasetField created", "field_id": field.id}), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Create field error: {str(e)}")
        return error_response("Failed to create field", 500, str(e))

@bp.put("/<int:field_id>")
@require_auth
def update_field(field_id: int):
    try:
        field:DatasetField = DatasetField.query.get(field_id)
        if not field or field.deleted:
            return error_response(f"DatasetField with id={field_id} not found", 404)

        data = request.get_json(silent=True) or {}

        if "name" in data:
            field.name = data["name"]
        if "tenant_id" in data:
            field.tenant_id = data["tenant_id"]
        if "dataset_id" in data:
            field.dataset_id = data["dataset_id"]
        if "description" in data:
            field.description = data["description"]
        if "expression" in data:
            field.expression = data["expression"]
        if "aggregation" in data:
            field.aggregation = data["aggregation"]
        if "field_type" in data:
            field.field_type = data["field_type"]
        if "data_type" in data:
            field.data_type = data["data_type"]
        if "format" in data:
            field.format = data["format"]
        if "is_public" in data:
            field.is_public = bool(data.get("is_public", True))
        if "is_filterable" in data:
            field.is_filterable = bool(data.get("is_filterable", True))
        if "is_groupable" in data:
            field.is_groupable = bool(data.get("is_groupable", True))
        if "is_sortable" in data:
            field.is_sortable = bool(data.get("is_sortable", True))
        if "is_active" in data:
            field.is_active = bool(data.get("is_active", True))

        field.updated_by_id=g.current_user.get("id") if g.get("current_user") else None

        db.session.commit()
        return jsonify({"message": "DatasetField updated"}), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        return error_response("Failed to update field", 500, str(e))

@bp.delete("/<int:field_id>")
@require_auth
def delete_field(field_id: int):
    try:
        field:DatasetField = DatasetField.query.get(field_id)
        if not field or field.deleted:
            return error_response(f"DatasetField with id={field_id} not found", 404)

        field.deleted = True
        field.deleted_at = datetime.now(timezone.utc)
        field.deleted_by_id=g.current_user.get("id") if g.get("current_user") else None
    
        db.session.commit()
        return jsonify({"message": "DatasetField deleted"}), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        return error_response("Failed to delete field", 500, str(e))

