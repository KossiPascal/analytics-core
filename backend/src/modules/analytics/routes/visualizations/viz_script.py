import os
import json
from backend.src.app.middlewares.access_security import require_auth, currentUserId
from backend.src.app.configs.environment import Config
from typing import Optional, List
from sqlalchemy.exc import SQLAlchemyError
from flask import Blueprint, request, jsonify, g
from backend.src.app.configs.extensions import db, isAdmin, isSuperAdmin, get_connection
from typing import Optional, List
import time

from werkzeug.exceptions import BadRequest
from sqlalchemy.exc import SQLAlchemyError, IntegrityError

from backend.src.modules.analytics.executors.js_executor import run_javascript
from backend.src.modules.analytics.executors.json_executor import validate_json
from backend.src.modules.analytics.executors.python_executor import run_python
from backend.src.modules.analytics.executors.sql_executor import run_sql
from backend.src.modules.analytics.logger import get_backend_logger, audit_log
from backend.src.modules.analytics.models.e_script import Script
from shared_libs.helpers.utils import serializeContent
logger = get_backend_logger(__name__)

bp = Blueprint("scripts", __name__, url_prefix="/api/scripts")


LOCAL_SCRIPT_FILES = []
SCRIPT_NAMES = ()

# LISTER TOUS LES SCRIPTS
@bp.get("")
@require_auth
def list_scripts():
    try:
        # 🔐 Authentification
        current = g.get("current_user")
        if not current:
            raise BadRequest("Unauthorized", 401)

        user_id = current.get("id")
        roles = current.get("roles")
        permissions = current.get("permissions")

        # 🚫 Autorisation
        if not isAdmin(roles, permissions):
            audit_log(action="ACCESS_DENIED",details={"resource": "list_scripts"},level="WARNING")
            raise BadRequest("Access denied", 403)

        result = []

        # ⭐ SUPER ADMIN
        if isSuperAdmin(roles, permissions):
            base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

            for name, rel_path, language in LOCAL_SCRIPT_FILES:
                full_path = os.path.join(base_dir, rel_path)

                if not os.path.isfile(full_path):
                    logger.warning(f"Missing script file: {full_path}")
                    raise BadRequest(f"Database error: {str(e)}", 500)

                try:
                    with open(full_path, "r", encoding="utf-8") as f:
                        content = json.load(f) if language == "json" else f.read()
                except Exception as e:
                    logger.error(f"Failed to read {full_path}: {e}")
                    raise BadRequest(f"Database error: {str(e)}", 500)

                if not content:
                    continue

                script = Script.query.filter_by(name=name).first()
                if not script:
                    script = Script(name=name,language=language,content=content,owner_id=user_id)
                    db.session.add(script)
                    logger.info(f"{name} script created")

                # 🔄 CAS : le script indicateur existe
                else:
                    pass
                    # if len(str(script.content).strip()) < len(str(content).strip()):
                    #     script.content = content
                    #     db.session.commit()
                    #     logger.info(f"{filename} script updated")

            db.session.commit()

            scripts:list[Script] = Script.query.order_by(Script.created_at.desc()).all()
            result = [s.to_dict_safe() for s in scripts]

        # 👮 ADMIN (non superadmin)
        else:
            scripts:list[Script] = Script.query.filter(~Script.name.in_(SCRIPT_NAMES)).order_by(Script.created_at.desc()).all()
            result = [s.to_dict_safe() for s in scripts]

        return jsonify(result), 200

    # ❌ ERREURS SQL
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f"Database error while fetching scripts: {str(e)}")
        raise BadRequest(f"Database error: {str(e)}", 500)

    # ❌ ERREURS GÉNÉRALES
    except Exception as e:
        db.session.rollback()
        logger.error(f"Unexpected error in list_scripts: {str(e)}")
        raise BadRequest(f"Internal server error: {str(e)}", 500)

# RÉCUPÉRER UN SCRIPT PAR ID
@bp.get("/<int:script_id>")
@require_auth()
def get_script(script_id):
    try:
        script:Optional[Script] = Script.query.get(script_id)
        if not script:
            raise BadRequest(f"Script with id {script_id} not found", 404)

        return jsonify(script.to_dict_safe()), 200
    except SQLAlchemyError as e:
        raise

# CRÉER OU METTRE À JOUR UN SCRIPT
@bp.post("")
@bp.put("/<int:script_id>")
@require_auth()
def save_script(script_id=None):
    try:
        payload = request.get_json(silent=True)
        if not payload:
            raise BadRequest("Invalid JSON payload", 400)

        # Validation des champs
        name = payload.get("name")
        language = payload.get("language")
        content = payload.get("content")
        script_id = script_id or payload.get("id")

        if not name or not language or not content:
            raise BadRequest("Missing required fields: name, language, content", 422)
        
        language_lower = language.lower()
        if language_lower not in Config.ALLOWED_LANGUAGES:
            raise BadRequest(f"Language '{language}' is not allowed", 422)
        
        user_id = g.current_user["id"]
        tenant_id = g.current_user.get("tenant_id")

        if not user_id:
            raise BadRequest("Action non autorisée !", 409)

        # Mise à jour si l'ID existe
        if script_id:
            script:Optional[Script] = Script.query.get(script_id)
            if not script:
                raise BadRequest(f"Script with id {script_id} not found", 404)
            
            for rel_name, rel_path, rel_language in LOCAL_SCRIPT_FILES:
                if name == rel_name and language_lower != rel_language:
                    raise BadRequest(f"Modification impossible du script {rel_name}", 400)
            
            script.name = name
            script.language = language_lower
            script.content = content
            script.updated_by_id = user_id

            if name in SCRIPT_NAMES:
                base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
                serialized_content = serializeContent(content)

                for rel_name, rel_path, rel_language in LOCAL_SCRIPT_FILES:
                    if name == rel_name:
                        if language_lower != rel_language:
                            raise BadRequest(f"Modification impossible du script {rel_name}", 400)
                        
                        full_path = os.path.join(base_dir, rel_path)
                        if os.path.exists(full_path):
                            with open(full_path, "w", encoding="utf-8") as f:
                                f.write(serialized_content)
        else:
            if name in SCRIPT_NAMES:
                raise BadRequest("Modification interdite pour ce script", 403)

            # Upsert : si le nom existe déjà, on met à jour
            existing = Script.query.filter_by(name=name).first()
            if existing:
                existing.language = language_lower
                existing.content = content
                existing.updated_by_id = user_id
                script = existing
            else:
                script = Script(name=name,language=language_lower,content=content,owner_id=user_id)
                script.tenant_id = tenant_id
                db.session.add(script)
                audit_log(action="CREATE_SCRIPT",details={"script_name": name,"language": language})

        db.session.commit()

        return jsonify({"status": "saved", "id": script.id}), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        raise

    except Exception as e:
        raise BadRequest("Unexpected error",500)

# SUPPRIMER UN SCRIPT PAR ID
@bp.delete("/<int:script_id>")
@require_auth()
def delete_script(script_id):
    try:
        script = Script.query.get(script_id)
        if not script:
            raise BadRequest(f"Script with id {script_id} not found", 404)
        
        if script.name in SCRIPT_NAMES:
            raise BadRequest("Modification interdite pour ce script", 403)

        db.session.delete(script)
        db.session.commit()

        audit_log(action="DELETE_SCRIPT", details={ "script_id": script_id, "reason": "obsolete" }, level="WARNING")


        return jsonify({"status": "deleted", "id": script_id}), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        raise
    except Exception as e:
        raise BadRequest("Unexpected error", 500)


@bp.post("/execute")
@require_auth
def execute_script():
    """
    Execute SQL, Python, or JSON queries securely.

    POST payload:
    {
        "content": "...",
        "script_id": 1,
        "user_id": 1,
        "language": "sql" | "python" | "json",
        "max_rows": 1000,
        "explain": false
    }
    """
    start_time = time.time()
    payload = request.get_json(silent=True) or {}

    # ---------------- VALIDATION ----------------
    user_id = g.current_user["id"]
    roles = g.current_user["roles"]
    permissions = g.current_user["permissions"]
    
    if not user_id or not permissions:
        raise BadRequest("Missing user (authorization)", 409)

    # user:Optional[User] = User.query.filter_by(id=user_id).first()
    # if not user:
    #     raise BadRequest("User not found / unauthorized", 401)

    script_id = payload.get("script_id")
    content = serializeContent(payload.get("content"))
    language = payload.get("language")
    max_rows = payload.get("max_rows")
    explain = bool(payload.get("explain", False))
    use_temp_file = bool(payload.get("use_temp_file", False))

    userIsAdmin = isAdmin(roles, permissions)


    # fetch script if script_id provided
    if script_id:
        script = Script.query.get(script_id)
        if not script:
            raise BadRequest("Script not found", 404)
        content = serializeContent(script.content)
        language = script.language

    # Ensure content and language exist
    if not content or not language:
        raise BadRequest("Missing content or language", 400)

    # Validate type
    if not isinstance(content, str):
        raise BadRequest("Content must be a string", 400)
    
    if not isinstance(language, str):
        raise BadRequest("Language must be a string", 400)

    language = language.lower()
    if language not in Config.ALLOWED_LANGUAGES:
        raise BadRequest(f"Language '{language}' is not allowed", 403)

    # ---------------- SECURITY LIMITS ----------------
    try:
        max_rows = int(max_rows) if max_rows is not None else (Config.MAX_ALLOWED_ROWS if userIsAdmin else Config.DEFAULT_NON_ADMIN_MAX_ROWS)
    except ValueError:
        max_rows = Config.DEFAULT_NON_ADMIN_MAX_ROWS

    if max_rows < 1:
        max_rows = 1
    elif not userIsAdmin and max_rows > Config.DEFAULT_NON_ADMIN_MAX_ROWS:
        max_rows = Config.DEFAULT_NON_ADMIN_MAX_ROWS
    elif max_rows > Config.MAX_ALLOWED_ROWS:
        max_rows = Config.MAX_ALLOWED_ROWS


    # ---------------- EXECUTION ----------------
    try:
        if language == "python":
            result, status = run_python(content,use_temp_file)

        elif language == "sql":
            conn = get_connection()
            result, status = run_sql(conn, content, None, max_rows=max_rows, explain=explain)

        elif language == "json":
            result, status = validate_json(content)

        elif language in ("javascript","js"):
            result, status = run_javascript(content)

        else:
            # should never happen
            raise BadRequest(f"Unsupported language '{language}'", 400)

        # ---------------- LOGGING ----------------
        elapsed = round(time.time() - start_time, 3)
        logger.info(f"[EXECUTE] user_id={user_id}, language={language}, rows_limit={max_rows}, elapsed={elapsed}")
        # logger.info(f"[EXECUTE] user_id={user_id}, language={language}, rows_limit={max_rows}, elapsed={elapsed}s, result_type={str(result)}, explain={explain}")

        return jsonify(result), status
    
    except Exception as e:
        logger.error(f"Error executing content: {str(e)}")
        raise BadRequest("Execution failed", 500)

