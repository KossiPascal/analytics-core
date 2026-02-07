import time
import secrets
import jwt
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from typing import Any, Dict, Tuple

from backend.src.config import Config

class TokenManagement:

    serializer: URLSafeTimedSerializer
    useJWT:bool


    def __init__(self, useJWT:bool=True):
        self.serializer = URLSafeTimedSerializer(secret_key=Config.JWT_SECRET_KEY,salt=Config.JWT_SECURITY_SALT)
        self.useJWT = useJWT

    def encode(self, payload: Dict[str, Any],expires_in_minutes: int | None = None,) -> Tuple[str, int]:
        """
        Encode un token avec JWT ou serializer.
        Retourne (token, expire_timestamp)
        """

        now = int(time.time())
        ttl = (expires_in_minutes or Config.ACCESS_TOKEN_EXPIRES_MINUTES) * 60
        expire = now + ttl

        payload = { **payload, "iat": now, "exp": expire, "jti": secrets.token_hex(8) }

        if self.useJWT:
            token = jwt.encode( payload, Config.JWT_SECRET_KEY, algorithm=Config.JWT_ALGORITHM)
        else:
            token = self.serializer.dumps(payload)

        return token, expire, payload


    def decode(self, token: str) -> Dict[str, Any]:
        """
        Décode un token JWT ou serializer.
        Lève une exception si invalide ou expiré.
        """

        if self.useJWT:
            return jwt.decode(token,Config.JWT_SECRET_KEY,algorithms=[Config.JWT_ALGORITHM])

        try:
            return self.serializer.loads(token,max_age=Config.ACCESS_TOKEN_EXPIRES_MINUTES * 60)
        except SignatureExpired:
            raise ValueError("Token expiré")
        except BadSignature:
            raise ValueError("Token invalide")
