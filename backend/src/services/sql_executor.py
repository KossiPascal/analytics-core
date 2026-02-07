import time
import psycopg2
import psycopg2.extras
from flask import g
from backend.src.models.auth import User
from backend.src.database.extensions import isAdmin, isSuperAdmin
from backend.src.security.sql_guard import validate_sql
from backend.src.security.sql_guard import jsonify_value

from backend.src.logger import get_backend_logger, audit_log

logger = get_backend_logger(__name__)


# ---------------- CONFIG ----------------
MAX_ALLOWED_ROWS = 50000      # sécurité haute
STATEMENT_TIMEOUT_MS = 15_000  # 15s
DEFAULT_NON_ADMIN_MAX_ROWS = 1000  # si non-admin et pas de max_rows fourni


# ------------------ EXECUTION ------------------
def execute_sql(conn,sql_text,max_rows=None,explain:bool=False,read_only:bool=False):
    """
    Execute a SQL and return (result_dict, status_code).
    Uses statement_timeout and, for read_only, sets transaction read-only.
    """
    if not conn:
        return ({"error": "PostgreSQL connection failed"}, 500)

    start_ts = time.time()
    cur = None
    try:
        # We will use a server-side cursor for big selects? for simplicity use normal cursor
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

        # Apply statement timeout for this transaction
        try:
            cur.execute(f"SET LOCAL statement_timeout = {int(STATEMENT_TIMEOUT_MS)};")
        except Exception as e:
            logger.warning("Could not set statement_timeout: %s", e)

        # If read_only requested (for non-admins), set transaction readonly
        if read_only:
            try:
                cur.execute("SET LOCAL TRANSACTION READ ONLY;")
            except Exception as e:
                # If DB doesn't permit, log and continue (we'll still avoid writes via checks)
                logger.warning("Could not set transaction READ ONLY: %s", e)

        # EXPLAIN mode
        if explain:
            cur.execute(f"EXPLAIN ANALYZE {sql_text}")
            rows = [r[0] for r in cur.fetchall()]
            duration = round((time.time() - start_ts) * 1000, 2)
            return ({"explain": rows, "timing_ms": duration}, 200)

        # Execute the actual SQL
        cur.execute(sql_text)

        # If select-like (cursor.description exists)
        columns, data, rowcount = [], [], 0
        if cur.description:
            columns = [desc.name for desc in cur.description]

            # Determine how many rows to fetch safely
            if isinstance(max_rows, int) and max_rows > 0:
                fetch_n = min(max_rows, MAX_ALLOWED_ROWS)
            else:
                # default safety limits: non-admin callers should pass max_rows; caller can set DEFAULT_NON_ADMIN_MAX_ROWS
                fetch_n = DEFAULT_NON_ADMIN_MAX_ROWS

            rows = cur.fetchmany(fetch_n)
            data = [{col: jsonify_value(row[col]) for col in columns} for row in rows]
            rowcount = cur.rowcount if cur.rowcount is not None and cur.rowcount >= 0 else len(data)

        else:
            # DML: commit the transaction effect
            conn.commit()
            rowcount = cur.rowcount
            data = []

        duration = round((time.time() - start_ts) * 1000, 2)
        result = {
            "columns": columns,
            "rows": data,
            "rowcount": rowcount,
            "timing_ms": duration,
            "message": "Query executed successfully",
            # intentionally DON'T echo back full sql in production logs / responses; include on debug only
        }
        return (result, 200)

    except psycopg2.errors.QueryCanceled as e:
        # statement timeout
        try:
            conn.rollback()
        except Exception:
            pass
        return ({"error": "Query timeout", "details": str(e), "timeout_ms": STATEMENT_TIMEOUT_MS}, 408)

    except psycopg2.Error as e:
        try:
            conn.rollback()
        except Exception:
            pass
        # Provide sanitized error to user
        pg_err = getattr(e, "pgerror", None) or str(e)
        return ({"error": "Database error", "details": pg_err}, 400)

    except Exception as e:
        try:
            conn.rollback()
        except Exception:
            pass
        logger.exception("Unexpected error executing SQL")
        return ({"error": "Internal server error", "details": str(e)}, 500)

    finally:
        try:
            if cur:
                cur.close()
        except Exception:
            pass
        # close connection (get_connection might produce a pooled or raw conn; adapt if pooling)
        try:
            conn.close()
        except Exception:
            pass


def extract_user_context(user=None):
    """
    Retourne : user_id, user_role, is_admin, is_superadmin
    Sources supportées : User (SQLAlchemy), dict (JWT / session), g.current_user
    """

    def resolve(obj):
        if isinstance(obj, User):
            obj_id, roles, permissions = str(obj.id), obj.permissions_roles()
        if isinstance(obj, dict):
            obj_id, roles, permissions = obj.get("id"), obj.get("roles"), obj.get("permissions")
        
        if obj_id and permissions:
            return (obj_id,roles, permissions, isAdmin(roles, permissions),isSuperAdmin(roles, permissions),)

        return None

    # 1️⃣ Explicit user passed
    if user is not None:
        resolved = resolve(user)
        if resolved:
            return resolved

    # 2️⃣ Flask global user
    current = getattr(g, "current_user", None)
    resolved = resolve(current)
    if resolved:
        return resolved

    # 3️⃣ Unauthorized
    return None, None, False, False


def run_sql(conn,sql_text,user=None,max_rows=None,explain=False):
    if not sql_text or not isinstance(sql_text, str):
        return ({"error": "A valid SQL string is required"}, 400)
    
    user_id, user_roles, user_permissions, is_admin, is_superadmin = extract_user_context(user)

    if not user_id:
        return ({"error": "Unauthorized"}, 401)

    resp, first_kw, stat = validate_sql(sql_text,is_admin,is_superadmin)

    if stat != 200:
        return (resp,stat)
    
    # Validate max_rows param
    if isinstance(max_rows, str) and max_rows.isdigit():
        max_rows = int(max_rows)
    elif isinstance(max_rows, int) and max_rows > 0:
        max_rows = int(max_rows)
    else:
        max_rows = None

    # safety upper bound
    if max_rows is not None and max_rows > MAX_ALLOWED_ROWS:
        return ({"error": f"max_rows too large (>{MAX_ALLOWED_ROWS})", "hint": "Use pagination"}, 400)

    # For non-admins, enforce read_only and a safe fetch limit
    read_only = not is_admin

    # If non-admin and no max_rows provided, we will use safe default
    if read_only and (max_rows is None):
        max_rows = DEFAULT_NON_ADMIN_MAX_ROWS

    # Execute and return result
    result, status = execute_sql(conn, sql_text, max_rows=max_rows, explain=explain, read_only=read_only)

    # Audit logging (do NOT log full SQL in prod or strip secrets)
    try:
        logger.info(
            "SQL_EXEC user_id=%s role=%s first_kw=%s status=%s rowcount=%s time_ms=%s",
            user_id, first_kw, status, result.get("rowcount"), result.get("timing_ms")
        )
    except Exception:
        pass

    return (result,status)