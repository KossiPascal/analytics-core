# ===============================
# Imports standards et SQLAlchemy
# ===============================
from typing import Any, Dict, List, Optional, Union
from dataclasses import dataclass, field
from enum import Enum
from pydantic import BaseModel, Field
import hashlib, json

from sqlalchemy import (
    Table as SQLATable, MetaData, select, func, distinct,
    and_, or_, not_, bindparam, text
)


# ===============================
# ENUMS & TYPES
# ===============================
class DataType(str, Enum):
    INTEGER = "INTEGER"
    FLOAT = "FLOAT"
    STRING = "STRING"
    BOOLEAN = "BOOLEAN"
    DATE = "DATE"
    DATETIME = "DATETIME"
    NUMERIC = "NUMERIC"


class LogicType(str, Enum):
    AND = "AND"
    OR = "OR"
    NOT = "NOT"


class JoinType(str, Enum):
    INNER = "INNER"
    LEFT = "LEFT"
    RIGHT = "RIGHT"


# ===============================
# DSL MODELS (Pydantic)
# ===============================
class ColumnRef(BaseModel):
    table: str
    column: str
    alias: Optional[str] = None


class ValueRef(BaseModel):
    type: Literal["value"]
    value: Union[str, int, float, bool]


class AggregationRef(BaseModel):
    type: Literal["aggregation"]
    function: Literal["SUM", "COUNT", "AVG", "MIN", "MAX"]
    distinct: bool = False
    field: ColumnRef
    alias: Optional[str] = None


SelectItem = Union[ColumnRef, AggregationRef]


class Condition(BaseModel):
    operator: str
    left: Optional[Union[ColumnRef, AggregationRef]]
    right: Optional[Union[ColumnRef, ValueRef]]
    conditions: Optional[List["Condition"]] = None


Condition.model_rebuild()


class Join(BaseModel):
    type: Literal["INNER", "LEFT", "RIGHT"]
    table: str
    alias: str
    on: Condition


class QueryDSL(BaseModel):
    version: Literal["1.0"]
    distinct: bool = False
    select: List[SelectItem]
    from_table: str
    joins: Optional[List[Join]] = []
    where: Optional[Condition] = None
    group_by: Optional[List[ColumnRef]] = []
    having: Optional[Condition] = None
    order_by: Optional[List[ColumnRef]] = []
    limit: Optional[int] = 100
    offset: Optional[int] = 0


# ===============================
# SCHEMA & ALIAS MANAGEMENT
# ===============================
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


# ===============================
# AST NODES
# ===============================
class ASTNode:
    """Base class for AST nodes."""
    def validate(self, schema_registry: SchemaRegistry):
        raise NotImplementedError()

    def to_sqlalchemy(self, context):
        raise NotImplementedError()


@dataclass
class ColumnNode(ASTNode):
    column: Any

    def to_sqlalchemy(self, context):
        return self.column


@dataclass
class AggregationNode(ASTNode):
    function: str
    column: Any
    distinct_flag: bool = False

    def to_sqlalchemy(self, context):
        col = self.column
        if self.distinct_flag:
            col = distinct(col)
        return getattr(func, self.function.lower())(col)


@dataclass
class ConditionNode(ASTNode):
    logic: LogicType
    conditions: List[Union[str, "ConditionNode"]]

    def render(self):
        if self.logic == LogicType.NOT:
            return f"NOT ({self.conditions[0].render()})"
        joiner = f" {self.logic.value} "
        return "(" + joiner.join(c.render() if isinstance(c, ConditionNode) else c for c in self.conditions) + ")"


# ===============================
# COMPILATION CONTEXT
# ===============================
class CompilationContext:
    """Holds SchemaRegistry and AliasManager for query compilation."""

    def __init__(self, schema_registry: SchemaRegistry, alias_manager: AliasManager):
        self.schema_registry = schema_registry
        self.alias_manager = alias_manager
        self.bind_counter = 0

    def next_bind(self) -> str:
        self.bind_counter += 1
        return f"param_{self.bind_counter}"


# ===============================
# SQL COMPILATION
# ===============================
def resolve_operand(operand, context: CompilationContext):
    if hasattr(operand, "value"):
        name = context.next_bind()
        return bindparam(name, operand.value)
    return context.schema_registry.get_column(operand.table, operand.column)


def compile_condition(condition: Condition, context: CompilationContext):
    if condition.conditions:
        compiled = [compile_condition(c, context) for c in condition.conditions]
        if condition.operator == "AND":
            return and_(*compiled)
        if condition.operator == "OR":
            return or_(*compiled)
        if condition.operator == "NOT":
            return not_(compile_condition(condition.conditions[0], context))
    left = resolve_operand(condition.left, context)
    right = resolve_operand(condition.right, context)
    return getattr(left, condition.operator)(right)


def compile_query(dsl: QueryDSL, context: CompilationContext):
    base_table = context.schema_registry.get_table(dsl.from_table)
    stmt = select()
    select_columns = [
        context.schema_registry.get_column(item.table, item.column)
        for item in dsl.select
    ]
    stmt = stmt.with_only_columns(select_columns).select_from(base_table)
    if dsl.where:
        stmt = stmt.where(compile_condition(dsl.where, context))
    if dsl.limit:
        stmt = stmt.limit(dsl.limit)
    if dsl.offset:
        stmt = stmt.offset(dsl.offset)
    return stmt


# ===============================
# QUERY ENGINE
# ===============================
class QueryEngine:
    """Executes a QueryDSL payload against a SQLAlchemy engine."""

    def __init__(self, engine):
        self.engine = engine
        self.registry = SchemaRegistry(engine)

    def execute(self, payload: dict):
        dsl = QueryDSL(**payload)
        alias_manager = AliasManager()
        context = CompilationContext(self.registry, alias_manager)
        stmt = compile_query(dsl, context)
        with self.engine.connect() as conn:
            result = conn.execute(stmt)
            return [dict(row._mapping) for row in result]


# ===============================
# EXECUTION ENGINE
# ===============================
class ExecutionEngine:
    def __init__(self, engine):
        self.engine = engine

    def execute(self, stmt, timeout=5000):
        with self.engine.connect() as conn:
            conn.execute(text(f"SET statement_timeout = {timeout}"))
            return conn.execute(stmt).fetchall()


# ===============================
# ENTERPRISE & GLOBAL ENGINE
# ===============================
class EnterpriseQueryEngine:
    def __init__(self, sqlalchemy_engine):
        self.registry = SchemaRegistry(sqlalchemy_engine)
        self.execution = ExecutionEngine(sqlalchemy_engine)

    def run(self, payload: dict, user_context):
        dsl = QueryDSL(**payload)
        validate_permissions(dsl, user_context)
        ast = ASTBuilder(self.registry).build(dsl)
        planned_ast = QueryPlanner().optimize(ast)
        context = CompilationContext(self.registry, AliasManager())
        stmt = SQLCompiler().compile(planned_ast, context)
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
        context = CompilationContext(self.registry, AliasManager())
        stmt = SQLCompiler().compile(planned, context)
        CostGuard().check(stmt)
        result = self.execution.execute(stmt)
        self.cache.set(fingerprint, result)
        LineageTracker().record(dsl, result)
        return result
