from datetime import datetime
from flask import request, jsonify, Blueprint
from backend.src.database.extensions import db
from backend.src.models.auth import User  # your User model
from backend.src.models.api_token import ApiToken  # the ApiToken model you already defined
from backend.src.services.api_token import ApiTokenService

logger = __import__('logging').getLogger(__name__)


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
            return jsonify({"status": 400, "data": "Aucun utilisateur sélectionné"}), 400

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
            api.created_at = datetime.utcnow()

            db.session.add(api)
            db.session.commit()
            success = True

        elif action == "update":
            if not token_id:
                return jsonify({"status": 400, "data": "ID manquant pour update"}), 400
            api = ApiToken.query.get(token_id)
            if not api:
                return jsonify({"status": 404, "data": "Token introuvable"}), 404
            api.is_active = bool(is_active)
            db.session.commit()
            success = True

        elif action == "delete":
            if not token_id:
                return jsonify({"status": 400, "data": "ID manquant pour delete"}), 400
            api = ApiToken.query.get(token_id)
            if not api:
                return jsonify({"status": 404, "data": "Token introuvable"}), 404
            db.session.delete(api)
            db.session.commit()
            success = True

        else:
            return jsonify({"status": 400, "data": "Action inconnue"}), 400

        if success:
            apis = ApiToken.query.all()
            return jsonify({"status": 200, "data": [a.to_dict() for a in apis]}), 200

        return jsonify({"status": 400, "data": "Impossible de réaliser l’action demandée"}), 400

    except Exception as e:
        logger.exception("AccessKeyList error")
        return jsonify({"status": 500, "data": f"Erreur serveur: {str(e)}"}), 500
