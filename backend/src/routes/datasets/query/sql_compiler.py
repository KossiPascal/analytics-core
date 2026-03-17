import re
import json
from datetime import datetime
from typing import Any, Dict, List, Optional
from backend.src.databases.extensions import db, scheduler
from backend.src.models.datasets.dataset import Dataset, DatasetField, DatasetSqlType
from sqlalchemy import bindparam, text
from sqlalchemy.sql.elements import TextClause

# CONSTANTS
NUMERIC_DATA_TYPES = {"integer", "number", "bigint", "numeric", "float", "decimal"}
DATETIME_DATA_TYPES = {"date", "datetime", "time"}

NULL_ONLY_OPERATORS = {"IS NULL", "IS NOT NULL"}
BOOLEAN_ONLY_OPERATORS = {"IS TRUE", "IS NOT TRUE", "IS FALSE", "IS NOT FALSE"}
NO_VALUE_OPERATORS = NULL_ONLY_OPERATORS | BOOLEAN_ONLY_OPERATORS

ARRAY_REQUIRED_OPERATORS = {"IN", "NOT IN"}
RANGE_REQUIRED_OPERATORS = {"BETWEEN", "NOT BETWEEN"}

NUMERIC_OPERATORS = {"=", "!=", "<>", ">", ">=", "<", "<=", "BETWEEN", "NOT BETWEEN", "IN", "NOT IN", *NULL_ONLY_OPERATORS}
STRING_OPERATORS = {"=", "!=", "<>", "LIKE", "ILIKE", "IN", *NULL_ONLY_OPERATORS}
DATE_OPERATORS = NUMERIC_OPERATORS

FULL_OPERATORS = set().union(NUMERIC_OPERATORS,STRING_OPERATORS,DATE_OPERATORS,BOOLEAN_ONLY_OPERATORS,)

VALID_SQL_IDENTIFIER = re.compile(r"^[a-zA-Z_][a-zA-Z0-9_]*$")

DIALECT_QUOTES = { "postgres": '"', "duckdb": '"', "mysql": "`" }



class CompilerError(ValueError):
    pass

# VALUE PARSER
class SQLValueParser:

    # NULL / EMPTY CHECK
    @staticmethod
    def is_null_like(val: Any) -> bool:
        if val is None:
            return True
        s = str(val).strip().lower() 
        return s in {"", "null", "undefined"}

    # BOOLEAN
    @staticmethod
    def parse_boolean(val: Any) -> Optional[bool]:
        if isinstance(val, bool):
            return val
        if val is None:
            return None
        v = str(val).strip().lower()
        if v in {"true", "1", "yes"}:
            return True
        if v in {"false", "0", "no"}:
            return False
        return None

    # NUMERIC
    @staticmethod
    def is_numeric(val: str) -> bool:
        try:
            float(val.replace(",", ".").replace(" ", ""))
            return True
        except:
            return False
    
    # NORMALISE
    @staticmethod
    def normalize_number(val: str) -> float:
        return float(val.replace(",", ".").replace(" ", ""))
    
    # DATE & JSON
    @staticmethod
    def is_valid_date(val: str) -> bool:
        try:
            datetime.fromisoformat(val)
            return True
        except:
            return False
    
    # VALID_JSON
    @staticmethod
    def is_valid_json(val: str) -> bool:
        try:
            json.loads(val)
            return True
        except:
            return False
    
    # STRING / SQL
    @staticmethod
    def remove_quotes(val: str) -> str:
        return re.sub(r"^['\"]+|['\"]+$", "", val).strip()

    # PARSE VALUE
    @staticmethod
    def parse_value(raw: Any, data_type: str):

        if SQLValueParser.is_null_like(raw):
            return None

        value = str(raw).strip()

        if data_type in NUMERIC_DATA_TYPES:
            if not SQLValueParser.is_numeric(value):
                raise ValueError(f"Invalid numeric value: {raw}")
            num = SQLValueParser.normalize_number(value)
            if not float(num):
                return 0
            return num

        if data_type == "boolean":
            b = SQLValueParser.parse_boolean(raw)
            if b is None:
                raise ValueError(f"Invalid boolean value: {raw}")
            return b

        if data_type in DATETIME_DATA_TYPES:
            if not SQLValueParser.is_valid_date(value):
                raise ValueError(f"Invalid date value: {raw}")
            return value

        if data_type == "json":
            if isinstance(raw, dict):
                return json.dumps(raw)
            if not SQLValueParser.is_valid_json(value):
                raise ValueError(f"Invalid JSON value: {raw}")
            return value

        return SQLValueParser.remove_quotes(value)

    # OPERATOR COMPATIBILITY
    @staticmethod
    def assert_operator_compatibility(operator, data_type, value, value2=None):

        # NULL operators accept any type
        if operator in NULL_ONLY_OPERATORS:
            return

        # BOOLEAN specific
        if operator in BOOLEAN_ONLY_OPERATORS:
            if data_type != "boolean":
                raise ValueError(f'Operator "{operator}" only allowed on boolean fields')
            return

        # BETWEEN requires two values
        if operator in RANGE_REQUIRED_OPERATORS:
            if value is None or value2 is None:
                raise ValueError(f'Operator "{operator}" requires two values')

        # IN requires array
        if operator in ARRAY_REQUIRED_OPERATORS:
            if not isinstance(value, list):
                raise ValueError(f'Operator "{operator}" requires list value')

        # Numeric
        if data_type in NUMERIC_DATA_TYPES:
            if operator not in NUMERIC_OPERATORS:
                raise ValueError(f'Operator "{operator}" not compatible with numeric type')
            return

        # Date
        if data_type in DATETIME_DATA_TYPES:
            if operator not in DATE_OPERATORS:
                raise ValueError(f'Operator "{operator}" not compatible with date type')
            return

        # String
        if data_type in {"string", "json", "jsonb"}:
            if operator not in STRING_OPERATORS:
                raise ValueError(f'Operator "{operator}" not compatible with string type')
            return

        # Boolean normal comparisons
        if data_type in ["boolean","bool"]:
            if operator not in {"=", "!=", "<>"} | BOOLEAN_ONLY_OPERATORS:
                raise ValueError(f'Operator "{operator}" not compatible with boolean type')
            return

    @staticmethod
    def quote_identifier(name: str) -> str:
        return f'"{name.replace(chr(34), "")}"'
    
    # SANITIZE & IDENTIFIERS
    @staticmethod
    def sanitize_identifier(name: str) -> str:
        if not name:
            raise ValueError("Identifier cannot be empty")
        return re.sub(r"[^a-zA-Z0-9_]", "_", name)

    @staticmethod
    def escape_sql_string(val: str) -> str:
        return val.replace("'", "''")
    
    # SQL_VALUE
    @staticmethod
    def format_sql_value(raw, data_type)-> str | int:
        if (SQLValueParser.is_null_like(raw)):
            return "NULL"
        parsed = SQLValueParser.parse_value(raw, data_type)

        if (isinstance(parsed, int)):
            return parsed
        if (isinstance(parsed, bool)):
            return "TRUE" if parsed is True else "FALSE"

        return SQLValueParser.escape_sql_string(str(parsed))


# FILTER BUILDER
class SQLFilterBuilder:

    def __init__(self, fields: Dict[int, DatasetField]):
        self.fields = fields
        self.param_index = 0

    # FIELD HELPERS
    def _get_field(self, id: int):
        field = self.fields.get(id)
        if not field or not field.is_active:
            raise CompilerError(f"Unknown or inactive field_id: {id}")
        return field
    
    def next_key(self) -> str:
        key = f"p_{self.param_index}"
        self.param_index += 1
        return key

    # SQL EXPRESSION
    def generate_expression(self, field: DatasetField, isDistinct: bool = False) -> str:
        if not field.expression:
            return ""
        DISTINCT = "DISTINCT " if isDistinct else ""
        if field.field_type == "dimension" and not field.aggregation:
            return f"{DISTINCT}{field.expression}"
        if field.aggregation:
            return f"{field.aggregation}({DISTINCT}{field.expression})"
        return f"{DISTINCT}{field.expression}"

    def build(self, node: dict) -> Dict[str, Any]:

        result = {"wheres": [], "havings": [], "values": {}}

        if not node:
            return result

        # ---------------- CONDITION ----------------
        if node["type"] == "condition":
            field_id = node.get("field_id")
            field = self._get_field(field_id)

            operator = f'{node.get("operator")}'.upper()
            brutValue = node.get("value")
            brutValue2 = node.get("value2")
            
            if not field:
                raise ValueError(f"Unknown field: {field_id}")
            if (not field.field_type):
                raise ValueError(f"Field type missing for {field_id}")
            if (operator not in FULL_OPERATORS):
                raise ValueError(f"Opérateur non autorisé: {operator}")

            dataType = field.data_type
            fieldType = field.field_type

            SQLValueParser.assert_operator_compatibility(operator,dataType,brutValue,brutValue2)

            expr = self.generate_expression(field)

            values = {}

            # BETWEEN
            if operator == "BETWEEN" or operator == "NOT BETWEEN":
                if not brutValue or not brutValue2:
                    raise ValueError(f"BETWEEN requires two values")
                k1 = self.next_key()
                k2 = self.next_key()
                values[k1] = SQLValueParser.parse_value(brutValue, dataType)
                values[k2] = SQLValueParser.parse_value(brutValue2, dataType)
                clause = f"{expr} {operator} :{k1} AND :{k2}"

            # IN / NOT IN
            elif operator == "IN" or operator == "NOT IN":
                arr = brutValue if isinstance(brutValue,list) else [brutValue]
                if (len(arr) == 0):
                    raise ValueError("IN operator requires at least one value")

                useSqlInClause =bool(node.get("useSqlInClause") or False)
                
                if useSqlInClause:
                    # Cas classique: col IN (:p_0, :p_1, ...)
                    keys = []
                    for v in arr:
                        k = self.next_key()
                        values[k] = SQLValueParser.parse_value(v, dataType)
                        keys.append(f':{k}')
                    clause = f"{expr} {operator} ({', '.join(keys)})"
                else:
                    # Cas ANY: col = ANY(:p_array) → PostgreSQL ARRAY
                    k = self.next_key()
                    # IMPORTANT : on génère ARRAY[:p_array] pour Postgres
                    if operator == "NOT IN":
                        clause = f"NOT ({expr} = ANY(:{k}))"
                    else:
                        clause = f"{expr} = ANY(:{k})"
                        
                    # convertit toutes les valeurs au format SQLValueParser
                    values[k] = [SQLValueParser.parse_value(v, dataType) for v in arr]

            # NO VALUE
            elif operator in NO_VALUE_OPERATORS:
                clause = f"{expr} {operator}"
            
            # NULL / TRUE / FALSE
            else:
                formatted = SQLValueParser.format_sql_value(brutValue, dataType)
                if (str(formatted) in ["NULL", "TRUE", "FALSE"]):
                    clause = f"{expr} {operator} {str(formatted)}"
                else:
                    k = self.next_key()
                    values[k] = SQLValueParser.parse_value(brutValue, dataType)
                    clause = f"{expr} {operator} :{k}"

            is_metric = fieldType in {"metric", "calculated_metric"} or field.aggregation

            if is_metric:
                result["havings"].append(clause)
            else:
                result["wheres"].append(clause)

            result["values"].update(values)
            return result

        # GROUP
        if node["type"] == "group":

            where_parts:list[str] = []
            having_parts:list[str] = []

            for child in node["children"]:
                built = self.build(child)
                if len(built["wheres"]) > 0:
                    where_parts.append(" ".join(built["wheres"]))
                if len(built["havings"]) > 0:
                    having_parts.append(" ".join(built["havings"]))
                result["values"].update(built["values"])

            op = node["operator"]

            if len(where_parts) > 0:
                result["wheres"].append(
                    f"({f' {op} '.join(where_parts)})"
                    if len(where_parts) > 1 else where_parts[0]
                )

            if having_parts:
                result["havings"].append(
                    f"({f' {op} '.join(having_parts)})"
                    if len(having_parts) > 1 else having_parts[0]
                )

            return result

        return result


# MAIN SQL COMPILER
class SQLCompilerV1:

    def __init__(self,dataset:Dataset,fields: List[DatasetField],dialect: str = "postgres"):

        if not dataset or not fields or not isinstance(fields, list):
            raise ValueError(f"dataset and fields->list are require")
        
        if dialect not in DIALECT_QUOTES:
            raise ValueError(f"Unsupported SQL dialect: {dialect}")

        self.dataset = dataset
        self.fields = self._transformField(fields)
        self.dialect = dialect.lower()
        self.params: Dict[str, Any] = {}
        self._param_index = 0


    # FIELD HELPERS
    def _get_field(self, id: int):
        msg = f"Unknown or inactive field_id: {id}"
        if not id:
            raise CompilerError(msg)
        field = self.fields.get(id)
        if not field or not field.is_active:
            raise CompilerError(msg)
        return field
    
    def compile(self, query: Dict[str, Any]):

        if not self.dataset.view_name:
            raise ValueError("Dataset invalide.")

        filter_builder = SQLFilterBuilder(self.fields)
        select_part:list[str] = []
        group_by_part:list[str] = []
        alias_map:list[str] = {}

        dimensions = query.get("select", {}).get("dimensions", [])
        metrics = query.get("select", {}).get("metrics", [])

        if not dimensions and not metrics:
            raise ValueError("At least one dimension or metric required.")

        # DIMENSIONS
        for dim in dimensions:
            field_id = dim.get("field_id")
            field = self._get_field(field_id)
            if not field or field.field_type != "dimension" or bool(field.aggregation):
                raise ValueError(f"Unrecognize dimension: {field_id}.")
            dim_alias = (dim.get("alias") or "").strip()
            alias = SQLValueParser.quote_identifier(dim_alias or field.name)
            select_part.append(f"{field.expression} AS {alias}")
            group_by_part.append(field.expression)
            alias_map[field.id] = alias

        # METRICS
        for met in metrics:
            field_id = met.get("field_id")
            field = self._get_field(field_id)
            if not field or field.field_type not in {"metric", "calculated_metric"}:
                raise ValueError(f"Unrecognize metric : {field_id}.")
            metric_alias = (met.get("alias") or "").strip()
            alias = SQLValueParser.quote_identifier(metric_alias or field.name)
            expr = filter_builder.generate_expression(field)
            select_part.append(f"{expr} AS {alias}")
            alias_map[field.id] = alias

        if not select_part:
            raise ValueError("No valid fields selected.")

        # FILTERS
        where_part:list[str] = []
        having_part:list[str] = []
        values = {}

        filters = (
            query.get("filters", {}).get("where", []) +
            query.get("filters", {}).get("having", [])
        )

        for f in filters:
            built = filter_builder.build(f["node"])
            where_part.extend(built["wheres"])
            having_part.extend(built["havings"])
            values.update(built["values"])

        # ORDER BY
        order_by_clause = ""
        if query.get("order_by"):
            parts = []
            for o in query["order_by"]:
                field_id = o["field_id"]
                alias = alias_map.get(field_id)
                if field_id not in self.fields or not alias:
                    raise ValueError(f"Invalid ORDER BY field: {field_id}")
                direction = "DESC" if f'{o["direction"]}'.lower() == "desc" else "ASC"
                parts.append(f"{alias} {direction}")
            order_by_clause = "ORDER BY " + ", ".join(parts)

        # LIMIT OFFSET
        limit_clause = f"LIMIT {query['limit']}" if isinstance(query.get("limit"), int) and query["limit"] > 0 else ""
        offset_clause = f"OFFSET {query['offset']}" if isinstance(query.get("offset"), int) and query["offset"] >= 0 else ""

        has_group_by = bool(metrics and group_by_part)

        view_name = SQLValueParser.quote_identifier(self.dataset.view_name)

        sql = "\n".join(filter(None, [
            "SELECT",
            "  " + ",\n  ".join(select_part),
            f"FROM {view_name}",
            f"WHERE {' \n '.join(where_part)}" if where_part else "",
            f"GROUP BY {', '.join(group_by_part)}" if has_group_by else "",
            f"HAVING {' \n '.join(having_part)}" if having_part else "",
            order_by_clause,
            limit_clause,
            offset_clause
        ])).strip()

        return { "sql": sql, "values": values }

    def compile_pivot(self, query: Dict[str, Any], pivot_fields: Dict[str, Any]) -> Dict[str, Any]:
        """
        Pivot multi-dimension V1
        Supports:
        - many rows, many columns, many metrics
        """

        pivot_rows = pivot_fields.get("rows", []) or []
        pivot_columns = pivot_fields.get("columns", []) or []
        pivot_metrics = pivot_fields.get("data", []) or []

        if not isinstance(pivot_rows, list):
            raise ValueError("rows must be arrays")
        if not isinstance(pivot_columns, list):
            raise ValueError("columns must be arrays")
        if not isinstance(pivot_metrics, list):
            raise ValueError("data must be arrays")

        if not pivot_metrics:
            raise ValueError("At least one metric is required")

        filter_builder = SQLFilterBuilder(self.fields)

        select_part = []
        group_by_part = []
        values = {}

        view_name = SQLValueParser.quote_identifier(self.dataset.view_name)

        # 1️⃣ ROWS
        for row in pivot_rows:
            field = self._get_field(row.get('field_id'))
            if not field:
                raise ValueError(f"Invalid row field: {row}")
            
            row_alias = (row.get("alias") or "").strip()
            alias = SQLValueParser.quote_identifier(row_alias or field.name)
            select_part.append(f"{field.expression} AS {alias}")
            group_by_part.append(field.expression)

        # 2️⃣ COLUMN COMBINATIONS
        column_combinations = []
        if pivot_columns:
            column_combinations = self._get_column_combinations(query, pivot_columns)

        # Explosion protection
        MAX_COLUMNS = 300
        if len(column_combinations) * len(pivot_metrics) > MAX_COLUMNS:
            raise ValueError("Pivot would generate too many columns. Please filter.")

        # 3️⃣ PIVOT GENERATION
        if pivot_columns:

            for metric in pivot_metrics:
                metric_field = self._get_field(metric.get('field_id'))
                if not metric_field:
                    raise ValueError(f"Invalid metric field: {metric}")

                metric_expr = filter_builder.generate_expression(metric_field)

                for combo_index, combo in enumerate(column_combinations):

                    case_conditions = []
                    alias_parts = [metric]

                    for col_name, col_value in combo.items():

                        col_field = self.fields[col_name]
                        col_expr = col_field.expression

                        param_name = f"p_{metric}_{col_name}_{combo_index}"

                        if col_value is None:
                            case_conditions.append(f"{col_expr} IS NULL")
                        else:
                            case_conditions.append(f"{col_expr} = :{param_name}")
                            values[param_name] = col_value

                        alias_parts.append(self._safe_alias_part(col_value))

                    alias = SQLValueParser.quote_identifier("_".join(alias_parts))

                    case_sql = (
                        f"SUM(CASE WHEN {' AND '.join(case_conditions)} "
                        f"THEN {metric_expr} ELSE 0 END) AS {alias}"
                    )

                    select_part.append(case_sql)

        else:
            # No pivot columns → simple aggregation
            for metric in pivot_metrics:

                metric_field = self._get_field(metric.get('field_id'))
                if not metric_field:
                    raise ValueError(f"Invalid metric field: {metric}")

                metric_expr = filter_builder.generate_expression(metric_field)
                alias = SQLValueParser.quote_identifier(metric)
                select_part.append(f"{metric_expr} AS {alias}")

        # 4️⃣ FILTERS
        where_part = []
        having_part = []

        filters = (
            query.get("filters", {}).get("where", []) +
            query.get("filters", {}).get("having", [])
        )

        for f in filters:
            built = filter_builder.build(f["node"])
            where_part.extend(built["wheres"])
            having_part.extend(built["havings"])
            values.update(built["values"])

        # 5️⃣ SQL BUILD
        sql_parts = [
            "SELECT",
            "  " + ",\n  ".join(select_part),
            f"FROM {view_name}"
        ]

        if where_part:
            sql_parts.append("WHERE " + " AND ".join(where_part))

        if group_by_part:
            sql_parts.append("GROUP BY " + ", ".join(group_by_part))

        if having_part:
            sql_parts.append("HAVING " + " AND ".join(having_part))

        sql = "\n".join(sql_parts)

        return {"sql": sql.strip(), "values": values}

    def _get_column_combinations(self,query: Dict[str, Any],columns: List[str],max_values: int = 200) -> List[Dict[str, Any]]:
        """ 
            Retourne toutes les combinaisons DISTINCT des colonnes pivot.
            Récupère les valeurs distinctes d'une colonne à pivoter.

            Sécurité :
            - Validation stricte du nom de colonne
            - Quote identifier
            - Limitation du nombre de valeurs
            - Application des filtres WHERE existants
            - Exclusion NULL par défaut

            Performance :
            - ORDER BY
            - LIMIT
        """
        filter_builder = SQLFilterBuilder(self.fields)

        column_exprs = []
        for col in columns:
            field = self._get_field(col.get('field_id'))
            if not field:
                raise ValueError(f"Invalid pivot column: {col}")
            column_exprs.append(field.expression)

        view_name = SQLValueParser.quote_identifier(self.dataset.view_name)

        values = {}
        where_part = []

        filters = (
            query.get("filters", {}).get("where", [])
            #  + query.get("filters", {}).get("having", [])
        )

        for f in filters:
            built = filter_builder.build(f["node"])
            where_part.extend(built["wheres"])
            values.update(built["values"])

        sql_parts = [
            f"SELECT DISTINCT {', '.join(column_exprs)}",
            f"FROM {view_name}"
        ]

        if where_part:
            sql_parts.append("WHERE " + " AND ".join(where_part))

        sql_parts.append("ORDER BY " + ", ".join(column_exprs))
        sql_parts.append(f"LIMIT {int(max_values)}")

        sql = "\n".join(sql_parts)

        try:
            with db.engine.begin() as conn:
                result = conn.execute(text(sql), values).fetchall()
        except Exception as e:
            raise ValueError(f"Error retrieving pivot values: {e}")

        combos = []
        for row in result:
            combo = {}
            for i, col in enumerate(columns):
                combo[col] = row[i]
            combos.append(combo)

        if len(combos) >= max_values:
            raise ValueError(f"Too many pivot combinations. Please filter data. Limit is {max_values}")

        return combos

    def _safe_alias_part(self, value: Any) -> str:
        if value is None:
            return "null"

        s = str(value)
        s = s.replace(" ", "_")
        s = re.sub(r"[^a-zA-Z0-9_]", "", s)

        if len(s) > 30:
            s = s[:30]

        return s

    def _transformField(self, datasetFields:list[DatasetField])->Dict[int, DatasetField]:
        return  {f.id: f for f in datasetFields}


# MATVIEW MANAGER
class MaterializedViewManager:
    """
    Safe Materialized View Manager for PostgreSQL
    SQL injection safe | DROP CASCADE support | Optional auto-refresh via cron
    """
    def __init__(self, query_view_name: str, sql_type: str):
        self.sql_type = sql_type

        if not query_view_name or not isinstance(query_view_name, str):
            raise ValueError(f"query_view_name is require")

        viewname = query_view_name.strip('"')
        if not VALID_SQL_IDENTIFIER.match(viewname):
            raise ValueError(f"Invalid view name: {query_view_name}")
        
        self.brut_viewname = viewname
        self.view_name = SQLValueParser.quote_identifier(viewname)

 
    def rendered_sql(self, sql: str, values: Dict[str, Any]) -> str:
        """
        Compile le SQL avec les valeurs fournies.
        - Pour les scalaires, utilise bindparam normal
        - Pour les listes destinées à IN/ANY, génère ARRAY[...] pour éviter double parenthèses
        """
        try:
            stmt: TextClause = text(sql)

            for key, value in values.items():
                if isinstance(value, list):
                    # Si la liste est vide, PostgreSQL ne peut pas faire ANY(ARRAY[]), donc skip
                    if not value:
                        continue
                    # Transforme en ARRAY[...] directement pour literal_binds=True
                    # Evite la double parenthèse avec expanding=True + literal_binds
                    arr_str = ", ".join(
                        repr(v) if isinstance(v, str) else str(v) for v in value
                    )
                    sql_fragment = f"ARRAY[{arr_str}]"
                    # Remplace la variable par l’ARRAY[...] dans le SQL
                    sql = sql.replace(f":{key}", sql_fragment)
                else:
                    stmt = stmt.bindparams(bindparam(key, value=value))

            compiled_sql = stmt.compile(db.engine, compile_kwargs={"literal_binds": True})
            return str(compiled_sql)

        except Exception as e:
            raise ValueError(str(e))
    
    def generate_matview_sql(self, sql: str, values: Dict[str, Any]) -> str:
        """Create matview safely with optional DROP CASCADE"""
    
        rendered_sql = self.rendered_sql(sql, values)

    
        view_prefix = ""

        if self.sql_type == DatasetSqlType.MATVIEW.value:
            view_prefix = f'CREATE MATERIALIZED VIEW {self.view_name} AS '
        elif self.sql_type == DatasetSqlType.VIEW.value:
            view_prefix = ""
        elif self.sql_type == DatasetSqlType.TABLE.value:
            view_prefix = ""
        elif self.sql_type == DatasetSqlType.FUNCTION.value:
            view_prefix = ""
        elif self.sql_type == DatasetSqlType.INDEX.value:
            view_prefix = ""


        sql = "\n".join(filter(None, [
            view_prefix,
            f'{rendered_sql}'
        ])).strip()

        return sql
    

    def create_matview_safe(self, sql: str, values: Dict[str, Any], replace: bool = True) -> None:
        """Create matview safely with optional DROP CASCADE"""

        if self.sql_type != DatasetSqlType.MATVIEW.value:
            return

        try:
            rendered_sql = self.rendered_sql(sql, values)
            # Build CREATE MATERIALIZED VIEW statement
            with db.engine.begin() as conn:
                # 🔹 Drop with CASCADE if replace
                if replace:
                    conn.execute(text(f'DROP MATERIALIZED VIEW IF EXISTS {self.view_name} CASCADE'))
                # 🔹 Create matview
                conn.execute(text(f'CREATE MATERIALIZED VIEW {self.view_name} AS {rendered_sql}'))

        except Exception as e:
            raise ValueError(str(e))

    def refresh_matview(self, concurrently: bool = True) -> None:
        """Refresh a matview safely, optionally concurrently"""

        if self.sql_type != DatasetSqlType.MATVIEW.value:
            return

        sql = f'REFRESH MATERIALIZED VIEW {"CONCURRENTLY " if concurrently else ""}{self.view_name}'
        with db.engine.begin() as conn:
            conn.execute(text(sql))

    def schedule_refresh(self, cron_expression: str,concurrently: bool = True,job_id: str | None = None):
        """
        Schedule automatic refresh of the matview via APScheduler.
        - cron_expression: standard cron (e.g. '0 * * * *' = every hour)
        """

        if self.sql_type != DatasetSqlType.MATVIEW.value:
            return
        
        job_id = job_id or f"refresh_{self.brut_viewname}"

        def job():
            try:
                self.refresh_matview(concurrently)
                print(f"Materialized view '{self.brut_viewname}' refreshed successfully")
            except Exception as e:
                print(f"Error refreshing matview '{self.brut_viewname}': {e}")

        # Remove existing job if any
        if scheduler.get_job(job_id):
            scheduler.remove_job(job_id)

        # Add new cron job
        scheduler.add_job(
            id=job_id,
            func=job,
            trigger='cron',
            **self._parse_cron(cron_expression)
        )

    def _parse_cron(self, cron_expr: str) -> dict:
        """
        Convert standard cron string (5 fields) into APScheduler kwargs
        Format: 'minute hour day month day_of_week'
        """
        parts = cron_expr.strip().split()
        if len(parts) != 5:
            raise ValueError("Invalid cron expression. Expected 5 fields: 'min hour day month weekday'")
        return dict(minute=parts[0], hour=parts[1], day=parts[2], month=parts[3], day_of_week=parts[4])











# import pandas as pd
# class PivotTransformer:
#     """
#     Transforme les résultats d'une matérialized view ou d'un SQL en pivot selon la configuration des cases:
#     - data_fields: colonnes qui contiennent les mesures (metrics)
#     - row_fields: colonnes qui seront en lignes
#     - column_fields: colonnes qui seront transformées en colonnes (pivot)
    
#     Exemple:
#         pivot = PivotTransformer(df)
#         result = pivot.transform(
#             data_fields=["sum_case_expr", "total_id_between_year_2025_2026"],
#             row_fields=["name", "id"],
#             column_fields=["month"]
#         )
#     """
#     def __init__(self, df: pd.DataFrame):
#         if not isinstance(df, pd.DataFrame):
#             raise ValueError("df must be a pandas DataFrame")
#         self.df = df

#     def transform(self,data_fields: List[str],row_fields: List[str],column_fields: List[str]) -> pd.DataFrame:
#         """
#         Transforme le dataframe en pivot selon les cases.
#         Si column_fields est vide, retourne les lignes groupées par row_fields avec les metrics.
#         """
#         if not data_fields:
#             raise ValueError("At least one data_field (metric) is required")
        
#         if not row_fields:
#             raise ValueError("At least one row_field is required")
        
#         # Si aucune colonne à pivoter, retourne dataframe groupé
#         if not column_fields:
#             grouped = self.df.groupby(row_fields)[data_fields].sum().reset_index()
#             return grouped

#         # Si plusieurs metrics, il faut les "melt" pour pivot
#         df_melted = self.df.melt(
#             id_vars=row_fields + column_fields,
#             value_vars=data_fields,
#             var_name="metric",
#             value_name="value"
#         )

#         # Pivot
#         df_pivot = df_melted.pivot_table(
#             index=row_fields,
#             columns=column_fields + ["metric"],
#             values="value",
#             aggfunc="sum",  # somme par défaut pour metrics
#             fill_value=0
#         )

#         # Optionnel: aplatir le MultiIndex en colonnes simples
#         df_pivot.columns = [
#             "_".join(map(str, col)).strip() if isinstance(col, tuple) else str(col)
#             for col in df_pivot.columns.values
#         ]

#         df_pivot = df_pivot.reset_index()
#         return df_pivot

#     # def exemples(self):
#     #     # 1️⃣ Compiler le SQL
#     #     compiler = SQLCompilerV1(dataset, fields)
#     #     compiled = compiler.compile(query)
#     #     sql = compiled["sql"]
#     #     values = compiled["values"]

#     #     # 2️⃣ Créer la matview
#     #     matview_manager = MaterializedViewManager("kossi_reports_one")
#     #     matview_manager.create_matview_safe(sql, values)

#     #     # 3️⃣ Charger les données pour pivot (via pandas)
#     #     df = pd.read_sql(text(f'SELECT * FROM "kossi_reports_one"'), db.engine)

#     #     # 4️⃣ Transformer en pivot selon la configuration visualisation
#     #     pivot = PivotTransformer(df)
#     #     result_df = pivot.transform(
#     #         data_fields=["sum_case_expr", "total_id_between_year_2025_2026"],
#     #         row_fields=["name", "id"],
#     #         column_fields=["month"]
#     #     )

#     #     print(result_df.head())


# class VisualizationQueryTransformer:
#     """
#     Transforme une materialized view selon la configuration:
#     - rows
#     - columns
#     - filters
#     """

#     def __init__(self, matview_name: str):
#         if not matview_name:
#             raise ValueError("matview_name is required")
#         self.view_name = SQLValueParser.quote_identifier(matview_name)

#     def build_query(self,rows: List[str],columns: List[str],metrics: List[str],filters: List[str] = None) -> str:

#         if not metrics:
#             raise ValueError("At least one metric is required")

#         filters = filters or []

#         select_parts = []
#         group_by_parts = []

#         # 🔹 ROWS (toujours visibles)
#         for r in rows:
#             select_parts.append(SQLValueParser.quote_identifier(r))
#             group_by_parts.append(SQLValueParser.quote_identifier(r))

#         # 🔹 NO PIVOT CASE
#         if not columns:
#             for m in metrics:
#                 select_parts.append(f"SUM({SQLValueParser.quote_identifier(m)}) AS {SQLValueParser.quote_identifier(m)}")

#             sql = f"""
#             SELECT
#                 {", ".join(select_parts)}
#             FROM {self.view_name}
#             {"GROUP BY " + ", ".join(group_by_parts) if group_by_parts else ""}
#             """.strip()

#             return sql

#         # 🔹 PIVOT CASE
#         # On génère dynamiquement les colonnes via CASE WHEN
#         pivot_parts = []

#         for col in columns:
#             distinct_query = f"SELECT DISTINCT {col} FROM {self.view_name}"
#             # ⚠ Idéalement on exécute cette requête pour récupérer les valeurs distinctes
#             # Ici on suppose que tu as une méthode pour ça
#             distinct_values = self._get_distinct_values(col)

#             for value in distinct_values:
#                 for metric in metrics:
#                     alias = f"{metric}_{value}"
#                     pivot_parts.append(
#                         f"""
#                         SUM(
#                             CASE WHEN {col} = '{value}'
#                             THEN {SQLValueParser.quote_identifier(metric)}
#                             ELSE 0 END
#                         ) AS "{alias}"
#                         """.strip()
#                     )

#         select_parts.extend(pivot_parts)

#         sql = f"""
#         SELECT
#             {", ".join(select_parts)}
#         FROM {self.view_name}
#         {"GROUP BY " + ", ".join(group_by_parts) if group_by_parts else ""}
#         """.strip()

#         return sql

#     def _get_distinct_values(self, column: str) -> List[Any]:
#         """
#         Récupère les valeurs distinctes pour la colonne pivot.
#         ⚠ À optimiser avec cache si dataset volumineux.
#         """
#         query = f"SELECT DISTINCT {column} FROM {self.view_name} ORDER BY {column}"
#         result = db.engine.execute(text(query)).fetchall()
#         return [r[0] for r in result]




