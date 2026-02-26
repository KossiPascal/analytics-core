from backend.src.databases.extensions import db
from sqlalchemy.orm import declared_attr
from backend.src.logger import get_backend_logger
logger = get_backend_logger(__name__)



class AuditMixin:

    @declared_attr
    def created_by_id(cls):
        return db.Column(db.BigInteger, db.ForeignKey("users.id"), nullable=False)

    @declared_attr
    def created_by(cls):
        return db.relationship("User", foreign_keys=[cls.created_by_id])

    @declared_attr
    def created_at(cls):
        return db.Column(db.DateTime(timezone=True), server_default=db.func.now(), nullable=False)

    @declared_attr
    def updated_by_id(cls):
        return db.Column(db.BigInteger, db.ForeignKey("users.id"), nullable=True)

    @declared_attr
    def updated_at(cls):
        return db.Column(db.DateTime(timezone=True), onupdate=db.func.now(), nullable=True)

    @declared_attr
    def updated_by(cls):
        return db.relationship("User", foreign_keys=[cls.updated_by_id])

    @declared_attr
    def deleted(cls):
        return db.Column(db.Boolean, default=False, nullable=False)

    @declared_attr
    def deleted_at(cls):
        return db.Column(db.DateTime(timezone=True), nullable=True)

    @declared_attr
    def deleted_by_id(cls):
        return db.Column(db.BigInteger, db.ForeignKey("users.id"), nullable=True)

    @declared_attr
    def deleted_by(cls):
        return db.relationship("User", foreign_keys=[cls.deleted_by_id])

    @declared_attr
    def is_active(cls):
        return db.Column(db.Boolean, default=True, nullable=False, index=True)



class MetaxMixin:

    @declared_attr
    def is_active(cls):
        return db.Column(db.Boolean, nullable=False, default=True)

    @declared_attr
    def created_by(cls):
        return db.Column(db.BigInteger, nullable=True)

    @declared_attr
    def created_at(cls):
        return db.Column(db.DateTime(timezone=True), server_default=db.func.now())

    @declared_attr
    def updated_at(cls):
        return db.Column(db.DateTime(timezone=True), onupdate=db.func.now(), nullable=True)

    @declared_attr
    def updated_by(cls):
        return db.Column(db.BigInteger, nullable=True)

    @declared_attr
    def deleted(cls):
        return db.Column(db.Boolean, default=False, nullable=False)

    @declared_attr
    def deleted_at(cls):
        return db.Column(db.DateTime(timezone=True), nullable=True)

    @declared_attr
    def deleted_by(cls):
        return db.Column(db.BigInteger, nullable=True)



class WorkerControl(db.Model):
    __tablename__ = "worker_control"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), unique=True, nullable=False)  # ex: "couchdb_worker"
    status = db.Column(db.String(50), nullable=False, default="run")  # run / stop / pause
    last_updated = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())
