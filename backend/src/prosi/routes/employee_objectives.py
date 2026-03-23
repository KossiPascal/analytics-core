from flask import Blueprint, request, jsonify, g
from backend.src.security.access_security import require_auth, currentUserId
from backend.src.prosi.services import employee_objective_service as svc
from backend.src.logger import get_backend_logger

logger = get_backend_logger(__name__)
bp = Blueprint("prosi_emp_objectives", __name__, url_prefix="/api/prosi/employee-objectives")


def _tid():
    return int(g.current_user.get("tenant_id"))


@bp.get("")
@require_auth
def list_objectives():
    tid = _tid()
    params = {
        "employee_id":    request.args.get("employee_id",   type=int),
        "user_id":        request.args.get("user_id",       type=int),
        "project_id":     request.args.get("project_id",    type=int),
        "fiscal_year":    request.args.get("fiscal_year",   type=int),
        "quarter":        request.args.get("quarter"),
        "status":         request.args.get("status"),
        "reviewer_id":    request.args.get("reviewer_id",   type=int),
        "pending_review": request.args.get("pending_review", "false").lower() == "true",
    }
    objs = svc.list_objectives(tid, **{k: v for k, v in params.items() if v is not None and v is not False or k == "pending_review"})
    return jsonify([o.to_dict_safe() for o in objs]), 200


@bp.post("")
@require_auth
def create_objective():
    tid  = _tid()
    body = request.get_json(force=True) or {}
    obj  = svc.create_objective(tid, currentUserId(), body)
    return jsonify(obj.to_dict_safe()), 201


@bp.get("/<int:id>")
@require_auth
def get_objective(id):
    obj = svc.get_objective(id, _tid())
    return jsonify(obj.to_dict_safe()), 200


@bp.put("/<int:id>")
@require_auth
def update_objective(id):
    obj  = svc.get_objective(id, _tid())
    body = request.get_json(force=True) or {}
    obj  = svc.update_objective(obj, currentUserId(), body)
    return jsonify(obj.to_dict_safe()), 200


@bp.post("/<int:id>/submit")
@require_auth
def submit_objective(id):
    obj = svc.get_objective(id, _tid())
    obj = svc.submit_objective(obj, currentUserId())
    return jsonify(obj.to_dict_safe()), 200


@bp.post("/<int:id>/review")
@require_auth
def review_objective(id):
    obj  = svc.get_objective(id, _tid())
    body = request.get_json(force=True) or {}
    decision     = body.get("decision")          # APPROVED | REJECTED
    review_notes = body.get("review_notes", "")
    score        = body.get("score")
    current_value = body.get("current_value")
    obj = svc.review_objective(
        obj, currentUserId(), decision,
        review_notes=review_notes,
        score=float(score) if score is not None else None,
        current_value=float(current_value) if current_value is not None else None,
    )
    return jsonify(obj.to_dict_safe()), 200


@bp.post("/<int:id>/complete")
@require_auth
def complete_objective(id):
    obj  = svc.get_objective(id, _tid())
    body = request.get_json(force=True) or {}
    obj  = svc.complete_objective(
        obj, currentUserId(),
        score=float(body["score"]) if body.get("score") is not None else None,
        current_value=float(body["current_value"]) if body.get("current_value") is not None else None,
    )
    return jsonify(obj.to_dict_safe()), 200


@bp.delete("/<int:id>")
@require_auth
def delete_objective(id):
    obj = svc.get_objective(id, _tid())
    svc.delete_objective(obj, currentUserId())
    return jsonify({"message": "Objectif supprimé"}), 200


@bp.get("/team-summary")
@require_auth
def team_summary():
    tid         = _tid()
    fiscal_year = request.args.get("fiscal_year", type=int)
    quarter     = request.args.get("quarter")
    if not fiscal_year or not quarter:
        return jsonify({"error": "fiscal_year et quarter requis"}), 400
    data = svc.get_team_summary(tid, fiscal_year, quarter)
    return jsonify(data), 200
