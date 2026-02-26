import os
from pathlib import Path
from dotenv import load_dotenv
from urllib.parse import quote_plus
from celery.schedules import crontab
from itsdangerous import URLSafeTimedSerializer


BASE_DIR = Path(__file__).resolve().parent.parent.parent
ROOT_DIR = BASE_DIR.parent

for env_path in [BASE_DIR / ".env", ROOT_DIR / ".env"]:
    if env_path.exists():
        load_dotenv(env_path, override=True)


class Config:

    IS_DOCKER_RUNNING = os.getenv("DOCKERIZED", "false").lower() == "true"

    APP_ENV = os.getenv("APP_ENV", "development")
    APP_VERSION = int(os.getenv("APP_VERSION", 1))

    HOST = "0.0.0.0"
    PORT = int(os.getenv("NGINX_HTTP_PORT") or os.getenv("NGINX_HTTPS_PORT") or 5000)

    IS_SECURE_HOST = os.getenv("IS_SECURE_HOST", "false") == 'true'

    # Folders
    BACKEND_DIR = BASE_DIR / "backend"
    SSL_DIR = BASE_DIR / "configs/nginx/certs/default"
    SRC_FOLDER = BACKEND_DIR / "src"
    ALCHEMY_MIGRATION_FOLDER = BACKEND_DIR / "migrations"
    PUBLIC_DIR = SRC_FOLDER / "public"
    WEBAPP_DIR = BACKEND_DIR / "web" #os.path.join(os.path.dirname(__file__), "..", "web")
    EJS_DIR = SRC_FOLDER / "ejs"
    POSTGRESQL_DIR = SRC_FOLDER / "postgresql"

    ACCESS_ALL_AVAILABLE_PORT = os.getenv("ACCESS_ALL_AVAILABLE_PORT", "false").lower() == "true"
    SECRET_KEY = os.getenv("SECRET_KEY", "supersecret")
    ENABLE_SYNC = os.getenv("ENABLE_SYNC", "false").lower() == "true"
    FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "*")

    IS_DEBUG_MODE = APP_ENV != "production"

    AUTH_SET_COOKIE = os.getenv("AUTH_SET_COOKIE", "true") == 'true'
    
    JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
    JWT_SECURITY_SALT = os.getenv("JWT_SECURITY_SALT", 'JWT_SECURITY_SALT')
    ACCESS_TOKEN_EXPIRES_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRES_MINUTES", 15))  # 15 min default

    REFRESH_TOKEN_EXPIRES_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRES_DAYS", 7))  # 7 days
    REFRESH_TOKEN_SALT = os.getenv("REFRESH_TOKEN_SALT", "REFRESH_TOKEN_SALT").encode()

    REFRESH_RATE_LIMIT_MAX = int(os.getenv("REFRESH_RATE_LIMIT_MAX", 10))
    REFRESH_RATE_LIMIT_WINDOW_SECONDS = int(os.getenv("REFRESH_RATE_LIMIT_WINDOW_SECONDS", 60))

    HASH_ITERATIONS = int(os.getenv("HASH_ITERATIONS", 150_000))


    POSTGRES_HOST = os.getenv('POSTGRES_HOST') if IS_DOCKER_RUNNING else os.getenv('LOCAL_POSTGRES_HOST')
    POSTGRES_PORT = os.getenv('POSTGRES_PORT', "5432") if IS_DOCKER_RUNNING else os.getenv('LOCAL_POSTGRES_PORT')
    POSTGRES_DB = os.getenv('POSTGRES_DB') if IS_DOCKER_RUNNING else os.getenv('LOCAL_POSTGRES_DB')
    POSTGRES_USER = os.getenv('POSTGRES_USER') if IS_DOCKER_RUNNING else os.getenv('LOCAL_POSTGRES_USER')
    POSTGRES_PASSWORD_RAW = os.getenv('POSTGRES_PASSWORD') if IS_DOCKER_RUNNING else os.getenv('LOCAL_POSTGRES_PASSWORD')
    POSTGRES_PASSWORD = quote_plus(POSTGRES_PASSWORD_RAW)

    POSTGRES_NETWORK = os.getenv('POSTGRES_NETWORK')

    SQLALCHEMY_TRACK_MODIFICATIONS = os.getenv("SQLALCHEMY_TRACK_MODIFICATIONS", "false") == 'true'
    SCHEDULER_API_ENABLED = os.getenv("SCHEDULER_API_ENABLED", "false") == 'true'

    PASSWORD_MIN_LENGHT = int(os.getenv("PASSWORD_MIN_LENGHT", 8))
    DEFAULT_ADMIN = {
        "lastname": "Super",
        "firstname": "Admin",
        "username": os.getenv("DEFAULT_USERNAME", "admin"),
        "password": os.getenv("DEFAULT_PASSWORD", "district"),
        "role": "superadmin",
        "tenant_name": os.getenv("DEFAULT_TENANT_NAME", "Admin Tenant")
    }

    COUCHDB_USER = os.getenv('COUCHDB_USER')
    COUCHDB_PASS = os.getenv('COUCHDB_PASS')
    COUCHDB_HOST = os.getenv('COUCHDB_HOST')
    COUCHDB_PORT = os.getenv('COUCHDB_PORT')
    COUCHDB_BASE_URL = (f"https://{COUCHDB_USER}:{COUCHDB_PASS}@{COUCHDB_HOST}:{COUCHDB_PORT}") if  all([COUCHDB_HOST, COUCHDB_PORT]) else None


    PSYCOPG2_DSN = (
        f"dbname={POSTGRES_DB} "
        f"user={POSTGRES_USER} "
        f"password={POSTGRES_PASSWORD} "
        f"host={POSTGRES_HOST} "
        f"port={POSTGRES_PORT}"
    )

    DATABASE_URL = f"postgresql+psycopg2://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
    ASYNC_DATABASE_URL = f"postgresql+asyncpg://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"

    REQUIRED_VARS = [
        "POSTGRES_USER",
        "POSTGRES_PASSWORD",
        "POSTGRES_HOST",
        "POSTGRES_PORT",
        "POSTGRES_DB",
        "JWT_SECRET_KEY"
    ]

    AUTO_SYNC_COUCHDB_TO_POSTGRES = os.getenv("AUTO_SYNC_COUCHDB_TO_POSTGRES", "false") == 'true'


    # Celery
    CELERY_NAME = "analytics_core_celery"
    CELERY_BROKER_URL = os.environ.get("CELERY_BROKER_URL", "redis://localhost:6379/0")
    CELERY_RESULT_BACKEND = os.environ.get("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")
    CELERY_TIMEZONE = "UTC"
    CELERY_ENABLE_UTC = True


    @classmethod
    def validate(cls):
        missing = [v for v in cls.REQUIRED_VARS if not os.getenv(v)]
        if missing:
            raise RuntimeError(f"Missing environment variables: {[BASE_DIR / ".env", ROOT_DIR / ".env"]}")

    FERNET_KEY = "n5o7c1Gv4eG2B0Zy3kR9Rk1o0Jr7GZ5nFvK1JtF8y3Q=" #"XqMZpZ7n1tN8h2B7r6S3gPZcL0FZpAqX9JY7mH3D5Q8="

        # Langues autorisées
    MAX_ALLOWED_ROWS = 50000          # sécurité maximale
    STATEMENT_TIMEOUT_MS = 15_000     # 15s
    DEFAULT_NON_ADMIN_MAX_ROWS = 1000 # limite pour non-admins
    ALLOWED_LANGUAGES = {"python", "sql", "json", "js", "javascript"}

    TIMEOUT = 60

    SERIALISER = URLSafeTimedSerializer(secret_key=JWT_SECRET_KEY, salt=JWT_SECURITY_SALT)

