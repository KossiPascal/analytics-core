from psycopg2 import connect, OperationalError
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from config import Config

# -----------------------
# Flask ORM (SYNC)
# -----------------------
db = SQLAlchemy()

# -----------------------
# Roles
# -----------------------
ADMIN = "admin"
SUPERADMIN = "superadmin"
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
def isAdmin(role: str) -> bool:
    return role in ADMIN_ROLES

def isSuperAdmin(role: str) -> bool:
    return role == SUPERADMIN

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
            password=Config.POSTGRES_PASSWORD,
        )
        conn.autocommit = True
        return conn
    except OperationalError as e:
        print(f"❌ PostgreSQL connection error: {e}")
        return None


# def get_couch():
#     server = couchdb.Server(current_src.config["COUCHDB_URI"])
#     return server
