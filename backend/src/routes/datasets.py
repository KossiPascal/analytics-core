# backend/src/routes/api.py
from flask import Blueprint, jsonify, request
from backend.src.security.access_security import require_auth
from backend.src.databases.extensions import db
from backend.src.models.visualization import Dataset

bp = Blueprint("datasets", __name__, url_prefix="/api/datasets")

# -------------------- DATASET CRUD --------------------
@bp.get("")
@require_auth
def list_datasets():
    datasets = Dataset.query.all()
    return jsonify([{"id": str(ds.id), "name": ds.name, "sql": ds.sql} for ds in datasets])

@bp.post("")
@require_auth
def create_dataset():
    data = request.get_json()
    ds = Dataset(
        tenant_id=int(data["tenant_id"]),
        datasource_id=int(data["datasource_id"]),
        name=data["name"],
        sql=data["sql"],
        sql_type=data.get("sql_type", "select")
    )
    db.session.add(ds)
    db.session.commit()
    return jsonify({"id": str(ds.id), "name": ds.name}), 201

@bp.put("/<uuid:ds_id>")
@require_auth
def update_dataset(ds_id):
    ds = Dataset.query.get_or_404(ds_id)
    data = request.get_json()
    ds.name = data.get("name", ds.name)
    ds.sql = data.get("sql", ds.sql)
    ds.sql_type = data.get("sql_type", ds.sql_type)
    db.session.commit()
    return jsonify({"id": str(ds.id), "name": ds.name})

@bp.delete("/<uuid:ds_id>")
@require_auth
def delete_dataset(ds_id):
    ds = Dataset.query.get_or_404(ds_id)
    ds.soft_delete()
    db.session.commit()
    return jsonify({"message": "Dataset soft deleted"}), 200
