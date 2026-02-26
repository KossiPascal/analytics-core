"""
Routes for SMTP email configuration management.
"""
import smtplib

from flask import Blueprint, jsonify, request

from backend.src.databases.extensions import db
from backend.src.security.access_security import require_auth
from backend.src.equipment_manager.models.email_config import (
    EmailConfig, encrypt_password,
)
from backend.src.logger import get_backend_logger

logger = get_backend_logger(__name__)

bp = Blueprint("em_email_config", __name__, url_prefix="/api/equipment/email-config")


@bp.get("/")
@require_auth
def get_email_config():
    config = EmailConfig.query.filter_by(is_active=True).first()
    if not config:
        return jsonify(success=True, data=None)
    return jsonify(success=True, data=config.to_dict_safe())


@bp.post("/")
@require_auth
def save_email_config():
    data = request.get_json() or {}
    required = ["host", "port", "username", "password", "from_email"]
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify(success=False, message=f"Champs requis : {', '.join(missing)}"), 400

    # Deactivate existing configs
    EmailConfig.query.filter_by(is_active=True).update({"is_active": False})

    config = EmailConfig(
        host=data["host"].strip(),
        port=int(data["port"]),
        username=data["username"].strip(),
        password_encrypted=encrypt_password(data["password"]),
        from_email=data["from_email"].strip(),
        from_name=data.get("from_name", "IH Equipment Manager").strip(),
        use_tls=bool(data.get("use_tls", True)),
        is_active=True,
    )
    db.session.add(config)
    db.session.commit()
    return jsonify(success=True, data=config.to_dict_safe()), 201


@bp.delete("/<int:config_id>")
@require_auth
def delete_email_config(config_id):
    config = db.session.get(EmailConfig, config_id)
    if not config:
        return jsonify(success=False, message="Configuration introuvable"), 404
    db.session.delete(config)
    db.session.commit()
    return jsonify(success=True)


@bp.post("/test")
@require_auth
def test_email_config():
    """Test SMTP connection without saving."""
    data = request.get_json() or {}
    host = data.get("host", "").strip()
    port = int(data.get("port", 587))
    username = data.get("username", "").strip()
    password = data.get("password", "")
    use_tls = bool(data.get("use_tls", True))

    if not host or not username:
        return jsonify(success=False, message="Host et utilisateur requis"), 400

    try:
        server = smtplib.SMTP(host, port, timeout=10)
        if use_tls:
            server.starttls()
        server.login(username, password)
        server.quit()
        return jsonify(success=True, message="Connexion SMTP réussie")
    except Exception as e:
        logger.warning(f"SMTP test failed: {e}")
        return jsonify(success=False, message=str(e)), 400
