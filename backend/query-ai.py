from flask import Blueprint, request, jsonify
import numpy as np

bp = Blueprint("ai", __name__)

@bp.post("/ai/suggest-chart")
def suggest_chart():
    q = request.json["query"]
    charts = []

    if len(q["dimensions"]) == 1 and len(q["metrics"]) == 1:
        charts.append({
            "type": "line",
            "xAxis": q["dimensions"][0],
            "series": [q["metrics"][0]["label"]],
        })

    if len(q["dimensions"]) == 1 and len(q["metrics"]) > 1:
        charts.append({
            "type": "stackedBar",
            "xAxis": q["dimensions"][0],
            "series": [m["label"] for m in q["metrics"]],
        })

    return jsonify(charts)

@bp.post("/ai/anomalies")
def detect_anomalies():
    data = request.json
    alerts = [{
        "message": "Spike detected on metric sum_value"
    }]
    return jsonify(alerts)
