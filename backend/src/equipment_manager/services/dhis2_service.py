"""
DHIS2 sync service - syncs organizational units and ASCs from DHIS2.
"""
import os
import requests
import warnings

from backend.src.databases.extensions import db
from backend.src.equipment_manager.models.locations import Region, District, Site, ZoneASC
from backend.src.equipment_manager.models.asc import ASC
from backend.src.logger import get_backend_logger

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


def parse_asc_data(asc_string):
    """
    Parse ASC data from DHIS2 format.
    Format: "ID_DHIS2<==>CODE NOM Prenom<==>CODE"
    """
    if not asc_string or "<==>" not in asc_string:
        return None
    parts = asc_string.split("<==>")
    if len(parts) < 3:
        return None
    full_info = parts[1].strip()
    code = parts[2].strip()
    info_parts = full_info.split(" ", 2)
    if len(info_parts) < 3:
        return None
    _, last_name, first_name = info_parts
    return {"code": code, "last_name": last_name, "first_name": first_name}


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


def _get_ascs_from_events(data):
    """Extract unique ASCs from events data."""
    ascs = {}
    for event in data.get("events", []):
        asc_string = event.get("admin_org_unit_asc")
        if not asc_string:
            continue
        asc_data = parse_asc_data(asc_string)
        if not asc_data:
            continue
        code = asc_data["code"]
        site_data = parse_dhis2_value(event.get("admin_org_unit_site"))
        if code not in ascs:
            ascs[code] = {**asc_data, "site_code": site_data["code"] if site_data else None}
    return list(ascs.values())


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


def sync_ascs(program_id=None, org_unit_id=None):
    """
    Sync ASCs from DHIS2.
    Returns dict with counts of created/updated ASCs.
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

    ascs_data = _get_ascs_from_events(data)

    created_ascs = 0
    updated_ascs = 0

    for asc_info in ascs_data:
        code = asc_info["code"]
        site_code = asc_info.get("site_code")

        site = Site.query.filter_by(code=site_code).first() if site_code else None

        existing = ASC.query.filter_by(code=code).first()
        if existing:
            existing.first_name = asc_info["first_name"]
            existing.last_name = asc_info["last_name"]
            existing.site_id = site.id if site else existing.site_id
            existing.is_active = True
            updated_ascs += 1
        else:
            asc = ASC(
                code=code,
                first_name=asc_info["first_name"],
                last_name=asc_info["last_name"],
                site_id=site.id if site else None,
                is_active=True,
            )
            db.session.add(asc)
            db.session.flush()
            created_ascs += 1
            existing = asc

        # Auto-create ZoneASC
        if site:
            zone = ZoneASC.query.filter_by(site_id=site.id, code=code).first()
            if not zone:
                zone = ZoneASC(
                    site_id=site.id,
                    code=code,
                    name=f"Zone {asc_info['first_name']} {asc_info['last_name']}",
                )
                db.session.add(zone)
                db.session.flush()
            existing.zone_asc_id = zone.id

    db.session.commit()
    logger.info(f"DHIS2 ASC sync: {created_ascs} created, {updated_ascs} updated")

    return {"created_ascs": created_ascs, "updated_ascs": updated_ascs}
