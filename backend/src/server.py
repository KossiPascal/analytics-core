import warnings
from sqlalchemy.exc import SAWarning, OperationalError
from cryptography.utils import CryptographyDeprecationWarning

from backend.src.routes.datasets.chart import dataset_chart
warnings.filterwarnings("ignore", category=CryptographyDeprecationWarning)
warnings.filterwarnings("ignore", category=SAWarning)

from backend.src.routes.datasets import dataset_query
from backend.src.routes.visualizations import script, visualization
from backend.src.security.ssh_crypto import harden_ssh_crypto

import warnings
import urllib3
from pathlib import Path
from werkzeug.exceptions import HTTPException
import traceback

from flask import Flask, jsonify, send_from_directory, send_file, render_template
from werkzeug.exceptions import HTTPException

from flask_cors import CORS
from flask_compress import Compress
from flask_talisman import Talisman
from flask_session import Session
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from werkzeug.middleware.proxy_fix import ProxyFix
from sqlalchemy import inspect, text
from cryptography.utils import CryptographyDeprecationWarning

from backend.src.config import Config
from backend.src.models.auth import User
from backend.src.security.api_security import api_security
from backend.src.routes import auth, database, worker_controller
from backend.src.routes.visualizations import script, visualization
from backend.src.routes.identities import permission, role, tenant, tenant_source, user, user_utils, orgunit, level, dhis2_sync as identities_dhis2_sync
from backend.src.routes.datasources import datasource, datasource_permission, datasource_type
from backend.src.routes.datasets import dataset, dataset_field
from backend.src.databases.extensions import db, scheduler
                
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
        # Les schemas PostgreSQL doivent être créés et committés AVANT db.create_all(),
        # car db.create_all() ouvre sa propre connexion et ne voit pas une transaction
        # non committée. On utilise une connexion séparée avec commit explicite.
        with db.engine.connect() as schema_conn:
            schema_conn.execute(text("CREATE SCHEMA IF NOT EXISTS eqpm"))
            schema_conn.execute(text("CREATE SCHEMA IF NOT EXISTS meet"))
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
    

def _reset_em_tables(app: Flask) -> None:
    """Vide les tables de référence Equipment Manager (dev uniquement)."""
    tables = [
        "eqpm.alert_recipient_configs",
        "eqpm.alert_config",
        "eqpm.email_config",
        "eqpm.issues",
        "eqpm.ticket_events",
        "eqpm.ticket_comments",
        "eqpm.delay_alert_logs",
        "eqpm.repair_tickets",
        "eqpm.delay_alert_recipients",
        "eqpm.accessories",
        "eqpm.equipment_imeis",
        "eqpm.equipment_history",
        "eqpm.equipment",
        "eqpm.equipment_brands",
        "eqpm.equipment_categories",
        "eqpm.equipment_category_groups",
        "eqpm.problem_types",
        "eqpm.employee_profile",
        "eqpm.employee_history",
        "eqpm.employees",
        "eqpm.positions",
        "eqpm.departments",
        "eqpm.sites",
        "eqpm.districts",
        "eqpm.regions",
    ]
    with app.app_context():
        for table in tables:
            try:
                db.session.execute(text(f"TRUNCATE TABLE {table} RESTART IDENTITY CASCADE"))
            except Exception:
                db.session.rollback()
        db.session.commit()
    logger.warning("⚠️  Tables EM vidées (reset)")


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

    # ── Equipment Manager CLI commands ────────────────────────────────────────
    import click

    @app.cli.group("equipment")
    def em_cli():
        """Commandes Equipment Manager."""

    @em_cli.command("seed")
    @click.option("--module", default=None, help="Seeder spécifique à lancer (ex: locations, brands…)")
    @click.option("--reset", is_flag=True, default=False, help="Vide les tables avant de seeder (dev uniquement)")
    def em_seed(module, reset):
        """Insère les données de référence du module Equipment Manager."""
        from backend.src.equipment_manager.seeds import seed_all, SEEDERS, SEED_ORDER

        if reset:
            if not click.confirm("⚠️  Êtes-vous sûr de vouloir vider les tables avant de seeder ?"):
                click.echo("Annulé.")
                return
            _reset_em_tables(app)

        if module:
            if module not in SEEDERS:
                click.echo(f"Module inconnu : '{module}'. Disponibles : {', '.join(SEED_ORDER)}")
                return
            click.echo(f"▶ Seeding [{module}]…")
            n = SEEDERS[module]()
            click.echo(f"✓ {n} enregistrements créés")
        else:
            click.echo("▶ Seeding all modules…")
            total = seed_all()
            click.echo(f"✅ Terminé — {total} enregistrements créés")

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
        permission, role, tenant, tenant_source, user, user_utils, orgunit, level, identities_dhis2_sync,
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
