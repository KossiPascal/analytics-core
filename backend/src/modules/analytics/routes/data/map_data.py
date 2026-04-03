from flask import Blueprint, request, jsonify
from sqlalchemy import text
from backend.src.app.configs.extensions import db  # assuming you have SQLAlchemy db instance

bp = Blueprint('reco_maps', __name__, url_prefix='/reco-maps')


parametters_error_msg = "Les paramettres renseignés sont vides"
not_authorized_msg = "Vous n'êtes pas autorisé à effectuer cette action!"
server_error_msg = lambda error=None: f"{error or 'Erreur Interne Du Serveur'}"


@bp.route('/data', methods=['POST'])
def get_reco_data_maps():
    try:
        body = request.get_json()
        user_id = body.get('userId')
        months = body.get('months')
        year = body.get('year')
        recos = body.get('recos')

        # Authorization check
        if not user_id:
            return jsonify(status=201, data=not_authorized_msg), 201
        if not months or not year or not recos:
            return jsonify(status=201, data=parametters_error_msg), 201

        # Ensure lists
        if not isinstance(recos, list):
            recos = [recos]
        if not isinstance(months, list):
            months = [months]

        # Prepare placeholders for SQL query
        months_placeholders = ','.join([f":month{i}" for i in range(len(months))])
        recos_placeholders = ','.join([f":reco{i}" for i in range(len(recos))])
        
        query_params = {f"month{i}": month for i, month in enumerate(months)}
        query_params[f"year"] = year
        query_params.update({f"reco{i}": reco for i, reco in enumerate(recos)})

        # SQL Query
        sql = text(f"""
            SELECT * FROM reco_data_map_view
            WHERE month IN ({months_placeholders})
            AND year = :year
            AND (reco->>'id')::text IN ({recos_placeholders})
        """)

        result = db.session.execute(sql, query_params)
        datas = [dict(row) for row in result]

        return jsonify(status=200, data=datas), 200

    except Exception as err:
        return jsonify(status=500, data=server_error_msg(err)), 500
