import time
import secrets
import jwt
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from typing import Any, Dict, Tuple

from backend.src.config import Config


serializer = URLSafeTimedSerializer(secret_key=Config.JWT_SECRET_KEY,salt=Config.JWT_SECURITY_SALT)

class TokenManagement:


    def __init__(self):
        pass

    @staticmethod
    def encode(payload: Dict[str, Any], expires_in_minutes: int | None = None, useJWT:bool=True) -> tuple[str, int, Dict[str, Any]]:
        """
        Encode un token avec JWT ou serializer.
        Retourne (token, expire_timestamp, payload_complet)
        """
        now = int(time.time())
        ttl = (expires_in_minutes or Config.ACCESS_TOKEN_EXPIRES_MINUTES) * 60
        expire = now + ttl

        full_payload = { **payload, "iat": now, "exp": expire, "jti": secrets.token_hex(8) }

        if useJWT:
            token = jwt.encode(full_payload, Config.JWT_SECRET_KEY, algorithm=Config.JWT_ALGORITHM)
        else:
            token = serializer.dumps(full_payload)

        return token, expire, full_payload

    @staticmethod
    def decode(token: str, useJWT:bool=True) -> Dict[str, Any]:
        """
        Décode un token JWT ou serializer.
        Lève une exception si invalide ou expiré.
        """
        if useJWT:
            try:
                return jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=[Config.JWT_ALGORITHM])
            except jwt.ExpiredSignatureError as e:
                raise ValueError(f"Token JWT expiré: {str(e)}")
            except jwt.InvalidTokenError as e:
                raise ValueError(f"Token JWT invalide: {str(e)}")

        try:
            return serializer.loads(token, max_age=Config.ACCESS_TOKEN_EXPIRES_MINUTES * 60)
        except SignatureExpired as e:
            raise ValueError(f"Token expiré: {str(e)}")
        except BadSignature as e:
            raise ValueError(f"Token invalide: {str(e)}")
        except Exception as e:
            raise ValueError(f"Token invalide ou expiré: {str(e)}")


