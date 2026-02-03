from flask import Blueprint, request, jsonify
from psycopg2.extras import DictCursor
from security.access_security import require_auth
from models.connection import DataConnection, DbConnection
from database.extensions import db, get_connection
from config import Config
from sqlalchemy.exc import SQLAlchemyError, OperationalError
from sqlalchemy import text
from utils.connection import (
    SSHTunnelManager,
    encrypt,
    decrypt,
    run_query,
    build_query,
    get_engine,
    explore_schema,
    create_ssh_tunnel
)

from helpers.logger import get_logger
logger = get_logger(__name__)

bp = Blueprint("connections", __name__, url_prefix="/api/connections")


EXCLUDES_TABLE = ["users","refresh_tokens","saved_queries"]

# Helpers
def error_response(message, status=400, details=None):
    logger.error(message)
    payload = {"error": message}
    if details:
        payload["details"] = details
    return jsonify(payload), status

def get_connection_or_404(conn_id):
    conn = DbConnection.query.get(conn_id)
    if not conn:
        raise ValueError(f"Connection {conn_id} not found")
    return conn

def build_conf(data):
    return {
        "host": data.get("host"),
        "port": int(data.get("port", 5432)),
        "dbname": data.get("dbname"),
        "username": data.get("username"),
        "password": decrypt(data.get("password")),

        "use_ssh": bool(data.get("use_ssh", False)),
        "ssh_host": data.get("ssh_host"),
        "ssh_port": int(data.get("ssh_port", 22)),
        "ssh_user": data.get("ssh_user"),
        "ssh_password": decrypt(data["ssh_password"]) if data.get("ssh_password") else None,
        "ssh_key": decrypt(data["ssh_key"]) if data.get("ssh_key") else None,
        "ssh_key_pass": decrypt(data["ssh_key_pass"]) if data.get("ssh_key_pass") else None,
    }

def extract_conf(data):
# def extract_conf(data: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "host": Config.POSTGRES_HOST or data.get("host", "127.0.0.1"),
        "port": int(Config.POSTGRES_PORT or data.get("port", 5432)),
        "dbname": data.get("dbname"),
        "username": data.get("username"),
        "password": encrypt(data["password"]) if data.get("password") else None,

        "use_ssh": bool(data.get("use_ssh", False)),
        "ssh_host": data.get("ssh_host"),
        "ssh_port": int(data.get("ssh_port", 22)),
        "ssh_user": data.get("ssh_user"),
        "ssh_password": encrypt(data["ssh_password"]) if data.get("ssh_password") else None,
        "ssh_key": encrypt(data["ssh_key"]) if data.get("ssh_key") else None,
        "ssh_key_pass": encrypt(data["ssh_key_pass"]) if data.get("ssh_key_pass") else None,
    }


# List connections
@bp.get("")
@require_auth
def list_connections():
    try:
        results = [
            c.to_dict_safe()
            for c in DbConnection.query.all()
        ]
        return jsonify(results)
    except SQLAlchemyError as e:
        logger.exception("Failed to list connections")
        return error_response("Failed to list connections", 500, str(e))

# Create connection
@bp.post("")
@require_auth
def add_connection():
    data = request.get_json(silent=True)
    if not data:
        return error_response("Invalid JSON body")

    required = ["name", "host", "port", "dbname", "username", "password"]
    missing = [f for f in required if f not in data]
    if missing:
        return error_response(f"Missing fields: {', '.join(missing)}")

    try:
        conn = DbConnection(
            name=data["name"],
            host=data["host"],
            port=int(data["port"]),
            dbname=data["dbname"],
            username=data["username"],
            password=encrypt(data["password"]) if data.get("password") else None,

            use_ssh=bool(data.get("use_ssh", False)),

            ssh_host=data.get("ssh_host"),
            ssh_port=int(data["ssh_port"]) if data.get("ssh_port") else 22,
            ssh_user=data.get("ssh_user"),

            ssh_password=encrypt(data["ssh_password"]) if data.get("ssh_password") else None,
            ssh_key=encrypt(data["ssh_key"]) if data.get("ssh_key") else None,
            ssh_key_pass=encrypt(data["ssh_key_pass"]) if data.get("ssh_key_pass") else None
        )

        db.session.add(conn)
        db.session.commit()

        logger.info("Connection created: %s", conn.name)
        return jsonify({"id": conn.id}), 201

    except SQLAlchemyError as e:
        db.session.rollback()
        return error_response("Failed to create connection", 500, str(e))

@bp.put("/<int:conn_id>")
@require_auth
def update_connection(conn_id):
    data = request.get_json(silent=True)
    if not data:
        return error_response("Invalid JSON body")

    try:
        conn = DbConnection.query.get(conn_id)
        if not conn:
            return error_response("Connection not found", 404)

        # DB fields
        if "name" in data:
            conn.name = data["name"]
        if "host" in data:
            conn.host = data["host"]
        if "port" in data:
            conn.port = int(data["port"])
        if "dbname" in data:
            conn.dbname = data["dbname"]
        if "username" in data:
            conn.username = data["username"]
        if "password" in data:
            conn.password = encrypt(data["password"]) if data["password"] else None

        # SSH toggle
        if "use_ssh" in data:
            conn.use_ssh = bool(data["use_ssh"])

        # SSH config
        if "ssh_host" in data:
            conn.ssh_host = data["ssh_host"]
        if "ssh_port" in data:
            conn.ssh_port = int(data["ssh_port"]) if data["ssh_port"] else 22
        if "ssh_user" in data:
            conn.ssh_user = data["ssh_user"]

        # SSH auth
        if "ssh_password" in data:
            conn.ssh_password = encrypt(data["ssh_password"]) if data["ssh_password"] else None
        if "ssh_key" in data:
            conn.ssh_key = encrypt(data["ssh_key"]) if data["ssh_key"] else None
        if "ssh_key_pass" in data:
            conn.ssh_key_pass = encrypt(data["ssh_key_pass"]) if data["ssh_key_pass"] else None

        db.session.commit()

        logger.info("Connection updated: %s", conn.name)
        return jsonify({"message": "Connection updated"}), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        return error_response("Failed to update connection", 500, str(e))

# Delete connection
@bp.delete("/<int:conn_id>")
@require_auth
def delete_connection(conn_id):
    try:
        conn = get_connection_or_404(conn_id)
        db.session.delete(conn)
        db.session.commit()
        return jsonify({"status": "deleted"})
    except ValueError as e:
        return error_response(str(e), 404)
    except SQLAlchemyError as e:
        db.session.rollback()
        return error_response("Failed to delete connection", 500, str(e))

@bp.get("/ssh/health")
@require_auth
def ssh_health():
    return {
        "active_tunnels": len(SSHTunnelManager._tunnels),
        "tunnels": [
            { "id": k, "active": t.is_active }
            for k, (t, _) in SSHTunnelManager._tunnels.items()
        ]
    }

@bp.get("/ssh/auto-clean")
@require_auth
def cleanup_tunnels():
    cleaned = 0
    for k, (tunnel, _) in list(SSHTunnelManager._tunnels.items()):
        if not tunnel.is_active:
            tunnel.stop()
            del SSHTunnelManager._tunnels[k]
            cleaned += 1
    return jsonify({"cleaned": cleaned})

# Test SSH tunnel
@bp.post("/test-ssh")
@require_auth
def test_ssh():
    data = request.get_json(silent=True)
    if not data or not data.get("use_ssh"):
        return error_response("SSH not enabled for this connection")

    required = ["ssh_host", "ssh_user"]
    missing = [k for k in required if not data.get(k)]
    if missing:
        return error_response(f"Missing SSH fields: {', '.join(missing)}")

    tunnel = None
    try:
        tunnel = create_ssh_tunnel(tunnel_conf=extract_conf(data))
        return jsonify({"status": "SSH tunnel OK"})
    except Exception as e:
        logger.exception("SSH test failed")
        return error_response("SSH tunnel failed", 400, str(e))
    finally:
        if tunnel:
            tunnel.stop()

# Test SSH / DB | PostgreSQL connection
@bp.post("/test-ssh-db")
@require_auth
def test_ssh_db():
    """ Test SSH tunnel + PostgreSQL connection. """
    data = request.get_json(silent=True)
    connId = data.get("connId")
    if connId:
        try:
            connData = DbConnection.query.filter_by(id=connId).first()
            if connData:
                data = build_conf(connData.to_full_dict())
        except Exception as e:
            return error_response(f"Data getting failed ({e})", 404, str(e))
        
    if not data:
        return error_response("Invalid JSON body")

    use_ssh = bool(data.get("use_ssh", False))
    tunnel = None
    
    # Validate DB fields
    required_db = ["host", "port", "dbname", "username", "password"]
    missing_db = [k for k in required_db if not data.get(k)]
    if missing_db:
        return error_response(f"Missing DB fields: {', '.join(missing_db)}")

    # Validate SSH fields
    if use_ssh:
        required_ssh = ["ssh_host", "ssh_port", "ssh_user"]
        missing_ssh = [k for k in required_ssh if not data.get(k)]
        if missing_ssh:
            return error_response(f"Missing SSH fields: {', '.join(missing_ssh)}")

    try:
        conf = extract_conf(data)
        try:
            if use_ssh:
                # --- SSH TUNNEL ---
                logger.info(f"Starting SSH tunnel to {conf['ssh_host']}:{conf['ssh_port']}...")
                tunnel = create_ssh_tunnel(tunnel_conf=conf)
                # 🔥 Override DB host/port to tunnel
                conf["host"] = "127.0.0.1"
                conf["port"] = tunnel.local_bind_port

            # --- DB CONNECTION ---
            engine = get_engine(conf)
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return jsonify({"status": "Database connection OK", "ssh": use_ssh, "database": "connected"})
        except Exception as e:
            logger.exception("Connection test failed")
            return error_response(f"Database connection failed ({e})", 500, str(e))

    finally:
        if tunnel:
            tunnel.stop()


@bp.route("/schema_info", methods=["GET"])
@require_auth
def get_schema_info():
    conn = None
    try:
        conn = get_connection()
        if not conn:
            return jsonify({"error": "PostgreSQL connection failed"}), 500

        result = {
            "schemas": [],
            "tables": [],
            "views": [],
            "matviews": [],
            "sequences": [],
            "indexes": [],
            "constraints": [],
            "functions": [],
            "triggers": []
        }

        with conn.cursor(cursor_factory=DictCursor) as cur:
            # -- Schemas --
            cur.execute("""
                SELECT schema_name
                FROM information_schema.schemata
                ORDER BY schema_name;
            """)
            result["schemas"] = [row["schema_name"] for row in cur.fetchall()]

            # -- Tables --
            cur.execute("""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema='public' AND table_type='BASE TABLE'
                ORDER BY table_name;
            """)
            tables = [row["table_name"] for row in cur.fetchall() if row["table_name"] not in EXCLUDES_TABLE]

            for table in tables:
                cur.execute("""
                    SELECT column_name, data_type, is_nullable, column_default
                    FROM information_schema.columns
                    WHERE table_schema='public' AND table_name=%s
                    ORDER BY ordinal_position;
                """, (table,))
                columns = [dict(row) for row in cur.fetchall()]

                cur.execute("""
                    SELECT
                        kcu.column_name,
                        tc.constraint_type,
                        tc.constraint_name,
                        ccu.table_name AS foreign_table,
                        ccu.column_name AS foreign_column
                    FROM information_schema.table_constraints tc
                    LEFT JOIN information_schema.key_column_usage kcu
                      ON tc.constraint_name = kcu.constraint_name
                     AND tc.table_schema = kcu.table_schema
                     AND tc.table_name = kcu.table_name
                    LEFT JOIN information_schema.constraint_column_usage ccu
                      ON ccu.constraint_name = tc.constraint_name
                    WHERE tc.table_schema='public' AND tc.table_name=%s;
                """, (table,))
                constraints = [dict(row) for row in cur.fetchall()]

                result["tables"].append({
                    "table_name": table,
                    "columns": columns,
                    "constraints": constraints
                })

            # -- Views --
            cur.execute("""
                SELECT table_name, view_definition
                FROM information_schema.views
                WHERE table_schema='public'
                ORDER BY table_name;
            """)
            result["views"] = [{"view_name": row["table_name"], "definition": row["view_definition"]}
                               for row in cur.fetchall()]

            # -- Materialized Views --
            cur.execute("""
                SELECT matviewname AS matview_name, definition
                FROM pg_catalog.pg_matviews
                WHERE schemaname='public'
                ORDER BY matviewname;
            """)
            result["matviews"] = [{"matview_name": row["matview_name"], "definition": row["definition"]}
                                  for row in cur.fetchall()]

            # -- Sequences --
            cur.execute("""
                SELECT sequence_name
                FROM information_schema.sequences
                WHERE sequence_schema='public'
                ORDER BY sequence_name;
            """)
            result["sequences"] = [row["sequence_name"] for row in cur.fetchall()]

            # -- Indexes --
            cur.execute("""
                SELECT tablename, indexname, indexdef
                FROM pg_indexes
                WHERE schemaname='public'
                ORDER BY tablename, indexname;
            """)
            result["indexes"] = [dict(row) for row in cur.fetchall()]

            # -- Functions / Stored Procedures --
            cur.execute("""
                SELECT routine_name, routine_type, data_type
                FROM information_schema.routines
                WHERE specific_schema='public'
                ORDER BY routine_name;
            """)
            result["functions"] = [dict(row) for row in cur.fetchall()]

            # -- Triggers --
            cur.execute("""
                SELECT trigger_name, event_manipulation, event_object_table, action_statement
                FROM information_schema.triggers
                WHERE trigger_schema='public'
                ORDER BY trigger_name;
            """)
            result["triggers"] = [dict(row) for row in cur.fetchall()]

        return jsonify(result)

    except Exception as e:
        return jsonify(str(e)), 500
    finally:
        if conn:
            try:
                conn.close()
            except:
                pass


# Explore schema
@bp.get("/schema/<int:conn_id>")
@require_auth
def schema(conn_id):
    try:
        conn = get_connection_or_404(conn_id)
        return jsonify(explore_schema(build_conf(conn)))
    except Exception as e:
        return error_response("Schema exploration failed", 500, str(e))

