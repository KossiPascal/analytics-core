from sqlalchemy import create_engine, inspect, text
from sqlalchemy.exc import SQLAlchemyError
from sshtunnel import SSHTunnelForwarder
from urllib.parse import quote_plus
from config import Config
from cryptography.fernet import Fernet
import sqlparse
from typing import Dict, Any, List, Optional
import paramiko
import tempfile, os
import time


from helpers.logger import get_logger
logger = get_logger(__name__)

class SSHTunnelManager:
    _tunnels: Dict[str, tuple] = {}
    TTL = 300  # 5 minutes

    @classmethod
    def get(cls, key: str, creator):
        now = time.time()

        if key in cls._tunnels:
            tunnel, created_at = cls._tunnels[key]
            if tunnel.is_active and now - created_at < cls.TTL:
                return tunnel
            tunnel.stop()

        tunnel = creator()
        cls._tunnels[key] = (tunnel, now)
        return tunnel



# Encryption utils
# FERNET_KEY = Fernet.generate_key()
FERNET_KEY = Config.FERNET_KEY.encode()
fernet = Fernet(FERNET_KEY)

def encrypt(value: str) -> str:
    return fernet.encrypt(value.encode()).decode()

def decrypt(value: str) -> str:
    return fernet.decrypt(value.encode()).decode()

# Allowed aggregations
ALLOWED_AGGS = {"sum": "SUM", "avg": "AVG", "count": "COUNT", "min": "MIN", "max": "MAX"}

ALLOWED_OPS = {"=", "!=", ">", "<", ">=", "<=", "LIKE", "IN"}

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
    ssh_user = tunnel_conf.get("ssh_user")
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
        "ssh_username": ssh_user,
        "allow_agent": False,
    }

    # PRIVATE KEY AUTH
    if ssh_key:
        try:
            key_data = decrypt(ssh_key)
        except Exception:
            key_data = ssh_key
        key_file = tempfile.NamedTemporaryFile(mode="w",delete=False,prefix="ssh_key_")
        key_file.write(key_data)
        key_file.close()

        key_file_path = key_file.name

        try:
            pkey_password = decrypt(ssh_key_pass) if ssh_key_pass else None
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
            ssh_kwargs["ssh_password"] = decrypt(ssh_password)
        except Exception:
            ssh_kwargs["ssh_password"] = ssh_password

        logger.info("Using SSH password authentication")

    else:
        raise ValueError("SSH authentication required (password or private key)")

    # Create SSH tunnel
    host = "127.0.0.1"
    port = 5432

    logger.info("Opening SSH tunnel %s@%s:%s → %s:%s",ssh_user,ssh_host,ssh_port,host,port)
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

        password = quote_plus(decrypt(conn["password"]))  # 🔥 IMPORTANT

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
