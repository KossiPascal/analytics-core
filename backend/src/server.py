import os
import urllib3
import asyncio

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
from models.auth import User

# Custom imports
from config import Config
from database.extensions import db
from routes import auth, visualization, connections, scripts
from routes.admin import permissions, roles, tenants, users
from helpers.logger import get_logger
from threading import Thread
from couch2pg.main import sync_couchdb_to_postgres
from backend.src.security.api_security import api_security

# Disable SSL warnings for self-signed certs
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

logger = get_logger("backend")


# UTILITIES
def is_https_request():
    """Retourne True si la requête originale est HTTPS"""
    if request.is_secure:
        return True
    proto = request.headers.get("X-Forwarded-Proto", "").lower()
    return proto == "https"

def init_database(app):
    """Initialise la DB et crée l'admin si DEV, ou applique les migrations si PROD."""
    with app.app_context():
        try:
            if Config.IS_DEBUG_MODE:
                db.create_all()
                User.create_default_admin()
                logger.info("Database initialized (DEV mode)")
            else:
                migrations_path = os.path.join(os.getcwd(), "migrations")
                if os.path.exists(migrations_path) and os.listdir(migrations_path):
                    upgrade()
                    logger.info("Database migrated (PROD mode)")
                else:
                    logger.warning("No migrations found. Skipping upgrade.")
        except OperationalError as e:
            logger.error(f"Database init failed: {e}")
            raise

def start_couch_sync():
    # Exécute la coroutine dans sa propre boucle asyncio
    if Config.AUTO_SYNC_COUCHDB_TO_POSTGRES:
        asyncio.run(sync_couchdb_to_postgres())

def create_app():
    Config.validate()

    frontend_path = Path(Config.WEBAPP_DIR)
    app = Flask(__name__,static_folder=str(frontend_path),template_folder=str(Config.EJS_DIR))

    # TRUST PROXY (pour X-Forwarded-Proto)
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1)

    # SECURITY
    if Config.IS_SECURE_HOST:
        Talisman(app,content_security_policy=None,frame_options="DENY",referrer_policy="no-referrer",force_https=True)
    else:
        Talisman(app, content_security_policy=None,force_https=False)

    # CORS + COMPRESSION
    CORS(app, supports_credentials=True)
    # CORS(app, resources={r"/api/*": {"origins": Config.FRONTEND_ORIGIN}}, supports_credentials=True)
    Compress(app)

    # BODY PARSING CONFIG
    app.config["JSONIFY_PRETTYPRINT_REGULAR"] = False
    app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024  # 50 MB

    # SESSION CONFIG
    app.config["SESSION_TYPE"] = "filesystem"
    app.config["SESSION_COOKIE_NAME"] = "kendeya.sid"
    app.config["SESSION_COOKIE_HTTPONLY"] = True
    app.config["SESSION_COOKIE_SECURE"] = Config.IS_SECURE_HOST  # à activer si HTTPS
    app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
    app.config["PERMANENT_SESSION_LIFETIME"] = 3600
    app.config["SECRET_KEY"] = Config.SECRET_KEY
    app.config["AUTH_SET_COOKIE"] = Config.AUTH_SET_COOKIE
    Session(app)

    # DATABASE + JWT
    app.config["SQLALCHEMY_DATABASE_URI"] = Config.DATABASE_URL
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JSON_SORT_KEYS"] = False
    app.config["JWT_SECRET_KEY"] = Config.JWT_SECRET_KEY
    app.config["SCHEDULER_API_ENABLED"] = Config.SCHEDULER_API_ENABLED

    db.init_app(app)
    Migrate(app, db)
    JWTManager(app)

    # DATABASE INIT
    init_database(app)

    # START COUCHDB -> POSTGRES SYNC IN BACKGROUND
    Thread(target=start_couch_sync, daemon=True).start()

    # LOGGER
    # app.before_request(user_logger_middleware)

    # STATIC FILES
    app.add_url_rule("/publics/<path:path>", view_func=lambda path: send_from_directory(Config.PUBLIC_DIR, path))
    # app.add_url_rule("/assets/<path:path>", view_func=lambda path: send_from_directory(Config.SRC_FOLDER / "assets", path))

    # REGISTER BLUEPRINTS

    blueprints = [auth, connections, scripts, permissions, roles, tenants, users, visualization ]
    for b in blueprints:
        app.register_blueprint(b.bp if hasattr(b, "bp") else b)

    # app.register_blueprint(auth_bp)
    # app.register_blueprint(auth_user.bp, url_prefix="/api/auth-user")
    # app.register_blueprint(configs.bp, url_prefix="/api/configs")
    # app.register_blueprint(org_units.bp, url_prefix="/api/org-units")
    # app.register_blueprint(reports.bp, url_prefix="/api/reports")
    # app.register_blueprint(dashboards.bp, url_prefix="/api/dashboards")
    # app.register_blueprint(maps.bp, url_prefix="/api/maps")
    # app.register_blueprint(api_token.bp, url_prefix="/api/api-token")
    # app.register_blueprint(sql_management.bp, url_prefix="/api/sql")
    # app.register_blueprint(database.bp, url_prefix="/api/database")
    # app.register_blueprint(dhis2.bp, url_prefix="/api/dhis2")
    # app.register_blueprint(sms.bp, url_prefix="/api/sms")

    # STATIC FILES / SPA FALLBACK
    @app.route("/publics/download/<filename>")
    def download_apk(filename):
        file_path = Config.PUBLIC_DIR / "apk" / filename
        if not file_path.exists():
            return jsonify({"error": "File not found"}), 404
        return send_file(file_path)
    
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_frontend(path):
        if path.startswith("api"):
            return jsonify({"error": "Not found"}), 404
        file_path = Path(app.static_folder) / path
        if path and file_path.exists():
            return send_from_directory(app.static_folder, path)
        return send_from_directory(app.static_folder, "index.html")

    # HEALTHCHECK
    @app.get("/api/health")
    def health():
        return jsonify(status="ok",service="backend",env=Config.APP_ENV), 200

    # # FAVICON
    # @app.route("/favicon.ico")
    # def favicon_ico():
    #     return "", 204

    # # FAVICON
    # @app.route("/favicon.svg")
    # def favicon_svg():
    #     return "", 204

    # DOCUMENTATION EJS
    @app.route("/api/documentations")
    @api_security()
    def docs():
        return render_template(
            "documentations.ejs",
            host="https://tonoudayoapi.portal-integratehealth.org/api/vaccine",
            example="?api_access_key=XXXX&year=2025&monthA=12&districts=XXX&sites=[UUID]&chws=[UUID]"
        )

    # # VACCINE ROUTES
    # @app.route("/api/vaccine")
    # @api_security
    # def vaccine():
    #     status, data = vaccine_router(request)
    #     return jsonify(data), status

    # @app.route("/api/vaccine.csv")
    # @api_security
    # def vaccine_csv():
    #     status, data = vaccine_router(request)
    #     if status != 200:
    #         return jsonify({"error": data}), status
    #     vaccins = exploseVaccineObject(data.get("vaccins", []))
    #     if not vaccins:
    #         return "", 204
    #     filename = f"vaccine_{request.args.get('state')}_{request.args.get('year')}.csv"
    #     return stream_csv(filename, vaccins)

    # # UIDs
    # @app.route("/api/uids")
    # def uids():
    #     status, data = generate_uids(request)
    #     if status != 200 or not isinstance(data, list):
    #         return jsonify({"error": data}), status
    #     return jsonify({"count": len(data), "ids": [d["id"] for d in data]})

    # @app.route("/api/uids.csv")
    # def uids_csv():
    #     status, data = generate_uids(request)
    #     if status != 200 or not isinstance(data, list):
    #         return jsonify({"error": data}), status
    #     return stream_csv(f"uids_{int(os.times()[4])}.csv", data)



    # ERROR HANDLING GLOBAL
    @app.errorhandler(400)
    def bad_request(e): return jsonify(error="bad request"), 400

    @app.errorhandler(401)
    def unauthorized(e): return jsonify(error="unauthorized"), 401

    @app.errorhandler(404)
    def not_found(e): return jsonify(error="not found"), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        logger.warning("Method not allowed")
        return jsonify(error="method not allowed"), 405

    @app.errorhandler(500)
    def internal_error(e):
        logger.exception("Internal server error")
        return jsonify(error="internal server error"), 500

    @app.errorhandler(Exception)
    def unhandled_exception(e):
        logger.exception("Unhandled global exception")
        return jsonify(error=str(e)), 500

    # CLEANUP DB SESSION
    @app.teardown_appcontext
    def shutdown_session(exception=None):
        db.session.remove()

    return app


# ENTRYPOINT
if __name__ == "__main__":
    try:
        app = create_app()
        host = Config.HOST
        port = Config.PORT
        ssl_context = (
            (Config.SSL_DIR / "fullchain.pem", Config.SSL_DIR / "privkey.pem") 
            if Config.IS_SECURE_HOST else None
        ) # <-- HTTPS
        
        logger.info(f"Starting app on {host}:{port} debug={Config.IS_DEBUG_MODE}")
        app.run(
            host=host, 
            port=port, 
            debug=Config.IS_DEBUG_MODE, 
            use_reloader=False,
            ssl_context= ssl_context # <-- HTTPS
        )

    except Exception as e:
        logger.critical("Fatal error on startup", exc_info=True)
        raise e