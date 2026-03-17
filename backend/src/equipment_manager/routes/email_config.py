"""
Routes for SMTP email configuration management.
"""
from datetime import datetime, timezone
import smtplib
from typing import List

from flask import Blueprint, jsonify, request

from backend.src.databases.extensions import db
from backend.src.security.access_security import require_auth, currentUserId
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


@bp.get("/list")
@require_auth
def list_email_configs():
    configs = EmailConfig.query.order_by(EmailConfig.created_at.desc()).all()
    return jsonify([c.to_dict_safe() for c in configs]), 200


@bp.post("/")
@require_auth
def save_email_config():
    data = request.get_json() or {}
    required_fields = ["host", "port", "username", "from_email"]
    missing = [f for f in required_fields if not data.get(f)]
    if missing:
        return jsonify(success=False, message=f"Champs requis : {', '.join(missing)}"), 400

    password_plain = data.get("password", "").strip()

    # Récupérer l'ancienne config avant de la désactiver
    existing:EmailConfig = EmailConfig.query.filter_by(is_active=True).first()
    if not password_plain:
        if existing:
            # Réutiliser le mot de passe chiffré déjà en base
            encrypted_pw = existing.password_encrypted
        else:
            return jsonify(success=False, message="Mot de passe requis pour une nouvelle configuration"), 400
    else:
        encrypted_pw = encrypt_password(password_plain)

    # Désactiver les configs existantes
    configs:List[EmailConfig] = EmailConfig.query.filter_by(is_active=True)
    for conf in configs:
       conf.is_active = False
       conf.updated_by_id=currentUserId()
       
    config = EmailConfig(
        host=data["host"].strip(),
        port=int(data["port"]),
        username=data["username"].strip(),
        password_encrypted=encrypted_pw,
        from_email=data["from_email"].strip(),
        from_name=data.get("from_name", "IH Equipment Manager").strip(),
        use_tls=bool(data.get("use_tls", True)),
        is_active=True,
        created_by_id=currentUserId()
    )

    db.session.add(config)
    db.session.commit()
    return jsonify(success=True, data=config.to_dict_safe()), 201


@bp.put("/<int:config_id>")
@require_auth
def update_email_config(config_id):
    config = db.session.get(EmailConfig, config_id)
    if not config:
        return jsonify(success=False, message="Configuration introuvable"), 404
    data = request.get_json() or {}
    required_fields = ["host", "port", "username", "from_email"]
    missing = [f for f in required_fields if not data.get(f)]
    if missing:
        return jsonify(success=False, message=f"Champs requis : {', '.join(missing)}"), 400
    password_plain = data.get("password", "").strip()
    if password_plain:
        config.password_encrypted = encrypt_password(password_plain)
    config.host = data["host"].strip()
    config.port = int(data["port"])
    config.username = data["username"].strip()
    config.from_email = data["from_email"].strip()
    config.from_name = data.get("from_name", "IH Equipment Manager").strip()
    config.use_tls = bool(data.get("use_tls", True))
    config.updated_by_id=currentUserId()
    db.session.commit()
    return jsonify(success=True, data=config.to_dict_safe())


@bp.post("/<int:config_id>/activate")
@require_auth
def activate_email_config(config_id):
    config = db.session.get(EmailConfig, config_id)
    if not config:
        return jsonify(success=False, message="Configuration introuvable"), 404
    configs:List[EmailConfig] = EmailConfig.query.filter_by(is_active=True)
    for conf in configs:
        conf.is_active = False
        conf.updated_by_id=currentUserId()

    config.is_active = True
    config.updated_by_id=currentUserId()
    db.session.commit()
    return jsonify(success=True, data=config.to_dict_safe())


@bp.delete("/<int:config_id>")
@require_auth
def delete_email_config(config_id):
    config = db.session.get(EmailConfig, config_id)
    if not config:
        return jsonify(success=False, message="Configuration introuvable"), 404
    # db.session.delete(config)
    config.is_active = False
    config.deleted = True
    config.deleted_at = datetime.now(timezone.utc)
    config.deleted_by_id=currentUserId()

    db.session.commit()
    return jsonify(success=True)


@bp.post("/test")
@require_auth
def test_email_config():
    """Test SMTP connection without saving. Supports STARTTLS (587) and SSL (465)."""
    data = request.get_json() or {}
    host = data.get("host", "").strip()
    port = int(data.get("port", 587))
    username = data.get("username", "").strip()
    password = data.get("password", "")
    use_tls = bool(data.get("use_tls", True))
    use_ssl = bool(data.get("use_ssl", False))  # port 465

    if not host or not username:
        return jsonify(success=False, message="Host et utilisateur requis"), 400

    # Si port 465, forcer SSL
    if port == 465:
        use_ssl = True

    try:
        if use_ssl:
            # Mode SSL direct (port 465)
            server = smtplib.SMTP_SSL(host, port, timeout=10)
        else:
            # Mode STARTTLS (port 587 ou 25)
            server = smtplib.SMTP(host, port, timeout=10)
            if use_tls:
                server.starttls()

        if username and password:
            server.login(username, password)
        server.quit()
        mode = "SSL" if use_ssl else ("STARTTLS" if use_tls else "non chiffré")
        return jsonify(success=True, message=f"Connexion SMTP réussie ({mode}, port {port})")
    except smtplib.SMTPAuthenticationError as e:
        logger.warning(f"SMTP auth failed: {e}")
        return jsonify(success=False, message="Authentification échouée : identifiants incorrects ou mot de passe d'application requis"), 400
    except ConnectionRefusedError:
        return jsonify(success=False, message=f"Connexion refusée sur {host}:{port}"), 400
    except TimeoutError:
        return jsonify(success=False, message=f"Délai d'attente dépassé pour {host}:{port}"), 400
    except OSError as e:
        if "Network is unreachable" in str(e) or "101" in str(e):
            return jsonify(success=False, message=f"Réseau inaccessible : le serveur ne peut pas joindre {host}:{port}. Vérifiez que le port {port} est ouvert en sortie (essayez le port 465 pour Gmail)."), 400
        return jsonify(success=False, message=str(e)), 400
    except Exception as e:
        logger.warning(f"SMTP test failed: {e}")
        return jsonify(success=False, message=str(e)), 400

