import warnings
warnings.filterwarnings('ignore', message='Unverified HTTPS request')
import json
from datetime import datetime

from dhis2 import Api

# ─── Constante programme DHIS2 ───────────────────────────────────────────────
PROGRAM_ID = "LOHCXZMzADu"


# ─────────────────────────────────────────────────────────────────────────────
# Fonctions réutilisables
# ─────────────────────────────────────────────────────────────────────────────

def export_program_events_reusable(api, program_id, org_unit_id=None, ou_mode="DESCENDANTS"):
    """
    Exporte les événements d'un programme DHIS2 sous une forme réutilisable.

    Retour:
    {
      "export_date": "...",
      "program_id": "...",
      "program_name": "...",
      "total_events": int,
      "data_elements": {de_id: {"code":..., "name":..., "valueType":...}},
      "events_raw": [...],         # événements DHIS2 bruts (optionnel mais utile)
      "events": [...],             # événements plats (row) avec keys = dataElement.code
    }
    """

    # 1) Récupération des métadonnées du programme
    program_response = api.get(
        f"programs/{program_id}",
        params={
            "fields": "id,name,programStages[id,name,programStageDataElements[dataElement[id,code,name,valueType]]]"
        }
    )

    if program_response.status_code != 200:
        raise RuntimeError(
            f"Erreur récupération programme {program_id}: "
            f"{program_response.status_code} - {program_response.text[:500]}"
        )

    program_data = program_response.json()
    program_name = program_data.get("name", "")

    # Mapping data elements: de_id -> {code,name,valueType}
    #der
    data_elements = {}
    for stage in program_data.get("programStages", []):
        for psde in stage.get("programStageDataElements", []):
            de = psde.get("dataElement", {})
            de_id = de.get("id")
            if de_id:
                data_elements[de_id] = {
                    "code": de.get("code"),
                    "name": de.get("name"),
                    "valueType": de.get("valueType")
                }

    # 2) Récupération des événements
    params = {
        "program": program_id,
        "skipPaging": "true",
        "fields": "*"
    }

    if org_unit_id:
        params["orgUnit"] = org_unit_id
        params["ouMode"] = ou_mode

    events_response = api.get("events", params=params)

    if events_response.status_code != 200:
        raise RuntimeError(
            f"Erreur récupération events du programme {program_id}: "
            f"{events_response.status_code} - {events_response.text[:500]}"
        )

    events_data = events_response.json()
    events_raw = events_data.get("events", [])

    # 3) Mise à plat des événements (row) avec les codes des dataElements
    export_rows = []

    for event in events_raw:
        row = {
            "event_id": event.get("event"),
            "event_date": event.get("eventDate"),
            "status": event.get("status"),
            "org_unit": event.get("orgUnit"),
            "org_unit_name": event.get("orgUnitName", "")
        }

        for dv in event.get("dataValues", []):
            de_id = dv.get("dataElement")
            value = dv.get("value")

            meta = data_elements.get(de_id)
            if meta and meta.get("code"):
                row[meta["code"]] = value

        # Exclure les événements sans ASC identifié
        if not row.get("admin_org_unit_asc"):
            continue

        export_rows.append(row)

    # 4) Structure de retour
    return {
        "export_date": datetime.now().isoformat(),
        "program_id": program_id,
        "program_name": program_name,
        "total_events": len(export_rows),
        "data_elements": data_elements,
        "events_raw": events_raw,
        "events": export_rows
    }


def extract_code_name(value):
    """
    Transforme 'CODE<==>NAME' en dict {'code': CODE, 'name': NAME}
    """
    if not value or "<==>" not in value:
        return None

    code, name = value.split("<==>" , 1)
    return {
        "code": code.strip(),
        "name": name.strip()
    }


def extract_unique_admin_units(data, field_name):
    """
    Extrait les valeurs uniques d'un champ admin_org_unit_*
    Retourne: [{"code": "", "name": ""}]
    """
    results = {}

    for event in data.get("events", []):
        raw_value = event.get(field_name)
        parsed = extract_code_name(raw_value)

        if parsed:
            results[parsed["code"]] = parsed  # évite les doublons par code

    return list(results.values())


def get_admin_org_unit_regions(data):
    return extract_unique_admin_units(data, "admin_org_unit_region")


def get_admin_org_unit_sites(data):
    return extract_unique_admin_units(data, "admin_org_unit_site")


def get_admin_org_unit_districts(data):
    return extract_unique_admin_units(data, "admin_org_unit_district")


