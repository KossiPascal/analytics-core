import uuid
from database.extensions import db
from sqlalchemy.dialects.postgresql import UUID, JSONB

class DataConnection(db.Model):
    __tablename__ = "data_connections"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type = db.Column(db.String(50), nullable=False)  # couchdb | postgres | mysql
    name = db.Column(db.String(100), nullable=False, unique=True)
    config = db.Column(JSONB, nullable=False)
    active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
