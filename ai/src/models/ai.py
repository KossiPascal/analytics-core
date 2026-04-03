from database import db
from sqlalchemy import text
from sqlalchemy.dialects.postgresql import JSONB

class Policy(db.Model):
    id = db.Column(db.String(11), primary_key=True)
    effect = db.Column(db.String(10))  # allow / deny
    condition = db.Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
