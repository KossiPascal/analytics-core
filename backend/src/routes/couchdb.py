from flask import Blueprint, request, jsonify
from typing import Any, Dict

# from backend.src.celery_module.tasks_sync import dispatch_all_sources
from backend.src.models.couchdb import CibleDatabase, CouchdbSource
from backend.src.security.access_security import require_auth
from backend.src.logger import get_backend_logger
from backend.src.databases.extensions import db, error_response, success_response, get_json_payload, CouchdbSourceMap
from sqlalchemy.exc import SQLAlchemyError

from shared_libs.helpers.utils import encrypt
from workers.couchdb.models import CreateTableModel

logger = get_backend_logger(__name__)

bp = Blueprint("couchdb", __name__, url_prefix="/api/couchdb")

# Singleton platform instance


@bp.get("")
@require_auth
def list_sources():
    try:
        # sources:list[CouchdbSource] = CouchdbSource.query.all()
        # results = [s.to_dict_safe() for s in sources]

        # return jsonify(results), 200
        return []
    except SQLAlchemyError as e:
        logger.error(f"Failed to list sources: {str(e)}")
        return error_response("Failed to list sources", 500, str(e))


@bp.post("")
@require_auth
def add_source():
    payload = get_json_payload()
    try:
        data = CouchdbSourceMap(payload)

        source:CouchdbSource = CouchdbSource(
            name=data.name,
            description=data.description,
            host=data.host,
            base_url=data.base_url,
            port=data.port,
            username_enc=encrypt(data.username),
            password_enc=encrypt(data.password),
            dbname=data.dbname,
            auto_sync=data.auto_sync,
            is_active=data.is_active,
        )
        db.session.add(source)
        db.session.commit()

        ModelMgr = CreateTableModel(db, project_name=source.name, create_table=True)
        ModelMgr.create_sync_states_table()
        ModelMgr.create_sync_status_table()
        for cible in CibleDatabase.couchdb_names():
            ModelMgr.create_source_table(cible.local_name)
            
        db.session.close()

        logger.info("Source created: %s", source.name)
        return jsonify({"id": source.id}), 201
    except SQLAlchemyError as e:
        db.session.rollback()
        return error_response(f"Failed to create Source -> {str(e)}", 500)


@bp.put("/<int:source_id>")
@require_auth
def update_source(source_id):
    # payload = request.get_json(silent=True)

    # try:
    #     data:CouchdbSource = CouchdbSource.query.get(source_id)
    #     if not data:
    #         return error_response("Source not found", 404)

    #     dt = CouchdbSourceMap(payload)

    #     data.name = dt.name
    #     data.host = dt.host
    #     data.base_url = dt.base_url
    #     data.port = dt.port
    #     data.username = dt.username
    #     data.password = dt.password
    #     data.dbname = dt.dbname
    #     data.auto_sync = dt.auto_sync
    #     data.is_active = dt.is_active

    #     db.session.commit()

    #     logger.info("Source updated: %s", data.name)
    #     return jsonify({"message": "Source updated"}), 200

    # except SQLAlchemyError as e:
    #     db.session.rollback()
    #     return error_response(f"Failed to update source -> {str(e)}", 500)
    pass


# Delete source
@bp.delete("/<int:source_id>")
@require_auth
def delete_source(source_id):
    # try:
    #     ds:CouchdbSource = CouchdbSource.query.get_or_404(source_id)
    #     ds.is_active = False
    #     db.session.commit()
    #     return jsonify({"status": "deleted"})
    # except ValueError as e:
    #     return error_response(str(e), 404)
    # except SQLAlchemyError as e:
    #     db.session.rollback()
    #     return error_response("Failed to delete source", 500, str(e))
    pass


# @bp.post("/sync")
# def trigger_sync():
#     dispatch_all_sources.delay()
#     return {"status": "sync started"}


# -------------------------------------------------------------------
# Routes
# -------------------------------------------------------------------

@bp.post("/connect")
@require_auth
def connect_couchdb():
    # """
    # Initialize CouchDB database & schema
    # """
    # try:
    #     payload = get_json_payload()
    #     data = CouchdbSourceMap(payload)

    #     logger.info(f"Initializing CouchDB schema: db={data.name}, auto_sync={data.auto_sync}")

    #     platform.initialiseCouchDbProperties(
    #         couchdb_base_url=data.base_url, 
    #         project_name=data.name, 
    #         auth = (data.username,data.password,) if data.username and data.password else None, 
    #         auto_sync=data.auto_sync,
    #         timeout = None
    #     )
        
    #     result, status = platform.initialize_couchdb_schema()

    #     if status != 200:
    #         return error_response(result, status)

    #     return success_response(result)

    # except ValueError as e:
    #     return error_response(str(e), 400)

    # except Exception as e:
    #     logger.error(f"CouchDB connect failed: {str(e)}")
    #     return error_response(str(e), 500)

    pass


@bp.post("/upsert")
@require_auth
def upsert_couchdb_doc():
    """
    Insert or update a document in a CouchDB collection
    """
    try:
        payload = get_json_payload()

        db_name: str | None = payload.get("db_name")
        collection: str | None = payload.get("collection")
        doc: Dict[str, Any] | None = payload.get("doc")



        # project_name: str | None = payload.get("project_name")
        # couchdb_base_url: str | None = payload.get("couchdb_base_url")
        # couchdb_user: str | None = payload.get("couchdb_user")
        # couchdb_pass: str | None = payload.get("couchdb_pass")
        # auto_sync: bool = bool(payload.get("auto_sync", False))

        # if not all([db_name, collection, doc]):
        #     return error_response("db_name, collection and doc are required")

        # platform.initialiseCouchDbProperties(
        #     couchdb_base_url=couchdb_base_url, 
        #     project_name=project_name, 
        #     auth = (couchdb_user,couchdb_pass,) if couchdb_user and couchdb_pass else None, 
        #     auto_sync=auto_sync,
        #     timeout = None
        # )

        # logger.info(f"Upsert document: db={db_name}, collection={collection}")
        # platform.upsert_document(db_name=db_name,collection=collection,document=doc)

        return success_response({"message": "Document upserted successfully"})

    except ValueError as e:
        return error_response(str(e), 400)

    except Exception as e:
        logger.error(f"Upsert document failed: {str(e)}")
        return error_response(str(e), 500)


@bp.post("/lastseq")
@require_auth
def update_couchdb_last_seq():
    """
    Update last CouchDB replication sequence
    """
    try:
        payload = get_json_payload()

        db_name: str | None = payload.get("db_name")
        seq: str | int | None = payload.get("seq")

        # project_name: str | None = payload.get("project_name")
        # couchdb_base_url: str | None = payload.get("couchdb_base_url")
        # couchdb_user: str | None = payload.get("couchdb_user")
        # couchdb_pass: str | None = payload.get("couchdb_pass")
        # auto_sync: bool = bool(payload.get("auto_sync", False))

        # if not all([db_name, collection, doc]):
        #     return error_response("db_name, collection and doc are required")

        # platform.initialiseCouchDbProperties(
        #     couchdb_base_url=couchdb_base_url, 
        #     project_name=project_name, 
        #     auth = (couchdb_user,couchdb_pass,) if couchdb_user and couchdb_pass else None, 
        #     auto_sync=auto_sync,
        #     timeout = None
        # )

        # if not db_name or seq is None:
        #     return error_response("db_name and seq are required")

        # logger.info(f"Updating last_seq: db={db_name}, seq={seq}")
        # platform.update_last_seq(db_name=db_name,seq=seq)

        return success_response({"message": "Last sequence updated"})

    except ValueError as e:
        return error_response(str(e), 400)

    except Exception as e:
        logger.error(f"Update last_seq failed: {str(e)}")
        return error_response(str(e), 500)
