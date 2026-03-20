

from dataclasses import dataclass
from enum import Enum
from typing import Dict, Optional, Tuple, TypedDict, List
from backend.src.config import clean_base_url
from backend.src.databases.extensions import db
from backend.src.models.controls import MetaxMixin
from sqlalchemy import text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Session, selectinload
from shared_libs.helpers.utils import decrypt, encrypt
rate_limit_store: Dict[str, Tuple[int, int]] = {}  # client_id -> (count, first_ts)


class TargetTypes(str, Enum):
    COUCHDB = "cht"
    DHIS2 = "dhis2"

@dataclass
class ChtSources:
    chtdb: str
    localdb: str

CHT_SOURCE_TYPES: List[ChtSources] = [
    ChtSources("medic", "docs"),
    ChtSources("_users", "users"),
    ChtSources("medic-logs", "logs"),
    ChtSources("medic-sentinel", "metas"),
    ChtSources("medic-users-meta", "sentinel"),
    # {"chtdb": "medic",            "localdb": "docs"},
    # {"chtdb": "_users",           "localdb": "users"},
    # {"chtdb": "medic-logs",       "localdb": "logs"},
    # {"chtdb": "medic-sentinel",   "localdb": "metas"},
    # {"chtdb": "medic-users-meta", "localdb": "sentinel"}
]

def apply_tenant_scope(query, model, current_user):
    if current_user and current_user.is_superadmin:
        return query

    if hasattr(model, "tenant_id"):
        return query.filter(model.tenant_id == current_user.tenant_id)

    return query

# -------------------- TENANT --------------------
class Tenant(db.Model, MetaxMixin):
    __tablename__ = "tenants"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255), nullable=False, unique=True)
    options = db.Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    description = db.Column(db.String(255), nullable=True)

    sources = db.relationship("TenantSource", back_populates="tenant",lazy="noload", cascade="all, delete-orphan")

    users = db.relationship("User", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    datasets = db.relationship("Dataset", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    datasources = db.relationship("DataSource", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    visualizations = db.relationship("Visualization", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    visualization_charts = db.relationship("VisualizationChart", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    permissions = db.relationship("DataSourcePermission", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    fields = db.relationship("DatasetField", back_populates="tenant", cascade="all, delete-orphan")
    connections = db.relationship("DataSourceConnection", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    ssh_configs = db.relationship("DataSourceSSHConfig", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    credentials = db.relationship("DataSourceCredential", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    histories = db.relationship("DataSourceHistory", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    visualization_execution_logs = db.relationship("VisualizationExecutionLog", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    dhis2_validations = db.relationship("VisualizationDhis2Validation", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    data_lineages = db.relationship("DataLineage", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    ai_query_logs = db.relationship("AIQueryLog", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    scripts = db.relationship("Script", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    scripts_execution_logs = db.relationship("ScriptExecutionLog", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    orgunits        = db.relationship("UserOrgunit", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    orgunit_levels  = db.relationship("OrgUnitLevel", lazy="noload", cascade="all, delete-orphan")
    roles           = db.relationship("UserRole", back_populates="tenant", lazy="noload", cascade="all, delete-orphan")
    queries = db.relationship("DatasetQuery", back_populates="tenant",lazy="noload", cascade="all, delete-orphan")
    charts = db.relationship("DatasetChart", back_populates="tenant",lazy="noload", cascade="all, delete-orphan")


    def to_dict(self, include_relations:bool=False):
        data = {
            "id": self.id, 
            "name": self.name, 
            "options": self.options, 
            "description": self.description, 
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "deleted_at": self.deleted_at.isoformat() if self.deleted_at else None,
            "sources": [c.to_dict() for c in self.sources or []],
        }

        if include_relations:
            data.update({
                "users": [d.to_dict() for d in self.users],
                "datasets": [d.to_dict() for d in self.datasets],
                "datasources": [d.to_dict() for d in self.datasources],
                "visualizations": [d.to_dict() for d in self.visualizations],
                "visualization_charts": [d.to_dict() for d in self.visualization_charts],
                "permissions": [d.to_dict() for d in self.permissions],
                "fields": [d.to_dict() for d in self.fields],
                "connections": [d.to_dict() for d in self.connections],
                "ssh_configs": [d.to_dict() for d in self.ssh_configs],
                "credentials": [d.to_dict() for d in self.credentials],
                "histories": [d.to_dict() for d in self.histories],
                "visualization_execution_logs": [d.to_dict() for d in self.visualization_execution_logs],
                "dhis2_validations": [d.to_dict() for d in self.dhis2_validations],
                "data_lineages": [d.to_dict() for d in self.data_lineages],
                "ai_query_logs": [d.to_dict() for d in self.ai_query_logs],
                "scripts": [d.to_dict() for d in self.scripts],
                "scripts_execution_logs": [d.to_dict() for d in self.scripts_execution_logs],
                "orgunits": [d.to_dict() for d in self.orgunits],
                "roles": [d.to_dict() for d in self.roles],
                "queries": [d.to_dict() for d in self.queries],
                "charts": [d.to_dict() for d in self.charts],
            })

        return data
    
    @classmethod
    def active(cls):
        return cls.query.filter(cls.deleted.is_(False),cls.deleted_at.is_(None))

    
    def __repr__(self):
        return f"<Tenant {self.name}>"
    

class TenantSource(db.Model, MetaxMixin):
    __tablename__ = "tenant_sources"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255), nullable=False, unique=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=True)
    https = db.Column(db.Boolean, default=True, nullable=False)
    given_host = db.Column(db.Text, nullable=False, unique=True)
    target = db.Column(db.String(255), nullable=False, unique=True) # dhis2 | couchdb
    config = db.Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))

    last_sync = db.Column(db.DateTime(timezone=True), index=True)
    last_used_at = db.Column(db.DateTime(timezone=True), nullable=True)

    username_enc = db.Column(db.Text, nullable=False)
    password_enc = db.Column(db.Text, nullable=True)

    tenant = db.relationship("Tenant", back_populates="sources", lazy="noload", foreign_keys=[tenant_id])

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # chiffrage automatique si username/password passés au constructeur
        if 'username' in kwargs:
            self.username = kwargs['username']
        if 'password' in kwargs:
            self.password = kwargs['password']

    def to_dict(self, include_relations: bool = True):
        data = {
            "id": self.id,
            "name": self.name, 
            "tenant_id": self.tenant_id,
            "host": self.given_host,
            "https": self.https,
            "target": self.target,
            "is_active": self.is_active,
            "last_sync": self.last_sync.isoformat() if self.last_sync else None,
            "last_used_at": self.last_used_at.isoformat() if self.last_used_at else None,
            # "created_at": self.created_at.isoformat() if self.created_at else None,
            # "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            # "deleted_at": self.deleted_at.isoformat() if self.deleted_at else None,
        }

        if include_relations and self.tenant:
            data.update({"tenant": self.tenant.to_dict()})

        return data

    @property
    def base_url(self):
        return clean_base_url(self.given_host)
    
    @property
    def host(self):
        base = clean_base_url(self.given_host)
        protocole = 'https://' if self.https else 'http://'
        return f"{protocole}{base}"
    

    # Username property
    @property
    def username(self):
        return decrypt(self.username_enc) if self.username_enc else None

    @username.setter
    def username(self, value):
        self.username_enc = encrypt(value) if value else None

    # Password property
    @property
    def password(self):
        return decrypt(self.password_enc) if self.password_enc else None

    @password.setter
    def password(self, value):
        self.password_enc = encrypt(value) if value else None

    # Auth helper
    @property
    def auth(self):
        return self.username, self.password
    

    @staticmethod
    def list_by_target(tenant_id: str,target: str,is_active: Optional[bool] = True) -> list["TenantSource"]:
        query = TenantSource.query.filter(
            TenantSource.deleted == False,
            TenantSource.tenant_id == tenant_id,
            TenantSource.target == target.lower()
        )

        if is_active is not None:
            query = query.filter(TenantSource.is_active == is_active)

        return query.order_by(TenantSource.created_at).all()
    

    @staticmethod
    def getTenantSourceQuery(session:Session, target:Optional[TargetTypes]=TargetTypes.COUCHDB, tenant_id:Optional[int]=None, source_id:Optional[int]=None):        
        query = (
            session.query(TenantSource)
            .options(selectinload(TenantSource.tenant))
            .filter(
                TenantSource.deleted == False,
                TenantSource.is_active == True,
            )
        )
        if tenant_id:
            query = query.filter(TenantSource.tenant_id == tenant_id)

        if target:
            query = query.filter(TenantSource.target == target.value)

        if source_id:
            query = query.filter(TenantSource.id == source_id)

        return query

    def __repr__(self):
        return f"<TenantSource {self.host}>"


