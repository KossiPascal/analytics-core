"""
DHIS2 sync service - syncs organizational units and ASCs from DHIS2.
"""
import os
import requests
import warnings

from backend.src.app.configs.extensions import db
from backend.src.projects.analytics_manager.logger import get_backend_logger
from backend.src.projects.equipment_manager.models.locations import District, Region, Site

logger = get_backend_logger(__name__)

warnings.filterwarnings("ignore", message="Unverified HTTPS request")

# DHIS2 config from env
DHIS2_URL = os.environ.get("DHIS2_URL", "https://dhis2.integratehealth.org/dhis")
DHIS2_USERNAME = os.environ.get("DHIS2_USERNAME", "")
DHIS2_PASSWORD = os.environ.get("DHIS2_PASSWORD", "")
DHIS2_PROGRAM_ID = os.environ.get("DHIS2_PROGRAM_ID", "LOHCXZMzADu")


def _get_dhis2_session():
    """Create an authenticated requests session for DHIS2."""
    session = requests.Session()
    session.auth = (DHIS2_USERNAME, DHIS2_PASSWORD)
    session.verify = False
    session.headers.update({"Content-Type": "application/json"})
    return session


def parse_dhis2_value(value):
    """Parse 'CODE<==>NAME' format into dict."""
    if not value or "<==>" not in value:
        return None
    code, name = value.split("<==>", 1)
    return {"code": code.strip(), "name": name.strip()}



def _export_program_events(session, program_id, org_unit_id=None):
    """Export program events from DHIS2 and flatten them."""
    base_url = DHIS2_URL.rstrip("/")

    # Get program metadata for data element mapping
    resp = session.get(
        f"{base_url}/api/programs/{program_id}",
        params={"fields": "id,name,programStages[id,name,programStageDataElements[dataElement[id,code,name,valueType]]]"},
    )
    resp.raise_for_status()
    program_data = resp.json()

    data_elements = {}
    for stage in program_data.get("programStages", []):
        for psde in stage.get("programStageDataElements", []):
            de = psde.get("dataElement", {})
            de_id = de.get("id")
            if de_id:
                data_elements[de_id] = {"code": de.get("code"), "name": de.get("name")}

    # Get events
    params = {"program": program_id, "skipPaging": "true", "fields": "*"}
    if org_unit_id:
        params["orgUnit"] = org_unit_id
        params["ouMode"] = "DESCENDANTS"

    resp = session.get(f"{base_url}/api/events", params=params)
    resp.raise_for_status()
    events_raw = resp.json().get("events", [])

    # Flatten events
    events = []
    for event in events_raw:
        row = {
            "event_id": event.get("event"),
            "org_unit": event.get("orgUnit"),
            "org_unit_name": event.get("orgUnitName", ""),
        }
        for dv in event.get("dataValues", []):
            de_id = dv.get("dataElement")
            meta = data_elements.get(de_id)
            if meta and meta.get("code"):
                row[meta["code"]] = dv.get("value")
        events.append(row)

    return {"events": events}


def _extract_unique_admin_units(data, field_name):
    """Extract unique admin units from events data."""
    results = {}
    for event in data.get("events", []):
        raw = event.get(field_name)
        parsed = parse_dhis2_value(raw)
        if parsed:
            results[parsed["code"]] = parsed
    return list(results.values())



def sync_organizational_units(program_id=None, org_unit_id=None):
    """
    Sync regions, districts, and sites from DHIS2.
    Returns dict with counts of created entities.
    """
    if not DHIS2_USERNAME:
        return {"error": "DHIS2 credentials not configured"}

    program_id = program_id or DHIS2_PROGRAM_ID
    session = _get_dhis2_session()

    try:
        data = _export_program_events(session, program_id, org_unit_id)
    except Exception as e:
        logger.error(f"DHIS2 export failed: {e}")
        return {"error": str(e)}

    regions_data = _extract_unique_admin_units(data, "admin_org_unit_region")
    districts_data = _extract_unique_admin_units(data, "admin_org_unit_district")
    sites_data = _extract_unique_admin_units(data, "admin_org_unit_site")

    created_regions = 0
    created_districts = 0
    created_sites = 0

    # Create regions
    for info in regions_data:
        existing = Region.query.filter_by(code=info["code"]).first()
        if not existing:
            db.session.add(Region(code=info["code"], name=info["name"]))
            created_regions += 1
    db.session.flush()

    # Create districts (need to find region for each)
    for info in districts_data:
        existing = District.query.filter_by(code=info["code"]).first()
        if existing:
            continue
        # Find region by scanning events
        region_code = None
        for event in data.get("events", []):
            d = parse_dhis2_value(event.get("admin_org_unit_district"))
            if d and d["code"] == info["code"]:
                r = parse_dhis2_value(event.get("admin_org_unit_region"))
                if r:
                    region_code = r["code"]
                    break
        if region_code:
            region = Region.query.filter_by(code=region_code).first()
            if region:
                db.session.add(District(code=info["code"], name=info["name"], region_id=region.id))
                created_districts += 1
    db.session.flush()

    # Create sites (need to find district for each)
    for info in sites_data:
        existing = Site.query.filter_by(code=info["code"]).first()
        if existing:
            continue
        district_code = None
        region_code = None
        for event in data.get("events", []):
            s = parse_dhis2_value(event.get("admin_org_unit_site"))
            if s and s["code"] == info["code"]:
                d = parse_dhis2_value(event.get("admin_org_unit_district"))
                r = parse_dhis2_value(event.get("admin_org_unit_region"))
                if d:
                    district_code = d["code"]
                if r:
                    region_code = r["code"]
                break
        if district_code and region_code:
            region = Region.query.filter_by(code=region_code).first()
            if region:
                district = District.query.filter_by(code=district_code, region_id=region.id).first()
                if district:
                    db.session.add(Site(code=info["code"], name=info["name"], district_id=district.id))
                    created_sites += 1

    db.session.commit()
    logger.info(f"DHIS2 sync: {created_regions} regions, {created_districts} districts, {created_sites} sites created")

    return {
        "created_regions": created_regions,
        "created_districts": created_districts,
        "created_sites": created_sites,
    }


