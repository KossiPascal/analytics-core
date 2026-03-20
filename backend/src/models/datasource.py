import re
import time
from dataclasses import dataclass
from typing import Dict, List, Optional
from enum import Enum
import unicodedata
from sqlalchemy import text
from backend.src.config import Config, clean_base_url
from backend.src.databases.extensions import db
from backend.src.models.tenant import Tenant
from backend.src.models.controls import AuditMixin
from shared_libs.helpers.utils import decrypt, encrypt, normalize_base_url
from sqlalchemy.orm import selectinload
from sqlalchemy.sql import quoted_name
from backend.src.logger import get_backend_logger
from backend.src.security.access_security import currentUserId

from sqlalchemy.dialects.postgresql import JSONB

logger = get_backend_logger(__name__)


# DTO / PARAMS
@dataclass(frozen=True)
class SSHParams:
    host: str
    port: int
    username: str
    password: Optional[str] = None
    key: Optional[str] = None
    key_pass: Optional[str] = None

@dataclass(frozen=True)
class DataSourceConnectionParams:
    id: Optional[str]
    type: str
    name: str
    dbname: str
    username: str
    password: Optional[str]
    host: str
    port: int
    ssh: Optional[SSHParams] = None

# SSH TUNNEL MANAGER
class SSHTunnelManager:
    _tunnels: Dict[str, tuple] = {}
    TTL = 300

    @classmethod
    def get(cls, key: str, creator):
        now = time.time()

        tunnel_data = cls._tunnels.get(key)
        if tunnel_data:
            tunnel, created_at = tunnel_data
            if getattr(tunnel, "is_active", False) and now - created_at < cls.TTL:
                return tunnel
            if hasattr(tunnel, "stop"):
                tunnel.stop()

        tunnel = creator()
        cls._tunnels[key] = (tunnel, now)
        return tunnel



class ConnectionStatus(str, Enum):
    PROD = "prod"
    DEV = "dev"
    STAGING = "staging"

class DataSourceRole(str, Enum):
    NONE = "none"  # revoke all
    READ = "read"
    WRITE = "write"
    ADMIN = "admin"
    OWNER = "owner"

    @classmethod
    def ordered_roles(cls):
        return [cls.NONE,cls.READ,cls.WRITE,cls.ADMIN,cls.OWNER]
    

IDENTIFIER_PATTERN = re.compile(r"^[a-zA-Z_][a-zA-Z0-9_]*$")

DEFAULT_DATA_SOURCE_TYPES = [
    {"code": "postgresql", "name": "PostgreSQL"},
    {"code": "mysql",      "name": "MySQL"},
    {"code": "mariadb",    "name": "MariaDB"},
    {"code": "mssql",      "name": "SQL Server"},
    {"code": "oracle",     "name": "Oracle"},
    {"code": "mongodb",    "name": "MongoDB"},
    {"code": "sqlite",     "name": "SQLite"},
    {"code": "other",      "name": "Autre"},
]

POSTGRES_ROLE_MAPPING: dict[str, list[str]] = {

    DataSourceRole.NONE.value: [
        "REVOKE ALL PRIVILEGES ON DATABASE {db} FROM {user}",
        "REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA {schema} FROM {user}",
        "REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA {schema} FROM {user}",
        "ALTER DEFAULT PRIVILEGES IN SCHEMA {schema} REVOKE ALL ON TABLES FROM {user}",
    ],

    DataSourceRole.READ.value: [
        "GRANT CONNECT ON DATABASE {db} TO {user}",
        "GRANT USAGE ON SCHEMA {schema} TO {user}",
        "GRANT SELECT ON ALL TABLES IN SCHEMA {schema} TO {user}",
        "ALTER DEFAULT PRIVILEGES IN SCHEMA {schema} GRANT SELECT ON TABLES TO {user}",
    ],

    DataSourceRole.WRITE.value: [
        "GRANT CONNECT ON DATABASE {db} TO {user}",
        "GRANT USAGE ON SCHEMA {schema} TO {user}",
        "GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA {schema} TO {user}",
        "GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA {schema} TO {user}",
        "ALTER DEFAULT PRIVILEGES IN SCHEMA {schema} "
        "GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO {user}",
    ],

    DataSourceRole.ADMIN.value: [
        "GRANT ALL PRIVILEGES ON DATABASE {db} TO {user}",
        "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA {schema} TO {user}",
        "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA {schema} TO {user}",
    ],

    DataSourceRole.OWNER.value: [
        "ALTER DATABASE {db} OWNER TO {user}",
    ],
}


class RoleEngine:

    @staticmethod
    def validate_role(role: str) -> str:
        if not role:
            return DataSourceRole.NONE

        allowed = {r.value for r in DataSourceRole}

        if not isinstance(role, str):
            raise ValueError("invalid role type")

        role = role.lower().strip()
        if role not in allowed:
            raise ValueError(f"Invalid role: {role}")

        return role

    @staticmethod
    def compute_effective_role(role: str) -> str:
        """ Return highest role only: OWNER > ADMIN > WRITE > READ > NONE """
        hierarchy = DataSourceRole.ordered_roles()
        indexes = hierarchy.index(DataSourceRole(role))

        return hierarchy[max(indexes)].value
    
class PostgresRoleAdapter:

    @staticmethod
    def _validate_identifier(value: str, label: str):
        if not IDENTIFIER_PATTERN.match(value):
            raise ValueError(f"Invalid {label} identifier")

    def sync(self,connection,db_name: str,db_user: str,role: str,schema: str = "public"):
        """ Idempotent sync: 1. Revoke all 2. Apply highest role """

        # Validate identifiers (anti-injection)
        self._validate_identifier(db_name, "database")
        self._validate_identifier(db_user, "user")
        self._validate_identifier(schema, "schema")

        # Validate role
        validated = RoleEngine.validate_role(role)
        effective = RoleEngine.compute_effective_role(validated)

        db = quoted_name(db_name, True),
        user = quoted_name(db_user, True),
        schema = quoted_name(schema, True),
        
        # Transaction-safe
        with connection.begin():
            # 1️⃣ Revoke all
            for stmt in POSTGRES_ROLE_MAPPING[DataSourceRole.NONE.value]:
                connection.execute(text(stmt.format(db=db,user=user,schema=schema)))

            # 2️⃣ Apply effective role
            for stmt in POSTGRES_ROLE_MAPPING[effective]:
                connection.execute(text(stmt.format(db=db,user=user,schema=schema)))

    @staticmethod
    def compute_effective_role(role: str) -> str:

        hierarchy = DataSourceRole.ordered_roles()
        highest_index = hierarchy.index(DataSourceRole(role))

        return [hierarchy[highest_index].value]

    @staticmethod
    def validate_role(role: str) -> str:

        allowed = {r.value for r in DataSourceRole}
        if not isinstance(role, str):
            raise ValueError("invalid role type")

        role = role.lower().strip()
        if role not in allowed:
            raise ValueError(f"Invalid role: {role}")

        return role


# DATASOURCE TYPE
class DataSourceType(db.Model, AuditMixin):
    __tablename__ = "datasource_types"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)  # order / display
    code = db.Column(db.String(50), unique=True, nullable=False, index=True)   # postgres, mysql…
    name = db.Column(db.String(100), unique=True, nullable=False)
    config = db.Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    description = db.Column(db.Text, nullable=True)

    datasources = db.relationship("DataSource", back_populates="type", cascade="all, delete-orphan")
    connections = db.relationship("DataSourceConnection", back_populates="type", cascade="all, delete-orphan")
    ssh_configs = db.relationship("DataSourceSSHConfig", back_populates="type", cascade="all, delete-orphan")
    credentials = db.relationship("DataSourceCredential", back_populates="type", cascade="all, delete-orphan")
    permissions = db.relationship("DataSourcePermission", back_populates="type", cascade="all, delete-orphan")
    histories = db.relationship("DataSourceHistory", back_populates="type", cascade="all, delete-orphan")

    def to_dict(self,include_relations=False):
        data = {
            "id": self.id,
            "code": self.code,
            "name": self.name,
            "config": self.config,
            "description": self.description,
            "is_active": self.is_active,
        }

        if include_relations:
            data.update({
                "datasources": [d.to_dict(include_relations=False) for d in self.datasources] if self.datasources else None,
                "connections": [d.to_dict(include_relations=False) for d in self.connections] if self.connections else None,
                "ssh_configs": [d.to_dict(include_relations=False) for d in self.ssh_configs] if self.ssh_configs else None,
                "credentials": [d.to_dict(include_relations=False) for d in self.credentials] if self.credentials else None,
                "permissions": [d.to_dict(include_relations=False) for d in self.permissions] if self.permissions else None,
                "histories": [d.to_dict(include_relations=False) for d in self.histories] if self.histories else None,
            })

            
        return data

    @staticmethod
    def ensure_default_type():
        try:
            existing:Dict[str,DataSourceType] = {t.code: t for t in DataSourceType.query.all()}
            changed = False

            for spec in DEFAULT_DATA_SOURCE_TYPES:
                current = existing.get(spec["code"])
                if not current:
                    spec["created_by_id"] = currentUserId()
                    db.session.add(DataSourceType(**spec))
                    changed = True
                else:
                    if current.name != spec["name"]:
                        current.name = spec["name"]
                        changed = True

            if changed:
                db.session.commit()

        except Exception as e:
            db.session.rollback()
            logger.error(f"Failed to ensure default datasource types: {str(e)}")
            raise

# DATASOURCE (LOGICAL CONTAINER)
class DataSource(db.Model, AuditMixin):
    __tablename__ = "datasources"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)  # keeps same type as TypeORM (text)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    type_id = db.Column(db.BigInteger,db.ForeignKey("datasource_types.id", ondelete="CASCADE", onupdate="CASCADE"),nullable=False)
    
    # Business name (free text)
    name = db.Column(db.String(255), nullable=False)
    # Technical name (strict)
    technical_name = db.Column(db.String(100), unique=True, nullable=False)

    description = db.Column(db.Text, nullable=True)
    auto_sync = db.Column(db.Boolean, default=False, nullable=False, index=True)
    is_main = db.Column(db.Boolean, default=False, nullable=False)  # ex: 

    last_sync = db.Column(db.DateTime(timezone=True), index=True)
    last_used_at = db.Column(db.DateTime(timezone=True), nullable=True)

    tenant = db.relationship("Tenant", back_populates="datasources",lazy="noload",foreign_keys=[tenant_id])
    type = db.relationship("DataSourceType", back_populates="datasources", uselist=False,lazy="noload",foreign_keys=[type_id])
    
    connection = db.relationship("DataSourceConnection", back_populates="datasource", uselist=False, cascade="all, delete-orphan")
    ssh_config = db.relationship("DataSourceSSHConfig", back_populates="datasource", uselist=False, cascade="all, delete-orphan")
    credential = db.relationship("DataSourceCredential", back_populates="datasource", uselist=False, cascade="all, delete-orphan")
    
    permissions = db.relationship("DataSourcePermission", back_populates="datasource", cascade="all, delete-orphan",lazy="noload")
    datasets = db.relationship("Dataset", back_populates="datasource", cascade="all, delete-orphan", lazy="noload")
    histories = db.relationship("DataSourceHistory",back_populates="datasource",cascade="all, delete-orphan",lazy="noload")
   
    
    __table_args__ = (
        # db.Index("ix_datasource_tenant_active", "tenant_id", "is_active"),
        # db.UniqueConstraint("tenant_id", "name", name="uq_datasource_name"),
        db.Index("ix_datasource_tenant", "tenant_id"),
        db.UniqueConstraint("tenant_id","name",name="uq_datasource_name_per_tenant"),
        db.UniqueConstraint("tenant_id","technical_name",name="uq_datasource_technical_per_tenant"),
    )

    @property    
    def base_host(self):
        conn = self.get_connection(ConnectionStatus.PROD)
        return (
            f"{normalize_base_url(conn.host)}:{conn.port}"
            if conn and conn.host and conn.port
            else None
        )

    @property    
    def base_url(self):
        base = self.base_host
        if not base:
            return None
        clean = clean_base_url(base)
        return f"https://{clean}" if clean else None

    @staticmethod
    def validate_technical_name(value: str) -> str:
        """
        Validate and normalize technical name.
        Rules:
        - lowercase
        - no spaces
        - only a-z, 0-9, _
        - must start with letter
        """
        if not value:
            raise ValueError("technical_name is required")
        value = value.strip().lower()
        # pattern = r"^[a-z][a-z0-9_]*$"
        pattern = r"^[a-z]"

        if not re.match(pattern, value):
            raise ValueError(
                "technical_name must start with a letter and contain only "
                "lowercase letters, numbers and underscores"
            )

        return value
    
    @staticmethod
    def generate_technical_name(name: str) -> str:
        value = unicodedata.normalize("NFKD", name)
        value = value.encode("ascii", "ignore").decode("ascii")
        value = value.lower()
        value = re.sub(r"[^a-z0-9]+", "_", value)
        value = re.sub(r"_+", "_", value)
        value = value.strip("_")

        if not re.match(r"^[a-z]", value):
            value = f"ds_{value}"

        return value

    @staticmethod
    def generate_technical_name_v2(name: str) -> str:
        value = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode("ascii")
        value = re.sub(r"[^\w\s-]", "", value).strip().lower()
        return re.sub(r"[-\s]+", "_", value)
    
    @staticmethod
    def to_object_conf(param: dict, use_docker:bool = False):

        default_host = Config.POSTGRES_HOST or param.get("host") or "127.0.0.1"
        default_port = int(Config.POSTGRES_PORT or param.get("port") or 5432)

        ssh_enabled = bool(param.get('ssh_enabled'))

        return {
            "id": param.get("id"),
            "tenant_id": param.get("tenant_id"),
            "type_id": param.get("type_id"),
            "name": param.get("name"),
            "technical_name": param.get("technical_name"),
            "description": param.get("description"),
            "is_active": param.get("is_active"),
            "auto_sync": param.get("auto_sync"),
            "is_main": param.get("is_main"),

            "connection": {
                "host": default_host if use_docker else param.get("host"),
                "port": default_port if use_docker else param.get("port"),
                "dbname": param.get("dbname"),
                "username": param.get("username"),
                "password": param.get("password"),
            },

            "ssh":{
                "enabled": ssh_enabled,
                "use_ssh_key": bool(param.get("ssh_key")) ,
                "host": param.get("ssh_host"),
                "port": param.get("ssh_port"),
                "username": param.get("ssh_username"),
                "password": param.get("ssh_password"),
                "key": param.get("ssh_key"),
                "key_pass": param.get("ssh_key_pass"),
            } if ssh_enabled else None
        }
    
    # {
    #   "name": "Prod Database",
    #   "description": "Main production DB",
    #   "connection": { "host": "10.0.0.10", "port": 5432, "dbname": "prod_db","username": "admin", "password": "secret" },
    #   "ssh": { "enabled": true, "host": "52.12.45.10", "port": 22, "username": "ubuntu", "private_key": "-----BEGIN PRIVATE KEY-----..." },
    #   "permissions": [ { "user_id": 1, "role": ["read"] }, { "user_id": 5, "role": [read] } ]
    # }

    @staticmethod
    def to_forms_conf(param: dict, use_docker:bool = False):
        ssh = param.get("ssh", {})

        default_host = Config.POSTGRES_HOST or param.get("host") or "127.0.0.1"
        default_port = int(Config.POSTGRES_PORT or param.get("port") or 5432)

        return {
            "id": param.get("id"),
            "tenant_id": param.get("tenant_id"),
            "type_id": param.get("type_id"),
            "name": param.get("name"),
            "technical_name": param.get("technical_name"),
            "description": param.get("description"),
            "host": default_host if use_docker else param.get("host"),
            "port": default_port if use_docker else param.get("port"),
            "dbname": param.get("dbname"),
            "username": param.get("username"),
            "password": param.get("password"),
            "ssh_enabled": bool(ssh),
            "use_ssh_key": bool(ssh.get("use_ssh_key", False)) ,
            "ssh_host": ssh.get("host"),
            "ssh_port": ssh.get("port"),
            "ssh_username": ssh.get("username"),
            "ssh_password": ssh.get("password"),
            "ssh_key": ssh.get("key"),
            "ssh_key_pass": ssh.get("key_pass"),
        }
    
    @staticmethod
    def to_params_conf(form: dict):
        return {
            "id": form.get("id"),
            "tenant_id": form.get("tenant_id"),
            "type_id": form.get("type_id"),
            "name": form.get("name"),
            "technical_name": form.get("technical_name"),
            "description": form.get("description"),
            "dbname": form.get("dbname"),
            "username": decrypt(form.get("username_enc")) if form.get("username_enc") else None,
            "password": decrypt(form.get("password_enc")) if form.get("password_enc") else None,
            "host": form.get("host"),
            "port": form.get("port"),
            "ssh": {
                "use_ssh_key": bool(form.get("use_ssh_key", False)),
                "host": form.get("ssh_host"),
                "port": form.get("ssh_port"),
                "username": decrypt(form.get("ssh_username_enc")) if form.get("ssh_username_enc") else None,
                "password": decrypt(form.get("ssh_password_enc")) if form.get("ssh_password_enc") else None,
                "key": decrypt(form.get("ssh_key_enc")) if form.get("ssh_key_enc") else None,
                "key_pass": decrypt(form.get("ssh_key_pass_enc")) if form.get("ssh_key_pass_enc") else None,
            } if bool(form.get("ssh_enabled", False)) else None
        }

    @staticmethod
    def ensure_default_datasource(created_by:int):
        try:
            conn:DataSource = DataSource.query.filter_by(is_main=True).first()
            if conn:
                return conn
            
            DataSourceType.ensure_default_type()
            tenant: Tenant = Tenant.query.filter_by(name=Config.DEFAULT_ADMIN.get("tenant_name", "")).first()
            
            if not tenant:
                raise ValueError("Default tenant not found")
            
            default_type_code = "postgresql"
            
            ds_type:DataSourceType = DataSourceType.query.filter_by(code=default_type_code).first()
            if not ds_type:
                DataSourceType.ensure_default_type()
                ds_type = DataSourceType.query.filter_by(code=default_type_code).first()

            source = DataSource(
                tenant_id = tenant.id,
                type_id = ds_type.id,
                name = "LOCAL POSTGRES",
                technical_name = "local_postgres",
                description = "LOCAL POSTGRES",
                auto_sync=False,
                is_main=True,
                is_active=True,
                created_by_id=created_by
            )

            db.session.add(source)
            db.session.flush()

            connection = DataSourceConnection(
                tenant_id = tenant.id,
                type_id = ds_type.id,
                datasource_id = source.id,
                status = ConnectionStatus.PROD,
                host = Config.POSTGRES_HOST,
                port = int(Config.POSTGRES_PORT or 5432),
                dbname = Config.POSTGRES_DB,
                ssh_enabled=False,
                is_active=True,
                created_by_id=created_by, 
            )

            db.session.add(connection)
            db.session.flush()

            credential = DataSourceCredential(
                tenant_id = tenant.id,
                type_id = ds_type.id,
                datasource_id = source.id,
                connection_id = connection.id,
                username_enc = encrypt(Config.POSTGRES_USER) if Config.POSTGRES_USER else None,
                password_enc = encrypt(Config.POSTGRES_PASSWORD) if Config.POSTGRES_PASSWORD else None, # POSTGRES_PASSWORD_RAW
                created_by_id=created_by, 
            )

            db.session.add(credential)
            db.session.flush()

            # source.connection = connection
            # source.credential = credential
            # dsConnection.upsert_data()

            db.session.commit()

            return DataSource.query.filter_by(is_main=True).first()

        except Exception as e:
            db.session.rollback()
            logger.error(f"Failed to ensure default DB connection: {str(e)}")
            raise

    @staticmethod
    def sources_list():
        """Return active CouchDB logical databases"""
        sources:list[DataSource] = DataSource.query.filter_by(is_active=True, auto_sync=True).all()
        return sources
    
    @staticmethod
    def list_full_datasources(tenant_id: Optional[int] = None) -> list["DataSource"]:
        query = DataSource.query.options(
            selectinload(DataSource.connection).selectinload(DataSourceConnection.ssh_config),
            selectinload(DataSource.credential),
            selectinload(DataSource.permissions),
        )

        if tenant_id:
            query = query.filter(DataSource.tenant_id == tenant_id)

        return query.order_by(DataSource.id).all()

    @staticmethod
    def list_full_datasources_dict(tenant_id: int | None = None) -> list[dict]:
        datasources:List[DataSource] = DataSource.list_full_datasources(tenant_id)
        result = []

        for ds in datasources:
            data = {
                "id": ds.id,
                "name": ds.name,
                "technical_name": ds.technical_name,
                "type_id": ds.type_id,
                "type": ds.type if ds.type else None,
                "is_active": ds.is_active,
            }
            
            conn_data = None
            conn:DataSourceConnection = ds.connection
            if conn:
                ssh:DataSourceSSHConfig = conn.ssh_config if conn.ssh_enabled and conn.ssh_config else None
                conn_data = {
                        "id": conn.id,
                        "status": conn.status,
                        "host": conn.host,
                        "port": conn.port,
                        "dbname": conn.dbname,
                        "ssh_enabled": conn.ssh_enabled,
                        "is_active": conn.is_active,
                        "ssh": {
                            "id": ssh.id,
                            "use_ssh_key": ssh.use_ssh_key,
                            "ssh_host": ssh.host,
                            "ssh_port": ssh.port,
                            "is_active": ssh.is_active,
                        } if ssh else None
                    } 

            data["connection"] = conn_data

            cred_data = None
            cred:DataSourceCredential = ds.credential
            if cred:
                cred_data = {
                    "id": cred.id,
                    "connection_id": cred.connection_id,
                    "is_active": cred.is_active,
                } 

            data["credential"] = cred_data
            
            perm_data = []
            permissions:List[DataSourcePermission] = ds.permissions
            for perm in permissions:
                perm_data.append({
                    "tenant_id": perm.tenant_id,
                    "tenant": perm.tenant.to_dict() if perm.tenant else None,
                    "user_id": perm.user_id,
                    "user": perm.user.to_dict() if perm.user else None,
                    "role": perm.role,
                })
            data["permission"] = perm_data

            result.append(data)

        return result


    def get_connection(self, status: ConnectionStatus = ConnectionStatus.PROD) -> Optional["DataSourceConnection"]:
        conn:DataSourceConnection = self.connection
        if not conn or conn.status != status or not conn.is_active:
            return None
        return conn
    
    def get_ssh_config(self, status: ConnectionStatus = ConnectionStatus.PROD) -> Optional["DataSourceSSHConfig"]:
        conn = self.get_connection(status)
        ssh: DataSourceSSHConfig = getattr(conn, "ssh_config", None) if conn else None
        return ssh if ssh and ssh.is_active else None
    
    def get_credential(self, status: ConnectionStatus = ConnectionStatus.PROD) -> Optional["DataSourceCredential"]:
        conn = self.get_connection(status)
        cred:DataSourceCredential = getattr(self, "credential", None)
        if not conn or not cred or cred.connection_id != conn.id or not cred.is_active:
            return None
        return cred

    def to_dict(self,include_relations:bool=False):
        status = ConnectionStatus.PROD
        conn = self.get_connection(status)
        ssh_config = self.get_ssh_config(status)

        return {
            "id": self.id,
            "type_id": self.type_id,
            "type": self.type.to_dict() if self.type else None,
            "tenant_id": self.tenant_id,
            "tenant": self.tenant.to_dict() if self.tenant else None,
            "name": self.name,
            "technical_name": self.technical_name,
            "description": self.description,
            "host": conn.host if conn else None,
            "port": conn.port if conn else None,
            "dbname": conn.dbname if conn else None,
            "base_url": self.base_url,
            "is_main": bool(self.is_main),
            "auto_sync": bool(self.auto_sync),
            "is_active": bool(self.is_active),
            "ssh_enabled": bool(conn and conn.ssh_enabled),
            "use_ssh_key": ssh_config.use_ssh_key if ssh_config and ssh_config.use_ssh_key is not None else False,
            "ssh_host": ssh_config.host if ssh_config else None,
            "ssh_port": ssh_config.port if ssh_config else None,
            "last_sync": self.last_sync.isoformat() if self.last_sync else None,
            "last_used_at": self.last_used_at.isoformat() if self.last_used_at else None,
        }
    
    def to_secure_forms_conf(self, use_docker:bool = False):
        status = ConnectionStatus.PROD
        conn = self.get_connection(status)
        ssh = self.get_ssh_config(status)
        cred = self.get_credential(status)

        default_host = Config.POSTGRES_HOST or (conn.host if conn else None) or "127.0.0.1"
        default_port = int(Config.POSTGRES_PORT or (conn.port if conn else 5432))

        return {
            "id": self.id,
            "type_id": self.type_id,
            "tenant_id": self.tenant_id,
            "name": self.name,
            "technical_name": self.technical_name,
            "description": self.description,
            "host": default_host if use_docker else (conn.host if conn else None),
            "port": default_port if use_docker else (conn.port if conn else None),
            "dbname": conn.dbname if conn else None,
            "username": decrypt(cred.username_enc) if cred and cred.username_enc else None,
            "password": decrypt(cred.password_enc) if cred and cred.password_enc else None,
            "ssh_enabled": bool(conn and conn.ssh_enabled),
            "use_ssh_key": bool(ssh and ssh.use_ssh_key),
            "ssh_host": ssh.host if ssh else None,
            "ssh_port": ssh.port if ssh else None,
            "ssh_username": decrypt(cred.ssh_username_enc) if cred and cred.ssh_username_enc else None,
            "ssh_password": decrypt(cred.ssh_password_enc) if cred and cred.ssh_password_enc else None,
            "ssh_key": decrypt(cred.ssh_key_enc) if cred and cred.ssh_key_enc else None,
            "ssh_key_pass": decrypt(cred.ssh_key_pass_enc) if cred and cred.ssh_key_pass_enc else None,
        }

    def __repr__(self):
        return f"<DataSource {self.name} ({self.type_id})>"
    
# CONNECTION (TECHNICAL INSTANCE)
class DataSourceConnection(db.Model, AuditMixin):
    __tablename__ = "datasource_connections"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    datasource_id = db.Column(db.BigInteger, db.ForeignKey("datasources.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    type_id = db.Column(db.BigInteger,db.ForeignKey("datasource_types.id", ondelete="CASCADE", onupdate="CASCADE"),nullable=False)
    
    status = db.Column(db.Enum(ConnectionStatus),default=ConnectionStatus.PROD,nullable=False)
    host = db.Column(db.String(255))
    port = db.Column(db.BigInteger)
    dbname = db.Column(db.String(255))

    ssh_enabled = db.Column(db.Boolean, default=False)

    tenant = db.relationship("Tenant", back_populates="connections",lazy="noload",foreign_keys=[tenant_id])
    type = db.relationship("DataSourceType", back_populates="connections",lazy="noload",foreign_keys=[type_id])

    datasource = db.relationship("DataSource", back_populates="connection",lazy="noload",foreign_keys=[datasource_id], uselist=False)
    credential = db.relationship("DataSourceCredential", back_populates="connection", uselist=False, cascade="all, delete-orphan")
    ssh_config = db.relationship("DataSourceSSHConfig", back_populates="connection", uselist=False, cascade="all, delete-orphan")
    
    permissions = db.relationship("DataSourcePermission",back_populates="connection",cascade="all, delete-orphan", lazy="noload")
    datasets = db.relationship("Dataset", back_populates="connection", cascade="all, delete-orphan", lazy="noload")
    histories = db.relationship("DataSourceHistory",back_populates="connection",cascade="all, delete-orphan", lazy="noload")
    
    __table_args__ = (
        db.UniqueConstraint("datasource_id","status",name="uq_datasource_status"),
        db.Index("ix_connection_datasource", "datasource_id"),
        db.Index("ix_connection_env_active", "datasource_id", "status", "is_active"),
    )

    def to_dict(self, include_relations:bool=False):
        return {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "datasource_id": self.datasource_id,
            "type_id": self.type_id,
            "status": self.status,
            "host": self.host,
            "port": self.port,
            "dbname": self.dbname,
            "ssh_enabled": self.ssh_enabled,
            "tenant": self.tenant.to_dict() if self.tenant else None,
            "type": self.type.to_dict() if self.type else None,
            "datasource": self.datasource.to_dict() if self.datasource else None,
            "credential": self.credential.to_dict() if self.credential else None,
            "ssh_config": self.ssh_config.to_dict() if self.ssh_config else None,
            "permissions": [h.to_dict() for h in self.permissions] if self.permissions else None,
            "datasets": [h.to_dict() for h in self.datasets] if self.datasets else None,
            "histories": [h.to_dict() for h in self.histories] if self.histories else None,
            "is_active": self.is_active,
        }

# SSH CONFIG
class DataSourceSSHConfig(db.Model, AuditMixin):
    __tablename__ = "datasource_ssh_configs"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    type_id = db.Column(db.BigInteger,db.ForeignKey("datasource_types.id", ondelete="CASCADE", onupdate="CASCADE"),nullable=False)
    datasource_id = db.Column(db.BigInteger, db.ForeignKey("datasources.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    connection_id = db.Column(db.BigInteger,db.ForeignKey("datasource_connections.id", ondelete="CASCADE", onupdate="CASCADE"),nullable=False,unique=True)
    # 🔒 jamais stocker la clé privée en clair
    use_ssh_key = db.Column(db.Boolean, default=True)
    host = db.Column(db.String(255), nullable=False)
    port = db.Column(db.BigInteger, default=22)

    tenant = db.relationship("Tenant", back_populates="ssh_configs",lazy="noload",foreign_keys=[tenant_id])
    type = db.relationship("DataSourceType", back_populates="ssh_configs",lazy="noload",foreign_keys=[type_id])

    datasource = db.relationship("DataSource", back_populates="ssh_config",lazy="noload",foreign_keys=[datasource_id], uselist=False)
    connection = db.relationship("DataSourceConnection", back_populates="ssh_config",lazy="noload",foreign_keys=[connection_id], uselist=False)
   
    credential = db.relationship("DataSourceCredential", back_populates="ssh_config", uselist=False, cascade="all, delete-orphan")

    def to_dict(self, include_relations=False):
        data = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "type_id": self.type_id,
            "datasource_id": self.datasource_id,
            "connection_id": self.connection_id,
            "use_ssh_key": self.use_ssh_key,
            "host": self.host,
            "port": self.port,
            "tenant": self.tenant.to_dict() if self.tenant else None,
            "type": self.type.to_dict() if self.type else None,
        }

        if include_relations:
            data.update({
                "datasource": self.datasource.to_dict(include_relations=False) if self.datasource else None,
                "connection": self.connection.to_dict(include_relations=False) if self.connection else None,
                "credential": self.credential.to_dict(include_relations=False) if self.credential else None,
            })

        return data

# CREDENTIAL
class DataSourceCredential(db.Model, AuditMixin):
    __tablename__ = "datasource_credentials"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    type_id = db.Column(db.BigInteger,db.ForeignKey("datasource_types.id", ondelete="CASCADE", onupdate="CASCADE"),nullable=False)
   
    datasource_id = db.Column(db.BigInteger, db.ForeignKey("datasources.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    ssh_config_id = db.Column(db.BigInteger, db.ForeignKey("datasource_ssh_configs.id", ondelete="CASCADE", onupdate="CASCADE"), unique=True, nullable=True)
    connection_id = db.Column(db.BigInteger, db.ForeignKey("datasource_connections.id", ondelete="CASCADE", onupdate="CASCADE"), unique=True, nullable=False)

    username_enc = db.Column(db.Text, nullable=False) # vault
    password_enc = db.Column(db.Text) # vault

    ssh_username_enc = db.Column(db.Text) # vault
    ssh_password_enc = db.Column(db.Text) # vault
    ssh_key_enc = db.Column(db.Text)  # vault
    ssh_key_pass_enc = db.Column(db.Text)

    tenant = db.relationship("Tenant", back_populates="credentials",lazy="noload",foreign_keys=[tenant_id])
    type = db.relationship("DataSourceType", back_populates="credentials",lazy="noload",foreign_keys=[type_id])

    datasource = db.relationship("DataSource", back_populates="credential",lazy="noload",foreign_keys=[datasource_id], uselist=False)
    ssh_config = db.relationship("DataSourceSSHConfig", back_populates="credential",lazy="noload",foreign_keys=[ssh_config_id], uselist=False)
    connection = db.relationship("DataSourceConnection", back_populates="credential",lazy="noload",foreign_keys=[connection_id], uselist=False)
    
    __table_args__ = (
        db.UniqueConstraint("connection_id", name="uq_credential_connection"),
    )
    
    @property
    def auth(self) -> tuple[str, str]:
        return (
            decrypt(self.username_enc) if self.username_enc else None,
            decrypt(self.password_enc) if self.password_enc else None,
        )
    
    # def validate(self):
    #     if not self.ssh_key_enc:
    #         raise ValueError("SSH key required")
    #     if not self.ssh_password_enc:
    #         raise ValueError("SSH password required")

    def to_dict(self, include_relations:bool=True):
        data = {
                "id": self.id,
                "tenant_id": self.tenant_id,
                "type_id": self.type_id,
                "datasource_id": self.datasource_id,
                "ssh_config_id": self.ssh_config_id,
                "connection_id": self.connection_id,
                "username": decrypt(self.username_enc) if self.username_enc else None,
                "password": decrypt(self.password_enc) if self.password_enc else None,
                "ssh_username": decrypt(self.ssh_username_enc) if self.ssh_username_enc else None,
                "ssh_password": decrypt(self.ssh_password_enc) if self.ssh_password_enc else None,
                "ssh_key": decrypt(self.ssh_key_enc) if self.ssh_key_enc else None,
                "ssh_key_pass": decrypt(self.ssh_key_pass_enc) if self.ssh_key_pass_enc else None,
                "tenant": self.tenant.to_dict() if self.tenant else None,
                "type": self.type.to_dict() if self.type else None,
                "is_active": self.is_active,
            }

        if include_relations:
            data.update({
                "datasource": self.datasource.to_dict(include_relations=False) if self.datasource else None,
                "ssh_config": self.ssh_config.to_dict(include_relations=False) if self.ssh_config else None,
                "connection": self.connection.to_dict(include_relations=False) if self.connection else None,
            })

        return data

# PERMISSION (1-1 AVEC CONNECTION)
class DataSourcePermission(db.Model, AuditMixin):
    __tablename__ = "datasource_permissions"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey('tenants.id', ondelete="CASCADE", onupdate="CASCADE"), nullable=False, index=True)
    type_id = db.Column(db.BigInteger, db.ForeignKey('datasource_types.id', ondelete="CASCADE", onupdate="CASCADE"), nullable=False, index=True)
    datasource_id = db.Column(db.BigInteger, db.ForeignKey("datasources.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False, index=True)
    connection_id = db.Column(db.BigInteger, db.ForeignKey("datasource_connections.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False, index=True)
    user_id = db.Column(db.BigInteger, db.ForeignKey("users.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False, index=True)

    tenant = db.relationship("Tenant", back_populates="permissions",lazy="noload",foreign_keys=[tenant_id])
    type = db.relationship("DataSourceType", back_populates="permissions",lazy="noload",foreign_keys=[type_id])
    user = db.relationship("User",back_populates="datasource_permissions",lazy="noload",foreign_keys=[user_id])

    datasource = db.relationship("DataSource", back_populates="permissions",lazy="noload",foreign_keys=[datasource_id])
    connection = db.relationship("DataSourceConnection", back_populates="permissions",lazy="noload",foreign_keys=[connection_id])
    
    histories = db.relationship("DataSourceHistory", back_populates="permission")

     # 🔥 UN SEUL ROLE EFFECTIF
    role = db.Column(
        db.Enum(DataSourceRole, name="datasource_role"),
        nullable=False,
        default=DataSourceRole.READ,
    )

    __table_args__ = (
        db.UniqueConstraint("datasource_id","user_id",name="uq_datasource_user"),
        # db.UniqueConstraint("connection_id", "user_id"),
    )

    def to_dict(self, include_relations:bool=True):
        data = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "type_id": self.type_id,
            "datasource_id": self.datasource_id,
            "connection_id": self.connection_id,
            "user_id": self.user_id,
            "tenant": self.tenant if self.tenant else None,
            "type": self.type if self.type else None,
            "user": self.user if self.user else None,
            "datasource": self.datasource if self.datasource else None,
            "connection": self.connection if self.connection else None,
            "role": self.role if self.role else None,
            "is_active": self.is_active,
        }

        if include_relations:
            data.update({
                "histories": [h.to_dict(include_relations=False) for h in self.histories] if self.histories else None,
            })

        return data

    def assign_role(self, role: str):
        role_enum = DataSourceRole(role)
        permission:DataSourcePermission = DataSourcePermission.query.filter(
            DataSourcePermission.user_id==self.user_id,
            DataSourcePermission.data_source_id==self.datasource_id
        ).first()
        
        if not permission:
            permission = DataSourcePermission(
                user_id=self.user_id,
                data_source_id=self.datasource_id,
                role=role_enum
            )
            db.session.add(permission)
        else:
            permission.role = role_enum

        db.session.commit()
        
    def assign_and_sync(self, db_name:str, db_user:str, role:str, pg_connection,schema: str = "public"):
        self.assign_role(role)
        adapter = PostgresRoleAdapter()
        adapter.sync(connection=pg_connection,db_name=db_name,db_user=db_user,role=role,schema=schema)
        
# AUDIT HISTORY
class DataSourceHistory(db.Model):
    __tablename__ = 'datasource_history'
    id = db.Column(db.BigInteger, primary_key=True)
    
    tenant_id = db.Column(db.BigInteger, db.ForeignKey('tenants.id', ondelete="CASCADE", onupdate="CASCADE"), nullable=False,index=True)
    type_id = db.Column(db.BigInteger, db.ForeignKey('datasource_types.id', ondelete="CASCADE", onupdate="CASCADE"), nullable=False,index=True)
    connection_id = db.Column(db.BigInteger,db.ForeignKey("datasource_connections.id", ondelete="CASCADE", onupdate="CASCADE"),nullable=False,index=True)
    datasource_id = db.Column(db.BigInteger, db.ForeignKey("datasources.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False,index=True)
    permission_id = db.Column(db.Integer, db.ForeignKey("datasource_permissions.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=True)
    user_id = db.Column(db.BigInteger, db.ForeignKey("users.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)

    action = db.Column(db.String)
    table_name = db.Column(db.String)
    record_id = db.Column(db.String)
    timestamp = db.Column(db.DateTime(timezone=True), server_default=db.func.now())

    tenant = db.relationship("Tenant", back_populates="histories",lazy="noload",foreign_keys=[tenant_id])
    type = db.relationship("DataSourceType", back_populates="histories",lazy="noload",foreign_keys=[type_id])

    connection = db.relationship("DataSourceConnection", back_populates="histories",lazy="noload",foreign_keys=[connection_id])
    permission = db.relationship("DataSourcePermission", back_populates="histories",lazy="noload",foreign_keys=[permission_id])
    datasource = db.relationship("DataSource", back_populates="histories",lazy="noload",foreign_keys=[datasource_id])

    user = db.relationship("User", back_populates="histories",lazy="noload",foreign_keys=[user_id])

    def to_dict(self, include_relations:bool=True):
        data = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "type_id": self.type_id,
            "connection_id": self.connection_id,
            "datasource_id": self.datasource_id,
            "permission_id": self.permission_id,
            "user_id": self.user_id,
            "action": self.action,
            "table_name": self.table_name,
            "record_id": self.record_id,
            "timestamp": self.timestamp,
        }

        if include_relations:
            data.update({
                "tenant": self.tenant.to_dict(include_relations=False) if self.tenant else None,
                "type": self.type.to_dict(include_relations=False) if self.type else None,
                "connection": self.connection.to_dict(include_relations=False) if self.connection else None,
                "permission": self.permission.to_dict(include_relations=False) if self.permission else None,
                "datasource": self.datasource.to_dict(include_relations=False) if self.datasource else None,
                "user": self.user.to_dict(include_relations=False) if self.user else None,
            })

        return data