import json
import hashlib
import itertools
from typing import Union
from analytics_engine.constances import MAX_SCAN_ROWS, ROLES, TABLES
from sqlalchemy import and_, bindparam, distinct, func, not_, or_, select
from analytics_engine.models import AggregationRef, ColumnRef, CompilationContext, ConditionRef, QueryDSL, ValueRef


# PUBLIC API
_alias_seq = itertools.count(1)

def alias() -> str:
    """Generate a sequential table alias."""
    return f"t{next(_alias_seq)}"

def guard(condition: bool, message: str):
    """Raise ValueError if condition is False."""
    if not condition:
        raise ValueError(message)

def estimate_cost(dsl: QueryDSL): # COST & SAFETY ENGINE
    """Estimate query row count to prevent expensive queries."""
    rows = TABLES[dsl.source]["row_estimate"]
    for j in getattr(dsl, "joins", []):
        rows *= 1.2
    guard(rows < MAX_SCAN_ROWS, f"Query too expensive (estimated {rows} rows)")

def time_bucket(column, grain):
    """Generate SQL expression for time bucketing."""
    """ Time-series engine: day / week / month / quarter / epi-week """
    mapping = {
        "day": f"DATE({column})",
        "week": f"DATE_TRUNC('week', {column})",
        "month": f"DATE_TRUNC('month', {column})",
        "quarter": f"DATE_TRUNC('quarter', {column})",
        "epi_week": f"EXTRACT(WEEK FROM {column})"
    }
    if grain not in mapping:
        raise ValueError(f"Invalid grain: {grain}")
    return mapping[grain]

def pivot_count(table_col, values, alias_prefix="pivot"):
    """
    Generates COUNT(*) FILTER (WHERE col=value) for pivot values
    """
    return [
        f"COUNT(*) FILTER (WHERE {table_col} = {repr(v)}) AS {alias_prefix}_{v}" 
        for v in values
    ]

def validate_rbac(dsl: QueryDSL, role: str):

    if role not in ROLES:
        raise PermissionError("Invalid role")

    role_rules = ROLES[role]

    def check_table(table: str):
        if "*" in role_rules:
            return
        if table not in role_rules:
            raise PermissionError(f"Access denied to table '{table}'")

    def check_column(table: str, column: str):
        if "*" in role_rules:
            return
        allowed = role_rules.get(table)
        if not allowed or "*" not in allowed and column not in allowed:
            raise PermissionError(f"Access denied to column '{table}.{column}'")

    check_table(dsl.from_table)

    for item in dsl.select:
        if isinstance(item, ColumnRef):
            check_table(item.table)
            check_column(item.table, item.name)
        elif isinstance(item, AggregationRef):
            check_table(item.column.table)
            check_column(item.column.table, item.column.name)

    for join in dsl.joins:
        check_table(join.table)

def validate_permissions(dsl, user_context):
    """
    Vérifie que l'utilisateur a le droit d'exécuter la requête DSL.
    """
    # Placeholder pour logique RBAC
    # Par ex: check user_context.roles et tables/colonnes utilisées
    pass

def compute_fingerprint(dsl: QueryDSL, tenant_id: str) -> str:
    raw = json.dumps(dsl.model_dump(),sort_keys=True)
    return hashlib.sha256(f"{tenant_id}:{raw}".encode()).hexdigest()
    # return hashlib.sha256().encode(raw).hexdigest() + f"_{tenant_id}"



