import re
import asyncio
import threading
from typing import Any, Dict, Optional
from flask import jsonify, request
from psycopg2 import connect, OperationalError
from backend.src.security.token_manager import TokenManagement
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from functools import wraps

from backend.src.config import Config
import json
import ast

from backend.src.logger import get_backend_logger
logger = get_backend_logger(__name__)

tokenManagement = TokenManagement(useJWT = True)

# Flask ORM (SYNC)
db = SQLAlchemy()

# Roles
ADMIN = "_admin"
SUPERADMIN = "_superadmin"
ADMIN_ROLES = (ADMIN, SUPERADMIN)

# 🔹 SYNC engine (Flask, migrations classiques)
engine = create_engine(Config.DATABASE_URL,echo=False,pool_pre_ping=False)
SyncSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


# 🔹 ASYNC engine (views refresh, sync couchdb, heavy jobs)
async_engine = create_async_engine(Config.ASYNC_DATABASE_URL,echo=False,future=True,pool_pre_ping=True,)
AsyncSessionLocal = async_sessionmaker(async_engine,class_=AsyncSession,expire_on_commit=False)
# AsyncSessionLocal = sessionmaker(bind=async_engine,class_=AsyncSession,expire_on_commit=False)


# Helpers
def isSuperAdmin(roles: list[str], permissions:list[str]) -> bool:
    return SUPERADMIN in permissions

def isAdmin(roles: list[str], permissions:list[str]) -> bool:
    return isSuperAdmin(roles, permissions) or  ADMIN in permissions

def get_connection():
    """
    Connexion PostgreSQL brute (psycopg2).
    À utiliser uniquement pour scripts legacy ou COPY.
    """
    try:
        conn = connect(
            host=Config.POSTGRES_HOST,
            port=Config.POSTGRES_PORT,
            database=Config.POSTGRES_DB,
            user=Config.POSTGRES_USER,
            password=Config.POSTGRES_PASSWORD_RAW,
        )
        conn.autocommit = True
        return conn
    except OperationalError as e:
        print(f"❌ PostgreSQL connection error: {e}")
        return None

# def get_couch():
#     server = couchdb.Server(current_src.config["COUCHDB_URI"])
#     return server

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
    

# -------------------- SANITIZE --------------------
def sanitize_doc(doc: dict):
    def sanitize_value(value):
        if isinstance(value, bool):
            return int(value)
        if value is None:
            return ""
        if isinstance(value, dict):
            return {k: sanitize_value(v) for k, v in value.items()}
        if isinstance(value, list):
            return [sanitize_value(v) for v in value]
        return value
    return {k: sanitize_value(v) for k, v in doc.items()}
    # return {k: v for k, v in doc.items() if not k.startswith("_")}


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



# -------------------------------------------------------------------
# Utils
# -------------------------------------------------------------------

def error_response(message: str, status: int = 400):
    logger.warning(message)
    return jsonify({"status": "error", "message": message}), status

def success_response(data: Any = None, status: int = 200):
    return jsonify({"status": "success","data": data}), status

def get_json_payload() -> Dict[str, Any]:
    if not request.is_json:
        raise ValueError("Request body must be JSON")
    return request.get_json(silent=True) or {}

class CouchdbSourceMap:
    def __init__(self, payload:Optional[Dict[str, Any]]):

        if not payload:
            raise ValueError("payload body must be JSON")
        
        self.id: str = payload.get("id") or None
        self.name: str = payload.get("name")
        self.description: str = payload.get("description")
        self.host: str = payload.get("host")

        if not self.name or not self.host:
            raise ValueError("project_name and couchdb_host is required")

        self.port: str = payload.get("port") or '443'
        self.username: str = payload.get("username")
        self.password: str = payload.get("password")
        self.is_active: str = payload.get("is_active") or True
        self.test_db: str = payload.get("test_db")
        self.auto_sync: bool = bool(payload.get("auto_sync", False))
        
        # auth_root = f"{self.username}:{self.password}@" if (self.username and self.password) else ""
        base_host = f"{normalize_base_url(self.host)}:{self.port}"
        # self.base_url = (f"https://{auth_root}{base_host.replace('https://','').replace('http://','')}")
        self.base_url = (f"https://{base_host.replace('https://','').replace('http://','')}")

