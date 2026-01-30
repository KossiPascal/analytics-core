from flask import Blueprint, send_file
import pandas as pd
from io import BytesIO
import pdfkit

bp = Blueprint("export", __name__)

@bp.post("/export/excel")
def export_excel():
    df = pd.DataFrame(request.json["data"])
    output = BytesIO()
    df.to_excel(output, index=False)
    output.seek(0)
    return send_file(output, download_name="dashboard.xlsx")

@bp.post("/export/pdf")
def export_pdf():
    html = request.json["html"]
    pdf = pdfkit.from_string(html, False)
    return send_file(BytesIO(pdf), download_name="dashboard.pdf")
