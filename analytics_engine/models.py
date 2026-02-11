
import uuid
from enum import Enum
from dataclasses import dataclass, field
from typing import List, Dict, Any, Literal, Optional, Union
from copy import deepcopy
from sqlalchemy import MetaData, Table as SQLATable, and_, bindparam, distinct, func, not_, or_, select, text
from analytics_engine.constances import ALLOWED_AGGS, MAX_LIMIT, ROLES, TABLE_REGISTRY, TABLES
from analytics_engine.functions import alias, estimate_cost, guard
from sqlalchemy.orm import aliased
from sqlalchemy.sql import Select

def uid() -> str:
    """Generate a short unique identifier."""
    return uuid.uuid4().hex[:6]

class LogicType(str, Enum):
    AND = "AND"
    OR = "OR"
    NOT = "NOT"

class JoinType(str, Enum):
    INNER = "INNER"
    LEFT = "LEFT"
    RIGHT = "RIGHT"
    FULL = "FULL"

class DataType(str, Enum):
    INTEGER = "INTEGER"
    FLOAT = "FLOAT"
    STRING = "STRING"
    BOOLEAN = "BOOLEAN"
    DATE = "DATE"
    DATETIME = "DATETIME"
    NUMERIC = "NUMERIC"

class SchemaRegistry:
    """Maintains table and column references for SQLAlchemy compilation."""

    def __init__(self, engine):
        self.metadata = MetaData()
        self.metadata.reflect(bind=engine)
        self.tables: Dict[str, SQLATable] = self.metadata.tables

    def get_table(self, name: str) -> SQLATable:
        if name not in self.tables:
            raise ValueError(f"Table {name} not allowed")
        return self.tables[name]

    def get_column(self, table_name: str, column_name: str):
        table = self.get_table(table_name)
        if column_name not in table.c:
            raise ValueError(f"Column {column_name} not found in {table_name}")
        return table.c[column_name]

class ASTNode:
    """Base class for AST nodes."""
    def validate(self, schema_registry: SchemaRegistry):
        raise NotImplementedError()

    def to_sqlalchemy(self, context):
        raise NotImplementedError()


@dataclass
class ColumnRef:
    table: str
    name: str
    alias: Optional[str] = None

@dataclass
class ValueRef:
    type: Literal["value"] = "value"
    value: Union[str, int, float, bool]

@dataclass
class MetricRef:
    agg: str
    column: ColumnRef
    alias: str
    condition: Optional[str] = None
    window: Optional[str] = None

@dataclass
class FilterRef:
    column: ColumnRef
    op: str
    value: Any

@dataclass
class TimeSeriesRef:
    column: ColumnRef
    grain: str  # day | week | month | epi_week

@dataclass
class PivotRef:
    column: ColumnRef
    values: List[Any]

@dataclass
class OutputRef:
    mode: str  # select | view | materialized_view
    name: Optional[str] = None

@dataclass
class TableRef:
    name: str
    columns: List[str]
    alias: str = field(default_factory=lambda: f"t_{uid()}")

    def col(self, column: str) -> str:
        """Return fully qualified column with alias."""
        if column not in self.columns or self.name not in TABLE_REGISTRY:
            raise ValueError(f"Column '{column}' not in table '{self.name}'")
        return f"{self.alias}.{column}"

@dataclass
class JoinRef:
    left: TableRef
    right: TableRef
    on: List["ConditionRef"] # List[Dict[str, str]]  # List of {"left_col": "right_col"} mappings
    type: JoinType = JoinType.LEFT

    def render(self) -> str:
        """Render JOIN SQL."""
        if not self.on:
            raise ValueError("Join must have at least one condition in 'on'")
        # conditions = [f"{self.left.col(l)} = {self.right.col(r)}" for cond in self.on for l, r in cond.items()]
        conditions = []
        for cond in self.on:
            for left_col, right_col in cond.items():
                conditions.append(f"{self.left.col(left_col)} = {self.right.col(right_col)}")
        return f"{self.type.value} JOIN {self.right.name} {self.right.alias} ON " + " AND ".join(conditions)

@dataclass
class ConditionRef:
    """ Represents a node in a condition tree for SQL WHERE/HAVING clauses. Supports nested AND / OR / NOT logic. """

    def __init__(self, logic: LogicType, conditions: List[Union[str, "ConditionRef"]] = field(default_factory=list), left: Optional[Union[ColumnRef, "AggregationRef"]] = None, right: Optional[Union[ColumnRef, ValueRef]] = None):
        if logic == LogicType.NOT and len(conditions) != 1:
            raise ValueError("NOT condition must have exactly one child")
        self.logic = logic
        self.left = left
        self.right = right
        self.conditions = conditions

    def render(self):
        """ Render the condition tree as a SQL string. """
        if self.logic == LogicType.NOT:
            child = self.conditions[0]
            return f"NOT ({child.render() if isinstance(child, ConditionRef) else child})"
        joiner = f" {self.logic.value} "
        return "(" + joiner.join(c.render() if isinstance(c, ConditionRef) else c for c in self.conditions) + ")"
    
    @staticmethod
    def resolve_operand(operand: Union[ColumnRef, "AggregationRef", ValueRef],ctx: "CompilationEngine",):

        if isinstance(operand, ValueRef):
            name = ctx.next_bind()
            return bindparam(name, operand.value)

        if isinstance(operand, ColumnRef):
            return ctx.registry.get_column(operand.table, operand.name)

        if isinstance(operand, AggregationRef):
            col = ctx.registry.get_column(operand.column.table,operand.column.name)
            if operand.distinct:
                col = distinct(col)
            expr = getattr(func, operand.function.lower())(col)
            if operand.condition:
                expr = expr.filter(ConditionRef.compile_condition(operand.condition, ctx))
            return expr

        raise ValueError("Invalid operand")

    @staticmethod
    def compile_condition(cond: "ConditionRef", ctx: "CompilationEngine"):
        if cond:
            if cond.logic in (LogicType.AND, LogicType.OR):
                compiled = [ConditionRef.compile_condition(c, ctx) for c in cond.conditions]

                if cond.logic == LogicType.AND:
                    return and_(*compiled)

                if cond.logic == LogicType.OR:
                    return or_(*compiled)
            
            if cond.logic == LogicType.NOT:
                return not_(ConditionRef.compile_condition(cond.conditions[0], ctx))

            left = ConditionRef.resolve_operand(cond.left, ctx)
            right = ConditionRef.resolve_operand(cond.right, ctx)

            op = cond.logic.lower()

            if op == "eq": return left == right
            if op == "neq": return left != right
            if op == "gt": return left > right
            if op == "gte": return left >= right
            if op == "lt": return left < right
            if op == "lte": return left <= right
            if op == "in": return left.in_(right)
            if op == "not_in": return ~left.in_(right)
            if op == "like": return left.like(right)
            if op == "ilike": return left.ilike(right)

            raise ValueError(f"Unsupported operator '{op}'")
        return None

@dataclass
class AggregationRef:
    type: Literal["aggregation"] = "aggregation"
    function: Literal["SUM", "COUNT", "AVG", "MIN", "MAX"]
    column: ColumnRef
    distinct: bool = False
    condition: Optional[ConditionRef] = None
    alias: Optional[str] = None

    def to_sqlalchemy(self, context):
        col = context.schema_registry.get_column(self.column.table, self.column.name)
        if self.distinct:
            col = distinct(col)
        expr = getattr(func, self.function.lower())(col)
        if self.condition:
            expr = expr.filter(ConditionRef.compile_condition(self.condition, context))
        return expr.label(self.alias) if self.alias else expr

@dataclass
class QueryDSL:
    version: Literal["1.0"] = "1.0"
    distinct: bool = False

    from_table: str

    # Select items: dimensions (columns), metrics (aggregations), or generic select
    select: List[Union["ColumnRef", "AggregationRef"]] = field(default_factory=list)
    dimensions: List["ColumnRef"] = field(default_factory=list)
    metrics: List["MetricRef"] = field(default_factory=list)

    joins: List["JoinRef"] = field(default_factory=list)

    # Filters / conditions
    where: Optional["ConditionRef"] = None
    having: Optional["ConditionRef"] = None
    filters: List["FilterRef"] = field(default_factory=list)

    group_by: List["ColumnRef"] = field(default_factory=list)
    order_by: List["ColumnRef"] = field(default_factory=list)

    # Pivot / timeseries
    pivot: Optional["PivotRef"] = None
    timeseries: Optional["TimeSeriesRef"] = None

    # Common Table Expressions (CTEs)
    ctes: Dict[str, "QueryDSL"] = field(default_factory=dict)

    # Output options
    output: Optional["OutputRef"] = None

    # Pagination
    limit: Optional[int] = 100
    offset: Optional[int] = 0

class AliasManager:
    """Generates unique table and column aliases for SQL queries."""

    def __init__(self):
        self.table_aliases: Dict[str, str] = {}
        self.used_aliases: set = set()

    def get_table_alias(self, table_name: str) -> str:
        if table_name not in self.table_aliases:
            self.table_aliases[table_name] = f"{table_name[:1]}{len(self.table_aliases)+1}"
        return self.table_aliases[table_name]

    def register_column_alias(self, alias: str):
        if alias in self.used_aliases:
            raise ValueError(f"Column alias '{alias}' already used")
        self.used_aliases.add(alias)
   
class CompilationEngine:
    """
    Enterprise-grade SQL DSL compiler.
    Handles: - RBAC - Table aliasing - Column validation - Bind parameters - Query compilation
    """

    def __init__(self,dsl: "QueryDSL",role: str,schema_registry,alias_manager,):
        self.dsl = dsl
        self.role = role
        self.registry = schema_registry
        self.alias_manager = alias_manager
        self.bind_counter = 0
        self.aliases: Dict[str, str] = {}

    # Bind parameters
    def next_bind(self) -> str:
        self.bind_counter += 1
        return f"param_{self.bind_counter}"

    # RBAC + Alias
    def check_access(self, table: str):
        guard(
            table in ROLES.get(self.role, {}) or "*" in ROLES.get(self.role, {}),
            f"Role '{self.role}' cannot access table '{table}'",
        )

    def table_alias(self, table: str) -> str:
        self.check_access(table)

        if table not in self.aliases:
            self.aliases[table] = self.alias_manager.get_table_alias(table)

        return self.aliases[table]

    def resolve_column(self, col: ColumnRef) -> str:
        guard(col.table in TABLES, f"Unknown table '{col.table}'")
        guard(
            col.name in TABLES[col.table]["columns"],
            f"Unknown column '{col.table}.{col.name}'",
        )
        return f"{self.table_alias(col.table)}.{col.name}"

    # Time Series
    def compile_timeseries(self, ts: TimeSeriesRef) -> str:
        col = self.resolve_column(ts.column)

        mapping = {
            "day": f"DATE({col})",
            "week": f"DATE_TRUNC('week', {col})",
            "month": f"DATE_TRUNC('month', {col})",
            "quarter": f"DATE_TRUNC('quarter', {col})",
            "epi_week": f"EXTRACT(WEEK FROM {col})",
        }

        if ts.grain not in mapping:
            raise ValueError(f"Invalid timeseries grain '{ts.grain}'")

        return mapping[ts.grain]

    # SELECT builder
    def build_select(self) -> tuple[List[str], List[str]]:
        select_parts: List[str] = []
        group_parts: List[str] = []

        # Dimensions
        for dim in self.dsl.dimensions:
            col_expr = self.resolve_column(dim)
            alias = dim.alias or dim.name
            select_parts.append(f"{col_expr} AS {alias}")
            group_parts.append(col_expr)

        # Timeseries
        if self.dsl.timeseries:
            ts_expr = self.compile_timeseries(self.dsl.timeseries)
            select_parts.append(f"{ts_expr} AS period")
            group_parts.append(ts_expr)

        # Metrics
        if not self.dsl.pivot:
            for metric in self.dsl.metrics:
                guard(metric.agg.upper() in ALLOWED_AGGS,f"Invalid aggregation '{metric.agg}'")

                base_col = self.resolve_column(metric.column)
                expr = f"{metric.agg.upper()}({base_col})"

                if metric.condition:
                    expr += f" FILTER (WHERE {metric.condition})"

                if metric.window:
                    expr += f" OVER ({metric.window})"

                select_parts.append(f"{expr} AS {metric.alias}")

        # Pivot
        if self.dsl.pivot:
            pivot_col = self.resolve_column(self.dsl.pivot.column)
            base_metric = self.dsl.metrics[0]

            guard(base_metric.agg.upper() in ALLOWED_AGGS,f"Invalid aggregation '{base_metric.agg}'")

            for value in self.dsl.pivot.values:
                base_expr = f"{base_metric.agg.upper()}({self.resolve_column(base_metric.column)})"
                filter_expr = f"{pivot_col} = {repr(value)}"

                if base_metric.condition:
                    filter_expr += f" AND {base_metric.condition}"

                expr = f"{base_expr} FILTER (WHERE {filter_expr}) AS {value}"
                select_parts.append(expr)

        return select_parts, group_parts

    # MAIN COMPILER
    def compile(self) -> str:
        estimate_cost(self.dsl)

        guard(self.dsl.limit is None or self.dsl.limit <= MAX_LIMIT,f"Limit exceeds maximum allowed ({MAX_LIMIT})")

        select_parts, group_parts = self.build_select()

        base_alias = self.table_alias(self.dsl.from_table)
        sql = f"SELECT "

        if self.dsl.distinct:
            sql += "DISTINCT "

        sql += f"{', '.join(select_parts)} "
        sql += f"FROM {self.dsl.from_table} {base_alias}"

        # Joins
        for join in self.dsl.joins:
            right_alias = self.table_alias(join.right.name)
            conditions = [f"{self.resolve_column(join.left)} = {self.resolve_column(join.right)}"]

            sql += f" {join.type.value} JOIN {join.right.name} {right_alias}"
            sql += f" ON {' AND '.join(conditions)}"

        # Filters
        if self.dsl.filters:
            where_clauses = [f"{self.resolve_column(f.column)} {f.op} {repr(f.value)}" for f in self.dsl.filters]
            sql += " WHERE " + " AND ".join(where_clauses)

        # Group By
        if group_parts:
            sql += " GROUP BY " + ", ".join(group_parts)

        # Having
        if self.dsl.having:
            sql += f" HAVING {self.dsl.having}"

        # Order By
        if self.dsl.order_by:
            order_parts = [self.resolve_column(c) for c in self.dsl.order_by]
            sql += " ORDER BY " + ", ".join(order_parts)

        # Pagination
        if self.dsl.limit:
            sql += f" LIMIT {self.dsl.limit}"
        if self.dsl.offset:
            sql += f" OFFSET {self.dsl.offset}"

        # Output modes
        if self.dsl.output:
            if self.dsl.output.mode == "view":
                return f"CREATE OR REPLACE VIEW {self.dsl.output.name} AS {sql};"

            if self.dsl.output.mode == "materialized_view":
                return (f"CREATE MATERIALIZED VIEW IF NOT EXISTS {self.dsl.output.name} AS {sql} WITH DATA;")

        return sql

    @staticmethod
    def compile_query(dsl: "QueryDSL",registry: "SchemaRegistry",alias_manager: "AliasManager",role: str):
        context = CompilationEngine(dsl=dsl,role=role,schema_registry=registry,alias_manager=alias_manager)
        base_table = registry.get_table(dsl.from_table)
        entities = [CompilationEngine.compile_select_item(i, context) for i in dsl.select]
        stmt = select(*entities).select_from(base_table)

        if dsl.where:
            stmt = stmt.where(ConditionRef.compile_condition(dsl.where, context))

        if dsl.limit:
            stmt = stmt.limit(dsl.limit)

        if dsl.offset:
            stmt = stmt.offset(dsl.offset)

        return stmt

    
    @staticmethod
    def compile_select_item(item: Union[ColumnRef, AggregationRef], context: "CompilationEngine"):
        if isinstance(item, ColumnRef):
            col = context.registry.get_column(item.table,item.name)
            return col.label(item.alias) if item.alias else col

        elif isinstance(item, AggregationRef):
            col = context.registry.get_column(item.column.table,item.column.name)

            if item.distinct:
                col = distinct(col)

            agg_func = getattr(func, item.function.lower())
            expr = agg_func(col)

            if item.condition:
                expr = expr.filter(ConditionRef.compile_condition(item.condition, context))

            return expr.label(item.alias) if item.alias else expr

        else:
            raise ValueError("Unknown SelectItem type")

    # Static helper
    @staticmethod
    def generate_sql(payload: Dict[str, Any],role: str,schema_registry,alias_manager,) -> str:
        dsl = QueryDSL(**payload)
        engine = CompilationEngine(dsl,role,schema_registry,alias_manager,)
        return engine.compile()

class QueryEngine:
    """Executes a QueryDSL payload against a SQLAlchemy engine."""

    def __init__(self, engine):
        self.engine = engine
        self.registry = SchemaRegistry(engine)

    def execute(self, payload: dict):
        dsl = QueryDSL(**payload)
        alias_manager = AliasManager()

        stmt = CompilationEngine.compile_query(dsl=dsl,registry=self.registry,alias_manager=alias_manager,role="analyst")

        with self.engine.connect() as conn:
            result = conn.execute(stmt)
            return [dict(row._mapping) for row in result]

class ExecutionEngine:
    def __init__(self, engine):
        self.engine = engine

    def execute(self, stmt, timeout=5000):
        with self.engine.connect() as conn:
            conn.execute(text(f"SET statement_timeout = {timeout}"))
            # return conn.execute(stmt).fetchall()
            return [dict(row._mapping) for row in conn.execute(stmt).fetchall()]

class SQLCompiler:

    def __init__(self, registry: SchemaRegistry):
        self.registry = registry

    def compile(self, dsl: QueryDSL):

        if dsl.limit > MAX_LIMIT:
            raise ValueError("Limit too high")

        base = self.registry.get_table(dsl.from_table)
        ctx = CompilationEngine(dsl=dsl,role="analyst",schema_registry=self.registry,alias_manager=AliasManager())

        stmt:Select[Any] = select()

        columns = []

        for item in dsl.select:

            if isinstance(item, ColumnRef):
                col = self.registry.get_column(item.table,item.name,)
                if item.alias:
                    col = col.label(item.alias)
                columns.append(col)

            elif isinstance(item, AggregationRef):
                col = self.registry.get_column(item.column.table,item.column.name,)
                if item.distinct:
                    col = distinct(col)
                expr = getattr(func,item.function.lower(),)(col)
                if item.alias:
                    expr = expr.label(item.alias)
                columns.append(expr)

        stmt = stmt.with_only_columns(columns).select_from(base)

        for join in dsl.joins:
            right = self.registry.get_table(join.right.name)
            stmt = stmt.join(right, ConditionRef.compile_condition(join.on, ctx), isouter=(join.type != "INNER"),)

        if dsl.where:
            stmt = stmt.where( ConditionRef.compile_condition(dsl.where, ctx))

        if dsl.group_by:
            group_cols = [self.registry.get_column(c.table, c.name) for c in dsl.group_by]
            stmt = stmt.group_by(*group_cols)

        if dsl.having:
            stmt = stmt.having( ConditionRef.compile_condition(dsl.having, ctx))

        if dsl.order_by:
            order_cols = [self.registry.get_column(c.table, c.name) for c in dsl.order_by]
            stmt = stmt.order_by(*order_cols)

        stmt = stmt.limit(dsl.limit).offset(dsl.offset)

        if dsl.distinct:
            stmt = stmt.distinct()

        return stmt

class EnterpriseSQLAlchemyEngine:

    def __init__(self, dsl: QueryDSL, role: str, schema_registry: SchemaRegistry):
        self.dsl = dsl
        self.role = role
        self.registry = schema_registry
        self.aliases: Dict[str, Any] = {}

    # RBAC
    def check_access(self, table: str):
        rules = ROLES.get(self.role, {})
        if "*" not in rules and table not in rules:
            raise PermissionError(f"Role '{self.role}' cannot access table '{table}'")

    # Table alias resolution
    def resolve_table(self, table_name: str):
        self.check_access(table_name)
        if table_name not in self.aliases:
            table = self.registry.get_table(table_name)
            self.aliases[table_name] = aliased(table)

        return self.aliases[table_name]

    # Column resolution
    def resolve_column(self, ref: ColumnRef):
        table = self.resolve_table(ref.table)
        if ref.name not in table.c:
            raise ValueError(f"Column '{ref.name}' not found in '{ref.table}'")

        return table.c[ref.name]

    # Aggregation
    def resolve_aggregation(self, agg: AggregationRef):
        if agg.function.upper() not in ALLOWED_AGGS:
            raise ValueError(f"Aggregation '{agg.function}' not allowed")

        col = self.resolve_column(agg.column)
        if agg.distinct:
            col = distinct(col)

        expr = getattr(func, agg.function.lower())(col)
        if agg.condition:
            expr = expr.filter(self.compile_condition(agg.condition))

        if agg.alias:
            expr = expr.label(agg.alias)

        return expr

    # Condition compiler (AST → SQLAlchemy)
    def compile_condition(self, condition: ConditionRef):

        if condition.conditions:
            compiled = [
                self.compile_condition(c)
                for c in condition.conditions
            ]

            if condition.logic == LogicType.AND:
                return and_(*compiled)

            if condition.logic == LogicType.OR:
                return or_(*compiled)

            if condition.logic == LogicType.NOT:
                return not_(compiled[0])

        left = self.resolve_operand(condition.left)
        right = self.resolve_operand(condition.right)

        op = condition.logic.lower()

        operators = {
            "eq": left == right,
            "neq": left != right,
            "gt": left > right,
            "gte": left >= right,
            "lt": left < right,
            "lte": left <= right,
            "in": left.in_(right),
            "not_in": ~left.in_(right),
            "like": left.like(right),
            "ilike": left.ilike(right),
        }

        if op not in operators:
            raise ValueError(f"Unsupported operator '{op}'")

        return operators[op]

    def resolve_operand(self, operand):

        if isinstance(operand, ColumnRef):
            return self.resolve_column(operand)

        if isinstance(operand, AggregationRef):
            return self.resolve_aggregation(operand)

        if hasattr(operand, "value"):
            return operand.value

        raise ValueError("Invalid operand")

    # SELECT builder
    def build_select(self) -> List:

        columns = []

        for item in self.dsl.select:
            if isinstance(item, ColumnRef):
                col = self.resolve_column(item)
                if item.alias:
                    col = col.label(item.alias)
                columns.append(col)

            elif isinstance(item, AggregationRef):
                columns.append(self.resolve_aggregation(item))

        return columns


    # MAIN COMPILATION
    def compile(self) -> Select:

        if self.dsl.limit and self.dsl.limit > MAX_LIMIT:
            raise ValueError("Limit too high")

        base_table = self.resolve_table(self.dsl.from_table)
        stmt = select(*self.build_select()).select_from(base_table)

        # JOINS
        for join in self.dsl.joins:
            right_table = self.resolve_table(join.right.name)
            on_clause = self.compile_condition(join.on)
            stmt = stmt.join(right_table,on_clause,isouter=(join.type != "INNER"))

        # WHERE
        if self.dsl.where:
            stmt = stmt.where(self.compile_condition(self.dsl.where))

        # GROUP BY
        if self.dsl.group_by:
            group_cols = [self.resolve_column(c)for c in self.dsl.group_by]
            stmt = stmt.group_by(*group_cols)

        # HAVING
        if self.dsl.having:
            stmt = stmt.having(self.compile_condition(self.dsl.having))

        # ORDER BY
        if self.dsl.order_by:
            order_cols = [self.resolve_column(c)for c in self.dsl.order_by]
            stmt = stmt.order_by(*order_cols)

        # DISTINCT
        if self.dsl.distinct:
            stmt = stmt.distinct()

        # LIMIT / OFFSET
        if self.dsl.limit:
            stmt = stmt.limit(self.dsl.limit)

        if self.dsl.offset:
            stmt = stmt.offset(self.dsl.offset)

        return stmt

    # EXECUTION
    def execute(self, engine):

        stmt = self.compile()

        with engine.connect() as conn:
            result = conn.execute(stmt)
            return [dict(row._mapping) for row in result]

class VersionedIndicatorsEngine:
    def __init__(self, schema_registry:SchemaRegistry, role: str = "analyst"):
        self.registry = schema_registry
        self.role = role
        self.indicators: Dict[str, Dict[str, Any]] = {}
        self.compiler = None
        self.ast_builder = ASTBuilder(schema_registry)
        self.planner = QueryPlanner()
        self.cost_guard = CostGuard()
        self.lineage = LineageTracker()
        self.store: Dict[str, Dict[str, Any]] = {}

    def build_dsl(self, payload: Dict[str, Any]) -> QueryDSL:
        try:
            if "select" in payload and "from_table" in payload:
                return QueryDSL(**payload)
            return QueryDSL(**payload)
        except Exception as e:
            raise ValueError(f"Invalid DSL payload: {e}")

    def compile_sql(self, dsl: Any) -> Any:
        ast = self.ast_builder.build(dsl)
        planned_ast = self.planner.optimize(ast)
        ctx = CompilationEngine(dsl=planned_ast,role=self.role,schema_registry=self.registry,alias_manager=AliasManager())

        stmt = SQLCompiler(self.registry).compile(planned_ast)
        self.cost_guard.check(stmt)
        self.lineage.record(dsl, stmt)
        return stmt

    def register_indicator(self, name: str, payload: Dict[str, Any], version: Optional[int] = None) -> str:
        dsl = self.build_dsl(payload)
        stmt = self.compile_sql(dsl)
        version = version or self.indicators.get(name, {}).get("version", 0) + 1
        sql_text = str(stmt)
        self.indicators[name] = {"sql": sql_text, "version": version}
        return sql_text

    def get_indicator_sql(self, name: str) -> Optional[str]:
        return self.indicators.get(name, {}).get("sql")

    def get_indicator_version(self, name: str) -> Optional[int]:
        return self.indicators.get(name, {}).get("version")

    def delete_indicator(self, name: str):
        if name in self.indicators:
            del self.indicators[name]

    def list_indicators(self) -> List[str]:
        return list(self.indicators.keys())

    def create_materialized_view(self, name: str, sql_text: str) -> str:
        return f"CREATE MATERIALIZED VIEW IF NOT EXISTS {name} AS {sql_text} WITH DATA;"

    def register_mv(self, name: str, payload: Dict[str, Any], version: Optional[int] = None) -> str:
        sql_text = self.register_indicator(name, payload, version)
        mv_sql = self.create_materialized_view(f"mv_{name}", sql_text)
        self.indicators[f"mv_{name}"] = {
            "sql": mv_sql,
            "version": version or self.indicators[name]["version"]
        }
        return mv_sql

    def refresh_mv(self, name: str) -> Optional[str]:
        mv_name = f"mv_{name}"
        if mv_name in self.indicators:
            return f"REFRESH MATERIALIZED VIEW {mv_name};"
        return None

    def update_indicator(self, name: str, payload: Dict[str, Any], version: Optional[int] = None) -> str:
        if name not in self.indicators:
            raise ValueError(f"Indicator '{name}' not registered")
        return self.register_indicator(name, payload, version)

    def update_mv(self, name: str, payload: Dict[str, Any], version: Optional[int] = None) -> str:
        mv_name = f"mv_{name}"
        if mv_name not in self.indicators:
            raise ValueError(f"Materialized view '{mv_name}' not registered")
        return self.register_mv(name, payload, version)

    def list_materialized_views(self) -> List[str]:
        return [name for name in self.indicators if name.startswith("mv_")]

    def list_all_with_versions(self) -> Dict[str, int]:
        return {name: info["version"] for name, info in self.indicators.items()}

    def get_mv_sql(self, name: str) -> Optional[str]:
        return self.indicators.get(f"mv_{name}", {}).get("sql")

    def get_mv_version(self, name: str) -> Optional[int]:
        return self.indicators.get(f"mv_{name}", {}).get("version")

    def delete_mv(self, name: str):
        mv_name = f"mv_{name}"
        if mv_name in self.indicators:
            del self.indicators[mv_name]

    def refresh_indicator_or_mv(self, name: str) -> Optional[str]:
        if name.startswith("mv_"):
            return self.refresh_mv(name[3:])
        if name in self.indicators:
            return self.get_indicator_sql(name)
        return None


    def compile(self, payload: Dict[str, Any]):
        dsl = QueryDSL(**payload)
        engine = EnterpriseSQLAlchemyEngine(dsl=dsl,role=self.role,registry=self.registry)
        return engine.compile()

    def register(self, name: str, payload: Dict[str, Any]):
        stmt = self.compile(payload)
        version = self.store.get(name, {}).get("version", 0) + 1
        self.store[name] = { "sql": str(stmt), "version": version }
        return str(stmt)

    def get(self, name: str):
        return self.store.get(name)

    def delete(self, name: str):
        if name in self.store:
            del self.store[name]

    def list(self):
        return list(self.store.keys())






# Placeholder classes for AST building, query planning, cost guarding, and lineage tracking. 
# These would be expanded in a full implementation.
class ASTBuilder:
    def __init__(self, schema_registry):
        self.registry = schema_registry

    def build(self, dsl):
        """
        Convertit le DSL en AST (Abstract Syntax Tree).
        """
        # Placeholder: retourne directement le DSL pour simplifier
        return dsl

class QueryPlanner:
    def optimize(self, ast):
        """
        Optimise le plan de requête logique.
        """
        # Placeholder: retourne l'AST inchangé pour l'instant
        return ast

class CostGuard:
    def check(self, stmt):
        """
        Vérifie le coût estimé de la requête avant exécution.
        """
        # Placeholder: pourrait vérifier LIMIT, JOIN volumineux, etc.
        pass

class LineageTracker:
    def track(self, stmt):
        """
        Suit la lignée des données pour les audits et la conformité.
        """
        # Placeholder: pourrait enregistrer les tables/colonnes utilisées
        pass

    def record(self, dsl, result):
        """
        Enregistre la traçabilité des données pour audit / BI.
        """
        # Placeholder: pourrait logger tables, colonnes utilisées, utilisateur
        pass


