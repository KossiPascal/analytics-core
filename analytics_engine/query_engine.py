""" Condition Tree Engine: AND / OR / NOT nested """
from typing import Any, List, Literal, Optional, Union, Dict

from cachelib import RedisCache
from analytics_engine.constances import AGGREGATIONS, OPERATORS, TABLE_REGISTRY, WINDOW_FUNCTIONS
from analytics_engine.functions import ASTBuilder, CostGuard, LineageTracker, QueryPlanner, compute_fingerprint, pivot_count, time_bucket, validate_permissions, validate_rbac
from analytics_engine.models import AggregationRef, AliasManager, ColumnRef, CompilationEngine, ConditionRef, ExecutionEngine, JoinRef, JoinType, LogicType, QueryDSL, SQLCompiler, SchemaRegistry, TableRef


# --- Container / Builder class ---
class QueryBuilder:
    def __init__(self):
        self.select_items: List[Union[ColumnRef, AggregationRef]] = []

    def select(self, item: Union[ColumnRef, AggregationRef], alias: Optional[str] = None):
        if isinstance(item, AggregationRef) and alias:
            item.alias = alias
        self.select_items.append(item)
        return self

    def metric(self,agg: Literal["SUM", "COUNT", "AVG", "MIN", "MAX"],field: str,table: str,alias: Optional[str] = None,condition: Optional[ConditionRef] = None,distinct: bool = False):
        """
        Add an aggregation metric to the query.
        """
        # Build ColumnRef first
        column_ref = ColumnRef(table=table, column=field)
        # Build AggregationRef
        agg_ref = AggregationRef(function=agg,field=column_ref,distinct=distinct,condition=condition,alias=alias)
        # Add to select list
        self.select(agg_ref)
        return self
    

class RedisCache:
    def __init__(self, redis_client):
        self.redis = redis_client

    def get(self, key: str):
        return self.redis.get(key)

    def set(self, key: str, value: Any):
        self.redis.set(key, value)

class SQLQuery:
    def __init__(self, table: Union[TableRef, str]):
        self.base: TableRef = TableRef(table) if isinstance(table, str) else table
        self.joins: List[JoinRef] = []
        self.selects: List[str] = []
        self.wheres: List[str] = []
        self.groups: List[str] = []
        self.havings: List[str] = []
        self.orders: List[str] = []

    # -------------------- JOIN --------------------
    def join(self,table: Union[TableRef, str],on: Dict[str, str],join_type: JoinType = JoinType.LEFT) -> TableRef:
        t = TableRef(table) if isinstance(table, str) else table
        # Convert 'on' dict to List[Dict[str,str]] for Join
        conditions = [{left: right} for left, right in on.items()]
        self.joins.append(JoinRef(left=self.base, right=t, on=conditions, type=join_type))
        return t  # Return the joined table for further chaining

    # -------------------- SELECT --------------------
    def select(self, expr: str, alias: Optional[str] = None):
        self.selects.append(f"{expr} AS {alias}" if alias else expr)
        return self

    # -------------------- WHERE --------------------
    def where(self, condition: Union[ConditionRef, str]):
        self.wheres.append(condition.render() if isinstance(condition, ConditionRef) else condition)
        return self

    # -------------------- HAVING --------------------
    def having(self, condition: Union[ConditionRef, str]):
        self.havings.append(condition.render() if isinstance(condition, ConditionRef) else condition)
        return self

    # -------------------- AGGREGATION --------------------
    def metric(self, agg: str, field: str, alias: str, condition: Optional[str] = None, distinct: bool = False):
        f = f"DISTINCT {field}" if distinct else field
        expr = f"{AGGREGATIONS[agg.lower()]}({f})"
        if condition:
            expr += f" FILTER (WHERE {condition})"
        self.select(expr, alias)
        return self

    # -------------------- WINDOW --------------------
    def window(self, fn: str, field: str, alias: str, partition: Optional[str] = None, order: Optional[str] = None):
        expr = f"{WINDOW_FUNCTIONS[fn]}({field}) OVER ("
        if partition:
            expr += f"PARTITION BY {partition} "
        if order:
            expr += f"ORDER BY {order}"
        expr += ")"
        self.select(expr, alias)
        return self

    # -------------------- GROUP --------------------
    def group_by(self, expr: str):
        self.groups.append(expr)
        return self

    # -------------------- PIVOT --------------------
    def pivot(self, pivot_col: str, values: List[str], condition: str, prefix: str = ""):
        for val in values:
            quote = f"'{val}'" if isinstance(val, str) else str(val)
            expr = f"COUNT(*) FILTER (WHERE {pivot_col} = {quote} AND {condition})"
            alias = f"{prefix}{val}"
            self.select(expr, alias)
        return self

    # -------------------- ORDER --------------------
    def order_by(self, expr: str):
        self.orders.append(expr)
        return self

    # -------------------- RENDER --------------------
    def render(self) -> str:
        if not self.selects:
            raise ValueError("No columns selected for SQL query")
        
        sql = f"SELECT {', '.join(self.selects)} FROM {self.base.name} {self.base.alias}"
        if self.joins:
            sql += " " + " ".join(j.render() for j in self.joins)
        if self.wheres:
            sql += " WHERE " + " AND ".join(self.wheres)
        if self.groups:
            sql += " GROUP BY " + ", ".join(self.groups)
        if self.havings:
            sql += " HAVING " + " AND ".join(self.havings)
        if self.orders:
            sql += " ORDER BY " + ", ".join(self.orders)
        return sql
    
    # =========================================================
    # CONDITION FACTORY (SAFE)
    # =========================================================

    def make_condition(table: TableRef|str, field: str, op:str, value=None):
        def q(val):
            if isinstance(val, str):
                return f"'{val}'"
            if isinstance(val, list):
                return "(" + ",".join(q(v) for v in val) + ")"
            return str(val)

        t = TableRef(table) if isinstance(table, str) else table
        col = t.col(field)
        sql_op = OPERATORS[op]
        if op in ["is_null", "not_null"]:
            return f"{col} {sql_op}"
        if op == "between":
            return f"{col} BETWEEN {q(value[0])} AND {q(value[1])}"
        return f"{col} {sql_op} {q(value)}"

    @staticmethod
    def parse_condition(table_map: Dict[str, TableRef], cond_dsl: Dict) -> Union[ConditionRef, str]:
        """
        Recursively parse a condition DSL and return ConditionRef or raw SQL string
        DSL example:
        {
            "logic": "AND",
            "conditions": [
                {"field": "age", "op": "gte", "value": 5, "table": "pcimne"},
                {"logic": "OR", "conditions": [
                    {"field": "sex", "op": "eq", "value": "male", "table": "pcimne"},
                    {"field": "sex", "op": "eq", "value": "female", "table": "pcimne"}
                ]}
            ]
        }
        """
        logic = LogicType(cond_dsl.get("logic", "AND"))
        children: List[Union[str, ConditionRef]] = []

        for c in cond_dsl.get("conditions", []):
            if "logic" in c:
                children.append(SQLQuery.parse_condition(table_map, c))
            else:
                table_name = c.get("table")
                table = table_map[table_name]
                field = table.col(c["field"])
                op = c["op"]
                val = c.get("value")

                if op in ["is_null", "not_null"]:
                    sql_cond = f"{field} IS {'NULL' if op=='is_null' else 'NOT NULL'}"
                elif op == "between":
                    sql_cond = f"{field} BETWEEN {val[0]} AND {val[1]}"
                elif op in ["in", "not_in"]:
                    sql_cond = f"{field} {'IN' if op=='in' else 'NOT IN'} ({','.join(repr(v) for v in val)})"
                else:
                    op_map = {"eq":"=", "neq":"!=", "gt":">", "gte":">=", "lt":"<", "lte":"<="}
                    sql_cond = f"{field} {op_map[op]} {repr(val)}"
                children.append(sql_cond)

        return ConditionRef(logic, children)


    @staticmethod
    def build_query_from_dsl(dsl: Dict) -> "SQLQuery":
        """
        Convert a DSL JSON into a fully built SQLQuery object.
        DSL structure:
        {
            "source": "pcimne",
            "joins": [
                {"table": "reco", "on": {"reco_id":"id"}},
                {"table": "site", "on": {"site_id":"id"}}
            ],
            "dimensions": ["age"],
            "metrics": [
                {"agg": "count", "field": "*", "alias": "total_cases", "condition": "has_fever IS TRUE"}
            ],
            "pivot": {"field": "sex", "values": ["male","female"]},
            "time_series": {"field": "date", "grain": "month"},
            "filters": { ... AND/OR DSL ...}
        }
        """
        # -------------------- Tables --------------------
        table_map: Dict[str, TableRef] = {}
        source = TableRef(dsl["source"], TABLE_REGISTRY[dsl["source"]])
        table_map[dsl["source"]] = source

        q = SQLQuery(source)

        # -------------------- Joins --------------------
        for j in dsl.get("joins", []):
            t = TableRef(j["table"], TABLE_REGISTRY[j["table"]])
            table_map[j["table"]] = t
            join_type = JoinType(j.get("type", "LEFT"))
            q.join(t, j["on"], join_type)

        # -------------------- Dimensions --------------------
        for dim in dsl.get("dimensions", []):
            if isinstance(dim, dict) and dim.get("time_series"):
                t = table_map[dim.get("table", dsl["source"])]
                expr = time_bucket(t.col(dim["field"]), dim["grain"])
                q.select(expr, dim.get("alias", dim["field"]))
                q.group_by(expr)
            else:
                # t = table_map[dim.get("table", dsl["source"])] if isinstance(dim, dict) else source
                t = table_map[dim["table"]] if isinstance(dim, dict) else source
                field_name = dim["field"] if isinstance(dim, dict) else dim
                alias = dim.get("alias") if isinstance(dim, dict) else dim
                field_expr = t.col(field_name)
                q.select(field_expr, alias)
                q.group_by(field_expr)

        # -------------------- Metrics --------------------
        for m in dsl.get("metrics", []):
            t = table_map.get(m.get("table", dsl["source"]))
            field = t.col(m["field"]) if m["field"] != "*" else "*"
            q.metric(m["agg"], field, m["alias"], m.get("condition"))

        # -------------------- Window Functions --------------------
        for w in dsl.get("window", []):
            t = table_map.get(w.get("table", dsl["source"]))
            field = t.col(w["field"]) if w.get("field") else ""
            q.window(w["fn"], field, w["alias"], w.get("partition"), w.get("order"))

        # -------------------- Pivot --------------------
        if "pivot" in dsl:
            p = dsl["pivot"]
            t = table_map.get(p.get("table", dsl["source"]))
            field_expr = t.col(p["field"])
            for col_expr in pivot_count(field_expr, p["values"], p.get("field")):
                q.select(col_expr)

        # -------------------- Filters --------------------
        if "filters" in dsl:
            cond_tree = SQLQuery.parse_condition(table_map, dsl["filters"])
            q.where(cond_tree)

        return q


    @staticmethod
    def create_view(name: str, query: "SQLQuery"):
        return f"""CREATE OR REPLACE VIEW {name} AS 
        {query.render()};
        """
    
    @staticmethod
    def create_materialized_view(name: str, query: "SQLQuery"):
        return f"""
        CREATE MATERIALIZED VIEW IF NOT EXISTS {name} AS 
        {query.render()} 
        WITH DATA;
        """
    
    @staticmethod
    def refresh_materialized_view(name: str):
        return f"REFRESH MATERIALIZED VIEW CONCURRENTLY {name};"
    

class EnterpriseQueryEngine:
    def __init__(self, sqlalchemy_engine):
        self.registry = SchemaRegistry(sqlalchemy_engine)
        self.execution = ExecutionEngine(sqlalchemy_engine)

    def run(self, payload: dict, user_context):
        dsl = QueryDSL(**payload)
        validate_permissions(dsl, user_context)
        ast = ASTBuilder(self.registry).build(dsl)
        optimized = QueryPlanner().optimize(ast)
        context = CompilationEngine(self.registry, AliasManager())
        stmt = SQLCompiler().compile(optimized, context)
        CostGuard().check(stmt)
        return self.execution.execute(stmt)


class GlobalBIEngine:
    def __init__(self, engine, redis):
        self.registry = SchemaRegistry(engine)
        self.execution = ExecutionEngine(engine)
        self.cache = RedisCache(redis)
        self.planner = QueryPlanner()

    def run(self, payload, user):
        dsl = QueryDSL(**payload)
        validate_rbac(dsl, user)
        fingerprint = compute_fingerprint(dsl, user.tenant_id)
        cached = self.cache.get(fingerprint)
        if cached:
            return cached
        ast = ASTBuilder(self.registry).build(dsl)
        planned = self.planner.optimize(ast)
        context = CompilationEngine(self.registry, AliasManager())
        stmt = SQLCompiler().compile(planned, context)
        CostGuard().check(stmt)
        result = self.execution.execute(stmt)
        self.cache.set(fingerprint, result)
        LineageTracker().record(dsl, result)
        return result


# # BUILDER LOGIC
# def _validate(condition: bool, msg: str):
#     if not condition:
#         raise ValueError(msg)

# def build_query(dsl: QueryDSL) -> str:
#     q = SQLQuery(dsl.source)

#     # ----------------------------
#     # DIMENSIONS
#     # ----------------------------
#     for dim in dsl.dimensions:
#         _validate(dim in ALLOWED_FIELDS, f"Field not allowed: {dim}")
#         q.selects.append(dim)
#         q.group_by.append(dim)

#     # ----------------------------
#     # JOINS
#     # ----------------------------
#     for j in dsl.joins:
#         _validate(j.table in ALLOWED_TABLES, f"Join table not allowed: {j.table}")
#         q.joins.append(f"{j.type.upper()} JOIN {j.table} ON {j.on}")

#     # ----------------------------
#     # METRICS (NO PIVOT)
#     # ----------------------------
#     if not dsl.pivot:
#         for m in dsl.metrics:
#             _validate(m.aggregation.lower() in ALLOWED_AGGREGATIONS, "Invalid aggregation")
#             _validate(m.field in ALLOWED_FIELDS, "Invalid field")

#             expr = f"{m.aggregation.upper()}({m.field})"
#             if m.condition:
#                 expr += f" FILTER (WHERE {m.condition})"

#             q.selects.append(f"{expr} AS {m.alias}")

#     # ----------------------------
#     # PIVOT METRICS
#     # ----------------------------
#     if dsl.pivot:
#         _validate(dsl.pivot.field in ALLOWED_FIELDS, "Invalid pivot field")

#         base_metric = dsl.metrics[0]

#         for val in dsl.pivot.values:
#             expr = f"""
#             {base_metric.aggregation.upper()}({base_metric.field})
#             FILTER (
#                 WHERE {dsl.pivot.field} = '{val}'
#                 {f"AND {base_metric.condition}" if base_metric.condition else ""}
#             )
#             AS {val}
#             """.strip()

#             q.selects.append(expr)

#     # ----------------------------
#     # FILTERS
#     # ----------------------------
#     for f in dsl.filters:
#         _validate(f.field in ALLOWED_FIELDS, "Invalid filter field")
#         _validate(f.op in ALLOWED_OPERATORS, "Invalid operator")
#         q.wheres.append(f"{f.field} {f.op} '{f.value}'")

#     # ----------------------------
#     # OUTPUT
#     # ----------------------------
#     sql = q.render()

#     if dsl.output.mode == "view":
#         _validate(dsl.output.name, "View name required")
#         return f"CREATE OR REPLACE VIEW {dsl.output.name} AS {sql};"

#     if dsl.output.mode == "materialized_view":
#         _validate(dsl.output.name, "Materialized view name required")
#         return f"""
#         CREATE MATERIALIZED VIEW IF NOT EXISTS {dsl.output.name} AS
#         {sql}
#         WITH DATA;
#         """

#     return sql

# def generate_sql2(payload: Dict[str, Any]) -> str:
#     dsl = QueryDSL(
#         source=payload["source"],
#         dimensions=payload.get("dimensions", []),
#         metrics=[Metric(**m) for m in payload["metrics"]],
#         filters=[Filter(**f) for f in payload.get("filters", [])],
#         joins=[Join(**j) for j in payload.get("joins", [])],
#         pivot=Pivot(**payload["pivot"]) if payload.get("pivot") else None,
#         output=Output(**payload["output"])
#     )

#     return build_query(dsl)





# # -------------------- Example Usage --------------------
# if __name__ == "__main__":
#     users = Table(name="users", columns=["id", "name", "email"])
#     orders = Table(name="orders", columns=["id", "user_id", "total"])

#     j = Join(
#         left=users,
#         right=orders,
#         on=[{"id": "user_id"}],
#         type=JoinType.INNER
#     )

#     print(j.render())
#     # Example output:
#     # INNER JOIN orders t_abc123 ON t_xyz456.id = t_abc123.user_id




# ´´´´´´´´´´´´´´´´´´´´´´´´´´´´´´´´´´´´´´´´´´´´´´´´´´´´´´´´´´´´´´´´´´´´´´´´´


# ============================================================
# END-TO-END ENTERPRISE EXAMPLE
# ============================================================

# if __name__ == "__main__":
#     print(generate_sql({
#         "source": "pcimne_data_view",
#         "dimensions": [
#             {"table": "facility", "name": "district"}
#         ],
#         "metrics": [
#             {
#                 "agg": "count",
#                 "column": {"table": "pcimne_data_view", "name": "id"},
#                 "alias": "fever_cases",
#                 "condition": "has_fever IS TRUE"
#             }
#         ],
#         "joins": [
#             {
#                 "table": "facility",
#                 "left": {"table": "pcimne_data_view", "name": "facility_id"},
#                 "right": {"table": "facility", "name": "id"}
#             }
#         ],
#         "timeseries": {
#             "column": {"table": "pcimne_data_view", "name": "consultation_date"},
#             "grain": "month"
#         },
#         "pivot": {
#             "column": {"table": "pcimne_data_view", "name": "sex"},
#             "values": ["male", "female"]
#         },
#         "output": {
#             "mode": "materialized_view",
#             "name": "mv_fever_monthly_by_district"
#         }
#     }, role="admin"))





# # -------------------- Example Usage --------------------
# if __name__ == "__main__":
#     users = Table("users", ["id", "name", "email"])
#     orders = Table("orders", ["id", "user_id", "total"])

#     q = SQLQuery(users)
#     q.join(orders, on={"id": "user_id"}, join_type=JoinType.INNER)
#     q.select(users.col("name"), alias="username")
#     q.select(orders.col("total"))
#     q.where("total > 100")
#     q.group_by(users.col("id"))
#     q.order_by("total DESC")

#     print(q.render())
#     # Output:
#     # SELECT t_xxx.name AS username, t_yyy.total FROM users t_xxx INNER JOIN orders t_yyy ON t_xxx.id = t_yyy.user_id WHERE total > 100 GROUP BY t_xxx.id ORDER BY total DESC


# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~



# # =========================================================
# # FULL ANALYTICS EXAMPLE
# # =========================================================

# if __name__ == "__main__":
#     qy = SQLQuery("pcimne")

#     reco = qy.join("reco", {"reco_id": "id"})
#     site = qy.join("site", {"site_id": "id"})

#     # Dimensions
#     qy.select(qy.base.col("age"), "age")
#     qy.group_by.append(qy.base.col("age"))

#     # Metrics
#     qy.metric(
#         agg="count",
#         field="*",
#         alias="fever_cases",
#         condition=f"{qy.base.col('has_fever')} IS TRUE"
#     )

#     qy.metric("count", "*", "total_cases")

#     # Window metric
#     qy.window(
#         fn="rank",
#         field="",
#         alias="age_rank",
#         order="fever_cases DESC"
#     )

#     # WHERE (AND / OR DIFFERENTIATED)
#     cond_and = ConditionRef(
#         LogicType.AND,
#         [
#             make_condition(qy.base, "age", "gte", 5),
#             make_condition(site, "region", "eq", "Kankan"),
#         ]
#     )

#     cond_or = ConditionRef(
#         LogicType.OR,
#         [
#             make_condition(qy.base, "sex", "eq", "male"),
#             make_condition(qy.base, "sex", "eq", "female"),
#         ]
#     )

#     qy.where(
#         ConditionRef(
#             LogicType.AND,
#             [cond_and, cond_or]
#         )
#     )

#     print(qy.render())