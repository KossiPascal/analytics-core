# backend/src/routes/api.py
from typing import List

from sqlalchemy import text
from flask import Blueprint, request, jsonify
from flask import Blueprint, g, jsonify, request
from backend.src.app.middlewares.access_security import require_auth, currentUserId
from backend.src.app.configs.extensions import db
from backend.src.modules.analytics.connection import create_ssh_tunnel, explore_schema, get_engine, inspect_full_postgres_schema, inspect_source

from werkzeug.exceptions import BadRequest
from sqlalchemy.exc import SQLAlchemyError, IntegrityError

from backend.src.modules.analytics.logger import get_backend_logger
from backend.src.modules.analytics.models.a_datasource import DataSource, DataSourceConnection, DataSourcePermission, SSHTunnelManager
from backend.src.modules.analytics.services.datasource_service import DataSourceProvisioningService
logger = get_backend_logger(__name__)

bp = Blueprint("datasources", __name__, url_prefix="/api/datasources")

# -------------------- DATASOURCE CRUD --------------------
# {
#   "name": "Prod Database",
#   "description": "Main production DB",
#   "connection": { "host": "10.0.0.10", "port": 5432, "dbname": "prod_db", "username": "admin", "password": "secret" },
#   "ssh": { "enabled": true, "host": "52.12.45.10", "port": 22, "username": "ubuntu", "private_key": "-----BEGIN PRIVATE KEY-----..." },
#   "permissions": [ { "user_id": 1, "roles": ["read", "write"] }, { "user_id": 5, "roles": ["read"] } ]
# }

# Helpers
@bp.post("/inspect")
def inspect_postgres_source():
    payload = request.json
    schema = inspect_source(payload)
    return jsonify(schema)

# CREATE
@bp.post("")
@require_auth
def create_datasource():
    payload = request.get_json(silent=True) or {}
    
    required = ["tenant_id", "type", "name", "technical_name", "host", "dbname", "username"]
    missing = [f for f in required if f not in payload]
    if missing:
        raise BadRequest(f"Missing fields: {', '.join(missing)}")

    data = DataSource.to_object_conf(payload) if payload else None
    if not data:
        raise BadRequest("Invalid JSON body")
    
    data_type=data.get("type")

    try:
        conn = data.get("connection") or {}
        ssh = data.get("ssh") or {}

        ds:DataSource = DataSourceProvisioningService.create_full_datasource(
            tenant_id=data.get("tenant_id"),
            type=data_type,
            name=data.get("name"),
            technical_name=data.get("technical_name"),
            description=data.get("description"),
            is_main=bool(data.get("is_main", False)),
            auto_sync=bool(data.get("auto_sync", False)),
            is_active = bool(data.get("is_active", True)),
            
            host=conn.get("host"),
            port= int(conn.get("port") or 5432),
            dbname=conn.get("dbname"),
            username=conn.get("username"),
            password=conn.get("password"),

            ssh_enabled=ssh.get("enabled", False),
            ssh_host=ssh.get("host"),
            ssh_port=ssh.get("port", 22),
            ssh_username=ssh.get("username"),
            ssh_password=ssh.get("password"),
            ssh_key=ssh.get("key"),
            ssh_key_pass=ssh.get("key_pass"),

            permissions=data.get("permissions", []),
            created_by=currentUserId(),
        )

        # db.session.close()

        logger.info("Connection created: %s", ds.name)
        return jsonify({"id": ds.id, "message": "Datasource created"}), 201

    except SQLAlchemyError as e:
        raise BadRequest(f"SQLAlchemyError: {str(e)}",400)
    except Exception as e:
        raise



@bp.get("")
@require_auth
def list_datasources():
    try:
        tenant_id = request.args.get("tenant_id", type=str)
        datasource_id = request.args.get("datasource_id", type=str)
        with_details = request.args.get("with_details", type=int)

        if not tenant_id:
            raise BadRequest("tenant_id is required", 400)

        if not with_details:
            if not datasource_id:
                datasources = DataSourceProvisioningService.list_full_datasources(tenant_id)
                if len(datasources) == 0:
                    created_by = currentUserId()
                    DataSource.ensure_default_datasource(created_by)
                    datasources = DataSourceProvisioningService.list_full_datasources(tenant_id)

                # sources = sorted((datasources or []), key=lambda c: c.id)
                results = [c.to_dict() for c in datasources]
                return jsonify(results), 200
            
            else:
                ds = DataSourceProvisioningService.get_full_datasource(datasource_id)
                conn:DataSourceConnection = ds.datasource_connection
                permissions:List[DataSourcePermission] = [p for p in ds.datasource_permissions if p.tenant_id == tenant_id]

                return jsonify({
                    "id": ds.id,
                    "name": ds.name,
                    "technical_name": ds.technical_name,
                    "description": ds.description,
                    "tenant_id": ds.tenant_id,
                    "type": ds.type,
                    "is_active": ds.is_active,
                    "auto_sync": ds.auto_sync,
                    "is_main": ds.is_main,
                    "connection": {
                        "host": conn.host if conn else None,
                        "port": conn.port if conn else None,
                        "dbname": conn.dbname if conn else None,
                    },
                    "permissions": [
                        { 
                            "tenant_id": p.tenant_id,
                            "type": p.type,
                            "datasource_id": p.datasource_id,
                            "connection_id": p.datasource_connection_id,
                            "user_id": p.user_id, 
                            "role": p.role.value
                        } for p in permissions
                    ]
                }), 200

        else:
            dataSources:list[DataSource] = DataSource.query.filter(
                DataSource.tenant_id == tenant_id,
                DataSource.is_active == True
            ).all()
            datasources = sorted((dataSources or []), key=lambda c: c.id)

            results = []
            for datasource in datasources:
                data = datasource.to_dict()
                conn_conf = datasource.to_secure_forms_conf(use_docker=True)
                schemas_list = inspect_full_postgres_schema(conn_conf=conn_conf)
                data["details"] = schemas_list
                results.append(data)

            return jsonify(results), 200
    
    except SQLAlchemyError as e:
        logger.error(f"Failed to list connections: {str(e)}")
        raise BadRequest("Failed to list connections", 500)
    except Exception as e:
        raise

# UPDATE
@bp.put("/<string:datasource_id>")
@require_auth
def update_datasource(datasource_id):
    try:
        payload = request.get_json(silent=True)        
        
        if not payload:
            raise ValueError("payload body must be JSON")

        required = ["tenant_id", "type", "name", "technical_name", "host", "dbname", "username"]
        missing = [f for f in required if f not in payload]
        if missing:
            raise BadRequest(f"Missing fields: {', '.join(missing)}")

        data = DataSource.to_object_conf(payload) if payload else None
        if not data:
            raise BadRequest("Invalid JSON body")
        
        data_type=data.get("type")

        conn = data.get("connection") or {}
        ssh = data.get("ssh") or {}

        ds:DataSource = DataSourceProvisioningService.update_full_datasource(
            datasource_id=datasource_id,
            # DB fields
            tenant_id=data.get("tenant_id"),
            type=data_type,
            name=data.get("name"),
            technical_name=data.get("technical_name"),
            description=data.get("description"),
            #
            is_active=data.get("is_active"),
            auto_sync=data.get("auto_sync"),
            is_main=data.get("is_main"),
            # HOST
            host=conn.get("host"),
            port=int(conn.get("port") or 5432),
            dbname=conn.get("dbname"),
            username=conn.get("username"),
            password=conn.get("password"),
            # SSH config
            ssh_enabled=bool(ssh.get("enabled") or False),
            ssh_host=ssh.get("host"),
            ssh_port=int(ssh.get("port") or 22),
            # SSH auth
            ssh_username=ssh.get("username"),
            ssh_password=ssh.get("ssh_password"),
            ssh_key=ssh.get("ssh_key"),
            ssh_key_pass=ssh.get("ssh_key_pass"),

            permissions=data.get("permissions"),
            updated_by=currentUserId(),
        )

        return jsonify({"message": "Datasource updated", "id": ds.id}), 200

    except ValueError:
        return BadRequest("Datasource not found")
    except Exception:
        raise

# DELETE
@bp.delete("/<string:datasource_id>")
@require_auth
def delete_datasource(datasource_id):
    try:
        deleted_by = currentUserId(),

        DataSourceProvisioningService.delete_full_datasource(
            datasource_id=datasource_id,
            deleted_by_id=deleted_by,
        )

        return jsonify({"message": "Datasource deleted"}), 200

    except ValueError:
        raise BadRequest("Datasource not found", 404)
    except Exception as e:
        raise

# Test SSH tunnel
@bp.post("/test-ssh")
@require_auth
def test_ssh():
    payload = request.get_json(silent=True)

    tunnel_conf = DataSource.to_forms_conf(param=payload) if payload else None

    if not tunnel_conf or not tunnel_conf.get("ssh_enabled"):
        raise BadRequest("SSH not enabled for this connection")

    required = ["ssh_host", "ssh_host"]
    missing = [k for k in required if not tunnel_conf.get(k)]
    if missing:
        raise BadRequest(f"Missing SSH fields: {', '.join(missing)}")

    tunnel = None
    try:
        tunnel = create_ssh_tunnel(tunnel_conf=tunnel_conf)
        return jsonify({"status": "SSH tunnel OK"})
    except Exception as e:
        logger.error(f"SSH test failed: {str(e)}")
        raise BadRequest("SSH tunnel failed", 400)
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
    tunnel_conf = DataSource.to_forms_conf(payload, use_docker=True) if payload else None

    if connId:
        try:
            if not tunnel_conf:
                connData:DataSource = DataSource.query.filter_by(id=connId).first()
                tunnel_conf = connData.to_secure_forms_conf() if connData else None
        except Exception as e:
            raise BadRequest(f"Data getting failed ({e})", 404)
        
    if not tunnel_conf:
        raise BadRequest("Invalid JSON body or payload")

    ssh_enabled = bool(tunnel_conf.get("ssh_enabled", False))
    tunnel = None
    
    # Validate DB fields
    required_db = ["host", "port", "dbname", "username", "password"]
    missing_db = [k for k in required_db if not tunnel_conf.get(k)]
    if missing_db:
        raise BadRequest(f"Missing DB fields: {', '.join(missing_db)}")

    # Validate SSH fields
    if ssh_enabled:
        required_ssh = ["ssh_host", "ssh_port", "ssh_user"]
        missing_ssh = [k for k in required_ssh if not tunnel_conf.get(k)]
        if missing_ssh:
            raise BadRequest(f"Missing SSH fields: {', '.join(missing_ssh)}")

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
        raise BadRequest(user_message, 500)

    finally:
        if tunnel:
            tunnel.stop()

# SHEMA INFO
@bp.get("/schema-info")
@require_auth
def get_schema_info():

    conn = DataSource.ensure_default_connection()
    if not conn:
        raise BadRequest("PostgreSQL connection failed", 500)
    
    conn_conf = conn.to_secure_forms_conf(use_docker=True)
    EXCLUDED_TABLES = ["users","refresh_tokens","saved_queries"]
    schemas_list = inspect_full_postgres_schema(conn_conf=conn_conf,excluded_tables=EXCLUDED_TABLES)

    return jsonify(schemas_list), 200


# Explore schema
@bp.get("/schema/<string:source_id>")
@require_auth
def schema(source_id):
    conn:DataSource = DataSource.query.get(source_id)
    if not conn:
        raise ValueError(f"Schema exploration failed")
    return jsonify(explore_schema(conn.to_secure_forms_conf()))

# SSH HEALTH
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

# SSH AUTO CLEAN
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
























