class DuckDBCompiler(SQLCompiler):
    """
    Hérite du SQLCompiler mais optimisé analytics colonne
    """

    def _compile_from(self):
        return f"FROM read_parquet('{self.q['from']}')"



class QueryExplainer:
    """
    Explain logique & coût estimé
    """

    def explain(self, query):
        return {
            "tables": self._tables(query),
            "joins": len(query.get("joins", [])),
            "filters": len(query.get("filters", [])),
            "aggregations": list(query.get("aggregations", {}).keys()),
            "group_by": query.get("group_by", []),
            "estimated_complexity": self._complexity_score(query),
            "risk_level": self._risk(query),
        }

    def _tables(self, q):
        return [q["from"]] + [j["table"] for j in q.get("joins", [])]

    def _complexity_score(self, q):
        score = 0
        score += len(q.get("joins", [])) * 3
        score += len(q.get("filters", []))
        score += len(q.get("group_by", [])) * 2
        score += len(q.get("aggregations", {})) * 2
        return score

    def _risk(self, q):
        if self._complexity_score(q) > 15:
            return "HIGH"
        if self._complexity_score(q) > 8:
            return "MEDIUM"
        return "LOW"


class QueryOptimizer:
    """
    Optimisation automatique des requêtes analytiques
    """

    def optimize(self, query):
        query = self._pushdown_filters(query)
        query = self._remove_unused_select(query)
        query = self._auto_order_limit(query)
        return query

    def _pushdown_filters(self, q):
        """
        WHERE avant JOIN si possible
        """
        if q.get("joins") and q.get("filters"):
            q["filters"] = sorted(
                q["filters"],
                key=lambda f: 0 if "." not in f["field"] else 1
            )
        return q

    def _remove_unused_select(self, q):
        used = set(q.get("group_by", [])) | set(q.get("aggregations", {}).keys())
        q["select"] = [f for f in q["select"] if f in used]
        return q

    def _auto_order_limit(self, q):
        if q.get("limit") and not q.get("order_by"):
            q["order_by"] = [{"field": list(q["aggregations"].keys())[0], "direction": "desc"}]
        return q


class SecurityContext:
    """
    Contexte sécurité injecté à chaque requête
    """

    def __init__(
        self,
        user_id: str,
        tenant_id: str,
        roles: list[str],
        allowed_org_units: list[str] | None = None,
    ):
        self.user_id = user_id
        self.tenant_id = tenant_id
        self.roles = roles
        self.allowed_org_units = allowed_org_units or []



class RLSProcessor:
    """
    Injection automatique des règles RLS dans le query builder
    """

    def apply(self, query: dict, ctx: SecurityContext) -> dict:
        query = query.copy()

        filters = query.get("filters", [])

        # RLS obligatoire : tenant
        filters.append({
            "field": "tenant_id",
            "op": "=",
            "value": ctx.tenant_id
        })

        # RLS organisationnel (district, facility, etc.)
        if ctx.allowed_org_units:
            filters.append({
                "field": "org_unit_id",
                "op": "in",
                "value": ctx.allowed_org_units
            })

        query["filters"] = filters
        return query



import hashlib
import json


class CacheKeyBuilder:
    @staticmethod
    def build(query: dict, ctx: SecurityContext) -> str:
        payload = {
            "query": query,
            "tenant": ctx.tenant_id,
            "roles": ctx.roles,
        }
        raw = json.dumps(payload, sort_keys=True)
        return hashlib.sha256(raw.encode()).hexdigest()




class QueryCache:
    """
    Cache intelligent des résultats analytiques
    """

    def __init__(self, backend):
        self.backend = backend  # Redis, Memory, etc.

    def get(self, key):
        return self.backend.get(key)

    def set(self, key, value, ttl=300):
        self.backend.set(key, value, ex=ttl)






class QueryExecutor:
    def __init__(self, compiler, cache: QueryCache):
        self.compiler = compiler
        self.cache = cache

    def execute(self, query, ctx):
        key = CacheKeyBuilder.build(query, ctx)

        cached = self.cache.get(key)
        if cached:
            return {"source": "cache", "data": cached}

        sql, params = self.compiler.compile()
        result = self._run_sql(sql, params)

        self.cache.set(key, result)
        return {"source": "db", "data": result}

    def _run_sql(self, sql, params):
        # implémentation DB réelle ici
        ...




from datetime import datetime


class QueryAuditLogger:
    def log(self, *, ctx, query, sql, duration_ms, row_count):
        return {
            "timestamp": datetime.utcnow(),
            "user_id": ctx.user_id,
            "tenant_id": ctx.tenant_id,
            "query": query,
            "sql": sql,
            "duration_ms": duration_ms,
            "row_count": row_count,
        }




class DataLineageTracker:
    """
    Capture quelles tables / colonnes sont utilisées
    """

    def extract(self, query):
        lineage = {
            "tables": set(),
            "columns": set(),
            "metrics": set(),
        }

        lineage["tables"].add(query["from"])
        for j in query.get("joins", []):
            lineage["tables"].add(j["table"])

        for f in query.get("select", []):
            lineage["columns"].add(f)

        for m in query.get("aggregations", {}):
            lineage["metrics"].add(m)

        return lineage




class AIQueryGenerator:
    """
    Génère un query builder JSON depuis une intention utilisateur
    """

    def __init__(self, schema_description: str):
        self.schema = schema_description

    def generate(self, user_prompt: str) -> dict:
        """
        Ici, tu branches un LLM (OpenAI, local, etc.)
        """
        # Output simulé contrôlé
        return {
            "from": "consultations",
            "select": ["district", "count"],
            "aggregations": {"count": "count"},
            "group_by": ["district"],
            "filters": [
                {"field": "year", "op": "=", "value": 2024}
            ],
            "order_by": [
                {"field": "count", "direction": "desc"}
            ],
            "limit": 10
        }




class IAQueryGuard:
    """
    Bloque les requêtes IA dangereuses ou incohérentes
    """

    def enforce(self, query):
        if query.get("limit", 0) > 1000:
            query["limit"] = 1000

        if not query.get("filters"):
            raise ValueError("IA query must contain at least one filter")

        return query





QueryValidator   → sécurité & logique
QueryOptimizer   → performance
QueryExplainer   → contrôle & coût
SQLCompiler      → SQL prod
MongoAdapter     → NoSQL
DuckDBCompiler   → Analytics local




User Prompt
   ↓
AIQueryGenerator
   ↓
IAQueryGuard
   ↓
QueryValidator
   ↓
RLSProcessor
   ↓
QueryOptimizer
   ↓
QueryExplainer
   ↓
SQLCompiler / MongoAdapter / DuckDB
   ↓
Cache
   ↓
Execution
   ↓
Audit + Lineage
