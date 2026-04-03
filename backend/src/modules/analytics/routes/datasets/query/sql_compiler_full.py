# from typing import Dict, Any, List, Tuple, Union
# import re

# class SQLCompileError(RuntimeError):
#     pass

# class SQLCompilerFull:
#     """
#     Ultimate SQL Compiler pour JSON query validé
#     --------------------------------------------
#     - Postgres / DuckDB / MySQL compatible
#     - JSON-safe, param binding strict
#     - Multi-table / CTE / BI-ready
#     - Alias auto / NULLS FIRST/LAST / Aggregations / Filters complexes
#     """

#     JSON_OPERATORS = ["->", "->>"]

#     DIALECT_QUOTES = {
#         "postgres": '"',
#         "duckdb": '"',
#         "mysql": '`'
#     }

#     PARAM_PREFIX = ":"  # Named parameters

#     def __init__(self, query: Dict[str, Any], dialect: str = "postgres"):
#         self.q = query
#         self.dialect = dialect.lower()
#         if self.dialect not in self.DIALECT_QUOTES:
#             raise ValueError(f"Unsupported dialect: {dialect}")

#         self.params: Dict[str, Any] = {}
#         self._used_params = set()
#         self._table_aliases = {}
#         self._field_aliases = {}

#     # ===================== ENTRY POINT =====================
#     def compile(self) -> Tuple[str, Dict[str, Any]]:
#         sql_parts = [
#             self._compile_with(),
#             self._compile_select(),
#             self._compile_from(),
#             self._compile_joins(),
#             self._compile_filters("filters", "WHERE"),
#             self._compile_group_by(),
#             self._compile_filters("having", "HAVING"),
#             self._compile_order_by(),
#             self._compile_limit_offset(),
#         ]
#         final_sql = " ".join([p for p in sql_parts if p])
#         return final_sql, self.params

#     # ===================== UTILITIES =====================
#     def _quote(self, identifier: str) -> str:
#         """Quote SQL identifiers safely, support JSON paths"""
#         quote = self.DIALECT_QUOTES[self.dialect]

#         for op in self.JSON_OPERATORS:
#             if op in identifier:
#                 parts = re.split(r"(->>|->)", identifier)
#                 return "".join([quote + p + quote if p not in {"->", "->>"} else p for p in parts])

#         if "." in identifier:
#             return ".".join([quote + p + quote for p in identifier.split(".")])
#         return quote + identifier + quote

#     def _param(self, base: str, value: Any) -> str:
#         key = base
#         i = 1
#         while key in self._used_params:
#             key = f"{base}_{i}"
#             i += 1
#         self._used_params.add(key)
#         self.params[key] = value
#         return f"{self.PARAM_PREFIX}{key}"

#     def _alias_for_table(self, table: str) -> str:
#         if table not in self._table_aliases:
#             self._table_aliases[table] = f"t{len(self._table_aliases)+1}"
#         return self._table_aliases[table]

#     def _alias_for_field(self, field: str) -> str:
#         if field not in self._field_aliases:
#             self._field_aliases[field] = field.split(".")[-1]
#         return self._field_aliases[field]

#     # ===================== WITH / CTE =====================
#     def _compile_with(self) -> str:
#         ctes = self.q.get("with", [])
#         if not ctes:
#             return ""
#         parts = [f"{cte['name']} AS ({cte['sql']})" for cte in ctes]
#         return "WITH " + ", ".join(parts)

#     # ===================== SELECT =====================
#     def _compile_select(self) -> str:
#         fields = []
#         aggs = self.q.get("aggregations", {})
#         distinct = self.q.get("distinct", False)
#         prefix = "SELECT DISTINCT " if distinct else "SELECT "

#         for s in self.q["select"]:
#             if isinstance(s, dict):
#                 field = s["field"]
#                 agg = s.get("agg")
#                 alias = s.get("alias") or self._alias_for_field(field)
#             else:
#                 field = s
#                 agg = aggs.get(field)
#                 alias = self._alias_for_field(field)

#             field_sql = self._quote(field)
#             if agg:
#                 field_sql = f"{agg.upper()}({field_sql})"
#             fields.append(f"{field_sql} AS {self._quote(alias)}")

#         return prefix + ", ".join(fields)

#     # ===================== FROM =====================
#     def _compile_from(self) -> str:
#         table = self.q["from"]
#         alias = self._alias_for_table(table)
#         return f"FROM {self._quote(table)} AS {alias}"

#     # ===================== JOINS =====================
#     def _compile_joins(self) -> str:
#         joins_sql = []
#         for j in self.q.get("joins", []):
#             join_type = j["type"].upper()
#             table = j["table"]
#             alias = self._alias_for_table(table)
#             left = self._quote(j["on"]["left"])
#             right = self._quote(j["on"]["right"])
#             joins_sql.append(f"{join_type} JOIN {self._quote(table)} AS {alias} ON {left} = {right}")
#         return " ".join(joins_sql)

#     # ===================== FILTERS / HAVING =====================
#     def _compile_filters(self, key: str, clause: str) -> str:
#         conditions = []
#         for i, f in enumerate(self.q.get(key, [])):
#             field = self._quote(f["field"])
#             op = f["op"].upper()
#             value = f.get("value")

#             if op in {"IS NULL", "IS NOT NULL"}:
#                 conditions.append(f"{field} {op}")
#             elif op in {"IN", "NOT IN"}:
#                 if not value or not isinstance(value, list):
#                     raise SQLCompileError(f"{op} requires a non-empty list")
#                 placeholders = [self._param(f"{key}_{i}_{j}", v) for j, v in enumerate(value)]
#                 conditions.append(f"{field} {op} ({','.join(placeholders)})")
#             elif op == "BETWEEN":
#                 if not isinstance(value, list) or len(value) != 2:
#                     raise SQLCompileError("BETWEEN requires exactly 2 values")
#                 p1 = self._param(f"{key}_{i}_1", value[0])
#                 p2 = self._param(f"{key}_{i}_2", value[1])
#                 conditions.append(f"{field} BETWEEN {p1} AND {p2}")
#             elif op == "LIKE":
#                 p = self._param(f"{key}_{i}", value)
#                 conditions.append(f"{field} LIKE {p}")
#             else:
#                 p = self._param(f"{key}_{i}", value)
#                 conditions.append(f"{field} {op} {p}")

#         return f"{clause} " + " AND ".join(conditions) if conditions else ""

#     # ===================== GROUP BY =====================
#     def _compile_group_by(self) -> str:
#         if self.q.get("group_by"):
#             fields = [self._quote(f) for f in self.q["group_by"]]
#             return "GROUP BY " + ", ".join(fields)
#         return ""

#     # ===================== ORDER BY =====================
#     def _compile_order_by(self) -> str:
#         parts = []
#         for o in self.q.get("order_by", []):
#             field = self._quote(o["field"])
#             direction = o.get("direction", "asc").upper()
#             nulls = o.get("nulls")
#             sql = f"{field} {direction}"
#             if nulls:
#                 sql += f" NULLS {nulls.upper()}"
#             parts.append(sql)
#         return "ORDER BY " + ", ".join(parts) if parts else ""

#     # ===================== LIMIT / OFFSET =====================
#     def _compile_limit_offset(self) -> str:
#         sql = []
#         if self.q.get("limit") is not None:
#             sql.append(f"LIMIT {int(self.q['limit'])}")
#         if self.q.get("offset") is not None:
#             sql.append(f"OFFSET {int(self.q['offset'])}")
#         return " ".join(sql)

#     # ===================== EXPLAIN / DEBUG =====================
#     def compile_explain(self) -> Tuple[str, Dict[str, Any]]:
#         sql, params = self.compile()
#         return f"EXPLAIN {sql}", params

#     def debug_sql(self) -> Tuple[str, Dict[str, Any]]:
#         return self.compile()
