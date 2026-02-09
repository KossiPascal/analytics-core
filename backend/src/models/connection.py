import time
from dataclasses import dataclass
from typing import Dict, Optional, Any
from sqlalchemy.dialects.postgresql import JSONB
from backend.src.config import Config
from backend.src.databases.extensions import db
from backend.src.logger import get_backend_logger
from shared_libs.helpers.utils import decrypt, encrypt

logger = get_backend_logger(__name__)


@dataclass(frozen=True)
class SSHParams:
    host: str
    port: int
    username: str
    password: Optional[str] = None
    key: Optional[str] = None
    key_pass: Optional[str] = None


@dataclass(frozen=True)
class DbConnectionParams:
    id: Optional[str]
    type: str
    name: str
    dbname: str
    username: str
    password: Optional[str]
    host: str
    port: int
    ssh: Optional[SSHParams] = None


class SSHTunnelManager:
    _tunnels: Dict[str, tuple] = {}
    TTL = 300

    @classmethod
    def get(cls, key: str, creator):
        now = time.time()

        tunnel_data = cls._tunnels.get(key)
        if tunnel_data:
            tunnel, created_at = tunnel_data
            if tunnel.is_active and now - created_at < cls.TTL:
                return tunnel
            tunnel.stop()

        tunnel = creator()
        cls._tunnels[key] = (tunnel, now)
        return tunnel


DEFAULT_DB_TYPES = [
    {"uid": 1, "id": "postgresql", "name": "PostgreSQL"},
    {"uid": 2, "id": "mysql", "name": "MySQL"},
    {"uid": 3, "id": "mariadb", "name": "MariaDB"},
    {"uid": 4, "id": "mssql", "name": "SQL Server"},
    {"uid": 5, "id": "oracle", "name": "Oracle"},
    {"uid": 6, "id": "mongodb", "name": "MongoDB"},
    {"uid": 7, "id": "couchdb", "name": "CouchDB"},
    {"uid": 8, "id": "sqlite", "name": "SQLite"},
    {"uid": 9, "id": "other", "name": "Autre"},
]


class ConnectionType(db.Model):
    __tablename__ = "db_connections_types"

    id = db.Column(db.String(50), primary_key=True)   # postgres, mysql…
    uid = db.Column(db.Integer, nullable=False, unique=True)  # order / display
    name = db.Column(db.String(100), nullable=False, unique=True)
    config = db.Column(JSONB)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), server_default=db.func.now())

    def to_public_dict(self):
        return {
            "id": self.id,
            "uid": self.uid,
            "name": self.name,
            "config": self.config,
            "is_active": self.is_active,
        }

    @staticmethod
    def ensure_default_type() -> list["ConnectionType"]:
        """
        Ensure default connection types exist and are aligned with DEFAULT_DB_TYPES.
        Idempotent and corrective.
        """
        try:
            existing: dict[str, ConnectionType] = {
                t.id: t for t in ConnectionType.query.all()
            }

            changed = False

            DB_TYPES = tuple(sorted(DEFAULT_DB_TYPES, key=lambda t: t["uid"]))

            for spec in DB_TYPES:
                ct = existing.get(spec["id"])

                if not ct:
                    db.session.add(ConnectionType(**spec))
                    changed = True
                else:
                    # 🔧 auto-correction si mismatch
                    if ct.uid != spec["uid"] or ct.name != spec["name"]:
                        ct.uid = spec["uid"]
                        ct.name = spec["name"]
                        changed = True

            if changed:
                db.session.commit()

            return ConnectionType.query.order_by(ConnectionType.uid).all()

        except Exception as e:
            db.session.rollback()
            logger.error(f"Failed to ensure default connection types: {str(e)}")
            raise


class DbConnection(db.Model):
    __tablename__ = "db_connections"

    id = db.Column(db.Integer, primary_key=True)
    type_id = db.Column(
        db.String(50),
        db.ForeignKey("db_connections_types.id", ondelete="CASCADE"),
        nullable=False
    )
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=True)
    host = db.Column(db.String(255), nullable=False)
    port = db.Column(db.Integer, nullable=False)
    dbname = db.Column(db.String(255), nullable=False)

    username_enc = db.Column(db.String(255), nullable=False)
    password_enc = db.Column(db.Text)

    ssh_enabled = db.Column(db.Boolean, default=False, nullable=False)
    ssh_host = db.Column(db.String(255))
    ssh_port = db.Column(db.Integer, default=22)

    ssh_username_enc = db.Column(db.String(255))
    ssh_password_enc = db.Column(db.Text)
    ssh_key_enc = db.Column(db.Text)
    ssh_key_pass_enc = db.Column(db.Text)

    is_active = db.Column(db.Boolean, default=True, nullable=False)

    action = db.Column(db.String(50), unique=True)  # ex: "main"



    def to_public_dict(self):
        return {
            "id": self.id,
            "type": self.type_id,
            "name": self.name,
            "description": self.description,
            "host": self.host,
            "port": self.port,
            "dbname": self.dbname,
            # "username": decrypt(self.username_enc) if self.username_enc else None,
            "ssh_enabled": self.ssh_enabled,
            "ssh_host": self.ssh_host,
            "ssh_port": self.ssh_port,
            # "ssh_username": decrypt(self.ssh_username_enc) if self.ssh_username_enc else None,
        }
    
    def to_secure_forms_conf(self, use_docker:bool = False):

        default_host = Config.POSTGRES_HOST or self.host or "127.0.0.1"
        default_port = int(Config.POSTGRES_PORT or self.port or 5432)

        return {
            "id": self.id,
            "type": self.type_id,
            "name": self.name,
            "description": self.description,
            "host": default_host if use_docker else self.host,
            "port": default_port if use_docker else self.port,
            "dbname": self.dbname,
            "username": decrypt(self.username_enc) if self.username_enc else None,
            "password": decrypt(self.password_enc) if self.password_enc else None,

            "ssh_enabled": self.ssh_enabled,
            "ssh_host": self.ssh_host,
            "ssh_port": self.ssh_port,
            "ssh_username": decrypt(self.ssh_username_enc) if self.ssh_username_enc else None,
            "ssh_password": decrypt(self.ssh_password_enc) if self.ssh_password_enc else None,
            "ssh_key": decrypt(self.ssh_key_enc) if self.ssh_key_enc else None,
            "ssh_key_pass": decrypt(self.ssh_key_pass_enc) if self.ssh_key_pass_enc else None,
        }
    
    def to_secure_params_conf(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "type": self.type_id,
            "name": self.name,
            "description": self.description,
            "host": self.host,
            "port": self.port,
            "dbname": self.dbname,
            "username": decrypt(self.username_enc),
            "password": decrypt(self.password_enc) if self.password_enc else None,
            "ssh": {
                "host": self.ssh_host,
                "port": self.ssh_port,
                "username": decrypt(self.ssh_username_enc) if self.ssh_username_enc else None,
                "password": decrypt(self.ssh_password_enc) if self.ssh_password_enc else None,
                "key": decrypt(self.ssh_key_enc) if self.ssh_key_enc else None,
                "key_pass": decrypt(self.ssh_key_pass_enc) if self.ssh_key_pass_enc else None,
            } if self.ssh_enabled else None,
        }

    @staticmethod
    def to_forms_conf(param: dict, use_docker:bool = False):
        ssh = param.get("ssh")

        default_host = Config.POSTGRES_HOST or param.get("host") or "127.0.0.1"
        default_port = int(Config.POSTGRES_PORT or param.get("port") or 5432)

        return {
            "id": param.get("id"),
            "type": param.get("type"),
            "name": param.get("name"),
            "description": param.get("description"),
            "host": default_host if use_docker else param.get("host"),
            "port": default_port if use_docker else param.get("port"),
            "dbname": param.get("dbname"),
            "username": param.get("username"),
            "password": param.get("password"),

            "ssh_enabled": ssh is not None,
            "ssh_host": ssh.get("host") if ssh else None,
            "ssh_port": ssh.get("port") if ssh else None,
            "ssh_username": ssh.get("username") if ssh else None,
            "ssh_password": ssh.get("password") if ssh else None,
            "ssh_key": ssh.get("key") if ssh else None,
            "ssh_key_pass": ssh.get("key_pass") if ssh else None,
        }
    
    @staticmethod
    def to_params_conf(form: dict):
        return {
            "id": form.get("id"),
            "type": form.get("type"),
            "name": form.get("name"),
            "description": form.get("description"),
            "dbname": form.get("dbname"),
            "username": decrypt(form.get("username_enc")) if form.get("username_enc") else None,
            "password": decrypt(form.get("password_enc")) if form.get("password_enc") else None,
            "host": form.get("host"),
            "port": form.get("port"),
            "ssh": {
                "host": form.get("ssh_host"),
                "port": form.get("ssh_port"),
                "ssh_username": decrypt(form.get("ssh_username_enc")) if form.get("ssh_username_enc") else None,
                "ssh_password": decrypt(form.get("ssh_password_enc")) if form.get("ssh_password_enc") else None,
                "ssh_key": decrypt(form.get("ssh_key_enc")) if form.get("ssh_key_enc") else None,
                "ssh_key_pass": decrypt(form.get("ssh_key_pass_enc")) if form.get("ssh_key_pass_enc") else None,
            } if form.get("ssh_enabled") else None
        }

    @staticmethod
    def ensure_default_connection():
        try:
            conn:DbConnection = DbConnection.query.filter_by(action="main").first()
            if conn:
                return conn
            
            ConnectionType.ensure_default_type()
                
            default = DbConnection(
                type_id = "postgres",
                name = "LOCAL POSTGRES",
                host = Config.POSTGRES_HOST,
                port = Config.POSTGRES_PORT,
                dbname = Config.POSTGRES_DB,
                username_enc = encrypt(Config.POSTGRES_USER),
                password_enc = encrypt(Config.POSTGRES_PASSWORD), # POSTGRES_PASSWORD_RAW
                action = "main"
            )

            db.session.add(default)
            db.session.commit()
            return default

        except Exception as e:
            db.session.rollback()
            logger.error(f"Failed to ensure default CouchDB DBs: {str(e)}")
            raise



