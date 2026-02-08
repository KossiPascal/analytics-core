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
# GET_RECO_PERFORMANCE_DASHBOARD
# ============================
@bp.route('/reco/performance-dashboard', methods=['POST'])
def get_reco_performance_dashboard():
    try:
        data = request.get_json()
        user_id = data.get("userId")
        months = data.get("months")
        year = data.get("year")
        recos = data.get("recos")
        sync = data.get("sync", False)

        if not user_id:
            return jsonify(status=201, data=NOT_AUTHORIZED_MSG), 201

        if not months or not year or not recos:
            return jsonify(status=201, data=PARAMETERS_ERROR_MSG), 201

        if not isinstance(months, list):
            months = [months]
        if not isinstance(recos, list):
            recos = [recos]

        # Build query placeholders
        months_placeholders = ", ".join([f":month{i}" for i in range(len(months))])
        recos_placeholders = ", ".join([f":reco{i}" for i in range(len(recos))])

        # Prepare parameters dictionary
        params = {f"month{i}": m for i, m in enumerate(months)}
        params["year"] = year
        params.update({f"reco{i}": r for i, r in enumerate(recos)})

        # Monthly performance
        query_perf = text(f"""
            SELECT * FROM dashboards_reco_performance_view
            WHERE month IN ({months_placeholders})
            AND year = :year
            AND (reco->>'id')::text IN ({recos_placeholders})
        """)
        with engine.connect() as conn:
            data_perf = conn.execute(query_perf, params).fetchall()

        # Full year performance
        recos_placeholders_full_year = ", ".join([f":reco{i}" for i in range(len(recos))])
        query_year = text(f"""
            SELECT * FROM dashboards_reco_performance_full_year_view
            WHERE year = :year
            AND (reco->>'id')::text IN ({recos_placeholders_full_year})
        """)
        with engine.connect() as conn:
            year_data_perf = conn.execute(query_year, {"year": year, **{f"reco{i}": r for i, r in enumerate(recos)}}).fetchall()

        return jsonify(status=200, data=[dict(r) for r in data_perf], yearData=[dict(r) for r in year_data_perf]), 200

    except Exception as e:
        return jsonify(status=500, data=server_error_msg(e)), 500


# ============================
# GET_ACTIVE_RECO_DASHBOARD
# ============================
@bp.route('/reco/active-dashboard', methods=['POST'])
def get_active_reco_dashboard():
    try:
        data = request.get_json()
        user_id = data.get("userId")
        year = data.get("year")
        recos = data.get("recos")
        sync = data.get("sync", False)

        if not user_id:
            return jsonify(status=201, data=NOT_AUTHORIZED_MSG), 201
        if not year or not recos:
            return jsonify(status=201, data=PARAMETERS_ERROR_MSG), 201

        if not isinstance(recos, list):
            recos = [recos]

        recos_placeholders = ", ".join([f":reco{i}" for i in range(len(recos))])

        query = text(f"""
            SELECT * FROM dashboards_active_reco_view
            WHERE year = :year
            AND (reco->>'id')::text IN ({recos_placeholders})
        """)
        with engine.connect() as conn:
            datas = conn.execute(query, {"year": int(year), **{f"reco{i}": r for i, r in enumerate(recos)}}).fetchall()

        return jsonify(status=200, data=[dict(r) for r in datas]), 200

    except Exception as e:
        return jsonify(status=500, data=server_error_msg(e)), 500


# ============================
# GET_RECO_TASKS_STATE_DASHBOARD
# ============================
@bp.route('/reco/tasks-state-dashboard', methods=['POST'])
def get_reco_tasks_state_dashboard():
    try:
        data = request.get_json()
        user_id = data.get("userId")
        recos = data.get("recos")
        start_date = data.get("start_date")
        end_date = data.get("end_date")
        sync = data.get("sync", False)

        if not user_id:
            return jsonify(status=401, data=NOT_AUTHORIZED_MSG), 401
        if not start_date or not end_date or not recos:
            return jsonify(status=400, data=PARAMETERS_ERROR_MSG), 400

        if not isinstance(recos, list):
            recos = [recos]

        recos_placeholders = ", ".join([f":reco{i}" for i in range(len(recos))])

        query = text(f"""
            SELECT * FROM dashboards_tasks_state_view
            WHERE due_date BETWEEN :start_date AND :end_date
            AND (reco->>'id')::text IN ({recos_placeholders})
        """)

        with engine.connect() as conn:
            datas = conn.execute(query, {"start_date": start_date, "end_date": end_date, **{f"reco{i}": r for i, r in enumerate(recos)}}).fetchall()

        return jsonify(status=200, data=[dict(r) for r in datas]), 200

    except Exception as e:
        return jsonify(status=500, data=server_error_msg(e)), 500

