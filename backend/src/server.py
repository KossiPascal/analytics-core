import warnings
from sqlalchemy.exc import SAWarning
from cryptography.utils import CryptographyDeprecationWarning


warnings.filterwarnings("ignore", category=CryptographyDeprecationWarning)
warnings.filterwarnings("ignore", category=SAWarning)

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
from sqlalchemy.exc import OperationalError
from cryptography.utils import CryptographyDeprecationWarning

from backend.src.config import Config
from backend.src.models.auth import User
from backend.src.security.api_security import api_security

from backend.src.routes import auth, connections, visualization, scripts, database, worker_controller
from backend.src.routes.admin import permissions, roles, tenants, users

# Equipment Manager module - import models so SQLAlchemy registers them
import backend.src.equipment_manager.models  # noqa: F401
from backend.src.equipment_manager.routes import (
    locations as em_locations,
    ascs as em_ascs,
    supervisors as em_supervisors,
    equipment as em_equipment,
    tickets as em_tickets,
    employees as em_employees,
    dashboard as em_dashboard,
    dhis2_sync as em_dhis2_sync,
)

# Meeting Intelligence module - import models so SQLAlchemy registers them
import backend.src.meeting_intelligence.models  # noqa: F401
from backend.src.meeting_intelligence.routes import meeting as mi_meeting

from backend.src.databases.extensions import db

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

def init_database(app: Flask) -> None:
    with app.app_context():
        try:
            if Config.IS_DEBUG_MODE:
                logger.warning("⚠ DEV MODE: creating tables directly")
                # Advisory lock (session-level) pour sérialiser les workers Gunicorn.
                # Seul le premier worker effectue le DROP/CREATE/create_all().
                # Les suivants attendent, puis détectent que les tables existent et passent.
                with db.engine.connect() as lock_conn:
                    lock_conn.execute(db.text("SELECT pg_advisory_lock(42424242)"))
                    try:
                        with db.engine.connect() as conn:
                            conn.execute(db.text("CREATE SCHEMA IF NOT EXISTS em"))
                            conn.execute(db.text("CREATE SCHEMA IF NOT EXISTS mi"))
                            table_count = conn.execute(db.text(
                                "SELECT COUNT(*) FROM information_schema.tables "
                                "WHERE table_schema = 'em' AND table_type = 'BASE TABLE'"
                            )).scalar()
                            # Schéma vide (séquences orphelines) OU schéma obsolète
                            # (table 'ascs' encore présente = avant migration ASC→Employee).
                            # Dans les deux cas on recrée proprement.
                            has_stale_tables = conn.execute(db.text(
                                "SELECT COUNT(*) FROM information_schema.tables "
                                "WHERE table_schema = 'em' AND table_name IN ('ascs','supervisors','zones_asc')"
                            )).scalar() > 0
                            if table_count == 0 or has_stale_tables:
                                conn.execute(db.text("DROP SCHEMA em CASCADE"))
                                conn.execute(db.text("CREATE SCHEMA em"))
                                conn.commit()
                                db.create_all()
                                User.create_default_admin()
                            else:
                                conn.commit()
                    finally:
                        lock_conn.execute(db.text("SELECT pg_advisory_unlock(42424242)"))
                        lock_conn.commit()
            else:
                if Path("migrations").exists():
                    logger.info("Applying database migrations")
                    upgrade()
        except OperationalError:
            logger.critical("Database initialization failed", exc_info=True)
            raise

def create_flask_app(create_default_elements = True) -> Flask:
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

    if create_default_elements == True:
        init_database(app)

    # ⚠️ OPTIONAL SYNC (ENABLE EXPLICITLY)
    # if Config.AUTO_SYNC_COUCHDB_TO_POSTGRES:
    # Thread(target=start_couchdb_sync,args=(app,),daemon=True).start()

    # Blueprints
    for bp in (
        auth, connections, database, scripts,visualization, worker_controller,
        permissions, roles, tenants, users,
    ):
        app.register_blueprint(bp.bp if hasattr(bp, "bp") else bp)

    # Equipment Manager blueprints
    for em_bp in (
        em_locations, em_ascs, em_supervisors, em_equipment,
        em_tickets, em_employees, em_dashboard, em_dhis2_sync,
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
