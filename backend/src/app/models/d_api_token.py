import hashlib
from datetime import datetime, timezone
from backend.src.app.models._controls import *
from backend.src.app.configs.extensions import db
from backend.src.modules.analytics.logger import get_backend_logger

logger = get_backend_logger(__name__)

class ApiToken(db.Model, BaseModel, TenantMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, StatusMixin):
    __tablename__ = "api_tokens"
    __table_args__ = {"schema": "core"}

    token_hash = db.Column(db.String(64),unique=True,nullable=False,index=True)
    last_used_at = db.Column(db.DateTime(timezone=True), nullable=True)
    revoked_at = db.Column(db.DateTime(timezone=True), nullable=True)

    @staticmethod
    def hash_token(token: str) -> str:
        """Hash sécurisé du token (SHA256)"""
        return hashlib.sha256(token.encode("utf-8")).hexdigest()

    @classmethod
    def create(cls, raw_token: str) -> "ApiToken":
        """Créer un token API depuis une valeur brute"""
        return cls(token_hash=cls.hash_token(raw_token),is_active=True)

    def revoke(self):
        self.is_active = False
        self.revoked_at = datetime.now(timezone.utc)

    def mark_used(self):
        self.last_used_at = datetime.now(timezone.utc)

    def is_valid(self) -> bool:
        return self.is_active and self.revoked_at is None

    def matches(self, raw_token: str) -> bool:
        return self.token_hash == self.hash_token(raw_token)

    def to_dict(self):
        return {
            "id": self.id,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat(),
            "last_used_at": self.last_used_at.isoformat() if self.last_used_at else None,
            "revoked_at": self.revoked_at.isoformat() if self.revoked_at else None,
        }

    def __repr__(self):
        return f"<ApiToken active={self.is_active}>"
