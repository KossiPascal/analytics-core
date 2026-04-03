from typing import Optional
from backend.src.app.configs.extensions import db
from backend.src.app.models._controls import *
from shared_libs.helpers.utils import deserializeContent, serializeContent


class Script(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "scripts"
    __table_args__ = {"schema": "analy"}

    name = db.Column(db.String(255), unique=True, nullable=False, index=True)
    language = db.Column(db.String, nullable=False)
    _content = db.Column("content", db.Text, nullable=False)  # champ interne pour sérialisation

    scripts_execution_logs = db.relationship("ScriptExecutionLog", back_populates="script", cascade="all, delete-orphan")

    # --- Constructeur ---
    def __init__(self, name: str, language: str, content, owner_id: Optional[str]):
        self.name = name
        self.language = language.lower()
        self.content = content  # sera automatiquement sérialisé
        self.created_by_id = owner_id

    # --- Propriété content avec sérialisation automatique ---
    @property
    def content(self):
        return deserializeContent(self._content, self.language)

    @content.setter
    def content(self, value):
        self._content = serializeContent(value, self.language)

    # --- Dictionnaire pour API ou front-end ---
    def to_dict_safe(self, include_relations=True):
        base = {
            "id": self.id,
            "name": self.name,
            "language": self.language,
            "content": self.content,  # automatiquement désérialisé
            "owner": self.created_by_id,
            "updated_by": self.updated_by_id,
            # "edit_only_content": True if self.name in (INDICATORS_SCRIPT_NAME,INDICATORS_INTO_SQL_NAME,INDICATORS_SQL_MATVIEW_TABLE_NAME,) else False,
        }

        if include_relations:
            base.update({
                "tenant": self.tenant.to_dict(False) if self.tenant else None,
            })

        return base

class ScriptExecutionLog(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "scripts_execution_logs"
    __table_args__ = {"schema": "analy"}

    script_id = db.Column(db.String(11), db.ForeignKey("analy.scripts.id"), nullable=False)

    status = db.Column(db.String)
    output = db.Column(db.Text)
    duration = db.Column(db.Float)

    script = db.relationship("Script", back_populates="scripts_execution_logs", lazy="noload", foreign_keys=[script_id])

    # --- Dictionnaire pour API ou front-end ---
    def to_dict_safe(self, include_relations=True):
        base = {
            "id": self.id,
            "script": self.script,
            "status": self.status,
            "output": self.output,
            "duration": self.duration,
        }

        if include_relations:
            base.update({
                "tenant": self.tenant.to_dict(False) if self.tenant else None,
                "script": self.script.to_dict(False) if self.script else None,
            })

        return base
