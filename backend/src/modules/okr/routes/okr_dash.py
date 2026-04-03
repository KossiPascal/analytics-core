# # backend/app.py
# from typing import List
# from flask import Flask, jsonify, request
# from flask_sqlalchemy import SQLAlchemy
# from backend.src.app.configs.extensions import db
# from backend.src.modules.okr.models import OkrProject
# from backend.src.modules.okr.models import OkrActivity, OkrInitiative, OkrKeyResult, OkrGlobal, OkrObjective, OkrTeamScope, OkrProject
# from backend.src.modules.okr.calculations import calculate_project_progress, calculate_global_progress, calculate_team_progress, calculate_objective_progress, calculate_kr_progress


# app = Flask(__name__)
# app.config['SQLALCHEMY_DATABASE_URI'] = "postgresql://user:pass@localhost/dbname"
# db.init_app(app)

# @app.route("/api/dashboard", methods=["GET"])
# def dashboard():
#     projects:List[OkrProject] = OkrProject.query.all()
#     globals:List[OkrGlobal] = OkrGlobal.query.all()

#     dashboard_data = {"projects": [], "globals": []}

#     # Projets
#     for proj in projects:
#         prog = calculate_project_progress(db.session, proj)
#         dashboard_data["projects"].append({
#             "id": proj.id,
#             "name": proj.name,
#             "progress": prog,
#             "budget": proj.budget,
#             "donor": proj.donor
#         })

#     # ORC Globals
#     for global in globals:
#         global_prog = calculate_global_progress(db.session, global)
#         teams_data = []

#         teams:List[OkrTeamScope] = global.teams
#         for team in teams:
#             team_prog = calculate_team_progress(db.session, team)
#             objectives_data = []

#             initiatives:List[OkrInitiative] = team.initiatives
#             for init in initiatives:
#                 objectives:List[OkrObjective] = init.objectives
#                 for obj in objectives:
#                     obj_prog = calculate_objective_progress(db.session, obj)
#                     krs_data = [
#                         {"id": kr.id, "title": kr.title, "progress": calculate_kr_progress(db.session, kr)}
#                         for kr in obj.keyresults
#                     ]
#                     objectives_data.append({
#                         "id": obj.id,
#                         "title": obj.title,
#                         "progress": obj_prog,
#                         "krs": krs_data
#                     })
#             teams_data.append({
#                 "id": team.id,
#                 "team_id": team.team_id,
#                 "progress": team_prog,
#                 "objectives": objectives_data
#             })
#         dashboard_data["globals"].append({
#             "id": global.id,
#             "title": global.title,
#             "progress": global_prog,
#             "teams": teams_data
#         })

#     return jsonify(dashboard_data)


# @app.route("/api/dashboard")
# def get_dashboard():
#     orcs = []
#     teams = OkrTeamScope.query.all()
#     for team in teams:
#         obj_list = []
#         for obj in team.objectives:
#             kr_list = []
#             for kr in obj.krs:
#                 kr_list.append({
#                     "id": kr.id,
#                     "title": kr.title,
#                     "progress": kr.progress,
#                     "weight": kr.weight,
#                     "impact": kr.impact,
#                     "activities": [
#                         {"id": a.id, "title": a.title, "progress": a.progress, "beneficiaries": a.beneficiaries} 
#                         for a in kr.activities
#                     ]
#                 })
#             obj_list.append({"id": obj.id, "title": obj.title, "progress": sum(k["progress"]*k["weight"] for k in kr_list)/max(sum(k["weight"] for k in kr_list),1), "krs": kr_list})
#         orcs.append({"team_id": team.id, "team_name": team.name, "progress": sum(o["progress"] for o in obj_list)/max(len(obj_list),1), "objectives": obj_list})
#     return jsonify({"orc_globals": [{"id":"orc_global_1","title":"ORC Global","progress":sum(t["progress"] for t in orcs)/max(len(orcs),1),"teams":orcs,"snapshots":[]}]})


# # Endpoint pour modifier un KR, Objective ou Activity
# @app.route("/api/update", methods=["POST"])
# def update_entity():
#     data = request.json
#     entity_type = data.get("type")
#     entity_id = data.get("id")
#     updates = data.get("updates", {})

#     model_map = {
#         "kr": OkrKeyResult,
#         "objective": OkrObjective,
#         "activity": OkrActivity
#     }
#     Model = model_map.get(entity_type.lower())
#     if not Model:
#         return jsonify({"error": "Entity type not recognized"}), 400

#     entity = Model.query.get(entity_id)
#     if not entity:
#         return jsonify({"error": "Entity not found"}), 404

#     for key, value in updates.items():
#         setattr(entity, key, value)
#     db.session.commit()
#     return jsonify({"success": True, "id": entity_id})



