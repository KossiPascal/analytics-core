


# class QueryValidator:
#     """
#     Validation stricte des requêtes analytiques JSON
#     - Secure by design
#     - IA-safe
#     - SQL-safe
#     """

#     ALLOWED_AGGS = {"sum", "avg", "count", "min", "max"}
#     ALLOWED_FILTER_OPS = {"=", "!=", ">", ">=", "<", "<=", "in", "between"}

#     MAX_SELECT = 10
#     MAX_GROUP_BY = 5
#     MAX_FILTERS = 10

#     def __init__(self, query_json, dimensions, metrics):
#         self.query = query_json or {}
#         self.dimensions = {d.name for d in dimensions}
#         self.metrics = {m.name for m in metrics}

#     # ===================== PUBLIC =====================
#     def validate_all(self):
#         self.validate_structure()
#         self.validate_tale()
#         self.validate_join()
#         self.validate_select()
#         self.validate_aggregations()
#         self.validate_group_by()
#         self.validate_filters()
#         self.validate_logical_consistency()

#     # ===================== STRUCTURE =====================
#     def validate_structure(self):
#         if not isinstance(self.query, dict):
#             raise ValueError("Query must be a JSON object")

#         allowed_keys = {"select", "aggregations", "filters", "group_by"}
#         unknown = set(self.query.keys()) - allowed_keys
#         if unknown:
#             raise ValueError(f"Unknown keys in query: {unknown}")

#         if "select" not in self.query:
#             raise ValueError("Missing required key: select")

#         if not isinstance(self.query["select"], list):
#             raise ValueError("select must be a list")

#     # ===================== SELECT =====================

#     def validate_select(self):
#         select = self.query.get("select", [])

#         if not select:
#             raise ValueError("select cannot be empty")

#         if len(select) > self.MAX_SELECT:
#             raise ValueError("Too many selected fields")

#         for field in select:
#             if field not in self.dimensions and field not in self.metrics:
#                 raise ValueError(f"Unauthorized field in select: {field}")

#     # ===================== AGGREGATIONS =====================
#     def validate_aggregations(self):
#         aggs = self.query.get("aggregations", {})

#         if not isinstance(aggs, dict):
#             raise ValueError("aggregations must be an object")

#         for metric, agg in aggs.items():
#             if metric not in self.metrics:
#                 raise ValueError(f"Invalid metric: {metric}")
#             if agg not in self.ALLOWED_AGGS:
#                 raise ValueError(f"Invalid aggregation '{agg}' for {metric}")

#     # ===================== GROUP BY =====================
#     def validate_group_by(self):
#         group_by = self.query.get("group_by", [])

#         if not isinstance(group_by, list):
#             raise ValueError("group_by must be a list")

#         if len(group_by) > self.MAX_GROUP_BY:
#             raise ValueError("Too many group_by fields")

#         for field in group_by:
#             if field not in self.dimensions:
#                 raise ValueError(f"Invalid group_by field: {field}")

#     # ===================== FILTERS =====================
#     def validate_filters(self):
#         filters = self.query.get("filters", [])

#         if not isinstance(filters, list):
#             raise ValueError("filters must be a list")

#         if len(filters) > self.MAX_FILTERS:
#             raise ValueError("Too many filters")

#         for f in filters:
#             if not isinstance(f, dict):
#                 raise ValueError("Each filter must be an object")

#             field = f.get("field")
#             op = f.get("op")
#             value = f.get("value")

#             if field not in self.dimensions:
#                 raise ValueError(f"Filtering on non-dimension field: {field}")

#             if op not in self.ALLOWED_FILTER_OPS:
#                 raise ValueError(f"Invalid filter operator: {op}")

#             if value is None:
#                 raise ValueError(f"Filter value missing for field {field}")

#             if op == "in" and not isinstance(value, list):
#                 raise ValueError("'in' operator requires a list")

#             if op == "between" and (
#                 not isinstance(value, list) or len(value) != 2
#             ):
#                 raise ValueError("'between' operator requires a list of two values")

#     # ===================== LOGIC =====================
#     def validate_logical_consistency(self):
#         select = set(self.query.get("select", []))
#         aggs = set(self.query.get("aggregations", {}).keys())
#         group_by = set(self.query.get("group_by", []))

#         # Metrics must be aggregated
#         for field in select:
#             if field in self.metrics and field not in aggs:
#                 raise ValueError(f"Metric '{field}' must be aggregated")

#         # Dimensions selected must be grouped if aggregation exists
#         if aggs:
#             for field in select:
#                 if field in self.dimensions and field not in group_by:
#                     raise ValueError(
#                         f"Dimension '{field}' must appear in group_by"
#                     )
