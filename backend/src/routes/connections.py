from flask import Blueprint, request, jsonify
from models.connection import DataConnection
from database.extensions import db
from app.adapters.factory import get_adapter

bp = Blueprint("connections", __name__, url_prefix="/api/connections")

@bp.post("")
def create_connection():
    payload = request.json
    conn = DataConnection(type=payload["type"],name=payload["name"],config=payload)
    db.session.add(conn)
    db.session.commit()

    adapter = get_adapter(conn)
    adapter.test_connection()
    adapter.init_schema()

    if payload.get("sync"):
        adapter.start_sync()

    return jsonify({"status": "connected"})
