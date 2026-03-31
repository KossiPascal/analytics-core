from flask import Blueprint, jsonify, g
from backend.src.security.access_security import require_auth
from backend.src.project_orc import services as svc
from backend.src.logger import get_backend_logger

logger = get_backend_logger(__name__)

bp = Blueprint("prosi_dashboard", __name__, url_prefix="/api/prosi/dashboard")


@bp.get("")
@require_auth
def dashboard_stats():
    tenant_id = int(g.current_user.get("tenant_id"))
    stats = svc.dashboard_service.get_dashboard_stats(tenant_id)
    return jsonify(stats), 200
