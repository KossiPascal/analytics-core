from decimal import Decimal

from sqlalchemy import text
from typing import Dict, List
from datetime import datetime, timezone
from werkzeug.exceptions import BadRequest
from flask import Blueprint, request, jsonify, g

from backend.src.databases.extensions import db
from backend.src.models.datasets.dataset import DatasetQuery, DatasetSqlType
from backend.src.models.datasets.dataset_chart import DatasetChart
from backend.src.routes.datasets.chart.chart_engine import ALLOWED_CHART_TYPES, CHART_MAX_ROWS, ChartExecutor, ChartFactory, ChartPivotOptions, ChartTransformer, ChartPivotEngine, ChartValidator
from backend.src.routes.datasets.query.sql_compiler import SQLValueParser
from backend.src.security.access_security import require_auth, currentUserId

from werkzeug.exceptions import BadRequest
from sqlalchemy.exc import IntegrityError, SQLAlchemyError, SQLAlchemyError, OperationalError

from backend.src.logger import get_backend_logger
logger = get_backend_logger(__name__)

bp = Blueprint("dataset_charts", __name__, url_prefix="/api/dataset-charts")


# ===================== CHARTS =====================
@bp.get("/<int:tenant_id>")
@require_auth
def list_full_charts(tenant_id: int):
    charts: List[DatasetChart] = DatasetChart.query.filter(
        DatasetChart.tenant_id==tenant_id,
        DatasetChart.deleted==False
    ).all()
    return jsonify([r.to_dict() for r in charts]), 200

@bp.get("/<int:tenant_id>/<int:dataset_id>")
@require_auth
def list_charts_by_dataset(tenant_id: int, dataset_id: int):
    charts: List[DatasetChart] = DatasetChart.query.filter(
        DatasetChart.tenant_id==tenant_id,
        DatasetChart.dataset_id==dataset_id,
        DatasetChart.deleted==False
    ).all()
    return jsonify([r.to_dict() for r in charts]), 200

@bp.get("/<int:tenant_id>/<int:dataset_id>/<int:query_id>")
@require_auth
def list_charts_by_dataset_and_query(tenant_id: int, dataset_id: int, query_id: int):
    charts: List[DatasetChart] = DatasetChart.query.filter(
        DatasetChart.tenant_id==tenant_id,
        DatasetChart.dataset_id==dataset_id,
        DatasetChart.query_id==query_id,
        DatasetChart.deleted==False
    ).all()
    return jsonify([r.to_dict() for r in charts]), 200

@bp.get("/<int:tenant_id>/<int:chart_id>")
@require_auth
def get_chart(tenant_id: int,chart_id: int):
    query:DatasetChart = DatasetChart.query.filter(
        DatasetChart.id==chart_id,
        DatasetChart.tenant_id==tenant_id,
        DatasetChart.deleted==False
    ).first()
    if not query or query.deleted:
        raise BadRequest(f"DatasetChart with id={chart_id} not found")
    
    data = query.to_dict()
    return jsonify(data), 200

@bp.post("")
@require_auth
def create_chart():
    try:
        data = request.get_json(silent=True) or {}

        name = data.get("name")
        tenant_id = data.get("tenant_id")
        dataset_id = data.get("dataset_id")
        query_id = data.get("query_id")
        description = data.get("description")
        options = data.get("options")
        structure = data.get("structure")
        is_active = bool(data.get("is_active", False))

        if not name:
            raise BadRequest("DatasetChart name is required")

        chart = DatasetChart(
            name=name,
            tenant_id=tenant_id,
            dataset_id=dataset_id,
            query_id=query_id,
            description=description,
            type=data.get("type"),
            options=options,
            structure=structure,
            is_active=is_active,
        )

        chart.created_by_id=currentUserId()

        db.session.add(chart)
        db.session.commit()

        return jsonify({
            "success": True,
            "message": "DatasetChart created",
            "chart_id": chart.id
        }), 200
    
    except IntegrityError:
        db.session.rollback()
        raise BadRequest("Duplicate or invalid data")

    except ValueError:
        db.session.rollback()
        raise BadRequest("Invalid chart type")
    
    except SQLAlchemyError as e:
        db.session.rollback()
        raise BadRequest("Invalid chart type")

    except Exception:
        db.session.rollback()
        raise  # Let global handler return 500

@bp.put("/<int:chart_id>")
@require_auth
def update_chart(chart_id: int):
    try:
        chart:DatasetChart = DatasetChart.query.get(chart_id)
        if not chart or chart.deleted:
            raise BadRequest(f"DatasetChart with id={chart_id} not found")

        data = request.get_json(silent=True) or {}
        if "name" in data:
            chart.name = data["name"]
        if "tenant_id" in data:
            chart.tenant_id = data["tenant_id"]
        if "dataset_id" in data:
            chart.dataset_id = data["dataset_id"]
        if "query_id" in data:
            chart.query_id = data["query_id"]
        if "description" in data:
            chart.description = data["description"]
        if "type" in data:
            chart.type = data.get("type")
        if "options" in data:
            chart.options = data["options"]
        if "structure" in data:
            chart.structure = data["structure"]
        if "is_active" in data:
            chart.is_active = bool(data.get("is_active", True))

        chart.updated_by_id=currentUserId()

        db.session.commit()

        return jsonify({
            "success": True,
            "message": "DatasetChart updated",
            "chart_id": chart.id
        }), 200
    
    except IntegrityError:
        db.session.rollback()
        raise BadRequest("Duplicate or invalid data")

    except ValueError:
        db.session.rollback()
        raise BadRequest("Invalid chart type")
    
    except SQLAlchemyError as e:
        db.session.rollback()
        raise BadRequest("SQL Alchemy Error")

    except Exception:
        db.session.rollback()
        raise  # Let global handler return 500

@bp.delete("/<int:chart_id>")
@require_auth
def delete_chart(chart_id: int):
    try:
        query:DatasetChart = DatasetChart.query.get(chart_id)
        if not query or query.deleted:
            raise BadRequest(f"DatasetChart with id={chart_id} not found")

        query.deleted = True
        query.deleted_at = datetime.now(timezone.utc)
        query.deleted_by_id=currentUserId()
    
        db.session.commit()
        return jsonify({"message": "DatasetChart deleted"}), 200
    except Exception:
        db.session.rollback()
        raise  # Let global handler return 500


@bp.post("/execute/<int:query_id>")
@require_auth
def execute_chart(query_id: int):
    """
    Execute un DatasetQuery et retourne un DatasetChart avec les données adaptées au type.
    Gestion complète des types de chart et des dimensions/metrics sélectionnées.
    """

    query: DatasetQuery = DatasetQuery.query.get(query_id)
    if not query or not query.is_active:
        return jsonify({"error": "Query not found or inactive"}), 404

    payload = request.get_json(silent=True) or {}

    # 🎯 Validate Chart Type
    chart_type = payload.get("type", "table")
    if chart_type not in ALLOWED_CHART_TYPES:
        return jsonify({"error": "Invalid chart type"}), 400

    structure = payload.get("structure") or {}

    rows_dims = structure.get("rows_dimensions") or []
    cols_dims = structure.get("cols_dimensions") or []
    dims = rows_dims + cols_dims

    metrics = structure.get("metrics") or []
    # filters = structure.get("filters") or []
    # order_by = structure.get("order_by") or []
    # pivot = structure.get("pivot") or False

    chart_options:Dict = payload.get("options", {})
    chart_meta:Dict = chart_options.get("meta", {})
    pivot_mode = chart_meta.get("pivot_mode") # "dynamic" | "rows_to_columns" | "columns_to_rows"
    pivot_aggr = chart_meta.get("pivot_aggregation", "SUM").upper()

    if not isinstance(dims, list) or not isinstance(metrics, list):
        return jsonify({"error": "dimensions and metrics must be arrays"}), 400

    if chart_type != "table" and not (dims or metrics):
        return jsonify({"error": "At least one dimension or metric required"}), 400

    try:
        chart_name = payload.get("name", f"Chart {query.name}"),
        # query_view_name = SQLValueParser.quote_identifier(query.name)

        # 🔐 Sécurité table name
        table_name = ChartValidator.sanitize_identifier(query.name)
        metric_fields = [m["field"] for m in metrics if m] if metrics else []
        # metric_alias = [m["alias"] for m in metrics if m] if metrics else []
        dim_fields = [d["field"] for d in dims if d] if dims else []
        # dim_alias = [d["alias"] for d in dims if d] if dims else []
        selected_cols_fields = list(dict.fromkeys(dim_fields + metric_fields))
        # selected_cols_alias = list(dict.fromkeys(dim_alias + metric_alias))

        if not selected_cols_fields:
            return jsonify({"error": "No columns selected"}), 400

        for col in selected_cols_fields:
            ChartValidator.sanitize_identifier(col)

        # 🔐 Vérification colonnes existantes
        ChartValidator.validate_columns_exist(table_name, selected_cols_fields)

        chart:DatasetChart = ChartFactory.from_payload(payload)
        
        # 🧠 Build SQL
        if query.sql_type in (DatasetSqlType.MATVIEW.value, DatasetSqlType.VIEW.value):

            sql, params = ChartExecutor.generate_sql(chart, table_name)

        else:
            # Compiled SQL must already be safe
            sql = query.compiled_sql
            params = {}

        # 🚀 Execute
        result = db.session.execute(text(sql), params).mappings().all()

        rows = []
        columns = None

        for r in result:
            d = dict(r)

            if columns is None:
                columns = list(d.keys())

            rows.append({
                k: (float(v) if isinstance(v, Decimal) else v)
                for k, v in d.items()
            })

        columns = columns or []

        if len(rows) >= CHART_MAX_ROWS:
            logger.warning(f"Query {query_id} reached CHART_MAX_ROWS limit")


        # chart_data = ChartTransformer.transform(chart.type,rows,chart)

        row_count = len(rows)

        rows_data = rows
        structure = chart.structure
        # row_dims = [d.alias or d.field for d in structure.rows_dimensions]
        # col_dims = [d.alias or d.field for d in structure.cols_dimensions]

        row_dims = [d.alias if d.alias else d.field for d in structure.rows_dimensions]
        col_dims = [d.alias if d.alias else d.field for d in structure.cols_dimensions]

        metrics = {
            (m.alias or f"{m.aggregation.lower()}_{m.field}"): m.aggregation.upper()
            for m in structure.metrics
        }

        pivot_options:ChartPivotOptions = chart.structure.pivot

        # Pivot uniquement si colonnes présentes
        if pivot_options and pivot_options.acitve and col_dims and metrics and rows_data:

            missing = []

            for c in row_dims + col_dims + list(metrics.keys()):
                if c not in rows_data[0]:
                    missing.append(c)

            if missing:
                raise ValueError(f"Pivot fields missing in dataset: {missing}")

            pivot = ChartPivotEngine(
                rows=row_dims,
                columns=col_dims,
                metrics=metrics,
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

            pivot_result = pivot.pivot(rows_data)

            chart_data = pivot_result

            # chart_data = {
            #     "header": {
            #         "header_rows": pivot_result["header"]["header_rows"],
            #         "rows": pivot_result["header"]["rows"],
            #         "columns": pivot_result["header"]["columns"],
            #         "metrics": pivot_result["header"]["metrics"]
            #     },
            #     "rows": pivot_result["rows"]
            # }

        else:
            chart_data = ChartTransformer.transform(
                chart.type,
                rows_data,
                chart
            )
            # dimensions = rows + cols

    except (ValueError, OperationalError, SQLAlchemyError) as e:
        logger.error(f"SQLAlchemyError executing query {query_id}: {e}")
        return jsonify({"error": str(e)}), 400

    except Exception as e:
        logger.error(f"Unexpected error executing query {query_id}-> {str(e)}")
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
            "dimensions": row_dims if col_dims else dims,
            "metrics": metrics,
            "limit": CHART_MAX_ROWS,
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }
    }
    
    return jsonify(response), 200



