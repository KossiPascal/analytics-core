from typing import List

from sqlalchemy import select
from sqlalchemy.orm import selectinload
from flask import Blueprint, request, jsonify, g
from backend.src.app.configs.extensions import db
from backend.src.modules.analytics.models.b_dataset import Dataset, DatasetField, DatasetQuery, DbObjectType, FieldType
from backend.src.modules.analytics.models.c_dataset_chart import DatasetChart
from backend.src.app.middlewares.access_security import require_auth, currentUserId
from backend.src.modules.analytics.logger import get_backend_logger

from werkzeug.exceptions import BadRequest
from sqlalchemy.exc import SQLAlchemyError, IntegrityError

logger = get_backend_logger(__name__)

bp = Blueprint(
    "dataset_aggregates",
    __name__,
    url_prefix="/api/dataset-aggregates"
)

# ==========================================================
# CREATE FULL AGGREGATE
# ==========================================================
@bp.post("")
@require_auth
def create_dataset_aggregate():

    payload = request.get_json(silent=True) or {}
    user_id = g.current_user["id"]
    tenant_id = g.current_user["tenant_id"]

    dataset_data = payload.get("dataset") or {}
    fields_data = payload.get("fields") or []
    queries_data = payload.get("queries") or []
    charts_data = payload.get("charts") or []

    if not dataset_data.get("name"):
        raise BadRequest("Dataset name required", 400)

    try:
        # ================= DATASET =================
        dataset = Dataset(
            name=dataset_data["name"],
            sql_type=dataset_data.get("sql_type", DbObjectType.MATVIEW.value),
            tenant_id=tenant_id,
            datasource_id=dataset_data["datasource_id"],
            connection_id=dataset_data.get("connection_id"),
            sql=dataset_data["sql"],
            columns=dataset_data.get("columns", []),
            created_by_id=user_id,
        )

        db.session.add(dataset)
        db.session.flush()

        # ================= FIELDS =================
        for f in fields_data:
            field = DatasetField(
                tenant_id=tenant_id,
                dataset_id=dataset.id,
                name=f["name"],
                expression=f["expression"],
                field_type=FieldType(f["field_type"]),
                aggregation=f.get("aggregation"),
                data_type=f.get("data_type"),
                is_public=bool(f.get("is_public", False)),
                created_by_id=user_id,
            )
            db.session.add(field)

        db.session.flush()

        # ================= QUERIES =================
        created_queries = []

        for q in queries_data:
            query = DatasetQuery(
                name=q["name"],
                tenant_id=tenant_id,
                dataset_id=dataset.id,
                query_json=q.get("query_json", {}),
                values=q.get("values", {}),
                description=q.get("description"),
                created_by_id=user_id,
            )
            db.session.add(query)
            created_queries.append(query)

        db.session.flush()

        # ================= CHARTS =================
        for c in charts_data:

            query_index = c.get("query_index")
            if query_index is None or query_index >= len(created_queries):
                raise ValueError("Invalid query_index for chart")

            chart = DatasetChart(
                name=c["name"],
                tenant_id=tenant_id,
                dataset_id=dataset.id,
                query_id=created_queries[query_index].id,
                type=c["type"],
                options=c.get("options", {}),
                description=c.get("description"),
                created_by_id=user_id,
            )

            chart.validate_options()
            db.session.add(chart)

        db.session.commit()

        return jsonify(dataset.to_dict(include_relations=True)), 201

    except (ValueError, SQLAlchemyError) as e:
        db.session.rollback()
        logger.exception("Aggregate creation failed")
        raise BadRequest("Failed to create dataset aggregate", 400)


# READ ONE
@bp.get("/<string:dataset_id>")
@require_auth
def get_dataset(dataset_id: str):

    tenant_id = g.current_user["tenant_id"]

    stmt = (
        select(Dataset)
        .where(
            Dataset.id == dataset_id,
            Dataset.tenant_id == tenant_id,
            Dataset.deleted.is_(False),
        )
        .options(
            selectinload(Dataset.fields),
            selectinload(Dataset.queries),
            selectinload(Dataset.charts),
        )
    )

    dataset = db.session.execute(stmt).scalar_one_or_none()

    if not dataset:
        raise BadRequest("Dataset not found", 404)

    return jsonify(dataset.to_dict(include_relations=True))

# READ ALL
@bp.get("")
@require_auth
def list_datasets():
    try:
        tenant_id = g.current_user["tenant_id"]
        stmt = (
            select(Dataset)
            .where(
                Dataset.tenant_id == tenant_id,
                Dataset.deleted.is_(False),
            )
        )

        datasets = db.session.execute(stmt).scalars().all()
        return jsonify([d.to_dict() for d in datasets])

    except (ValueError, SQLAlchemyError) as e:
        db.session.rollback()
        logger.exception("Aggregate creation failed")
        raise BadRequest("Failed to create dataset aggregate", 400)

# UPDATE FULL AGGREGATE
@bp.put("/<string:dataset_id>")
@require_auth
def update_full_aggregate(dataset_id: str):

    payload = request.get_json(silent=True) or {}
    user_id = g.current_user["id"]
    tenant_id = g.current_user["tenant_id"]

    try:

        stmt = (
            select(Dataset)
            .where(
                Dataset.id == dataset_id,
                Dataset.tenant_id == tenant_id,
                Dataset.deleted.is_(False),
            )
            .options(
                selectinload(Dataset.fields),
                selectinload(Dataset.queries),
                selectinload(Dataset.charts),
            )
        )

        dataset = db.session.execute(stmt).scalar_one_or_none()
        if not dataset:
            raise ValueError("Dataset not found")

        # ================= UPDATE DATASET =================
        dataset_data = payload.get("dataset") or {}
        for attr in ["name", "sql", "datasource_id", "connection_id", "columns"]:
            if attr in dataset_data:
                setattr(dataset, attr, dataset_data[attr])

        if "sql_type" in dataset_data:
            dataset.sql_type = (dataset_data["sql_type"] or DbObjectType.MATVIEW.value).lower()

        dataset.updated_by_id = user_id

        # ================= SYNC FIELDS =================
        fields:List[DatasetField] = dataset.fields
        existing_fields = {f.id: f for f in fields}
        received_ids = set()

        for f in payload.get("fields", []):
            fid = f.get("id")

            if fid and fid in existing_fields:
                field = existing_fields[fid]
                received_ids.add(fid)

                field.name = f["name"]
                field.expression = f["expression"]
                field.field_type = FieldType(f["field_type"])
                field.aggregation = f.get("aggregation")
                field.data_type = f.get("data_type")
                field.is_public = bool(f.get("is_public", False))
                field.updated_by_id = user_id,
            else:
                db.session.add(
                    DatasetField(
                        tenant_id=tenant_id,
                        dataset_id=dataset.id,
                        name=f["name"],
                        expression=f["expression"],
                        field_type=FieldType(f["field_type"]),
                        aggregation=f.get("aggregation"),
                        data_type=f.get("data_type"),
                        is_public=bool(f.get("is_public", False)),
                        created_by_id=user_id,
                    )
                )

        for fid, field in existing_fields.items():
            if fid not in received_ids:
                db.session.delete(field)

        # ================= SYNC QUERIES =================
        queries:List[DatasetQuery] = dataset.queries
        existing_queries = {q.id: q for q in queries}
        received_q_ids = set()

        for q in payload.get("queries", []):
            qid = q.get("id")

            if qid and qid in existing_queries:
                query = existing_queries[qid]
                received_q_ids.add(qid)

                query.name = q["name"]
                query.query_json = q.get("query_json", {})
                query.values = q.get("values", {})
                query.description = q.get("description")
                query.updated_by_id=user_id,
            else:
                db.session.add(
                    DatasetQuery(
                        name=q["name"],
                        tenant_id=tenant_id,
                        dataset_id=dataset.id,
                        query_json=q.get("query_json", {}),
                        values=q.get("values", {}),
                        description=q.get("description"),
                        created_by_id=user_id,
                    )
                )

        for qid, query in existing_queries.items():
            if qid not in received_q_ids:
                db.session.delete(query)

        # ================= SYNC CHARTS =================
        charts:List[DatasetChart] = dataset.charts
        existing_charts = {c.id: c for c in charts}
        received_c_ids = set()

        for c in payload.get("charts", []):
            cid = c.get("id")

            if cid and cid in existing_charts:
                chart = existing_charts[cid]
                received_c_ids.add(cid)

                chart.name = c["name"]
                chart.type = c["type"]
                chart.options = c.get("options", {})
                chart.description = c.get("description")
                chart.updated_by_id=user_id,
                chart.validate_options()
            else:
                db.session.add(
                    DatasetChart(
                        name=c["name"],
                        tenant_id=tenant_id,
                        dataset_id=dataset.id,
                        query_id=c["query_id"],
                        type=c["type"],
                        options=c.get("options", {}),
                        description=c.get("description"),
                        created_by_id=user_id,
                    )
                )

        for cid, chart in existing_charts.items():
            if cid not in received_c_ids:
                db.session.delete(chart)

        db.session.commit()

        return jsonify(dataset.to_dict(include_relations=True))

    except (ValueError, SQLAlchemyError) as e:
        db.session.rollback()
        logger.exception("Aggregate update failed")
        raise BadRequest("Failed to update dataset aggregate", 400)

# DELETE (SOFT CASCADE)
@bp.delete("/<string:dataset_id>")
@require_auth
def delete_aggregate(dataset_id: str):

    user_id = g.current_user["id"]
    tenant_id = g.current_user["tenant_id"]

    try:
        stmt = (
            select(Dataset)
            .where(
                Dataset.id == dataset_id,
                Dataset.tenant_id == tenant_id,
                Dataset.deleted.is_(False),
            )
            .options(
                selectinload(Dataset.fields),
                selectinload(Dataset.queries),
                selectinload(Dataset.charts),
            )
        )

        dataset = db.session.execute(stmt).scalar_one_or_none()
        if not dataset:
            raise BadRequest("Dataset not found", 404)

        dataset.soft_delete(user_id)
        db.session.commit()

        return jsonify({"message": "Dataset deleted successfully"})

    except (ValueError, SQLAlchemyError) as e:
        db.session.rollback()
        logger.exception("Aggregate delete failed")
        raise BadRequest("Failed to delete dataset aggregate", 400)