from datetime import datetime, timezone
from backend.src.databases.extensions import db
from backend.src.logger import get_backend_logger

from shared_libs.helpers.utils import decrypt
logger = get_backend_logger(__name__)



DEFAULT_COUCHDB_DBS = [
    {"id": 1, "local_name": "docs", "host_name": "medic"},
    {"id": 2, "local_name": "users", "host_name": "_users"},
    {"id": 3, "local_name": "logs", "host_name": "medic-logs"},
    {"id": 4, "local_name": "metas", "host_name": "medic-sentinel"},
    {"id": 5, "local_name": "sentinel", "host_name": "medic-users-meta"},
]   



# CouchDB logical database (list of DBs)
class CibleDatabase(db.Model):
    __tablename__ = "couchdb_sync_cibles"

    id = db.Column(db.Integer, primary_key=True)
    local_name = db.Column(db.String(255), nullable=False, unique=True)
    host_name = db.Column(db.String(255), nullable=False)
    type = db.Column(db.String(50), nullable=False, index=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)

    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), onupdate=datetime.utcnow)
    
    @staticmethod
    def full_db_names(self):
        """Return active logical databases"""
        couchdbs:list[CibleDatabase] = CibleDatabase.query.filter_by(is_active=True).all()
        return couchdbs
    
    @staticmethod
    def couchdb_names():
        """Return active CouchDB logical databases"""
        couchdbs:list[CibleDatabase] = CibleDatabase.query.filter_by(is_active=True, type="couchdb").all()
        return couchdbs
    
    @staticmethod
    def ensure_default_couchdb_dbs():
        try:
            couchdbs:list[CibleDatabase] = CibleDatabase.query.filter_by(type="couchdb").all()
            existing = { d.local_name for d in couchdbs }
            if not existing:
                for dbn in DEFAULT_COUCHDB_DBS:
                    if dbn["local_name"] :
                        db.session.add(CibleDatabase(local_name=dbn["local_name"],host_name=dbn["host_name"],type="couchdb",is_active=True))

                db.session.commit()
        except Exception as e:
            db.session.rollback()
            logger.error(f"Failed to ensure default CouchDB DBs: {str(e)}")
            raise

    def __repr__(self):
        return f"<CibleDatabase {self.local_name} ({self.type})>"

# CouchDB Source Definition
class CouchdbSource(db.Model):
    __tablename__ = "couchdb_sources"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255), unique=True, nullable=False)
    
    description = db.Column(db.Text, nullable=True)

    host = db.Column(db.String(512), nullable=False)
    base_url = db.Column(db.String(512), nullable=False)
    port = db.Column(db.Integer, default=5984, nullable=False)

    username_enc = db.Column(db.Text, nullable=False)
    password_enc = db.Column(db.Text, nullable=False)

    auto_sync = db.Column(db.Boolean, default=True, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)

    dbname = db.Column(db.String(255), nullable=False)

    last_sync = db.Column(db.DateTime(timezone=True), nullable=True)
    last_used_at = db.Column(db.DateTime(timezone=True), nullable=True)

    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), onupdate=datetime.utcnow, nullable=True)

    # Relationships
    # last_sync_state = db.relationship("SourceLastSyncState", back_populates="source", uselist=False, cascade="all, delete-orphan")
    # sync_logs = db.relationship("SyncLog", back_populates="source", cascade="all, delete-orphan")

    @property
    def auth(self) -> tuple[str, str]:
        return (decrypt(self.username_enc),decrypt(self.password_enc))
    
    @staticmethod
    def sources_list():
        """Return active CouchDB logical databases"""
        sources:list[CouchdbSource] = CouchdbSource.query.filter_by(is_active=True, auto_sync=True).all()
        return sources
    
    def __repr__(self):
        return f"<CouchdbSource(id={self.id}, name={self.name}, dbname={self.dbname})>"

    def to_dict_safe(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "host": self.host,
            "base_url": self.base_url,
            "port": self.port,
            "auto_sync": self.auto_sync,
            "is_active": self.is_active,
            "dbname": self.dbname,
            "last_sync": self.last_sync.isoformat() if self.last_sync else None,
            "last_used_at": self.last_used_at.isoformat() if self.last_used_at else None,
        }
