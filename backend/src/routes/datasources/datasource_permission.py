from typing import List
from flask import Blueprint, g, request, jsonify
from sqlalchemy.exc import SQLAlchemyError
from backend.src.databases.extensions import db
from backend.src.models.datasource import (DataSource,DataSourcePermission)
from backend.src.security.access_security import require_auth, currentUserId

from werkzeug.exceptions import BadRequest
from sqlalchemy.exc import SQLAlchemyError, IntegrityError

bp = Blueprint("datasource_permissions",__name__,url_prefix="/api/datasource-permissions")

# { "datasource_id": 1, "user_id": 25, "roles": ["write"] }

@bp.get("/<int:tenant_id>")
@require_auth
def list_datasource_permissions(tenant_id):
    try:
        if not tenant_id:
            raise BadRequest("tenant_id is required", 400)

        permissions:List[DataSourcePermission] = DataSourcePermission.query.filter(
            DataSourcePermission.is_active==True, 
            DataSourcePermission.tenant_id==tenant_id
        ).all()

        return jsonify([p.to_dict() for p in permissions]), 200

    except ValueError:
        raise BadRequest("Datasource not found", 404)
    except Exception as e:
        raise

@bp.post("")
@require_auth
def create_or_update_permission():
    try:
        data = request.get_json()

        datasource_id = data["datasource_id"]
        user_id = data["user_id"]
        make_by = currentUserId()

        ds:DataSource = DataSource.query.get(datasource_id)
        if not ds:
            raise BadRequest("Datasource not found", 404)

        existing:DataSourcePermission = DataSourcePermission.query.filter(
            DataSourcePermission.datasource_id == datasource_id,
            DataSourcePermission.user_id == user_id
        ).first()

        if existing:
            # Update existing permission
            existing.role = data.get("role", existing.role)
            message = "Permission updated"
            permission = existing
            permission.updated_by_id = make_by
        else:
            # Create new permission
            permission = DataSourcePermission(
                datasource_id=datasource_id,
                connection_id=ds.connection.id if ds.connection else None,
                tenant_id=ds.tenant_id,
                type_id=ds.type_id,
                user_id=user_id,
                role=data.get("role"),
                created_by_id=make_by
            )
            db.session.add(permission)
            message = "Permission created"

        db.session.commit()

        return jsonify({ "message": message, "permission_id": permission.id }), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        raise
    except Exception as e:
        raise

@bp.put("/<int:permission_id>")
@require_auth
def update_permission(permission_id):
    try:
        permission:DataSourcePermission = DataSourcePermission.query.get(permission_id)
        if not permission:
            raise BadRequest("Permission not found", 404)

        data = request.get_json()
        if "role" in data:
            role = data["role"]
            permission.role = role

        permission.updated_by_id = currentUserId()
        db.session.commit()

        return jsonify({"message": "Permission updated"}), 200

    except Exception as e:
        db.session.rollback()
        raise

@bp.delete("/<int:permission_id>")
@require_auth
def delete_permission(permission_id):
    try:
        permission:DataSourcePermission = DataSourcePermission.query.get(permission_id)
        if not permission:
            raise BadRequest("Permission not found", 404)

        permission.deleted_by_id=currentUserId()
        
        db.session.delete(permission)
        db.session.commit()

        return jsonify({"message": "Permission deleted"}), 200

    except Exception as e:
        db.session.rollback()
        raise


@bp.get("/datasource/<int:tenant_id>/<int:datasource_id>")
@require_auth
def list_permissions_for_datasource(tenant_id,datasource_id):
    try:
        if not tenant_id:
            raise BadRequest("tenant_id is required", 400)

        permissions:List[DataSourcePermission] = DataSourcePermission.query.filter(
            DataSourcePermission.datasource_id==datasource_id, 
            DataSourcePermission.tenant_id==tenant_id
        ).all()

        return jsonify([p.to_dict() for p in permissions]), 200

    except ValueError:
        raise BadRequest("Datasource not found", 404)
    except Exception as e:
        raise

@bp.get("/user/<int:tenant_id>/<int:user_id>")
@require_auth
def list_permissions_for_user(tenant_id,user_id):
    try:
        if not tenant_id:
            raise BadRequest("tenant_id is required", 400)

        permissions:List[DataSourcePermission] = DataSourcePermission.query.filter(
            DataSourcePermission.user_id == user_id, 
            DataSourcePermission.tenant_id == tenant_id
        ).all()

        return jsonify([p.to_dict() for p in permissions]), 200

    except ValueError:
        raise BadRequest("Datasource not found", 404)
    except Exception as e:
        raise
