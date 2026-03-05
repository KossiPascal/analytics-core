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
    DHIS2_PROGRAM_ID,
    _get_dhis2_session,
)
from backend.src.services.getdata import export_program_events_reusable

logger = get_backend_logger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# Adaptateur : bridge requests.Session → interface dhis2.Api
# ─────────────────────────────────────────────────────────────────────────────
class _Dhis2ApiAdapter:
    """
    Adapte un requests.Session pour être utilisé comme un dhis2.Api.
    Préfixe les chemins relatifs avec <base_url>/api/.
    """

    def __init__(self, session, base_url: str):
        self._session  = session
        self._base_api = f"{base_url.rstrip('/')}/api"

    def get(self, endpoint: str, params=None):
        return self._session.get(f"{self._base_api}/{endpoint}", params=params)


# ─────────────────────────────────────────────────────────────────────────────
# Helpers ASC — parsing des champs programme
# ─────────────────────────────────────────────────────────────────────────────
def _parse_asc_field(value: str) -> dict | None:
    """
    Parse un champ ASC au format 'dhis2_uid<==>CODE NOM PRENOM[<==>employee_code]'.
    Retourne {dhis2_uid, name, employee_code} ou None.
    """
    if not value or "<==>" not in value:
        return None
    parts = [p.strip() for p in value.split("<==>")]
    return {
        "dhis2_uid":     parts[0],
        "name":          parts[1] if len(parts) > 1 else "",
        "employee_code": parts[2] if len(parts) > 2 else None,
    }


def _extract_asc_event_map(
    events: list,
    asc_field: str = "admin_org_unit_asc",
    zone_fields: tuple = ("admin_org_unit_site", "admin_org_unit_district"),
) -> dict:
    """
    Construit un index {dhis2_uid: {employee_code, name, orgunit_codes}} à partir
    des événements programme. Agrège TOUS les événements d'un même ASC pour
    collecter l'ensemble de ses zones d'intervention (codes des sites/districts).
    """
    result: dict[str, dict] = {}
    for event in events:
        raw = event.get(asc_field)
        if not raw:
            continue
        parsed = _parse_asc_field(raw)
        if not parsed or not parsed["dhis2_uid"]:
            continue

        dhis2_uid = parsed["dhis2_uid"]
        if dhis2_uid not in result:
            result[dhis2_uid] = {
                "employee_code": parsed["employee_code"],
                "name":          parsed["name"],
                "orgunit_codes": set(),
            }

        # Collecter les codes de zones depuis cet événement (site en priorité, puis district)
        for field in zone_fields:
            val = event.get(field)
            if val and "<==>" in val:
                code = val.split("<==>")[0].strip()
                if code:
                    result[dhis2_uid]["orgunit_codes"].add(code)

    return result

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

        # ── 1. Utilisateurs DHIS2 (/api/users) indexés par id DHIS2 ────────────
        resp = session.get(
            f"{base}/api/users",
            params={
                "fields": "id,username,firstName,lastName,email,phoneNumber",
                "paging": "false",
            },
        )
        resp.raise_for_status()
        users_by_dhis2_id: dict[str, dict] = {
            u["id"]: u for u in resp.json().get("users", []) if u.get("id")
        }

        # ── 2. Événements programme → index {dhis2_uid: {employee_code, name}} ──
        adapter       = _Dhis2ApiAdapter(session, base)
        events_data   = export_program_events_reusable(adapter, DHIS2_PROGRAM_ID)
        asc_event_map = _extract_asc_event_map(events_data["events"])

        # ── Diagnostic : vérifier les champs org_unit dans les events ────────
        raw_events = events_data.get("events", [])
        if raw_events:
            sample = raw_events[0]
            ou_fields = sorted(k for k in sample.keys() if "org_unit" in k.lower() or "orgunit" in k.lower())
            logger.info(f"DHIS2 champs org_unit disponibles dans les events: {ou_fields}")
            logger.info(f"DHIS2 exemple event[0] keys: {sorted(sample.keys())}")
        asc_with_zones = sum(1 for v in asc_event_map.values() if v.get("orgunit_codes"))
        logger.info(
            f"DHIS2 sources: {len(users_by_dhis2_id)} users API, "
            f"{len(asc_event_map)} ASC dans les événements programme, "
            f"{asc_with_zones} avec zones d'intervention"
        )

        # ── 3. Union des deux sources — les events sont la référence principale ──
        all_dhis2_ids = set(asc_event_map.keys()) | set(users_by_dhis2_id.keys())

        # ── 4. Résoudre le poste ASC dans la DB ─────────────────────────────
        asc_position = Position.query.filter_by(code=position_code).first()
        asc_position_id = asc_position.id if asc_position else None

        # ── 4b. Index des orgunits du tenant (code → objet) ──────────────────
        orgunits_by_code: dict[str, UserOrgunit] = {
            ou.code: ou
            for ou in UserOrgunit.query.filter_by(tenant_id=tenant_id, deleted=False).all()
            if ou.code
        }

        # ── 5. Index des entités existantes ──────────────────────────────────
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

        for dhis2_id in all_dhis2_ids:
            event_info = asc_event_map.get(dhis2_id, {})
            api_user   = users_by_dhis2_id.get(dhis2_id, {})

            employee_code = event_info.get("employee_code")

            # Prénom / nom : API en priorité, sinon parsing du champ événement
            firstname = (api_user.get("firstName") or "").strip()
            lastname  = (api_user.get("lastName")  or "").strip()
            if not firstname and not lastname:
                name_parts = (event_info.get("name") or "").split()
                if len(name_parts) >= 3:
                    # Format "CODE NOM PRENOM" → on ignore le code
                    lastname  = name_parts[1]
                    firstname = " ".join(name_parts[2:])
                elif len(name_parts) == 2:
                    lastname  = name_parts[0]
                    firstname = name_parts[1]
                elif len(name_parts) == 1:
                    lastname  = name_parts[0]

            # Username : API > employee_code > dhis2_id (toujours unique)
            username  = (api_user.get("username") or employee_code or dhis2_id).strip()
            email_raw = (api_user.get("email") or "").strip()
            phone_val = (api_user.get("phoneNumber") or "").strip() or None

            if not username:
                continue

            # Éviter les doublons d'email
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

            # ── Assigner les orgunits au user ────────────────────────────────
            orgunit_codes = event_info.get("orgunit_codes") or set()
            if orgunit_codes:
                matched = [orgunits_by_code[c] for c in orgunit_codes if c in orgunits_by_code]
                if matched:
                    # Remplace (sync complet) : supprime les anciennes assignations puis réassigne
                    user.orgunits = matched

            # ── Upsert Employee ──────────────────────────────────────────────
            emp = existing_employees_by_user_id.get(user.id)
            if emp:
                emp.first_name = firstname or emp.first_name
                emp.last_name  = lastname  or emp.last_name
                if email_val:
                    emp.email = email_val
                if phone_val:
                    emp.phone = phone_val
                if employee_code and not emp.employee_id_code:
                    emp.employee_id_code = employee_code
                updated_employees += 1
            else:
                emp = Employee(
                    tenant_id=tenant_id,
                    first_name=firstname or username,
                    last_name=lastname or "",
                    email=email_val or "",
                    phone=phone_val or "",
                    employee_id_code=employee_code or "",
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
            "total":             len(all_dhis2_ids),
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"DHIS2 ASC sync error: {e}")
        return error_response(f"Échec de la synchronisation des ASC : {str(e)}", 500)
