from datetime import datetime, timezone
from typing import Optional, List

from flask import Blueprint, g, request, jsonify
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload

from backend.src.app.configs.extensions import db, get_connection
from backend.src.modules.analytics.executors.sql_executor import run_sql
from backend.src.modules.analytics.models.b_dataset import Dataset, DatasetField, DatasetVersioned, DbObjectType
from backend.src.modules.analytics.logger import get_backend_logger
from backend.src.modules.analytics.routes.datasets.db_manager import DbObjectManager, SqlIntrospector
from backend.src.app.middlewares.access_security import require_auth, currentUserId

from werkzeug.exceptions import BadRequest
from sqlalchemy.exc import SQLAlchemyError, IntegrityError


logger = get_backend_logger(__name__)

bp = Blueprint("datasets", __name__, url_prefix="/api/datasets")


def list_datasets(tenant_id: Optional[int] = None,dataset_id: Optional[int] = None, all:bool = True):
    
    query = Dataset.query.options(
        selectinload(Dataset.tenant),
        selectinload(Dataset.fields),
        selectinload(Dataset.queries),
        selectinload(Dataset.datasource),
        # selectinload(Dataset.connection),
        # selectinload(Dataset.charts),
        # selectinload(Dataset.queries),
        # selectinload(Dataset.all_versioned),
        # selectinload(Dataset.parent),
    ).filter(Dataset.deleted == False)

    if dataset_id is not None:
        query = query.filter(Dataset.id == dataset_id)

    if tenant_id is not None:
        query = query.filter(Dataset.tenant_id == tenant_id)

    if all == True:
        charts: List[Dataset] = query.all()
        return [chart.to_dict() for chart in charts]
    else:
        chart:Dataset = query.first()
        return chart.to_dict()


# CREATE DATASET
def validate_sql_given(sql:str, values:dict, max_rows:int=50, explain:bool=False, limit:int=100):
    try:

        unwrap_sql=SqlIntrospector.unwrap_sql(sql)
        rendered_sql = DbObjectManager.render_sql_with_values(unwrap_sql, values)
        final_sql = SqlIntrospector.add_limit(rendered_sql, limit)

        conn = get_connection()
        result, status = run_sql(conn, final_sql, None, max_rows=max_rows, explain=explain)
        
        return result, status

    except Exception as e:
        logger.error("Error validating sql")
        raise

# HELPERS
def get_pagination():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    per_page = min(per_page, 100)
    return page, per_page

# LIST DATASETS
@bp.get("")
@require_auth
def list_datasets_by():
    include_relations = request.args.get("include_relations", "false").lower() == "true"
    tenant_id = request.args.get("tenant_id", type=str)
    if not tenant_id:
        raise BadRequest("tenant_id is required", 400)

    datasets = list_datasets(tenant_id=tenant_id)

    return jsonify(datasets)

# LIST DATASETS PAGINATE
@bp.get("/paginate")
@require_auth
def list_datasets_paginate():
    tenant_id = request.args.get("tenant_id", type=str)
    if not tenant_id:
        raise BadRequest("tenant_id is required", 400)

    datasets = Dataset.query.options(
        selectinload(Dataset.fields),
        selectinload(Dataset.queries),
    ).filter(Dataset.tenant_id == tenant_id, Dataset.deleted == False)

    page, per_page = get_pagination()
    pagination = datasets.order_by(Dataset.id.desc()).paginate(
        page=page,
        per_page=per_page,
        error_out=False,
    )
    
    return jsonify([d.to_dict() for d in pagination.items if d is not None])
    # return jsonify({
    #     "items": [d.to_dict() for d in pagination.items],
    #     "total": pagination.total,
    #     "page": pagination.page,
    #     "pages": pagination.pages,
    # }), 200

# GET ONE DATASET
@bp.get("/<string:dataset_id>")
@require_auth
def get_dataset(dataset_id:int):
    tenant_id = request.args.get("tenant_id", type=str)
    if not tenant_id:
        raise BadRequest("tenant_id is required", 400)
    
    dataset = list_datasets(tenant_id=tenant_id, dataset_id=dataset_id, all=False)

    if not dataset or dataset["deleted"]:
        raise BadRequest("Dataset not found", 404)

    return jsonify(dataset), 200

# CREATE DATASET
@bp.post("validate-sql")
@require_auth
def validate_dataset():
    try:
        payload = request.get_json(silent=True) or {}

        sql = payload.get("sql")
        values = payload.get("values") or {}
            
        limit = int(payload.get("limit") or 100)
        max_rows = int(payload.get("max_rows") or 50)
        explain = bool(payload.get("explain") or False)
        
        result, status = validate_sql_given(sql, values, max_rows, explain, limit)
        
        return jsonify(result), status

    except Exception as e:
        logger.error("Error validating sql")
        raise

# CREATE DATASET
@bp.post("")
@require_auth
def create_dataset():
    try:
        user_id = currentUserId()
        if not user_id:
            raise BadRequest(f"Current User not found", 401)

        payload = request.get_json(silent=True) or {}

        for field in ["name","tenant_id","datasource_id"]:
            if not field in payload:
                raise BadRequest(f"{field} is required", 400)

        name = payload.get("name")
        view_name = DbObjectManager.safe_object_name(name, user_id)
        sql_type=(payload.get("sql_type") or DbObjectType.MATVIEW.value).lower()

        _manager = DbObjectManager(object_name=view_name, sql_type=sql_type)
        if(_manager.object_exists()):
            raise BadRequest(f"View {view_name} already exist !", 400)

        sql = payload.get("sql")
        values = payload.get("values") or {}
            
        limit = int(payload.get("limit") or 100)
        max_rows = int(payload.get("max_rows") or 50)
        explain = bool(payload.get("explain") or False)
        
        result, status = validate_sql_given(sql, values, max_rows, explain, limit)
        if not status in {200, 201}:
            raise BadRequest("Votre SQL n'est pas valide, veuillez réessayer", 400)

        cleaned_sql=SqlIntrospector.unwrap_sql(sql)
        columns = SqlIntrospector.get_columns(cleaned_sql, values)

        options = payload.get("options") or {}
            
        dataset = Dataset(
            name=name,
            sql=cleaned_sql,
            values=values,
            options=options,
            sql_type=sql_type,
            view_name=view_name,
            description=payload.get("description"),
            tenant_id=payload.get("tenant_id"),
            datasource_id=payload.get("datasource_id"),
            connection_id=payload.get("connection_id"),
            columns=columns,
            version=payload.get("version") or 1,
            is_active=bool(payload.get("is_active", False)),
            created_by_id=user_id,
        )
        db.session.add(dataset)

        _manager.create_object(sql=cleaned_sql, values=values)

        db.session.commit()

        return jsonify(dataset.to_dict()), 201

    except IntegrityError as e:
        db.session.rollback()
        raise BadRequest(f"Duplicate dataset name for tenant: {str(e)}", 400)

    except Exception as e:
        db.session.rollback()
        logger.error("Error creating dataset")
        raise

# LOCAL VIEW
@bp.get("/local-views")
@require_auth
def get_local_views():
    try:
        local_views = Dataset.local_views()
        return jsonify(local_views), 201

    except IntegrityError as e:
        raise BadRequest(f"Error local_views: {str(e)}", 400)

# VIEW SQL
@bp.get("/view-sql/<string:view_name>/<string:sql_type>")
@require_auth
def get_view_sql_columns(view_name:str, sql_type:str):
    try:
        if not view_name or not sql_type:
            raise BadRequest(f"view_name and sql_type are required")

        sql_from_db = SqlIntrospector.sql_from_db(view_name=view_name,sql_type=sql_type)

        if not sql_from_db:
            raise BadRequest("Object not found in database", 404)

        return jsonify({"sql": sql_from_db}), 201

    except IntegrityError as e:
        raise BadRequest(f"Error local_views: {str(e)}", 400)

# UPDATE DATASET
@bp.put("/<string:dataset_id>")
@require_auth
def update_dataset(dataset_id:int):
    try:
        user_id = currentUserId()
        if not user_id:
            raise BadRequest(f"Current User not found", 401)

        from sqlalchemy import and_
        dataset:Dataset = Dataset.query.options(
            selectinload(Dataset.fields),
            # selectinload(Dataset.queries),
        ).filter(
            Dataset.deleted == False,
            Dataset.id == dataset_id,
            and_(
                Dataset.view_name.isnot(None), Dataset.view_name != "",
                Dataset.sql_type.isnot(None), Dataset.sql_type != "",
            )
        ).first()

        if not dataset:
            raise BadRequest("Dataset not found", 404)

        view_name = dataset.view_name
        sql_type = dataset.sql_type

        _manager = DbObjectManager(object_name=view_name, sql_type=sql_type)
        # if(not _manager.object_exists()):
        #     raise BadRequest(f"View not exist !", 404)

        payload = request.get_json(silent=True) or {}

        sql = payload.get("sql")
        values = payload.get("values") or {}
            
        limit = int(payload.get("limit") or 100)
        max_rows = int(payload.get("max_rows") or 50)
        explain = bool(payload.get("explain") or False)
        
        result, status = validate_sql_given(sql, values, max_rows, explain, limit)
        if not status in {200, 201}:
            raise BadRequest("Votre SQL n'est pas valide, veuillez réessayer", 400)

        cleaned_sql=SqlIntrospector.unwrap_sql(sql)
        columns = SqlIntrospector.get_columns(cleaned_sql, values)
        column_maps = {c["name"]:c["type"] for c in columns if c and c.get("name") and c.get("type")}

        fields:List[DatasetField] = dataset.fields or []
        for field in fields:
            raw_field = field.raw_field or {}
            raw_type = raw_field.get("type")
            raw_name = raw_field.get("name")

            if raw_name not in column_maps:
                message = f"The required field '{raw_name}' is missing in the provided columns."
                raise BadRequest(message, 400)

            expected_type = column_maps[raw_name]
            if raw_type and expected_type:
                if raw_type != expected_type:
                    raise BadRequest(
                        f"The field '{raw_name}' has type '{raw_type}' "
                        f"but the expected type is '{expected_type}'.",
                        400)

        dts_versioned = DatasetVersioned(
            dataset_id=dataset.id,
            sql=dataset.sql,
            values=dataset.values,
            version=dataset.version,
            options=dataset.options,
            archived_by=user_id,
        )
        db.session.add(dts_versioned)

        for field in { "name", "options", "description", "is_active" }:
            if field in payload:
                setattr(dataset, field, payload[field])
            elif field in ["name"]:
                raise BadRequest(f"{field} is required", 400)

        dataset.columns=columns
        dataset.sql=cleaned_sql
        dataset.values=values
        dataset.version=dataset.version + 1
        dataset.updated_by_id=user_id

        _manager.update_object(sql=cleaned_sql, values=values)

        db.session.commit()

        return jsonify(dataset.to_dict()), 200

    except IntegrityError:
        db.session.rollback()
        raise BadRequest("Duplicate dataset name", 400)

    except Exception as e:
        db.session.rollback()
        logger.exception("Error updating dataset")
        raise

# DELETE DATASET
@bp.delete("/<string:dataset_id>")
@require_auth
def delete_dataset(dataset_id:int):
    try:
        dataset:Dataset = Dataset.query.get(dataset_id)
        if not dataset:
            raise BadRequest("Dataset not found", 404)
        
        # dataset.is_active = False
        # dataset.deleted = True
        # dataset.deleted_at = datetime.now(timezone.utc)
        # dataset.deleted_by_id=currentUserId(),

        db.session.delete(dataset)

        db.session.commit()

        return jsonify({"message": "Dataset deleted successfully"}), 200

    except Exception as e:
        db.session.rollback()
        logger.exception("Error deleting dataset")
        raise

# DELETE DATASET
@bp.delete("/<string:dataset_id>/forever")
@require_auth
def admin_delete_dataset(dataset_id:int):
    try:
        dataset:Dataset = Dataset.query.get(dataset_id)
        if not dataset:
            raise BadRequest("Dataset not found", 404)
        
        db.session.delete(dataset)

        all_versioned = DatasetVersioned.query.filter(
            DatasetVersioned.dataset_id == dataset.id
        ).all()

        for versioned in all_versioned or []:
            db.session.delete(versioned)

        db.session.commit()

        return jsonify({"message": "Dataset deleted successfully"}), 200

    except Exception as e:
        db.session.rollback()
        logger.exception("Error deleting dataset")
        raise



