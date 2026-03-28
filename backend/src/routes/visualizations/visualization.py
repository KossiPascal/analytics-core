import uuid
from typing import List, Optional
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, g
from backend.src.databases.extensions import db
from backend.src.models.visualization import AIQueryLog, DataLineage, DataTarget, Visualization, VisualizationChart, VisualizationDefinition, VisualizationDhis2Validation,VisualizationExecution, VisualizationExecutionLog, VisualizationLayout,VisualizationShare, VisualizationState, VisualizationStatus, VisualizationView
from backend.src.security.access_security import require_auth, currentUserId
from backend.src.logger import get_backend_logger

from werkzeug.exceptions import BadRequest, NotFound
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from sqlalchemy.orm import selectinload
from sqlalchemy import func
import json

logger = get_backend_logger(__name__)

bp = Blueprint("visualizations", __name__, url_prefix="/api/visualizations")


def normalize(data):
    return json.dumps(data or {}, sort_keys=True)

def extract_charts(payload_charts):
    return sorted([
        {
            "chart_id": c.get("chart_id"),
            "dataset_id": c.get("dataset_id"),
            "position": c.get("position", {})
        }
        for c in (payload_charts or [])
    ], key=lambda x: (x["chart_id"], x["dataset_id"]))

def commit_session():
    try:
        db.session.commit()
    except IntegrityError as e:
        db.session.rollback()
        raise BadRequest(f"Integrity error: {str(e.orig)}")
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.exception(e)
        raise BadRequest(f"Database error: {str(e)}")


def clone_visualization(template: Visualization, tenant_id: int, name: str) -> Visualization:

    user_id = currentUserId()

    viz = Visualization(
        tenant_id=tenant_id,
        name=name,
        type=template.type,
        description=template.description,
        status=VisualizationStatus.DRAFT,
        parent_id=template.id,
        created_by_id=user_id
    )
    db.session.add(viz)
    db.session.flush()  # pour obtenir l'id

    charts:List[VisualizationChart] = template.charts
    definitions:List[VisualizationDefinition] = template.definitions
    layouts:List[VisualizationLayout] = template.layouts

    # Cloner les charts
    for chart in charts:
        new_chart = VisualizationChart(
            chart_id=chart.chart_id,
            visualization_id=viz.id,
            dataset_id=chart.dataset_id,
            tenant_id=tenant_id,
            position=chart.position,
            created_by_id=user_id,
        )
        db.session.add(new_chart)

    # Cloner les définitions
    for definition in definitions:
        new_def = VisualizationDefinition(
            visualization_id=viz.id,
            version=1, #definition.version,
            config=definition.config,
            filters=definition.filters,
            is_active=definition.is_active,
            created_by_id=user_id,
        )
        db.session.add(new_def)

    for layout in layouts:
        new_layout = VisualizationLayout(
            tenant_id=tenant_id,
            visualization_id=viz.id,
            version=1,
            options=layout.options,
            layout=layout.layout,
            created_by_id=user_id,
        )
        db.session.add(new_layout)
        db.session.flush()

        views:List[VisualizationView] = layout.views
        for view in views:
            new_view = VisualizationView(
                tenant_id=tenant_id,
                visualization_id=viz.id,
                layout_id=new_layout.id,
                name=view.name,
                is_default=view.is_default,
                created_by_id=user_id,
            )
            db.session.add(new_view)

    return viz


# 📚 LIST Visualization
@bp.get("")
@require_auth
def list_visualizations():
    tenant_id = request.args.get("tenant_id", type=int)
    if not tenant_id:
        raise BadRequest("tenant_id is required", 400)
    
    query = Visualization.query.options(
        selectinload(Visualization.tenant),
        selectinload(Visualization.charts).selectinload(VisualizationChart.chart),
        selectinload(Visualization.layouts),
        selectinload(Visualization.views),
        # selectinload(Visualization.executions),
        # selectinload(Visualization.shares),
        # selectinload(Visualization.targets),
        # selectinload(Visualization.definitions),
        # selectinload(Visualization.dhis2_validations),
    ).filter(
        Visualization.tenant_id==tenant_id,
        Visualization.deleted == False,
    )

    vtype = request.args.get("type", type=str)
    status = request.args.get("status", type=str)
    search = request.args.get("search", type=str)
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)

    if vtype:
        query = query.filter(Visualization.type == vtype)
    if status:
        query = query.filter(Visualization.status == status)
    if search and search.strip() != '':
        query = query.filter(Visualization.name.ilike(f"%{search}%"))

    vizs:List[Visualization] = query.all()

    # print([v.to_dict() for v in vizs])
    return jsonify([v.to_dict() for v in vizs])

    # pgd = query.order_by(Visualization.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    # paginations = [v.serialize() for v in pgd.items]
    # return jsonify({ "items": paginations, "total": pgd.total, "page": pgd.page, "pages": pgd.pages }), 200


# 📄 GET ONE
@bp.get("/<int:vid>")
@require_auth
def get_visualization(vid:int):
    tenant_id = request.args.get("tenant_id", type=int)
    viz = Visualization.query.filter(
        Visualization.id == vid,
        Visualization.tenant_id == tenant_id
    ).first()
    if not viz:
        raise BadRequest("Visualization not found", 404)
    return jsonify(viz.to_dict())

# ✅ CREATE Visualization
@bp.post("")
@require_auth
def create_visualization():
    payload = request.get_json() or {}

    tenant_id = payload.get("tenant_id") # g.current_user["tenant_id"]
    if not tenant_id:
        raise BadRequest("tenant_id is required", 400)
    
    user_id=currentUserId()

    viz = Visualization(
        tenant_id=tenant_id,
        name=payload.get("name"),
        type=payload.get("type", "dashboard"),
        description=payload.get("description"),
        status=VisualizationStatus(payload.get("status", "draft")),
        is_template=payload.get("is_template", False),
        created_by_id=user_id,
    )
    db.session.add(viz)
    db.session.flush()

    if payload.get("definition"):
        version = db.session.query(
            func.coalesce(func.max(VisualizationDefinition.version), 0)
        ).filter_by(
            visualization_id=viz.id
        ).scalar() + 1

        VisualizationDefinition.query.filter_by(
            tenant_id=tenant_id,
            visualization_id=viz.id,
            is_active=True,
        ).update({"is_active": False})
        
        viz_def = VisualizationDefinition(
            tenant_id=tenant_id,
            visualization_id=viz.id,
            version=version,
            config=payload["definition"].get("config", {}),
            filters=payload["definition"].get("filters", {}),
            is_active=True,
            created_by_id=user_id,
        )
        db.session.add(viz_def)

    layout = payload.get("layout")
    layoutItems = layout.get("items") if layout else None

    if layout and layoutItems:

        version = db.session.query(
            func.coalesce(func.max(VisualizationLayout.version), 0)
        ).filter_by(
            tenant_id=tenant_id,
            visualization_id=viz.id
        ).scalar() + 1

        VisualizationLayout.query.filter_by(
            tenant_id=tenant_id,
            visualization_id=viz.id,
            is_active=True,
        ).update({"is_active": False})

        viz_layt = VisualizationLayout(
            tenant_id=tenant_id,
            visualization_id=viz.id,
            version=version,
            layout=layoutItems,
            options=layout.get("options", {}),
            created_by_id=user_id,
        )
        db.session.add(viz_layt)
        db.session.flush()

    for chart in payload.get("charts", []):
        chart_layout_id = chart.get("layout_id")
        viz_chart = VisualizationChart(
            tenant_id=tenant_id,
            visualization_id=viz.id,
            chart_id=chart.get("chart_id"),
            dataset_id=chart.get("dataset_id"),
            layout_id=viz_layt.id,
            position=chart.get("position") or {},
            created_by_id=user_id,
        )
        db.session.add(viz_chart)

    if payload.get("view"):
        is_default = bool(payload.get("is_default", False))
        view_layout_id = payload["view"].get("layout_id")

        if is_default:
            VisualizationView.query.filter_by(
                visualization_id=viz.id,
                tenant_id=tenant_id
            ).update({"is_default": False})
        
        viz_view = VisualizationView(
            tenant_id=tenant_id,
            visualization_id=viz.id,
            layout_id=viz_layt.id,
            name=payload["view"].get("name"),
            is_default=is_default,
            created_by_id=user_id,
        )
        db.session.add(viz_view)

    DataTarget.query.filter_by(tenant_id=tenant_id,visualization_id=viz.id).delete()
    viz_tgt = DataTarget(
        tenant_id=tenant_id,
        visualization_id=viz.id,
        type="visualization",
        name=viz.name,
        created_by_id=user_id,
    )
    db.session.add(viz_tgt)

    commit_session()
    return jsonify(viz.to_dict()), 201

# ✏️ UPDATE
@bp.put("/<int:vid>")
@require_auth
def update_visualization(vid:int):
    payload = request.get_json() or {}
    tenant_id = payload.get("tenant_id")

    viz:Visualization = Visualization.query.options(
        selectinload(Visualization.layouts),
        selectinload(Visualization.definitions),
    ).filter(
        Visualization.id == vid,
        Visualization.tenant_id == tenant_id
    ).first()
    if not viz:
        raise BadRequest("Visualization not found")

    for f in ["name", "type", "description"]:
        if f in payload:
            setattr(viz, f, payload[f])

    if "status" in payload:
        viz.status = VisualizationStatus(payload["status"])

    user_id=currentUserId()

    if payload.get("definition"):
        VisualizationDefinition.query.filter_by(
            tenant_id=tenant_id,
            visualization_id=viz.id,
            is_active=True
        ).update({"is_active": False})

        version = db.session.query(
            func.coalesce(func.max(VisualizationDefinition.version), 0)
        ).filter_by(tenant_id=tenant_id,visualization_id=viz.id).scalar() + 1
        
        viz_def = VisualizationDefinition(
            tenant_id=tenant_id,
            visualization_id=viz.id,
            version=version,
            config=payload["definition"].get("config", {}),
            filters=payload["definition"].get("filters", {}),
            is_active=True,
            created_by_id=user_id,
        )
        db.session.add(viz_def)


    layout = payload.get("layout")
    layoutItems = layout.get("items") if layout else None
    payload_charts = payload.get("charts") or []

    if layout and layoutItems:
        
        current_layout = db.session.query(VisualizationLayout).filter_by(
            tenant_id=tenant_id,
            visualization_id=viz.id,
            is_active=True
        ).first()

        layout_changed = True
        charts_changed = False

        if current_layout:
            layout_changed = (
                normalize(current_layout.layout) != normalize(layoutItems) or 
                normalize(current_layout.options) != normalize(layout.get("options", {}))
            )
            current_charts = db.session.query(VisualizationChart).filter_by(
                layout_id=current_layout.id
            ).all()

            current_charts_data = sorted([
                { "chart_id": c.chart_id, "dataset_id": c.dataset_id }
                for c in current_charts
            ], key=lambda x: (x["chart_id"], x["dataset_id"]))

            incoming_charts_data = sorted([
                { "chart_id": c.get("chart_id"), "dataset_id": c.get("dataset_id") }
                for c in payload_charts
            ], key=lambda x: (x["chart_id"], x["dataset_id"]))

            charts_changed = current_charts_data != incoming_charts_data


        # 🔥 CAS 1 : RIEN N'A CHANGÉ
        if not layout_changed and not charts_changed:
            return jsonify(viz.to_dict())

        # 🔥 CAS 2 : CHARTS SEULEMENT
        elif not layout_changed and charts_changed:
            # 👉 recréer charts sur layout existant
            VisualizationChart.query.filter_by(layout_id=current_layout.id).delete()
            for c in payload_charts:
                viz_chart = VisualizationChart(
                    visualization_id=viz.id,
                    tenant_id=tenant_id,
                    layout_id=current_layout.id,
                    chart_id=c.get("chart_id"),
                    dataset_id=c.get("dataset_id"),
                    position=c.get("position", {}),
                    created_by_id=user_id,
                )
                db.session.add(viz_chart)

        # 🔥 CAS 3 : LAYOUT (donc aussi charts)
        elif layout_changed:
            if current_layout:
                current_layout.is_active = False

            version = db.session.query(
                func.coalesce(func.max(VisualizationLayout.version), 0)
            ).filter_by(
                tenant_id=tenant_id,visualization_id=viz.id
            ).scalar() + 1

            new_layout = VisualizationLayout(
                tenant_id=tenant_id,
                visualization_id=viz.id,
                version=version,
                options=layout.get("options", {}),
                layout=layoutItems,
                is_active=True,
                created_by_id=user_id,
            )
            db.session.add(new_layout)
            db.session.flush()  # 🔥 IMPORTANT pour récupérer viz_lyt.id

            for c in payload_charts or []:
                viz_chart = VisualizationChart(
                    visualization_id=viz.id,
                    tenant_id=tenant_id,
                    layout_id=new_layout.id,
                    chart_id=c.get("chart_id"),
                    dataset_id=c.get("dataset_id"),
                    position=c.get("position", {}),
                    created_by_id=user_id,
                )
                db.session.add(viz_chart)


    DataTarget.query.filter_by(visualization_id=viz.id, tenant_id=tenant_id).update({ 
        "name": viz.name, 
        "updated_by_id": user_id
    })

    commit_session()
    return jsonify(viz.to_dict())

# 🗑 DELETE + BULK DELETE
@bp.delete("/<int:vid>")
@require_auth
def delete_visualization(vid:int):

    tenant_id = request.args.get("tenant_id", type=int)
    if not tenant_id:
        raise BadRequest("tenant_id is required", 400)
    
    viz:Visualization = Visualization.query.options(
        selectinload(Visualization.layouts),
        selectinload(Visualization.definitions),
    ).filter(
        Visualization.id == vid,
        Visualization.tenant_id == tenant_id
    ).first()
    
    if not viz:
        raise NotFound("Visualization not found")

    targets:List[DataTarget] = DataTarget.query.filter_by(tenant_id=tenant_id,visualization_id=vid).all()
    for t in targets:
        DataLineage.query.filter((DataLineage.source_id == t.id) | (DataLineage.target_id == t.id)).delete(synchronize_session=False)

    DataTarget.query.filter_by(tenant_id=tenant_id,visualization_id=vid).delete(synchronize_session=False)

    VisualizationExecutionLog.query.filter(
        VisualizationExecutionLog.execution_id.in_(
            db.session.query(VisualizationExecution.id).filter_by(tenant_id=tenant_id,visualization_id=vid)
        )
    ).delete(synchronize_session=False)

    VisualizationLayout.query.filter_by(tenant_id=tenant_id,visualization_id=vid).delete(synchronize_session=False)
    VisualizationExecution.query.filter_by(tenant_id=tenant_id,visualization_id=vid).delete(synchronize_session=False)
    VisualizationShare.query.filter_by(tenant_id=tenant_id,visualization_id=vid).delete(synchronize_session=False)
    VisualizationDhis2Validation.query.filter_by(tenant_id=tenant_id,visualization_id=vid).delete(synchronize_session=False)
    VisualizationView.query.filter_by(tenant_id=tenant_id,visualization_id=vid).delete(synchronize_session=False)
    VisualizationChart.query.filter_by(tenant_id=tenant_id,visualization_id=vid).delete(synchronize_session=False)
    VisualizationDefinition.query.filter_by(tenant_id=tenant_id,visualization_id=vid).delete(synchronize_session=False)
    AIQueryLog.query.filter_by(tenant_id=viz.tenant_id,visualization_id=vid).delete(synchronize_session=False)

    db.session.delete(viz)

    commit_session()
    return jsonify({"message": "Deleted successfully"})

@bp.get("/latest-layout")
@require_auth
def get_most_lasted_layout():
    tenant_id = request.args.get("tenant_id", type=int)
    visualization_id = request.args.get("visualization_id", type=int)

    if not tenant_id or not visualization_id:
        raise BadRequest("Invalid params", 400)

    latest_layout:VisualizationLayout = (
        VisualizationLayout.query
        .filter_by(
            tenant_id=tenant_id,
            visualization_id=visualization_id
        )
        .order_by(VisualizationLayout.version.desc())
        .first()
    )
    
    if not latest_layout:
        raise NotFound("No layout found")
    
    return jsonify(latest_layout.to_dict()), 200


@bp.post("/<int:vid>/share")
@require_auth
def share_visualization(vid: int):
    payload = request.get_json() or {}
    tenant_id = payload.get("tenant_id")

    if not tenant_id:
        raise BadRequest("tenant_id is required", 400)
    
    viz = Visualization.query.filter_by(id=vid, tenant_id=tenant_id).first()
    if not viz:
        raise BadRequest("Visualization not found", 404)

    permission_id = payload.get("permission_id")
    if not permission_id:
        raise BadRequest("permission_id is required")
    
    share = VisualizationShare.query.filter_by(
        visualization_id=vid,
        tenant_id=tenant_id,
        permission_id=permission_id
    ).first()
    
    user_id = currentUserId()

    if not share:
        share:VisualizationShare = VisualizationShare(
            visualization_id=vid,
            tenant_id=tenant_id,
            user_id=payload.get("user_id"),
            permission_id=permission_id,
            public_token=payload.get("public_token", str(uuid.uuid4())),
            can_view=payload.get("can_view", True),
            can_edit=payload.get("can_edit", False),
            can_execute=payload.get("can_execute", False),
            created_by_id=user_id
        )
        db.session.add(share)

    else:
        # update permissions
        for k in ["can_view","can_edit","can_execute"]:
            if k in payload:
                setattr(share, k, payload[k])
        share.updated_by_id = user_id

    commit_session()
    return jsonify(share.to_dict()), 201


@bp.post("/<int:vid>/execute")
@require_auth
def execute_visualization(vid: int):
    payload = request.get_json() or {}

    tenant_id = payload.get("tenant_id")
    if not tenant_id:
        raise BadRequest("tenant_id required")

    viz:Visualization = Visualization.query.options(
        selectinload(Visualization.layouts),
        selectinload(Visualization.definitions),
    ).filter(
        Visualization.id == vid,
        Visualization.tenant_id == tenant_id,
        Visualization.deleted==False,
    ).first()

    if not viz:
        raise NotFound("Visualization not found")
    
    user_id = currentUserId()

    exec = VisualizationExecution(
        tenant_id=tenant_id,
        visualization_id=vid,
        executed_by_id=user_id,
        started_at=datetime.now(timezone.utc),
        state=VisualizationState.RUNNING,
    )
    db.session.add(exec)
    db.session.flush()

    log = VisualizationExecutionLog(
        execution_id=exec.id,
        message=payload.get("message") or "started",
        details=payload.get("details") or {},
        level="info"
    )
    db.session.add(log)

    commit_session()
    return jsonify(log.to_dict()), 201



@bp.post("/executions/<int:eid>/finish")
@require_auth
def finish_execution(eid):
    payload = request.get_json() or {}

    exec:VisualizationExecution = VisualizationExecution.query.get(eid)
    if not exec:
        raise BadRequest("execution not found")

    exec.state = VisualizationState(payload.get("state", VisualizationState.SUCCESS))
    exec.finished_at = datetime.now(timezone.utc)
    exec.result = payload.get("result", {})
    exec.error = payload.get("error")

    log = VisualizationExecutionLog(
        execution_id=eid,
        message="finished",
        level="info",
        details=exec.result
    )
    db.session.add(log)

    commit_session()
    return jsonify(exec.to_dict())

@bp.get("/<int:vid>/execution-logs")
@require_auth
def list_executions(vid:int):
    tenant_id = request.args.get("tenant_id", type=int)
    if not tenant_id:
        raise BadRequest("tenant_id is required", 400)

    logs:List[VisualizationExecution] = (
        VisualizationExecution.query
        .filter(
            VisualizationExecution.tenant_id==tenant_id,
            VisualizationExecution.visualization_id==vid,
        )
        .order_by(VisualizationExecution.started_at.desc())
        .all()
    )

    return jsonify([l.to_dict() for l in logs]), 200


@bp.post("/<int:vid>/dhis2-validate")
@require_auth
def dhis2_validate(vid:int):
    payload = request.get_json() or {}

    tenant_id = payload.get("tenant_id")
    if not tenant_id:
        raise BadRequest("tenant_id is required", 400)
    
    viz:Visualization = (
        Visualization.query.filter(
            Visualization.id==vid, 
            Visualization.tenant_id==tenant_id,
            Visualization.deleted==False, 
        ).first()
    )
    if not viz:
        raise BadRequest("Visualization not found", 404)
    
    user_id = currentUserId()

    validation = VisualizationDhis2Validation(
        tenant_id=tenant_id,
        visualization_id=vid,
        uid=payload.get("uid"),
        on_dhis2=payload.get("on_dhis2", False),
        on_dhis2_at=datetime.now(timezone.utc) if payload.get("on_dhis2") else None,
        on_dhis2_by_id=user_id,
        is_validate=payload.get("is_validate", False),
        validated_at=datetime.now(timezone.utc) if payload.get("is_validate") else None,
        validated_by_id=user_id if payload.get("is_validate") else None
    )
    validation.created_by_id = user_id

    db.session.add(validation)
    commit_session()

    return jsonify(validation.to_dict()), 201


@bp.post("/<int:vid>/views")
@require_auth
def create_visualization_view(vid:int):
    payload = request.get_json() or {}

    tenant_id = payload.get("tenant_id")
    if not tenant_id:
        raise BadRequest("tenant_id is required", 400)
    
    user_id = currentUserId()

    layout = payload.get("layout")
    layoutItems = layout.get("items") if layout else None

    if layout and layoutItems:
        version = db.session.query(
            func.coalesce(func.max(VisualizationLayout.version), 0)
        ).filter_by(
            tenant_id=tenant_id,
            visualization_id=vid,
        ).scalar() + 1

        new_layout = VisualizationLayout(
            tenant_id=tenant_id,
            visualization_id=vid,
            version=version,
            options=layout.get("options", {}),
            layout=layoutItems,
            created_by_id=user_id,
        )

        db.session.add(new_layout)
        db.session.flush()

    is_default = bool(payload.get("is_default", False))

    if is_default:
        VisualizationView.query.filter_by(
            visualization_id=vid,
            tenant_id=tenant_id
        ).update({"is_default": False})

    new_view = VisualizationView(
        tenant_id=tenant_id,
        visualization_id=vid,
        layout_id=new_layout.id,
        name=payload.get("name"),
        is_default=is_default,
        created_by_id=user_id,
    )
    db.session.add(new_view)

    commit_session()

    return jsonify(new_view.to_dict()), 201

