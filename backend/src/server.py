

from pathlib import Path
from werkzeug.exceptions import HTTPException
from sqlalchemy.exc import SAWarning, OperationalError
from warnings import filterwarnings
from urllib3 import disable_warnings, exceptions as _EXP
from cryptography.utils import CryptographyDeprecationWarning
filterwarnings("ignore", category=CryptographyDeprecationWarning)
filterwarnings("ignore", category=SAWarning)
disable_warnings(_EXP.InsecureRequestWarning)

from backend.src.app.models.a_tenant import *
from backend.src.app.models.b_user import *
from backend.src.app.models.c_role_permission import *
from backend.src.app.models.d_api_token import *
from backend.src.app.models.e_management import *
from backend.src.app.models.f_employee import *
from backend.src.app.models.g_membership import *
from backend.src.app.models.h_strategy import *
from backend.src.app.models.i_team import *
from backend.src.app.models.z_dhis2 import *

from backend.src.modules.analytics.models.a_datasource import *
from backend.src.modules.analytics.models.b_dataset import *
from backend.src.modules.analytics.models.c_dataset_chart import *
from backend.src.modules.analytics.models.d_visualization import *
from backend.src.modules.analytics.models.e_script import *

from backend.src.modules.okr.models.a_obj_key_result import *
from backend.src.modules.okr.models.b_program import *
from backend.src.modules.okr.models.c_indicator import *

from backend.src.modules.projects.models.a_project import *
from backend.src.modules.projects.models.b_activity import *
from backend.src.modules.projects.models.c_task import *

from backend.src.modules.meetings.models.meeting import *

from backend.src.modules.finances.models.models import *

from backend.src.modules.hrm.models.models import *

from backend.src.modules.equipments.models.email_config import *
from backend.src.modules.equipments.models.equipment import *
from backend.src.modules.equipments.models.locations import *
from backend.src.modules.equipments.models.tickets import *

from backend.src.app.routes import auth, permission, role, tenant, tenant_source, user_utils
from backend.src.modules.analytics.routes import database, worker_controller
from backend.src.modules.analytics.routes.datasources import datasource, datasource_permission
from backend.src.modules.analytics.routes.visualizations import visualization, visualization_chart, visualization_target, viz_script
from backend.src.modules.equipments.seeds import SEED_ORDER, SEEDERS, seed_all
from backend.src.modules.analytics.routes.dhis2 import level

from backend.src.app.middlewares.api_security import api_security
from backend.src.app.routes import user
from backend.src.celery_app import init_celery,celery
from backend.src.modules.analytics.routes.datasets import dataset_chart, dataset_query

from backend.src.app.configs.environment import Config
from backend.src.modules.analytics.routes.datasets import dataset, dataset_field
from backend.src.app.configs.extensions import db, scheduler
from backend.src.modules.analytics.logger import get_backend_logger

from werkzeug.exceptions import HTTPException
from werkzeug.middleware.proxy_fix import ProxyFix

from flask import Flask, jsonify, send_from_directory, send_file, render_template
from flask_cors import CORS
from flask_compress import Compress
from flask_talisman import Talisman
from flask_session import Session
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from sqlalchemy import inspect, text

from alembic import command
from alembic.config import Config as AlembicConfig

logger = get_backend_logger(__name__)


# flask db revision --autogenerate -m "Add connection_id to datasets"
# flask db upgrade

def init_database(app: Flask) -> None:
    """
    Initialise la base de données.
    - En mode dev, crée les tables si elles n'existent pas et ajoute un admin par défaut.
    - En prod, applique les migrations Alembic si nécessaire.
    """
    with app.app_context():
        with db.engine.connect() as schema_conn:
            for shema in ["public", "core", "analy", "fin", "proj", "equip", "meet", "okr", "hrm", "cht"]:
                schema_conn.execute(text(f"CREATE SCHEMA IF NOT EXISTS {shema}"))
            schema_conn.commit()

        with db.engine.begin() as conn:
            try:
                conn.execute(text("SELECT pg_advisory_lock(123456);"))

                inspector = inspect(db.engine)
                existing_tables = inspector.get_table_names()

                # === 1. Création des tables manquantes (db.create_all n'altère pas l'existant) ===
                if Config.IS_DEBUG_MODE or not existing_tables:
                    logger.warning("⚠ DEV MODE or empty DB: creating tables directly")
                    db.create_all()

                # === 2. ALEMBIC MIGRATIONS (ALTER TABLE, nouvelles colonnes, …) ===
                migrations_path = Config.ALCHEMY_MIGRATION_FOLDER
                alembic_ini = migrations_path / "alembic.ini"

                if not migrations_path.exists():
                    raise RuntimeError("Migrations folder missing. Deployment is broken.")
                if not alembic_ini.exists():
                    raise RuntimeError("Migrations folder missing. Deployment is broken.")

                alembic_cfg = AlembicConfig(str(alembic_ini))
                alembic_cfg.set_main_option("script_location", str(migrations_path))
                command.upgrade(alembic_cfg, "head")
                logger.info("✅ Database migrations applied")

                # === 3. Données initiales — APRÈS migrations (schéma à jour) ===
                if Config.IS_DEBUG_MODE or not existing_tables:
                    if "users" in db.metadata.tables:
                        success = User.create_default_admin()
                        if success:
                            logger.info("✅ Default admin created")
                    else:
                        logger.warning("User table not found, skipping default admin creation")

            except OperationalError as e:
                logger.critical("Database initialization failed: operational error", exc_info=True)
                raise e
            except Exception as e:
                logger.critical("Unexpected error during DB initialization", exc_info=True)
                raise e
            finally:
                conn.execute(text("SELECT pg_advisory_unlock(123456);"))
    

def create_flask_app(initialize_database = True) -> Flask:
    Config.validate()

    app = Flask(
        __name__,
        static_folder=str(Config.WEBAPP_DIR),
        template_folder=str(Config.EJS_DIR),
    )

    # Trust reverse proxy
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)

    # Security headers
    Talisman(
        app,
        content_security_policy=None,
        frame_options="DENY",
        force_https=Config.IS_SECURE_HOST,
    )

    # Middlewares
    CORS(
        app,
        supports_credentials=True,
        origins=[
            f"https://{Config.HOST}:{Config.PORT}", 
            f"http://{Config.HOST}:{Config.PORT}"
            "http://localhost:5173",
            # "https://ton-frontend.com"
        ],
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    )

    Compress(app)

    # Core config
    app.config.update(
        SECRET_KEY=Config.SECRET_KEY,
        SQLALCHEMY_DATABASE_URI=Config.DATABASE_URL,
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        JWT_SECRET_KEY=Config.JWT_SECRET_KEY,
        SESSION_TYPE="filesystem",
        SESSION_COOKIE_NAME="kendeya.sid",
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SECURE=Config.IS_SECURE_HOST,
        SESSION_COOKIE_SAMESITE="Lax",
        MAX_CONTENT_LENGTH=50 * 1024 * 1024,
    )

    # Extensions
    db.init_app(app)
    Migrate(app, db)
    JWTManager(app)
    Session(app)
    
    scheduler.init_app(app)
    scheduler.start()

    if initialize_database == True:
        init_database(app)



    # Celery
    init_celery(app)
    app.extensions["celery"] = celery        

    # ⚠️ OPTIONAL SYNC (ENABLE EXPLICITLY)
    # if Config.AUTO_SYNC_COUCHDB_TO_POSTGRES:
    # Thread(target=start_couchdb_sync,args=(app,),daemon=True).start()

    # Blueprints
    for bp in (
        auth, database, worker_controller, viz_script, visualization,visualization_chart,visualization_target,
        permission, role, tenant, tenant_source, user, user_utils, level, # identities_dhis2_sync,
        datasource, datasource_permission,
        dataset, dataset_chart,dataset_field,dataset_query

    ):
        app.register_blueprint(bp.bp if hasattr(bp, "bp") else bp)

    if initialize_database != True:
        # Equipment Manager module - import models so SQLAlchemy registers them
        from backend.src.modules.equipments.routes import (
            locations as em_locations,
            ascs as em_ascs,
            supervisors as em_supervisors,
            equipment as em_equipment,
            tickets as em_tickets,
            dashboard as em_dashboard,
            dhis2_sync as em_dhis2_sync,
            email_config as em_email_config,
            alert_config as em_alert_config,
        )
        from backend.src.modules.meetings.routes import meeting as mi_meeting
        # Equipment Manager blueprints
        for em_bp in (
            em_locations, em_ascs, em_supervisors, em_equipment,
            em_tickets, em_dashboard, em_dhis2_sync,
            em_email_config, em_alert_config,
        ):
            app.register_blueprint(em_bp.bp)

        # Meeting Intelligence blueprint
        app.register_blueprint(mi_meeting.bp)

    # -----------------------------------------------------------------------------
    # ROUTES
    # -----------------------------------------------------------------------------

    @app.get("/api/health")
    def health():
        return jsonify(status="ok", env=Config.APP_ENV)

    @app.route("/publics/<path:path>")
    def publics(path):
        return send_from_directory(Config.PUBLIC_DIR, path)

    @app.route("/publics/download/<filename>")
    def download(filename):
        file_path = Config.PUBLIC_DIR / "apk" / filename
        if not file_path.exists():
            return jsonify(error="file not found"), 404
        return send_file(file_path)

    @app.route("/api/documentations")
    @api_security()
    def docs():
        return render_template("documentations.ejs")

    # SPA fallback
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def spa(path):
        if path.startswith("api"):
            return jsonify(error="not found"), 404
        file = Path(app.static_folder) / path
        return (
            send_from_directory(app.static_folder, path)
            if path and file.exists()
            else send_from_directory(app.static_folder, "index.html")
        )

    # -----------------------------------------------------------------------------
    # ERROR HANDLING
    # -----------------------------------------------------------------------------

    @app.errorhandler(HTTPException)
    def handle_http_exception(e: HTTPException):
        """
        Handle all HTTP errors (401, 403, 404, 405, etc.)
        Keeps original status code.
        Always returns JSON.
        """
        response = {
            "success": False,
            "error": e.name,
            "message": e.description,
            "status": e.code,
            "details": str(e)
        }

        # Log only server-side errors (5xx)
        if 500 <= e.code < 600:
            logger.error(f"[HTTPException {e.code}] {e.name} - {e.description}")

        return jsonify(response), e.code

    @app.errorhandler(Exception)
    def handle_unexpected_exception(e: Exception):
        """
        Catch unhandled exceptions.
        Never leak stacktrace to client.
        """
        import traceback
        logger.error("[Unhandled Exception]\n%s",traceback.format_exc())

        return jsonify({
            "success": False,
            "error": "Internal Server Error",
            "message": "An unexpected error occurred.",
            "status": 500,
            "details": str(e)
        }), 500

    @app.teardown_appcontext
    def shutdown_session(exception=None):
        db.session.remove()

    return app

# ENTRYPOINT
if __name__ == "__main__":
    app = create_flask_app()

    ssl_context = (
        (Config.SSL_DIR / "fullchain.pem", Config.SSL_DIR / "privkey.pem")
        if Config.IS_SECURE_HOST else None
    )

    logger.info(f"🚀 Backend starting on {Config.HOST}:{Config.PORT}")
    app.run(
        host=Config.HOST,
        port=Config.PORT,
        debug=Config.IS_DEBUG_MODE,
        ssl_context=ssl_context,
        use_reloader=False,
    )

