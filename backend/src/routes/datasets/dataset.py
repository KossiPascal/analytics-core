from datetime import datetime, timezone
from typing import Optional, List

from flask import Blueprint, g, request, jsonify
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload

from backend.src.databases.extensions import db
from backend.src.models.datasets.dataset import Dataset, DatasetSqlType
from backend.src.logger import get_backend_logger
from backend.src.security.access_security import require_auth, currentUserId

from werkzeug.exceptions import BadRequest
from sqlalchemy.exc import SQLAlchemyError, IntegrityError

logger = get_backend_logger(__name__)

bp = Blueprint("datasets", __name__, url_prefix="/api/datasets")


def list_datasets(tenant_id: Optional[int] = None,dataset_id: Optional[int] = None, all:bool = True):
    
    query = Dataset.query.options(
        selectinload(Dataset.fields),
        selectinload(Dataset.queries),
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


# HELPERS
def get_pagination():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    per_page = min(per_page, 100)
    return page, per_page

# LIST DATASETS
@bp.get("/<int:tenant_id>")
@require_auth
def list_datasets_by(tenant_id:int):
    # include_relations = request.args.get("include_relations", "false").lower() == "true"

    datasets = list_datasets(tenant_id=tenant_id)

    return jsonify(datasets)

# LIST DATASETS PAGINATE
@bp.get("/paginate/<int:tenant_id>")
@require_auth
def list_datasets_paginate(tenant_id):
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
@bp.get("/<int:tenant_id>/<int:dataset_id>")
@require_auth
def get_dataset(tenant_id, dataset_id):
    if not tenant_id:
        raise BadRequest("tenant_id is required", 400)
    
    dataset = list_datasets(tenant_id=tenant_id, dataset_id=dataset_id, all=False)

    if not dataset or dataset["deleted"]:
        raise BadRequest("Dataset not found", 404)

    return jsonify(dataset), 200

# CREATE DATASET
@bp.post("")
@require_auth
def create_dataset():
    try:
        data = request.get_json()

        dataset = Dataset(
            name=data["name"],
            view_name=data["view_name"],
            description=data["description"],
            use_local_view=bool(data.get("use_local_view",False)),
            sql=data["sql"],
            sql_type=(data.get("sql_type") or "matview").lower(),
            tenant_id=data["tenant_id"],
            datasource_id=data["datasource_id"],
            connection_id=data.get("connection_id"),
            columns=data.get("columns", []),
            version=data.get("version"),
            is_active=bool(data.get("is_active",False)),
            created_by_id=currentUserId(),
        )

        db.session.add(dataset)
        db.session.commit()

        return jsonify(dataset.to_dict()), 201

    except IntegrityError as e:
        db.session.rollback()
        raise BadRequest(f"Duplicate dataset name for tenant: {str(e)}", 400)

    except Exception as e:
        db.session.rollback()
        logger.error("Error creating dataset")
        raise


@bp.get("/local-views")
@require_auth
def get_local_views():
    try:
        local_views = Dataset.local_views()
        return jsonify(local_views), 201

    except IntegrityError as e:
        raise BadRequest(f"Error local_views: {str(e)}", 400)

@bp.get("/view-sql/<string:view_name>/<string:sql_type>")
@require_auth
def get_view_sql_columns(view_name:str, sql_type:str):
    try:
        sql_from_db = Dataset.get_view_sql_endpoint(view_name, sql_type)
        return jsonify(sql_from_db), 201

    except IntegrityError as e:
        raise BadRequest(f"Error local_views: {str(e)}", 400)

# UPDATE DATASET
@bp.put("/<int:dataset_id>")
@require_auth
def update_dataset(dataset_id):
    try:
        dataset:Dataset = Dataset.query.get(dataset_id)
        if not dataset:
            raise BadRequest("Dataset not found", 404)

        data = request.get_json()

        if "tenant_id" in data:
            dataset.tenant_id = data["tenant_id"]
        if "datasource_id" in data:
            dataset.datasource_id = data["datasource_id"]
        if "connection_id" in data:
            dataset.connection_id = data["connection_id"]
        if "name" in data:
            dataset.name = data["name"]
        if "view_name" in data:
            dataset.view_name = data["view_name"]
        if "use_local_view" in data:
            dataset.use_local_view = bool(data.get("use_local_view",False))
        if "sql_type" in data:
            dataset.sql_type = (data.get("sql_type") or DatasetSqlType.MATVIEW.value).lower()
        if "sql" in data:
            dataset.sql = data["sql"]
        if "columns" in data:
            dataset.columns = data["columns"]
        if "name" in data:
            dataset.connection_id = data.get("connection_id", dataset.connection_id)

        dataset.updated_by_id=currentUserId(),

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
@bp.delete("/<int:dataset_id>")
@require_auth
def delete_dataset(dataset_id):
    try:
        dataset:Dataset = Dataset.query.get(dataset_id)
        if not dataset:
            raise BadRequest("Dataset not found", 404)
        
        dataset.is_active = False
        dataset.deleted = True
        dataset.deleted_at = datetime.now(timezone.utc)
        dataset.deleted_by_id=currentUserId(),
        # db.session.delete(dataset)
        db.session.commit()

        return jsonify({"message": "Dataset deleted successfully"}), 200

    except Exception as e:
        db.session.rollback()
        logger.exception("Error deleting dataset")
        raise