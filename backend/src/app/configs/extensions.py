from typing import Any, Dict
from flask import jsonify, request
from psycopg2 import connect, OperationalError
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from backend.src.app.configs.environment import Config
from flask_apscheduler import APScheduler

# Flask ORM (SYNC)
db = SQLAlchemy()

scheduler = APScheduler()

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


def success_response(data: Any = None, status: int = 200):
    return jsonify({"status": "success","data": data}), status

def get_json_payload() -> Dict[str, Any]:
    if not request.is_json:
        raise ValueError("Request body must be JSON")
    return request.get_json(silent=True) or {}

