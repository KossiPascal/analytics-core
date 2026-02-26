
import hashlib
import secrets
from typing import Tuple
from passlib.hash import sha256_crypt
from backend.src.config import Config

DKLEN = 200_000
SHA256 = "sha256"

def hash_token(token: str) -> str:
    """Deterministic SHA256 hex digest for storing refresh tokens."""
    # return hashlib.sha256(token.encode("utf-8")).hexdigest()
    return hashlib.pbkdf2_hmac(SHA256,token.encode(),b"refresh-token-salt",DKLEN).hex()

def hash_password(password: str) -> Tuple[str, str]:
    if not password:
        raise ValueError("Password cannot be empty")
    if len(password) < Config.PASSWORD_MIN_LENGHT:
        raise ValueError("Password length must be >= 8")
    # Générer un salt sécurisé
    salt = secrets.token_bytes(16)  # 32 caractères hex
    # Générer le hash avec ce salt
    dk = hashlib.pbkdf2_hmac(SHA256, password.encode("utf-8"), salt, DKLEN)
    return salt.hex(), dk.hex()

def verify_password(password: str, salt_hex: str, stored_hash_hex: str) -> bool:
    salt = bytes.fromhex(salt_hex)
    dk = hashlib.pbkdf2_hmac(SHA256, password.encode("utf-8"), salt, DKLEN)
    return secrets.compare_digest(dk.hex(), stored_hash_hex)



# def hash_password(password: str) -> Tuple[str,str]:
#     if not password:
#         raise ValueError("Password cannot be empty")
#     if len(str(password)) < Config.PASSWORD_MIN_LENGHT:
#         raise ValueError("Password lenght must be >= 8")
#     return sha256_crypt.hash(password)

# def verify_password(password: str, password_hash: str) -> bool:
#     if not password or not password_hash:
#         return False
#     return sha256_crypt.verify(password, password_hash)