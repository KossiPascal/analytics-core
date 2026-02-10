from typing import Any, Dict
from flask import Blueprint, request, jsonify
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from backend.src.databases.extensions import db, get_json_payload, success_response
from backend.src.models.connection import ConnectionType, DbConnection, CouchdbSyncCible
from backend.src.security.access_security import require_auth
from backend.src.utils.connection import SSHTunnelManager, inspect_full_postgres_schema, inspect_source, get_engine, explore_schema, create_ssh_tunnel

from backend.src.logger import get_backend_logger
from shared_libs.helpers.utils import encrypt
from workers.couchdb.models import CreateTableModel
logger = get_backend_logger(__name__)

bp = Blueprint("connections", __name__, url_prefix="/api/connections")


# Helpers


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
        connections:list[DbConnection] = DbConnection.query.filter_by(DbConnection.type_id != "couchdb").all()
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
    
    if not payload:
        raise ValueError("payload body must be JSON")

    data = DbConnection.to_forms_conf(payload) if payload else None
    if not data:
        return error_response("Invalid JSON body")

    required = ["type", "name", "host", "dbname", "username"]
    missing = [f for f in required if f not in data]
    if missing:
        return error_response(f"Missing fields: {', '.join(missing)}")
    type_id = data.get("type")
    try:
        conn = DbConnection(
            type_id=type_id, 
            name=data.get("name"), 
            description=data.get("description"), 
            host=data.get("host"),
            port= int(data.get("port") or (443 if type_id == "couchdb" else 5432)),
            dbname=data.get("dbname"),
            username_enc=encrypt(data["username"]) if data.get("username") else None,
            password_enc=encrypt(data["password"]) if data.get("password") else None,
            is_active = bool(data.get("is_active", True)),
            auto_sync = payload.get("auto_sync") is True, # only for CouchDB

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

        if type_id == "couchdb":
            ModelMgr = CreateTableModel(db, project_name=conn.name, create_table=True)
            ModelMgr.create_sync_states_table()
            ModelMgr.create_sync_status_table()
            for cible in CouchdbSyncCible.couchdb_names():
                ModelMgr.create_source_table(cible.local_name)

        conn_id = conn.id
        conn_name = conn.name
        db.session.close()

        logger.info("Connection created: %s", conn_name)
        return jsonify({"id": conn_id}), 201

    except SQLAlchemyError as e:
        db.session.rollback()
        return error_response(f"Failed to create connection", 500, str(e))

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








# Types of connections (PostgreSQL, MySQL, MongoDB, etc.)

#     // const DB_TYPES: SelectModel[] = [
#     //   { value: 'postgres', label: 'PostgreSQL' },
#     //   { value: 'mysql', label: 'MySQL' },
#     //   { value: 'mariadb', label: 'MariaDB' },
#     //   { value: 'mssql', label: 'SQL Server' },
#     //   { value: 'oracle', label: 'Oracle' },
#     //   { value: 'mongodb', label: 'MongoDB' },
#     //   { value: 'couchdb', label: 'CouchDB' },
#     //   { value: 'sqlite', label: 'SQLite' },
#     //   { value: 'other', label: 'Autre' },
#     // ]

# Helpers
def error_response(message, status=400, details=None):
    logger.error(message)
    payload = {"error": message}
    if details:
        payload["details"] = details
    return jsonify(payload), status



@bp.get("/conn-types")
@require_auth
def list_types():
    try:
        typesList= ConnectionType.ensure_default_type()
        types = sorted((typesList or []), key=lambda t: t.uid)
        results = [c.to_public_dict() for c in types]
        return jsonify(results)
    except SQLAlchemyError as e:
        logger.error(f"Failed to list types: {str(e)}")
        return error_response("Failed to list types", 500, str(e))

# Create types
@bp.post("/conn-types")
@require_auth
def add_types():
    data = request.get_json(silent=True)
    if not data:
        return error_response("Invalid JSON body")
    try:
        conn = ConnectionType(
            id=data.get("id"), 
            name=data.get("name"), 
            config=data.get("config"),
            is_active=data.get("is_active") or True
        )
        db.session.add(conn)
        db.session.commit()

        logger.info("Conn Types created: %s", conn.name)
        return jsonify({"id": conn.id}), 201

    except SQLAlchemyError as e:
        db.session.rollback()
        return error_response("Failed to create conn types", 500, str(e))

@bp.put("/conn-types/<int:conn_id>")
@require_auth
def update_types(conn_id):
    data = request.get_json(silent=True)
    if not data:
        return error_response("Invalid JSON body")

    try:
        conn:ConnectionType = ConnectionType.query.get(conn_id)
        if not conn:
            return error_response("types not found", 404)

        if "name" in data:
            conn.name = data.get("name")
        if "config" in data:
            conn.config = data.get("config")
        if "is_active" in data:
            conn.is_active = data.get("is_active") or True

        db.session.commit()

        logger.info("types updated: %s", conn.name)
        return jsonify({"message": "conn types updated"}), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        return error_response("Failed to update conn types", 500, str(e))

# Delete Types
@bp.delete("/conn-types/<int:conn_id>")
@require_auth
def delete_types(conn_id):
    try:
        conn:ConnectionType = ConnectionType.query.get(conn_id)
        if not conn:
            return error_response(str(e), 404)
        db.session.delete(conn)
        db.session.commit()
        return jsonify({"status": "deleted"})
    except ValueError as e:
        return error_response(str(e), 404)
    except SQLAlchemyError as e:
        db.session.rollback()
        return error_response("Failed to delete conn types", 500, str(e))
    




# CouchDB specific routes (sync, upsert, etc.)

# -------------------------------------------------------------------
# Routes
# -------------------------------------------------------------------
@bp.post("/couchdb/connect")
@require_auth
def connect_couchdb():
    # """
    # Initialize CouchDB database & schema
    # """
    # try:
    #     payload = get_json_payload()

    #     logger.info(f"Initializing CouchDB schema: db={data.name}, auto_sync={data.auto_sync}")

    #     platform.initialiseCouchDbProperties(
    #         couchdb_base_url=data.base_url, 
    #         project_name=data.name, 
    #         auth = (data.username,data.password,) if data.username and data.password else None, 
    #         auto_sync=data.auto_sync,
    #         timeout = None
    #     )
        
    #     result, status = platform.initialize_couchdb_schema()

    #     if status != 200:
    #         return error_response(result, status)

    #     return success_response(result)

    # except ValueError as e:
    #     return error_response(str(e), 400)

    # except Exception as e:
    #     logger.error(f"CouchDB connect failed: {str(e)}")
    #     return error_response(str(e), 500)

    pass


@bp.post("/couchdb/upsert")
@require_auth
def upsert_couchdb_doc():
    """
    Insert or update a document in a CouchDB collection
    """
    try:
        payload = get_json_payload()

        db_name: str | None = payload.get("db_name")
        collection: str | None = payload.get("collection")
        doc: Dict[str, Any] | None = payload.get("doc")



        # project_name: str | None = payload.get("project_name")
        # couchdb_base_url: str | None = payload.get("couchdb_base_url")
        # couchdb_user: str | None = payload.get("couchdb_user")
        # couchdb_pass: str | None = payload.get("couchdb_pass")
        # auto_sync: bool = bool(payload.get("auto_sync", False))

        # if not all([db_name, collection, doc]):
        #     return error_response("db_name, collection and doc are required")

        # platform.initialiseCouchDbProperties(
        #     couchdb_base_url=couchdb_base_url, 
        #     project_name=project_name, 
        #     auth = (couchdb_user,couchdb_pass,) if couchdb_user and couchdb_pass else None, 
        #     auto_sync=auto_sync,
        #     timeout = None
        # )

        # logger.info(f"Upsert document: db={db_name}, collection={collection}")
        # platform.upsert_document(db_name=db_name,collection=collection,document=doc)

        return success_response({"message": "Document upserted successfully"})

    except ValueError as e:
        return error_response(str(e), 400)

    except Exception as e:
        logger.error(f"Upsert document failed: {str(e)}")
        return error_response(str(e), 500)


@bp.post("/couchdb/lastseq")
@require_auth
def update_couchdb_last_seq():
    """
    Update last CouchDB replication sequence
    """
    try:
        payload = get_json_payload()

        db_name: str | None = payload.get("db_name")
        seq: str | int | None = payload.get("seq")

        # project_name: str | None = payload.get("project_name")
        # couchdb_base_url: str | None = payload.get("couchdb_base_url")
        # couchdb_user: str | None = payload.get("couchdb_user")
        # couchdb_pass: str | None = payload.get("couchdb_pass")
        # auto_sync: bool = bool(payload.get("auto_sync", False))

        # if not all([db_name, collection, doc]):
        #     return error_response("db_name, collection and doc are required")

        # platform.initialiseCouchDbProperties(
        #     couchdb_base_url=couchdb_base_url, 
        #     project_name=project_name, 
        #     auth = (couchdb_user,couchdb_pass,) if couchdb_user and couchdb_pass else None, 
        #     auto_sync=auto_sync,
        #     timeout = None
        # )

        # if not db_name or seq is None:
        #     return error_response("db_name and seq are required")

        # logger.info(f"Updating last_seq: db={db_name}, seq={seq}")
        # platform.update_last_seq(db_name=db_name,seq=seq)

        return success_response({"message": "Last sequence updated"})

    except ValueError as e:
        return error_response(str(e), 400)

    except Exception as e:
        logger.error(f"Update last_seq failed: {str(e)}")
        return error_response(str(e), 500)
