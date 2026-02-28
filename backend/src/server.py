import warnings
from sqlalchemy.exc import SAWarning
from cryptography.utils import CryptographyDeprecationWarning
warnings.filterwarnings("ignore", category=CryptographyDeprecationWarning)
warnings.filterwarnings("ignore", category=SAWarning)

from backend.src.routes.visualizations import script, visualization
from backend.src.security.ssh_crypto import harden_ssh_crypto

harden_ssh_crypto()

import warnings
import urllib3
from pathlib import Path

from flask import Flask, jsonify, send_from_directory, send_file, render_template, request
from flask_cors import CORS
from flask_compress import Compress
from flask_talisman import Talisman
from flask_session import Session
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate, upgrade
from werkzeug.middleware.proxy_fix import ProxyFix
from sqlalchemy import inspect, text
from sqlalchemy.exc import OperationalError
from cryptography.utils import CryptographyDeprecationWarning

from backend.src.config import Config
from backend.src.models.auth import User
from backend.src.security.api_security import api_security

from backend.src.routes import auth, database, worker_controller
from backend.src.routes.visualizations import script, visualization
from backend.src.routes.identities import permission, role, tenant, user, user_utils, orgunit
from backend.src.routes.datasources import datasource, datasource_permission, datasource_type
from backend.src.routes.datasets import dataset, dataset_chart,dataset_field,dataset_query





from backend.src.databases.extensions import db
                
from alembic import command
from alembic.config import Config as AlembicConfig
# -----------------------------------------------------------------------------
# GLOBAL SETUP
# -----------------------------------------------------------------------------

warnings.filterwarnings("ignore", category=CryptographyDeprecationWarning)
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

from backend.src.logger import get_backend_logger
logger = get_backend_logger(__name__)

# -----------------------------------------------------------------------------
# DATABASE INIT
# -----------------------------------------------------------------------------


# flask db revision --autogenerate -m "Add connection_id to datasets"
# flask db upgrade

def init_database(app: Flask) -> None:
    """
    Initialise la base de données.
    - En mode dev, crée les tables si elles n'existent pas et ajoute un admin par défaut.
    - En prod, applique les migrations Alembic si nécessaire.
    """
    with app.app_context():
        with db.engine.begin() as conn:
            try:
                conn.execute(text("SELECT pg_advisory_lock(123456);"))

                inspector = inspect(db.engine)
                existing_tables = inspector.get_table_names()
                
                # === DB vierge ou mode dev ===
                if Config.IS_DEBUG_MODE or not existing_tables:

                    conn.execute(db.text("CREATE SCHEMA IF NOT EXISTS em"))
                    conn.execute(db.text("CREATE SCHEMA IF NOT EXISTS mi"))

                    logger.warning("⚠ DEV MODE or empty DB: creating tables directly")
                    db.create_all()
                    
                    # Crée un admin par défaut si la table User existe
                    if "users" in db.metadata.tables:
                        success = User.create_default_admin()
                        if success:
                            logger.info("✅ Default admin created")
                            # from sqlalchemy.orm import configure_mappers
                            # configure_mappers()
                    else:
                        logger.warning("User table not found, skipping default admin creation")

                # ALEMBIC MIGRATIONS
                migrations_path = Config.ALCHEMY_MIGRATION_FOLDER
                alembic_ini = migrations_path / "alembic.ini"

                # Création du dossier migrations si absent
                if not migrations_path.exists():
                    # logger.info("📦 Creating migrations folder")
                    # migrations_path.mkdir(parents=True, exist_ok=True)
                    raise RuntimeError("Migrations folder missing. Deployment is broken.")

                # Initialiser alembic.ini si absent
                if not alembic_ini.exists():
                    # logger.info("📦 Creating alembic.ini")
                    # with open(alembic_ini, "w") as f:
                    #     f.write("[alembic]\nscript_location = %s\n" % migrations_path)
                    raise RuntimeError("Migrations folder missing. Deployment is broken.")

                # Créer alembic.ini temporaire
                alembic_cfg = AlembicConfig(str(alembic_ini))
                alembic_cfg.set_main_option("script_location", str(migrations_path))

                # # Vérifie si des migrations existent
                # if not any(migrations_path.glob("versions/*.py")):
                #     logger.info("📦 Creating initial migration")
                #     # Générer la révision initiale
                #     command.revision(alembic_cfg, message="initial migration", autogenerate=True)


                # Init folder
                # command.init(alembic_cfg, str(migrations_path))
                # Appliquer la migration
                command.upgrade(alembic_cfg, "head")
                logger.info("✅ Database migrations applied")


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
    CORS(app, supports_credentials=True)
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

    if initialize_database == True:
        init_database(app)

    # Celery
    from backend.src.celery_app import celery, init_celery
    init_celery(app)
    app.extensions["celery"] = celery        

    # ⚠️ OPTIONAL SYNC (ENABLE EXPLICITLY)
    # if Config.AUTO_SYNC_COUCHDB_TO_POSTGRES:
    # Thread(target=start_couchdb_sync,args=(app,),daemon=True).start()

    # Blueprints
    for bp in (
        auth, database, worker_controller, script, visualization,
        permission, role, tenant, user, user_utils, orgunit, 
        datasource, datasource_permission, datasource_type,
        dataset, dataset_chart,dataset_field,dataset_query

    ):
        app.register_blueprint(bp.bp if hasattr(bp, "bp") else bp)

    if initialize_database != True:
        # Equipment Manager module - import models so SQLAlchemy registers them
        from backend.src.equipment_manager.routes import (
            locations as em_locations,
            ascs as em_ascs,
            supervisors as em_supervisors,
            equipment as em_equipment,
            tickets as em_tickets,
            employees as em_employees,
            dashboard as em_dashboard,
            dhis2_sync as em_dhis2_sync,
            email_config as em_email_config,
            alert_config as em_alert_config,
        )
        from backend.src.meeting_intelligence.routes import meeting as mi_meeting
        # Equipment Manager blueprints
        for em_bp in (
            em_locations, em_ascs, em_supervisors, em_equipment,
            em_tickets, em_employees, em_dashboard, em_dhis2_sync,
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

    @app.errorhandler(Exception)
    def handle_exception(e):
        logger.error(f"Unhandled exception: {str(e)}")
        return jsonify(error="internal server error"), 500

    @app.teardown_appcontext
    def shutdown_session(exception=None):
        db.session.remove()

    return app

# -----------------------------------------------------------------------------
# ENTRYPOINT
# -----------------------------------------------------------------------------

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
