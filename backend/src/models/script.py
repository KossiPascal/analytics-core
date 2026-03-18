from typing import Optional
from backend.src.databases.extensions import db
from backend.src.models.controls import AuditMixin
from shared_libs.helpers.utils import deserializeContent, serializeContent


class Script(db.Model, AuditMixin):
    __tablename__ = "scripts"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255), unique=True, nullable=False, index=True)
    language = db.Column(db.String, nullable=False)
    _content = db.Column("content", db.Text, nullable=False)  # champ interne pour sérialisation

    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id"), nullable=False)
    tenant = db.relationship("Tenant", back_populates="scripts",lazy="noload",foreign_keys=[tenant_id])
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
    def to_dict_safe(self):
        return {
            "id": self.id,
            "name": self.name,
            "language": self.language,
            "content": self.content,  # automatiquement désérialisé
            "owner": self.created_by_id,
            "updated_by": self.updated_by_id,
            # "edit_only_content": True if self.name in (INDICATORS_SCRIPT_NAME,INDICATORS_INTO_SQL_NAME,INDICATORS_SQL_MATVIEW_TABLE_NAME,) else False,
        }

class ScriptExecutionLog(db.Model, AuditMixin):
    __tablename__ = "scripts_execution_logs"

    # id = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    tenant_id = db.Column(db.BigInteger, db.ForeignKey("tenants.id"), nullable=False)
    script_id = db.Column(db.BigInteger, db.ForeignKey("scripts.id"), nullable=False)

    tenant = db.relationship("Tenant", back_populates="scripts_execution_logs")
    script = db.relationship("Script", back_populates="scripts_execution_logs")

    status = db.Column(db.String)
    output = db.Column(db.Text)
    duration = db.Column(db.Float)
