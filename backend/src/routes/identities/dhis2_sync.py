"""
Synchronisation DHIS2 → tables identités (OrgUnitLevel, UserOrgunit, User+Employee ASC).
Utilise la session et la configuration du module dhis2_service.
"""
import secrets
import string

from flask import Blueprint, request, jsonify

from backend.src.databases.extensions import db, error_response
from backend.src.models.auth import OrgUnitLevel, UserOrgunit, Tenant, User
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
# LOGIQUE PARTAGÉE — niveaux
# ─────────────────────────────────────────────────────────────────────────────
def _sync_levels_for_tenant(session, base: str, tenant_id: int) -> dict[int, int]:
    """
    Upsert les niveaux DHIS2 → user_orgunit_levels pour un tenant.
    Retourne le mapping {level_num: db_level_id} utilisable immédiatement.
    N'appelle PAS db.session.commit() — le commit est laissé à l'appelant.
    """
    resp = session.get(
        f"{base}/api/organisationUnitLevels",
        params={"fields": "id,name,level,displayName", "paging": "false"},
    )
    resp.raise_for_status()
    levels_data = resp.json().get("organisationUnitLevels", [])

    for lv_data in levels_data:
        level_num    = lv_data.get("level")
        name         = lv_data.get("name", "")
        display_name = lv_data.get("displayName") or name
        dhis2_code   = lv_data.get("id", "")

        existing = OrgUnitLevel.query.filter_by(
            tenant_id=tenant_id, level=level_num, deleted=False
        ).first()

        if existing:
            existing.name         = name
            existing.display_name = display_name
            existing.code         = dhis2_code
        else:
            db.session.add(OrgUnitLevel(
                tenant_id=tenant_id,
                level=level_num,
                name=name,
                display_name=display_name,
                code=dhis2_code,
                is_active=True,
            ))

    # flush pour obtenir les IDs des niveaux nouvellement insérés
    db.session.flush()

    level_map: dict[int, int] = {
        lv.level: lv.id
        for lv in OrgUnitLevel.query.filter_by(tenant_id=tenant_id, deleted=False).all()
    }
    return level_map, len(levels_data)


# ─────────────────────────────────────────────────────────────────────────────
# SYNC LEVELS  (endpoint autonome)
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

        level_map, total = _sync_levels_for_tenant(session, base, tenant_id)
        db.session.commit()

        created = sum(1 for lv in OrgUnitLevel.query.filter_by(tenant_id=tenant_id, deleted=False).all())
        logger.info(f"DHIS2 levels sync: {total} niveaux traités")
        return jsonify({"created": 0, "updated": 0, "total": total}), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"DHIS2 levels sync error: {e}")
        return error_response(f"Échec de la synchronisation des niveaux : {str(e)}", 500)


# ─────────────────────────────────────────────────────────────────────────────
# SYNC ORGUNITS  (pré-synchronise les niveaux en amont)
# ─────────────────────────────────────────────────────────────────────────────
@bp.post("/orgunits")
@require_auth
def sync_orgunits():
    """
    Synchronise les unités d'organisation DHIS2 → user_orgunits.
    Pré-synchronise les niveaux pour garantir que level_id soit toujours résolu.
    """
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

        # ── Étape 1 : pré-synchronisation des niveaux ───────────────────────
        level_map, levels_total = _sync_levels_for_tenant(session, base, tenant_id)
        logger.info(f"DHIS2 pre-sync levels: {levels_total} niveaux")

        # ── Étape 2 : récupérer les unités d'organisation ───────────────────
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

        # Mapping uid DHIS2 → id DB (résolution des parents)
        dhis2_id_to_db_id: dict[str, int] = {}

        # Orgunits existantes indexées par code
        existing_by_code: dict[str, UserOrgunit] = {
            ou.code: ou
            for ou in UserOrgunit.query.filter_by(tenant_id=tenant_id, deleted=False).all()
        }

        created = updated = 0

        for ou_data in orgunits_data:
            dhis2_id     = ou_data.get("id", "")
            name         = ou_data.get("name", "")
            code         = ou_data.get("code") or dhis2_id   # fallback sur uid DHIS2
            level_num    = ou_data.get("level")
            parent_dhis2 = (ou_data.get("parent") or {}).get("id")

            # Résolution FK niveau via le mapping pré-synchronisé
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
                db.session.flush()
                dhis2_id_to_db_id[dhis2_id] = ou.id
                existing_by_code[code] = ou
                created += 1

        db.session.commit()
        logger.info(f"DHIS2 orgunits sync: {created} créés, {updated} mis à jour ({levels_total} niveaux)")
        return jsonify({
            "created":       created,
            "updated":       updated,
            "total":         len(orgunits_data),
            "levels_synced": levels_total,
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"DHIS2 orgunits sync error: {e}")
        return error_response(f"Échec de la synchronisation des orgunits : {str(e)}", 500)


# ─────────────────────────────────────────────────────────────────────────────
# SYNC ASC  (users DHIS2 → User système + Employee)
# ─────────────────────────────────────────────────────────────────────────────
@bp.post("/ascs")
@require_auth
def sync_ascs():
    """
    Synchronise les utilisateurs DHIS2 → users système + employees (ASC).
    Pour chaque utilisateur DHIS2 : upsert User + upsert Employee liés.
    Le tenant_id est obligatoire (choisi dans le popup frontend).
    """
    from backend.src.equipment_manager.models.employees import Employee, Position

    data          = request.get_json(silent=True) or {}
    tenant_id     = data.get("tenant_id")
    position_code = (data.get("position_code") or "ASC").strip()

    if not tenant_id:
        return error_response("Le tenant_id est requis pour la synchronisation des ASC", 400)
    if not Tenant.query.filter_by(id=tenant_id, deleted=False).first():
        return error_response("Tenant introuvable", 404)
    if not DHIS2_USERNAME:
        return error_response("Identifiants DHIS2 non configurés (DHIS2_USERNAME)", 400)

    try:
        session = _get_dhis2_session()
        base    = DHIS2_URL.rstrip("/")

        # ── Récupérer les utilisateurs DHIS2 ────────────────────────────────
        resp = session.get(
            f"{base}/api/users",
            params={
                "fields": "id,username,firstName,lastName,email,phoneNumber,organisationUnits[id,name,code]",
                "paging": "false",
            },
        )
        resp.raise_for_status()
        users_data = resp.json().get("users", [])

        # ── Résoudre le poste ASC dans la DB ────────────────────────────────
        asc_position = Position.query.filter_by(code=position_code).first()
        asc_position_id = asc_position.id if asc_position else None

        # ── Index des entités existantes ────────────────────────────────────
        # username est globalement unique → on indexe tous les tenants pour éviter
        # les violations de contrainte sur les usernames déjà pris par d'autres tenants.
        existing_users_by_username: dict[str, User] = {
            u.username: u
            for u in User.query.filter(User.deleted == False).all()
        }
        existing_emails: set[str] = {
            u.email for u in User.query.filter(User.email.isnot(None)).all()
            if u.email
        }
        existing_employees_by_user_id: dict[int, Employee] = {
            e.user_id: e
            for e in Employee.query.filter(
                Employee.tenant_id == tenant_id,
                Employee.user_id.isnot(None),
            ).all()
        }

        created_users = created_employees = updated_users = updated_employees = 0
        skipped = 0

        for ud in users_data:
            dhis2_id  = ud.get("id", "")
            username  = (ud.get("username") or dhis2_id).strip()
            firstname = (ud.get("firstName") or "").strip()
            lastname  = (ud.get("lastName") or "").strip()
            email_raw = (ud.get("email") or "").strip()
            phone_val = (ud.get("phoneNumber") or "").strip() or None

            if not username:
                continue

            # Éviter les doublons d'email : ignorer si déjà pris par un autre user
            email_val = email_raw if email_raw and email_raw not in existing_emails else None

            # ── Upsert User ──────────────────────────────────────────────────
            user = existing_users_by_username.get(username)
            if user:
                # Username déjà pris par un autre tenant → on ne touche pas à ce compte
                if user.tenant_id != tenant_id:
                    skipped += 1
                    continue
                user.firstname = firstname or user.firstname
                user.lastname  = lastname  or user.lastname
                if email_val:
                    user.email = email_val
                    existing_emails.add(email_val)
                if phone_val:
                    user.phone = phone_val
                updated_users += 1
            else:
                tmp_pwd = "".join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))
                user = User(
                    username=username,
                    tenant_id=tenant_id,
                    firstname=firstname,
                    lastname=lastname,
                    email=email_val,
                    phone=phone_val,
                    is_active=True,
                    has_changed_default_password=False,
                )
                user.set_password(tmp_pwd)
                db.session.add(user)
                db.session.flush()
                existing_users_by_username[username] = user
                if email_val:
                    existing_emails.add(email_val)
                created_users += 1

            # ── Upsert Employee ──────────────────────────────────────────────
            emp = existing_employees_by_user_id.get(user.id)
            if emp:
                emp.first_name = firstname or emp.first_name
                emp.last_name  = lastname  or emp.last_name
                if email_val:
                    emp.email = email_val
                if phone_val:
                    emp.phone = phone_val
                updated_employees += 1
            else:
                emp = Employee(
                    tenant_id=tenant_id,
                    first_name=firstname or username,
                    last_name=lastname or "",
                    email=email_val or "",
                    phone=phone_val or "",
                    user_id=user.id,
                    position_id=asc_position_id,
                    is_active=True,
                )
                db.session.add(emp)
                db.session.flush()
                existing_employees_by_user_id[user.id] = emp
                created_employees += 1

        db.session.commit()
        logger.info(
            f"DHIS2 ASC sync: {created_users} users créés, {updated_users} mis à jour | "
            f"{created_employees} employees créés, {updated_employees} mis à jour"
        )
        return jsonify({
            "created_users":     created_users,
            "updated_users":     updated_users,
            "created_employees": created_employees,
            "updated_employees": updated_employees,
            "skipped":           skipped,
            "total":             len(users_data),
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"DHIS2 ASC sync error: {e}")
        return error_response(f"Échec de la synchronisation des ASC : {str(e)}", 500)
