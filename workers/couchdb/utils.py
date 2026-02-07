# --- Constantes ---
import re

DEFAULT_LIMIT = 2000
TIMEOUT = 60
SYNC_IDLE_SLEEP = 3
ERROR_RETRY_BASE = 5
SQL_RESERVED = {"select", "table", "where", "group", "order"}
EXCLUDED_PATTERNS = [
    r"^target~.*~org\.couchdb\.user",
    r"^settings",
    r"^service-worker-meta",
    r"^resources",
    r"^privacy-policies",
    r"^partners",
    r"^migration-log",
    r"^form:",
    r"^_design",
    r"^extension-libs",
    r"^messages-"
]

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


