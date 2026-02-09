import sqlparse
from typing import Any, Dict, Optional, List

from sqlalchemy import text
from backend.src.security.access_security import require_auth
from backend.src.config import Config
from typing import Optional, List
from sqlalchemy.exc import SQLAlchemyError
from flask import Blueprint, request, jsonify, g
from backend.src.models.script import Script
from backend.src.databases.extensions import db, isAdmin, isSuperAdmin, serializeContent, get_connection
from backend.src.services.sql_executor import run_sql

from sshtunnel import SSHTunnelForwarder
from backend.src.logger import get_backend_logger, audit_log
from backend.src.utils.connection import get_engine
logger = get_backend_logger(__name__)

bp = Blueprint("sql-builder", __name__, url_prefix="/api/sql-builder")




# Allowed aggregations
ALLOWED_AGGS = {"sum": "SUM", "avg": "AVG", "count": "COUNT", "min": "MIN", "max": "MAX"}

ALLOWED_OPS = {"=", "!=", ">", "<", ">=", "<=", "LIKE", "IN"}


# LISTER TOUS LES SCRIPTS
@bp.get("")
@require_auth


# Validate SQL
def validate_sql(sql: str):
    parsed = sqlparse.parse(sql)
    if not parsed:
        raise ValueError("Empty or invalid SQL")
    if parsed[0].get_type() != 'SELECT':
        raise ValueError("Only SELECT statements are allowed")

# Build Dynamic Query
def build_query(payload: Dict[str, Any]):
    """
    Build SQL query from dynamic payload.
    payload: {
        table: str,
        columns: [str],
        metrics: [{agg: str, column: str, alias: str}],
        filters: [{column:str, op:str, value:any}],
        group_by: [str]
    }
    """
    table = payload.get("table")
    if not table:
        raise ValueError("Table is required")

    
    
    select_parts, params, where_clauses = [], {}, []

    # Columns
    for c in payload.get('columns', []):
        select_parts.append(f'"{c}"')

    # Metrics
    for m in payload.get('metrics', []):
        agg = m['agg']
        col = m['column']
        alias = m.get('alias', f"{agg}_{col}")
        if agg not in ALLOWED_AGGS:
            raise ValueError(f"Aggregation {agg} not allowed")
        select_parts.append(f'{ALLOWED_AGGS[agg]}("{col}") AS "{alias}"')
    
    # Filters
    for f in payload.get('filters', []):
        op = f['op']
        if op not in ALLOWED_OPS:
            raise ValueError("Invalid operator")
        
        col = f['column']
        param_name = f"param_{col}"
        where_clauses.append(f'"{col}" {op} :{param_name}')
        params[param_name] = f['value']
    
    sql = f'SELECT {", ".join(select_parts) or "*"} FROM "{table}"'
    if where_clauses:
        sql += " WHERE " + " AND ".join(where_clauses)

    group_by = payload.get('group_by', [])
    if group_by:
        sql += " GROUP BY " + ", ".join([f'"{g}"' for g in group_by])
    
    return text(sql), params

# Run Query
def run_query(conn: Dict[str, Any], sql: str, params: Optional[Dict[str, Any]] = None, ssh_server: Optional[SSHTunnelForwarder] = None) -> List[Dict[str, Any]]:
    """
    Execute SQL query and return results as list of dicts.
    """
    validate_sql(sql)
    engine = get_engine(conn, ssh_server)
    try:
        with engine.connect() as c:
            result = c.execute(text(sql), params or {})
            return [dict(row._mapping) for row in result]
    except SQLAlchemyError as e:
        raise Exception(f"Query execution failed: {str(e)}")

# # Example usage
# if __name__ == "__main__":
#     # Example connection dictionary
#     conn = {
#         "host": "localhost",
#         "port": 5432,
#         "dbname": "mydb",
#         "username": "postgres",
#         "password": encrypt("mypassword"),
#         "ssh_enabled": False
#     }

#     # Example query
#     payload = {
#         "table": "users",
#         "columns": ["id", "name"],
#         "metrics": [{"agg": "count", "column": "id", "alias": "total_users"}],
#         "filters": [{"column": "age", "op": ">", "value": 18}],
#         "group_by": ["country"]
#     }

#     sql, params = build_query(payload)
#     result = run_query(conn, sql, params)
#     print(result)
