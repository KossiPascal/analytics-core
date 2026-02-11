import uuid
from enum import Enum
from dataclasses import dataclass, field
from typing import List, Dict, Any, Literal, Optional, Union

from sqlalchemy import (
    MetaData, Table as SQLATable, and_, or_, not_, select, func, distinct, bindparam, text
)
from analytics_engine.constances import ALLOWED_AGGS, MAX_LIMIT, ROLES, TABLE_REGISTRY, TABLES
from analytics_engine.functions import alias, compile_condition, compile_query, estimate_cost, guard


def uid() -> str:
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
        if column not in self.columns or self.name not in TABLE_REGISTRY:
            raise ValueError(f"Column '{column}' not in table '{self.name}'")
        return f"{self.alias}.{column}"


@dataclass
class JoinRef:
    left: TableRef
    right: TableRef
    on: List[Dict[str, str]]
    type: JoinType = JoinType.LEFT

    def render(self) -> str:
        if not self.on:
            raise ValueError("Join must have at least one condition")
        conditions = []
        for cond in self.on:
            for left_col, right_col in cond.items():
                conditions.append(f"{self.left.col(left_col)} = {self.right.col(right_col)}")
        return f"{self.type.value} JOIN {self.right.name} {self.right.alias} ON " + " AND ".join(conditions)


@dataclass
class ConditionRef:
    operator: str
    left: Optional[Union[ColumnRef, "AggregationRef"]] = None
    right: Optional[Union[ColumnRef, ValueRef]] = None
    conditions: Optional[List["ConditionRef"]] = field(default_factory=list)


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
            expr = expr.filter(compile_condition(self.condition, context))
        return expr.label(self.alias) if self.alias else expr


@dataclass
class QueryDSL:
    source: str
    dimensions: List[ColumnRef]
    metrics: List[MetricRef]
    joins: List[JoinRef] = field(default_factory=list)
    filters: List[FilterRef] = field(default_factory=list)
    pivot: Optional[PivotRef] = None
    timeseries: Optional[TimeSeriesRef] = None
    ctes: Dict[str, "QueryDSL"] = field(default_factory=dict)
    output: Optional[OutputRef] = None


class AliasManager:
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


class CompilationContext:
    def __init__(self, schema_registry: SchemaRegistry, alias_manager: AliasManager = None):
        self.schema_registry = schema_registry
        self.alias_manager = alias_manager or AliasManager()
        self.bind_counter = 0

    def next_bind(self) -> str:
        self.bind_counter += 1
        return f"param_{self.bind_counter}"


class QueryEngine:
    def __init__(self, engine):
        self.engine = engine
        self.registry = SchemaRegistry(engine)

    def execute(self, payload: dict):
        dsl = QueryDSL(**payload)
        context = CompilationContext(self.registry)
        stmt = compile_query(dsl, context)
        with self.engine.connect() as conn:
            result = conn.execute(stmt)
            return [dict(row._mapping) for row in result]


class ExecutionEngine:
    def __init__(self, engine):
        self.engine = engine

    def execute(self, stmt, timeout=5000):
        with self.engine.connect() as conn:
            conn.execute(text(f"SET statement_timeout = {timeout}"))
            return [dict(row._mapping) for row in conn.execute(stmt).fetchall()]
