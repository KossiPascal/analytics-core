"""
Synchronisation DHIS2 → tables identités (OrgUnitLevel, UserOrgunit).
Utilise la session et la configuration du module dhis2_service.
"""
from flask import Blueprint, request, jsonify

from backend.src.databases.extensions import db, error_response
from backend.src.models.auth import OrgUnitLevel, UserOrgunit, Tenant
from backend.src.security.access_security import require_auth
from backend.src.logger import get_backend_logger
from backend.src.equipment_manager.services.dhis2_service import (
    DHIS2_URL,
    DHIS2_USERNAME,
    _get_dhis2_session,
)

logger = get_backend_logger(__name__)

bp = Blueprint("identities_dhis2_sync", __name__, url_prefix="/api/identities/sync")


def _resolve_tenant(tenant_id):
    """Retourne le tenant_id résolu (premier tenant actif si non précisé)."""
    if tenant_id:
        return tenant_id
    tenant = Tenant.query.filter_by(deleted=False, is_active=True).first()
    return tenant.id if tenant else None


# ─────────────────────────────────────────────────────────────────────────────
# SYNC LEVELS
# ─────────────────────────────────────────────────────────────────────────────
@bp.post("/levels")
@require_auth
def sync_levels():
    """Synchronise les niveaux hiérarchiques DHIS2 → user_orgunit_levels."""
    data      = request.get_json(silent=True) or {}
    tenant_id = _resolve_tenant(data.get("tenant_id"))

    if not tenant_id:
        return error_response("Aucun tenant disponible", 400)
    if not DHIS2_USERNAME:
        return error_response("Identifiants DHIS2 non configurés (DHIS2_USERNAME)", 400)

    try:
        session = _get_dhis2_session()
        base    = DHIS2_URL.rstrip("/")

        resp = session.get(
            f"{base}/api/organisationUnitLevels",
            params={"fields": "id,name,level,displayName", "paging": "false"},
        )
        resp.raise_for_status()
        levels_data = resp.json().get("organisationUnitLevels", [])

        created = updated = 0

        for lv_data in levels_data:
            level_num    = lv_data.get("level")
            name         = lv_data.get("name", "")
            display_name = lv_data.get("displayName") or name
            dhis2_code   = lv_data.get("id", "")   # uid DHIS2 comme code

            existing = OrgUnitLevel.query.filter_by(
                tenant_id=tenant_id, level=level_num, deleted=False
            ).first()

            if existing:
                existing.name         = name
                existing.display_name = display_name
                existing.code         = dhis2_code
                updated += 1
            else:
                db.session.add(OrgUnitLevel(
                    tenant_id=tenant_id,
                    level=level_num,
                    name=name,
                    display_name=display_name,
                    code=dhis2_code,
                    is_active=True,
                ))
                created += 1

        db.session.commit()
        logger.info(f"DHIS2 levels sync: {created} créés, {updated} mis à jour")
        return jsonify({"created": created, "updated": updated, "total": len(levels_data)}), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"DHIS2 levels sync error: {e}")
        return error_response(f"Échec de la synchronisation des niveaux : {str(e)}", 500)


# ─────────────────────────────────────────────────────────────────────────────
# SYNC ORGUNITS
# ─────────────────────────────────────────────────────────────────────────────
@bp.post("/orgunits")
@require_auth
def sync_orgunits():
    """Synchronise les unités d'organisation DHIS2 → user_orgunits."""
    data        = request.get_json(silent=True) or {}
    tenant_id   = _resolve_tenant(data.get("tenant_id"))
    org_unit_id = data.get("org_unit_id")   # uid DHIS2 racine (optionnel)

    if not tenant_id:
        return error_response("Aucun tenant disponible", 400)
    if not DHIS2_USERNAME:
        return error_response("Identifiants DHIS2 non configurés (DHIS2_USERNAME)", 400)

    try:
        session = _get_dhis2_session()
        base    = DHIS2_URL.rstrip("/")

        params = {
            "fields": "id,name,code,level,parent[id],path",
            "paging": "false",
        }
        if org_unit_id:
            params["filter"] = f"path:like:{org_unit_id}"

        resp = session.get(f"{base}/api/organisationUnits", params=params)
        resp.raise_for_status()
        orgunits_data = resp.json().get("organisationUnits", [])

        # Trier par profondeur (racines d'abord) pour résoudre les parents dans l'ordre
        orgunits_data.sort(key=lambda o: len(o.get("path", "").split("/")))

        # Mapping : uid DHIS2 → id DB (pour résoudre les parents)
        dhis2_id_to_db_id: dict[str, int] = {}

        # Chargement des orgunits existantes indexées par code
        existing_by_code: dict[str, UserOrgunit] = {
            ou.code: ou
            for ou in UserOrgunit.query.filter_by(tenant_id=tenant_id, deleted=False).all()
        }

        # Mapping niveau DHIS2 (int) → level_id DB
        level_map: dict[int, int] = {
            lv.level: lv.id
            for lv in OrgUnitLevel.query.filter_by(tenant_id=tenant_id, deleted=False).all()
        }

        created = updated = 0

        for ou_data in orgunits_data:
            dhis2_id     = ou_data.get("id", "")
            name         = ou_data.get("name", "")
            code         = ou_data.get("code") or dhis2_id   # fallback sur uid DHIS2
            level_num    = ou_data.get("level")
            parent_dhis2 = (ou_data.get("parent") or {}).get("id")

            level_id  = level_map.get(level_num)
            parent_id = dhis2_id_to_db_id.get(parent_dhis2) if parent_dhis2 else None

            existing = existing_by_code.get(code)

            if existing:
                existing.name      = name
                existing.level_id  = level_id
                existing.parent_id = parent_id
                dhis2_id_to_db_id[dhis2_id] = existing.id
                updated += 1
            else:
                ou = UserOrgunit(
                    tenant_id=tenant_id,
                    name=name,
                    code=code,
                    level_id=level_id,
                    parent_id=parent_id,
                    is_active=True,
                )
                db.session.add(ou)
                db.session.flush()   # obtenir l'id avant la prochaine itération
                dhis2_id_to_db_id[dhis2_id] = ou.id
                existing_by_code[code] = ou
                created += 1

        db.session.commit()
        logger.info(f"DHIS2 orgunits sync: {created} créés, {updated} mis à jour")
        return jsonify({"created": created, "updated": updated, "total": len(orgunits_data)}), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"DHIS2 orgunits sync error: {e}")
        return error_response(f"Échec de la synchronisation des orgunits : {str(e)}", 500)
