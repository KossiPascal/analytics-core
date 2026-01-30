from typing import Dict, List, Set, Any
import re


class QueryValidationError(ValueError):
    """Erreur métier dédiée aux requêtes analytiques"""
    pass


class QueryValidator:
    """
    Validation stricte d'un Query Builder analytique JSON
    - Secure by design
    - SQL-safe
    - IA-safe
    - Multi-table
    - BI-ready
    """

    # ===================== LIMITES GLOBALES =====================
    MAX_SELECT = 15
    MAX_GROUP_BY = 10
    MAX_FILTERS = 15
    MAX_JOINS = 5
    MAX_ORDER_BY = 5
    MAX_LIMIT = 10_000

    # ===================== OPÉRATEURS AUTORISÉS =====================
    ALLOWED_AGGS = {"sum", "avg", "count", "min", "max"}
    ALLOWED_FILTER_OPS = {"=", "!=", ">", ">=", "<", "<=", "in", "between", "like"}
    ALLOWED_JOIN_TYPES = {"inner", "left", "right"}
    ALLOWED_ORDER = {"asc", "desc"}

    # ===================== PATTERNS SÉCURITÉ =====================
    SAFE_FIELD_PATTERN = re.compile(r"^[a-zA-Z_][a-zA-Z0-9_.]*$")

    # ===================== INIT =====================
    def __init__(
        self,
        query_json: Dict[str, Any],
        tables: Dict[str, Set[str]],
        dimensions: Set[str],
        metrics: Set[str],
    ):
        """
        tables = {
            "users": {"id", "name", "country_id"},
            "countries": {"id", "name"}
        }
        """
        self.query = query_json or {}
        self.tables = tables
        self.dimensions = dimensions
        self.metrics = metrics

    # ===================== ENTRY POINT =====================
    def validate_all(self):
        self.validate_structure()
        self.validate_from()
        self.validate_joins()
        self.validate_select()
        self.validate_aggregations()
        self.validate_filters(where=True)
        self.validate_group_by()
        self.validate_having()
        self.validate_order_by()
        self.validate_pagination()
        self.validate_logical_consistency()
        self.validate_cross_references()
        self.validate_security_constraints()

    # ===================== STRUCTURE =====================
    def validate_structure(self):
        if not isinstance(self.query, dict):
            raise QueryValidationError("Query must be a JSON object")

        allowed_keys = {
            "from",
            "joins",
            "select",
            "aggregations",
            "filters",
            "group_by",
            "having",
            "order_by",
            "limit",
            "offset",
        }

        unknown = set(self.query.keys()) - allowed_keys
        if unknown:
            raise QueryValidationError(f"Unknown query keys: {unknown}")

        if "from" not in self.query:
            raise QueryValidationError("Missing FROM clause")

        if "select" not in self.query:
            raise QueryValidationError("Missing SELECT clause")

    # ===================== FROM =====================
    def validate_from(self):
        table = self.query.get("from")
        if not isinstance(table, str):
            raise QueryValidationError("FROM must be a string")

        if table not in self.tables:
            raise QueryValidationError(f"Unknown table: {table}")

    # ===================== JOINS =====================
    def validate_joins(self):
        joins = self.query.get("joins", [])

        if not isinstance(joins, list):
            raise QueryValidationError("joins must be a list")

        if len(joins) > self.MAX_JOINS:
            raise QueryValidationError("Too many joins")

        seen_tables = set()

        for join in joins:
            required = {"table", "type", "on"}
            if not isinstance(join, dict) or not required.issubset(join):
                raise QueryValidationError("Invalid join definition")

            if join["type"] not in self.ALLOWED_JOIN_TYPES:
                raise QueryValidationError(f"Invalid join type: {join['type']}")

            table = join["table"]
            if table not in self.tables:
                raise QueryValidationError(f"Unknown join table: {table}")

            if table in seen_tables:
                raise QueryValidationError(f"Duplicate join on table: {table}")
            seen_tables.add(table)

            on = join["on"]
            if not isinstance(on, dict):
                raise QueryValidationError("join.on must be an object")

            if "left" not in on or "right" not in on:
                raise QueryValidationError("join.on requires left and right keys")

            self._validate_field_name(on["left"])
            self._validate_field_name(on["right"])

    # ===================== SELECT =====================
    def validate_select(self):
        select = self.query.get("select", [])

        if not isinstance(select, list) or not select:
            raise QueryValidationError("select must be a non-empty list")

        if len(select) > self.MAX_SELECT:
            raise QueryValidationError("Too many selected fields")

        for field in select:
            self._validate_field_name(field)

            if field not in self.dimensions and field not in self.metrics:
                raise QueryValidationError(f"Unauthorized select field: {field}")

    # ===================== AGGREGATIONS =====================
    def validate_aggregations(self):
        aggs = self.query.get("aggregations", {})

        if not isinstance(aggs, dict):
            raise QueryValidationError("aggregations must be an object")

        for metric, agg in aggs.items():
            self._validate_field_name(metric)

            if metric not in self.metrics:
                raise QueryValidationError(f"Invalid metric: {metric}")

            if agg not in self.ALLOWED_AGGS:
                raise QueryValidationError(f"Invalid aggregation: {agg}")

    # ===================== FILTERS (WHERE / HAVING) =====================
    def validate_filters(self, where: bool = True):
        key = "filters" if where else "having"
        filters = self.query.get(key, [])

        if not isinstance(filters, list):
            raise QueryValidationError(f"{key} must be a list")

        if len(filters) > self.MAX_FILTERS:
            raise QueryValidationError(f"Too many {key} conditions")

        for f in filters:
            if not isinstance(f, dict):
                raise QueryValidationError(f"{key} condition must be an object")

            field = f.get("field")
            op = f.get("op")
            value = f.get("value")

            if not field or not op:
                raise QueryValidationError(f"Incomplete {key} condition")

            self._validate_field_name(field)

            if where and field not in self.dimensions:
                raise QueryValidationError(f"WHERE on non-dimension: {field}")

            if not where and field not in self.metrics:
                raise QueryValidationError(f"HAVING on non-metric: {field}")

            if op not in self.ALLOWED_FILTER_OPS:
                raise QueryValidationError(f"Invalid operator: {op}")

            if value is None:
                raise QueryValidationError(f"Missing value for {field}")

            if op == "in":
                if not isinstance(value, list) or not value:
                    raise QueryValidationError("'in' requires a non-empty list")

            if op == "between":
                if not isinstance(value, list) or len(value) != 2:
                    raise QueryValidationError("'between' requires exactly two values")

    # ===================== GROUP BY =====================
    def validate_group_by(self):
        group_by = self.query.get("group_by", [])

        if not isinstance(group_by, list):
            raise QueryValidationError("group_by must be a list")

        if len(group_by) > self.MAX_GROUP_BY:
            raise QueryValidationError("Too many group_by fields")

        for field in group_by:
            self._validate_field_name(field)

            if field not in self.dimensions:
                raise QueryValidationError(f"Invalid group_by field: {field}")

    # ===================== HAVING =====================
    def validate_having(self):
        self.validate_filters(where=False)

    # ===================== ORDER BY =====================
    def validate_order_by(self):
        order_by = self.query.get("order_by", [])

        if not isinstance(order_by, list):
            raise QueryValidationError("order_by must be a list")

        if len(order_by) > self.MAX_ORDER_BY:
            raise QueryValidationError("Too many order_by clauses")

        for o in order_by:
            if not isinstance(o, dict):
                raise QueryValidationError("order_by entry must be an object")

            field = o.get("field")
            direction = o.get("direction", "asc")

            self._validate_field_name(field)

            if field not in self.dimensions and field not in self.metrics:
                raise QueryValidationError(f"Invalid order_by field: {field}")

            if direction not in self.ALLOWED_ORDER:
                raise QueryValidationError("Invalid order direction")

    # ===================== PAGINATION =====================
    def validate_pagination(self):
        limit = self.query.get("limit")
        offset = self.query.get("offset", 0)

        if limit is not None:
            if not isinstance(limit, int) or limit <= 0:
                raise QueryValidationError("limit must be a positive integer")
            if limit > self.MAX_LIMIT:
                raise QueryValidationError("limit too high")

        if not isinstance(offset, int) or offset < 0:
            raise QueryValidationError("offset must be >= 0")

        if offset and not limit:
            raise QueryValidationError("offset cannot be used without limit")

    # ===================== LOGICAL CONSISTENCY =====================
    def validate_logical_consistency(self):
        select = set(self.query.get("select", []))
        aggs = set(self.query.get("aggregations", {}).keys())
        group_by = set(self.query.get("group_by", []))

        # Metrics must be aggregated
        for field in select:
            if field in self.metrics and field not in aggs:
                raise QueryValidationError(
                    f"Metric '{field}' must be aggregated"
                )

        # Dimensions must be grouped if aggregation exists
        if aggs:
            for field in select:
                if field in self.dimensions and field not in group_by:
                    raise QueryValidationError(
                        f"Dimension '{field}' must be in group_by"
                    )

        # HAVING without aggregation is forbidden
        if self.query.get("having") and not aggs:
            raise QueryValidationError("HAVING requires aggregation")

    # ===================== CROSS REFERENCES =====================
    def validate_cross_references(self):
        """
        Vérifie cohérence entre SELECT / GROUP BY / ORDER BY / HAVING
        """
        select = set(self.query.get("select", []))
        group_by = set(self.query.get("group_by", []))

        for o in self.query.get("order_by", []):
            field = o.get("field")
            if field in self.dimensions and field not in select:
                raise QueryValidationError(
                    f"ORDER BY dimension '{field}' must be selected"
                )

        for f in self.query.get("having", []):
            if f["field"] not in self.query.get("aggregations", {}):
                raise QueryValidationError(
                    f"HAVING field '{f['field']}' must be aggregated"
                )

    # ===================== SECURITY =====================
    def validate_security_constraints(self):
        """
        Garde-fous IA / SQL injection logique
        """
        for key in ("select", "group_by"):
            for field in self.query.get(key, []):
                if not self.SAFE_FIELD_PATTERN.match(field):
                    raise QueryValidationError(
                        f"Unsafe field name detected: {field}"
                    )

    # ===================== HELPERS =====================
    def _validate_field_name(self, field: str):
        if not isinstance(field, str):
            raise QueryValidationError("Field names must be strings")

        if not self.SAFE_FIELD_PATTERN.match(field):
            raise QueryValidationError(f"Invalid field name: {field}")
