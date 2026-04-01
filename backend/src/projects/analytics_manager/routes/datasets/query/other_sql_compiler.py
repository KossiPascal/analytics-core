
# import re
# from typing import Dict, Any, Tuple, List
# from backend.src.projects.analytics_manager.models.dataset import Dataset, DatasetField


# class SQLCompileError(RuntimeError):
#     pass


# class SQLCompiler:

#     DIALECT_QUOTES = {
#         "postgres": '"',
#         "duckdb": '"',
#         "mysql": "`"
#     }

#     PARAM_PREFIX = ":"

#     def __init__(self,dataset:Dataset,fields: List[DatasetField],query: Dict[str, Any],dialect: str = "postgres"):
#         self.dataset = dataset
#         self.fields = self.transformField(fields)
#         self.query = query
#         self.dialect = dialect.lower()

#         if self.dialect not in self.DIALECT_QUOTES:
#             raise ValueError(f"Unsupported SQL dialect: {dialect}")

#         self.params: Dict[str, Any] = {}
#         self._param_index = 0

#     def transformField(self, datasetFields:list[DatasetField])->Dict[str, DatasetField]:
#         return  {f.name:f for f in datasetFields}

#     # ENTRY POINT
#     def compile(self) -> Tuple[str, Dict[str, Any]]:

#         parts = [
#             self._compile_select(),
#             self._compile_from(),
#             self._compile_where(),
#             self._compile_group_by(),
#             self._compile_having(),
#             self._compile_order_by(),
#             self._compile_limit_offset(),
#         ]

#         sql = " ".join([p for p in parts if p])
#         return sql, self.params

#     # UTILITIES
#     def _quote_identifier(self, identifier: str) -> str:
#         quote = self.DIALECT_QUOTES[self.dialect]

#         # allow dot notation safely
#         if "." in identifier:
#             return ".".join(f"{quote}{p}{quote}" for p in identifier.split("."))

#         return f"{quote}{identifier}{quote}"

#     def _next_param(self, value: Any) -> str:
#         self._param_index += 1
#         key = f"p{self._param_index}"
#         self.params[key] = value
#         return f"{self.PARAM_PREFIX}{key}"

#     # FIELD HELPERS
#     def _get_field(self, name: str):
#         field = self.fields.get(name)
#         if not field or not field.is_active:
#             raise SQLCompileError(f"Unknown or inactive field: {name}")
#         return field

#     # SELECT
#     def _compile_select(self) -> str:

#         dimensions = self.query["select"].get("dimensions")
#         metrics = self.query["select"].get("metrics")

#         select_parts: List[str] = []

#         # Dimensions
#         for name in dimensions:
#             field = self._get_field(name)
#             expr = field.expression
#             alias = self._quote_identifier(field.name)
#             select_parts.append(f"{expr} AS {alias}")

#         # Metrics
#         for name in metrics:
#             field = self._get_field(name)

#             if not field.aggregation:
#                 raise SQLCompileError(f"Metric {name} missing aggregation")

#             agg = field.aggregation.upper()
#             expr = field.expression
#             alias = self._quote_identifier(field.name)

#             if agg == "DISTINCT":
#                 select_parts.append(f"COUNT(DISTINCT {expr}) AS {alias}")
#             else:
#                 select_parts.append(f"{agg}({expr}) AS {alias}")

#         if not select_parts:
#             raise SQLCompileError("SELECT cannot be empty")

#         return "SELECT " + ", ".join(select_parts)

#     # FROM
#     def _compile_from(self) -> str:
#         return f"FROM {self._quote_identifier(self.dataset.view_name)}"

#     # WHERE
#     def _compile_where(self) -> str:
#         groups = self.query["filters"].get("where", [])
#         if not groups:
#             return ""

#         sql = self._compile_linked_groups(groups)
#         return f"WHERE {sql}"

#     # HAVING
#     def _compile_having(self) -> str:
#         groups = self.query["filters"].get("having", [])
#         if not groups:
#             return ""

#         sql = self._compile_linked_groups(groups)
#         return f"HAVING {sql}"

#     # LINKED GROUPS
#     def _compile_linked_groups(self, groups: List[Dict[str, Any]]) -> str:

#         compiled = []

#         for i, group in enumerate(groups):

#             node_sql = self._compile_node(group["node"])

#             if i == 0:
#                 compiled.append(node_sql)
#             else:
#                 op = group["linkWithPrevious"]
#                 compiled.append(f"{op} {node_sql}")

#         return " ".join(compiled)

#     # NODE (recursive)
#     def _compile_node(self, node: Dict[str, Any]) -> str:

#         if node["type"] == "group":

#             children = node.get("children", [])
#             if not children:
#                 raise SQLCompileError("Empty filter group")

#             op = node["operator"]

#             compiled_children = [
#                 self._compile_node(child)
#                 for child in children
#             ]

#             return "(" + f" {op} ".join(compiled_children) + ")"

#         if node["type"] == "condition":
#             return self._compile_condition(node)

#         raise SQLCompileError("Invalid filter node type")

#     # CONDITION
#     def _compile_condition(self, node: Dict[str, Any]) -> str:

#         field = self._get_field(node["field"])
#         expr = field.expression
#         operator = node["operator"].upper()

#         # ---- NO VALUE OPERATORS ----

#         if operator in {
#             "IS NULL", "IS NOT NULL",
#             "IS TRUE", "IS NOT TRUE",
#             "IS FALSE", "IS NOT FALSE"
#         }:
#             return f"{expr} {operator}"

#         # ---- IN ----

#         if operator == "IN":
#             values = node["value"]
#             placeholders = [self._next_param(v) for v in values]
#             return f"{expr} IN ({', '.join(placeholders)})"

#         # ---- BETWEEN ----

#         if operator == "BETWEEN":
#             p1 = self._next_param(node["value"])
#             p2 = self._next_param(node["value2"])
#             return f"{expr} BETWEEN {p1} AND {p2}"

#         # ---- STANDARD BINARY ----

#         p = self._next_param(node["value"])
#         return f"{expr} {operator} {p}"

#     # GROUP BY (implicit)
#     def _compile_group_by(self) -> str:

#         dimensions = self.query["select"].get("dimensions")
#         metrics = self.query["select"].get("metrics")

#         if metrics and dimensions:
#             cols = [self._get_field(name).expression for name in dimensions]
#             return "GROUP BY " + ", ".join(cols)

#         return ""

#     # ORDER BY
#     def _compile_order_by(self) -> str:

#         order_items = self.query.get("order_by", [])
#         if not order_items:
#             return ""

#         parts = []

#         for item in order_items:
#             field = self._get_field(item["field"])
#             direction = item["direction"].upper()

#             if field.field_type in ("metric", "calculated_metric"):
#                 agg = field.aggregation.upper()
#                 expr = field.expression
#                 if agg == "DISTINCT":
#                     col_sql = f"COUNT(DISTINCT {expr})"
#                 else:
#                     col_sql = f"{agg}({expr})"
#             else:
#                 col_sql = field.expression

#             parts.append(f"{col_sql} {direction}")

#         return "ORDER BY " + ", ".join(parts)

#     # LIMIT / OFFSET
#     def _compile_limit_offset(self) -> str:

#         parts = []

#         limit = self.query.get("limit")
#         offset = self.query.get("offset")

#         if limit is not None:
#             parts.append(f"LIMIT {int(limit)}")

#         if offset is not None:
#             parts.append(f"OFFSET {int(offset)}")

#         return " ".join(parts)

#     # DEBUG
#     def debug(self) -> Tuple[str, Dict[str, Any]]:
#         return self.compile()