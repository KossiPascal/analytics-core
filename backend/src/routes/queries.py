# backend/src/routes/api.py
from flask import Blueprint, jsonify, request
from security.access_security import require_auth
from database.extensions import db
from models.visualization import Query
import uuid

bp = Blueprint("queries", __name__, url_prefix="/api/queries")

# -------------------- QUERY CRUD --------------------
@bp.post("")
@require_auth
def create_query():
    try:
        data = request.get_json()
        query = Query(dataset_id=uuid.UUID(data["dataset_id"]),query_json=data["query_json"])
        db.session.add(query)
        db.session.commit()
        return jsonify({"id": str(query.id)}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@bp.post("/<uuid:q_id>/validate")
@require_auth
def validate_query(q_id):
    try:
        query = Query.query.get_or_404(q_id)
        query.validate()
        db.session.commit()
        return jsonify({"message": "Query validated"})
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@bp.get("/<uuid:q_id>")
@require_auth
def get_query(q_id):
    query = Query.query.get_or_404(q_id)
    return jsonify({"id": str(query.id), "query_json": query.query_json})
