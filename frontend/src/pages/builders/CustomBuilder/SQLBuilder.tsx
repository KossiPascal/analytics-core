export type UUID = string
export type Logic = "AND" | "OR" | "NOT"
export type JoinType = "INNER" | "LEFT" | "RIGHT" | "FULL"
export type Agg = "count" | "sum" | "avg" | "min" | "max"

export const uid = () => crypto.randomUUID()

export interface TableNode {
    id: UUID
    name: string
    alias: string
}

export interface ColumnNode {
    tableId: UUID
    name: string
}

export interface JoinCondition {
    left: ColumnNode
    right: ColumnNode
}

export interface JoinNode {
    id: UUID
    type: JoinType
    leftTableId: UUID
    rightTableId: UUID
    on: JoinCondition[]
}

export interface OperatorConditionNode {
    type: "leaf"
    column: ColumnNode
    operator: "=" | "!=" | ">" | "<" | ">=" | "<=" | "IN" | "LIKE"
    value: any
}

export interface LogicConditionNode {
    type: "group"
    logic: Logic
    children: ConditionNode[]
}

export type ConditionNode = OperatorConditionNode | LogicConditionNode

export interface MetricNode {
    id: UUID
    agg: Agg
    column: ColumnNode
    alias: string
    filter?: ConditionNode
    window?: {
        partitionBy?: ColumnNode[]
        orderBy?: ColumnNode[]
    }
}

export interface DimensionNode {
    column: ColumnNode
    alias?: string
}

export interface TimeSeriesNode {
    column: ColumnNode
    grain: "day" | "week" | "month" | "year"
}

export interface PivotNode {
    column: ColumnNode
    values: (string | number)[]
}

export interface QueryAST {
    chart: any
    sourceTableId: UUID
    tables: TableNode[]
    joins: JoinNode[]
    dimensions: DimensionNode[]
    metrics: MetricNode[]
    where?: ConditionNode
    having?: ConditionNode
    timeseries?: TimeSeriesNode
    pivot?: PivotNode
}

export const quote = (v: any) => {
    // return typeof v === "string" ? `'${v.replace("'", "''")}'` : String(v)
    return typeof v === "string" ? `'${v.replace(/'/g, "''")}'` : String(v);
}

class CompileContext {
    constructor(private ast: QueryAST, private role: string) { }

    table(id: UUID) {
        const t = this.ast.tables.find(t => t.id === id);
        if (!t) throw new Error("Unknown table")
        canAccess(this.role, t.name)
        return t
    }

    col(c: ColumnNode) {
        const t = this.table(c.tableId)
        return `${t.alias}.${c.name}`
    }
}

function compileCondition(node: ConditionNode, ctx: CompileContext): string {
    if (node.type === "leaf") {
        const col = ctx.col(node.column)
        if (node.operator === "IN") {
            return `${col} IN (${node.value.map(quote).join(", ")})`
        }
        return `${col} ${node.operator} ${quote(node.value)}`
    }

    if (node.logic === "NOT") {
        return `NOT (${compileCondition(node.children[0], ctx)})`
    }

    const joiner = ` ${node.logic} `
    return `(${node.children.map(c => compileCondition(c, ctx)).join(joiner)})`
}

function compileSelect(ast: QueryAST, ctx: CompileContext) {
    const select: string[] = []
    const groupBy: string[] = []

    for (const d of ast.dimensions) {
        const c = ctx.col(d.column)
        select.push(`${c} AS ${d.alias ?? d.column.name}`)
        groupBy.push(c)
    }

    if (ast.timeseries) {
        const c = ctx.col(ast.timeseries.column)
        const expr = `DATE_TRUNC('${ast.timeseries.grain}', ${c})`
        select.push(`${expr} AS period`)
        groupBy.push(expr)
    }

    for (const m of ast.metrics) {
        let expr = `${m.agg.toUpperCase()}(${ctx.col(m.column)})`
        if (m.filter) {
            expr += ` FILTER (WHERE ${compileCondition(m.filter, ctx)})`
        }
        select.push(`${expr} AS ${m.alias}`)
    }

    return { select, groupBy }
}

export function compileSQL(ast: QueryAST, role = "analyst"): string {
    estimateCost(ast)

    const ctx = new CompileContext(ast, role);
    const { select, groupBy } = compileSelect(ast, ctx)

    let sql = `SELECT ${select.join(", ")}`;

    const source = ctx.table(ast.sourceTableId)
    sql += ` FROM ${source.name} ${source.alias}`

    for (const j of ast.joins) {
        const right = ctx.table(j.rightTableId)
        const on = j.on
            .map(c => `${ctx.col(c.left)} = ${ctx.col(c.right)}`)
            .join(" AND ")
        sql += ` ${j.type} JOIN ${right.name} ${right.alias} ON ${on}`
    }

    if (ast.where) {
        sql += ` WHERE ${compileCondition(ast.where, ctx)}`
    }

    if (groupBy.length) {
        sql += ` GROUP BY ${groupBy.join(", ")}`
    }

    if (ast.having) {
        sql += ` HAVING ${compileCondition(ast.having, ctx)}`
    }

    return sql
}

export function compileSQLWithPivot(ast: QueryAST, role = "analyst"): string {
    estimateCost(ast)

    if (!ast.pivot) return compileSQL(ast);

    const ctx = new CompileContext(ast, role);
    const { select, groupBy } = compileSelect(ast, ctx)

    const pivotCol = ctx.col(ast.pivot.column)
    const pivotValues = ast.pivot.values.map(v => quote(v))

    let sql = `SELECT ${select.join(", ")}`
    const source = ctx.table(ast.sourceTableId)
    sql += ` FROM ${source.name} ${source.alias}`

    for (const j of ast.joins) {
        const right = ctx.table(j.rightTableId)
        const on = j.on
            .map(c => `${ctx.col(c.left)} = ${ctx.col(c.right)}`)
            .join(" AND ")
        sql += ` ${j.type} JOIN ${right.name} ${right.alias} ON ${on}`
    }

    if (ast.where) {
        sql += ` WHERE ${compileCondition(ast.where, ctx)}`
    }

    sql += ` GROUP BY ${groupBy.join(", ")}`

    const pivotSelects = pivotValues.map(v => {
        let defaultAlias = `${ast.metrics[0].alias}_${v.replace(/[^a-zA-Z0-9_]/g, "")}`;
        if (ast.pivot && ast.pivot.column.name) {
            defaultAlias = `${ast.pivot.column.name}_${v.replace(/'/g, "")}`
        }

        return `MAX(CASE WHEN ${pivotCol} = ${v} THEN ${ctx.col(ast.metrics[0].column)} END) AS ${defaultAlias}`
    }).join(", ")

    return `SELECT ${select.concat(pivotSelects).join(", ")} FROM (${sql})`
}

export const ROLES: Record<string, Set<string>> = {
    admin: new Set(["*"]),
    analyst: new Set(["pcimne_data_view", "facility"]),
    viewer: new Set(["pcimne_data_view"]),
}

export function canAccess(role: string, table: string) {
    const allowed = ROLES[role]
    if (!allowed) throw new Error("Unknown role")
    if (allowed.has("*")) return
    if (!allowed.has(table)) {
        throw new Error(`Role ${role} cannot access ${table}`)
    }
}

export interface QueryAST {
    sourceTableId: string
    tables: TableNode[]
    joins: JoinNode[]
    dimensions: {
        column: ColumnNode
        alias?: string
    }[]
    metrics: MetricNode[]
    where?: ConditionNode
    having?: ConditionNode
    timeseries?: {
        column: ColumnNode
        grain: "day" | "week" | "month" | "year"
    }
    pivot?: {
        column: ColumnNode
        values: (string | number)[]
    }
}

const TABLE_ROWS: Record<string, number> = {
    pcimne_data_view: 5_000_000,
    facility: 10_000,
}

const MAX_SCAN = 20_000_000

export function estimateCost(ast: any) {
    let rows = TABLE_ROWS[ast.sourceTableId] ?? 1_000_000
    rows *= 1 + ast.joins.length * 0.3
    if (rows > MAX_SCAN) {
        throw new Error(`Query too expensive (${rows} rows)`)
    }
}
