import json
from typing import Literal
import requests
from flask import Blueprint, request, jsonify, current_app
from sqlalchemy.exc import SQLAlchemyError
from models import db, ChwsDataSync, PatientSync, FamilySync, ChwSync, CouchDbUserSync


TIMEOUT = 30

class CHTClient:

    def __init__(self, host:str, username:str, password:str, is_secure:bool=True):
        protocole = "https" if is_secure else "http"
        self.base_url = self.normalise_url(protocole=protocole, host=host)
        self.auth = (username,password)

    def normalise_url(self, protocole: Literal["https","http"], host:str):
        if host.startswith("https://") or host.startswith("http://"):
            host = host.replace("https://", "").replace("http://", "")
        return f"{protocole}://{host}"

    def headers(self):
        return {
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

    def bulk_delete(self, docs):
        url = f"{self.base_url}/medic/_bulk_docs"
        response = requests.post(
            url,
            json={"docs": docs},
            headers=self.headers(),
            auth=self.auth,
            verify=False,
            timeout=TIMEOUT
        )
        response.raise_for_status()
        return response.json()

    def update_user_place(self, username, place):
        url = f"{self.base_url}/api/v1/users/{username}"
        response = requests.post(
            url,
            json={"place": place},
            headers=self.headers(),
            auth=self.auth,
            verify=False,
            timeout=TIMEOUT
        )
        response.raise_for_status()
        return response.json()

    def get_contact(self, contact_id):
        url = f"{self.base_url}/medic/{contact_id}"
        response = requests.get(
            url,
            headers=self.headers(),
            auth=self.auth,
            verify=False,
            timeout=TIMEOUT
        )

        response.raise_for_status()

        return response.json()

    def update_contact(self, data):

        url = f"{self.base_url}/api/v1/people"
        response = requests.post(
            url,
            json=data,
            headers=self.headers(),
            auth=self.auth,
            verify=False,
            timeout=TIMEOUT
        )

        response.raise_for_status()

        return response.json()
    





bp = Blueprint("couchdb", __name__)


# DELETE DOCUMENTS FROM COUCHDB
@bp.route("/delete-from-couchdb", methods=["POST"])
def delete_from_couchdb():
    try:
        data = request.get_json(silent=True)

        if not data:
            return jsonify(status=400, message="Invalid JSON body"), 400

        todelete = data.get("data_to_delete")
        req_type = data.get("type")
        host = data.get("host")
        username = data.get("username")
        password = data.get("password")

        if not todelete or not isinstance(todelete, list):
            return jsonify(status=400, message="data_to_delete must be a list"), 400

        if not req_type:
            return jsonify(status=400, message="type is required"), 400

        all_ids = [d.get("_id") for d in todelete if d.get("_id")]
        if not all_ids:
            return jsonify(status=400, message="No valid document ids provided"), 400

        cht = CHTClient(host=host, username=username, password=password)

        res = cht.bulk_delete(docs={"docs": todelete})

        return jsonify(status=200, data=res), 200
    except requests.RequestException as e:
        return jsonify(status=500, message="CouchDB request failed", error=str(e)), 500

    except Exception as e:
        return jsonify(status=500, message="Unexpected error", error=str(e)), 500


# UPDATE USER FACILITY + CONTACT PLACE
@bp.route("/update-user-facility", methods=["POST"])
def update_user_facility():
    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify(status=400, message="Invalid JSON body"), 400

        code = data.get("code")
        parent = data.get("parent")
        contact_id = data.get("contact")
        new_parent = data.get("new_parent")
        cht_username = data.get("cht_username")
        host = data.get("host")
        username = data.get("username")
        password = data.get("password")

        if not all([code, parent, contact_id, new_parent, cht_username, host, username, password]):
            return jsonify(status=400, message="Missing required parameters"), 400

        cht = CHTClient(host=host, username=username, password=password)
        # Update USER place
        try:
            resp = cht.update_user_place(cht_username, new_parent)
        except requests.RequestException as e:
            return jsonify(status=500, message="User update failed", error=str(e)), 500

        if resp.status_code not in [200, 201]:
            return jsonify(status=resp.status_code, message="Failed updating user place"), resp.status_code

        # GET CONTACT
        try:
            contact_data = cht.get_contact(contact_id)
        except requests.RequestException as e:
            return jsonify(status=500, message="Contact fetch failed", error=str(e)), 500

        # if contact_resp.status_code != 200:
        #     return jsonify(status=contact_resp.status_code, message="Failed retrieving contact"), contact_resp.status_code


        if "parent" not in contact_data:
            return jsonify(status=500, message="Invalid contact structure"), 500

        contact_data["parent"]["_id"] = new_parent

        # =============================================
        # UPDATE CONTACT
        # =============================================

        try:
            update_contact = cht.update_contact(contact_data)
        except requests.RequestException as e:
            return jsonify(status=500, message="Contact update failed", error=str(e)), 500

        # if update_contact.status_code not in [200, 201]:
        #     return jsonify(status=update_contact.status_code, message="Failed updating contact"), update_contact.status_code

        return jsonify(
            status=200,
            message="Vous avez changé la zone de l'ASC avec succès"
        ), 200

    except json.JSONDecodeError:
        return jsonify(status=500, message="Invalid JSON from CouchDB"), 500

    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify(status=500, message="Database error", error=str(e)), 500

    except Exception as e:
        return jsonify(status=500, message="Unexpected error", error=str(e)), 500