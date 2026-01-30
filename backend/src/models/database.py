from datetime import datetime
from database.extensions import db
from helpers.logger import get_logger

logger = get_logger(__name__)

# -----------------------------
# Models
# -----------------------------
class AuditHistory(db.Model):
    __tablename__ = 'audit_history'
    id = db.Column(db.Integer, primary_key=True)
    action = db.Column(db.String)
    table_name = db.Column(db.String)
    record_id = db.Column(db.String)
    user = db.Column(db.String)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)