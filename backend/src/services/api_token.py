import secrets
from backend.src.models.api_token import ApiToken

logger = __import__('logging').getLogger(__name__)

# -----------------------------
# Service class for API tokens
# -----------------------------
class ApiTokenService:
    MIN_LENGTH = 10
    MAX_ATTEMPTS = 10

    @staticmethod
    def generate_api_token(length: int) -> str:
        """Generate a secure random token"""
        return secrets.token_hex(length)[:length]

    @staticmethod
    def is_token_unique(token: str) -> bool:
        """Check if token hash does not exist in DB"""
        token_hash = ApiToken.hash_token(token)
        existing = ApiToken.query.filter_by(token_hash=token_hash).first()
        return existing is None

    @classmethod
    def generate_unique_api_token(cls, length: int = None) -> str:
        """Generate a unique token, retrying if collision occurs"""
        length = max(length or cls.MIN_LENGTH, cls.MIN_LENGTH)
        attempts = 0

        while attempts < cls.MAX_ATTEMPTS:
            token = cls.generate_api_token(length)
            if cls.is_token_unique(token):
                return token
            attempts += 1

        raise ValueError(f"Impossible de générer un token unique après {cls.MAX_ATTEMPTS} essais")

