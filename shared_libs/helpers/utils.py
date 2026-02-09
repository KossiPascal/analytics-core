# Encryption utils
# FERNET_KEY = Fernet.generate_key()
import re
from backend.src.config import Config
from cryptography.fernet import Fernet

SQL_RESERVED = {"select", "table", "where", "group", "order"}


# 🔐 Crypto utils
def get_fernet() -> Fernet:
    FERNET_KEY = Config.FERNET_KEY.encode()
    return Fernet(FERNET_KEY)

def encrypt(value: str) -> str:
    if not value:
        raise ValueError("Cannot encrypt empty value")
    return get_fernet().encrypt(value.encode()).decode()

def decrypt(value: str) -> str:
    if not value:
        raise ValueError("Cannot decrypt empty value")
    return get_fernet().decrypt(value.encode()).decode()


# -------------------------------
# Utils CouchDB → Postgres
# -------------------------------
def normalize_base_url(base_url: str, allow_http: bool = True) -> str:
    if not base_url:
        raise ValueError("base_url is required")
    base_url = base_url.strip()
    if base_url.startswith("http://") and not allow_http:
        raise ValueError("Insecure CouchDB URL (http) not allowed")
    if not base_url.startswith(("http://", "https://")):
        base_url = f"https://{base_url}"
    return base_url.rstrip("/")

def sanitize_doc(doc: dict) -> dict:
    """Recursively sanitize CouchDB doc for Postgres"""
    def sanitize_value(v):
        if isinstance(v, bool):
            return int(v)
        if v is None:
            return ""
        if isinstance(v, dict):
            return {k: sanitize_value(val) for k, val in v.items()}
        if isinstance(v, list):
            return [sanitize_value(val) for val in v]
        return v
    return {k: sanitize_value(v) for k, v in doc.items()}

# 🔧 Normalisation SQL-safe
def normalize_name(name: str, max_len: int = 63) -> str:
    if not name or not isinstance(name, str):
        raise ValueError("Invalid name")

    name = name.strip().lower()
    name = re.sub(r"[^a-z0-9_]", "_", name)
    name = re.sub(r"__+", "_", name)

    if name[0].isdigit():
        name = f"t_{name}"

    if name in SQL_RESERVED:
        name = f"{name}_tbl"

    return name[:max_len]


