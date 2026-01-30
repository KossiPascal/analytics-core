from typing import List, Dict, Optional, Any
from copy import deepcopy

# Define Python equivalents of your TS interfaces (simplified)
class Reco:
    id: str
    name: str
    phone: str
    code: str
    external_id: str

class RecoVaccinationDashboardUtils:
    # placeholder for your utils data
    pass

class RecoVaccinationDashboard:
    child: Any
    data: List[Any]
    family: Any

class RecoPerformanceDashboard:
    performances: List[Any]
    yearDatas: Dict[str, Any]
    total: Dict[str, Any]

class ActiveRecoDashboard:
    record: List[Any]
    total: Dict[str, Any]

class RecoTasksStateDashboard:
    id: str
    name: str
    phone: str
    code: str
    external_id: str
    chw: Any
    village_secteur: Any
    families: List[Any]

class IndicatorsDataOutput:
    country: Optional[str]
    region: Optional[str]
    prefecture: Optional[str]
    commune: Optional[str]
    hospital: Optional[str]
    district_quartier: Optional[str]
    village_secteur: Optional[str]
    reco: Optional[Reco]
    reco_asc_type: str
    data: Any


# ---------- Transform Functions ----------

def transform_reco_vaccination_dashboard(reports: List[Dict]) -> Optional[IndicatorsDataOutput]:
    if not reports:
        return None

    # Extract unique reco
    reco_names = []
    for r in reports:
        reco = r.get('reco')
        if reco and all(reco['id'] != u['id'] for u in reco_names):
            reco_names.append(reco)

    # Transform data
    output_map = {}
    results = []

    for r in reports:
        children_vaccines = r.get('children_vaccines', [])
        children_vaccines.sort(key=lambda x: x['family']['name'])

        for family in children_vaccines:
            if family['family']['id'] not in output_map:
                output_map[family['family']['id']] = {}

            children_data = family.get('data', [])
            children_data.sort(key=lambda x: x['child']['name'])

            for c in children_data:
                child_id = c['child']['id']
                if child_id not in output_map[family['family']['id']]:
                    output_map[family['family']['id']][child_id] = c
                else:
                    existing_count = sum(1 for v in output_map[family['family']['id']][child_id].values() if v is True)
                    new_count = sum(1 for v in c.values() if v is True)
                    if new_count > existing_count:
                        output_map[family['family']['id']][child_id] = c

    for family in output_map.values():
        results.append(list(family.values()))

    first_report = reports[0]

    output_report = IndicatorsDataOutput()
    output_report.country = first_report.get('country')
    output_report.region = first_report.get('region')
    output_report.prefecture = first_report.get('prefecture')
    output_report.commune = first_report.get('commune')
    output_report.hospital = first_report.get('hospital')
    output_report.district_quartier = first_report.get('district_quartier')
    output_report.village_secteur = first_report.get('village_secteur')
    output_report.reco = reco_names[0] if len(reco_names) == 1 else None
    output_report.reco_asc_type = 'RECO' if len(reco_names) == 1 else 'ASC'
    output_report.data = results

    return output_report


def transform_active_reco_dashboard(reports: List[Dict]) -> Optional[IndicatorsDataOutput]:
    if not reports:
        return None

    reco_names = []
    for r in reports:
        reco = r.get('reco')
        if reco and all(reco['id'] != u['id'] for u in reco_names):
            reco_names.append(reco)

    months = ['jan', 'fev', 'mar', 'avr', 'mai', 'jui', 'jul', 'aou', 'sep', 'oct', 'nov', 'dec']

    chws_map = {}
    total = {m: {'cover': 0, 'supervised': 0, 'fonctionnal': 0} for m in months}

    for d in reports:
        chw_id = d['chw']['id']
        if chw_id not in chws_map:
            chws_map[chw_id] = deepcopy(d['chw'])
            chws_map[chw_id]['recos'] = []

        full_data = {}
        for m in months:
            total[m]['cover'] += d.get(m, {}).get('cover', 0)
            total[m]['supervised'] += d.get(m, {}).get('supervised', 0)
            total[m]['fonctionnal'] += d.get(m, {}).get('fonctionnal', 0)
            full_data[m] = d.get(m, {})

        reco_entry = deepcopy(d['reco'])
        reco_entry.update(full_data)
        reco_entry['village_secteur'] = d.get('village_secteur')
        chws_map[chw_id]['recos'].append(reco_entry)

    output_data = {'record': list(chws_map.values()), 'total': total}

    first_report = reports[0]

    output_report = IndicatorsDataOutput()
    output_report.country = first_report.get('country')
    output_report.region = first_report.get('region')
    output_report.prefecture = first_report.get('prefecture')
    output_report.commune = first_report.get('commune')
    output_report.hospital = first_report.get('hospital')
    output_report.district_quartier = first_report.get('district_quartier')
    output_report.village_secteur = first_report.get('village_secteur')
    output_report.reco = reco_names[0] if len(reco_names) == 1 else None
    output_report.reco_asc_type = 'RECO' if len(reco_names) == 1 else 'ASC'
    output_report.data = output_data

    return output_report


def transform_reco_tasks_state_dashboard(reports: List[Dict]) -> Optional[IndicatorsDataOutput]:
    if not reports:
        return None

    reco_names = []
    for r in reports:
        reco = r.get('reco')
        if reco and all(reco['id'] != u['id'] for u in reco_names):
            reco_names.append(reco)

    reco_map = {}

    for item in reports:
        reco_id = item['reco']['id']
        if reco_id not in reco_map:
            reco_map[reco_id] = {
                'id': reco_id,
                'name': item['reco']['name'],
                'phone': item['reco']['phone'],
                'code': item['reco']['code'],
                'external_id': item['reco']['external_id'],
                'chw': item['chw'],
                'village_secteur': item['village_secteur'],
                'families': {}
            }

        for task_list in item.get('state_data', {}).values():
            for task in task_list:
                fam_id = task['family_id']
                pat_id = task['patient_id']

                if fam_id not in reco_map[reco_id]['families']:
                    reco_map[reco_id]['families'][fam_id] = {
                        'id': fam_id,
                        'name': task['family_name'],
                        'given_name': task['family_given_name'],
                        'external_id': task['family_external_id'],
                        'code': task['family_code'],
                        'patients': {}
                    }

                family = reco_map[reco_id]['families'][fam_id]
                if pat_id not in family['patients']:
                    family['patients'][pat_id] = {
                        'id': pat_id,
                        'name': task['patient_name'],
                        'external_id': task['patient_external_id'],
                        'code': task['patient_code'],
                        'data': []
                    }

                family['patients'][pat_id]['data'].append(task)

    output_data = []
    for reco in reco_map.values():
        families = []
        for fam in reco['families'].values():
            patients = []
            for pat in fam['patients'].values():
                patients.append(pat)
            fam['patients'] = patients
            families.append(fam)
        reco['families'] = families
        output_data.append(reco)

    first_report = reports[0]

    output_report = IndicatorsDataOutput()
    output_report.country = first_report.get('country')
    output_report.region = first_report.get('region')
    output_report.prefecture = first_report.get('prefecture')
    output_report.commune = first_report.get('commune')
    output_report.hospital = first_report.get('hospital')
    output_report.district_quartier = first_report.get('district_quartier')
    output_report.village_secteur = first_report.get('village_secteur')
    output_report.reco = reco_names[0] if len(reco_names) == 1 else None
    output_report.reco_asc_type = 'RECO' if len(reco_names) == 1 else 'ASC'
    output_report.data = output_data

    return output_report
