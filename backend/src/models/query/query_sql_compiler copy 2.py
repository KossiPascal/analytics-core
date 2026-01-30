from typing import Dict, Any, List, Tuple


class SQLCompileError(RuntimeError):
    pass


class SQLCompiler:
    """
    Compile un query JSON validé en SQL ANSI sécurisé
    - Postgres / MySQL / DuckDB compatible
    - Param binding strict
    - Multi-table / BI-ready
    """

    IDENTIFIER_QUOTE = '"'
    PARAM_PREFIX = ":"

    def __init__(self, query: Dict[str, Any], dialect: str = "ansi"):
        self.q = query
        self.params: Dict[str, Any] = {}
        self.dialect = dialect

        self._used_params = set()
        self._table_aliases = {}
        self._field_aliases = {}

    # ===================== ENTRY =====================
    def compile(self) -> Tuple[str, Dict[str, Any]]:
        sql = [
            self._compile_with(),
            self._compile_select(),
            self._compile_from(),
            self._compile_joins(),
            self._compile_where(),
            self._compile_group_by(),
            self._compile_having(),
            self._compile_order_by(),
            self._compile_limit_offset(),
        ]

        final_sql = " ".join(filter(None, sql))
        return final_sql, self.params

    # ===================== UTILITIES =====================
    def _quote(self, identifier: str) -> str:
        if "." in identifier:
            return ".".join(self._quote(p) for p in identifier.split("."))
        return f'{self.IDENTIFIER_QUOTE}{identifier}{self.IDENTIFIER_QUOTE}'

    def _param(self, base: str, value: Any) -> str:
        key = base
        i = 1
        while key in self._used_params:
            key = f"{base}_{i}"
            i += 1
        self._used_params.add(key)
        self.params[key] = value
        return f"{self.PARAM_PREFIX}{key}"

    # ===================== WITH / CTE =====================
    def _compile_with(self):
        ctes = self.q.get("with", [])
        if not ctes:
            return ""

        parts = []
        for cte in ctes:
            parts.append(f"{cte['name']} AS ({cte['sql']})")

        return "WITH " + ", ".join(parts)

    # ===================== SELECT =====================
    def _compile_select(self):
        fields = []
        aggs = self.q.get("aggregations", {})

        distinct = self.q.get("distinct", False)
        prefix = "SELECT DISTINCT " if distinct else "SELECT "

        for field in self.q["select"]:
            if field in aggs:
                fn = aggs[field].upper()
                expr = f"{fn}({self._quote(field)})"
                alias = field
            else:
                expr = self._quote(field)
                alias = field.split(".")[-1]

            fields.append(f"{expr} AS {self._quote(alias)}")

        return prefix + ", ".join(fields)

    # ===================== FROM =====================
    def _compile_from(self):
        table = self.q["from"]
        alias = self._alias_for_table(table)
        return f"FROM {self._quote(table)} AS {alias}"

    # ===================== JOINS =====================
    def _compile_joins(self):
        joins_sql = []

        for j in self.q.get("joins", []):
            join_type = j["type"].upper()
            table = j["table"]
            alias = self._alias_for_table(table)

            left = self._quote(j["on"]["left"])
            right = self._quote(j["on"]["right"])

            joins_sql.append(
                f"{join_type} JOIN {self._quote(table)} AS {alias} "
                f"ON {left} = {right}"
            )

        return " ".join(joins_sql)

    def _alias_for_table(self, table: str) -> str:
        if table not in self._table_aliases:
            alias = f"t{len(self._table_aliases)+1}"
            self._table_aliases[table] = alias
        return self._table_aliases[table]

    # ===================== WHERE =====================
    def _compile_where(self):
        return self._compile_filters("filters", clause="WHERE")

    # ===================== HAVING =====================
    def _compile_having(self):
        return self._compile_filters("having", clause="HAVING")

    def _compile_filters(self, key: str, clause: str):
        conditions = []

        for i, f in enumerate(self.q.get(key, [])):
            field = self._quote(f["field"])
            op = f["op"].upper()
            value = f["value"]

            if op == "IS NULL":
                conditions.append(f"{field} IS NULL")

            elif op == "IS NOT NULL":
                conditions.append(f"{field} IS NOT NULL")

            elif op == "IN":
                placeholders = [
                    self._param(f"{key}_{i}_{j}", v)
                    for j, v in enumerate(value)
                ]
                conditions.append(f"{field} IN ({','.join(placeholders)})")

            elif op == "NOT IN":
                placeholders = [
                    self._param(f"{key}_{i}_{j}", v)
                    for j, v in enumerate(value)
                ]
                conditions.append(f"{field} NOT IN ({','.join(placeholders)})")

            elif op == "BETWEEN":
                p1 = self._param(f"{key}_{i}_1", value[0])
                p2 = self._param(f"{key}_{i}_2", value[1])
                conditions.append(f"{field} BETWEEN {p1} AND {p2}")

            elif op == "LIKE":
                p = self._param(f"{key}_{i}", value)
                conditions.append(f"{field} LIKE {p}")

            else:
                p = self._param(f"{key}_{i}", value)
                conditions.append(f"{field} {op} {p}")

        return f"{clause} " + " AND ".join(conditions) if conditions else ""

    # ===================== GROUP BY =====================
    def _compile_group_by(self):
        if self.q.get("group_by"):
            fields = [self._quote(f) for f in self.q["group_by"]]
            return "GROUP BY " + ", ".join(fields)
        return ""

    # ===================== ORDER BY =====================
    def _compile_order_by(self):
        parts = []
        for o in self.q.get("order_by", []):
            field = self._quote(o["field"])
            direction = o.get("direction", "asc").upper()
            nulls = o.get("nulls")  # FIRST / LAST

            sql = f"{field} {direction}"
            if nulls:
                sql += f" NULLS {nulls.upper()}"

            parts.append(sql)

        return "ORDER BY " + ", ".join(parts) if parts else ""

    # ===================== LIMIT / OFFSET =====================
    def _compile_limit_offset(self):
        sql = []
        if self.q.get("limit") is not None:
            sql.append(f"LIMIT {int(self.q['limit'])}")
        if self.q.get("offset") is not None:
            sql.append(f"OFFSET {int(self.q['offset'])}")
        return " ".join(sql)

    # ===================== EXPLAIN / DRY RUN =====================
    def compile_explain(self):
        sql, params = self.compile()
        return f"EXPLAIN {sql}", params

    # ===================== DEBUG =====================
    def debug_sql(self):
        sql, params = self.compile()
        return sql, params
