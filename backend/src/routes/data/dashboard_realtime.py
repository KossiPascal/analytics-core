from flask import Blueprint, request, jsonify
from sqlalchemy import text
from backend.src.database.extensions import engine

# -----------------------------
# Flask Blueprint / Controller
# -----------------------------
bp = Blueprint("api_tokens", __name__, url_prefix="/api_tokens")

# ============================
# Error messages
# ============================
PARAMETERS_ERROR_MSG = "Les paramettres renseignés sont vides"
NOT_AUTHORIZED_MSG = "Vous n'êtes pas autorisé à effectuer cette action!"
def server_error_msg(error=None):
    return str(error) if error else "Erreur Interne Du Serveur"


# ============================
# Helper function: Vaccination Data Export
# ============================
def vaccination_data_export(params: dict, view_name: str):
    try:
        user_id = params.get("userId")
        recos = params.get("recos")
        months = params.get("months")
        year = params.get("year")
        full_data = params.get("fullData", False)

        if not user_id or not view_name:
            return {"status": 401, "data": NOT_AUTHORIZED_MSG}

        if not isinstance(recos, list) or len(recos) == 0:
            return {"status": 400, "data": PARAMETERS_ERROR_MSG}

        recos_array = [str(r) for r in recos]
        months_array = [str(m) for m in months] if isinstance(months, list) else ([str(months)] if months else [])

        # Build SQL placeholders
        query_params = {}
        reco_placeholders = ", ".join([f":reco{i}" for i in range(len(recos_array))])
        for i, r in enumerate(recos_array):
            query_params[f"reco{i}"] = r

        query = f"SELECT * FROM {view_name} WHERE (reco->>'id') IN ({reco_placeholders})"

        if year is not None:
            query += " AND year = :year"
            query_params["year"] = year

        if months_array:
            month_placeholders = ", ".join([f":month{i}" for i in range(len(months_array))])
            query += f" AND month IN ({month_placeholders})"
            for i, m in enumerate(months_array):
                query_params[f"month{i}"] = m

        # Execute query
        with engine.connect() as conn:
            result = conn.execute(text(query), query_params).mappings().all()

        # If full_data is False, return raw data
        if not full_data:
            return {"status": 200, "data": list(result)}

        # full_data filtering
        final_data = []
        for vacc in result:
            children_vaccines = vacc.get("children_vaccines")
            if not isinstance(children_vaccines, list):
                continue

            filtered_children = []
            for vc in children_vaccines:
                vc_data = vc.get("data")
                if not isinstance(vc_data, list) or len(vc_data) == 0:
                    continue

                valid_data = [v for v in vc_data]  # business logic: no filter applied
                if valid_data:
                    new_vc = dict(vc)
                    new_vc["data"] = valid_data
                    filtered_children.append(new_vc)

            if filtered_children:
                new_vacc = dict(vacc)
                new_vacc["children_vaccines"] = filtered_children
                final_data.append(new_vacc)

        return {"status": 200, "data": final_data}

    except Exception as e:
        print("error:", e)
        return {"status": 500, "data": server_error_msg(e)}


# ============================
# Vaccination Endpoints
# ============================
@bp.route("/reco/vaccination/not-done", methods=["POST"])
def get_reco_vaccination_not_done_dashboard():
    body = request.get_json()
    result = vaccination_data_export(body, "dashboards_reco_vaccination_not_done_view")
    return jsonify(result), result["status"]

@bp.route("/reco/vaccination/all-done", methods=["POST"])
def get_reco_vaccination_all_done_dashboard():
    body = request.get_json()
    result = vaccination_data_export(body, "dashboards_reco_vaccination_all_done_view")
    return jsonify(result), result["status"]

@bp.route("/reco/vaccination/partial-done", methods=["POST"])
def get_reco_vaccination_partial_done_dashboard():
    body = request.get_json()
    result = vaccination_data_export(body, "dashboards_reco_vaccination_partial_done_view")
    return jsonify(result), result["status"]
