# identities.py
from typing import List
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, g
from backend.src.databases.extensions import db
from backend.src.models.tenant import CHT_SOURCE_TYPES, TenantSource, TargetTypes
from backend.src.security.access_security import require_auth, currentUserId
from backend.src.logger import get_backend_logger

from werkzeug.exceptions import BadRequest
from sqlalchemy.exc import SQLAlchemyError, IntegrityError

from workers.couchdb.models import CreateTableModel

logger = get_backend_logger(__name__)

bp = Blueprint("identities_tenant_sources", __name__, url_prefix="/api/identities/tenant-sources")

def create_source_tables(target:str, source_name:str):
    if target == TargetTypes.COUCHDB.value:
        ModelMgr = CreateTableModel(db, source_name=source_name, create_table=True)
        ModelMgr.create_sync_states_table()
        ModelMgr.create_sync_status_table()
        for source_type in CHT_SOURCE_TYPES:
            ModelMgr.create_source_table(source_type.localdb)

# ===================== TENANT SOURCES =====================
@bp.get("")
@require_auth
def list_tenant_sources():
    try:
        tenant_id = request.args.get("tenant_id", type=int)
        if not tenant_id:
            raise BadRequest("tenant_id is required", 400)
        
        sources: List[TenantSource] = TenantSource.query.filter(
            TenantSource.deleted==False, 
            TenantSource.tenant_id==tenant_id
        ).order_by(TenantSource.created_at).all()

        return jsonify([t.to_dict() for t in sources if t is not None]), 200
    except Exception as e:
        logger.error(f"List sources error: {str(e)}")
        raise BadRequest("Failed to list sources", 500)


@bp.get("/<int:source_id>")
@require_auth
def get_tenant_source(source_id: int):
    try:
        tenant_id = request.args.get("tenant_id", type=int)
        if not tenant_id:
            raise BadRequest("tenant_id is required", 400)
        
        source:TenantSource = TenantSource.query.filter(
            TenantSource.deleted==False, 
            TenantSource.tenant_id==tenant_id,
            TenantSource.id==source_id,
        ).first()
        if not source:
            raise BadRequest(f"TenantSource with id={source_id} not found", 404)
        
        return jsonify(source.to_dict()), 200
    
    except Exception as e:
        logger.error(f"Get source error: {str(e)}")
        raise BadRequest("Failed to get source", 500)


@bp.get("/upsert-tables/<int:source_id>")
@require_auth
def upsert_tenant_source_tables(source_id: int):
    try:
        tenant_id = request.args.get("tenant_id", type=int)
        if not tenant_id:
            raise BadRequest("tenant_id is required", 400)
        
        source:TenantSource = TenantSource.query.filter(
            TenantSource.deleted==False, 
            TenantSource.tenant_id==tenant_id,
            TenantSource.id==source_id,
        ).first()
        if not source:
            raise BadRequest(f"TenantSource with id={source_id} not found", 404)
        
        create_source_tables(source.target, source.name)

        return jsonify(source.to_dict()), 200
    
    except Exception as e:
        logger.error(f"Get source error: {str(e)}")
        raise BadRequest("Failed to get source", 500)
    


@bp.post("")
@require_auth
def create_tenant_source():
    try:
        data = request.get_json(silent=True) or {}

        given_host = data.get("host")
        for field in {"name","host","target","tenant_id","username"}:
            if not data.get(field):
                raise BadRequest(f"{field} is required", 400)

        existing = TenantSource.query.filter_by(given_host=given_host).first()
        if existing:
            raise BadRequest(f"{given_host} already exists", 409)

        name=data.get("name")
        target=data.get("target")
        tenant_id=data.get("tenant_id")
        https=bool(data.get("https", True))


        targets = [TargetTypes.COUCHDB.value, TargetTypes.DHIS2.value]
        if not target in targets:
            raise BadRequest(f"target must be one of : {', '.join(targets)}", 409)

        source = TenantSource(
            name=name,
            https=https,
            given_host=given_host,
            target=target,
            tenant_id=tenant_id,
            username=data.get("username"),
            password=data.get("password"),
            fetch_limit=data.get("fetch_limit"),
            chunk_size=data.get("chunk_size"),
            config=data.get("config", {}),
            is_active=bool(data.get("is_active", True)),
        )
        source.created_by=currentUserId()

        create_source_tables(target, name)

        db.session.add(source)
        db.session.commit()
        return jsonify({"message": "TenantSource created", "source_id": source.id}), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Create tenant error: {str(e)}")
        raise BadRequest("Failed to create tenant", 500)


@bp.put("/<int:source_id>")
@require_auth
def update_tenant_source(source_id: int):
    try:
        data = request.get_json(silent=True) or {}

        tenant_id = data.get("tenant_id")
        given_host = data.get("host")
        https=bool(data.get("https", True))

        query = TenantSource.query.filter(
            TenantSource.id == source_id,
            TenantSource.tenant_id == tenant_id,
        )

        conf: TenantSource = query.filter(TenantSource.deleted == False).first()

        if not conf:
            raise BadRequest(f"TenantSource with id={source_id} not found", 404)

        # Champs obligatoires en update
        if not given_host:
            raise BadRequest("host is required", 400)

        # Vérification unicité host
        if given_host != conf.given_host:
            existing = query.filter(TenantSource.given_host == given_host,).first()
            if existing:
                raise BadRequest(f"{given_host} already exists", 409)

        conf.given_host = given_host

        fetch_limit = data.get("fetch_limit")
        chunk_size = data.get("chunk_size")
        config = data.get("config")
        is_active = data.get("is_active")
        update_auth = bool(data.get("update_auth",False))

        if "https" in data:
            conf.https = https

        if "fetch_limit" in data and fetch_limit:
            conf.fetch_limit = int(fetch_limit)

        if "chunk_size" in data and chunk_size:
            conf.chunk_size = int(chunk_size)

        if "config" in data and config:
            conf.config = config

        if "is_active" in data and is_active is not None:
            conf.is_active = bool(is_active)

        if update_auth == True:
            username = data.get("username")
            password = data.get("password")
            if not username or not password:
                raise BadRequest(f"Username and Password are required", 409)
            # ⚠️ Utilise les propriétés → encryption automatique
            conf.username = username
            conf.password = password

        conf.updated_by = currentUserId()

        db.session.commit()

        return jsonify({"message": "TenantSource updated"}), 200

    except SQLAlchemyError as e:
        print(e)
        db.session.rollback()
        raise BadRequest("Failed to update tenant", 500)


@bp.delete("/<int:source_id>")
@require_auth
def delete_tenant_source(source_id: int):
    try:
        source:TenantSource = TenantSource.query.get(source_id)
        if not source or source.deleted:
            raise BadRequest(f"TenantSource with id={source_id} not found", 404)
        source.is_active = False
        source.deleted = True
        source.deleted_at = datetime.now(timezone.utc)
        source.deleted_by=currentUserId()
        # source.deleted_by = g.current_user.id
        db.session.commit()
        return jsonify({"message": "TenantSource deleted"}), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        raise BadRequest("Failed to delete tenant", 500)


@bp.delete("/<int:source_id>/forever")
@require_auth
def delete_tenant_source_forever(source_id: int):
    try:
        source:TenantSource = TenantSource.query.get(source_id)
        if not source or source.deleted:
            raise BadRequest(f"TenantSource with id={source_id} not found", 404)
        source.deleted_by = g.current_user.id
        db.session.commit()
        return jsonify({"message": "TenantSource deleted"}), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        raise BadRequest("Failed to delete tenant", 500)

