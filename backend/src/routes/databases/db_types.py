from flask import Blueprint, request, jsonify
from backend.src.security.access_security import require_auth
from backend.src.models.connection import ConnectionType
from backend.src.database.extensions import db
from sqlalchemy.exc import SQLAlchemyError
from backend.src.logger import get_backend_logger
logger = get_backend_logger(__name__)

bp = Blueprint("conn-types", __name__, url_prefix="/api/conn-types")

#     // const DB_TYPES: SelectModel[] = [
#     //   { value: 'postgres', label: 'PostgreSQL' },
#     //   { value: 'mysql', label: 'MySQL' },
#     //   { value: 'mariadb', label: 'MariaDB' },
#     //   { value: 'mssql', label: 'SQL Server' },
#     //   { value: 'oracle', label: 'Oracle' },
#     //   { value: 'mongodb', label: 'MongoDB' },
#     //   { value: 'couchdb', label: 'CouchDB' },
#     //   { value: 'sqlite', label: 'SQLite' },
#     //   { value: 'other', label: 'Autre' },
#     // ]

# Helpers
def error_response(message, status=400, details=None):
    logger.error(message)
    payload = {"error": message}
    if details:
        payload["details"] = details
    return jsonify(payload), status



@bp.get("")
@require_auth
def list_types():
    try:
        typesList= ConnectionType.ensure_default_type()
        types = sorted((typesList or []), key=lambda t: t.uid)
        results = [c.to_public_dict() for c in types]
        return jsonify(results)
    except SQLAlchemyError as e:
        logger.error(f"Failed to list types: {str(e)}")
        return error_response("Failed to list types", 500, str(e))

# Create types
@bp.post("")
@require_auth
def add_types():
    data = request.get_json(silent=True)
    if not data:
        return error_response("Invalid JSON body")
    try:
        conn = ConnectionType(
            id=data.get("id"), 
            name=data.get("name"), 
            config=data.get("config"),
            is_active=data.get("is_active") or True
        )
        db.session.add(conn)
        db.session.commit()

        logger.info("Conn Types created: %s", conn.name)
        return jsonify({"id": conn.id}), 201

    except SQLAlchemyError as e:
        db.session.rollback()
        return error_response("Failed to create conn types", 500, str(e))

@bp.put("/<int:conn_id>")
@require_auth
def update_types(conn_id):
    data = request.get_json(silent=True)
    if not data:
        return error_response("Invalid JSON body")

    try:
        conn:ConnectionType = ConnectionType.query.get(conn_id)
        if not conn:
            return error_response("types not found", 404)

        if "name" in data:
            conn.name = data.get("name")
        if "config" in data:
            conn.config = data.get("config")
        if "is_active" in data:
            conn.is_active = data.get("is_active") or True

        db.session.commit()

        logger.info("types updated: %s", conn.name)
        return jsonify({"message": "conn types updated"}), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        return error_response("Failed to update conn types", 500, str(e))

# Delete Types
@bp.delete("/<int:conn_id>")
@require_auth
def delete_types(conn_id):
    try:
        conn:ConnectionType = ConnectionType.query.get(conn_id)
        if not conn:
            return error_response(str(e), 404)
        db.session.delete(conn)
        db.session.commit()
        return jsonify({"status": "deleted"})
    except ValueError as e:
        return error_response(str(e), 404)
    except SQLAlchemyError as e:
        db.session.rollback()
        return error_response("Failed to delete conn types", 500, str(e))