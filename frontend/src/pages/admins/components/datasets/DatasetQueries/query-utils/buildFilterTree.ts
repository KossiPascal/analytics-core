import { QueryFilterGroup, QueryFilter, DatasetField, SqlOperators, NO_VALUE_OPERATORS, FULL_OPERATORS } from "@/models/dataset.models";
import { BuiltFilter } from "./model";
import { generateSqlExpression, parseValue, formatSqlValue, assertOperatorCompatibility } from "./utils";

interface buildClauseProps {
    field: DatasetField, 
    operator: SqlOperators, 
    val: unknown, 
    val2: unknown, 
    useSqlInClause: boolean
}
// CALCULATE VALUES
export const buildFilterTree = (node: QueryFilterGroup | QueryFilter, fieldMap: Map<number, DatasetField>, paramIndex: { current: number }): BuiltFilter => {
    const result: BuiltFilter = { wheres: [], havings: [], values: {} };

    if (!node) return result;

    const nextKey = () => `p_${paramIndex.current++}`;

    const buildClause = ({field, operator, val, val2, useSqlInClause}:buildClauseProps): { clause: string; values: Record<string, any> } => {
        const values: Record<string, any> = {};

        const isAggregated = Boolean(field.aggregation);
        const isDimension = field.field_type === "dimension" && !isAggregated;
        const sqlOperator = operator.toUpperCase() as SqlOperators;

        const expr = isDimension ? field.expression : generateSqlExpression(field.expression, field.aggregation);

        // ---- BETWEEN ----
        if (sqlOperator === "BETWEEN" || sqlOperator === "NOT BETWEEN") {
            if (val === undefined || val2 === undefined) {
                throw new Error("BETWEEN requires two values");
            }

            const k1 = nextKey();
            const k2 = nextKey();

            values[k1] = parseValue(val, field.data_type);
            values[k2] = parseValue(val2, field.data_type);

            return { clause: `${expr} ${sqlOperator} :${k1} AND :${k2}`, values };
        }

        // ---- IN / NOT IN----
        if (sqlOperator === "IN" || sqlOperator === "NOT IN") {
            const arr = Array.isArray(val) ? val : [val];

            if (arr.length === 0) {
                throw new Error(`${sqlOperator} operator requires at least one value`);
            }

            if (useSqlInClause) {
                const keys = arr.map(v => {
                    const k = nextKey();
                    values[k] = parseValue(v, field.data_type);
                    return `:${k}`;
                });

                return { clause: `${expr} ${sqlOperator} (${keys.join(", ")})`, values };
            } else {
                const k = nextKey();
                values[k] = arr.map(v => parseValue(v, field.data_type));

                let clause = '';
                if (sqlOperator === "NOT IN") {
                    clause = `NOT (${expr} = ANY(:${k}))`;
                } else {
                    clause = `${expr} = ANY(:${k})`;
                }

                return { clause, values };
            }
        }

        // NO VALUE
        if (NO_VALUE_OPERATORS.includes(sqlOperator)) {
            return { clause: `${expr} ${sqlOperator}`, values };
        }

        // NULL / TRUE / FALSE
        const formatted = formatSqlValue(val, field.data_type);
        if (["NULL", "TRUE", "FALSE"].includes(String(formatted))) {
            return { clause: `${expr} ${sqlOperator} ${formatted}`, values };
        }

        const k = nextKey();
        values[k] = parseValue(val, field.data_type);

        return { clause: `${expr} ${sqlOperator} :${k}`, values };
    };

    // ---------------- CONDITION ----------------
    if (node.type === "condition") {
        const field = node.field_id ? fieldMap.get(node.field_id) : undefined;
        if (!field) throw new Error(`Unknown field: ${node.field_id}`);
        if (!field.field_type) throw new Error(`Field type missing for ${field.name}`);
        if (!FULL_OPERATORS.includes(node.operator)) throw new Error(`Opérateur non autorisé: ${node.operator}`);

        assertOperatorCompatibility(node.operator, field.data_type, node.value, node.value2);

        const { clause, values } = buildClause({field, operator:node.operator, val:node.value, val2:node.value2, useSqlInClause:node.useSqlInClause ?? false});

        const isMetric = ["metric", "calculated_metric"].includes(field.field_type) || Boolean(field.aggregation);

        if (!clause) throw new Error(`Invalid filter clause generated`);

        if (isMetric) result.havings.push(clause);
        else result.wheres.push(clause);

        Object.assign(result.values, values);

        return result;
    }

    // ---------------- GROUP ----------------
    if (node.type === "group") {

        const whereParts: string[] = [];
        const havingParts: string[] = [];

        for (const child of node.children) {
            const { wheres, havings, values } = buildFilterTree(child, fieldMap, paramIndex);

            if (wheres.length > 0) {
                whereParts.push(wheres.join(" "));
            }

            if (havings.length > 0) {
                havingParts.push(havings.join(" "));
            }

            Object.assign(result.values, values);
        }

        if (whereParts.length > 1) {
            result.wheres.push(`(${whereParts.join(` ${node.operator} `)})`);
        } else if (whereParts.length) {
            result.wheres.push(whereParts[0]);
        }

        if (havingParts.length > 1) {
            result.havings.push(`(${havingParts.join(` ${node.operator} `)})`);
        } else if (havingParts.length) {
            result.havings.push(havingParts[0]);
        }

        return result;
    }

    return result;
};