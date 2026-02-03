from flask import Blueprint, request, jsonify, g
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime, timedelta
import requests
from models.database import AuditHistory
from database.extensions import db
from config import Config
from models.couchdb import CouchDBUsers  # your CouchDB ORM model
from security.access_decorators import require_auth
from helpers.logger import get_logger

logger = get_logger(__name__)

bp = Blueprint("databases", __name__, url_prefix="/api/databases")


# Utility Functions
def http_headers():
    return {"Content-Type": "application/json"}

def not_empty(value):
    return value is not None and value != ""

def log_audit(action, table_name, record_id, user, details=None):
    audit = AuditHistory(
        action=action,
        table_name=table_name,
        record_id=record_id,
        user=user,
        details=details or {},
        timestamp=datetime.utcnow()
    )
    db.session.add(audit)

def drop_or_truncate(entities: list, action: str, user: str, procide: bool):
    """Truncate or drop tables with audit logging"""
    if not procide:
        return {"status": 201, "success": False, "data": "No permission to proceed"}

    if action not in ["TRUNCATE", "DROP"]:
        return {"status": 201, "success": False, "data": "Action must be TRUNCATE or DROP"}

    try:
        for entity in entities:
            table = entity.get("table")
            if not_empty(table):
                query = None
                if action == "TRUNCATE":
                    query = f'TRUNCATE "{table}" RESTART IDENTITY CASCADE'
                elif action == "DROP":
                    query = f'DROP TABLE "{table}" CASCADE'

                if query:
                    db.session.execute(text(query))
                    # Log audit
                    audit = AuditHistory(action=action, table_name=table, user=user, record_id="*", details={})
                    db.session.add(audit)
                    db.session.commit()
        return {"status": 200, "success": True, "data": "Done successfully"}
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f"Drop/Truncate Error: {e}")
        return {"status": 500, "success": False, "data": str(e)}

# -----------------------------
# Routes
# -----------------------------
@bp.route("/entities", methods=["GET"])
@require_auth
def database_entities_list():
    try:
        entities = db.inspect(db.engine).get_table_names()
        return jsonify({"status": 200, "data": [{"name": t, "table": t} for t in entities]})
    except Exception as e:
        return jsonify({"status": 500, "data": str(e)})

@bp.route("/delete", methods=["POST"])
@require_auth
def delete_all_data():
    data = request.json
    procide = data.get("procide")
    entities = data.get("entities", [])
    action = data.get("action")
    user = data.get("user", "system")
    result = drop_or_truncate(entities, action, user, procide)
    return jsonify(result), result["status"]

@bp.route("/couchdb/get-data", methods=["POST"])
@require_auth
def get_reco_data():
    body = request.json
    cible = body.get("cible")
    type_ = body.get("type")
    start_date = body.get("start_date")
    end_date = body.get("end_date")

    if not (cible and type_ and start_date and end_date):
        return jsonify({"status": 201, "data": "Invalid parameters"}), 201

    try:
        if not isinstance(cible, list):
            cible = [c for c in cible if c != ""]
        results = []
        month_current = datetime.fromisoformat(start_date)
        end_date_dt = datetime.fromisoformat(end_date)

        while month_current <= end_date_dt:
            year = month_current.year
            month_str = f"{month_current.month:02d}"

            if type_ == "dashboards":
                rows = db.session.execute(text("""
                    SELECT d.id, r.name as user, 'Performance Dashboard' as form, 'reco_performance_dashboard' as table
                    FROM reco_performance_dashboard d
                    JOIN reco r ON d.reco->>'id' = r.id
                    WHERE (r.id IN :owners OR d.village_secteur->>'id' IN :owners)
                    AND d.year = :year AND d.month = :month
                """), {"owners": tuple(cible), "year": year, "month": month_str}).fetchall()
                results.extend([dict(r) for r in rows])

            # Implement 'reports', 'reco-data', 'patients', 'families', etc.
            month_current += timedelta(days=31)
            month_current = month_current.replace(day=1)

        return jsonify({"status": 200, "data": results})
    except Exception as e:
        return jsonify({"status": 201, "data": f"Error: {str(e)}"}), 201

@bp.route("/couchdb/delete", methods=["POST"])
@require_auth
def delete_from_couchdb():
    body = request.json
    to_delete = body.get("data_to_delete", [])
    req_type = body.get("type")
    user = body.get("user", "system")

    if not to_delete or not req_type:
        return jsonify({"status": 201, "data": "No Data Provided"}), 201

    try:
        response = requests.post(f"https://{Config.COUCHDB_BASE_URL}/medic/_bulk_docs", json={"docs": to_delete}, headers=http_headers())
        response.raise_for_status()

        for dt in to_delete:
            table = dt["_table"]
            record_id = dt["_id"]
            db.session.execute(text(f'DELETE FROM {table} WHERE id = :id'), {"id": record_id})
            # Log audit
            audit = AuditHistory(action="DELETE", table_name=table, record_id=record_id, user=user, details=dt)
            db.session.add(audit)
        db.session.commit()
        return jsonify({"status": 200, "data": response.json()})
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": 201, "data": str(e)}), 201


def update_reco_village_secteur(contact, new_parent):
    """
    Implement your logic for updating Reco village/secteur
    Return True if success, False otherwise
    """
    # Example placeholder:
    return True


def update_chws_district_quartier(contact, new_parent):
    """
    Implement your logic for updating CHW district/quartier
    Return True if success, False otherwise
    """
    # Example placeholder:
    return True


@bp.route("/update-facility", methods=["POST"])
@require_auth
def update_user_facility():
    """
    Update user's facility and contact place in CouchDB
    """
    try:
        data = request.json
        code = data.get("code")
        role = data.get("role")
        parent = data.get("parent")
        contact = data.get("contact")
        new_parent = data.get("new_parent")

        if not all([code, role, parent, contact, new_parent]):
            return jsonify({"status": 400, "message": "Missing parameters"}), 400

        # Fetch user from CouchDB repository
        user = CouchDBUsers.query.filter_by(type=role, roles=role, code=code, place=parent, contact=contact).first()

        if not user:
            return jsonify({"status": 404, "message": "Pas d'ASC trouvé pour procéder à l'opération, Réessayer !"}), 404

        # 1️⃣ Update user's facility in CouchDB
        resp = requests.post(
            f"https://{Config.USER_CHT_HOST}/api/v1/users/{user.username}",
            json={"place": new_parent},
            headers=http_headers(),
            timeout=15
        )
        resp.raise_for_status()

        # 2️⃣ Fetch user's contact info
        resp = requests.get(
            f"https://{Config.USER_CHT_HOST}/medic/{user.contact}",
            headers=http_headers(),
            timeout=15
        )
        resp.raise_for_status()
        contact_data = resp.json()

        # Update contact's parent ID
        contact_data["parent"]["_id"] = new_parent

        # 3️⃣ Update contact info in CouchDB
        resp = requests.post(
            f"https://{Config.USER_CHT_HOST}/api/v1/people",
            json=contact_data,
            headers=http_headers(),
            timeout=15
        )
        resp.raise_for_status()

        # 4️⃣ Update PostgreSQL / internal data
        update_success = False
        if role.lower() == "reco":
            update_success = update_reco_village_secteur(contact, new_parent)
        elif role.lower() == "chw":
            update_success = update_chws_district_quartier(contact, new_parent)

        if update_success:
            user.place = new_parent
            db.session.commit()
            return jsonify({"status": 200, "message": "Vous avez changé la zone de l'ASC avec succès !"})
        else:
            return jsonify({"status": 500, "message": "Erreur trouvée, contacter immédiatement l'administrateur!"}), 500

    except requests.HTTPError as e:
        logger.error(f"CouchDB request failed: {e}")
        return jsonify({"status": 500, "message": f"CouchDB Error: {str(e)}"}), 500
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return jsonify({"status": 500, "message": f"Server Error: {str(e)}"}), 500

# -----------------------------
# Additional secure routes (for full CRUD and audit)
# -----------------------------
@bp.route("/audit/history", methods=["GET"])
@require_auth
def get_audit_history():
    """Get audit history with optional filters"""
    try:
        table_name = request.args.get("table")
        query = AuditHistory.query
        if table_name:
            query = query.filter_by(table_name=table_name)
        audits = query.order_by(AuditHistory.timestamp.desc()).limit(100).all()
        return jsonify({"status": 200, "data": [a.__dict__ for a in audits]})
    except Exception as e:
        logger.error(f"Error fetching audit history: {e}")
        return jsonify({"status": 500, "data": str(e)})

@bp.route("/database/truncate-all", methods=["POST"])
@require_auth
def truncate_all_tables():
    """Truncate all tables (dangerous, requires procide)"""
    data = request.json
    procide = data.get("procide")
    user = g.user.get("username", "system")
    tables = [{"table": t} for t in db.inspect(db.engine).get_table_names()]
    result = drop_or_truncate(tables, "TRUNCATE", user, procide)
    return jsonify(result), result["status"]