from datetime import datetime, timezone
from backend.src.databases.extensions import db
from backend.src.logger import get_backend_logger

logger = get_backend_logger(__name__)

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
    timestamp = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))