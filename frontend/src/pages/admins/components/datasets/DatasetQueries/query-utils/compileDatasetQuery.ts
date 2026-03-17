import { Dataset, DatasetField, QueryJson } from "@/models/dataset.models";
import { buildLinkedFilterGroups } from "./buildLinkedFilterGroups";
import { CompiledQuery } from "./model";
import { quoteIdentifier, generateSqlExpression } from "./utils";


// SQL COMPILER
export const compileDatasetQuery = (dataset: Dataset, fields: DatasetField[], query: QueryJson): CompiledQuery => {
    // QueryJsonSchema.parse(query);
    const compile: CompiledQuery = { sql: "", values: {}, error: {} }

    if (!dataset?.view_name) {
        compile.error.view_name = "Dataset invalide.";
        console.log("Dataset invalide.");
        return compile;
    }

    const fieldMap: Map<number, DatasetField> = new Map(fields.map(f => [f.id!, f]));
    const paramIndex = { current: 0 };

    const selectPart: string[] = [];
    const groupByPart: string[] = [];
    const wherePart: string[] = [];
    const havingPart: string[] = [];

    const { dimensions = [], metrics = [] } = query.select;

    const aliasMap = new Map<number, string>();

    if (!dimensions.length && !metrics.length) {
        const errorMsg = "At least one dimension or metric required.";
        compile.error["select"] = errorMsg;
        compile.error["dimensions"] = errorMsg;
        compile.error["metrics"] = errorMsg;
        return compile;
    }

    // ---- SELECT DIMENSIONS
    for (const dim of dimensions) {
        const field = fieldMap.get(dim.field_id);
        if (!field || field.field_type !== "dimension") continue;

        const alias = dim.alias ?? quoteIdentifier(field.name);
        selectPart.push(`${field.expression} AS ${alias}`);
        groupByPart.push(field.expression);

        aliasMap.set(field.id!, alias);
    }

    // ---- SELECT METRICS
    for (const met of metrics) {
        const field = fieldMap.get(met.field_id);
        if (!field || !field.field_type || !["metric", "calculated_metric"].includes(field.field_type)) continue;

        const alias = met.alias ?? quoteIdentifier(field.name);
        const sqlExpression = generateSqlExpression(field.expression, field.aggregation);

        selectPart.push(`${sqlExpression} AS ${alias}`);
        aliasMap.set(field.id!, alias);
    }

    if (selectPart.length === 0) {
        const errorMsg = "Au moins un champ doit être sélectionné.";
        compile.error.select = errorMsg;
        console.log(errorMsg);
        return compile;
    }

    // FILTERS
    const queryFilters = [
        ...(query.filters?.where ?? []),
        ...(query.filters?.having ?? [])
    ];

    if (queryFilters.length > 0) {
        const { wheres, havings, values } = buildLinkedFilterGroups(queryFilters, fieldMap, paramIndex);
        wherePart.push(...wheres);
        havingPart.push(...havings);
        compile.values = values;
    }

    const order_by_errors: string[] = [];

    const hasOrderBy = query.order_by && query.order_by.length > 0;

    // ---- ORDER BY
    const orderBy = hasOrderBy
        ? `ORDER BY ${query.order_by
            .filter(o => {
                const field = fieldMap.get(o.field_id);
                if (!field) {
                    const errorMsg = `Invalid ORDER BY field: ${o.field_id}`;
                    order_by_errors.push(errorMsg);
                    console.log(errorMsg);
                    return false
                }
                return true
            }).map(o => {
                const dir = o.direction?.toLowerCase() === "desc" ? "DESC" : "ASC";
                const alias = aliasMap.get(o.field_id);
                return `${alias} ${dir}`;
            })
            .filter(Boolean)
            .join(", ")}`
        : "";

    if (order_by_errors.length > 0) {
        compile.error.order_by = order_by_errors.join('\n');
        return compile;
    }

    // if (typeof query.limit === "number" && query.limit <= 0) {
    //     // compile.error.limit = "Limit doit être un entier positif!";
    //     query.limit = null;
    //     // return compile;
    // }

    // if (typeof query.offset === "number" && query.offset < 0) {
    //     // compile.error.offset = "Offset doit être ≥ 0!";
    //     // return compile;
    //     query.offset = null;
    // }

    // Vérifier limit
    if (query.limit !== undefined && query.limit !== null) {
        if (typeof query.limit !== "number" || query.limit <= 0) {
            compile.error.limit = "Limit doit être un entier positif!";
            return compile;
        }
    }

    // Vérifier offset
    if (query.offset !== undefined && query.offset !== null) {
        if (typeof query.offset !== "number" || query.offset < 0) {
            compile.error.offset = "Offset doit être ≥ 0!";
            return compile;
        }
    }

    // ---- LIMIT / OFFSET
    const isLimit = typeof query.limit === "number" && query.limit > 0;
    const limit = isLimit ? `LIMIT ${query.limit}` : "";

    const isOffset = typeof query.offset === "number" && query.offset >= 0;
    const offset = isOffset ? `OFFSET ${query.offset}` : "";

    const hasGroupBy = metrics.length > 0 && groupByPart.length;

    // ---- FINAL SQL
    const sql = [
        "SELECT",
        `  ${selectPart.join(",\n  ")}`,
        `FROM ${quoteIdentifier(dataset.view_name)}`,
        wherePart.length ? `WHERE ${wherePart.join(" \n ")}` : "",
        hasGroupBy ? `GROUP BY ${groupByPart.join(", ")}` : "",
        havingPart.length > 0 ? `HAVING ${havingPart.join(" \n ")}` : "",
        orderBy,
        limit,
        offset
    ].filter(Boolean).join("\n").trim();

    compile.error = {};
    compile.sql = sql;

    return compile;
}
