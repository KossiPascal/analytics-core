from typing import Optional
import uuid
from datetime import datetime, timezone
from backend.src.databases.extensions import db,  deserializeContent, serializeContent 


class Script(db.Model):
    __tablename__ = "scripts"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255), unique=True, nullable=False, index=True)
    language = db.Column(db.String, nullable=False)
    _content = db.Column("content", db.Text, nullable=False)  # champ interne pour sérialisation
    owner_id = db.Column(db.String, nullable=True)
    updated_by = db.Column(db.String)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # --- Propriété content avec sérialisation automatique ---
    @property
    def content(self):
        return deserializeContent(self._content, self.language)

    @content.setter
    def content(self, value):
        self._content = serializeContent(value, self.language)

    # --- Constructeur ---
    def __init__(self, name: str, language: str, content, owner_id: Optional[str]):
                    # id: Optional[int], 
        # self.id = id if isinstance(id, int) else None
        self.name = name
        self.language = language.lower()
        self.content = content  # sera automatiquement sérialisé
        self.owner_id = owner_id

    # --- Dictionnaire pour API ou front-end ---
    def to_dict_safe(self):
        return {
            "id": self.id,
            "name": self.name,
            "language": self.language,
            "content": self.content,  # automatiquement désérialisé
            "owner": self.owner_id,
            "updated_by": self.updated_by,
            # "edit_only_content": True if self.name in (INDICATORS_SCRIPT_NAME,INDICATORS_INTO_SQL_NAME,INDICATORS_SQL_MATVIEW_TABLE_NAME,) else False,
        }

class ExecutionLog(db.Model):
    __tablename__ = "execution_logs"

    # id = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    script_id = db.Column(db.String)
    status = db.Column(db.String)
    output = db.Column(db.Text)
    duration = db.Column(db.Float)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)

