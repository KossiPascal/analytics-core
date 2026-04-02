from __future__ import annotations
import re
from dataclasses import dataclass, field
from typing import Any, Dict, List, Literal, Optional, Union
from sqlalchemy import text, inspect
from collections import defaultdict
from backend.src.databases.extensions import db
from enum import Enum
from backend.src.models.datasets.dataset import DatasetField, DatasetQuery
from backend.src.routes.datasets.query.sql_compiler import FULL_OPERATORS, SQLValueParser
from itertools import product, count

Cell = Union[str, int, List[Union[str, int]]]

# CONSTANTS
CHART_MAX_ROWS = 10000
ALLOWED_CHART_TYPES = {
    "bar", "line", "area", "stacked-area", "stacked-bar",
    "pie", "donut", "kpi", "table",
    "radar", "heatmap", "gauge"
}
ALLOWED_AGGREGATIONS = {"SUM", "AVG", "COUNT", "MAX", "MIN", "NONE", "DISTINCT"}
IDENTIFIER_REGEX = re.compile(r"^[a-zA-Z0-9_]+$")
NO_VALUE_OPERATORS = ["IS TRUE", "IS NOT TRUE", "IS FALSE", "IS NOT FALSE", "IS NULL", "IS NOT NULL"]

MAX_PIVOT_COLUMNS = 100

TABLE_COLUMNS_CACHE = {}

SEPARATOR = "___"

AGGREGATE_BY_SQL_TYPE = {
    # 🔤 Strings
    "string": ["count", "min", "max"],
    "text": ["count"],

    # 🔢 Numeric
    "integer": ["sum", "avg", "count", "min", "max"],
    "number": ["sum", "avg", "count", "min", "max"],
    "bigint": ["sum", "avg", "count", "min", "max"],
    "numeric": ["sum", "avg", "count", "min", "max"],
    "float": ["sum", "avg", "count", "min", "max"],
    "decimal": ["sum", "avg", "count", "min", "max"],

    # 🔘 Boolean
    "boolean": ["count"],

    # 📅 Dates
    "date": ["count", "min", "max"],
    "datetime": ["count", "min", "max"],
    "time": ["count", "min", "max"],

    # 🧩 JSON
    "json": ["count"],
}


TYPE_CAST_MAP = {
    # 🔤 Strings
    "string": "TEXT",
    "text": "TEXT",

    # 🔢 Numeric
    "integer": "INTEGER",
    "number": "NUMERIC",
    "bigint": "BIGINT",
    "numeric": "NUMERIC",
    "float": "FLOAT",
    "decimal": "DECIMAL",

    # 🔘 Boolean
    "boolean": "BOOLEAN",

    # 📅 Dates
    "date": "DATE",
    "datetime": "TIMESTAMP",
    "time": "TIME",

    # 🧩 JSON
    "json": "JSONB",  # recommandé en PostgreSQL
}


DEFAULT_VALUES = {
    # 🔤 Strings
    "string": "''",
    "text": "''",

    # 🔢 Numeric
    "integer": "0",
    "number": "0",
    "bigint": "0",
    "numeric": "0",
    "float": "0",
    "decimal": "0",

    # 🔘 Boolean
    "boolean": "false",

    # 📅 Dates
    "date": "'1970-01-01'",
    "datetime": "'1970-01-01 00:00:00'",
    "time": "'00:00:00'",

    # 🧩 JSON
    "json": "'{}'",
}

AGGREGATE_RETURN_TYPE = {
    "count": "bigint",
    "sum": "numeric",   # ou dépend du champ (optionnel)
    "avg": "numeric",
    "min": None,        # même type que la colonne
    "max": None,
}

# ERRORS
class QueryValidationError(Exception):
    pass

class Direction(str, Enum):
    ASC = "ASC"
    DESC = "DESC"

# MODELS
@dataclass
class ChartFilter:
    field_id: int
    operator: str
    value: Any
    value2: Any = None
    field_type: str = "dimension"
    useSqlInClause: bool = False

@dataclass
class ChartDimension:
    field_id: int
    alias: Optional[str] = None
    # data_type: Optional[str] = None
    # operator:Optional[str] = None
    # value: Optional[Any] = None
    # value2: Optional[Any] = None
    # useSqlInClause: Optional[bool] = None


@dataclass
class ChartMetric:
    field_id: int
    alias: Optional[str] = None
    aggregation: str = "SUM"
    # data_type: Optional[str] = None
    # operator:Optional[str] = None
    # value: Optional[Any] = None
    # value2: Optional[Any] = None
    # useSqlInClause: Optional[bool] = None

@dataclass
class ChartOrderby:
    field_id: int
    alias: Optional[str] = None
    direction: Literal["ASC","DESC"] = "ASC"

@dataclass
class ChartPivotOptions:
    acitve: bool = True
    fill_value:int = 0

    rows_total: bool = True,
    cols_total: bool = True,
    totals: bool = True,

    rows_subtotal: bool = True,
    cols_subtotal: bool = False,
    subtotals: bool = False,

    percent_metrics: List[str] | None = None,
    top_n: Optional[int] = None,
    sort_metric: Optional[str] = None,
    sort_desc: bool = True

@dataclass
class ChartStructureSchema:
    rows_dimensions: List[ChartDimension] = field(default_factory=list)
    cols_dimensions: List[ChartDimension] = field(default_factory=list)
    metrics: List[ChartMetric] = field(default_factory=list)
    filters: List[ChartFilter] = field(default_factory=list)
    order_by: List[ChartOrderby] = field(default_factory=list)
    limit: Optional[int] = None
    offset: Optional[int] = None
    pivot: ChartPivotOptions = field(default_factory=ChartPivotOptions)

@dataclass
class DatasetChart:
    id: Optional[int]
    name: str
    description: Optional[str]
    tenant_id: Optional[int]
    dataset_id: Optional[int]
    query_id: Optional[int]
    type: str
    structure: ChartStructureSchema
    options: Dict[str, Any]
    is_active: bool = True


# VALIDATOR
class ChartValidator:
    @staticmethod
    def sanitize_identifier(name: str) -> str:
        """ Autorise uniquement lettres, chiffres et underscore. """
        if not isinstance(name, str) or not IDENTIFIER_REGEX.match(name):
            raise ValueError(f"Invalid identifier: {name}")
        return name

    @staticmethod
    def validate_columns_exist(table_name: str, columns: List[str]) -> None:

        cached = TABLE_COLUMNS_CACHE.get(table_name)

        if cached is None:
            inspector = inspect(db.engine)
            cached = {col["name"] for col in inspector.get_columns(table_name)}
            TABLE_COLUMNS_CACHE[table_name] = cached

        invalid = [c for c in columns if c not in cached]

        if invalid:
            raise ValueError(f"Invalid columns: {invalid}")

    @staticmethod
    def validate_chart(table_name: str, chart: DatasetChart, fieldsMap: dict[int, Any]):
        if chart.type not in ALLOWED_CHART_TYPES:
            raise ValueError(f"Invalid chart type: {chart.type}")

        structure = chart.structure
        all_columns = []

        for d in (structure.rows_dimensions or []) + (structure.cols_dimensions or []):
            field = fieldsMap.get(d.field_id)
            if not field:
                continue
            # ChartValidator.sanitize_identifier(field["field_name"])
            all_columns.append(field["field_name"])

        for m in structure.metrics or []:
            field = fieldsMap.get(m.field_id)
            if not field:
                # Field not in cleanedFieldsMap — silently skip (already filtered upstream)
                continue
            # ChartValidator.sanitize_identifier(field["field_name"])
            if m.aggregation and m.aggregation.upper() not in ALLOWED_AGGREGATIONS:
                raise ValueError(f"Invalid aggregation: {m.aggregation}")
            all_columns.append(field["field_name"])

        for f in structure.filters or []:
            field = fieldsMap.get(f.field_id)
            if not field:
                continue
            # ChartValidator.sanitize_identifier(field["field_name"])
            if f.operator.upper() not in NO_VALUE_OPERATORS and f.value is None:
                raise ValueError(f"Filter value missing for operator {f.operator}")
            all_columns.append(field["field_name"])

        ChartValidator.validate_columns_exist(
            table_name,
            list(set(all_columns))
        )


    @staticmethod
    def pivot_rows_to_columns(rows: list[dict]) -> list[dict]:
        """
        Transforme: [ {"month": "Jan", "sales": 10}, {"month": "Feb", "sales": 20} ]
        En: [ {"field": "month", "Jan": "Jan", "Feb": "Feb"}, {"field": "sales", "Jan": 10, "Feb": 20}]
        """
        if not rows:
            return []

        result = {}
        for idx, row in enumerate(rows):
            col_key = f"row_{idx+1}"
            for key, value in row.items():
                result.setdefault(key, {"field": key})
                result[key][col_key] = value

        return list(result.values())

    @staticmethod
    def pivot_columns_to_rows(rows: list[dict]) -> list[dict]:
        """
        Transpose simple (matrix-like).
        """
        if not rows:
            return []

        keys = rows[0].keys()
        transposed = []

        for key in keys:
            new_row = {"field": key}
            for idx, row in enumerate(rows):
                new_row[f"row_{idx+1}"] = row.get(key)
            transposed.append(new_row)

        return transposed

    @staticmethod
    def execute_dynamic_pivot(table_name: str,rows: list[str],column_dimension: str,metrics: list[str],aggregation: str = "SUM") -> list[dict]:

        if not rows:
            raise ValueError("At least one row dimension required")

        if not metrics:
            raise ValueError("At least one metric required")

        agg = aggregation.upper()

        if agg not in ALLOWED_AGGREGATIONS:
            raise ValueError("Invalid aggregation")

        # 🔐 sanitize identifiers
        table_name = ChartValidator.sanitize_identifier(table_name)
        column_dimension = ChartValidator.sanitize_identifier(column_dimension)

        rows = [ChartValidator.sanitize_identifier(c) for c in rows]
        metrics = [ChartValidator.sanitize_identifier(c) for c in metrics]

        # 🔐 verify columns exist
        ChartValidator.validate_columns_exist(
            table_name,
            rows + [column_dimension] + metrics
        )

        # 1️⃣ find pivot values
        distinct_sql = text(f"""
            SELECT DISTINCT {column_dimension}
            FROM {table_name}
            ORDER BY {column_dimension}
            LIMIT :limit
        """)

        distinct_values = [
            r[0]
            for r in db.session.execute(
                distinct_sql,
                {"limit": MAX_PIVOT_COLUMNS}
            )
        ]

        if not distinct_values:
            return []

        if len(distinct_values) >= MAX_PIVOT_COLUMNS:
            raise ValueError("Too many pivot columns")

        # 2️⃣ build pivot expressions
        pivot_expressions = []

        for v_index, value in enumerate(distinct_values):
            param_name = f"val_{v_index}"

            for metric in metrics:
                alias = SQLValueParser.quote_identifier(f"{value}_{metric}")
                filter_clause = f"FILTER (WHERE {column_dimension} = :{param_name})"

                if agg == "DISTINCT":
                    expr = f"COUNT(DISTINCT {metric}) {filter_clause} AS {alias}"

                elif agg == "COUNT":
                    expr = f"COUNT({metric}) {filter_clause} AS {alias}"

                else:
                    expr = f"{agg}({metric}) {filter_clause} AS {alias}"

                pivot_expressions.append(expr)

        # 3️⃣ build SQL
        group_by = ", ".join(rows)

        sql = f"""
            SELECT
                {group_by},
                {", ".join(pivot_expressions)}
            FROM {table_name}
            GROUP BY {group_by}
            ORDER BY {group_by}
            LIMIT :limit
        """

        # 4️⃣ params
        params = {f"val_{i}": v for i, v in enumerate(distinct_values)}
        params["limit"] = CHART_MAX_ROWS

        # 5️⃣ execute
        result = db.session.execute(text(sql), params)
        rows = [dict(r) for r in result.mappings()]

        return rows

    @staticmethod
    def single_execute_dynamic_pivot(table_name: str,row_dimension: str,column_dimension: str,metric: str,aggregation: str = "SUM") -> list[dict]:

        agg = aggregation.upper()
        if agg not in ALLOWED_AGGREGATIONS:
            raise ValueError("Invalid aggregation")

        # 🔐 Sécuriser noms
        # table_name = SQLValueParser.quote_identifier(table_name)

        table_name = ChartValidator.sanitize_identifier(table_name)
        row_dimension = ChartValidator.sanitize_identifier(row_dimension)
        column_dimension = ChartValidator.sanitize_identifier(column_dimension)
        metric = ChartValidator.sanitize_identifier(metric)

        # 🔐 Vérifier colonnes existantes
        ChartValidator.validate_columns_exist(table_name,[row_dimension, column_dimension, metric])

        distinct_sql = text(f"""
            SELECT DISTINCT {column_dimension}
            FROM {table_name}
            ORDER BY {column_dimension}
            LIMIT :limit
        """)

        distinct_values = [r[0] for r in db.session.execute(distinct_sql, {"limit": MAX_PIVOT_COLUMNS})]

        if not distinct_values:
            return []

        if len(distinct_values) >= MAX_PIVOT_COLUMNS:
            raise ValueError("Too many pivot columns")

        # 2️⃣ Build pivot columns (PostgreSQL optimized)
        pivot_cols = []

        for idx, _ in enumerate(distinct_values):
            alias = SQLValueParser.quote_identifier(f"col_{idx}")
            param_name = f"val_{idx}"
            filter_clause = f"FILTER (WHERE {column_dimension} = :{param_name})"

            if agg == "DISTINCT":
                expr = f"COUNT(DISTINCT {metric}) {filter_clause} AS {alias}"

            elif agg == "COUNT":
                expr = f"COUNT({metric}) {filter_clause} AS {alias}"

            else:
                expr = f"{agg}({metric}) {filter_clause} AS {alias}"

            pivot_cols.append(f'{expr} AS "col_{idx}"')

        # Build SQL
        pivot_sql = f"""
            SELECT
                {row_dimension},
                {", ".join(pivot_cols)}
            FROM {table_name}
            GROUP BY {row_dimension}
            ORDER BY {row_dimension}
            LIMIT :limit
        """

        # Build bind params
        params = {f"val_{i}": v for i, v in enumerate(distinct_values)}
        params["limit"] = CHART_MAX_ROWS

        result = db.session.execute(text(pivot_sql), params)
        rows = [dict(r) for r in result.mappings()]

        return rows


    def validate(self, q: ChartStructureSchema):

        if not isinstance(q.rows_dimensions, list):
            raise QueryValidationError("rows must be list")

        if not isinstance(q.cols_dimensions, list):
            raise QueryValidationError("columns must be list")

        if not isinstance(q.metrics, list):
            raise QueryValidationError("metrics must be list")

        if not isinstance(q.filters, list):
            raise QueryValidationError("filters must be list")

        if len(q.rows_dimensions) > self.MAX_ROWS:
            raise QueryValidationError("Too many rows")

        if len(q.cols_dimensions) > self.MAX_COLUMNS:
            raise QueryValidationError("Too many columns")

        if len(q.metrics) > self.MAX_METRICS:
            raise QueryValidationError("Too many metrics")

        if len(q.filters) > self.MAX_FILTERS:
            raise QueryValidationError("Too many filters")

        for d in q.rows_dimensions + q.cols_dimensions:
            if not self.schema.is_dimension(d.field):
                raise QueryValidationError(f"Invalid dimension: {d.field}")

        for m in q.metrics:
            if not self.schema.is_metric(m.field):
                raise QueryValidationError(f"Invalid metric: {m.field}")

        for f in q.filters:
            if not self.schema.is_valid_field(f.field):
                raise QueryValidationError(f"Invalid filter field: {f.field}")

        if q.limit is not None:
            if not isinstance(q.limit, int) or q.limit <= 0:
                raise QueryValidationError("limit must be positive integer")
            if q.limit > self.MAX_LIMIT:
                raise QueryValidationError("limit too large")

        if q.offset is not None:
            if not isinstance(q.offset, int) or q.offset < 0:
                raise QueryValidationError("offset must be >= 0")

        for ob in q.order_by:
            if not self.schema.is_valid_field(ob.field):
                raise QueryValidationError(f"Invalid order_by field: {ob.field}")

# SQL BUILDER
class ChartSQLBuilder:

    # @staticmethod
    # def is_already_aggregated(field_name: str) -> bool:
    #     return field_name.lower().startswith(
    #         ("sum_", "avg_", "min_", "max_", "count_")
    #     )

    @staticmethod
    def build_aggregation(field_name, data_type, aggregation):
        allowed = AGGREGATE_BY_SQL_TYPE.get(data_type, ["count"]) or ["count"]

        aggregation = (aggregation or "").lower()

        if aggregation not in allowed:
            raise ValueError(f"{aggregation} not allowed for {data_type}")

        # # ❌ éviter double aggregation
        # if ChartSQLBuilder.is_already_aggregated(field_name):
        #     return f'"{field_name}"'

        if aggregation == "count":
            return f'COUNT("{field_name}")'

        if aggregation in ["min", "max"]:
            return f'{aggregation.upper()}("{field_name}")'

        if aggregation in ["sum", "avg"]:
            return f'{aggregation.upper()}("{field_name}")'

        raise ValueError(f"Unsupported aggregation: {aggregation}")

    @staticmethod
    def build_select(chart: DatasetChart, fieldsMap: dict[int, Any]):

        structure = chart.structure
        select_parts = []
        group_by = []

        dimensions = (structure.rows_dimensions or []) + (structure.cols_dimensions or [])
        metrics = structure.metrics or []

        # DIMENSIONS
        for d in dimensions:
            field = fieldsMap.get(d.field_id)
            if not field:
                continue

            field_name_raw = field["field_name"]
            field_name = SQLValueParser.quote_identifier(field_name_raw)
            alias = SQLValueParser.quote_identifier(field["alias"] or field_name_raw)

            select_parts.append(f'{field_name} AS {alias}')

            if metrics:
                group_by.append(field_name)

        # METRICS
        for m in metrics:
            field = fieldsMap.get(m.field_id)
            if not field:
                continue

            field_name_raw = field["field_name"]
            data_type = field.get("data_type")

            field_name = SQLValueParser.quote_identifier(field_name_raw)

            alias_raw = field["alias"] or f"{m.aggregation}_{field_name_raw}"
            alias = SQLValueParser.quote_identifier(alias_raw)

            agg = (m.aggregation or "").lower()


            # ✅ NONE (pas d'aggregation)
            if not m.aggregation or agg == "none" or agg == "None":
                expr = field_name

            # ✅ DISTINCT (cas spécial)
            elif agg == "distinct":
                expr = f'COUNT(DISTINCT {field_name})'

            else:
                # ✅ SAFE aggregation
                expr = ChartSQLBuilder.build_aggregation(field_name_raw,data_type,agg)


            # ✅ COALESCE uniquement pour numérique
            if agg in ["sum", "avg", "count", "min", "max"]:
                # 1. déterminer le type FINAL
                result_type = AGGREGATE_RETURN_TYPE.get(agg) or data_type
                
                sql_type = (result_type or "").lower()

                cast_type = TYPE_CAST_MAP.get(sql_type)
                default_value = DEFAULT_VALUES.get(sql_type)

                if not cast_type or default_value is None:
                    raise ValueError(f"Unsupported sql_type: {sql_type}")

                expr = f"COALESCE({expr}, {default_value}::{cast_type})"

            select_parts.append(f"{expr} AS {alias}")

        return select_parts, group_by

    # @staticmethod
    # def build_aggregation(field_name, data_type, aggregation):
    #     allowed = AGGREGATE_BY_SQL_TYPE.get(data_type, ["count"])

    #     if aggregation not in allowed:
    #         raise ValueError(f"{aggregation} not allowed for {data_type}")

    #     if aggregation == "count":
    #         return f'COUNT("{field_name}")'

    #     if aggregation in ["min", "max"]:
    #         return f'{aggregation.upper()}("{field_name}")'

    #     if aggregation in ["sum", "avg"]:
    #         return f'{aggregation.upper()}("{field_name}")'

    #     return None

    # @staticmethod
    # def build_select(chart: DatasetChart, fieldsMap: dict[int, Any]):

    #     structure = chart.structure
    #     select_parts = []
    #     group_by = []

    #     dimensions = (structure.rows_dimensions or []) + (structure.cols_dimensions or [])
    #     metrics = structure.metrics or []

    #     # DIMENSIONS
    #     for d in dimensions:
    #         field = fieldsMap.get(d.field_id)
    #         if not field:
    #             raise ValueError(f"Invalid dimension field: {d.field_id}")
    #         field_name = SQLValueParser.quote_identifier(field["field_name"])
    #         alias = SQLValueParser.quote_identifier(field["alias"] or field_name)
    #         select_parts.append(f'{field_name} AS {alias}')
    #         if metrics:
    #             group_by.append(field_name)

    #     # METRICS
    #     for m in metrics:
    #         field = fieldsMap.get(m.field_id)
    #         if not field:
    #             raise ValueError(f"Invalid metric field: {m.field_id}")

    #         agg = m.aggregation.upper()

    #         field_name = SQLValueParser.quote_identifier(field["field_name"])

    #         alias = SQLValueParser.quote_identifier(field["alias"] or f"{agg.lower()}_{field_name}")

    #         if agg == "DISTINCT":
    #             expr = f'COUNT(DISTINCT {field_name}) AS {alias}'

    #         elif agg in ALLOWED_AGGREGATIONS:
    #             expr = f'COALESCE({agg}({field_name}),0) AS {alias}'

    #         elif agg == "NONE":
    #             expr = f'COALESCE({field_name},0) AS {alias}'

    #         else:
    #             # expr = f'COALESCE({field_name},0) AS {alias}'
    #             raise ValueError(f"Unsupported aggregation: {agg}")

    #         select_parts.append(expr)

    #     return select_parts, group_by


    @staticmethod
    def build_filters(structure: ChartStructureSchema, fieldsMap: dict[int, Any]):
        where_parts = []
        having_parts = []
        order_by = []
        values = {}
        counter = count()

        def next_key() -> str:
            return f"p_{next(counter)}"

        
        for i, f in enumerate(structure.filters):
            brutValue = f.value
            brutValue2 = f.value2
            operator = (f.operator or '').upper()
            field = fieldsMap.get(f.field_id)

            if not field:
                raise ValueError(f"Invalid dimension field: {f.field_id}")
            if (not field["field_type"]):
                raise ValueError(f"Field type missing for {f.field_id}")
            if (operator not in FULL_OPERATORS):
                raise ValueError(f"Opérateur non autorisé: {operator}")
            
            target = having_parts if f.field_type in {"metric", "calculated_metric"} else where_parts
            
            data_type = field["data_type"]
            field_type = field["field_type"]
            field_name = SQLValueParser.quote_identifier(field["field_name"])

            SQLValueParser.assert_operator_compatibility(operator,data_type,brutValue,brutValue2)

            # BETWEEN
            if operator == "BETWEEN" or operator == "NOT BETWEEN":
                if not brutValue or not brutValue2:
                    raise ValueError(f"BETWEEN requires two values")
                k1 = next_key()
                k2 = next_key()
                values[k1] = SQLValueParser.parse_value(brutValue, data_type)
                values[k2] = SQLValueParser.parse_value(brutValue2, data_type)
                clause = f"{field_name} {operator} :{k1} AND :{k2}"
                target.append(clause)

            # IN / NOT IN
            elif operator == "IN" or operator == "NOT IN":
                arr = brutValue if isinstance(brutValue,list) else [brutValue]
                if (len(arr) == 0):
                    raise ValueError("IN operator requires at least one value")

                useSqlInClause = bool(f.useSqlInClause or False)
                
                if useSqlInClause:
                    # Cas classique: col IN (:p_0, :p_1, ...)
                    keys = []
                    for j, v in enumerate(arr):
                        k = next_key()
                        values[k] = SQLValueParser.parse_value(v, data_type)
                        keys.append(f':{k}')
                    target.append(f"{field_name} {operator} ({','.join(keys)})")
                else:
                    # Cas ANY: col = ANY(:p_array) → PostgreSQL ARRAY
                    k = next_key()
                    # IMPORTANT : on génère ARRAY[:p_array] pour Postgres
                    if operator == "NOT IN":
                        clause = f"NOT ({field_name} = ANY(:{k}))"
                    else:
                        clause = f"{field_name} = ANY(:{k})"

                    target.append(clause)
                    # convertit toutes les valeurs au format SQLValueParser
                    values[k] = [SQLValueParser.parse_value(v, data_type) for v in arr]


            # OPERATORS WITHOUT VALUE
            elif operator in NO_VALUE_OPERATORS:
                target.append(f"{field_name} {operator}")

            # # NULL / TRUE / FALSE | NORMAL OPERATOR
            else:
                formatted = SQLValueParser.format_sql_value(brutValue, data_type)
                if (str(formatted) in ["NULL", "TRUE", "FALSE"]):
                    clause = f"{field_name} {operator} {str(formatted)}"
                else:
                    k = next_key()
                    values[k] = SQLValueParser.parse_value(brutValue, data_type)
                    clause = f"{field_name} {operator} :{k}"
                target.append(clause)

        # ORDER BY
        for ob in structure.order_by or []:
            field = fieldsMap.get(ob.field_id)
            if not field:
                raise ValueError(f"Invalid dimension field: {f.field_id}")
            field_name = SQLValueParser.quote_identifier(field["field_name"])
            
            direction = "ASC" if ob.direction.upper() == "ASC" else "DESC"
            order_by.append(f"{field_name} {direction}")

        limit = min(structure.limit or CHART_MAX_ROWS, CHART_MAX_ROWS)
        offset = max(structure.offset or 0, 0)
        
        return where_parts, having_parts, order_by, limit, offset, values

# EXECUTOR
class ChartExecutor:

    @staticmethod
    def generate_chart_sql(table_name: str, chart: DatasetChart, fieldsMap:dict[int, Any]):

        select_parts, group_by = ChartSQLBuilder.build_select(chart, fieldsMap)

        where_parts, having_parts, order_by, limit, offset, params = ChartSQLBuilder.build_filters(chart.structure, fieldsMap)

        sql = ["SELECT", ", ".join(select_parts), "FROM", table_name]

        if where_parts:
            sql += ["WHERE", " AND ".join(where_parts)]

        if group_by:
            sql += ["GROUP BY", ", ".join(group_by)]

        if having_parts:
            sql += ["HAVING", " AND ".join(having_parts)]

        if order_by:
            sql += ["ORDER BY", ",".join(order_by)]

        sql += ["LIMIT :limit OFFSET :offset"]

        params["limit"] = limit
        params["offset"] = offset

        return " ".join(sql), params

# FACTORY (payload -> chart)
class ChartFactory:

    @staticmethod
    def from_payload(payload: Dict,query: DatasetQuery):

        structure = payload.get("structure", {})
        rows_dimensions = [
            {"field_id": d.get("field_id"),"alias": d.get("alias")}
            for d in structure.get("rows_dimensions", []) or []
        ]
        cols_dimensions = [
            {"field_id": d.get("field_id"),"alias": d.get("alias")}
            for d in structure.get("cols_dimensions", []) or []
        ]
        metrics_list = [
            {"field_id": d.get("field_id"),"alias": d.get("alias"),"aggregation": d.get("aggregation")}
            for d in structure.get("metrics", []) or []
        ]
                                                        
        rows = [ChartDimension(**d) for d in rows_dimensions]
        cols = [ChartDimension(**d) for d in cols_dimensions]
        metrics = [ChartMetric(**m) for m in metrics_list]
        filters = [ChartFilter(**f) for f in structure.get("filters", [])]
        order_by = [ChartOrderby(**o) for o in structure.get("order_by", [])]
        limit = int(structure["limit"]) if structure.get("limit", None) else None
        offset = int(structure["offset"]) if structure.get("offset", None) else None
        pivot = ChartPivotOptions(**structure["pivot"]) if structure.get("pivot", None) else None

        chart_structure = ChartStructureSchema(
            rows_dimensions=rows,
            cols_dimensions=cols,
            metrics=metrics,
            filters=filters,
            order_by=order_by,
            limit=limit,
            offset=offset,
            pivot=pivot
        )

        return DatasetChart(
            id=payload.get("id"),
            name=payload.get("name", f"Chart {query.name}"),
            description=payload.get("description"),
            tenant_id=payload.get("tenant_id"),
            dataset_id=payload.get("dataset_id"),
            query_id=payload.get("query_id"),
            type=payload.get("type", "table"),
            structure=chart_structure,
            options=payload.get("options", {}),
            is_active=payload.get("is_active", True)
        )
  
# CHART TRANSFORMER
class ChartTransformer:
    @staticmethod
    def transform(chart_type: str, rows: List[Dict], chart: DatasetChart, fieldsMap:dict[int, Any]):

        structure = chart.structure
        dims = structure.rows_dimensions + structure.cols_dimensions
        metrics = structure.metrics

        # Retour brut si type table ou chart standard
        standard_charts = {"table", "bar", "line", "area", "stacked-bar", "stacked-area", "radar", "heatmap", "gauge"}
        if chart_type in standard_charts:
            # Table ou charts multi-dimensions: retourne rows tel quel
            return rows

        # Pie / Donut chart
        if chart_type in {"pie", "donut"}:
            if not dims or not metrics:
                return []
            dim = dims[0]
            metric = metrics[0]
            dim_alias = dim.alias or dim.field_id
            agg = metric.aggregation.upper()
            metric_alias = dim.alias or f"{agg.lower()}_{metric.field_id}"
            return [
                { "name": str(r.get(dim_alias)), "value": float(r.get(metric_alias) or 0) }
                for r in rows
            ]

        if chart_type == "kpi":
            if not metrics:
                return []
            metric = metrics[0]
            agg = metric.aggregation.upper()
            metric_alias = metric.alias or f"{agg.lower()}_{metric.field_id}"
            total_value = sum(
                float(r.get(metric_alias) or 0)
                for r in rows
                if isinstance(r.get(metric_alias), (int, float))
            )
            return [{"name": metric.field, "value": total_value}]

        # GAUGE
        if chart_type == "gauge":
            if not metrics:
                return []
            metric = metrics[0]
            agg = metric.aggregation.upper()
            metric_alias = metric.alias or f"{agg.lower()}_{metric.field_id}"
            value = float(rows[0].get(metric_alias) or 0) if rows else 0
            return {"value": value, "metric": metric.field}

        # RADAR
        if chart_type == "radar":
            if not dims or not metrics:
                return []
            radar_data = []
            for m in metrics:
                agg = m.aggregation.upper()
                metric_alias = m.alias or f"{agg.lower()}_{m.field_id}"
                radar_data.append({
                    "metric": m.field_id,
                    "values": [float(r.get(metric_alias) or 0) for r in rows]
                })
            return radar_data

        # HEATMAP
        if chart_type == "heatmap":
            if len(dims) < 2 or not metrics:
                return []
            dim_x = dims[0]
            dim_y = dims[1]
            metric = metrics[0]
            agg = metric.aggregation.upper()
            metric_alias = metric.alias or f"{agg.lower()}_{metric.field_id}"
            return [
                {
                    "x": r.get(dim_x.alias or dim_x.field),
                    "y": r.get(dim_y.alias or dim_y.field),
                    "value": float(r.get(metric_alias) or 0)
                }
                for r in rows
            ]

        # Fallback général
        return rows

    @staticmethod
    def bar_chart(pivot):

        rows = pivot["rows"]
        metrics = pivot["header"]["metrics"]

        labels = []
        datasets = {}

        for r in rows:
            labels.append(r[pivot["header"]["rows"][0]])

            for k,v in r.items():
                if SEPARATOR in k:
                    year, metric = k.split(SEPARATOR,1)
                    if year not in datasets:
                        datasets[year] = []

                    datasets[year].append(v)

        return {
            "labels":labels,
            "datasets":[
                {"label":k,"data":v} 
                for k,v in datasets.items()
            ]
        }
  
class ChartPivotEngine:
    def __init__(
        self, 
        rows:List[str], # Liste des noms de colonnes qui vont devenir les dimensions lignes du pivot.
        columns:List[str], # Liste des noms de colonnes qui vont devenir les dimensions colonnes du pivot. 
        metric_map:Dict[str, str], # Dictionnaire {metric_name: aggregation} où aggregation peut être "SUM", "COUNT", "AVG", "MIN", "MAX".
        fill_value:Any|int|float=0, # Valeur utilisée pour remplir les cellules manquantes. Default = 0.
        
        # Indique si le pivot doit calculer les totaux finaux. Default = True.
        rows_total=True, 
        cols_total=True,

        # Indique si le pivot doit calculer les subtotaux par niveau. Default = True.
        rows_subtotal=True, 
        cols_subtotal=True,
        percent_metrics:Optional[List[str]]=None, # Liste des noms de métriques pour lesquelles calculer un pourcentage du total. Default = None.
        top_n:Optional[int]=None, # Si défini, limite les lignes du pivot aux top_n selon sort_metric.
        sort_metric:Optional[str]=None, # Nom de la métrique utilisée pour trier si top_n est défini.
        sort_desc:bool=True # Si True, trie top_n par ordre décroissant. Default = True.
    ):
        self.rows = rows or []
        self.columns = columns or []
        self.metric_map = metric_map or {}
        self.fill_value = fill_value
        self.rows_total = rows_total
        self.cols_total = cols_total
        self.rows_subtotal = rows_subtotal
        self.cols_subtotal = cols_subtotal
        self.percent_metrics = percent_metrics or []
        self.top_n = top_n
        self.sort_metric = sort_metric
        self.sort_desc = sort_desc
        self._all_columns_order = []

    # Helpers metrics
    def _init_metric(self, agg):
        if agg in ("SUM", "COUNT"): 
            return 0
        if agg == "DISTINCT":
            return set()
        if agg in ("MIN", "MAX"): 
            return None
        if agg == "AVG": 
            return [0,0]
        raise ValueError(f"Unsupported aggregation {agg}")

    def _apply(self, current, value, agg):
        if agg=="COUNT": 
            return current + 1
        
        if agg == "DISTINCT":
            if value is not None:
                current.add(value)
            return current
        
        if value is None: 
            return current
        
        if agg=="SUM": 
            return current + value
        
        if agg=="MIN": 
            return value if current is None else min(current,value)
        
        if agg=="MAX": 
            return value if current is None else max(current,value)
        
        if agg=="AVG":
            current[0]+=value; 
            current[1]+=1; 
            return current
        
        return current

    def _finalize(self, value, agg):
        if agg=="AVG":
            s, c = value
            return s / c if c else self.fill_value

        if agg == "DISTINCT":
            return len(value)
        
        if value is None: 
            return self.fill_value
        
        return value

    def _aggregate(self, data):

        table = defaultdict(dict)
        columns = self.columns or []
        rows = self.rows or []

        # stocker valeurs uniques de chaque dimension colonne
        column_levels = {c: set() for c in columns}

        # 1️⃣ aggregation
        for r in data:
            row_key = tuple(r.get(d) for d in rows)
            col_key = tuple(r.get(c) for c in columns)

            # stocker les valeurs distinctes par colonne
            for i, c in enumerate(columns):
                column_levels[c].add(col_key[i])

            metric_map = self.metric_map or {}

            if col_key not in table[row_key]:
                table[row_key][col_key] = {
                    m: self._init_metric(metric_map[m])
                    for m in self.metric_map
                }

            cell = table[row_key][col_key]
            
            for metric, agg in metric_map.items():
                value = r.get(metric)
                cell[metric] = self._apply(cell[metric], value, agg)

        # 2️⃣ produit cartésien des colonnes
        ordered_levels:list[str] = []
        column_maps = {}
        column_label_maps = {}

        for ix, c in enumerate(columns):
            # values = sorted(column_levels[c])   # tri des valeurs
            values = sorted(column_levels[c], key=lambda x: (x is None, x))
            ordered_levels.append(values)
            column_maps[c] = values
            column_label_maps[ix] = c

        # produit cartésien
        column_values = list(product(*ordered_levels)) if ordered_levels else []

        return table, column_values, column_maps, column_label_maps

    # PERCENT METRICS
    def _compute_percent_metrics(self, rows_out):
        for metric in self.percent_metrics or []:
            total = sum(
                r.get(metric, self.fill_value or 0)
                for r in rows_out
                if isinstance(r.get(metric), (int, float))
                and r.get(metric) not in ("TOTALS", "SUBTOTALS")
            )

            if total == 0:
                continue

            for r in rows_out:
                val = r.get(metric)
                if isinstance(val, (int, float)):
                    r[SEPARATOR.join([metric,"pct"])] = val / total

        return rows_out

    def group_consecutive(self, row: List[Union[str, int]]) -> List[Cell]:
        """Regroupe les valeurs consécutives identiques dans des listes."""
        if not row:
            return []

        grouped_row: List[Cell] = []
        current_group: List[Union[str, int]] = [row[0]]

        for val in row[1:]:
            if val == current_group[-1]:
                current_group.append(val)
            else:
                # Si le groupe a plus d’un élément, on le met dans une liste
                grouped_row.append(current_group if len(current_group) > 1 else current_group[0])
                current_group = [val]

        # Ajouter le dernier groupe
        grouped_row.append(current_group if len(current_group) > 1 else current_group[0])

        return grouped_row

    def group_header_rows(self, header_rows: List[List[Union[str, int]]]) -> List[List[Cell]]:
        """Applique le regroupement dynamique à chaque ligne du header."""
        return [self.group_consecutive(row) for row in header_rows]

    def _build_data(self, table, column_values):

        row_keys = sorted((table or {}).keys())
        metric_list = list((self.metric_map or {}).keys())
        
        rows_out = []

        for rk in row_keys:
            row = {dim: rk[i] for i, dim in enumerate(self.rows or [])}
            row_total = 0

            for ck in column_values:
                group_total = 0

                # for metric, agg in self.metric_map.items():
                for metric in metric_list:
                    agg = self.metric_map[metric]

                    col = SEPARATOR.join([str(v) for v in ck] + [metric]) if ck else metric
                    val = self._finalize(table[rk][ck][metric], agg) if ck in table[rk] else self.fill_value

                    row[col] = val
                    if isinstance(val, (int, float)):
                        group_total += val

                if self.cols_subtotal:
                    # subtotal_col = SEPARATOR.join(["SUBTOTALS", SEPARATOR.join(map(str, ck)), SEPARATOR.join(metric_list)])
                    subtotal_col = SEPARATOR.join(["SUBTOTALS", SEPARATOR.join(map(str, ck))])
                    row[subtotal_col] = group_total

                row_total += group_total

            if self.cols_total:
                row[SEPARATOR.join(["TOTAL", SEPARATOR.join(metric_list)])] = row_total

            rows_out.append(row)

        return rows_out, metric_list

    def _build_header(self, column_values):
        metric_list = list((self.metric_map or {}).keys())
        metrics = metric_list if metric_list else [None]
        column_levels = len(self.columns or [])
        metric_level = 1 if metric_list else 0
        total_levels = column_levels + metric_level
        header_rows = [[] for _ in range(total_levels)]
        all_cols = []

        # # --- PARTIE DIMENSIONS (rowDims) ---
        # # On met les noms des dimensions uniquement dans la première ligne
        # if hasattr(self, "rows") and self.rows:
        #     for lvl in range(total_levels):
        #         if lvl == 0:
        #             # première ligne : afficher le nom des dimensions
        #             header_rows[lvl].extend(self.rows)
        #         else:
        #             # autres lignes : compléter avec des vides pour alignement
        #             header_rows[lvl].extend([""] * len(self.rows))

        # # --- PARTIE DIMENSIONS (rowDims) ---
        # # On met les noms des dimensions uniquement dans la première ligne
        # if hasattr(self, "rows") and self.rows:
        #     for i, dim_name in enumerate(self.rows):
        #         header_rows[0].append(dim_name)
        #     # remplir les autres niveaux avec des vides pour alignement
        #     for lvl in range(1, total_levels):
        #         header_rows[lvl].extend([""] * len(self.rows))

        # --- Colonnes pivot et SUBTOTAL ---
        for ck in column_values:
            ck = ck if isinstance(ck, tuple) else (ck,)

            base_col_name = SEPARATOR.join(map(str, ck))   # IMPORTANT : base séparée
            for metric in metrics:
                # Construire header_rows avec groupes
                for lvl in range(total_levels):
                    if lvl < column_levels:
                        value = ck[lvl] if lvl < len(ck) else ""
                        # value = list(ck) if lvl == 0 else ck[lvl] if lvl < len(ck) else ""
                    else:
                        value = metric
                    header_rows[lvl].append(value)

                # construire le nom de colonne propre
                col_name = base_col_name
                if metric:
                    col_name = SEPARATOR.join([base_col_name, metric])

                all_cols.append(col_name)

            # SUBTOTAL colonne
            if getattr(self, "cols_subtotal", False):
                for lvl in range(total_levels):
                    if lvl == total_levels - 1:
                        header_rows[lvl].append("SUBTOTALS")
                    else:
                        header_rows[lvl].append("SUBTOTALS")

                all_cols.append(SEPARATOR.join(["SUBTOTALS", base_col_name]))

        # TOTAL global
        if getattr(self, "cols_total", False):
            for lvl in range(total_levels):
                if lvl == total_levels - 1:
                    header_rows[lvl].append("TOTALS")
                else:
                    header_rows[lvl].append("TOTALS")

            all_cols.append(SEPARATOR.join(["TOTALS", SEPARATOR.join(metrics)]))

        self._all_columns_order = all_cols

        header_rows = self.group_header_rows(header_rows)

        return header_rows
   
    def _sort_columns(self, column_values):
        def normalize(v):
            if not isinstance(v, tuple):
                v = (v,)
            out = []
            for x in v:
                try:
                    out.append((0, int(x)))
                except (ValueError, TypeError):
                    out.append((1, str(x)))
            return tuple(out)

        return sorted(column_values, key=normalize)

    def _build_subtotal_row(self, prev_key, subtotal):
        row = {}
        for i, dim in enumerate(self.rows or []):
            if i < len(prev_key):
                row[dim] = prev_key[i]
            else:
                row[dim] = "SUBTOTALS"
        # for k, v in subtotal.items(): row[k] = v
        row.update(subtotal)
        return row
    
    # ROW SUBTOTALS
    def _build_rows_subtotals(self, rows_out):
        if not self.rows_subtotal or len(self.rows or []) <= 1:
            return rows_out

        result = []
        prev_key = None
        subtotal = defaultdict(float)

        for row in rows_out:
            current_key = tuple(row[d] for d in self.rows[:-1])

            if prev_key and current_key != prev_key:
                subtotal_row = self._build_subtotal_row(prev_key, subtotal)
                result.append(subtotal_row)
                subtotal = defaultdict(float)

            for k, v in row.items():
                if k not in self.rows and isinstance(v, (int, float)):
                    subtotal[k] += v

            result.append(row)
            prev_key = current_key

        if subtotal:
            subtotal_row = self._build_subtotal_row(prev_key, subtotal)
            result.append(subtotal_row)

        return result

    def _build_rows_total(self, rows_out):
        if not self.rows_total or len(self.rows or []) <= 1:
            return rows_out

        total_row = {d: "TOTALS" for d in self.rows or []}
        for row in rows_out:
            if row.get(self.rows[-1]) in ("SUBTOTALS", "TOTALS"):
                continue
            for k, v in row.items():
                if k not in self.rows and isinstance(v, (int, float)):
                    total_row[k] = total_row.get(k, 0) + v
        rows_out.append(total_row)

        return rows_out
    
    # TRI ASC DES COLONNES
    def sort_key(self, v):
        v = v if isinstance(v, tuple) else (v,)
        return tuple(int(x) if str(x).isdigit() else x for x in v)

    def pivot(self, data):
        table, column_values, column_maps, column_label_maps = self._aggregate(data)

        # column_values = [cv if isinstance(cv, tuple) else (cv,) for cv in column_values]
        # column_values.sort(key=lambda v: tuple((0, int(x)) if str(x).isdigit() else (1, str(x)) for x in (v if isinstance(v, tuple) else (v,))))
        # column_values = sorted(column_values)
        # column_values = sorted(column_values, key=self.sort_key)
        rows_out, metric_list = self._build_data(table, column_values)
        rows_out = self._build_rows_subtotals(rows_out)
        rows_out = self._build_rows_total(rows_out)
        rows_out = self._compute_percent_metrics(rows_out)

        header_rows = self._build_header(column_values)

        return {
            "header": {
                "header_rows": header_rows,
                "rows": self.rows or [],
                "columns": column_values,
                "column_maps": column_maps,
                "column_label_maps": column_label_maps,
                "metrics": metric_list,
                "_all_columns_order": self._all_columns_order
            },
            "rows": rows_out
        }

class PivotAggregator:

    @staticmethod
    def aggregate(data: List[Dict[str, Any]], dims: List[str], metrics: Dict[str, str]):

        grouped = defaultdict(lambda: defaultdict(list))

        for row in data:
            key = tuple(row[d] for d in dims)
            for m in metrics:
                grouped[key][m].append(row.get(m))

        results = []
        for key, values in grouped.items():

            record = {}
            for i, d in enumerate(dims):
                record[d] = key[i]

            for metric, agg in metrics.items():
                vals = [v for v in values[metric] if v is not None]
                if not vals: 
                    record[metric] = None

                elif agg == "SUM": 
                    record[metric] = sum(vals)

                elif agg == "COUNT": 
                    record[metric] = len(vals)

                elif agg == "DISTINCT": 
                    record[metric] = len(set(vals))

                elif agg == "AVG": 
                    record[metric] = sum(vals) / len(vals)

                elif agg == "MIN": 
                    record[metric] = min(vals)

                elif agg == "MAX": 
                    record[metric] = max(vals)

                else: raise ValueError("Unsupported aggregation")

            results.append(record)
        return results
