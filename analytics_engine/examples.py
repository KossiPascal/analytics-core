# # Example DSL
# DSL_EXAMPLE = {
#     "source": "pcimne",
#     "joins": [
#         {"table": "reco", "on": {"reco_id":"id"}},
#         {"table": "site", "on": {"site_id":"id"}}
#     ],
#     "dimensions": [
#         {"field": "age", "table": "pcimne"},
#         {"field": "date", "table": "pcimne", "time_series": True, "grain": "month", "alias": "month_bucket"}
#     ],
#     "metrics": [
#         {"agg": "count", "field": "*", "alias": "total_cases", "condition": "pcimne.has_fever IS TRUE"},
#         {"agg": "sum", "field": "has_fever", "alias": "fever_sum"}
#     ],
#     "window": [
#         {"fn": "rank", "field": "", "alias": "age_rank", "order": "total_cases DESC"}
#     ],
#     "pivot": {"field": "sex", "table": "pcimne", "values": ["male","female"]},
#     "filters": {
#         "logic": "AND",
#         "conditions": [
#             {
#                 "logic": "AND",
#                 "conditions": [
#                     {"field": "age", "op": "gte", "value": 5, "table": "pcimne"},
#                     {"field": "region", "op": "eq", "value": "Kankan", "table": "site"}
#                 ]
#             },
#             {
#                 "logic": "OR",
#                 "conditions": [
#                     {"field": "sex", "op": "eq", "value": "male", "table": "pcimne"},
#                     {"field": "sex", "op": "eq", "value": "female", "table": "pcimne"}
#                 ]
#             }
#         ]
#     }
# }

# # Build query
# query = build_query_from_dsl(DSL_EXAMPLE)

# # Register indicator
# register_indicator("fever_by_age_sex", query.render(), version=1)

# # Create materialized view
# mv_sql = create_materialized_view("mv_fever_by_age_sex", query)

# print("SQL QUERY:")
# print(query.render())
# print("\nMATERIALIZED VIEW:")
# print(mv_sql)
# print("\nREGISTERED INDICATOR:")
# print(query.render())



# ############################################################
# # This is the full example that we will use in the demo, showing all features:
# # multi-table, AND/OR conditions, pivot, window function, timeseries
# ############################################################

# """
# Full example: multi-table, AND/OR, pivot, window, timeseries
# """

# # Define tables
# pcimne = Table("pcimne", TABLE_REGISTRY.get("pcimne", ["id","sex","age","has_fever","date","reco_id"]))
# reco = Table("reco", TABLE_REGISTRY.get("reco", ["id","name","site_id"]))
# site = Table("site", TABLE_REGISTRY.get("site", ["id","name","region"]))

# # Build query
# q = SQLQuery(pcimne)
# r = q.join(reco, {"reco_id":"id"})
# s = q.join(site, {"site_id":"id"})

# # Dimensions
# q.select(pcimne.col("age"), "age")
# q.group(pcimne.col("age"))

# # Metrics
# q.metric("count", "*", "total_cases", f"{pcimne.col('has_fever')} IS TRUE")
# q.window("rank", "", "age_rank", order="total_cases DESC")

# # Conditions AND/OR
# cond_and = ConditionNode(LogicType.AND, [
#     f"{pcimne.col('age')} >= 5",
#     f"{site.col('region')} = 'Kankan'"
# ])
# cond_or = ConditionNode(LogicType.OR, [
#     f"{pcimne.col('sex')} = 'male'",
#     f"{pcimne.col('sex')} = 'female'"
# ])
# q.where(ConditionNode(LogicType.AND, [cond_and, cond_or]))

# # Render
# print(q.render())
# print(create_materialized_view("mv_fever_age_sex", q))




# ############################################################
# # Example Flask app to receive DSL, compile to SQL, run query, return results
# ############################################################


# from flask import Flask, request, jsonify
# import psycopg2

# app = Flask(__name__)

# # Config DB PostgreSQL
# DB_CONFIG = {
#     "host": "localhost",
#     "port": 5432,
#     "dbname": "mydb",
#     "user": "postgres",
#     "password": "postgres"
# }

# def run_query(sql):
#     conn = psycopg2.connect(**DB_CONFIG)
#     cur = conn.cursor()
#     cur.execute(sql)
#     columns = [desc[0] for desc in cur.description]
#     rows = cur.fetchall()
#     cur.close()
#     conn.close()
#     return [dict(zip(columns, r)) for r in rows]

# @app.route("/query", methods=["POST"])
# def query():
#     """ Receives JSON DSL from React, returns SQL results as JSON """
#     dsl = request.json
#     try:
#         sql_query = build_query_from_dsl(dsl)
#         sql = sql_query.render()
#         print("Generated SQL:\n", sql)
#         results = run_query(sql)
#         return jsonify({"status": "ok", "sql": sql, "results": results})
#     except Exception as e:
#         return jsonify({"status": "error", "error": str(e)}), 400

# if __name__ == "__main__":
#     app.run(debug=True)