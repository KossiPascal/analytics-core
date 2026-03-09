from datetime import datetime, timezone
from backend.src.databases.extensions import db
from flask import Blueprint, request, jsonify, g
from typing import Any, Dict, List, Optional, Set
from backend.src.models.datasets.dataset import Dataset, DatasetField, DatasetQuery, DatasetSqlType
from backend.src.routes.datasets.query.query_validator import QueryValidatorV1
from backend.src.routes.datasets.query.sql_compiler import MaterializedViewManager, SQLCompilerV1
from backend.src.security.access_security import require_auth

from werkzeug.exceptions import BadRequest
from sqlalchemy.exc import SQLAlchemyError, IntegrityError

from backend.src.logger import get_backend_logger
logger = get_backend_logger(__name__)

bp = Blueprint("dataset_queries", __name__, url_prefix="/api/dataset-queries")


class MakeCompileQueryJson():

    def __init__(self,dataset_id:int, query_json: Dict[str, Any], sql_type:str, query_view_name:str):
        self.dataset_id:int = dataset_id
        self.query_json: Dict[str, Any] = query_json or {}
        self.sql_type = sql_type
        self.sql:Optional[str] = None
        self.values: Dict[str, Any] = {}
        self.query_view_name:Optional[str] = query_view_name
        self.manager:MaterializedViewManager|None = None

    def run(self):
        if not self.dataset_id:
            raise BadRequest(f"Dataset Id can't be null", 404)
        
        dataset:Dataset = Dataset.query.get(self.dataset_id)
        if not dataset or dataset.deleted:
            raise BadRequest(f"Dataset with id={self.dataset_id} not found", 404)
        
        fields:List[DatasetField] = [f for f in dataset.fields or []]

        validator = QueryValidatorV1(query_json=self.query_json,fields=fields)
        validator.validate()

        compiler = SQLCompilerV1(dataset=dataset,fields=fields)
        compiled = compiler.compile(query=self.query_json)

        self.sql = compiled["sql"]
        self.values = compiled["values"]
        
        self.manager = MaterializedViewManager(
            query_view_name=self.query_view_name,
            sql_type=self.sql_type
        )
        

    def make_matview_sql(self)-> str:
        return self.manager.generate_matview_sql(sql=self.sql,values=self.values)

    def store_matview(self):
        self.manager.create_matview_safe(sql=self.sql,values=self.values)

    def refresh_matview(self):
        self.manager.refresh_matview()

    def schedule_refresh(self, cron_expression="0 * * * *"):
        self.manager.schedule_refresh(cron_expression=cron_expression)  # every hour at minute 0

# # Rafraîchissement automatique toutes les heures
# MaterializedViewManager.schedule_refresh(view_name="users_summary")



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
        raise BadRequest("Failed to list queries", 500)

@bp.get("/<int:tenant_id>/<int:dataset_id>")
@require_auth
def list_queries_by_dataset(tenant_id: int, dataset_id: int):
    try:
        queries: List[DatasetQuery] = DatasetQuery.query.filter(
            DatasetQuery.tenant_id==tenant_id,
            DatasetQuery.dataset_id==dataset_id,
            DatasetQuery.deleted==False
        ).all()
        return jsonify([r.to_dict() for r in queries]), 200
    except Exception as e:
        logger.error(f"List queries error: {str(e)}")
        raise BadRequest("Failed to list queries", 500)



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
            raise BadRequest(f"DatasetQuery with id={query_id} not found", 404)
        data = query.to_dict()
        return jsonify(data), 200
    except Exception as e:
        logger.error(f"Get query error: {str(e)}")
        raise BadRequest("Failed to get query", 500)

@bp.post("")
@require_auth
def create_query():
    try:
        data = request.get_json(silent=True) or {}
        query_name = data.get("name")
        tenant_id = data.get("tenant_id")
        dataset_id = data.get("dataset_id")
        description = data.get("description")
        query_json = data.get("query_json")
        sql_type = data.get("sql_type") or DatasetSqlType.MATVIEW.value
        compiled_sql = data.get("compiled_sql")
        values = data.get("values")
        is_validated = bool(data.get("is_validated", False))
        is_active = bool(data.get("is_active", False))
        cache = data.get("cache")

        if not query_name:
            raise BadRequest("DatasetQuery name is required", 400)
        
        compiler = MakeCompileQueryJson(
            dataset_id=dataset_id, 
            query_json=query_json, 
            sql_type=sql_type, 
            query_view_name=query_name
        )
        compiler.run()

        if not compiler.sql:
            raise BadRequest("compiled_sql is invalid", 400)

        query = DatasetQuery(
            name=query_name,
            cache=cache,
            tenant_id=tenant_id,
            dataset_id=dataset_id,
            description=description,
            query_json=query_json,
            sql_type=sql_type,
            compiled_sql=compiler.sql, #compiled_sql,
            values=compiler.values, #values,
            is_active=is_active,
        )
        if is_validated:
            query.is_validated=is_validated,
            query.validated_at = datetime.now(timezone.utc)

        query.created_by_id=g.current_user.get("id") if g.get("current_user") else None

        db.session.add(query)
        db.session.commit()

        compiler.store_matview()
        
        return jsonify({"message": "DatasetQuery created", "query_id": query.id}), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Create query error: {str(e)}")
        raise BadRequest("Failed to create query", 500)

@bp.put("/<int:query_id>")
@require_auth
def update_query(query_id: int):
    try:
        query:DatasetQuery = DatasetQuery.query.get(query_id)
        if not query or query.deleted:
            raise BadRequest(f"DatasetQuery with id={query_id} not found", 404)

        data = request.get_json(silent=True) or {}

        dataset_id = data.get("dataset_id") or query.dataset_id
        query_json = data.get("query_json") or query.query_json or {}
        query_name = data.get("name") or query.name
        sql_type = data.get("sql_type") or DatasetSqlType.MATVIEW.value

        if not query_name or not dataset_id or not query_json:
            raise BadRequest("parametters ares invalid", 400)
        
        compiler = MakeCompileQueryJson(
            dataset_id=dataset_id, 
            query_json=query_json, 
            sql_type=sql_type,
            query_view_name=query_name
        )
        compiler.run()

        if not compiler.sql:
            raise BadRequest("compiled_sql is invalid", 400)

        query.name = query_name
        query.dataset_id = dataset_id
        query.sql_type = sql_type
        query.query_json = query_json
        query.compiled_sql = compiler.make_matview_sql() #compiler.sql
        query.values = compiler.values

        # if "compiled_sql" in data:
        #     query.compiled_sql = data["compiled_sql"]
        # if "values" in data:
        #     query.values = data["values"]


        if "tenant_id" in data:
            query.tenant_id = data["tenant_id"]
        if "description" in data:
            query.description = data["description"]
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

        compiler.store_matview()
        
        return jsonify({"message": "DatasetQuery updated"}), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        raise BadRequest("Failed to update query", 500)

@bp.delete("/<int:query_id>")
@require_auth
def delete_query(query_id: int):
    try:
        query:DatasetQuery = DatasetQuery.query.get(query_id)
        if not query or query.deleted:
            raise BadRequest(f"DatasetQuery with id={query_id} not found", 404)

        query.deleted = True
        query.deleted_at = datetime.now(timezone.utc)
        query.deleted_by_id=g.current_user.get("id") if g.get("current_user") else None
    
        db.session.commit()
        return jsonify({"message": "DatasetQuery deleted"}), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        raise BadRequest("Failed to delete query", 500)

@bp.post("/<uuid:q_id>/validate")
@require_auth
def validate_query(q_id):
    try:
        query = DatasetQuery.query.get_or_404(q_id)
        query.validate()
        db.session.commit()
        return jsonify({"message": "Query validated"})
    except Exception as e:
        raise