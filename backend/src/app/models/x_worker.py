
from enum import Enum
from typing import List
from sqlalchemy import text
from typing import Optional
from dataclasses import dataclass
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Session, selectinload
from backend.src.app.configs.extensions import db
from backend.src.app.models._controls import *
from shared_libs.helpers.utils import decrypt, encrypt
from backend.src.app.configs.environment import clean_base_url


@dataclass
class ChtSources:
    chtdb: str
    localdb: str

class TargetTypes(str, Enum):
    COUCHDB = "cht"
    DHIS2 = "dhis2"


class WorkerControl(db.Model, BaseModel, TimestampMixin):
    __tablename__ = "worker_control"
    __table_args__ = {"schema": "core"}

    name = db.Column(db.String(255), unique=True, nullable=False)  # ex: "couchdb_worker"
    status = db.Column(db.String(50), nullable=False, default="run")  # run / stop / pause

CHT_SOURCE_TYPES: List[ChtSources] = [
    ChtSources("medic", "docs"),
    ChtSources("_users", "users"),
    ChtSources("medic-logs", "logs"),
    ChtSources("medic-sentinel", "metas"),
    ChtSources("medic-users-meta", "sentinel"),
]


class HostLinks(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "host_links"
    __table_args__ = {"schema": "core"}
    
    name = db.Column(db.String(255), nullable=False, unique=True)
    fetch_limit = db.Column(db.String(11), nullable=False, server_default="2000")
    chunk_size = db.Column(db.String(11), nullable=False, server_default="1000")
    https = db.Column(db.Boolean, default=True, nullable=False)
    given_host = db.Column(db.Text, nullable=False, unique=True)
    target = db.Column(db.String(255), nullable=False, unique=True) # dhis2 | cht
    # target = db.Column(db.Enum(TargetTypes), nullable=False)
    config = db.Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    last_sync = db.Column(db.DateTime(timezone=True), index=True)
    last_used_at = db.Column(db.DateTime(timezone=True), nullable=True)

    username_enc = db.Column(db.Text, nullable=False)
    password_enc = db.Column(db.Text, nullable=True)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        
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
            "fetch_limit": self.fetch_limit,
            "chunk_size": self.chunk_size,
            "https": self.https,
            "target": self.target,
            "is_active": self.is_active,
            "last_sync": self.last_sync.isoformat() if self.last_sync else None,
            "last_used_at": self.last_used_at.isoformat() if self.last_used_at else None,
        }

        if include_relations and self.tenant:
            data.update({
                "tenant": self.tenant.to_dict() if self.tenant else None,
            })

        return data

    @property
    def base_url(self):
        return clean_base_url(self.given_host)
    
    @property
    def host(self):
        base = clean_base_url(self.given_host)
        protocole = 'https://' if self.https else 'http://'
        return f"{protocole}{base}"
    
    @property
    def username(self):
        return decrypt(self.username_enc) if self.username_enc else None

    @username.setter
    def username(self, value):
        self.username_enc = encrypt(value) if value else None

    @property
    def password(self):
        return decrypt(self.password_enc) if self.password_enc else None

    @password.setter
    def password(self, value):
        self.password_enc = encrypt(value) if value else None

    @property
    def auth(self):
        return self.username, self.password
    
    @staticmethod
    def list_by_target(tenant_id: str,target: str,is_active: Optional[bool] = True) -> list["HostLinks"]:
        query = HostLinks.query.filter(
            HostLinks.deleted == False,
            HostLinks.tenant_id == tenant_id,
            HostLinks.target == target.lower()
        )

        if is_active is not None:
            query = query.filter(HostLinks.is_active == is_active)

        return query.order_by(HostLinks.created_at).all()

    @staticmethod
    def getHostLinksQuery(session:Session, target:Optional[TargetTypes]=TargetTypes.COUCHDB, tenant_id:Optional[int]=None, source_id:Optional[int]=None):        
        query = (
            session.query(HostLinks)
            .options(selectinload(HostLinks.tenant))
            .filter(
                HostLinks.deleted == False,
                HostLinks.is_active == True,
            )
        )
        if tenant_id:
            query = query.filter(HostLinks.tenant_id == tenant_id)

        if target:
            query = query.filter(HostLinks.target == target.value)

        if source_id:
            query = query.filter(HostLinks.id == source_id)

        return query

    def __repr__(self):
        return f"<HostLinks {self.host}>"

