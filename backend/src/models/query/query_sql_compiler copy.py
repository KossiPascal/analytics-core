class SQLCompiler:
    """
    Compile un query JSON validé en SQL ANSI sécurisé
    (Postgres / MySQL / DuckDB compatible)
    """

    def __init__(self, query):
        self.q = query
        self.params = {}

    def compile(self):
        sql = [
            self._compile_select(),
            self._compile_from(),
            self._compile_joins(),
            self._compile_where(),
            self._compile_group_by(),
            self._compile_having(),
            self._compile_order_by(),
            self._compile_limit_offset(),
        ]

        return " ".join(filter(None, sql)), self.params

    # ===================== SELECT =====================
    def _compile_select(self):
        fields = []

        aggs = self.q.get("aggregations", {})
        for field in self.q["select"]:
            if field in aggs:
                fields.append(f"{aggs[field].upper()}({field}) AS {field}")
            else:
                fields.append(field)

        return "SELECT " + ", ".join(fields)

    # ===================== FROM =====================
    def _compile_from(self):
        return f"FROM {self.q['from']}"

    # ===================== JOINS =====================
    def _compile_joins(self):
        joins_sql = []

        for j in self.q.get("joins", []):
            joins_sql.append(
                f"{j['type'].upper()} JOIN {j['table']} "
                f"ON {j['on']['left']} = {j['on']['right']}"
            )

        return " ".join(joins_sql)

    # ===================== WHERE =====================
    def _compile_where(self):
        return self._compile_filters("filters", clause="WHERE")

    # ===================== HAVING =====================
    def _compile_having(self):
        return self._compile_filters("having", clause="HAVING")

    def _compile_filters(self, key, clause):
        conditions = []
        for i, f in enumerate(self.q.get(key, [])):
            param = f"{key}_{i}"
            op = f["op"].upper()

            if op == "IN":
                placeholders = []
                for j, val in enumerate(f["value"]):
                    p = f"{param}_{j}"
                    self.params[p] = val
                    placeholders.append(f":{p}")
                conditions.append(f"{f['field']} IN ({','.join(placeholders)})")

            elif op == "BETWEEN":
                p1, p2 = f"{param}_1", f"{param}_2"
                self.params[p1], self.params[p2] = f["value"]
                conditions.append(f"{f['field']} BETWEEN :{p1} AND :{p2}")

            else:
                self.params[param] = f["value"]
                conditions.append(f"{f['field']} {op} :{param}")

        if not conditions:
            return ""

        return f"{clause} " + " AND ".join(conditions)

    # ===================== GROUP BY =====================
    def _compile_group_by(self):
        if self.q.get("group_by"):
            return "GROUP BY " + ", ".join(self.q["group_by"])
        return ""

    # ===================== ORDER BY =====================
    def _compile_order_by(self):
        parts = []
        for o in self.q.get("order_by", []):
            parts.append(f"{o['field']} {o.get('direction', 'asc').upper()}")
        return "ORDER BY " + ", ".join(parts) if parts else ""

    # ===================== LIMIT / OFFSET =====================
    def _compile_limit_offset(self):
        sql = []
        if self.q.get("limit"):
            sql.append(f"LIMIT {self.q['limit']}")
        if self.q.get("offset"):
            sql.append(f"OFFSET {self.q['offset']}")
        return " ".join(sql)
