import { Shield, Copy, X, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState, forwardRef, useCallback, useRef } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { AdminEntityCrudModule, AdminEntityCrudModuleRef } from "@pages/admins/AdminEntityCrudModule";
import { StatusBadge } from "@components/ui/Badge/Badge";
import { type Column } from "@components/ui/Table/Table";
import { FormInput } from "@components/forms/FormInput/FormInput";
import { FormSelect } from "@components/forms/FormSelect/FormSelect";
import { FormMultiSelect } from "@components/forms/FormSelect/FormMultiSelect";
import { FormSwitch } from "@components/forms/FormSwitch/FormSwitch";
import { Button } from "@components/ui/Button/Button";
import { datasetService, queryService } from "@/services/dataset.service";
import { Tenant } from "@/models/identity.model";
import { Dataset, DatasetField, DatasetQuery, QueryFilterGroup, QueryFilter, QueryJson, SqlAggType, LinkedFilterGroup, QueryFilterNode, SqlOperators, SqlDataType, getInputTypeForField, getOperatorsForField, BOOLEAN_ONLY_OPERATORS } from "@/models/dataset.models";
import { FULL_OPERATORS, NO_VALUE_OPERATORS, LOGICAL_OPERATORS, NUMERIC_DATA_TYPES, DATETIME_DATA_TYPES, ARRAY_REQUIRED_OPERATORS, DATE_OPERATORS, NULL_ONLY_OPERATORS, NUMERIC_OPERATORS, RANGE_REQUIRED_OPERATORS, STRING_OPERATORS } from "@/models/dataset.models";
import { Modal } from "@/components/ui/Modal/Modal";
import { z } from "zod";

import styles from '@pages/admins/AdminPage.module.css';
import { FormTextarea } from "@/components/forms/FormTextarea/FormTextarea";
import { FaDatabase } from "react-icons/fa";

interface CompileError {
    view_name?: string;
    dimensions?: string;
    metrics?: string;
    select?: string;
    order_by?: string;
    limit?: string;
    offset?: string;
    error?: string;

    query_tenant?: string;
    query_dataset?: string;
    query_name?: string;
}
interface CompiledQuery {
    sql: string;
    values: Record<string, any>;
    error: CompileError
}
interface SqlPreviewProps {
    title: string;
    open: boolean;
    data: string | null;
    type: "sql" | "json";
    onClose: () => void;
}
interface OrderByBuilderProps {
    fields: DatasetField[];
    orderBy: QueryJson["order_by"];
    onChange: (orderBy: QueryJson["order_by"]) => void;
    error: string | undefined;
}
interface FilterNodeBuilderProps {
    index: number
    node: QueryFilterNode;
    fields: DatasetField[];
    onChange: (node: QueryFilterNode) => void;
    onRemove?: () => void;
    error: string | undefined;
}
interface FilterBuilderProps {
    name: String;
    fields: DatasetField[];
    node: LinkedFilterGroup[];
    onChange: (node: LinkedFilterGroup[]) => void;
}
type BuiltFilter = {
    wheres: string[];
    havings: string[];
    values: Record<string, any>;
}
interface InValuesModalProps {
    isOpen: boolean;
    onClose: () => void;
    values: string[];
    onChange: (values: string[]) => void;
    inputType: string;
}
interface RenderFormProp {
    datasets: Dataset[],
    // queries: DatasetQuery[],
    query: DatasetQuery,
    tenants: Tenant[],
    tenant_id: number
    errors: CompileError,
    setValue: (k: keyof DatasetQuery, v: any) => void,
    setPreviewSql: (sql: string | null) => void
    setErrors: (error: CompileError) => void
}

export const QueryFilterConditionSchema = z.object({
    type: z.literal("condition"),
    field: z.string().min(1),
    operator: z.enum(FULL_OPERATORS),
    value: z.any().optional(),
    value2: z.any().optional()
    // value: z.union([z.string(), z.number(), z.boolean(), z.array(z.any())]),
    // value2: z.union([z.string(), z.number(), z.boolean(), z.array(z.any())]).optional()
}).superRefine((val, ctx) => {
    if (val.operator === "BETWEEN" && val.value2 === undefined) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "BETWEEN requires value2"
        });
    }
    if (val.operator === "IN" && !Array.isArray(val.value)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "IN requires array value"
        });
    }
});

const QueryFilterSchema: z.ZodType<z.infer<typeof QueryFilterConditionSchema> | any> = z.lazy(() =>
    z.union([
        QueryFilterConditionSchema,
        z.object({
            type: z.literal("group"),
            operator: z.enum(["AND", "OR"]),
            children: z.array(QueryFilterSchema)
        })
    ])
);

export const QueryJsonSchema = z.object({
    select: z.object({
        dimensions: z.array(z.string()),
        metrics: z.array(z.string())
    }),
    filters: QueryFilterSchema.optional(),
    order_by: z.array(
        z.object({
            field: z.string().min(1),
            direction: z.enum(["asc", "desc"])
        })
    ).optional().default([]),
    limit: z.number().int().positive().nullable().optional(),
    offset: z.number().int().nonnegative().nullable().optional()
});

// DEFAULT FORM
const createDefaultForm = (tenant_id:number): DatasetQuery => ({
    id: null,
    name: "",
    tenant_id: tenant_id,
    dataset_id: null,
    query_json: {
        select: {
            dimensions: [],
            metrics: []
        },
        order_by: [],
        filters: {
            where: [
                {
                    linkWithPrevious: undefined,
                    node: {
                        type: "group",
                        operator: "AND",
                        children: [
                            {
                                type: "condition",
                                field: "",
                                operator: "=",
                                value: ""
                            }
                        ]
                    }
                }
            ],
            having: []
        },
        limit: null,
        offset: null
    },
    compiled_sql: "",
    values: {},
    description: "",
    is_active: true
});

// ---------- SANITIZE & IDENTIFIERS ----------
const sanitizeIdentifier = (name: string) => {
    // Autorise uniquement lettres, chiffres, underscore, pas de SQL injection
    if (!name) throw new Error("Identifier cannot be empty");
    return name.replace(/[^a-zA-Z0-9_]/g, "_");
};
const quoteIdentifier = (name: string) => `"${name.replace(/"/g, "")}"`;

// ---------- NULL / EMPTY CHECK ----------
const isNullLike = (val: unknown): boolean => {
    if (val === null || val === undefined) return true;
    const s = String(val).trim().toLowerCase();
    return s === "null" || s === "undefined" || s === "";
};

// ---------- STRING / SQL ----------
const removeQuotes = (val: string) => val.replace(/^['"]+|['"]+$/g, "").trim();
const stripWrappers = (val: string) => val.replace(/^[\(\[\{]\s*/, "").replace(/\s*[\)\]\}]$/, "");
const escapeSqlString = (val: string) => val.replace(/'/g, "''");

// ---------- NUMERIC ----------
const isNumeric = (val: string) => {
    if (!val.trim()) return false;
    const normalized = val.replace(",", ".").replace(" ", "");
    return !Number.isNaN(Number(normalized));
};
const normalizeNumber = (val: string): number => {
    const normalized = Number(val.replace(",", ".").replace(" ", "."));
    return Number(normalized);
}

// ---------- BOOLEAN ----------
const parseBoolean = (val: unknown): boolean | null => {
    if (typeof val === "boolean") return val;
    if (val === null || val === undefined) return null;
    const v = String(val).trim().toLowerCase();
    if (["true", "1", "yes"].includes(v)) return true;
    if (["false", "0", "no"].includes(v)) return false;
    return null;
};

// ---------- DATE & JSON ----------
const isValidDate = (val: string) => !Number.isNaN(Date.parse(val));
const isValidJSON = (val: string) => {
    try { JSON.parse(val); return true; } catch { return false; }
};

// ---------- PARSE VALUE & FORMAT SQL ----------
const parseValue = (raw: unknown, dataType: SqlDataType): unknown => {
    if (isNullLike(raw)) return null;

    const value = String(raw).trim();

    if (NUMERIC_DATA_TYPES.includes(dataType)) {
        if (!isNumeric(value)) throw new Error(`Invalid numeric value: ${raw}`);
        const numericValue = normalizeNumber(value);
        if (!Number.isFinite(numericValue)) throw new Error(`Invalid numeric value: ${raw}`);
        return numericValue;
    }

    if (dataType === "boolean") {
        const b = parseBoolean(value);
        if (b === null) throw new Error(`Invalid boolean value: ${raw}`);
        return b;
    }

    if (DATETIME_DATA_TYPES.includes(dataType)) {
        if (!isValidDate(value)) throw new Error(`Invalid date value: ${raw}`);
        return value;
    }

    if (dataType === "json") {
        const str = typeof raw === "object" ? JSON.stringify(raw) : value;
        if (!isValidJSON(str)) throw new Error(`Invalid JSON value: ${raw}`);
        return str;
    }

    // Default string
    return removeQuotes(value);
};

const formatSqlValue = (raw: unknown, dataType: SqlDataType): string | number => {
    if (isNullLike(raw)) return "NULL";
    const parsed = parseValue(raw, dataType);

    if (typeof parsed === "number") return parsed;
    if (typeof parsed === "boolean") return parsed ? "TRUE" : "FALSE";

    return escapeSqlString(String(parsed));
};

// ---------- NORMALISE LIST & FORMAT IN CLAUSE ----------
const normalizeListInput = (input: unknown, dataType: SqlDataType): unknown[] => {
    const values = Array.isArray(input) ? input : String(input ?? "").split(/[, ]+/);
    return values.map(v => parseValue(v, dataType)).filter(v => v !== null);
};

const formatInClause = (input: unknown, dataType: SqlDataType): string => {
    const values = normalizeListInput(input, dataType);
    if (values.length === 0) return "()";
    const formatted = values.map(v =>
        typeof v === "number" ? v : escapeSqlString(String(v))
    );
    return `(${formatted.join(", ")})`;
};

const generateSqlExpression = (expression: string, aggregation: SqlAggType | null, isDistinct: boolean = false) => {
    if (!expression) return "";
    const DISTINCT = isDistinct ? "DISTINCT " : ""
    if (aggregation) {
        return `${aggregation}(${DISTINCT}${expression})`;
    } else {
        return `${DISTINCT}${expression}`;
    }
}

const assertOperatorCompatibility = (operator: SqlOperators, dataType: SqlDataType, value: any, value2?: any) => {
    // NULL operators accept any type
    if (NULL_ONLY_OPERATORS.includes(operator)) return;

    // BOOLEAN specific
    if (BOOLEAN_ONLY_OPERATORS.includes(operator)) {
        if (dataType !== "boolean") {
            throw new Error(`Operator "${operator}" only allowed on boolean fields`);
        }
        return;
    }

    // BETWEEN requires two values
    if (RANGE_REQUIRED_OPERATORS.includes(operator)) {
        if (value === undefined || value2 === undefined) {
            throw new Error(`Operator "${operator}" requires two values`);
        }
    }

    // IN requires array
    if (ARRAY_REQUIRED_OPERATORS.includes(operator)) {
        if (!Array.isArray(normalizeListInput(value, dataType))) {
            throw new Error(`Operator "${operator}" requires list value`);
        }
    }

    // Numeric
    if (NUMERIC_DATA_TYPES.includes(dataType)) {
        if (!NUMERIC_OPERATORS.includes(operator)) {
            throw new Error(`Operator "${operator}" not compatible with numeric type`);
        }
        return;
    }

    // Date
    if (DATETIME_DATA_TYPES.includes(dataType)) {
        if (!DATE_OPERATORS.includes(operator)) {
            throw new Error(`Operator "${operator}" not compatible with date type`);
        }
        return;
    }

    // String
    if (["string", "json", "jsonb"].includes(dataType)) {
        if (!STRING_OPERATORS.includes(operator)) {
            throw new Error(`Operator "${operator}" not compatible with string type`);
        }
        return;
    }

    // Boolean normal comparisons
    if (dataType === "boolean") {
        if (!["=", "!=", "<>"].includes(operator) && !BOOLEAN_ONLY_OPERATORS.includes(operator)) {
            throw new Error(`Operator "${operator}" not compatible with boolean type`);
        }
        return;
    }
}

// CALCULATE VALUES
const buildFilterTree = (node: QueryFilterGroup | QueryFilter, fieldMap: Map<string, DatasetField>, paramIndex: { current: number }, useSqlInClause: boolean = false): BuiltFilter => {
    const result: BuiltFilter = { wheres: [], havings: [], values: {} };

    if (!node) return result;

    const nextKey = () => `p_${paramIndex.current++}`;

    const buildClause = (field: DatasetField, operator: SqlOperators, val: unknown, val2?: unknown): { clause: string; values: Record<string, any> } => {
        const values: Record<string, any> = {};

        const isAggregated = Boolean(field.aggregation);
        const isDimension = field.field_type === "dimension" && !isAggregated;

        const expr = isDimension ? field.expression : generateSqlExpression(field.expression, field.aggregation);

        // ---- BETWEEN ----
        if (operator === "BETWEEN") {
            if (val === undefined || val2 === undefined) {
                throw new Error("BETWEEN requires two values");
            }

            const k1 = nextKey();
            const k2 = nextKey();

            values[k1] = parseValue(val, field.data_type);
            values[k2] = parseValue(val2, field.data_type);

            return { clause: `${expr} BETWEEN :${k1} AND :${k2}`, values };
        }

        // ---- IN ----
        if (operator === "IN") {
            const arr = Array.isArray(val) ? val : [val];
            if (arr.length === 0) {
                throw new Error("IN operator requires at least one value");
            }

            if (useSqlInClause) {
                const keys = arr.map(v => {
                    const k = nextKey();
                    values[k] = parseValue(v, field.data_type);
                    return `:${k}`;
                });

                return { clause: `${expr} IN (${keys.join(", ")})`, values };
            } else {
                const k = nextKey();
                values[k] = arr.map(v => parseValue(v, field.data_type));
                return { clause: `${expr} = ANY(:${k})`, values };
            }
        }

        // NO VALUE
        if (NO_VALUE_OPERATORS.includes(operator)) {
            return { clause: `${expr} ${operator}`, values };
        }

        // NULL / TRUE / FALSE
        const formatted = formatSqlValue(val, field.data_type);
        if (["NULL", "TRUE", "FALSE"].includes(String(formatted))) {
            return { clause: `${expr} ${operator} ${formatted}`, values };
        }

        const k = nextKey();
        values[k] = parseValue(val, field.data_type);

        return { clause: `${expr} ${operator} :${k}`, values };
    };

    // ---------------- CONDITION ----------------
    if (node.type === "condition") {
        const field = fieldMap.get(node.field);
        if (!field) throw new Error(`Unknown field: ${node.field}`);
        if (!field.field_type) throw new Error(`Field type missing for ${node.field}`);
        if (!FULL_OPERATORS.includes(node.operator)) throw new Error(`Opérateur non autorisé: ${node.operator}`);

        assertOperatorCompatibility(node.operator, field.data_type, node.value, node.value2);

        const { clause, values } = buildClause(field, node.operator, node.value, node.value2);

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

const buildLinkedFilterGroups = (groups: LinkedFilterGroup[], fieldMap: Map<string, DatasetField>, paramIndex: { current: number }): BuiltFilter => {

    const result: BuiltFilter = { wheres: [], havings: [], values: {} };

    if (!groups?.length) return result;

    let whereExpr = "";
    let havingExpr = "";

    const wheresGroup = groups.filter(g => {
        const res = buildFilterTree(g.node, fieldMap, { current: 0 });
        return res.wheres.length > 0;
    });

    const havingGroup = groups.filter(g => {
        const res = buildFilterTree(g.node, fieldMap, { current: 0 });
        return res.havings.length > 0;
    });

    wheresGroup.forEach((group, index) => {
        const { wheres, values } = buildFilterTree(group.node, fieldMap, paramIndex);
        const link = group.linkWithPrevious || "AND";
        const operator = ` ${group.node.operator || "AND"} `;
        // WHERE
        if (wheres.length) {
            const wClause = wheres.length > 1 ? `(${wheres.join(operator)})` : wheres[0];
            whereExpr = index === 0 ? wClause : `${whereExpr} ${link} ${wClause}`;
        }
        Object.assign(result.values, values);
    });

    havingGroup.forEach((group, index) => {
        const { havings, values } = buildFilterTree(group.node, fieldMap, paramIndex);
        const link = group.linkWithPrevious || "AND";
        const operator = ` ${group.node.operator || "AND"} `;
        // HAVING
        if (havings.length) {
            const hClause = havings.length > 1 ? `(${havings.join(operator)})` : havings[0];
            havingExpr = index === 0 ? hClause : `${havingExpr} ${link} ${hClause}`;
        }
        Object.assign(result.values, values);
    });

    if (whereExpr) result.wheres.push(whereExpr);
    if (havingExpr) result.havings.push(havingExpr);

    return result;
};
// SQL COMPILER
const compileDatasetQuery = (dataset: Dataset, fields: DatasetField[], query: QueryJson): CompiledQuery => {
    // QueryJsonSchema.parse(query);
    const compile: CompiledQuery = { sql: "", values: {}, error: {} }

    if (!dataset?.view_name) {
        compile.error.view_name = "Dataset invalide.";
        console.log("Dataset invalide.");
        return compile;
    }

    const fieldMap = new Map(fields.map(f => [f.name, f]));
    const paramIndex = { current: 0 };

    const selectPart: string[] = [];
    const groupByPart: string[] = [];
    const wherePart: string[] = [];
    const havingPart: string[] = [];

    const { dimensions = [], metrics = [] } = query.select;

    const aliasMap = new Map<string, string>();

    if (!dimensions.length && !metrics.length) {
        const errorMsg = "At least one dimension or metric required.";
        compile.error["select"] = errorMsg;
        compile.error["dimensions"] = errorMsg;
        compile.error["metrics"] = errorMsg;
        console.log(errorMsg);
        return compile;
    }

    // ---- SELECT DIMENSIONS
    for (const dim of dimensions) {
        const field = fieldMap.get(dim);
        if (!field || field.field_type !== "dimension") continue;

        const alias = quoteIdentifier(field.name);
        selectPart.push(`${field.expression} AS ${alias}`);
        groupByPart.push(field.expression);

        aliasMap.set(field.name, alias);
    }

    // ---- SELECT METRICS
    for (const met of metrics) {
        const field = fieldMap.get(met);
        if (!field || !field.field_type || !["metric", "calculated_metric"].includes(field.field_type)) continue;

        const alias = quoteIdentifier(field.name);
        const sqlExpression = generateSqlExpression(field.expression, field.aggregation);

        selectPart.push(`${sqlExpression} AS ${alias}`);
        aliasMap.set(field.name, alias);
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
                if (!fieldMap.get(o.field)) {
                    const errorMsg = `Invalid ORDER BY field: ${o.field}`;
                    order_by_errors.push(errorMsg);
                    console.log(errorMsg);
                    return false
                }
                return true
            }).map(o => {
                const dir = o.direction?.toLowerCase() === "desc" ? "DESC" : "ASC";
                const alias = aliasMap.get(o.field) ?? quoteIdentifier(o.field);
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

// PREVIEW SQL
const DatasetPreviewModal = ({ title, open, data, type, onClose }: SqlPreviewProps) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        if (!data) return;
        await navigator.clipboard.writeText(data);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    if (!open) return null;

    return (
        <Modal
            isOpen={open}
            title={title}
            size="lg"
            onClose={onClose}
            footer={
                <>

                    <Button size="sm" variant="outline" onClick={onClose}>
                        <X size={20} /> Fermer
                    </Button>
                    <Button size="sm" onClick={handleCopy}>
                        <Copy size={16} /> {copied ? "Copié" : "Copier"}
                    </Button>
                </>
            }>

            {/* Body */}

            {type === "sql" ? (
                <SyntaxHighlighter
                    language="sql"
                    style={oneDark}
                    showLineNumbers
                    customStyle={{ margin: 0, padding: "1.5rem", background: "transparent", fontSize: "0.9rem" }}
                >
                    {data ?? "-- Aucun SQL disponible"}
                </SyntaxHighlighter>
            ) :
                (
                    <pre className="bg-gray-100 p-6 overflow-auto text-sm">
                        {data ?? "-- Aucun JSON disponible"}
                    </pre>
                )}
        </Modal>
    );
};

// COLUMN
const getQueryColumns = (setPreviewJson: (v: QueryJson) => void, setPreviewSql: (v: string) => void, setPreviewValues: (v: Record<string, any>) => void): Column<DatasetQuery>[] => [
    {
        key: "name",
        header: "Nom",
        sortable: true,
        searchable: true
    },

    {
        key: "query_json",
        header: "JSON",
        align: "center",
        render: q => (
            <Button size="sm" variant="outline" onClick={() => setPreviewJson(q.query_json)}>
                Voir JSON
            </Button>
        )
    },
    {
        key: "compiled_sql",
        header: "SQL",
        align: "center",
        render: q => (
            <Button size="sm" variant="outline" onClick={() => setPreviewSql(q.compiled_sql)}>
                Voir SQL
            </Button>
        )
    },
    {
        key: "values",
        header: "values",
        align: "center",
        render: q => (
            <Button size="sm" variant="outline" onClick={() => setPreviewValues(q.values)}>
                Voir VALUES
            </Button>
        )
    },
    {
        key: "tenant",
        header: "Tenant",
        render: (ds) => ds.tenant?.name ?? "",
        sortable: true,
        searchable: true,
    },
    {
        key: "dataset",
        header: "Dataset",
        render: (ds) => ds.dataset?.name ?? "",
        sortable: true,
        searchable: true,
    },
    {
        key: "description",
        header: "Description",
        sortable: true,
        searchable: true,
    },
    {
        key: "is_active",
        header: "Active",
        sortable: true,
        align: "center",
        render: (ou) => (<StatusBadge isActive={ou.is_active === true} />),
        searchable: false,
    }
];

// ORDER BY
const DatasetOrderByBuilder = ({ fields, orderBy = [], onChange, error }: OrderByBuilderProps) => {

    const add = () => {
        onChange([...(orderBy || []), { field: "", direction: "asc" }]);
    };

    const update = (index: number, patch: Partial<typeof orderBy[number]>) => {
        const updated = [...(orderBy || [])];
        updated[index] = { ...updated[index], ...patch };
        onChange(updated);
    };

    const remove = (index: number) => {
        onChange(orderBy.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-4 border rounded-xl p-4 bg-gray-50">
            <div className="flex justify-between items-center">
                <h6 className="font-semibold">
                    Order By ({orderBy?.length || 0})
                </h6>
                <Button size="sm" onClick={add}>+ Add Order</Button>
            </div>

            <table>
                <tbody>
                    {orderBy?.map((o, i) => (
                        // <tr key={i} className="flex gap-2 items-center">
                        <tr key={i}>
                            <th>
                                <span className="text-xs text-gray-500 w-6">
                                    {i + 1}
                                </span>
                            </th>

                            <th>
                                <FormSelect
                                    value={o.field}
                                    options={fields.map(f => ({
                                        value: f.name,
                                        label: f.name
                                    }))}
                                    onChange={(v) => update(i, { field: v })}
                                    error={error}
                                />
                            </th>

                            <th>
                                <FormSelect
                                    value={o.direction}
                                    options={[
                                        { value: "asc", label: "ASC" },
                                        { value: "desc", label: "DESC" }
                                    ]}
                                    onChange={(v) => update(i, { direction: v })}
                                />
                            </th>

                            <th>
                                <Button style={{ "padding": "6px 8px", "marginBottom": "12px" }} size="sm" variant="danger" onClick={() => remove(i)}>
                                    ✕
                                </Button>
                            </th>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const InValuesModal = ({ isOpen, onClose, values, onChange, inputType }: InValuesModalProps) => {

    const [tempValue, setTempValue] = useState("");

    const addValue = () => {
        if (!tempValue.trim()) return;
        onChange([...values, tempValue.trim()]);
        setTempValue("");
    };

    const removeValue = (index: number) => {
        onChange(values.filter((_, i) => i !== index));
    };

    if (!isOpen) return null;

    return (
        <Modal title="Add IN values" isOpen={true} onClose={onClose} size="sm">
            <div style={{ "height": "30px" }} className="flex gap-2">
                <FormInput type={inputType} value={tempValue} onChange={(e) => setTempValue(e.target.value)} />
                <Button size="sm" style={{ "padding": "0px 5px" }} onClick={addValue}>Add</Button>
            </div>

            <br />

            <table>
                {values.map((v, i) => (
                    <tr key={i}>
                        <th>{v}</th>
                        <th><Button size="sm" style={{ "padding": "1px 5px" }} onClick={() => removeValue(i)} variant="danger">✕</Button></th>
                    </tr>
                ))}
            </table>

            <br />

            <div className="flex justify-end">
                <Button size="sm" style={{ "padding": "5px 10px" }} variant="outline" onClick={onClose}>
                    Close
                </Button>
            </div>
        </Modal>
    );
};

const FilterNodeBuilder = ({ index, node, fields, onChange, onRemove }: FilterNodeBuilderProps) => {
    const [isInModalOpen, setIsInModalOpen] = useState(false);

    const defaultCondition: QueryFilter = { type: "condition", field: "", operator: "=", value: "" };

    const defaultGroup: QueryFilterGroup = { type: "group", operator: "AND", children: [] };

    if (!node) return <tr><th>No Node Available !</th></tr>;

    if (node.type === "condition") {
        const selectedField = fields.find(f => f.name === node.field);
        const operators = getOperatorsForField(selectedField?.data_type);
        const inputType = getInputTypeForField(selectedField?.data_type);

        const renderValueInput = () => {
            if (NO_VALUE_OPERATORS.includes(node.operator)) return null;

            if (node.operator === "BETWEEN") {
                return (
                    <>
                        <FormInput type={inputType} value={node.value}
                            onChange={(e) => onChange({ ...node, value: e.target.value })} />

                        <FormInput type={inputType} value={node.value2 ?? ""}
                            onChange={(e) => onChange({ ...node, value2: e.target.value })} />
                    </>
                );
            }

            if (node.operator === "IN") {
                const values = Array.isArray(node.value) ? node.value : [];

                return (
                    <>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setIsInModalOpen(true)}
                        >
                            Edit values ({values.length})
                        </Button>

                        <InValuesModal
                            isOpen={isInModalOpen}
                            onClose={() => setIsInModalOpen(false)}
                            values={values}
                            inputType={inputType}
                            onChange={(newValues) =>
                                onChange({ ...node, value: newValues })
                            }
                        />
                    </>
                );
            }

            switch (inputType) {
                case "select":
                    return (
                        <>
                            {selectedField?.data_type === "boolean" ? (
                                <FormSelect
                                    // label="Value"
                                    value={node.value}
                                    options={[
                                        { value: "true", label: "TRUE" },
                                        { value: "false", label: "FALSE" },
                                    ]}
                                    onChange={(v) => onChange({ ...node, value: v })}
                                />
                            ) : (<>Erreur</>)}
                        </>
                    );

                case "textarea":
                    return (
                        <FormTextarea
                            // label="Value"
                            value={node.value}
                            onChange={(e) => onChange({ ...node, value: e.target.value })}
                        />
                    );

                default:
                    return (
                        <FormInput
                            // label="Value"
                            type={inputType}
                            value={node.value}
                            onChange={(e) => onChange({ ...node, value: e.target.value })}
                        />
                    );
            }
        };

        return (
            <tr>
                <th>
                    <span className="text-xs text-gray-500 w-6">{index}</span>
                </th>
                <td>
                    <FormSelect
                        value={node.field}
                        options={fields.map(f => ({ value: f.name, label: f.name }))}
                        // onChange={(v) => onChange({ ...node, field: v })}
                        onChange={(v) => {
                            const newField = fields.find(f => f.name === v);
                            const newOperators = getOperatorsForField(newField?.data_type);

                            onChange({
                                ...node,
                                field: v,
                                operator: newOperators[0] ?? "=",
                                value: "",
                                value2: undefined
                            });
                        }}
                    />
                </td>

                <td>
                    <FormSelect
                        // label="Operator"
                        value={node.operator}
                        options={operators.map(o => ({ value: o, label: o }))}
                        // onChange={(v) => onChange({ ...node, operator: v })}
                        onChange={(v) => {
                            const isBetween = v === "BETWEEN";
                            const isIn = v === "IN";

                            onChange({
                                ...node,
                                operator: v,
                                value: isIn ? [] : "",
                                value2: isBetween ? "" : undefined
                            });
                        }}
                    />
                </td>

                <td colSpan={2} className="flex gap-2 items-center">
                    {renderValueInput()}
                </td>

                <td>
                    {onRemove && (
                        <Button style={{ "padding": "6px 8px", "marginBottom": "12px" }} size="sm" variant="danger" onClick={onRemove}>
                            ✕
                        </Button>
                    )}
                </td>
            </tr>
        );
    }

    // ----- GROUP NODE

    const updateChild = (index: number, updated: QueryFilterNode) => {
        const children = [...node.children];
        children[index] = updated;
        onChange({ ...node, children });
    };

    const removeChild = (index: number) => {
        const children = node.children.filter((_, i) => i !== index);
        onChange({ ...node, children });
    };

    const addCondition = () => {
        onChange({
            ...node,
            children: [...node.children, defaultCondition]
        });
    };

    const addGroup = () => {
        onChange({
            ...node,
            children: [...node.children, { ...defaultGroup }]
        });
    };

    return (
        <>
            {/* <div className="p-3 border rounded bg-gray-100 space-y-3"> */}
            <div className="flex justify-between items-center">
                <strong className="font-semibold">
                    Group {index} : ({node.children.length})
                </strong>

                <FormSelect
                    value={node.operator}
                    options={LOGICAL_OPERATORS.map(o => ({ value: o, label: o }))}
                    onChange={(v) => onChange({ ...node, operator: v })}
                />

                <div className="flex gap-2">
                    <Button size="sm" onClick={addCondition}>+ Condition</Button>
                    <Button size="sm" variant="outline" onClick={addGroup}>+ Group</Button>
                    {onRemove && (
                        <Button size="sm" variant="danger" onClick={onRemove}>
                            - Group
                        </Button>
                    )}
                </div>
            </div>

            <table className="w-full">
                <tbody>
                    {node.children.map((child, i) => (
                        <FilterNodeBuilder
                            key={i}
                            index={i + 1}
                            node={child}
                            fields={fields}
                            onChange={(updated) => updateChild(i, updated)}
                            onRemove={() => removeChild(i)}
                            error={undefined}
                        />
                    ))}
                </tbody>
            </table>
            {/* </div> */}
        </>
    );
};

const DatasetFilterBuilder = ({ name, fields, node, onChange }: FilterBuilderProps) => {

    const updateLinkedGroup = (index: number, updatedFilters: QueryFilter | QueryFilterGroup) => {
        const updated = [...node];
        updated[index] = {
            ...updated[index],
            node: updatedFilters
        };
        onChange(updated);
    };

    const removeLinkedGroup = (index: number) => {
        if (node.length <= 0) return;
        onChange(node.filter((_, i) => i !== index));
    };

    const addLinkedGroup = () => {
        onChange([
            ...node,
            {
                linkWithPrevious: "AND",
                node: {
                    type: "group",
                    operator: "AND",
                    children: []
                }
            }
        ]);
    };

    return (
        <div className="space-y-6">
            <h6 className="font-semibold">{name}</h6>

            {node.map((linkedGroup, i) => {
                return (
                    <div key={i} className="p-4 border rounded-xl bg-gray-50">

                        {i > 0 && (
                            <FormSelect
                                value={linkedGroup.linkWithPrevious || "AND"}
                                options={LOGICAL_OPERATORS.map(o => ({ value: o, label: o }))}
                                onChange={(v) => {
                                    const updated = [...node];
                                    updated[i] = { ...updated[i], linkWithPrevious: v };
                                    onChange(updated);
                                }}
                            />
                        )}

                        <FilterNodeBuilder
                            index={i + 1}
                            node={linkedGroup.node}
                            fields={fields}
                            onChange={(updated) => updateLinkedGroup(i, updated)}
                            onRemove={() => removeLinkedGroup(i)}
                            error={undefined}
                        />
                    </div>
                );
            })}

            <Button size="sm" variant="dark-success" onClick={addLinkedGroup}>
                + New {name} Group
            </Button>
        </div>
    );
};

// FORM RENDER
const RenderFormBuilder = ({ datasets, query, tenants, errors, tenant_id, setErrors, setValue, setPreviewSql }: RenderFormProp) => {

    const [buildError, setBuildError] = useState<string | null>(null);

    const dataset = datasets.find(d => d.id === query.dataset_id) ?? null;
    const fields = dataset?.fields || [];

    const dimensionFields = useMemo(
        () => fields.filter(f => f.field_type === "dimension"),
        [fields]
    );

    const metricFields = useMemo(
        () => fields.filter(f => f.field_type !== "dimension"),
        [fields]
    );

    const validateQuery = useMemo(() => {
        const queryErrors: CompileError = {};
        if (!query?.name?.trim()) queryErrors["query_name"] = "Nom obligatoire !";
        if (!query?.dataset_id) queryErrors["query_dataset"] = "Dataset obligatoire !";

        const hasDimension = (query?.query_json?.select?.dimensions ?? []).length > 0;
        const hasMetric = (query?.query_json?.select?.metrics ?? []).length > 0;

        if (!hasDimension && !hasMetric) {
            queryErrors["dimensions"] = "Dimensions ou Metrics obligatoire !";
            queryErrors["metrics"] = "Metrics ou Dimensions obligatoire !";
        }
        return queryErrors;
    }, [query?.query_json?.select?.dimensions, query?.query_json?.select?.metrics]);

    const SQL_RESERVED = new Set([
        "select", "from", "where", "table",
        "view", "insert", "delete", "update",
        "drop", "create", "alter"
    ]);

    const normalizeName = (value: string) => {
        return value
            .toLowerCase()
            .trim()
            .replace(/\s+/g, "_")
            .replace(/[^a-z0-9_]/g, "")
            .replace(/_+/g, "_")
            .replace(/^_+|_+$/g, "");
    };

    const NAME_REGEX = /^[a-z]+(?:_[a-z0-9]+)*$/;

    const validateName = (value: string) => {
        if (value.length < 3) return "Minimum 3 caractères";
        if (value.length > 63) return "Maximum 63 caractères";
        if (!NAME_REGEX.test(value))
            return "Lettres minuscules, chiffres et underscore uniquement";
        if (SQL_RESERVED.has(value))
            return "Mot réservé SQL";
        return undefined;
    };

    const updateQueryJson = useCallback((patch: Partial<QueryJson>) => {
        let updated: QueryJson = { ...query.query_json, ...patch };

        // Clean order_by ONLY if select changed
        if (updated.select) {
            const allowedFields = [
                ...updated.select.dimensions,
                ...updated.select.metrics
            ];

            updated = {
                ...updated,
                order_by: (updated.order_by || []).filter(o => !o.field || allowedFields.includes(o.field))
            };
        }

        setValue("query_json", updated);

        if (!dataset) return;

        const queryErrors = validateQuery;

        try {
            // QueryJsonSchema.parse(updated);
            const { sql, values, error } = compileDatasetQuery(dataset, fields, updated);

            setErrors({ ...error, ...queryErrors });

            if (Object.keys(error).length === 0) {
                setValue("compiled_sql", sql);
                setValue("values", values);
            } else {
                setValue("compiled_sql", "");
                setValue("values", {});
                console.log(error)
            }
        } catch (err: any) {
            // console.warn("Query invalid:" + err);
            console.log(err);
            setBuildError(err.message);
            setErrors({ ...errors, ...queryErrors, error: err.message });
        }
    }, [query, dataset, fields, setValue]);

    const DEFAULT_FORM = useMemo(() => createDefaultForm(tenant_id), [tenant_id])

    const resetBuilder = useCallback(() => {
        setValue("query_json", DEFAULT_FORM.query_json);
        setValue("compiled_sql", "");
    }, [DEFAULT_FORM.query_json, setValue]);

    const hasSelectJson = useMemo((): boolean => {
        const hasDimension = query?.query_json?.select?.dimensions?.length > 0;
        const hasMetric = query?.query_json?.select?.metrics?.length > 0;
        return hasDimension || hasMetric;
    }, [query?.query_json?.select?.dimensions, query?.query_json?.select?.metrics]);

    const handlenameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const err = { ...errors };
        delete err.query_name;
        setErrors(err);

        const val = e.target.value;
        const invalidName = validateName(val);
        if (invalidName) {
            setErrors({ ...err, query_name: invalidName });
            // return;
        }
        const normalized = normalizeName(val);
        setValue("name", normalized);
    };

    const dimensions = useMemo((): DatasetField[] => {
        return fields.filter(f => f.field_type === "dimension" && !f.aggregation)
    }, [fields]);

    const metrics = useMemo((): DatasetField[] => {
        return fields.filter(f => f.field_type !== "dimension" || f.aggregation)
    }, [fields]);

    return (
        <div className="space-y-6 max-w-5xl">

            {buildError && (<p className="text-red-500 text-sm mt-1">{buildError}</p>)}

            <div className={styles.grid + ' ' + styles.grid3}>
                {/* <FormSelect
                    label="Tenant"
                    value={query.tenant_id || tenant_id}
                    options={tenants.map(t => ({ value: t.id, label: t.name }))}
                    onChange={(v) => {
                        const oldError = { ...errors };
                        delete oldError.query_tenant;
                        setErrors(oldError);
                        setValue("tenant_id", v);
                    }}
                    error={errors.query_tenant}
                    required
                /> */}

                <FormSelect
                    label="Dataset"
                    value={query.dataset_id}
                    options={datasets.map(d => ({ value: d.id, label: d.name }))}
                    onChange={(v) => {
                        const oldError = { ...errors };
                        delete oldError.query_dataset;
                        setErrors(oldError);

                        setValue("dataset_id", v);
                        // const dataset = datasets.find(d => d.id === query.dataset_id) ?? null;
                        // const fields = dataset?.fields ?? [];
                    }}
                    error={errors.query_dataset}
                    required
                />

                <FormInput
                    label="Nom"
                    value={query.name}
                    onChange={e => handlenameChange(e)}
                    required
                    error={errors.query_name}
                />
            </div>

            <div className={styles.grid + ' ' + styles.grid2}>
                {/* Dimensions */}
                <FormMultiSelect
                    label="Dimensions (Group By)"
                    value={query.query_json.select.dimensions}
                    options={dimensions.map(f => ({ value: f.name, label: f.name }))}
                    onChange={(vals) => {
                        const oldError = { ...errors };
                        delete oldError["dimensions"];
                        delete oldError["metrics"];
                        setErrors(oldError);

                        updateQueryJson({ select: { ...query.query_json.select, dimensions: vals || [] } });
                    }}
                    error={errors["dimensions"]}
                />

                {/* Metrics */}
                <FormMultiSelect
                    label="Metrics"
                    value={query.query_json.select.metrics}
                    options={metrics.map(f => ({ value: f.name, label: f.name }))}
                    onChange={(vals) => {
                        const oldError = { ...errors };
                        delete oldError["dimensions"];
                        delete oldError["metrics"];
                        setErrors(oldError);

                        updateQueryJson({ select: { ...query.query_json.select, metrics: vals || [] } });
                    }}
                    error={errors.metrics}
                />
            </div>

            {/* BUILDER */}
            {dataset && (
                // <div className="space-y-6 max-w-4xl">
                <>
                    {hasSelectJson && (
                        <>
                            <div key={"filters_where"} className="p-4 border rounded-xl bg-gray-50">
                                <DatasetFilterBuilder
                                    name="Where Filters"
                                    fields={dimensionFields}
                                    node={query.query_json.filters.where}
                                    onChange={(node) => {
                                        const having = query.query_json.filters.having ?? [];
                                        const filters = { where: node, having: [...having] };
                                        updateQueryJson({ filters });
                                    }}
                                />
                            </div>

                            <div key={"filters_having"} className="p-4 border rounded-xl bg-gray-50">
                                <DatasetFilterBuilder
                                    name="Having Filters"
                                    fields={metricFields}
                                    node={query.query_json.filters.having}
                                    onChange={(node) => {
                                        const where = query.query_json.filters.where ?? [];
                                        const filters = { where: [...where], having: node };
                                        updateQueryJson({ filters });
                                    }}
                                />
                            </div>

                            <DatasetOrderByBuilder
                                fields={fields}
                                orderBy={query.query_json.order_by}
                                onChange={(order_by) => {
                                    const oldError = { ...errors };
                                    delete oldError.order_by;
                                    setErrors(oldError);
                                    updateQueryJson({ order_by });
                                }}
                                error={errors.order_by}
                            />

                            <div className={styles.grid + ' ' + styles.grid3}>
                                <FormInput
                                    label="Limit"
                                    type="number"
                                    value={query.query_json.limit || ""}
                                    onChange={(e: any) => {
                                        const oldError = { ...errors };
                                        delete oldError.limit;
                                        setErrors(oldError);

                                        const value = e.target.value;
                                        updateQueryJson({ limit: value ? Number(value) : null })
                                    }}
                                    error={errors.limit}
                                />

                                <FormInput
                                    label="Offset"
                                    type="number"
                                    value={query.query_json.offset || ""}
                                    onChange={(e: any) => {
                                        const oldError = { ...errors };
                                        delete oldError.offset;
                                        setErrors(oldError);

                                        const value = e.target.value;
                                        updateQueryJson({ offset: value ? Number(value) : null });
                                    }}
                                    error={errors.offset}
                                />
                            </div>
                        </>
                    )}

                    <br />

                    <div className="flex justify-between items-center">
                        <FormSwitch
                            label="Active"
                            checked={query.is_active}
                            onChange={(e) => setValue("is_active", e.target.checked)}
                        />

                        {/* <h2 className="text-lg font-semibold">Query Builder</h2> */}
                        <Button size="sm" variant="outline" onClick={resetBuilder}>
                            <RefreshCw size={14} className="mr-1" />
                            Reset
                        </Button>

                        {/* <span className="font-medium">Compiled SQL</span> */}
                        <Button size="sm" variant="outline" onClick={() => setPreviewSql(query.compiled_sql)}>
                            Preview
                        </Button>
                    </div>

                    {/* <FormTextarea label="Compiled SQL" value={query.compiled_sql} disabled rows={6} /> */}
                </>
            )}

        </div>
    );
};

interface DatasetQueryTabProps {
   tenants:Tenant[];
   tenant_id:number
}
// MAIN PAGE
export const DatasetQueryTab = forwardRef<AdminEntityCrudModuleRef, DatasetQueryTabProps>(({ tenants, tenant_id }, ref) => {
    const [dataset_id, setDatasetId] = useState<number | undefined>();
    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [previewSql, setPreviewSql] = useState<string | null>(null);
    const [previewJson, setPreviewJson] = useState<QueryJson | null>(null);
    const [previewValues, setPreviewValues] = useState<Record<string, any> | null>(null);
    const [errors, setErrors] = useState<CompileError>({});

    const didLoad = useRef(false);


    useEffect(() => {
        if (!tenant_id) return;
        datasetService.all(tenant_id).then(d => setDatasets(d || []));
    }, [tenant_id]);

    // TABLE COLUMNS
    const queryColumns = useMemo(() => getQueryColumns(setPreviewJson, setPreviewSql, setPreviewValues), []);

    const defaultTenant = useMemo(() => {
        return { required: true, ids: [tenant_id, dataset_id] };
    }, [tenant_id, dataset_id]);


    const validateQuery = (q: DatasetQuery) => {
        const queryErrors: CompileError = {};
        if (!q?.name?.trim()) queryErrors["query_name"] = "Nom obligatoire !";
        if (!q?.dataset_id) queryErrors["query_dataset"] = "Dataset obligatoire !";

        const hasDimension = (q?.query_json?.select?.dimensions ?? []).length > 0;
        const hasMetric = (q?.query_json?.select?.metrics ?? []).length > 0;

        if (!hasDimension && !hasMetric) {
            queryErrors["dimensions"] = "Dimensions ou Metrics obligatoire !";
            queryErrors["metrics"] = "Metrics ou Dimensions obligatoire !";
        }
        return queryErrors;
    };

    const formatJsonWithInlineArrays = (obj: any, applyPretty: boolean = false) => {
        const pretty = JSON.stringify(obj, null, 2);

        if (!applyPretty) return pretty;
        return pretty.replace(/\[\s+([\s\S]*?)\s+\]/g, (match) => {
            return match
                .replace(/\n/g, "")
                .replace(/\s+/g, " ")
                .replace(/\s?,\s?/g, ", ");
        }
        );
    };


    const DEFAULT_FORM = useMemo(() => createDefaultForm(tenant_id), [tenant_id])

    // RENDER
    return (
        <>
            <AdminEntityCrudModule<DatasetQuery>
                ref={ref}
                modalSize="yl"
                entityName="DatasetQuery"
                title="Dataset Query Management"
                icon={<Shield size={18} />}
                columns={queryColumns}
                service={queryService}
                defaultTenant={defaultTenant}
                defaultValue={DEFAULT_FORM}
                isValid={(q) => {
                    return Object.keys(errors).length === 0
                }}
                submitValidation={async (q) => {
                    const validationErrors = validateQuery(q);
                    setErrors(validationErrors);
                    return Object.keys(validationErrors).length === 0;
                }}
                headerActions={(
                <FormSelect
                    label={`Dataset List`}
                    value={dataset_id}
                    options={datasets.map((c) => ({ value: c.id, label: c.name }))}
                    onChange={(value) => setDatasetId(value)}
                    placeholder="Sélectionner Dataset"
                    leftIcon={<FaDatabase />}
                    required={true}
                />
                )}
                renderForm={(query, setValue, saving) => (
                    <RenderFormBuilder
                        datasets={datasets}
                        query={query}
                        tenants={tenants}
                        tenant_id={tenant_id}
                        errors={errors}
                        setValue={setValue}
                        setPreviewSql={setPreviewSql}
                        setErrors={setErrors}
                    />
                )}
            />

            {/* SQL PREVIEW *MODAL */}
            <DatasetPreviewModal
                title="SQL Preview"
                open={Boolean(previewSql)}
                data={previewSql || ""}
                onClose={() => setPreviewSql(null)}
                type="sql"
            />

            {/* JSON PREVIEW MODAL */}
            <DatasetPreviewModal
                title="Query JSON"
                open={Boolean(previewJson)}
                data={formatJsonWithInlineArrays(previewJson ?? {})}
                onClose={() => setPreviewJson(null)}
                type="json"
            />

            <DatasetPreviewModal
                title="Query VALUES"
                open={Boolean(previewValues)}
                data={formatJsonWithInlineArrays(previewValues ?? {}, true)}
                onClose={() => setPreviewValues(null)}
                type="json"
            />

        </>
    );
});