import uuid
from backend.src.database.extensions import db
from sqlalchemy.dialects.postgresql import UUID, JSONB

class DataConnection(db.Model):
    __tablename__ = "data_connections"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type = db.Column(db.String(50), nullable=False)  # couchdb | postgres | mysql
    name = db.Column(db.String(100), nullable=False, unique=True)
    config = db.Column(JSONB, nullable=False)
    active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

class DbConnection(db.Model):
    __tablename__ = "db_connections"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    # DB
    name = db.Column(db.String(120), nullable=False)
    host = db.Column(db.String(255), nullable=False)
    port = db.Column(db.Integer, nullable=False)
    dbname = db.Column(db.String(255), nullable=False)
    username = db.Column(db.String(255), nullable=False)
    password = db.Column(db.Text, nullable=False)
    # SSH
    ssh_enabled = db.Column(db.Boolean, default=False)
    ssh_host = db.Column(db.String(255))
    ssh_port = db.Column(db.Integer, default=22)
    ssh_user = db.Column(db.String(255))
    # Auth SSH (2 modes)
    ssh_password = db.Column(db.Text)    # optionnel
    ssh_key = db.Column(db.Text) # 🔥 NOUVEAU
    ssh_key_pass = db.Column(db.Text)

    # --- Constructeur ---
    def __init__(self, name: str,host: str,port: int,db: str,user: str,pwd: str,ssh_enabled: bool,ssh_host: str,ssh_port: int,ssh_user: str,ssh_pwd: str,ssh_pk: str,ssh_pkp: str):
        self.name = name
        self.host = host
        self.port = port
        self.dbname = db
        self.username = user
        self.password = pwd
        self.ssh_enabled = ssh_enabled
        self.ssh_host = ssh_host
        self.ssh_port = ssh_port
        self.ssh_user = ssh_user
        self.ssh_password = ssh_pwd
        self.ssh_key = ssh_pk
        self.ssh_key_pass = ssh_pkp

    def to_dict_safe(self):
        return {
            "id": self.id,
            "name": self.name,
            "host": self.host,
            "port": self.port,
            "dbname": self.dbname,
            "username": self.username,
            "ssh_enabled": self.ssh_enabled,
            "ssh_host": self.ssh_host,
            "ssh_port": self.ssh_port,
            "ssh_user": self.ssh_user,
        }
    
    def to_full_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "host": self.host,
            "port": self.port,
            "dbname": self.dbname,
            "username": self.username,
            "password": self.password,
            "ssh_enabled": self.ssh_enabled,
            "ssh_host": self.ssh_host,
            "ssh_port": self.ssh_port,
            "ssh_user": self.ssh_user,
            "ssh_password": self.ssh_password,
            "ssh_key": self.ssh_key,
            "ssh_key_pass": self.ssh_key_pass,
        }


