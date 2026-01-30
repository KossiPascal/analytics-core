# backend/src/routes/api.py
from flask import Blueprint, jsonify, request
from database.extensions import db
from models.visualization import DataSource, Dataset, Query, Visualization
import uuid
from datetime import datetime

bp = Blueprint("api", __name__, url_prefix="/api")

# -------------------- DATASOURCE CRUD --------------------
@bp.route("/datasources", methods=["POST"])
def create_datasource():
    data = request.get_json()
    ds = DataSource(
        tenant_id=uuid.UUID(data["tenant_id"]),
        type=data["type"],
        name=data["name"]
    )
    db.session.add(ds)
    db.session.commit()
    return jsonify({"id": str(ds.id), "name": ds.name}), 201

@bp.route("/datasources", methods=["GET"])
def list_datasources():
    datasources = DataSource.query.all()
    return jsonify([{"id": str(ds.id), "name": ds.name, "type": ds.type} for ds in datasources])

@bp.route("/datasources/<uuid:ds_id>", methods=["GET"])
def get_datasource(ds_id):
    ds = DataSource.query.get_or_404(ds_id)
    return jsonify({"id": str(ds.id), "name": ds.name, "type": ds.type})

@bp.route("/datasources/<uuid:ds_id>", methods=["PUT"])
def update_datasource(ds_id):
    ds = DataSource.query.get_or_404(ds_id)
    data = request.get_json()
    ds.name = data.get("name", ds.name)
    ds.type = data.get("type", ds.type)
    db.session.commit()
    return jsonify({"id": str(ds.id), "name": ds.name, "type": ds.type})

@bp.route("/datasources/<uuid:ds_id>", methods=["DELETE"])
def delete_datasource(ds_id):
    ds = DataSource.query.get_or_404(ds_id)
    ds.is_active = False
    db.session.commit()
    return jsonify({"message": "Datasource deactivated"}), 200

# -------------------- DATASET CRUD --------------------
@bp.route("/datasets", methods=["POST"])
def create_dataset():
    data = request.get_json()
    ds = Dataset(
        tenant_id=uuid.UUID(data["tenant_id"]),
        datasource_id=uuid.UUID(data["datasource_id"]),
        name=data["name"],
        sql=data["sql"],
        sql_type=data.get("sql_type", "select")
    )
    db.session.add(ds)
    db.session.commit()
    return jsonify({"id": str(ds.id), "name": ds.name}), 201

@bp.route("/datasets", methods=["GET"])
def list_datasets():
    datasets = Dataset.query.all()
    return jsonify([{"id": str(ds.id), "name": ds.name, "sql": ds.sql} for ds in datasets])

@bp.route("/datasets/<uuid:ds_id>", methods=["PUT"])
def update_dataset(ds_id):
    ds = Dataset.query.get_or_404(ds_id)
    data = request.get_json()
    ds.name = data.get("name", ds.name)
    ds.sql = data.get("sql", ds.sql)
    ds.sql_type = data.get("sql_type", ds.sql_type)
    db.session.commit()
    return jsonify({"id": str(ds.id), "name": ds.name})

@bp.route("/datasets/<uuid:ds_id>", methods=["DELETE"])
def delete_dataset(ds_id):
    ds = Dataset.query.get_or_404(ds_id)
    ds.soft_delete()
    db.session.commit()
    return jsonify({"message": "Dataset soft deleted"}), 200

# -------------------- QUERY CRUD --------------------
@bp.route("/queries", methods=["POST"])
def create_query():
    data = request.get_json()
    query = Query(
        dataset_id=uuid.UUID(data["dataset_id"]),
        query_json=data["query_json"]
    )
    db.session.add(query)
    db.session.commit()
    return jsonify({"id": str(query.id)}), 201

@bp.route("/queries/<uuid:q_id>/validate", methods=["POST"])
def validate_query(q_id):
    query = Query.query.get_or_404(q_id)
    try:
        query.validate()
        db.session.commit()
        return jsonify({"message": "Query validated"})
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@bp.route("/queries/<uuid:q_id>", methods=["GET"])
def get_query(q_id):
    query = Query.query.get_or_404(q_id)
    return jsonify({"id": str(query.id), "query_json": query.query_json})

# -------------------- VISUALIZATION CRUD --------------------
@bp.route("/visualizations", methods=["POST"])
def create_visualization():
    data = request.get_json()
    viz = Visualization(
        tenant_id=uuid.UUID(data["tenant_id"]),
        name=data["name"],
        type=data["type"],
        status="draft",
        layout=data.get("layout", {}),
        filters=data.get("filters", {}),
        config=data.get("config", {})
    )
    db.session.add(viz)
    db.session.commit()
    return jsonify({"id": str(viz.id), "name": viz.name}), 201

@bp.route("/visualizations", methods=["GET"])
def list_visualizations():
    visualizations = Visualization.query.all()
    return jsonify([{"id": str(v.id), "name": v.name, "status": v.status} for v in visualizations])

@bp.route("/visualizations/<uuid:v_id>", methods=["PUT"])
def update_visualization(v_id):
    viz = Visualization.query.get_or_404(v_id)
    data = request.get_json()
    viz.name = data.get("name", viz.name)
    viz.layout = data.get("layout", viz.layout)
    viz.filters = data.get("filters", viz.filters)
    viz.config = data.get("config", viz.config)
    db.session.commit()
    return jsonify({"id": str(viz.id), "name": viz.name})

@bp.route("/visualizations/<uuid:v_id>/publish", methods=["POST"])
def publish_visualization(v_id):
    viz = Visualization.query.get_or_404(v_id)
    viz.publish()
    db.session.commit()
    return jsonify({"id": str(viz.id), "status": viz.status})
