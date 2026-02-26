"""
Routes for alert configuration management (warning/escalation days, frequency).
"""
from flask import Blueprint, jsonify, request

from backend.src.databases.extensions import db
from backend.src.security.access_security import require_auth
from backend.src.equipment_manager.models.email_config import AlertConfig
from backend.src.logger import get_backend_logger

logger = get_backend_logger(__name__)

bp = Blueprint("em_alert_config", __name__, url_prefix="/api/equipment/alert-config")


@bp.get("/")
@require_auth
def get_alert_config():
    config = AlertConfig.query.filter_by(is_active=True).first()
    if not config:
        # Return defaults if no config exists yet
        return jsonify(success=True, data={
            "id": None,
            "warning_days": 7,
            "escalation_days": 14,
            "frequency_hours": 24,
            "is_active": True,
        })
    return jsonify(success=True, data=config.to_dict_safe())


@bp.put("/")
@require_auth
def update_alert_config():
    data = request.get_json() or {}

    config = AlertConfig.query.filter_by(is_active=True).first()
    if not config:
        config = AlertConfig(is_active=True)
        db.session.add(config)

    if "warning_days" in data:
        config.warning_days = int(data["warning_days"])
    if "escalation_days" in data:
        config.escalation_days = int(data["escalation_days"])
    if "frequency_hours" in data:
        config.frequency_hours = int(data["frequency_hours"])

    # Basic validation
    if config.warning_days >= config.escalation_days:
        return jsonify(
            success=False,
            message="Les jours de rappel doivent être inférieurs aux jours d'escalade"
        ), 400

    db.session.commit()
    return jsonify(success=True, data=config.to_dict_safe())
