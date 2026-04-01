# Encryption utils
# FERNET_KEY = Fernet.generate_key()
import ast
import asyncio
import json
import re
from backend.src.app.configs.environment import Config
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
    # return {k: v for k, v in doc.items() if not k.startswith("_")}

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

def clean_couchdb_doc(doc: dict) -> dict:
    return {
        k: v for k, v in doc.items()
        if not k.startswith("_")
    }

def run_async_job(coro):
    # def runner():
    #     loop = asyncio.new_event_loop()
    #     asyncio.set_event_loop(loop)
    #     loop.run_until_complete(coro)
    #     loop.close()

    # threading.Thread(target=runner, daemon=True).start()
    """
    Run a coroutine in background thread-safe.
    For Flask, prevents 'asyncio.run' inside an existing loop.
    """
    try:
        loop = asyncio.get_running_loop()
        return asyncio.create_task(coro)
    except RuntimeError:
        return asyncio.run(coro)
        
def validate_name(name:str)-> bool:
    VN = re.compile(r"^[a-z][a-z0-9_]{2,50}$")
    return VN.match(name) is not None
    # return bool(re.match(r"^[a-z][a-z0-9_]{2,}$", name))

def normalize_base_url(base_url: str, allow_http: bool = True) -> str:
    """
    Ensure base_url starts with http:// or https://
    Defaults to https:// if missing.
    """
    if not base_url:
        raise ValueError("base_url is required")

    base_url = base_url.strip()
    if base_url.startswith("http://") and not allow_http:
        raise ValueError("Insecure CouchDB URL (http) not allowed")

    if not base_url.startswith(("http://", "https://")):
        base_url = f"https://{base_url}"

    return base_url.rstrip("/")

def serializeContent(content, language=None):
    """
    Convertit n'importe quel contenu en string pour stockage en base de données.
    """
    if isinstance(content, (dict, list)):
        return json.dumps(content)
    elif isinstance(content, (int, float, bool)):
        return str(content)
    elif isinstance(content, str):
        return content
    else:
        return repr(content)  # fallback pour tout autre type

def deserializeContent(content_str, language=None):
    """
    Reconstruit le contenu à partir de la string en fonction du langage.
    """
    if not content_str:
        return None

    try:
        if language == "json":
            return json.loads(content_str)
        elif language == "python":
            # Utilise ast.literal_eval pour sécuriser l'évaluation de structures Python
            return ast.literal_eval(content_str)
        elif language in ("sql", "js", "javascript"):
            # Pour SQL ou JS, on ne peut que retourner le texte brut
            return content_str
        else:
            # fallback : renvoyer le texte brut
            return content_str
    except Exception:
        # fallback : renvoyer le texte brut si conversion échoue
        return content_str


