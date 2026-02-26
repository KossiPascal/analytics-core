# backend/src/routes/api.py
from typing import List

from sqlalchemy.exc import SQLAlchemyError
from flask import Blueprint, g, jsonify, request
from backend.src.security.access_security import require_auth
from backend.src.databases.extensions import db
from backend.src.models.datasource import DataSourceTarget, DataSourceType

bp = Blueprint("datasource_types", __name__, url_prefix="/api/datasource-types")

# { "code": "postgresql", "name": "PostgreSQL", "target": "db", "config": { "default_port": 5432 } }

# -------------------- DATASOURCE CRUD --------------------

@bp.get("")
@require_auth
def list_datasource_types():
    target = request.args.get("target")
    active_only = request.args.get("active_only", "true").lower() == "true"

    query = DataSourceType.query
    if active_only:
        query = query.filter(DataSourceType.is_active == True)
    if target:
        query = query.filter(DataSourceType.target == DataSourceTarget(target))
    types:List[DataSourceType] = query.order_by(DataSourceType.code).all()
    if len(types) == 0:
        DataSourceType.ensure_default_type()
        types = query.order_by(DataSourceType.code).all()

    return jsonify([t.to_dict() for t in types]), 200

@bp.post("")
@require_auth
def create_datasource_type():
    try:
        data = request.get_json()

        target=DataSourceTarget(data["target"])
        config=data.get("config", {})

        obj = DataSourceType(code=data["code"],name=data["name"],target=target, config=config)
        obj.created_by_id=g.current_user.get("id") if g.get("current_user") else None,

        db.session.add(obj)
        db.session.commit()

        return jsonify({ "id": obj.id, "message": "DatasourceType created" }), 201

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.get("/<int:type_id>")
@require_auth
def get_datasource_type(type_id):
    obj = DataSourceType.query.get(type_id)
    if not obj:
        return jsonify({"error": "DatasourceType not found"}), 404

    return jsonify(obj.to_dict()), 200

@bp.put("/<int:type_id>")
@require_auth
def update_datasource_type(type_id):
    try:
        obj:DataSourceType = DataSourceType.query.get(type_id)
        if not obj:
            return jsonify({"error": "DatasourceType not found"}), 404

        data = request.get_json()
        if "code" in data:
            obj.code = data["code"]
        if "name" in data:
            obj.name = data["name"]
        if "target" in data:
            obj.target = DataSourceTarget(data["target"])
        if "config" in data:
            obj.config = data["config"]

        obj.updated_by_id=g.current_user.get("id") if g.get("current_user") else None,
        db.session.commit()

        return jsonify({ "message": "DatasourceType updated", "id": obj.id }), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.delete("/<int:type_id>")
@require_auth
def delete_datasource_type(type_id):
    try:
        obj:DataSourceType = DataSourceType.query.get(type_id)
        if not obj:
            return jsonify({"error": "DatasourceType not found"}), 404

        obj.is_active = False
        obj.deleted_by_id=g.current_user.get("id") if g.get("current_user") else None,
        db.session.commit()

        return jsonify({"message": "DatasourceType deactivated"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
