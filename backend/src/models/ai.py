from sqlalchemy.dialects.postgresql import UUID
from database.extensions import db


class Policy(db.Model):
    id = db.Column(UUID(as_uuid=True), primary_key=True)
    effect = db.Column(db.String(10))  # allow / deny
    condition = db.Column(db.JSON)     # règles ou IA
