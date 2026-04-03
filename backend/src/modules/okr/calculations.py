from datetime import datetime
from sqlalchemy.orm import joinedload
from backend.src.app.configs.extensions import db
from backend.src.app.models.b_user import User
from backend.src.app.models.a_tenant import Tenant
from backend.src.modules.okr.models import (
    OkrActivity, 
    OkrActivityKeyResult, 
    ActivityPriorityEnum, 
    ActivityStatusEnum, 
    OkrInitiative, 
    DirectionEnum, 
    OkrKeyresultEvent, 
    OkrKeyResult, 
    OkrGlobal,  
    OkrProgram, 
    OkrTeamScope, 
    OkrObjective, 
    OkrProject, 
    OkrSnapshot, 
)

# FONCTIONS DE CALCUL KR / OBJECTIF / ORC
def get_last_kr_value(kr_id: str):
    """Retourne la dernière valeur connue d’un Key Result à partir des événements."""
    event:OkrKeyresultEvent = (
        db.session.query(OkrKeyresultEvent)
        .filter(OkrKeyresultEvent.kr_id == kr_id)
        .order_by(OkrKeyresultEvent.date.desc())
        .first()
    )
    if event:
        return event.value
    kr:OkrKeyResult = db.session.query(OkrKeyResult).get(kr_id)
    return kr.start_value if kr else 0

def calculate_kr_progress(kr: OkrKeyResult):
    """Calcul du pourcentage de progression d’un KR."""
    value = get_last_kr_value(kr.id)
    if kr.direction == DirectionEnum.INCREASE:
        progress = value / kr.target_value if kr.target_value else 0
    elif kr.direction == DirectionEnum.DECREASE:
        progress = kr.target_value / value if value else 0
    else:
        progress = 0
    return min(max(progress * 100, 0), 100)

def calculate_objective_progress(objective: OkrObjective):
    """Calcul du pourcentage de progression d’un objectif basé sur les KRs et leur poids."""
    krs = db.session.query(OkrKeyResult).filter(OkrKeyResult.objective_id == objective.id).all()
    if not krs:
        return 0
    total_weight = sum(kr.weight for kr in krs)
    progress = 0
    for kr in krs:
        kr_prog = calculate_kr_progress(kr)
        progress += (kr_prog * kr.weight / total_weight)
    return min(progress, 100)

def calculate_team_progress(team: OkrTeamScope):
    """Progression ORC Team basée sur les objectifs de ses initiatives."""
    objectives = (
        db.session.query(OkrObjective)
        .join(OkrInitiative, OkrObjective.initiative_id == OkrInitiative.id)
        .filter(OkrInitiative.team_id == team.id)
        .all()
    )
    if not objectives:
        return 0
    progress_sum = sum(calculate_objective_progress(obj) for obj in objectives)
    return progress_sum / len(objectives)

def calculate_global_progress(global: OkrGlobal):
    """Progression ORC Global basée sur les ORC Teams."""
    teams = db.session.query(OkrTeamScope).filter(OkrTeamScope.global_id == global.id).all()
    if not teams:
        return 0
    progress_sum = sum(calculate_team_progress(team) for team in teams)
    return progress_sum / len(teams)

# FONCTIONS DE PROJET / ACTIVITÉ
def calculate_project_progress(project: OkrProject):
    """Progression projet basée sur les activités pondérées par impact KR ou completion."""
    activities = db.session.query(OkrActivity).filter(OkrActivity.project_id == project.id).all()
    if not activities:
        return 0
    progress_sum = 0
    for act in activities:
        # Si activité liée à KR, pondération par impact
        if act.kr_links:
            for link in act.kr_links:
                kr = db.session.query(OkrKeyResult).get(link.kr_id)
                kr_prog = calculate_kr_progress(kr)
                progress_sum += kr_prog * link.impact
        else:
            progress_sum += act.completion or 0
    return min(progress_sum / len(activities), 100)

def update_snapshot(global_id: str):
    """Création ou mise à jour d’un snapshot ORC global."""
    global:OkrGlobal = db.session.query(OkrGlobal).get(global_id)
    progress = calculate_global_progress(global)
    breakdown = {
        "teams": [
            {"id": t.id, "progress": calculate_team_progress(t)}
            for t in global.teams
        ],
        "objectives": [
            {"id": obj.id, "progress": calculate_objective_progress(obj)}
            for t in global.teams
            for obj in db.session.query(OkrObjective).join(OkrInitiative).filter(OkrInitiative.team_id == t.id)
        ],
    }
    snapshot = OkrSnapshot(
        date=datetime.utcnow(),
        global_id=global_id,
        progress=progress,
        breakdown=breakdown
    )
    db.session.add(snapshot)
    db.session.commit()
    return snapshot

# UTILITAIRES
def recalc_all():
    """Recalcul complet de tous les ORC Globals, projets et snapshots."""
    for global in db.session.query(OkrGlobal).all():
        update_snapshot(global.id)
    for project in db.session.query(OkrProject).all():
        calculate_project_progress(project)

def recalc_all_system():
    """
    Recalcule toutes les progressions KR, Objectifs, ORC Teams, ORC Globals et Projets.
    Génère les snapshots correspondants.
    """
    print("🔄 Recalcul des KRs, Objectifs, ORC Teams, ORC Globals et Projets...")

    # 1️⃣ Recalcul KRs et Objectives
    objectives = db.session.query(OkrObjective).options(joinedload(OkrObjective.keyresults)).all()
    for obj in objectives:
        obj_progress = calculate_objective_progress(obj)
        print(f"Objective {obj.title}: {obj_progress:.2f}%")

    # 2️⃣ Recalcul ORC Teams
    teams = db.session.query(OkrTeamScope).options(joinedload(OkrTeamScope.initiatives)).all()
    for team in teams:
        team_progress = calculate_team_progress(team)
        print(f"ORC Team {team.id}: {team_progress:.2f}%")

    # 3️⃣ Recalcul ORC Globals et création Snapshots
    globals = db.session.query(OkrGlobal).all()
    for global in globals:
        snapshot = update_snapshot(global.id)
        print(f"Snapshot ORC Global {global.title}: {snapshot.progress:.2f}%")

    # 4️⃣ Recalcul Projets
    projects = db.session.query(OkrProject).all()
    for project in projects:
        project_progress = calculate_project_progress(project)
        print(f"Project {project.name}: {project_progress:.2f}%")

    print("✅ Recalcul complet terminé !")



def final_type_dashboard():
    from datetime import date

    # -------------------------------
    # 1️⃣ Création Organisations / Équipes / Users
    # -------------------------------
    org = Tenant(name="Global Health Org")
    db.session.add(org)
    db.session.commit()

    team_togo = OkrTeamScope(name="Togo Team", org_id=org.id)
    team_benin = OkrTeamScope(name="Benin Team", org_id=org.id)
    db.session.add_all([team_togo, team_benin])
    db.session.commit()

    alice = User(name="Alice", org_id=org.id, teams=[team_togo])
    bob = User(name="Bob", org_id=org.id, teams=[team_benin])
    db.session.add_all([alice, bob])
    db.session.commit()

    # -------------------------------
    # 2️⃣ Programmes & Projets
    # -------------------------------
    prog_health = OkrProgram(name="Programme Santé Afrique", team_id=team_togo.id)
    db.session.add(prog_health)
    db.session.commit()

    proj_vaccine_togo = OkrProject(
        name="Vaccination Togo",
        program_id=prog_health.id,
        team_id=team_togo.id,
        start_date=date(2026,1,1),
        end_date=date(2026,12,31),
        budget=50000,
        donor="UNICEF"
    )
    proj_vaccine_benin = OkrProject(
        name="Vaccination Benin",
        program_id=prog_health.id,
        team_id=team_benin.id,
        start_date=date(2026,2,1),
        end_date=date(2026,12,31),
        budget=40000,
        donor="WHO"
    )
    db.session.add_all([proj_vaccine_togo, proj_vaccine_benin])
    db.session.commit()

    # -------------------------------
    # 3️⃣ ORC Global & ORC Teams
    # -------------------------------
    global_health = OkrGlobal(title="ORC Santé Afrique 2026", start_date=date(2026,1,1), end_date=date(2026,12,31))
    db.session.add(global_health)
    db.session.commit()

    team_togo = OkrTeamScope(team_id=team_togo.id, global_id=global_health.id)
    team_benin = OkrTeamScope(team_id=team_benin.id, global_id=global_health.id)
    db.session.add_all([team_togo, team_benin])
    db.session.commit()

    # -------------------------------
    # 4️⃣ Initiatives, Objectives, KRs
    # -------------------------------
    initiative_vaccine_togo = OkrInitiative(title="Couverture vaccinale Togo", team_id=team_togo.id)
    initiative_vaccine_benin = OkrInitiative(title="Couverture vaccinale Benin", team_id=team_benin.id)
    db.session.add_all([initiative_vaccine_togo, initiative_vaccine_benin])
    db.session.commit()

    obj_togo = OkrObjective(title="Vacciner 10,000 personnes Togo", initiative=initiative_vaccine_togo, project=proj_vaccine_togo)
    obj_benin = OkrObjective(title="Vacciner 8,000 personnes Benin", initiative=initiative_vaccine_benin, project=proj_vaccine_benin)
    db.session.add_all([obj_togo, obj_benin])
    db.session.commit()

    kr_togo = OkrKeyResult(
        title="Vacciner 10,000 personnes",
        objective=obj_togo,
        type="number",
        unit="people",
        direction=DirectionEnum.INCREASE,
        start_value=0,
        target_value=10000,
        weight=1
    )
    kr_benin = OkrKeyResult(
        title="Vacciner 8,000 personnes",
        objective=obj_benin,
        type="number",
        unit="people",
        direction=DirectionEnum.INCREASE,
        start_value=0,
        target_value=8000,
        weight=1
    )
    db.session.add_all([kr_togo, kr_benin])
    db.session.commit()

    # -------------------------------
    # 5️⃣ Activités & Liens KR
    # -------------------------------
    activity_togo_1 = OkrActivity(
        title="Campagne Lomé",
        project=proj_vaccine_togo,
        team_id=team_togo.id,
        status=ActivityStatusEnum.IN_PROGRESS,
        priority=ActivityPriorityEnum.HIGH,
        start_date=date(2026,2,1),
        due_date=date(2026,4,1),
        completion=0.6,
        location_country="TG",
        location_region="Maritime",
        beneficiaries=1200,
        owners=[alice]
    )
    activity_benin_1 = OkrActivity(
        title="Campagne Cotonou",
        project=proj_vaccine_benin,
        team_id=team_benin.id,
        status=ActivityStatusEnum.IN_PROGRESS,
        priority=ActivityPriorityEnum.HIGH,
        start_date=date(2026,2,15),
        due_date=date(2026,4,15),
        completion=0.5,
        location_country="BJ",
        location_region="Littoral",
        beneficiaries=1000,
        owners=[bob]
    )
    db.session.add_all([activity_togo_1, activity_benin_1])
    db.session.commit()

    # Liens KR
    link_togo = OkrActivityKeyResult(activity_id=activity_togo_1.id, kr_id=kr_togo.id, impact=0.8)
    link_benin = OkrActivityKeyResult(activity_id=activity_benin_1.id, kr_id=kr_benin.id, impact=0.7)
    db.session.add_all([link_togo, link_benin])
    db.session.commit()

    # -------------------------------
    # 6️⃣ Événements KR
    # -------------------------------
    event_togo = OkrKeyresultEvent(kr_id=kr_togo.id, value=1200, date=date(2026,3,1), source="activity")
    event_benin = OkrKeyresultEvent(kr_id=kr_benin.id, value=1000, date=date(2026,3,2), source="activity")
    db.session.add_all([event_togo, event_benin])
    db.session.commit()

    # -------------------------------
    # 7️⃣ Recalcul complet (batch)
    # -------------------------------
    recalc_all_system()

    # -------------------------------
    # 8️⃣ Résumé final type dashboard
    # -------------------------------
    print("\n📊 DASHBOARD SUMMARY\n")
    for project in db.session.query(OkrProject).all():
        prog = calculate_project_progress(project)
        print(f"Project: {project.name} | Progression: {prog:.2f}% | Budget: {project.budget} | Donor: {project.donor}")

    for global in db.session.query(OkrGlobal).all():
        print(f"\nORC Global: {global.title} | Progression: {calculate_global_progress(global):.2f}%")
        for team in global.teams:
            print(f" - ORC Team ({team.id}): {calculate_team_progress(team):.2f}%")
            for init in team.initiatives:
                print(f"   - Initiative {init.title}")
                for obj in init.objectives:
                    print(f"     - Objective {obj.title} | Progression: {calculate_objective_progress(obj):.2f}%")
                    for kr in obj.keyresults:
                        print(f"       - KR {kr.title} | Progression: {calculate_kr_progress(kr):.2f}%")






