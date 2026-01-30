from flask import Blueprint, request, jsonify
import pandas as pd
from sqlalchemy import text
from db import engine

bp = Blueprint("query", __name__)

@bp.post("/query")
def run_query():
    q = request.json
    sql = f"""
    SELECT {','.join(q['dimensions'])},
           {','.join(f"{m['aggregation']}({m['column']}) as {m['label']}" for m in q['metrics'])}
    FROM {q['datasetId']}
    GROUP BY {','.join(q['dimensions'])}
    """
    df = pd.read_sql(text(sql), engine)
    return jsonify(df.to_dict(orient="records"))
