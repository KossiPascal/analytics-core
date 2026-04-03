import paramiko
import tempfile, os
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.exc import SQLAlchemyError
from sshtunnel import SSHTunnelForwarder
from urllib.parse import quote_plus
from typing import Dict, Any, List, Optional


from backend.src.modules.analytics.logger import get_backend_logger
from backend.src.modules.analytics.models.a_datasource import SSHTunnelManager
logger = get_backend_logger(__name__)




# SSH Tunnel
def create_ssh_tunnel(tunnel_conf: Dict[str, Any]) -> SSHTunnelForwarder:
    """
    Create and start an SSH tunnel.

    Supports:
    - password authentication
    - private key authentication
    - private key + passphrase

    IMPORTANT: caller MUST call tunnel.stop()
    """

    ssh_host = tunnel_conf.get("ssh_host")
    ssh_port = int(tunnel_conf.get("ssh_port", 22))
    ssh_username = tunnel_conf.get("ssh_username")
    ssh_password = tunnel_conf.get("ssh_password")
    ssh_key = tunnel_conf.get("ssh_key")
    ssh_key_pass = tunnel_conf.get("ssh_key_pass")

    key_file_path = None

    # Validate SSH config
    required = ["host", "username"]
    missing = [k for k in required if not tunnel_conf.get(k)]
    if missing:
        raise ValueError(f"Missing SSH fields: {', '.join(missing)}")

    # Base SSH arguments
    ssh_kwargs = {
        "ssh_username": ssh_username,
        "allow_agent": False,
    }

    # PRIVATE KEY AUTH
    if ssh_key:
        try:
            key_data = ssh_key #decrypt(ssh_key)
        except Exception:
            key_data = ssh_key
        key_file = tempfile.NamedTemporaryFile(mode="w",delete=False,prefix="ssh_key_")
        key_file.write(key_data)
        key_file.close()

        key_file_path = key_file.name

        try:
            pkey_password = ssh_key_pass #decrypt(ssh_key_pass) if ssh_key_pass else None
            pkey = paramiko.RSAKey.from_key_file(key_file_path, password=pkey_password)
        except paramiko.PasswordRequiredException:
            raise ValueError("SSH private key passphrase required")
        except paramiko.SSHException as e:
            raise ValueError(f"Invalid SSH private key: {e}")

        ssh_kwargs["ssh_pkey"] = pkey
        if pkey_password:
            ssh_kwargs["ssh_key_password"] = pkey_password
            ssh_kwargs["ssh_private_key_password"] = pkey_password
            

        logger.info("Using SSH private key authentication")

    # PASSWORD AUTH
    elif ssh_password:
        try:
            ssh_kwargs["ssh_password"] = ssh_password #decrypt(ssh_password)
        except Exception:
            ssh_kwargs["ssh_password"] = ssh_password

        logger.info("Using SSH password authentication")

    else:
        raise ValueError("SSH authentication required (password or private key)")

    # Create SSH tunnel
    host = "127.0.0.1"
    port = 5432

    logger.info("Opening SSH tunnel %s@%s:%s → %s:%s",ssh_username,ssh_host,ssh_port,host,port)
    tunnel = SSHTunnelForwarder(
        (ssh_host, ssh_port),
        remote_bind_address=(host, port),  # PostgreSQL distant
        set_keepalive=30,
        host_pkey_directories=None,
        **ssh_kwargs
    )

    try:
        tunnel.start()
    except Exception:
        if key_file_path and os.path.exists(key_file_path):
            os.unlink(key_file_path)
        raise

    # Cleanup key AFTER stop
    original_stop = tunnel.stop

    def safe_stop():
        try:
            original_stop()
        finally:
            if key_file_path and os.path.exists(key_file_path):
                os.unlink(key_file_path)
                logger.debug("SSH private key file cleaned")

    tunnel.stop = safe_stop

    logger.info("SSH tunnel established on local port %s", tunnel.local_bind_port)

    return tunnel

def get_tunnel_for_connection(conn):
    key = f"{conn.id}"

    def _create():
        return create_ssh_tunnel(conn.ssh, conn.db)

    return SSHTunnelManager.get(key, _create)

# Create Engine
def get_engine(conn: Dict[str, Any], ssh_server: Optional[SSHTunnelForwarder] = None, pool_size=5, max_overflow=10, timeout=30):
    """
    Create SQLAlchemy engine.
    ssh_server: optional SSH tunnel to route connection through.
    """
    
    try:
        # Validate required fields
        required = ["host", "port", "dbname", "username", "password"]
        missing = [k for k in required if not conn.get(k)]
        if missing:
            raise ValueError(f"Missing DB fields: {', '.join(missing)}")

        # password = quote_plus(decrypt(conn["password"]))  # 🔥 IMPORTANT
        password = quote_plus(conn["password"])  # 🔥 IMPORTANT

        host = conn['host']
        port = conn['port']
        
        # If SSH tunnel, override host/port
        if ssh_server:
            host = '127.0.0.1'
            port = ssh_server.local_bind_port
        
        url = f"postgresql+psycopg2://{conn['username']}:{password}@{host}:{port}/{conn['dbname']}"
        return create_engine(url, pool_size=pool_size, max_overflow=max_overflow, pool_pre_ping=True, pool_recycle=300, connect_args={"connect_timeout": timeout})
    except SQLAlchemyError as e:
        raise Exception(f"Failed to create engine: {str(e)}")

# Explore Schema
def explore_schema(conn: Dict[str, Any], ssh_server: Optional[SSHTunnelForwarder] = None) -> Dict[str, List[str]]:
    """Return tables, views, functions of the database."""
    engine = get_engine(conn, ssh_server)
    inspector = inspect(engine)
    try:
        return {
            "tables": inspector.get_table_names(),
            "views": inspector.get_view_names(),
            "functions": inspector.get_functions()
        }
    except SQLAlchemyError as e:
        raise Exception(f"Failed to explore schema: {str(e)}")

def inspect_some_postgres_schema(conn: Dict[str, Any],ssh_server: Optional[SSHTunnelForwarder] = None,schema: str = "public") -> Dict[str, Any]:
    """
    Inspect PostgreSQL schema:
    - tables
    - views
    - materialized views
    - columns + types
    """

    engine = get_engine(conn, ssh_server)
    inspector = inspect(engine)

    tables_output: List[Dict[str, Any]] = []

    try:
        # ---------- TABLES ----------
        for table_name in inspector.get_table_names(schema=schema):
            columns = inspector.get_columns(table_name, schema=schema)

            tables_output.append({
                "tablename": table_name,
                "type": "table",
                "attribut": [
                    { "attributname": col["name"], "type": str(col["type"]) }
                    for col in columns
                ]
            })

        # ---------- VIEWS ----------
        for view_name in inspector.get_view_names(schema=schema):
            columns = inspector.get_columns(view_name, schema=schema)

            tables_output.append({
                "tablename": view_name,
                "type": "view",
                "attribut": [
                    { "attributname": col["name"], "type": str(col["type"]) }
                    for col in columns
                ]
            })

        # ---------- MATERIALIZED VIEWS ----------
        with engine.connect() as db:
            matviews = db.execute(text("""
                SELECT matviewname
                FROM pg_matviews
                WHERE schemaname = :schema
            """), {"schema": schema}).fetchall()

        for (matview_name,) in matviews:
            columns = inspector.get_columns(matview_name, schema=schema)

            tables_output.append({
                "tablename": matview_name,
                "type": "materialized_view",
                "attribut": [
                    { "attributname": col["name"], "type": str(col["type"]) }
                    for col in columns
                ]
            })

        return { "dbname": conn["dbname"], "tables": tables_output }

    finally:
        engine.dispose()

def inspect_full_postgres_schema(conn_conf: Dict[str, Any],ssh_server: Optional[SSHTunnelForwarder] = None, excluded_tables:list[str]=[], schema: str = "public") -> Dict[str, Any]:
    """
    Full PostgreSQL schema introspection.
    Uses SQLAlchemy only.
    """

    engine = get_engine(conn_conf, ssh_server)
    inspector = inspect(engine)

    result: Dict[str, Any] = {
        "schemas": [],
        "tables": [],
        "views": [],
        "materialized_views": [],
        "sequences": [],
        "indexes": [],
        "functions": [],
        "triggers": [],
    }

    try:
        with engine.connect() as db:
            # ---------- Schemas ----------
            result["schemas"] = inspector.get_schema_names()

            # ---------- Tables ----------
            for table_name in inspector.get_table_names(schema=schema):
                if table_name in (excluded_tables or []):
                    continue

                columns = inspector.get_columns(table_name, schema=schema)
                constraints = inspector.get_pk_constraint(table_name, schema=schema)
                fks = inspector.get_foreign_keys(table_name, schema=schema)
                indexes = inspector.get_indexes(table_name, schema=schema)

                result["tables"].append({
                    "table_name": table_name,
                    "columns": [
                        {
                            "name": c["name"],
                            "type": str(c["type"]),
                            "nullable": c["nullable"],
                            "default": str(c.get("default")),
                        }
                        for c in columns
                    ],
                    "primary_key": constraints.get("constrained_columns", []),
                    "foreign_keys": fks,
                    "indexes": indexes,
                })

            # ---------- Views ----------
            for view in inspector.get_view_names(schema=schema):
                definition = inspector.get_view_definition(view, schema=schema)
                result["views"].append({
                    "view_name": view,
                    "definition": definition,
                })

            # ---------- Materialized Views ----------
            matviews = db.execute(text("""
                SELECT matviewname, definition
                FROM pg_matviews
                WHERE schemaname = :schema
                ORDER BY matviewname
            """), {"schema": schema}).fetchall()

            result["materialized_views"] = [
                {"name": row.matviewname, "definition": row.definition}
                for row in matviews
            ]

            # ---------- Sequences ----------
            sequences = db.execute(text("""
                SELECT sequence_name
                FROM information_schema.sequences
                WHERE sequence_schema = :schema
                ORDER BY sequence_name
            """), {"schema": schema}).fetchall()

            result["sequences"] = [row.sequence_name for row in sequences]

            # ---------- Functions ----------
            functions = db.execute(text("""
                SELECT routine_name, routine_type, data_type
                FROM information_schema.routines
                WHERE specific_schema = :schema
                ORDER BY routine_name
            """), {"schema": schema}).fetchall()

            result["functions"] = [dict(row._mapping) for row in functions]

            # ---------- Triggers ----------
            triggers = db.execute(text("""
                SELECT trigger_name, event_manipulation,
                       event_object_table, action_statement
                FROM information_schema.triggers
                WHERE trigger_schema = :schema
                ORDER BY trigger_name
            """), {"schema": schema}).fetchall()

            result["triggers"] = [dict(row._mapping) for row in triggers]

        return result

    finally:
        engine.dispose()



def inspect_source(conn: Dict[str, Any]) -> Dict[str, Any]:
    """
    Entry point:
    - ouvre tunnel SSH si défini
    - inspecte la base
    - ferme proprement
    """
    ssh_tunnel = None

    try:
        if conn.get("ssh"):
            ssh_tunnel = create_ssh_tunnel(conn["ssh"])

        return inspect_some_postgres_schema(conn, ssh_tunnel)

    finally:
        if ssh_tunnel:
            ssh_tunnel.stop()



# @bp.route("/schema_info", methods=["GET"])
# @require_auth
# def get_schema_info():
#     conn = None
#     try:
#         conn = get_connection()
#         if not conn:
#             raise BadRequest("PostgreSQL connection failed", 500)

#         result = {
#             "schemas": [],
#             "tables": [],
#             "views": [],
#             "matviews": [],
#             "sequences": [],
#             "indexes": [],
#             "constraints": [],
#             "functions": [],
#             "triggers": []
#         }

#         with conn.cursor(cursor_factory=DictCursor) as cur:
#             # -- Schemas --
#             cur.execute("""
#                 SELECT schema_name
#                 FROM information_schema.schemata
#                 ORDER BY schema_name;
#             """)
#             result["schemas"] = [row["schema_name"] for row in cur.fetchall()]

#             # -- Tables --
#             cur.execute("""
#                 SELECT table_name
#                 FROM information_schema.tables
#                 WHERE table_schema='public' AND table_type='BASE TABLE'
#                 ORDER BY table_name;
#             """)
#             tables = [row["table_name"] for row in cur.fetchall() if row["table_name"] not in EXCLUDES_TABLE]

#             for table in tables:
#                 cur.execute("""
#                     SELECT column_name, data_type, is_nullable, column_default
#                     FROM information_schema.columns
#                     WHERE table_schema='public' AND table_name=%s
#                     ORDER BY ordinal_position;
#                 """, (table,))
#                 columns = [dict(row) for row in cur.fetchall()]

#                 cur.execute("""
#                     SELECT
#                         kcu.column_name,
#                         tc.constraint_type,
#                         tc.constraint_name,
#                         ccu.table_name AS foreign_table,
#                         ccu.column_name AS foreign_column
#                     FROM information_schema.table_constraints tc
#                     LEFT JOIN information_schema.key_column_usage kcu
#                       ON tc.constraint_name = kcu.constraint_name
#                      AND tc.table_schema = kcu.table_schema
#                      AND tc.table_name = kcu.table_name
#                     LEFT JOIN information_schema.constraint_column_usage ccu
#                       ON ccu.constraint_name = tc.constraint_name
#                     WHERE tc.table_schema='public' AND tc.table_name=%s;
#                 """, (table,))
#                 constraints = [dict(row) for row in cur.fetchall()]

#                 result["tables"].append({
#                     "table_name": table,
#                     "columns": columns,
#                     "constraints": constraints
#                 })

#             # -- Views --
#             cur.execute("""
#                 SELECT table_name, view_definition
#                 FROM information_schema.views
#                 WHERE table_schema='public'
#                 ORDER BY table_name;
#             """)
#             result["views"] = [{"view_name": row["table_name"], "definition": row["view_definition"]}
#                                for row in cur.fetchall()]

#             # -- Materialized Views --
#             cur.execute("""
#                 SELECT matviewname AS matview_name, definition
#                 FROM pg_catalog.pg_matviews
#                 WHERE schemaname='public'
#                 ORDER BY matviewname;
#             """)
#             result["matviews"] = [{"matview_name": row["matview_name"], "definition": row["definition"]}
#                                   for row in cur.fetchall()]

#             # -- Sequences --
#             cur.execute("""
#                 SELECT sequence_name
#                 FROM information_schema.sequences
#                 WHERE sequence_schema='public'
#                 ORDER BY sequence_name;
#             """)
#             result["sequences"] = [row["sequence_name"] for row in cur.fetchall()]

#             # -- Indexes --
#             cur.execute("""
#                 SELECT tablename, indexname, indexdef
#                 FROM pg_indexes
#                 WHERE schemaname='public'
#                 ORDER BY tablename, indexname;
#             """)
#             result["indexes"] = [dict(row) for row in cur.fetchall()]

#             # -- Functions / Stored Procedures --
#             cur.execute("""
#                 SELECT routine_name, routine_type, data_type
#                 FROM information_schema.routines
#                 WHERE specific_schema='public'
#                 ORDER BY routine_name;
#             """)
#             result["functions"] = [dict(row) for row in cur.fetchall()]

#             # -- Triggers --
#             cur.execute("""
#                 SELECT trigger_name, event_manipulation, event_object_table, action_statement
#                 FROM information_schema.triggers
#                 WHERE trigger_schema='public'
#                 ORDER BY trigger_name;
#             """)
#             result["triggers"] = [dict(row) for row in cur.fetchall()]

#         return jsonify(result)

#     except Exception as e:
#         return jsonify(str(e)), 500
#     finally:
#         if conn:
#             try:
#                 conn.close()
#             except:
#                 pass