from datetime import date, datetime
from sqlalchemy.orm import joinedload
from backend.src.app.configs.extensions import db
from backend.src.modules.okr.models import OkrActivity, OkrKeyresultEvent, OkrGlobal, OkrInitiative, OkrKeyResult, OkrObjective, OkrProject, OkrSnapshot, OkrTeamScope

# -------------------------------
# UTILITAIRES DE CALCUL
# -------------------------------
def get_latest_kr_value(kr):
    """Retourne la dernière valeur connue d’un KR via les événements"""
    evt = (
        db.session.query(OkrKeyresultEvent)
        .filter(OkrKeyresultEvent.kr_id == kr.id)
        .order_by(OkrKeyresultEvent.date.desc())
        .first()
    )
    return evt.value if evt else kr.start_value

def calculate_kr_progress(kr):
    """Calcul du % de progression d’un KR"""
    val = get_latest_kr_value(kr)
    if kr.direction == "increase":
        progress = val / kr.target_value
    else:  # decrease
        progress = kr.target_value / max(val, 1e-6)
    return max(0.0, min(progress * 100, 100))

def calculate_objective_progress(obj):
    """Progression de l’objectif basée sur KRs et poids"""
    if not obj.keyresults:
        return 0
    total_weight = sum([kr.weight or 1 for kr in obj.keyresults])
    weighted_progress = sum(calculate_kr_progress(kr) * (kr.weight or 1) for kr in obj.keyresults)
    return weighted_progress / total_weight

def calculate_team_progress(team):
    """Progression ORC Team basée sur initiatives et objectifs"""
    if not team.initiatives:
        return 0
    objectives = []
    for init in team.initiatives:
        objectives.extend(init.objectives)
    if not objectives:
        return 0
    return sum(calculate_objective_progress(obj) for obj in objectives) / len(objectives)

def calculate_global_progress(global):
    """Progression ORC Global basée sur ORC Teams"""
    if not global.teams:
        return 0
    return sum(calculate_team_progress(team) for team in global.teams) / len(global.teams)

def calculate_project_progress(project):
    """Progression projet basée sur activités liées à KRs ou completion"""
    activities = project.activities
    if not activities:
        return 0
    total = 0
    for act in activities:
        # Si activité liée à KRs, pondérer par impact
        if act.kr_links:
            kr_prog = sum(calculate_kr_progress(kr_link.keyresult) * kr_link.impact for kr_link in act.kr_links)
            total += kr_prog / sum([kl.impact for kl in act.kr_links])
        else:
            # Sinon utiliser completion
            total += (act.completion or 0) * 100
    return total / len(activities)

# -------------------------------
# SNAPSHOTS
# -------------------------------
def create_or_update_snapshot(global):
    """Crée un snapshot du ORC Global avec détails par équipe et objectif"""
    snapshot = OkrSnapshot(
        global_id=global.id,
        date=datetime.utcnow(),
        progress=calculate_global_progress(global),
        breakdown={}
    )
    breakdown = {"teams": []}
    for team in global.teams:
        team_entry = {
            "team_id": team.team_id,
            "progress": calculate_team_progress(team),
            "objectives": []
        }
        for init in team.initiatives:
            for obj in init.objectives:
                team_entry["objectives"].append({
                    "objective_id": obj.id,
                    "title": obj.title,
                    "progress": calculate_objective_progress(obj)
                })
        breakdown["teams"].append(team_entry)
    snapshot.breakdown = breakdown
    db.session.add(snapshot)
    db.session.commit()
    return snapshot

# -------------------------------
# BATCH COMPLET
# -------------------------------
def batch_update_all():
    """
    Recalcule toutes les progressions et génère snapshots
    Multi-projets / multi-ORC / multi-activités
    """
    print("🔄 Début recalcul complet...")
    # 1️⃣ KRs
    krs = db.session.query(OkrKeyResult).all()
    for kr in krs:
        progress = calculate_kr_progress(kr)
        print(f"KR {kr.title}: {progress:.2f}%")

    # 2️⃣ Objectives
    objectives = db.session.query(OkrObjective).options(joinedload(OkrObjective.keyresults)).all()
    for obj in objectives:
        progress = calculate_objective_progress(obj)
        print(f"Objective {obj.title}: {progress:.2f}%")

    # 3️⃣ ORC Teams
    teams = db.session.query(OkrTeamScope).options(joinedload(OkrTeamScope.initiatives).joinedload(OkrInitiative.objectives)).all()
    for team in teams:
        progress = calculate_team_progress(team)
        print(f"ORC Team {team.id}: {progress:.2f}%")

    # 4️⃣ ORC Globals & Snapshots
    globals = db.session.query(OkrGlobal).options(joinedload(OkrGlobal.teams)).all()
    for global in globals:
        progress = calculate_global_progress(global)
        snapshot = create_or_update_snapshot(global)
        print(f"ORC Global {global.title}: {progress:.2f}% | Snapshot ID: {snapshot.id}")

    # 5️⃣ Projets
    projects = db.session.query(OkrProject).options(joinedload(OkrProject.activities).joinedload(OkrActivity.kr_links)).all()
    for proj in projects:
        progress = calculate_project_progress(proj)
        print(f"Project {proj.name}: {progress:.2f}%")

    print("✅ Recalcul batch terminé !")