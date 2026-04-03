from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional, Any, Dict, List
from flask import Blueprint, request, jsonify
from werkzeug.exceptions import BadRequest, NotFound
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError, SQLAlchemyError, OperationalError
from backend.src.app.configs.extensions import db
from backend.src.modules.analytics.logger import get_backend_logger
from backend.src.app.middlewares.access_security import require_auth, currentUserId
from backend.src.modules.analytics.models.b_dataset import Dataset, DatasetField, DatasetQuery, DbObjectType
from backend.src.modules.analytics.models.c_dataset_chart import DatasetChart
from sqlalchemy.orm import selectinload
from backend.src.modules.analytics.routes.datasets.dataset_chart_engine import (
    ALLOWED_CHART_TYPES,
    CHART_MAX_ROWS,
    ChartExecutor,
    ChartFactory,
    ChartPivotEngine,
    ChartPivotOptions,
    ChartStructureSchema,
    ChartTransformer,
    ChartValidator,
)

logger = get_backend_logger(__name__)

bp = Blueprint("dataset_charts", __name__, url_prefix="/api/dataset-charts")

def get_chart_or_404(chart_id: int) -> DatasetChart:
    chart = DatasetChart.query.get(chart_id)
    if not chart or chart.deleted:
        raise NotFound(f"DatasetChart {chart_id} not found")
    return chart

def safe_commit():
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        raise BadRequest("Duplicate or invalid data")
    except SQLAlchemyError:
        db.session.rollback()
        raise BadRequest("Database error")

def list_charts(chart_id: Optional[int] = None, tenant_id: Optional[int] = None,dataset_id: Optional[int] = None,query_id: Optional[int] = None, all:bool = True):
    query = DatasetChart.query.options(
        selectinload(DatasetChart.dataset)
            .selectinload(Dataset.queries)
            # .selectinload(Dataset.fields)
        ,
        # selectinload(DatasetChart.tenant),
        # selectinload(DatasetChart.dataset_query),
        # selectinload(DatasetChart.visualizations),
    ).filter(DatasetChart.deleted == False)

    if chart_id is not None:
        query = query.filter(DatasetChart.id == chart_id)

    if tenant_id is not None:
        query = query.filter(DatasetChart.tenant_id == tenant_id)

    if dataset_id is not None:
        query = query.filter(DatasetChart.dataset_id == dataset_id)

    if query_id is not None:
        query = query.filter(DatasetChart.query_id == query_id)

    if all == True:
        charts: List[DatasetChart] = query.all()
        return [chart.to_dict() for chart in charts]
    else:
        chart:DatasetChart = query.first()
        return chart.to_dict()


# ===================== CHARTS =====================
@bp.get("")
@require_auth
def list_full_charts():
    tenant_id = request.args.get("tenant_id", type=int)
    dataset_id = request.args.get("dataset_id", type=int)
    query_id = request.args.get("query_id", type=int)
    if not tenant_id:
        raise BadRequest("tenant_id is required", 400)
    
    charts = list_charts(tenant_id=tenant_id, dataset_id=dataset_id,query_id=query_id)
    return jsonify(charts), 200

@bp.get("/<int:chart_id>")
@require_auth
def get_chart(chart_id: int):
    tenant_id = request.args.get("tenant_id", type=int)
    if not tenant_id:
        raise BadRequest("tenant_id is required", 400)
    
    chart = list_charts(tenant_id=tenant_id, chart_id=chart_id, all=False)
    if not chart or chart["deleted"]:
        raise BadRequest(f"DatasetChart with id={chart_id} not found")
    return jsonify(chart), 200

@bp.post("")
@require_auth
def create_chart():
    payload = request.get_json(silent=True) or {}
    name = payload.get("name")
    if not name:
        raise BadRequest("DatasetChart name is required")
    
    chart = DatasetChart(
        name=name,
        tenant_id=payload.get("tenant_id"),
        dataset_id=payload.get("dataset_id"),
        query_id=payload.get("query_id"),
        description=payload.get("description"),
        type=payload.get("type"),
        options=payload.get("options"),
        structure=payload.get("structure"),
        is_active=bool(payload.get("is_active", True)),
        created_by_id=currentUserId(),
    )

    db.session.add(chart)
    safe_commit()

    return jsonify({ "success": True, "chart_id": chart.id }), 200

@bp.put("/<int:chart_id>")
@require_auth
def update_chart(chart_id: int):

    chart = get_chart_or_404(chart_id)

    payload = request.get_json(silent=True) or {}
    UPDATABLE_FIELDS = {
        "name",
        "tenant_id",
        "dataset_id",
        "query_id",
        "description",
        "type",
        "options",
        "structure",
        "is_active"
    }

    for field in UPDATABLE_FIELDS:
        if field in payload:
            setattr(chart, field, payload[field])

    chart.updated_by_id=currentUserId()

    safe_commit()

    return jsonify({ "success": True, "chart_id": chart.id }), 200


@bp.delete("/<int:chart_id>")
@require_auth
def delete_chart(chart_id: int):

    chart = get_chart_or_404(chart_id)

    chart.is_active = False
    chart.deleted = True
    chart.deleted_at = datetime.now(timezone.utc)
    chart.deleted_by_id=currentUserId()

    safe_commit()
    return jsonify({"message": "DatasetChart deleted"}), 200


@bp.post("/execute/<int:query_id>")
@require_auth
def execute_chart(query_id: int):

    query: DatasetQuery = DatasetQuery.query.get(query_id)
    if not query or not query.is_active:
        return jsonify({"error": "Query not found or inactive"}), 404

    payload = request.get_json(silent=True) or {}

    chart_type = payload.get("type", "table")
    if chart_type not in ALLOWED_CHART_TYPES:
        return jsonify({"error": "Invalid chart type"}), 400
    
    fields_ids = query.fields_ids or []
    fields:List[DatasetField] = DatasetField.query.filter(
        DatasetField.dataset_id == query.dataset_id,
        DatasetField.id.in_(fields_ids), 
        DatasetField.is_active == True
    ).all()
    
    if not fields :
        return jsonify({"error": "Fields not found or inactive"}), 404

    fields_map:dict[int, DatasetField] = {f.id: f for f in fields}

    query_json = query.query_json or {}
    select = query_json.get("select", {})

    query_dims = select.get("dimensions") or []
    query_mets = select.get("metrics") or []

    queryDimensions: dict[int, Any] = {}
    queryMetrics: dict[int, Any] = {}

    # Build dimension metadata
    for d in query_dims:
        fid = d.get("field_id")
        fd = fields_map.get(fid)
        if fd:
            queryDimensions[fid] = {
                **d,
                "data_type": fd.data_type,
                "field_type": fd.field_type,
                "field_name": (d.get("alias") or fd.name).strip()
            }

    # Build metric metadata
    for m in query_mets:
        fid = m.get("field_id")
        fm = fields_map.get(fid)
        if fm:
            queryMetrics[fid] = {
                **m,
                "data_type": fm.data_type,
                "field_type": fm.field_type,
                "aggregation": fm.aggregation,
                "field_name": (m.get("alias") or fm.name).strip()
            }

    structure = payload.get("structure") or {}
    dimensions:list[dict] = []
    metrics:list[dict] = []
    cleanedFieldsMap: dict[int, Any] = {}
    fields_cols_names = []

    # Selected Dimensions
    for rcd in (structure.get("rows_dimensions") or []) + (structure.get("cols_dimensions") or []):
        fid = rcd.get("field_id")
        dim = queryDimensions.get(fid)
        if dim:
            d = {**dim, "alias": (rcd.get("alias") or dim["field_name"]).strip()}
            cleanedFieldsMap[fid] = d
            dimensions.append(d)
            fields_cols_names.append(dim["field_name"])
            # ChartValidator.sanitize_identifier(col.name)

    # Selected Metrics
    for mt in (structure.get("metrics") or []):
        fid = mt.get("field_id")
        met = queryMetrics.get(fid)
        if met:
            aggregation = mt.get("aggregation") or met.get("aggregation")
            m = {**met, "aggregation": aggregation, "alias": (mt.get("alias") or met["field_name"]).strip()}
            cleanedFieldsMap[fid] = m
            metrics.append(m)
            fields_cols_names.append(met["field_name"])
            # ChartValidator.sanitize_identifier(col.name)

    if not (dimensions or metrics):
        return jsonify({"error": "No columns selected"}), 400

    # filters = structure.get("filters") or []
    # order_by = structure.get("order_by") or []
    # pivot = structure.get("pivot") or False

    chart_options:Dict = payload.get("options", {})
    chart_meta:Dict = chart_options.get("meta", {})

    if not isinstance(dimensions, list) or not isinstance(metrics, list):
        return jsonify({"error": "dimensions and metrics must be arrays"}), 400

    if chart_type != "table" and not (dimensions or metrics):
        return jsonify({"error": "At least one dimension or metric required"}), 400

    try:
        # 🔐 Sécurité table name
        table_name = ChartValidator.sanitize_identifier(query.name)

        # 🔐 Vérification colonnes existantes
        ChartValidator.validate_columns_exist(table_name, fields_cols_names)

        chart:DatasetChart = ChartFactory.from_payload(payload,query)

        ChartValidator.validate_chart(table_name,chart,cleanedFieldsMap)
        
        # 🧠 Build SQL
        if query.sql_type in (DbObjectType.MATVIEW.value, DbObjectType.VIEW.value):

            sql, params = ChartExecutor.generate_chart_sql(table_name, chart, cleanedFieldsMap)

        else:
            # Compiled SQL must already be safe
            sql = query.compiled_sql
            params = {}

        # 🚀 Execute
        result = db.session.execute(text(sql), params)

        rows = []
        columns = None

        for r in result.mappings().yield_per(1000): # .mappings().all()
            d = dict(r)
            if columns is None:
                columns = list(d.keys())

            rows.append({
                k: (float(v) if isinstance(v, Decimal) else v)
                for k, v in d.items()
            })

            if len(rows) >= CHART_MAX_ROWS:
                break

        columns = columns or []
        row_count = len(rows)
        
        structure:ChartStructureSchema = chart.structure

        row_dims = []
        col_dims = []
        metric_map = {}

        for rd in structure.rows_dimensions:
            field = cleanedFieldsMap.get(rd.field_id)
            if not field or field["field_type"] != "dimension":
                raise ValueError(f"Unrecognize dimension: {rd.field_id}.")
            row_dims.append(field["alias"] or field["field_name"])

        for cd in structure.cols_dimensions:
            field = cleanedFieldsMap.get(cd.field_id)
            if not field or field["field_type"] != "dimension":
                raise ValueError(f"Unrecognize dimension: {cd.field_id}.")
            col_dims.append(field["alias"] or field["field_name"])

        for m in structure.metrics:
            field = cleanedFieldsMap.get(m.field_id)

            if not field or field["field_type"] not in {"metric", "calculated_metric"}:
                raise ValueError(f"Unrecognize metric : {m.field_id}.")

            field_name = field["field_name"]
            aggregation = field["aggregation"]

            if aggregation:
                alias = field["alias"] or f"{aggregation.lower()}_{field_name}"
                metric_map[alias] = aggregation.upper()

        pivot_options: ChartPivotOptions = structure.pivot

        # Pivot uniquement si colonnes présentes
        if pivot_options and pivot_options.acitve and col_dims and metric_map and rows:

            pivot = ChartPivotEngine(
                rows=row_dims,
                columns=col_dims,
                metric_map=metric_map,
                fill_value=pivot_options.fill_value,
                rows_total=pivot_options.rows_total,
                cols_total=pivot_options.cols_total,
                rows_subtotal=pivot_options.rows_subtotal,
                cols_subtotal=pivot_options.cols_subtotal,
                percent_metrics=pivot_options.percent_metrics,
                top_n=pivot_options.top_n,
                sort_metric=pivot_options.sort_metric,
                sort_desc=pivot_options.sort_desc
            )

            chart_data = pivot.pivot(rows)

        else:
            chart_data = ChartTransformer.transform(chart.type,rows,chart,cleanedFieldsMap)
            
            # dimensions = rows + cols

    except (ValueError, OperationalError, SQLAlchemyError) as e:
        logger.error(f"SQLAlchemyError executing query {query_id}: {e}")
        return jsonify({"error": str(e)}), 400

    except Exception as e:
        logger.exception("Unexpected error executing chart", extra={"query_id": query_id})
        return jsonify({"error": "Unexpected server error"}), 500


    # 📦 Build Response
    response = {
        "chart": {
            "id":chart.id,
            "name":chart.name,
            "description":chart.description,
            "tenant_id":chart.tenant_id,
            "dataset_id":chart.dataset_id,
            "query_id":chart.query_id,
            "type":chart.type,
            "structure":chart.structure,
            "options":chart.options,
            "is_active":chart.is_active
        },
        "data": chart_data,
        "meta": {
            "row_count": row_count,
            "columns": columns,
            "dimensions": row_dims if col_dims else dimensions,
            "metrics": metric_map,
            "limit": CHART_MAX_ROWS,
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }
    }
    
    return jsonify(response), 200



