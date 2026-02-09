from flask import Blueprint, request, jsonify
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from backend.src.databases.extensions import db
from backend.src.models.connection import DbConnection
from backend.src.security.access_security import require_auth
from backend.src.utils.connection import SSHTunnelManager, inspect_full_postgres_schema, inspect_source, get_engine, explore_schema, create_ssh_tunnel

from backend.src.logger import get_backend_logger
from shared_libs.helpers.utils import encrypt
logger = get_backend_logger(__name__)

bp = Blueprint("connections", __name__, url_prefix="/api/connections")


# Helpers
def error_response(message, status=400, details=None):
    logger.error(message)
    payload = {"error": message}
    if details:
        payload["details"] = details
    return jsonify(payload), status


@bp.post("/inspect")
def inspect_postgres_source():
    payload = request.json
    schema = inspect_source(payload)
    return jsonify(schema)

# List connections
@bp.get("")
@require_auth
def list_connections():
    try:
        connections:list[DbConnection] = DbConnection.query.all()
        conns = sorted((connections or []), key=lambda c: c.id)
        results = [c.to_public_dict() for c in conns]
        return jsonify(results)
    except SQLAlchemyError as e:
        logger.error(f"Failed to list connections: {str(e)}")
        return error_response("Failed to list connections", 500, str(e))
    
@bp.get("/with-details")
@require_auth
def list_connections_with_details():
    try:
        connections:list[DbConnection] = DbConnection.query.all()
        conns = sorted((connections or []), key=lambda c: c.id)

        results = []
        for conn in conns:

            data = conn.to_public_dict()

            conn_conf = conn.to_secure_forms_conf(use_docker=True)

            schemas_list = inspect_full_postgres_schema(conn_conf=conn_conf)

            data["details"] = schemas_list

            results.append(data)

        return jsonify(results)
    except SQLAlchemyError as e:
        logger.error(f"Failed to list connections: {str(e)}")
        return error_response("Failed to list connections", 500, str(e))

# Create connection
@bp.post("")
@require_auth
def add_connection():
    payload = request.get_json(silent=True)

    data = DbConnection.to_forms_conf(payload) if payload else None
    if not data:
        return error_response("Invalid JSON body")

    required = ["name", "host", "port", "dbname", "username", "password"]
    missing = [f for f in required if f not in data]
    if missing:
        return error_response(f"Missing fields: {', '.join(missing)}")

    try:
        conn = DbConnection(
            type_id=data.get("type"), 
            name=data.get("name"), 
            description=data.get("description"), 
            host=data.get("host"),
            port=int(data.get("port") or 5432),
            dbname=data.get("dbname"),
            username_enc=encrypt(data["username"]) if data.get("username") else None,
            password_enc=encrypt(data["password"]) if data.get("password") else None,

            ssh_enabled=bool(data.get("ssh_enabled", False)),

            ssh_host=data.get("ssh_host"),
            ssh_port=int(data.get("ssh_port") or 22),
            ssh_username_enc=encrypt(data["ssh_username"]) if data.get("ssh_username") else None,
            ssh_password_enc=encrypt(data["ssh_password"]) if data.get("ssh_password") else None,
            ssh_key_enc=encrypt(data["ssh_key"]) if data.get("ssh_key") else None,
            ssh_key_pass_enc=encrypt(data["ssh_key_pass"]) if data.get("ssh_key_pass") else None
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
    payload = request.get_json(silent=True)
    data = DbConnection.to_forms_conf(payload) if payload else None

    if not data:
        return error_response("Invalid JSON body")

    try:
        conn:DbConnection = DbConnection.query.get(conn_id)
        if not conn:
            raise ValueError(f"Connection {conn_id} not found")
        if not conn:
            return error_response("Connection not found", 404)
        # DB fields
        if "type" in data:
            conn.type_id = data.get("type")
        if "name" in data:
            conn.name = data.get("name")
        if "description" in data:
            conn.description = data.get("description")
        if "host" in data:
            conn.host = data.get("host")
        if "port" in data:
            conn.port = int(data.get("port") or 5432)
        if "dbname" in data:
            conn.dbname = data["dbname"]
        if "username" in data:
            conn.username_enc = encrypt(data["username"]) if data.get("username") else None
        if "password" in data:
            conn.password_enc = encrypt(data["password"]) if data.get("password") else None
        # SSH toggle
        if "ssh_enabled" in data:
            conn.ssh_enabled = bool(data.get("ssh_enabled") or False)
        # SSH config
        if "ssh_host" in data:
            conn.ssh_host = data.get("ssh_host")
        if "ssh_port" in data:
            conn.ssh_port = int(data.get("ssh_port") or 22)
        if "ssh_username" in data:
            conn.ssh_username_enc = encrypt(data["ssh_username"]) if data.get("ssh_username") else None
        # SSH auth
        if "ssh_password" in data:
            conn.ssh_password_enc = encrypt(data["ssh_password"]) if data.get("ssh_password") else None
        if "ssh_key" in data:
            conn.ssh_key_enc = encrypt(data["ssh_key"]) if data.get("ssh_key") else None
        if "ssh_key_pass" in data:
            conn.ssh_key_pass_enc = encrypt(data["ssh_key_pass"]) if data.get("ssh_key_pass") else None

        db.session.commit()

        logger.info("Connection updated: %s", conn.name)
        return jsonify({"message": "Connection updated"}), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        return error_response("Failed to update connection", 500, str(e))

# Test SSH tunnel
@bp.post("/test-ssh")
@require_auth
def test_ssh():
    payload = request.get_json(silent=True)

    tunnel_conf = DbConnection.to_forms_conf(param=payload) if payload else None

    if not tunnel_conf or not tunnel_conf.get("ssh_enabled"):
        return error_response("SSH not enabled for this connection")

    required = ["ssh_host", "ssh_host"]
    missing = [k for k in required if not tunnel_conf.get(k)]
    if missing:
        return error_response(f"Missing SSH fields: {', '.join(missing)}")

    tunnel = None
    try:
        tunnel = create_ssh_tunnel(tunnel_conf=tunnel_conf)
        return jsonify({"status": "SSH tunnel OK"})
    except Exception as e:
        logger.error(f"SSH test failed: {str(e)}")
        return error_response("SSH tunnel failed", 400, str(e))
    finally:
        if tunnel:
            tunnel.stop()

# Test SSH / DB | PostgreSQL connection
@bp.post("/test-ssh-db")
@require_auth
def test_ssh_db():
    """ Test SSH tunnel + PostgreSQL connection. """
    payload = request.get_json(silent=True)

    connId = payload.get("connId") if payload else None
    tunnel_conf = DbConnection.to_forms_conf(payload, use_docker=True) if payload else None

    if connId:
        try:
            if not tunnel_conf:
                connData:DbConnection = DbConnection.query.filter_by(id=connId).first()
                tunnel_conf = connData.to_secure_forms_conf() if connData else None
        except Exception as e:
            return error_response(f"Data getting failed ({e})", 404, str(e))
        
    if not tunnel_conf:
        return error_response("Invalid JSON body or payload")

    ssh_enabled = bool(tunnel_conf.get("ssh_enabled", False))
    tunnel = None
    
    # Validate DB fields
    required_db = ["host", "port", "dbname", "username", "password"]
    missing_db = [k for k in required_db if not tunnel_conf.get(k)]
    if missing_db:
        return error_response(f"Missing DB fields: {', '.join(missing_db)}")

    # Validate SSH fields
    if ssh_enabled:
        required_ssh = ["ssh_host", "ssh_port", "ssh_user"]
        missing_ssh = [k for k in required_ssh if not tunnel_conf.get(k)]
        if missing_ssh:
            return error_response(f"Missing SSH fields: {', '.join(missing_ssh)}")

    try:
        if ssh_enabled:
            # --- SSH TUNNEL ---
            logger.info(f"Starting SSH tunnel to {tunnel_conf['ssh_host']}:{tunnel_conf['ssh_port']}...")
            tunnel = create_ssh_tunnel(tunnel_conf=tunnel_conf)
            # 🔥 Override DB host/port to tunnel
            tunnel_conf["host"] = "127.0.0.1"
            tunnel_conf["port"] = tunnel.local_bind_port

        # --- DB CONNECTION ---
        engine = get_engine(conn=tunnel_conf)
        with engine.connect() as conn_session:
            conn_session.execute(text("SELECT 1"))

        return jsonify({"status": "Database connection OK", "ssh": ssh_enabled, "database": "connected"})
    
    except Exception as e:
        # Analyse l'erreur pour retourner un message précis
        err_msg = str(e)
        if "password authentication failed" in err_msg:
            user_message = "Authentication failed: invalid username or password"
        elif "could not connect to server" in err_msg:
            user_message = "Database server unreachable (check host/port)"
        elif "timeout" in err_msg.lower():
            user_message = "Connection timeout"
        else:
            user_message = "Database connection failed"

        logger.warning("DB connection test failed: %s", user_message)
        return error_response(user_message, 500)

    finally:
        if tunnel:
            tunnel.stop()

@bp.route("/schema_info", methods=["GET"])
@require_auth
def get_schema_info():

    conn = DbConnection.ensure_default_connection()
    if not conn:
        return jsonify({"error": "PostgreSQL connection failed"}), 500
    
    conn_conf = conn.to_secure_forms_conf(use_docker=True)
    
    try:
        EXCLUDED_TABLES = ["users","refresh_tokens","saved_queries"]
        
        schemas_list = inspect_full_postgres_schema(conn_conf=conn_conf,excluded_tables=EXCLUDED_TABLES)

        return jsonify(schemas_list), 200
    
    except Exception as e:
        return jsonify(str(e)), 500

# Explore schema
@bp.get("/schema/<int:conn_id>")
@require_auth
def schema(conn_id):
    conn:DbConnection = DbConnection.query.get(conn_id)
    if not conn:
        raise ValueError(f"Schema exploration failed")
    return jsonify(explore_schema(conn.to_secure_forms_conf()))

# Delete connection
@bp.delete("/<int:conn_id>")
@require_auth
def delete_connection(conn_id):
    try:
        conn:DbConnection = DbConnection.query.get(conn_id)
        if not conn:
            return error_response(str(e), 404)
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

