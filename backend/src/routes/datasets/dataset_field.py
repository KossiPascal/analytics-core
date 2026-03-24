from typing import Optional, List
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, g
from backend.src.databases.extensions import db
from backend.src.models.datasets.dataset import Dataset, DatasetField
from backend.src.routes.datasets.db_manager import SqlIntrospector
from backend.src.routes.datasets.query.sql_compiler import SQLFilterBuilder
from backend.src.security.access_security import require_auth, currentUserId
from sqlalchemy.orm import selectinload

from werkzeug.exceptions import BadRequest
from sqlalchemy.exc import SQLAlchemyError, IntegrityError

from backend.src.logger import get_backend_logger
logger = get_backend_logger(__name__)

bp = Blueprint("dataset_fields", __name__, url_prefix="/api/dataset-fields")

def make_unique_name(base_name: str, existing: set) -> str:
    if base_name not in existing:
        return base_name

    i = 1
    while f"{base_name}_{i}" in existing:
        i += 1
    return f"{base_name}_{i}"

DEFAULT_AGGREGATE_PRIORITY = ["sum", "count", "avg", "min", "max"]

AGGREGATE_BY_SQL_TYPE = {
    "string": ["count", "min", "max"],
    "text": ["count"],
    "integer": ["sum", "avg", "count", "min", "max"],
    "number": ["sum", "avg", "count", "min", "max"],
    "bigint": ["sum", "avg", "count", "min", "max"],
    "numeric": ["sum", "avg", "count", "min", "max"],
    "float": ["sum", "avg", "count", "min", "max"],
    "decimal": ["sum", "avg", "count", "min", "max"],
    "boolean": ["count"],
    "date": ["count", "min", "max"],
    "datetime": ["count", "min", "max"],
    "time": ["count", "min", "max"],
    "json": ["count"],
}


def getSqlDataType(view_name:str, expression:str, alias:str, field_type:str, aggregation:str | None):
    cleaned_expression = SQLFilterBuilder.parse_expression(
        expression=expression, 
        field_type=field_type, 
        aggregation=aggregation, 
    )

    sql = f'SELECT {cleaned_expression} AS "{alias}" FROM "{view_name}"'
    columns = SqlIntrospector.get_columns_mapped(sql)

    col = columns.get(alias)
    if not col:
        return None, None

    return col["sql_type"], col["app_type"]


def get_default_aggregation(allowed: list[str]) -> str:
    for agg in DEFAULT_AGGREGATE_PRIORITY:
        if agg in allowed:
            return agg
    return allowed[0]


def validate_aggregation(field_type: str, data_type: str, aggregation: str | None) -> str | None:
    if field_type != "metric":
        return  None
    
    if not data_type:
        raise BadRequest("data_type is required for aggregation")

    allowed = AGGREGATE_BY_SQL_TYPE.get(data_type)
    if not allowed:
        raise BadRequest(f"Unsupported data_type '{data_type}'")

    aggregation = (aggregation or "").strip().lower()

    # default
    if not aggregation:
        return get_default_aggregation(allowed)

    if aggregation not in allowed:
        raise BadRequest(f"Invalid aggregation '{aggregation}' for type '{data_type}'. Allowed: {allowed}")

    return aggregation


def list_fields(field_id: Optional[int] = None, tenant_id: Optional[int] = None,dataset_id: Optional[int] = None, all:bool = True):
    query = DatasetField.query.options(
        selectinload(DatasetField.dataset),
        selectinload(DatasetField.tenant),
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
@bp.get("")
@require_auth
def list_fields_by():
    tenant_id = request.args.get("tenant_id", type=int)
    dataset_id = request.args.get("dataset_id", type=int)

    fields = list_fields(tenant_id=tenant_id,dataset_id=dataset_id)
    return jsonify(fields), 200


@bp.get("/<int:field_id>")
@require_auth
def get_field(field_id: int):
    tenant_id = request.args.get("tenant_id", type=int)
    
    field = list_fields(tenant_id=tenant_id,field_id=field_id,all=False)
    if not field or field["deleted"]:
        raise BadRequest(f"DatasetField with id={field_id} not found", 404)
    return jsonify(field), 200

@bp.post("")
@require_auth
def create_field():
    try:
        payload = request.get_json(silent=True) or {}

        dataset_id = payload.get("dataset_id")
        tenant_id = payload.get("tenant_id")

        if not dataset_id or not tenant_id:
            raise BadRequest("dataset_id and tenant_id are required")
        
        dataset:Dataset = Dataset.query.filter(
            Dataset.id == dataset_id,
            Dataset.tenant_id == tenant_id,
            Dataset.deleted == False
        ).first()

        if not dataset:
            raise BadRequest("dataset not found")

        user_id = currentUserId()
        field_type = payload.get("field_type")

        created_fields:List[DatasetField] = []
        skipped = 0

        existing_names = {
            f.name for f in DatasetField.query.filter(
                DatasetField.tenant_id == tenant_id,
                DatasetField.dataset_id == dataset_id,
                DatasetField.deleted == False
            ).all()
        }

        seen_names = set(existing_names)

        fields = []
        select_multiple = payload.get("select_multiple", False)
        if select_multiple:
            dimensions = payload.get("dimensions") or []
            metrics = payload.get("metrics") or []
            if not isinstance(dimensions, list) or not isinstance(metrics, list):
                raise BadRequest("dimensions and metrics must be lists")
            
            fields = dimensions + metrics
        else:
            fields = [payload]

        for item in fields:

            name = item.get("name")
            data_type = item.get("type") or item.get("data_type")
            description = item.get("description")
            expression = item.get("expression") or name
            item_field_type = item.get("field_type") or field_type

            if not name or not data_type:
                raise BadRequest("name and type are required")

            aggregation = validate_aggregation(item_field_type,data_type,item.get("aggregation"),)

            base_name = f"{aggregation}_{name}" if aggregation else name

            # 🔥 UNIQUE NAME (anti-collision)
            formatted_name = make_unique_name(base_name, seen_names)
            seen_names.add(formatted_name)

            if formatted_name in existing_names:
                skipped += 1
                continue

            existing_names.add(formatted_name)

            # 🔥 TYPE DETECTION SAFE
            try:
                sql_type, app_type = getSqlDataType(dataset.view_name,expression,formatted_name,item_field_type,aggregation)
            except Exception:
                sql_type, app_type = None, data_type

            dataType = sql_type or data_type

            if select_multiple:
                raw_field={"name": name, "type": dataType}
            else:
                raw_field = payload.get("raw_field") or {}
                if not isinstance(raw_field, dict) or not raw_field.get("name") or not raw_field.get("type"):
                    raise BadRequest("raw_field must be a dict with 'name' and 'type'")

            new_field = DatasetField(
                name=formatted_name,
                tenant_id=tenant_id,
                dataset_id=dataset_id,
                raw_field=raw_field,
                description=description,
                expression=expression,
                aggregation=aggregation,
                field_type=item_field_type,
                data_type=dataType,
                format=payload.get("format") or {},
                is_public=bool(payload.get("is_public", False)),
                is_filterable=bool(payload.get("is_filterable", False)),
                is_groupable=bool(payload.get("is_groupable", False)),
                is_sortable=bool(payload.get("is_sortable", False)),
                is_selectable=bool(payload.get("is_selectable", False)),
                is_hidden=bool(payload.get("is_hidden", False)),
                is_active=bool(payload.get("is_active", True)),
                created_by_id=user_id,
            )

            db.session.add(new_field)
            created_fields.append(new_field)

        db.session.commit()

        return jsonify({
            "message": "DatasetFields created",
            "count": len(created_fields),
            "skipped": skipped,
            "field_ids": [f.id for f in created_fields],
        }), 201

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

        raw_field = payload.get("raw_field") or {}
        raw_name = raw_field.get("name")
        raw_type = raw_field.get("type")
        
        if not isinstance(raw_field, dict) or not raw_name or not raw_type:
            raise BadRequest(f"raw_field muist be a dict with key=name -> string and key=type -> string", 404)

        UPDATABLE_FIELDS = {
            "name",
            "raw_field",
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

