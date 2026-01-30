# JSON Query (user / IA)
#         ↓
# QueryValidator (sécurité & règles métier)
#         ↓
# RLSInjector (multi-tenant)
#         ↓
# QueryOptimizer
#   ├─ pushdown filters
#   ├─ reorder joins
#   ├─ prune columns
#         ↓
# Compiler abstraction
#   ├─ SQLCompiler
#   ├─ MongoCompiler
#   ├─ DuckDBCompiler
#         ↓
# Explain / Dry-run
#         ↓
# Execution Engine
#         ↓
# Audit / Lineage / Cache



from abc import ABC, abstractmethod

class BaseCompiler(ABC):

    def __init__(self, query):
        self.q = query

    @abstractmethod
    def compile(self):
        pass

    @abstractmethod
    def explain(self):
        pass


class MongoCompiler(BaseCompiler):

    def compile(self):
        pipeline = []

        # WHERE → $match
        if self.q.get("filters"):
            pipeline.append({"$match": self._compile_filters(self.q["filters"])})

        # GROUP BY → $group
        if self.q.get("aggregations"):
            pipeline.append({"$group": self._compile_group()})

        # ORDER / LIMIT
        if self.q.get("order_by"):
            pipeline.append({"$sort": self._compile_sort()})

        if self.q.get("limit"):
            pipeline.append({"$limit": self.q["limit"]})

        return pipeline

    def _compile_filters(self, filters):
        mongo = {}
        for f in filters:
            if f["op"] == "=":
                mongo[f["field"]] = f["value"]
            elif f["op"] == ">":
                mongo.setdefault(f["field"], {})["$gt"] = f["value"]
        return mongo




class DuckDBCompiler(SQLCompiler):

    def _compile_from(self):
        src = self.q["from"]
        if src.endswith(".parquet"):
            return f"FROM read_parquet('{src}')"
        return super()._compile_from()



class QueryOptimizer:

    def optimize(self, query):
        query = self.pushdown_filters(query)
        query = self.reorder_joins(query)
        query = self.prune_columns(query)
        return query



def pushdown_filters(self, q):
    """
    Déplace les filtres le plus tôt possible
    (avant JOIN / GROUP)
    """
    if not q.get("joins"):
        return q

    base_filters, join_filters = [], []

    for f in q.get("filters", []):
        if "." not in f["field"]:
            base_filters.append(f)
        else:
            join_filters.append(f)

    q["filters"] = base_filters
    q.setdefault("post_join_filters", []).extend(join_filters)
    return q



def reorder_joins(self, q):
    """
    Heuristique simple :
    - INNER JOIN d’abord
    - tables petites en premier
    """
    joins = q.get("joins", [])
    joins.sort(key=lambda j: (
        j["type"] != "inner",
        j.get("cardinality", 1000000)
    ))
    q["joins"] = joins
    return q



class IndexRecommender:

    def recommend(self, query):
        indexes = []

        for f in query.get("filters", []):
            indexes.append((query["from"], f["field"]))

        for g in query.get("group_by", []):
            indexes.append((query["from"], g))

        return self._deduplicate(indexes)

    def _deduplicate(self, idxs):
        return list(set(idxs))



# CREATE INDEX idx_sales_date ON sales(date);
# CREATE INDEX idx_sales_country ON sales(country);



class RLSInjector:

    def inject(self, query, tenant_id):
        rls_filter = {
            "field": "tenant_id",
            "op": "=",
            "value": tenant_id
        }

        query.setdefault("filters", []).insert(0, rls_filter)
        return query


# CREATE POLICY tenant_isolation
# ON data_sources
# USING (tenant_id = current_setting('app.tenant')::uuid);
# SET app.tenant = 'uuid';

# User question:
# "Total des ventes par pays en 2024"

# Available dimensions:
# - country
# - date

# Available metrics:
# - total_sales

# Rules:
# - JSON only
# - Use aggregations



# {
#   "select": ["country", "total_sales"],
#   "aggregations": {
#     "total_sales": "sum"
#   },
#   "group_by": ["country"],
#   "filters": [
#     {"field": "date", "op": "between", "value": ["2024-01-01", "2024-12-31"]}
#   ]
# }

class ExplainParser:

    def parse(self, explain_json):
        nodes = []

        def walk(node):
            nodes.append({
                "type": node["Node Type"],
                "cost": node["Total Cost"],
                "rows": node["Plan Rows"]
            })
            for c in node.get("Plans", []):
                walk(c)

        walk(explain_json["Plan"])
        return nodes
