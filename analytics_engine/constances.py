from typing import Dict
from analytics_engine.models import Column, Metric, Table

# ===============================================================
# CONTEXT (ALIASES + SECURITY)  |  INDICATOR REGISTRY (VERSIONED)
# ===============================================================

TABLE_REGISTRY: Dict[str, "Table"] = {}

ALLOWED_AGGS = {"count", "sum", "avg", "min", "max"}
ALLOWED_AGGREGATIONS = {"SUM", "COUNT", "AVG", "MIN", "MAX"}
ALLOWED_JOINS = {"LEFT", "INNER"}
MAX_SCAN_ROWS = 20_000_000
MAX_LIMIT = 100_000
ROLES = {
    "admin": {"*"},
    "analyst": {"pcimne_data_view", "facility"},
    "viewer": {"pcimne_data_view"}
}
TABLES = {
    "pcimne_data_view": {
        "columns": {"id", "sex", "age_in_years", "has_fever", "consultation_date", "facility_id"},
        "row_estimate": 5_000_000
    },
    "facility": {
        "columns": {"id", "name", "district"},
        "row_estimate": 10_000
    }
}
INDICATORS = {
    "fever_cases": {
        "v1": Metric(
            agg="count",
            column=Column("pcimne_data_view", "id"),
            alias="fever_cases",
            condition="has_fever IS TRUE"
        )
    }
}
AGGREGATIONS = {
    "count": "COUNT",
    "sum": "SUM",
    "avg": "AVG",
    "min": "MIN",
    "max": "MAX",
    "stddev": "STDDEV",
    "variance": "VARIANCE",
    "median": "PERCENTILE_CONT",
    "string_agg": "STRING_AGG",
    "array_agg": "ARRAY_AGG",
    "json_agg": "JSON_AGG",
    "bool_and": "BOOL_AND",
    "bool_or": "BOOL_OR",
}

WINDOW_FUNCTIONS = {
    "row_number": "ROW_NUMBER",
    "rank": "RANK",
    "dense_rank": "DENSE_RANK",
    "lag": "LAG",
    "lead": "LEAD",
    "first_value": "FIRST_VALUE",
    "last_value": "LAST_VALUE",
    "ntile": "NTILE",
}
OPERATORS = {
    "eq": "=",
    "neq": "!=",
    "gt": ">",
    "gte": ">=",
    "lt": "<",
    "lte": "<=",
    "in": "IN",
    "not_in": "NOT IN",
    "like": "LIKE",
    "ilike": "ILIKE",
    "between": "BETWEEN",
    "is_null": "IS NULL",
    "not_null": "IS NOT NULL",
}
