# from datetime import date
# from sqlalchemy import create_engine
# from sqlalchemy.orm import sessionmaker

# # 🔹 Setup SQLAlchemy (en mémoire pour exemple)
# engine = create_engine("sqlite:///:memory:", echo=False)
# Session = sessionmaker(bind=engine)
# session = Session()

# # 🔹 Création des tables
# db.metadata.create_all(engine)

# # -------------------------------
# # 1️⃣ Création Organisation, Équipes, Users
# # -------------------------------
# org = Organization(name="My Company")
# session.add(org)
# session.commit()

# team_sales = Team(name="Sales", org_id=org.id)
# team_tech = Team(name="Tech", org_id=org.id)
# session.add_all([team_sales, team_tech])
# session.commit()

# user_alice = User(name="Alice", org_id=org.id, teams=[team_sales])
# user_bob = User(name="Bob", org_id=org.id, teams=[team_tech])
# session.add_all([user_alice, user_bob])
# session.commit()

# # -------------------------------
# # 2️⃣ Programme et Projet
# # -------------------------------
# program_health = Program(name="Programme Santé Afrique", team_id=team_tech.id)
# session.add(program_health)
# session.commit()

# project_vaccine = Project(
#     name="Vaccination Togo",
#     program_id=program_health.id,
#     team_id=team_tech.id,
#     start_date=date(2026,1,1),
#     end_date=date(2026,12,31),
#     budget=50000,
#     donor="UNICEF"
# )
# session.add(project_vaccine)
# session.commit()

# # -------------------------------
# # 3️⃣ Création ORC Global / Team / Initiative / Objectives / KRs
# # -------------------------------
# global = ORCGlobal(title="Croissance Santé 2026", start_date=date(2026,1,1), end_date=date(2026,12,31))
# session.add(global)
# session.commit()

# team_sales = ORCTeam(team_id=team_sales.id, global_id=global.id)
# team_tech = ORCTeam(team_id=team_tech.id, global_id=global.id)
# session.add_all([team_sales, team_tech])
# session.commit()

# initiative_vaccine = Initiative(title="Augmenter couverture vaccinale", team_id=team_tech.id)
# session.add(initiative_vaccine)
# session.commit()

# objective_vaccine = Objective(title="Augmenter la couverture vaccinale", initiative=initiative_vaccine, project=project_vaccine)
# session.add(objective_vaccine)
# session.commit()

# kr_vaccine = KeyResult(
#     title="Vacciner 10,000 personnes",
#     objective=objective_vaccine,
#     type="number",
#     unit="people",
#     direction=KRDirection.INCREASE,
#     start_value=0,
#     target_value=10000,
#     weight=1
# )
# session.add(kr_vaccine)
# session.commit()

# # -------------------------------
# # 4️⃣ Activités liées au projet et KR
# # -------------------------------
# activity1 = Activity(
#     title="Campagne vaccination Lomé",
#     project=project_vaccine,
#     team_id=team_tech.id,
#     status=ActivityStatus.IN_PROGRESS,
#     priority=ActivityPriority.HIGH,
#     start_date=date(2026,2,1),
#     due_date=date(2026,4,1),
#     completion=0.6,
#     location_country="TG",
#     location_region="Maritime",
#     location_gps_lat=6.13,
#     location_gps_lon=1.22,
#     beneficiaries=1200,
#     owners=[user_alice]
# )

# session.add(activity1)
# session.commit()

# # Lien activité → KR
# link1 = ActivityKeyResult(activity_id=activity1.id, kr_id=kr_vaccine.id, impact=0.8)
# session.add(link1)
# session.commit()

# # -------------------------------
# # 5️⃣ Enregistrement d’événement KR
# # -------------------------------
# event1 = KeyresultEvent(kr_id=kr_vaccine.id, value=1200, date=date(2026,3,1), source="activity")
# session.add(event1)
# session.commit()

# # -------------------------------
# # 6️⃣ Calcul progressions et snapshot
# # -------------------------------
# kr_progress = calculate_kr_progress(session, kr_vaccine)
# objective_progress = calculate_objective_progress(session, objective_vaccine)
# team_progress = calculate_team_progress(session, team_tech)
# global_progress = calculate_global_progress(session, global)
# project_progress = calculate_project_progress(session, project_vaccine)
# snapshot = update_snapshot(session, global.id)

# # -------------------------------
# # 7️⃣ Affichage résultats
# # -------------------------------
# print(f"KR Progression: {kr_progress:.2f}%")
# print(f"Objective Progression: {objective_progress:.2f}%")
# print(f"ORC Team Progression: {team_progress:.2f}%")
# print(f"ORC Global Progression: {global_progress:.2f}%")
# print(f"Project Progression: {project_progress:.2f}%")
# print(f"Snapshot breakdown: {snapshot.breakdown}")