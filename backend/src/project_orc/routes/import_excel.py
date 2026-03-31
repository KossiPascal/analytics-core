from flask import Blueprint, request, jsonify, g
from backend.src.security.access_security import require_auth, currentUserId
from backend.src.project_orc.services import import_service
from backend.src.logger import get_backend_logger

logger = get_backend_logger(__name__)
bp = Blueprint("prosi_import", __name__, url_prefix="/api/prosi/import")


@bp.get("/sheets")
@require_auth
def get_sheets():
    """Retourne la liste des feuilles d'un fichier Excel uploadé (sans importer)."""
    import openpyxl
    from io import BytesIO

    if "file" not in request.files:
        return jsonify({"error": "Fichier manquant"}), 400

    file = request.files["file"]
    if not file.filename.endswith((".xlsx", ".xlsm")):
        return jsonify({"error": "Format non supporté, utilisez .xlsx"}), 400

    try:
        content = file.read()
        wb = openpyxl.load_workbook(BytesIO(content), read_only=True)
        sheets = wb.sheetnames
        wb.close()
        return jsonify({"sheets": sheets}), 200
    except Exception as e:
        logger.error(f"Erreur lecture feuilles: {e}")
        return jsonify({"error": f"Fichier Excel invalide : {e}"}), 400


@bp.post("/okr")
@require_auth
def import_okr():
    """
    Import OKR depuis un fichier Excel multipart.
    Form data:
      - file        : le fichier .xlsx
      - project_id  : ID du projet PROSI cible
      - fiscal_year : ex 2026
      - quarter     : T1 | T2 | T3 | T4 | YEARLY
      - sheets[]    : feuilles à importer (facultatif, défaut = toutes)
      - overwrite   : "true" pour mettre à jour les ORCs existants
    """
    if "file" not in request.files:
        return jsonify({"error": "Fichier manquant"}), 400

    file = request.files["file"]
    if not file.filename.endswith((".xlsx", ".xlsm")):
        return jsonify({"error": "Format non supporté, utilisez .xlsx"}), 400

    project_id  = request.form.get("project_id",  type=int)
    fiscal_year = request.form.get("fiscal_year", type=int)
    quarter     = request.form.get("quarter",     default=None)
    sheets_raw  = request.form.getlist("sheets[]") or request.form.getlist("sheets")
    overwrite   = request.form.get("overwrite", "false").lower() == "true"

    if not project_id:
        return jsonify({"error": "project_id requis"}), 400

    tenant_id = int(g.current_user.get("tenant_id"))

    try:
        stats = import_service.import_okr_from_xlsx(
            file_storage=file,
            project_id=project_id,
            tenant_id=tenant_id,
            user_id=currentUserId(),
            fiscal_year=fiscal_year,
            quarter=quarter or None,
            sheet_names=sheets_raw or None,
            overwrite=overwrite,
        )
        return jsonify({
            "message": "Import terminé avec succès",
            "stats": stats,
        }), 200
    except Exception as e:
        logger.error(f"Erreur import OKR: {e}")
        return jsonify({"error": str(e)}), 400
