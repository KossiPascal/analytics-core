from psycopg2 import connect, OperationalError
from security.token_manager import TokenManagement
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from config import Config
import json
import ast

tokenManagement = TokenManagement(useJWT = True)

# -----------------------
# Flask ORM (SYNC)
# -----------------------
db = SQLAlchemy()

# -----------------------
# Roles
# -----------------------
ADMIN = "_admin"
SUPERADMIN = "_superadmin"
ADMIN_ROLES = (ADMIN, SUPERADMIN)

# -----------------------
# SQLAlchemy engines
# -----------------------

# 🔹 SYNC engine (Flask, migrations classiques)
engine = create_engine(Config.DATABASE_URL,echo=False,pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


# 🔹 ASYNC engine (views refresh, sync couchdb, heavy jobs)
async_engine = create_async_engine(Config.ASYNC_DATABASE_URL,echo=False,future=True,pool_pre_ping=True,)

async_session = async_sessionmaker(async_engine,expire_on_commit=False)



# -----------------------
# Helpers
# -----------------------

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