from typing import Optional, List
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, g
from backend.src.databases.extensions import db
from backend.src.models.datasets.dataset import DatasetField
from backend.src.security.access_security import require_auth, currentUserId
from sqlalchemy.orm import selectinload

from werkzeug.exceptions import BadRequest
from sqlalchemy.exc import SQLAlchemyError, IntegrityError

from backend.src.logger import get_backend_logger
logger = get_backend_logger(__name__)

bp = Blueprint("dataset_fields", __name__, url_prefix="/api/dataset-fields")


def list_fields(field_id: Optional[int] = None, tenant_id: Optional[int] = None,dataset_id: Optional[int] = None, all:bool = True):
    query = DatasetField.query.options(
        selectinload(DatasetField.dataset),
        # selectinload(DatasetField.tenant),
    ).filter(DatasetField.deleted == False)

    if field_id is not None:
        query = query.filter(DatasetField.id == field_id)
    if tenant_id is not None:
        query = query.filter(DatasetField.tenant_id == tenant_id)
    if dataset_id is not None:
        query = query.filter(DatasetField.dataset_id == dataset_id)
    if all == True:
        charts: List[DatasetField] = query.all()
        return [chart.to_dict() for chart in charts]
    else:
        chart:DatasetField = query.first()
        return chart.to_dict()

# ===================== FIELDS =====================
@bp.get("/<int:tenant_id>")
@require_auth
def list_fields_by(tenant_id: int):
    fields = list_fields(tenant_id=tenant_id)
    return jsonify(fields), 200

@bp.get("/<int:tenant_id>/<int:dataset_id>")
@require_auth
def list_fields_by_dataset(tenant_id: int, dataset_id: int):
    fields = list_fields(tenant_id=tenant_id,dataset_id=dataset_id)
    return jsonify(fields), 200

@bp.get("/<int:tenant_id>/<int:field_id>")
@require_auth
def get_field(tenant_id: int,field_id: int):
    field = list_fields(tenant_id=tenant_id,field_id=field_id,all=False)
    if not field or field["deleted"]:
        raise BadRequest(f"DatasetField with id={field_id} not found", 404)
    return jsonify(field), 200

@bp.post("")
@require_auth
def create_field():
    try:
        payload = request.get_json(silent=True) or {}
        name = payload.get("name")
        if not name:
            return BadRequest("DatasetField name is required")

        field = DatasetField(
            name=name,
            tenant_id=payload.get("tenant_id"),
            dataset_id=payload.get("dataset_id"),
            description=payload.get("description"),
            expression=payload.get("expression"),
            aggregation=payload.get("aggregation"),
            field_type=payload.get("field_type"),
            data_type=payload.get("data_type"),
            format=payload.get("format") or {},
            is_public=bool(payload.get("is_public", False)),
            is_filterable=bool(payload.get("is_filterable", False)),
            is_groupable=bool(payload.get("is_groupable", False)),
            is_sortable=bool(payload.get("is_sortable", False)),
            is_selectable=bool(payload.get("is_selectable", False)),
            is_hidden=bool(payload.get("is_hidden", False)),
            is_active=bool(payload.get("is_active", False)),
            created_by_id=currentUserId()
        )

        db.session.add(field)
        db.session.commit()
        return jsonify({"message": "DatasetField created", "field_id": field.id}), 201
    
    except Exception:
        db.session.rollback()
        raise

@bp.put("/<int:field_id>")
@require_auth
def update_field(field_id: int):
    try:
        field:DatasetField = DatasetField.query.get(field_id)
        if not field or field.deleted:
            raise BadRequest(f"DatasetField with id={field_id} not found", 404)

        payload = request.get_json(silent=True) or {}

        UPDATABLE_FIELDS = {
            "name",
            "description",
            "tenant_id",
            "dataset_id",
            "expression",
            "aggregation",
            "field_type",
            "data_type",
            "format",
            "is_public",
            "is_filterable",
            "is_groupable",
            "is_sortable",
            "is_selectable",
            "is_hidden",
            "is_active",
        }

        for up_field in UPDATABLE_FIELDS:
            if up_field in payload:
                setattr(field, up_field, payload[up_field])

        field.updated_by_id=currentUserId()

        db.session.commit()
        return jsonify({"message": "DatasetField updated"}), 200
    
    except SQLAlchemyError as e:
        db.session.rollback()
        raise BadRequest("Failed to update field", 500)

@bp.delete("/<int:field_id>")
@require_auth
def delete_field(field_id: int):
    try:
        field:DatasetField = DatasetField.query.get(field_id)
        if not field or field.deleted:
            raise BadRequest(f"DatasetField with id={field_id} not found", 404)
        field.is_active = False
        field.deleted = True
        field.deleted_at = datetime.now(timezone.utc)
        field.deleted_by_id=currentUserId()
    
        db.session.commit()
        return jsonify({"message": "DatasetField deleted"}), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        raise BadRequest("Failed to delete field", 500)

