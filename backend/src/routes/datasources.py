# backend/src/routes/api.py
from flask import Blueprint, jsonify, request
from backend.src.security.access_security import require_auth
from backend.src.database.extensions import db
from backend.src.models.visualization import DataSource
import uuid

bp = Blueprint("datasources", __name__, url_prefix="/api/datasources")

# -------------------- DATASOURCE CRUD --------------------
@bp.post("")
@require_auth
def create_datasource():
    data = request.get_json()
    ds = DataSource(tenant_id=uuid.UUID(data["tenant_id"]), type=data["type"], name=data["name"])
    db.session.add(ds)
    db.session.commit()
    return jsonify({"id": str(ds.id), "name": ds.name}), 201

@bp.get("")
@require_auth
def list_datasources():
    datasources:list[DataSource] = DataSource.query.all()
    return jsonify([{"id": str(ds.id), "name": ds.name, "type": ds.type} for ds in datasources])

@bp.get("/<uuid:ds_id>")
@require_auth
def get_datasource(ds_id):
    ds:DataSource = DataSource.query.get_or_404(ds_id)
    return jsonify({"id": str(ds.id), "name": ds.name, "type": ds.type})

@bp.put("/<uuid:ds_id>")
@require_auth
def update_datasource(ds_id):
    ds:DataSource = DataSource.query.get_or_404(ds_id)
    data = request.get_json()
    ds.name = data.get("name", ds.name)
    ds.type = data.get("type", ds.type)
    db.session.commit()
    return jsonify({"id": str(ds.id), "name": ds.name, "type": ds.type})

@bp.delete("/<uuid:ds_id>")
@require_auth
def delete_datasource(ds_id):
    ds:DataSource = DataSource.query.get_or_404(ds_id)
    ds.is_active = False
    db.session.commit()
    return jsonify({"message": "Datasource deactivated"}), 200
