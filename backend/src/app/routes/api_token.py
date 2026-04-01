from datetime import datetime, timezone
from flask import request, jsonify, Blueprint
from backend.src.app.configs.extensions import db
from backend.src.app.models.api_token import ApiToken  # the ApiToken model you already defined

from werkzeug.exceptions import BadRequest
from sqlalchemy.exc import SQLAlchemyError, IntegrityError

from backend.src.projects.analytics_manager.logger import get_backend_logger
from backend.src.projects.analytics_manager.services.api_token_service import ApiTokenService
logger = get_backend_logger(__name__)


# -----------------------------
# Flask Blueprint / Controller
# -----------------------------
api_bp = Blueprint("tokens", __name__, url_prefix="/api/tokens")


@api_bp.route("/access_keys", methods=["POST"])
def access_key_list():
    try:
        data = request.get_json()
        user_id = data.get("userId")
        token_id = data.get("id")
        token_len = data.get("tokenLen")
        is_active = data.get("isActive")
        action = data.get("action")

        if not user_id:
            raise BadRequest("Aucun utilisateur sélectionné", 400)

        success = False

        if action == "list":
            success = True

        elif action in ("create", "refresh"):
            if token_id:
                api = ApiToken.query.get(token_id) or ApiToken()
            else:
                api = ApiToken()

            # Generate unique token
            raw_token = ApiTokenService.generate_unique_api_token(token_len)
            api.token_hash = ApiToken.hash_token(raw_token)
            api.is_active = action == "create" or bool(is_active)
            api.created_at = datetime.now(timezone.utc)

            db.session.add(api)
            db.session.commit()
            success = True

        elif action == "update":
            if not token_id:
                raise BadRequest("ID manquant pour update", 400)
            api = ApiToken.query.get(token_id)
            if not api:
                raise BadRequest("Token introuvable", 404)
            api.is_active = bool(is_active)
            db.session.commit()
            success = True

        elif action == "delete":
            if not token_id:
                raise BadRequest("ID manquant pour delete", 400)
            api = ApiToken.query.get(token_id)
            if not api:
                raise BadRequest("Token introuvable", 404)
            db.session.delete(api)
            db.session.commit()
            success = True

        else:
            raise BadRequest("Action inconnue", 400)

        if success:
            apis = ApiToken.query.all()
            return jsonify({"status": 200, "data": [a.to_dict() for a in apis]}), 200

        raise BadRequest("Impossible de réaliser l’action demandée", 400)

    except Exception:
        raise 
