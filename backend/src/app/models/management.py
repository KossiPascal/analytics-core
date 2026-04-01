from enum import Enum
from typing import Optional
from backend.src.app.configs.environment import clean_base_url
from backend.src.app.configs.extensions import db
from backend.src.app.models._controls import MetaxMixin
from sqlalchemy import text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Session, selectinload
from shared_libs.helpers.utils import decrypt, encrypt


class TargetTypes(str, Enum):
    COUCHDB = "cht"
    DHIS2 = "dhis2"


class Organisation(db.Model, MetaxMixin):
    __tablename__ = "organisations"

    id = db.Column(db.BigInteger, primary_key=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id"))

    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.String(255))

    tenant = db.relationship("Tenant", back_populates="organisations", foreign_keys=[tenant_id])
    regions = db.relationship("Region", back_populates="organisation", cascade="all, delete-orphan")
    countries = db.relationship("Country", back_populates="organisation", cascade="all, delete-orphan")
    team_templates = db.relationship("TeamTemplate", back_populates="organisation", cascade="all, delete-orphan")
    teams = db.relationship("Team", back_populates="organisation", cascade="all, delete-orphan")
    objectives = db.relationship("Objective", back_populates="organisation", cascade="all, delete-orphan")
    
    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "name": self.name,
            "description": self.description,
        }

        if include_relations:
            base.update({
                "tenant": self.tenant.to_dict(include_relations=False) if self.tenant else None,
                "regions": [v.to_dict(include_relations=False) for v in self.regions or []],
                "countries": [v.to_dict(include_relations=False) for v in self.countries or []],
                "team_templates": [v.to_dict(include_relations=False) for v in self.team_templates or []],
                "teams": [v.to_dict(include_relations=False) for v in self.teams or []],
                "objectives": [v.to_dict(include_relations=False) for v in self.objectives or []],
            })

        return base

class Region(db.Model, MetaxMixin):
    __tablename__ = "regions"

    id = db.Column(db.BigInteger, primary_key=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id"))
    organisation_id = db.Column(db.BigInteger, db.ForeignKey("organisations.id"))

    name = db.Column(db.String(255), nullable=False)
    code = db.Column(db.String(50))

    tenant = db.relationship("Tenant", back_populates="regions", lazy="noload", foreign_keys=[tenant_id])
    organisation = db.relationship("Organisation", back_populates="regions", lazy="noload", foreign_keys=[organisation_id])

    countries = db.relationship("Country", back_populates="region", cascade="all, delete-orphan")
    
    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "organisation_id": self.organisation_id,
            "name": self.name,
            "code": self.code,
        }

        if include_relations:
            base.update({
                "tenant": self.tenant.to_dict(include_relations=False) if self.tenant else None,
                "organisation": self.organisation.to_dict(include_relations=False) if self.organisation else None,
                "countries": [v.to_dict(include_relations=False) for v in self.countries or []],
            })

        return base

class Country(db.Model, MetaxMixin):
    __tablename__ = "countries"

    id = db.Column(db.BigInteger, primary_key=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id"))
    organisation_id = db.Column(db.BigInteger, db.ForeignKey("organisations.id"))
    region_id = db.Column(db.BigInteger, db.ForeignKey("regions.id"))

    name = db.Column(db.String(255), nullable=False)
    code = db.Column(db.String(50))
    
    tenant = db.relationship("Tenant", back_populates="regions", lazy="noload", foreign_keys=[tenant_id])
    organisation = db.relationship("Organisation", back_populates="countries", lazy="noload", foreign_keys=[organisation_id])
    region = db.relationship("Region", back_populates="countries", lazy="noload", foreign_keys=[region_id])

    teams = db.relationship("Team", back_populates="country", cascade="all, delete-orphan")
    
    def to_dict(self, include_relations=True):
        base = {
            "id": self.id,
            "tenant_id": self.tenant_id,
            "organisation_id": self.organisation_id,
            "region_id": self.region_id,
            "name": self.name,
            "code": self.code,
        }

        if include_relations:
            base.update({
                "tenant": self.tenant.to_dict(include_relations=False) if self.tenant else None,
                "organisation": self.organisation.to_dict(include_relations=False) if self.organisation else None,
                "region": self.region.to_dict(include_relations=False) if self.region else None,
                "teams": [v.to_dict(include_relations=False) for v in self.teams or []],
            })

        return base

class CountryDatasource(db.Model, MetaxMixin):
    __tablename__ = "country_datasource"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255), nullable=False, unique=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=True)
    fetch_limit = db.Column(db.BigInteger, nullable=False, server_default="2000")
    chunk_size = db.Column(db.BigInteger, nullable=False, server_default="1000")
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
    def list_by_target(tenant_id: str,target: str,is_active: Optional[bool] = True) -> list["CountryDatasource"]:
        query = CountryDatasource.query.filter(
            CountryDatasource.deleted == False,
            CountryDatasource.tenant_id == tenant_id,
            CountryDatasource.target == target.lower()
        )

        if is_active is not None:
            query = query.filter(CountryDatasource.is_active == is_active)

        return query.order_by(CountryDatasource.created_at).all()

    @staticmethod
    def getCountryDatasourceQuery(session:Session, target:Optional[TargetTypes]=TargetTypes.COUCHDB, tenant_id:Optional[int]=None, source_id:Optional[int]=None):        
        query = (
            session.query(CountryDatasource)
            .options(selectinload(CountryDatasource.tenant))
            .filter(
                CountryDatasource.deleted == False,
                CountryDatasource.is_active == True,
            )
        )
        if tenant_id:
            query = query.filter(CountryDatasource.tenant_id == tenant_id)

        if target:
            query = query.filter(CountryDatasource.target == target.value)

        if source_id:
            query = query.filter(CountryDatasource.id == source_id)

        return query

    def __repr__(self):
        return f"<CountryDatasource {self.host}>"
