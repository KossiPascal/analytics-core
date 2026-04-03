# from datetime import date, datetime
# from sqlalchemy.orm import joinedload

# # -------------------------------
# # 1️⃣ Création Organisations / Équipes / Users
# # -------------------------------
# org = Organization(name="Global Health Org")
# session.add(org)
# session.commit()

# team_togo = Team(name="Togo Team", org_id=org.id)
# team_benin = Team(name="Benin Team", org_id=org.id)
# session.add_all([team_togo, team_benin])
# session.commit()

# alice = User(name="Alice", org_id=org.id, teams=[team_togo])
# bob = User(name="Bob", org_id=org.id, teams=[team_benin])
# session.add_all([alice, bob])
# session.commit()

# # -------------------------------
# # 2️⃣ Programmes & Projets
# # -------------------------------
# prog_health = Program(name="Programme Santé Afrique", team_id=team_togo.id)
# session.add(prog_health)
# session.commit()

# proj_togo = Project(
#     name="Vaccination Togo",
#     program_id=prog_health.id,
#     team_id=team_togo.id,
#     start_date=date(2026,1,1),
#     end_date=date(2026,12,31),
#     budget=50000,
#     donor="UNICEF"
# )
# proj_benin = Project(
#     name="Vaccination Benin",
#     program_id=prog_health.id,
#     team_id=team_benin.id,
#     start_date=date(2026,2,1),
#     end_date=date(2026,12,31),
#     budget=40000,
#     donor="WHO"
# )
# session.add_all([proj_togo, proj_benin])
# session.commit()

# # -------------------------------
# # 3️⃣ ORC Global & ORC Teams
# # -------------------------------
# orc_global_health = ORCGlobal(title="ORC Santé Afrique 2026", start_date=date(2026,1,1), end_date=date(2026,12,31))
# session.add(orc_global_health)
# session.commit()

# orc_team_togo = ORCTeam(team_id=team_togo.id, orc_global_id=orc_global_health.id)
# orc_team_benin = ORCTeam(team_id=team_benin.id, orc_global_id=orc_global_health.id)
# session.add_all([orc_team_togo, orc_team_benin])
# session.commit()

# # -------------------------------
# # 4️⃣ Initiatives, Objectives, KRs
# # -------------------------------
# init_togo = Initiative(title="Couverture vaccinale Togo", orc_team_id=orc_team_togo.id)
# init_benin = Initiative(title="Couverture vaccinale Benin", orc_team_id=orc_team_benin.id)
# session.add_all([init_togo, init_benin])
# session.commit()

# obj_togo = Objective(title="Vacciner 10,000 personnes Togo", initiative=init_togo, project=proj_togo)
# obj_benin = Objective(title="Vacciner 8,000 personnes Benin", initiative=init_benin, project=proj_benin)
# session.add_all([obj_togo, obj_benin])
# session.commit()

# kr_togo = KeyResult(
#     title="Vacciner 10,000 personnes",
#     objective=obj_togo,
#     type="number",
#     unit="people",
#     direction="increase",
#     start_value=0,
#     target_value=10000,
#     weight=1
# )
# kr_benin = KeyResult(
#     title="Vacciner 8,000 personnes",
#     objective=obj_benin,
#     type="number",
#     unit="people",
#     direction="increase",
#     start_value=0,
#     target_value=8000,
#     weight=1
# )
# session.add_all([kr_togo, kr_benin])
# session.commit()

# # -------------------------------
# # 5️⃣ Activités & Liens KR
# # -------------------------------
# act_togo = Activity(
#     title="Campagne Lomé",
#     project=proj_togo,
#     team_id=team_togo.id,
#     status="in_progress",
#     priority="high",
#     start_date=date(2026,2,1),
#     due_date=date(2026,4,1),
#     completion=0.6,
#     location_country="TG",
#     location_region="Maritime",
#     beneficiaries=1200,
#     owners=[alice]
# )
# act_benin = Activity(
#     title="Campagne Cotonou",
#     project=proj_benin,
#     team_id=team_benin.id,
#     status="in_progress",
#     priority="high",
#     start_date=date(2026,2,15),
#     due_date=date(2026,4,15),
#     completion=0.5,
#     location_country="BJ",
#     location_region="Littoral",
#     beneficiaries=1000,
#     owners=[bob]
# )
# session.add_all([act_togo, act_benin])
# session.commit()

# link_togo = ActivityKeyResult(activity_id=act_togo.id, kr_id=kr_togo.id, impact=0.8)
# link_benin = ActivityKeyResult(activity_id=act_benin.id, kr_id=kr_benin.id, impact=0.7)
# session.add_all([link_togo, link_benin])
# session.commit()

# # -------------------------------
# # 6️⃣ Événements KR
# # -------------------------------
# evt_togo = KeyresultEvent(kr_id=kr_togo.id, value=1200, date=date(2026,3,1), source="activity")
# evt_benin = KeyresultEvent(kr_id=kr_benin.id, value=1000, date=date(2026,3,2), source="activity")
# session.add_all([evt_togo, evt_benin])
# session.commit()

# # -------------------------------
# # 7️⃣ Recalcul batch
# # -------------------------------
# batch_update_all(session)

# # -------------------------------
# # 8️⃣ Dashboard résumé
# # -------------------------------
# print("\n📊 DASHBOARD OPÉRATIONNEL\n")
# for proj in session.query(Project).all():
#     prog = calculate_project_progress(session, proj)
#     print(f"Project: {proj.name} | Progression: {prog:.2f}% | Budget: {proj.budget} | Donor: {proj.donor}")

# for orc_global in session.query(ORCGlobal).all():
#     global_prog = calculate_orc_global_progress(session, orc_global)
#     print(f"\nORC Global: {orc_global.title} | Progression: {global_prog:.2f}%")
#     for team in orc_global.orc_teams:
#         team_prog = calculate_orc_team_progress(session, team)
#         print(f" - ORC Team ({team.id}): {team_prog:.2f}%")
#         for init in team.initiatives:
#             print(f"   - Initiative {init.title}")
#             for obj in init.objectives:
#                 obj_prog = calculate_objective_progress(session, obj)
#                 print(f"     - Objective {obj.title} | Progression: {obj_prog:.2f}%")
#                 for kr in obj.keyresults:
#                     kr_prog = calculate_kr_progress(session, kr)
#                     print(f"       - KR {kr.title} | Progression: {kr_prog:.2f}%")