from datetime import datetime
from sqlalchemy.orm import sessionmaker
from sqlalchemy.dialects.postgresql import JSONB
from database.extensions import engine
from database.extensions import db
# from sqlalchemy import Column, Integer, String, JSON, Text


SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

class CouchDBLastSeq(db.Model):
    __tablename__ = "couchdb_last_seq"

    id = db.Column(db.Integer, primary_key=True, autoincrement=False)  # correspond à TypeORM Primarydb.Column
    seq = db.Column(db.String, nullable=False)

class CouchDB(db.Model):
    __tablename__ = "couchdb"

    id = db.Column(db.Text, primary_key=True)
    doc = db.Column(JSONB, nullable=False)

class CouchDBUsers(db.Model):
    __tablename__ = "couchdb_users"

    id = db.Column(db.Text, primary_key=True)
    doc = db.Column(JSONB, nullable=False)

class CouchDBLogs(db.Model):
    __tablename__ = "couchdb_logs"

    id = db.Column(db.Text, primary_key=True)
    doc = db.Column(JSONB, nullable=False)

class CouchDBMetas(db.Model):
    __tablename__ = "couchdb_metas"

    id = db.Column(db.Text, primary_key=True)
    doc = db.Column(JSONB, nullable=False)

class CouchDBSentinel(db.Model):
    __tablename__ = "couchdb_sentinel"

    id = db.Column(db.Text, primary_key=True)
    doc = db.Column(JSONB, nullable=False)

class CouchDBLog(db.Model):
    __tablename__ = "couchdb_log"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    log = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.String, default=datetime.utcnow().isoformat)

class MigrationLog(db.Model):
    __tablename__ = "migration_log"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    log = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.String, default=datetime.utcnow().isoformat)

def get_repository(model):
    """ Equivalent of TypeORM repository getter """
    db = SessionLocal()
    return db, model

class CouchUser:
    def __init__(
        self, id: str, rev: str, name: str, type: str,
        email: str, phone: str, fullname: str, code: str,
        known: bool | None, contact_id: str, places: list[str], roles: list[str]
    ):
        self.id = id
        self.rev = rev
        self.name = name
        self.type = type
        self.email = email
        self.phone = phone
        self.fullname = fullname
        self.code = code
        self.known = known
        self.contact_id = contact_id
        self.places = places
        self.roles = roles
