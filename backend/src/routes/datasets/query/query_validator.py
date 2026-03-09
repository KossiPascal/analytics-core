import re
from typing import Dict, Any, List, Set
from backend.src.models.datasets.dataset import DatasetField


class QueryValidationError(ValueError):
    pass


class QueryValidatorV1:

    MAX_LIMIT = 100_000
    MAX_FILTER_DEPTH = 10
    MAX_FILTER_NODES = 200
    MAX_ORDER_BY = 10

    ALLOWED_OPERATORS = { 
        "=", "!=", ">", "<", "<>", ">=", "<=", 
        "IN", "BETWEEN", 
        "LIKE", "ILIKE", 
        "IS NULL", "IS NOT NULL", 
        "IS TRUE", "IS NOT TRUE", 
        "IS FALSE", "IS NOT FALSE" 
    }

    ALLOWED_LOGICAL = {"AND", "OR"}
    ALLOWED_ORDER = {"ASC", "DESC"}

    NUMERIC_TYPES = {"integer", "number", "numeric", "bigint", "float", "decimal"}
    STRING_TYPES = {"string", "text", "varchar"}
    DATE_TYPES = {"date", "datetime", "timestamp", "time"}
    BOOLEAN_TYPES = {"boolean", "bool"}
    AGGRAGATION_TYPES = {"sum", "avg", "count", "min", "max", "distinct"}

    OPERATORS_BY_TYPE = {
        "string": ["=", "!=", "LIKE", "ILIKE", "IN", "IS NULL", "IS NOT NULL"],
        "text": ["=", "!=", "LIKE", "ILIKE", "IN", "IS NULL", "IS NOT NULL"],
        "integer": ["=", "!=", ">", ">=", "<", "<=", "BETWEEN", "IN", "IS NULL", "IS NOT NULL"],
        "number": ["=", "!=", ">", ">=", "<", "<=", "BETWEEN", "IN", "IS NULL", "IS NOT NULL"],
        "bigint": ["=", "!=", ">", ">=", "<", "<=", "BETWEEN", "IN", "IS NULL", "IS NOT NULL"],
        "numeric": ["=", "!=", ">", ">=", "<", "<=", "BETWEEN", "IN", "IS NULL", "IS NOT NULL"],
        "float": ["=", "!=", ">", ">=", "<", "<=", "BETWEEN", "IN", "IS NULL", "IS NOT NULL"],
        "decimal": ["=", "!=", ">", ">=", "<", "<=", "BETWEEN", "IN", "IS NULL", "IS NOT NULL"],
        "boolean": ["=", "!=", "IS TRUE", "IS FALSE", "IS NULL", "IS NOT NULL"],
        "date": ["=", "!=", ">", ">=", "<", "<=", "BETWEEN", "IS NULL", "IS NOT NULL"],
        "datetime": ["=", "!=", ">", ">=", "<", "<=", "BETWEEN", "IS NULL", "IS NOT NULL"],
        "time": ["=", "!=", ">", ">=", "<", "<=", "BETWEEN", "IS NULL", "IS NOT NULL"],
        "json": ["=", "!=", "IS NULL", "IS NOT NULL"],
    }

    SAFE_FIELD_PATTERN = re.compile(r"^[a-zA-Z_][a-zA-Z0-9_]*$")

    # INIT
    def __init__(self, query_json: Dict[str, Any], fields: List[DatasetField]):
        self._node_count = 0
        self.fields = self._transformField(fields)
        dims, mets, qjson = self.validate_query_json(fields=fields, query_json=query_json or {})

        self.dimensions = dims
        self.metrics = mets
        self.query = qjson

    def validate_query_json(self, fields: List[DatasetField], query_json: Dict[str, Any]):
        dimensions: Set[str] = set(
            fd.name for fd in fields
            if not fd.aggregation and fd.field_type == "dimension"
        )
        metrics: Set[str] = set(
            fm.name for fm in fields
            if fm.aggregation or fm.field_type in {"metric", "calculated_metric"}
        )

        # sécuriser select
        query_json.setdefault("select", {})
        query_json["select"].setdefault("dimensions", [])
        query_json["select"].setdefault("metrics", [])

        query_dimensions = set(query_json["select"]["dimensions"])
        query_metrics = set(query_json["select"]["metrics"])

        query_json["select"]["dimensions"] = [d for d in query_dimensions if d in dimensions]
        query_json["select"]["metrics"] = [m for m in query_metrics if m in metrics]

        return dimensions, metrics, query_json


    # ENTRY POINT
    def validate(self):
        self._validate_structure()
        self._validate_select()
        self._validate_filters()
        self._validate_order_by()
        self._validate_pagination()
        self._validate_cross_logic()

    # FIELD HELPERS
    def _transformField(self, datasetFields:list[DatasetField])->Dict[str, DatasetField]:
        return  {f.name:f for f in datasetFields}

    # FIELD HELPERS
    def _get_field(self, name: str):
        field = self.fields.get(name)
        if not field or not field.is_active:
            raise QueryValidationError(f"Unknown or inactive field: {name}")
        return field

    # FIELDS
    def _validate_field(self, name):
        if not isinstance(name, str):
            raise QueryValidationError("Field must be string")
        if not self.SAFE_FIELD_PATTERN.match(name):
            raise QueryValidationError(f"Unsafe field name: {name}")
        if name not in self.fields:
            raise QueryValidationError(f"Unknown field {name}")

    # STRUCTURE
    def _validate_structure(self):
        if not isinstance(self.query, dict):
            raise QueryValidationError("Query must be a JSON object")

        required = {"select"}  # "filters"
        missing = required - self.query.keys()
        if missing:
            raise QueryValidationError(f"Missing required keys: {missing}")

    # SELECT
    def _validate_select(self):
        select = self.query["select"]

        if not isinstance(select, dict):
            raise QueryValidationError("select must be an object")

        dimensions = select.get("dimensions", [])
        metrics = select.get("metrics", [])

        self._validate_string_list(dimensions, "dimensions")
        self._validate_string_list(metrics, "metrics")

        dimensions = set(dimensions)
        metrics = set(metrics)

        # 1️⃣ Toutes les dimensions doivent être groupables
        for d in dimensions:
            self._validate_field(d)

            if d not in self.dimensions:
                raise QueryValidationError(f"Unauthorized dimension: {d}")
            
            field = self._get_field(d)

            if field.field_type != "dimension":
                raise QueryValidationError(f"{d} is not a dimension")

            if not field.is_groupable:
                raise QueryValidationError(f"{d} is not groupable")

        # 2️⃣ Toutes les metrics doivent être agrégées
        for m in metrics:
            self._validate_field(m)

            if m not in self.metrics:
                raise QueryValidationError(f"Unauthorized metric: {m}")
            
            field = self._get_field(m)

            if field.field_type not in ("metric", "calculated_metric"):
                raise QueryValidationError(f"{m} is not a metric")

            if field.field_type == "metric":
                if not field.aggregation:
                    raise QueryValidationError(f"Metric {m} must define aggregation")

                if field.aggregation not in self.AGGRAGATION_TYPES:
                    raise QueryValidationError(f"{field.aggregation} aggregation not allowed")

        # 3️⃣ HAVING sans metric interdit
        having = self.query.get("filters", {}).get("having", [])
        if having and not metrics:
            raise QueryValidationError("HAVING requires at least one selected metric")

        # 4️⃣ Si metrics + dimensions vide → KPI autorisé
        # (SELECT sum(amount)) → OK
        # donc pas d'erreur ici

        # 5️⃣ ORDER BY cohérence
        selected_fields = dimensions | metrics

        for item in self.query.get("order_by", []):
            field_name = item["field"]

            if field_name not in selected_fields:
                raise QueryValidationError(f"ORDER BY field {field_name} must be selected")

    # LINKED GROUP
    def _validate_linked_groups(self, groups, clause, depth:int):

        for i, group in enumerate(groups):

            if "node" not in group:
                raise QueryValidationError("Missing node in filter group")
            
            link = group.get("linkWithPrevious")

            # if i == 0 and link:
            #     raise QueryValidationError("First group cannot have linkWithPrevious")

            if i > 0 and link not in self.ALLOWED_LOGICAL:
                raise QueryValidationError("Invalid linkWithPrevious operator")

            self._validate_node(group["node"], clause, depth)
            
    # FILTERSb -> GROUP BY (IMPLICIT BI LOGIC)
    def _validate_filters(self):
        filters = self.query.get("filters", {})

        if not isinstance(filters, dict):
            raise QueryValidationError("filters must be an object")

        for clause in ("where", "having"):
            groups = filters.get(clause, [])
            if not isinstance(groups, list):
                raise QueryValidationError(f"{clause} must be a list")

            self._validate_linked_groups(groups, clause, depth=0)

            for group in groups:
                node = group["node"]
                if not node:
                    raise QueryValidationError("Missing filter node")
                self._validate_node(node, clause, depth=0)

        if self._node_count > self.MAX_FILTER_NODES:
            raise QueryValidationError("Too many filter nodes")

    # NODE
    def _validate_node(self, node: Dict[str, Any], clause: str, depth:int):
        node_type = node.get("type")

        if depth > self.MAX_FILTER_DEPTH:
            raise QueryValidationError("Filter depth too large")

        if node_type == "group":
            operator = node.get("operator")
            children = node.get("children", [])

            if operator not in self.ALLOWED_LOGICAL:
                raise QueryValidationError(f"Invalid logical operator: {operator}")

            if not isinstance(children, list) or not children:
                raise QueryValidationError("Group must contain children")

            for child in children:
                self._validate_node(child, clause, depth + 1)

        elif node_type == "condition":
            self._node_count += 1

            field_name = node.get("field")
            operator = node.get("operator")
            value = node.get("value")
            value2 = node.get("value2")

            if operator not in self.ALLOWED_OPERATORS:
                raise QueryValidationError(f"Invalid operator: {operator}")

            self._validate_field(field_name)
            field = self._get_field(field_name)

            # WHERE vs HAVING
            if clause == "where":
                if field.field_type != "dimension":
                    raise QueryValidationError("WHERE only on dimensions")
                if field.name not in self.dimensions:
                    raise QueryValidationError(f"WHERE only allowed on dimensions: {field.name}")
                if not field.is_filterable:
                    raise QueryValidationError(f"{field_name} not filterable")
            
            if clause == "having":
                if field.field_type == "dimension":
                    raise QueryValidationError("HAVING only on metrics")
                if field.name not in self.metrics:
                    raise QueryValidationError(f"HAVING only allowed on metrics: {field.name}")


            self._validate_operator(field, operator)
            self._validate_values(field, operator, value, value2)

        else:
            raise QueryValidationError("Invalid filter node type")

    # OPERATOR VALIDATION
    def _validate_operator(self, field:DatasetField, operator):

        data_type = field.data_type

        allowed = self.OPERATORS_BY_TYPE.get(data_type, [])

        if operator not in allowed:
            raise QueryValidationError(f"Operator {operator} not allowed for type {data_type}")

    # VALUE VALIDATION
    def _validate_values(self, field:DatasetField, operator, value, value2):

        data_type = field.data_type

        if not data_type:
            raise QueryValidationError(f"No datatype for {field.name}")

        # NULL operators
        if operator in ("IS NULL", "IS NOT NULL", "IS TRUE", "IS NOT TRUE", "IS FALSE", "IS NOT FALSE"):
            return

        # BETWEEN
        if operator == "BETWEEN":
            if value is None or value2 is None:
                raise QueryValidationError("BETWEEN requires value and value2")
            self._validate_scalar(data_type, value)
            self._validate_scalar(data_type, value2)
            return

        # IN
        if operator == "IN":
            if not isinstance(value, list) or not value:
                raise QueryValidationError("IN requires non empty list")
            for v in value:
                self._validate_scalar(data_type, v)
            return

        # LIKE
        if operator == "LIKE":
            if data_type not in self.STRING_TYPES:
                raise QueryValidationError("LIKE only allowed on string")
            if not isinstance(value, str):
                raise QueryValidationError("LIKE requires string")
            return

        if value is None:
            raise QueryValidationError("Operator requires value")
        
        self._validate_scalar(data_type, value)

    # SCALAR
    def _validate_scalar(self, data_type, value):

        if data_type in ("integer", "bigint"):
            if isinstance(value, bool):
                raise QueryValidationError("Boolean is not a valid numeric value")
            
            if not isinstance(value, int):
                try:
                    value = int(value)
                except:
                    raise QueryValidationError("Expected integer")

        elif data_type in ("numeric", "float", "decimal", "number"):
            if isinstance(value, bool):
                raise QueryValidationError("Boolean is not a valid numeric value")
            
            if not isinstance(value, (int, float)):
                try:
                    if "." in str(value):
                        value = float(str(value).strip())
                    elif "," in str(value):
                        value = float(str(value).strip().replace(",","."))
                    else:
                        value = int(value)
                except:
                    raise QueryValidationError(f"Expected numeric value: {value}")
            

        elif data_type in self.STRING_TYPES:
            if isinstance(value, bool):
                raise QueryValidationError("Boolean is not a valid string")
            
            if not isinstance(value, str):
                try:
                    value = str(value)
                except Exception:
                    raise QueryValidationError("Expected string value, Cannot convert value to string")

        elif data_type in self.DATE_TYPES:
            if isinstance(value, bool):
                raise QueryValidationError("Boolean is not a valid date")
            
            if not isinstance(value, str):
                try:
                    value = str(value)
                except Exception:
                    raise QueryValidationError("Date must be ISO string, Cannot convert value to string")
            try:
                # datetime.fromisoformat(value)
                from dateutil.parser import isoparse
                isoparse(value)
            except Exception:
                raise QueryValidationError("Invalid date format")

        elif data_type in self.BOOLEAN_TYPES:
            if not isinstance(value, bool):
                if value not in {"true", "false", "yes", "no", "1", "0"}:
                    raise QueryValidationError("Expected boolean")
        
        elif data_type in ("json", "jsonb"):
            if not isinstance(value, (dict, list, str, int, float, bool, type(None))):
                raise QueryValidationError("Invalid JSON value")
            import json
            try:
                json.dumps(value)
            except:
                raise QueryValidationError("Invalid JSON value")

    # ORDER BY
    def _validate_order_by(self):
        order_by = self.query.get("order_by", [])

        if not isinstance(order_by, list):
            raise QueryValidationError("order_by must be a list")

        if len(order_by) > self.MAX_ORDER_BY:
            raise QueryValidationError("Too many order_by fields")

        valid_fields = (
            set(self.query["select"].get("dimensions", [])) |
            set(self.query["select"].get("metrics", []))
        )

        for item in order_by:
            field_name = item.get("field")
            direction = item.get("direction", "ASC")

            self._validate_field(field_name)

            if field_name not in valid_fields:
                # if not field.is_hidden:
                raise QueryValidationError(f"ORDER BY field must be selected: {field_name}")

            field = self._get_field(field_name)

            if not field.is_sortable:
                raise QueryValidationError(f"{field_name} not sortable")

            if f"{direction}".upper() not in self.ALLOWED_ORDER:
                raise QueryValidationError("Invalid order direction")

    # PAGINATION->LIMIT OFFSET
    def _validate_pagination(self):

        limit = self.query.get("limit")
        offset = self.query.get("offset", 0)

        if limit is not None:
            if not isinstance(limit, int) or limit <= 0:
                raise QueryValidationError("Limit must be positive integer")
            if limit > self.MAX_LIMIT:
                raise QueryValidationError("Limit too large")

        if offset is not None:
            if not isinstance(offset, int) or offset < 0:
                raise QueryValidationError("offset must be >= 0")
            if offset > self.MAX_LIMIT:
                raise QueryValidationError("offset out of range")

        if offset and not limit:
            raise QueryValidationError("offset cannot exist without limit")

    # LOGICAL CONSISTENCY
    def _validate_cross_logic(self):
        """
        - HAVING nécessite au moins un metric sélectionné
        - Metrics doivent être sélectionnés si utilisés en HAVING
        """
        having = self.query.get("filters", {}).get("having", [])
        selected_metrics = set(self.query["select"].get("metrics", []))

        if having and not selected_metrics:
            raise QueryValidationError("HAVING requires selected metrics")
    
    # STRING LIST
    def _validate_string_list(self, value, name):
        if not isinstance(value, list):
            raise QueryValidationError(f"{name} must be list")
        
        if not all(isinstance(v, str) for v in value):
            raise QueryValidationError(f"{name} must be a list of strings")
