import { Shield, Copy, X, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState, forwardRef, useCallback, Key } from "react";
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
import { tenantService } from "@/services/identity.service";
import { datasetService, queryService } from "@/services/dataset.service";
import { Tenant } from "@/models/identity.model";
import { Dataset, DatasetField, DatasetQuery, QueryFilterGroup, QueryFilter, QueryJson, SqlAggType, SqlOperatorsList, SqlOperatorsNoValueList, LinkedFilterGroup, SqlLogicalOperatorList, QueryFilterNode, SqlLogicalOperator, SqlOperators } from "@/models/dataset.models";
import { Modal } from "@/components/ui/Modal/Modal";
import { z } from "zod";

import styles from '@pages/admins/AdminPage.module.css';

interface CompileError {
    view_name?: string;
    dimensions?: string;
    metrics?: string;
    select?: string;
    order_by?: string;
    limit?: string;
    offset?: string;

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

export const QueryFilterConditionSchema = z.object({
    type: z.literal("condition"),
    field: z.string().min(1),
    operator: z.enum(SqlOperatorsList),
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
const createDefaultForm = (): DatasetQuery => ({
    id: null,
    name: "",
    tenant_id: null,
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

const DEFAULT_FORM = createDefaultForm();

const sanitizeIdentifier = (name: string) => {
    // Autorise uniquement lettres, chiffres, underscore, pas de SQL injection
    if (!name) throw new Error("Identifier cannot be empty");
    return name.replace(/[^a-zA-Z0-9_]/g, "_");
};


const escapeSqlString = (val: string): string => val.replace(/'/g, "''");
const isNumeric = (val: string): boolean => val.trim() !== "" && !isNaN(Number(val.replace(",", ".")));
const normalizeNumber = (val: string): number => Number(val.replace(",", "."));
const isISODate = (val: string): boolean => !isNaN(Date.parse(val));
const stripWrappers = (value: string): string => value.replace(/^[\(\[\{]\s*/, "").replace(/\s*[\)\]\}]$/, "");
const removeQuotes = (value: string): string => value.replace(/^['"]+/, "").replace(/['"]+$/, "").trim();

// SMART LIST NORMALIZER 
const normalizeListInput = (input: unknown): string[] => {
    if (Array.isArray(input)) return input.map(v => String(v).trim()).filter(Boolean);
    let value = String(input).trim();
    if (!value) return [];
    // Remove (), [], {}
    value = stripWrappers(value);
    // Normalize separators
    value = value.replace(/;/g, ",");
    // Collapse multiple spaces
    value = value.replace(/\s+/g, " ").trim();
    let parts: string[];
    if (value.includes(",")) {
        parts = value.split(",");
    } else if (value.includes(" ")) {
        parts = value.split(" ");
    } else {
        parts = [value];
    }
    return parts.map(v => removeQuotes(v)).filter(Boolean);
};
// IN CLAUSE FORMATTER
const formatInClause = (input: unknown): string => {
    const values = normalizeListInput(input);
    if (!values.length) return "()";
    const formatted = values.map(v => {
        if (isNumeric(v)) return normalizeNumber(v);
        return `'${escapeSqlString(v)}'`;
    });
    return `(${formatted.join(", ")})`;
};


const quoteIdentifier = (name: string) => `"${name.replace(/"/g, "")}"`;


const generateSqlExpression = (expression: string, aggregation: SqlAggType | null, isDistinct: boolean = false) => {
    if (!expression) return "";
    const DISTINCT = isDistinct ? "DISTINCT " : ""
    if (aggregation) {
        return `${aggregation}(${DISTINCT}${expression})`;
    } else {
        return `${DISTINCT}${expression}`;
    }
}

const formatSqlValue = (rawValue: any): string | number => {
    // NULL direct
    if ([null, "null", undefined, "undefined"].includes(rawValue)) return "NULL";
    // Boolean
    if (typeof rawValue === "boolean") return rawValue ? "TRUE" : "FALSE";
    // Number direct
    if (typeof rawValue === "number") return rawValue;

    const value = String(rawValue).trim();
    if (!value) return "''";

    /* --------------- AUTO NUMBER ----------------- */
    if (isNumeric(value)) return normalizeNumber(value);
    /* ------------------ DATE --------------------- */
    if (isISODate(value)) return `'${escapeSqlString(value)}'`;
    /* ---------------- DEFAULT STRING ------------- */
    return `'${escapeSqlString(removeQuotes(value))}'`;
};

type BuiltFilter = {
    where: string[];
    having: string[];
};

const buildFilterTree = (node: QueryFilterGroup | QueryFilter, fieldMap: Map<string, DatasetField>, values: Record<string, any>, paramIndex: { current: number }): BuiltFilter => {

    const result: BuiltFilter = { where: [], having: [] };

    if (!node) return result;

    if (node.type === "condition") {
        const field = fieldMap.get(node.field);
        if (!field) {
            return result;
            // throw new Error(`Unknown field: ${node.field}`);
        }

        if (!SqlOperatorsList.includes(node.operator)) {
            return result;
            // throw new Error(`Opérateur non autorisé: ${node.operator}`);
        }

        if (!field.field_type) {
            return result;
        }

        const isAggregated = Boolean(field.aggregation);
        const isDimension = field.field_type === "dimension" && !isAggregated;
        const isMetric = ["metric", "calculated_metric"].includes(field.field_type) || isAggregated;

        const baseKey = () => `p_${paramIndex.current++}`;

        const sqlExpression = isDimension ? field.expression : generateSqlExpression(field.expression, field.aggregation);
        let clause = "";

        // SqlAggragateOperatorsList

        if (node.operator === "BETWEEN") {
            const k1 = baseKey();
            const k2 = baseKey();

            const formattedValue = formatSqlValue(node.value);
            const formattedValue2 = formatSqlValue(node.value2);

            values[k1] = formattedValue;
            values[k2] = formattedValue2;
            clause = `${sqlExpression} BETWEEN :${k1} AND :${k2}`;
        } else if (node.operator === "IN") {
            const normalizedValues = normalizeListInput(node.value);
            if (!Array.isArray(normalizedValues)) {
                throw new Error("IN operator requires array value.");
            }

            const keys = normalizedValues.map((v, idx: number) => {
                const key = baseKey();
                values[key] = formatSqlValue(v);
                return `:${key}`;
            });
            clause = `${sqlExpression} IN (${keys.join(", ")})`;
        } else if (SqlOperatorsNoValueList.includes(node.operator)) {
            // "IS NULL", "IS NOT NULL", "IS TRUE", "IS NOT TRUE"
            clause = `${sqlExpression} ${node.operator}`;
        } else {
            const formatedValue = formatSqlValue(node.value);
            if (formatedValue === "NULL") {
                clause = `${sqlExpression} ${node.operator} NULL`;
            } else if (formatedValue === "TRUE") {
                clause = `${sqlExpression} ${node.operator} TRUE`;
            } else if (formatedValue === "FALSE") {
                clause = `${sqlExpression} ${node.operator} FALSE`;
            } else {
                values[baseKey()] = formatSqlValue(node.value);
                clause = `${sqlExpression} ${node.operator} :${baseKey()}`;
            }
        }

        if (!clause) return result;

        if (isMetric) {
            result.having.push(clause);
        } else {
            result.where.push(clause);
        }

        return result;
    }

    // ----- GROUP
    if (node.type === "group") {
        const whereParts: string[] = [];
        const havingParts: string[] = [];

        for (const child of node.children) {
            const built = buildFilterTree(child, fieldMap, values, paramIndex);

            if (built.where.length > 0) {
                whereParts.push(built.where.join(" "));
            }

            if (built.having.length > 0) {
                havingParts.push(built.having.join(" "));
            }
        }

        if (whereParts.length === 1) {
            result.where.push(whereParts[0]);
        } else if (whereParts.length > 1) {
            result.where.push(`(${whereParts.join(` ${node.operator} `)})`);
        }

        if (havingParts.length === 1) {
            result.having.push(havingParts[0]);
        } else if (havingParts.length > 1) {
            result.having.push(`(${havingParts.join(` ${node.operator} `)})`);
        }
    }

    return result;
};

// --- BUILD MULTI-GROUPS ---
// const buildLinkedFilterGroups = (groups: LinkedFilterGroup[], fieldMap: Map<string, DatasetField>, values: Record<string, any>, paramIndex: { current: number }): BuiltFilter => {

//     const result: BuiltFilter = { where: [], having: [] };

//     if (!groups || groups.length === 0) return result;

//     let whereParts: string[] = [];
//     let havingParts: string[] = [];

//     groups.forEach((group, i) => {

//         if (i === 0 && group.linkWithPrevious) {
//             throw new Error("First group cannot have linkWithPrevious");
//         }

//         const built = buildFilterTree(group.node, fieldMap, values, paramIndex);

//         // const whereClause = built.where.length > 0
//         //     ? `(${built.where.join(` ${group.node.operator || "AND"} `)})`
//         //     : "";

//         // const havingClause = built.having.length > 0
//         //     ? `(${built.having.join(` ${group.node.operator || "AND"} `)})`
//         //     : "";

//         // if (whereClause) {
//         //     if (i === 0) {
//         //         whereParts.push(whereClause);
//         //     } else {
//         //         const link = group.linkWithPrevious || "AND";
//         //         whereParts.push(` ${link} ${whereClause}`);
//         //     }
//         // }

//         // if (havingClause) {
//         //     if (i === 0) {
//         //         havingParts.push(havingClause);
//         //     } else {
//         //         const link = group.linkWithPrevious || "AND";
//         //         havingParts.push(` ${link} ${havingClause}`);
//         //     }
//         // }


//         const link = i === 0 ? "" : ` ${group.linkWithPrevious || "AND"} `;

//         if (built.where.length > 0) {
//             whereParts.push(
//                 `${link}${built.where.length > 1 ? `(${built.where.join(` ${group.node.operator || "AND"} `)})` : built.where[0]}`
//             );
//         }

//         if (built.having.length > 0) {
//             havingParts.push(
//                 `${link}${built.having.length > 1 ? `(${built.having.join(` ${group.node.operator || "AND"} `)})` : built.having[0]}`
//             );
//         }
//     });

//     if (whereParts.length > 0) {
//         result.where.push(whereParts.join(""));
//     }
//     if (havingParts.length > 0) {
//         result.having.push(havingParts.join(""));
//     }

//     return result;
// };

const buildLinkedFilterGroups = (groups: LinkedFilterGroup[], fieldMap: Map<string, DatasetField>, values: Record<string, any>, paramIndex: { current: number }): BuiltFilter => {

    const result: BuiltFilter = { where: [], having: [] };

    if (!groups?.length) return result;

    // ---- WHERE ----
    const whereGroups = groups.filter(g =>
        buildFilterTree(g.node, fieldMap, values, { current: paramIndex.current }).where.length > 0
    );

    let whereExpr = "";

    whereGroups.forEach((group, i) => {
        const built = buildFilterTree(group.node, fieldMap, values, paramIndex);
        const clause = built.where.length > 1
            ? `(${built.where.join(` ${group.node.operator || "AND"} `)})`
            : built.where[0];

        if (i === 0) {
            whereExpr = clause;
        } else {
            const link = group.linkWithPrevious || "AND";
            whereExpr += ` ${link} ${clause}`;
        }
    });

    if (whereExpr) result.where.push(whereExpr);

    // ---- HAVING ----
    const havingGroups = groups.filter(g =>
        buildFilterTree(g.node, fieldMap, values, { current: paramIndex.current }).having.length > 0
    );

    let havingExpr = "";

    havingGroups.forEach((group, i) => {
        const built = buildFilterTree(group.node, fieldMap, values, paramIndex);
        const clause = built.having.length > 1
            ? `(${built.having.join(` ${group.node.operator || "AND"} `)})`
            : built.having[0];

        if (i === 0) {
            havingExpr = clause;
        } else {
            const link = group.linkWithPrevious || "AND";
            havingExpr += ` ${link} ${clause}`;
        }
    });

    if (havingExpr) result.having.push(havingExpr);

    return result;
};

// SQL COMPILER
const compileDatasetQuery = (dataset: Dataset, fields: DatasetField[], query: QueryJson): CompiledQuery => {

    // QueryJsonSchema.parse(query);

    const compile: CompiledQuery = { sql: "", values: {}, error: {} }

    if (!dataset?.view_name) {
        compile.error.view_name = "Dataset invalide.";
        return compile;
    }

    const aliasMap = new Map<string, string>();

    const fieldMap = new Map(fields.map(f => [f.name, f]));
    const values: Record<string, unknown> = {};
    const paramIndex = { current: 0 };

    const select: string[] = [];
    const groupBy: string[] = [];
    const where: string[] = [];
    const having: string[] = [];
    const { dimensions = [], metrics = [] } = query.select;

    if (dimensions.length === 0 && metrics.length === 0) {
        const errorMsg = "At least one dimension or metric required.";
        compile.error.dimensions = errorMsg;
        compile.error.metrics = errorMsg;
        return compile;
    }

    // ---- SELECT DIMENSIONS
    for (const dim of dimensions) {
        const field = fieldMap.get(dim);
        if (!field || !field.field_type || field.field_type !== "dimension") continue;

        const alias = quoteIdentifier(field.name);
        select.push(`${field.expression} AS ${alias}`);
        groupBy.push(field.expression);

        aliasMap.set(field.name, alias);
    }

    // ---- SELECT METRICS
    for (const met of metrics) {
        const field = fieldMap.get(met);
        if (!field || !field.field_type || !["metric", "calculated_metric"].includes(field.field_type)) continue;

        const alias = quoteIdentifier(field.name);
        const sqlExpression = generateSqlExpression(field.expression, field.aggregation);
        select.push(`${sqlExpression} AS ${alias}`);

        aliasMap.set(field.name, alias);
    }

    if (select.length === 0) {
        compile.error.select = "Au moins un champ doit être sélectionné.";
        return compile;
    }

    const queryFilters = [...(query.filters?.where ?? []), ...(query.filters?.having ?? [])];

    if (queryFilters.length > 0) {
        const built = buildLinkedFilterGroups(
            queryFilters,
            fieldMap,
            values,
            paramIndex
        );
        where.push(...built.where);
        having.push(...built.having);
    }

    const order_by_errors: string[] = [];

    // ---- ORDER BY
    const orderBy = query.order_by && query.order_by.length > 0
        ? `ORDER BY ${query.order_by
            .filter(o => {
                if (!fieldMap.get(o.field)) {
                    order_by_errors.push(`Invalid ORDER BY field: ${o.field}`);
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

    if (typeof query.limit === "number" && query.limit <= 0) {
        compile.error.limit = "Limit doit être un entier positif!";
        return compile;
    }

    if (typeof query.offset === "number" && query.offset < 0) {
        compile.error.offset = "Offset doit être ≥ 0!";
        return compile;
    }

    // ---- LIMIT / OFFSET
    const isLimit = typeof query.limit === "number" && query.limit > 0;
    const limit = isLimit ? `LIMIT ${query.limit}` : "";

    const isOffset = typeof query.offset === "number" && query.offset >= 0;
    const offset = isOffset ? `OFFSET ${query.offset}` : "";

    const hasGroupBy = metrics.length > 0 && groupBy.length;

    // ---- FINAL SQL
    const sql = [
        "SELECT",
        `  ${select.join(",\n  ")}`,
        `FROM ${quoteIdentifier(dataset.view_name)}`,
        where.length ? `WHERE ${where.join(" \n ")}` : "",
        hasGroupBy ? `GROUP BY ${groupBy.join(", ")}` : "",
        having.length > 0 ? `HAVING ${having.join(" \n ")}` : "",
        orderBy,
        limit,
        offset
    ].filter(Boolean).join("\n").trim();

    compile.error = {};
    compile.sql = sql;
    compile.values = values;

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

            {orderBy?.map((o, i) => (
                <div key={i} className="flex gap-2 items-center">

                    <span className="text-xs text-gray-500 w-6">
                        {i + 1}
                    </span>

                    <FormSelect
                        value={o.field}
                        options={fields.map(f => ({
                            value: f.name,
                            label: f.name
                        }))}
                        onChange={(v) => update(i, { field: v })}
                        error={error}
                    />

                    <FormSelect
                        value={o.direction}
                        options={[
                            { value: "asc", label: "ASC" },
                            { value: "desc", label: "DESC" }
                        ]}
                        onChange={(v) => update(i, { direction: v })}
                    />

                    <Button size="sm" variant="outline" onClick={() => remove(i)}>
                        ✕
                    </Button>
                </div>
            ))}
        </div>
    );
};

const FilterNodeBuilder = ({ index, node, fields, onChange, onRemove }: FilterNodeBuilderProps) => {

    const defaultCondition: QueryFilter = {
        type: "condition",
        field: "",
        operator: "=",
        value: ""
    };

    const defaultGroup: QueryFilterGroup = {
        type: "group",
        operator: "AND",
        children: []
    };

    if (!node) return null;

    if (node.type === "condition") {
        return (
            <div className="flex gap-2 items-center">
                <span className="text-xs text-gray-500 w-6">{index}</span>
                <FormSelect
                    value={node.field}
                    options={fields.map(f => ({ value: f.name, label: f.name }))}
                    onChange={(v) => onChange({ ...node, field: v })}
                />

                <FormSelect
                    value={node.operator}
                    options={SqlOperatorsList.map(o => ({ value: o, label: o }))}
                    onChange={(v) => onChange({ ...node, operator: v })}
                />

                {!SqlOperatorsNoValueList.includes(node.operator) && (
                    <>
                        <FormInput
                            value={node.value ?? ""}
                            onChange={(e: any) => onChange({ ...node, value: e.target.value })}
                        />

                        {node.operator === "BETWEEN" && (
                            <FormInput
                                value={node.value2 ?? ""}
                                onChange={(e: any) => onChange({ ...node, value2: e.target.value })}
                            />
                        )}
                    </>
                )}

                {onRemove && (
                    <Button style={{ "padding": "6px 8px", "marginBottom": "12px" }} size="sm" variant="danger" onClick={onRemove}>
                        ✕
                    </Button>
                )}
            </div>
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
        <div className="p-3 border rounded bg-gray-100 space-y-3">

            <div className="flex justify-between items-center">
                <strong className="font-semibold">
                    Group {index} : ({node.children.length})
                </strong>
                <FormSelect
                    value={node.operator}
                    options={SqlLogicalOperatorList.map(o => ({ value: o, label: o }))}
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
        </div>
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
        if (node.length <= 1) return;
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

            {node.map((linkedGroup, i) => (
                <div key={i} className="p-4 border rounded-xl bg-gray-50">

                    {i > 0 && (
                        <FormSelect
                            value={linkedGroup.linkWithPrevious || "AND"}
                            options={SqlLogicalOperatorList.map(o => ({ value: o, label: o }))}
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
            ))}

            <Button size="sm" variant="dark-success" onClick={addLinkedGroup}>
                + New {name} Group
            </Button>
        </div>
    );
};

interface RenderFormProp {
    datasets: Dataset[],
    query: DatasetQuery,
    tenants: Tenant[],
    errors: CompileError,
    setValue: (k: keyof DatasetQuery, v: any) => void,
    setTenantId: (tenant: number | undefined) => void,
    setPreviewSql: (sql: string | null) => void
    setErrors: (error: CompileError) => void
}

// FORM RENDER
const RenderFormBuilder = ({ datasets, query, tenants, errors, setErrors, setValue, setTenantId, setPreviewSql }: RenderFormProp) => {


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

    const updateQueryJson = useCallback((patch: Partial<QueryJson>) => {
        let updated: QueryJson = { ...query.query_json, ...patch };

        // Clean order_by ONLY if select changed
        if (patch.select) {
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

        console.log("UPDATE")
        console.log(updated)

        if (!dataset) return;

        try {
            // QueryJsonSchema.parse(updated);
            const { sql, values, error } = compileDatasetQuery(dataset, fields, updated);

            setErrors(error);

            if (Object.keys(error).length === 0) {
                setValue("compiled_sql", sql);
                setValue("values", values);
            } else {
                setValue("compiled_sql", "");
            }
        } catch (err) {
            // console.warn("Query invalid:" + err);
        }
    }, [query, dataset, fields, setValue]);

    const resetBuilder = useCallback(() => {
        setValue("query_json", DEFAULT_FORM.query_json);
        setValue("compiled_sql", "");
    }, [DEFAULT_FORM.query_json, setValue]);

    const hasSelectJson = (): boolean => {
        const hasDimension = query.query_json.select.dimensions.length > 0;
        const hasMetric = query.query_json.select.metrics.length > 0;
        return hasDimension || hasMetric;
    }

    return (
        <div className="space-y-6 max-w-5xl">

            <div className={styles.grid + ' ' + styles.grid3}>
                <FormSelect
                    label="Tenant"
                    value={query.tenant_id}
                    options={tenants.map(t => ({ value: t.id, label: t.name }))}
                    onChange={(v) => {
                        const oldError = { ...errors };
                        delete oldError.query_tenant;
                        setErrors(oldError);

                        setValue("tenant_id", v);
                        if (v) setTenantId(v);
                    }}
                    error={errors.query_tenant}
                    required
                />

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
                    onChange={e => {
                        const oldError = { ...errors };
                        delete oldError.query_name;
                        setErrors(oldError);

                        setValue("name", e.target.value)
                    }}
                    required
                    error={errors.query_name}
                />
            </div>

            <div className={styles.grid + ' ' + styles.grid2}>
                {/* Dimensions */}
                <FormMultiSelect
                    label="Dimensions (Group By)"
                    value={query.query_json.select.dimensions}
                    options={fields.filter(f => f.field_type === "dimension").map(f => ({ value: f.name, label: f.name }))}
                    onChange={(vals) => {
                        const oldError = { ...errors };
                        delete oldError.dimensions;
                        delete oldError.metrics;
                        setErrors(oldError);

                        updateQueryJson({ select: { ...query.query_json.select, dimensions: vals || [] } })
                    }}
                    error={errors.dimensions}
                />

                {/* Metrics */}
                <FormMultiSelect
                    label="Metrics"
                    value={query.query_json.select.metrics}
                    options={fields.filter(f => f.field_type !== "dimension").map(f => ({ value: f.name, label: f.name }))}
                    onChange={(vals) => {
                        const oldError = { ...errors };
                        delete oldError.dimensions;
                        delete oldError.metrics;
                        setErrors(oldError);

                        updateQueryJson({ select: { ...query.query_json.select, metrics: vals || [] } })
                    }}
                    error={errors.metrics}
                />
            </div>

            {/* BUILDER */}
            {dataset && (
                // <div className="space-y-6 max-w-4xl">
                <>

                    {hasSelectJson() && (
                        <>
                            <div key={"filters_where"} className="p-4 border rounded-xl bg-gray-50">
                                <DatasetFilterBuilder
                                    name="Where Filter"
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
                                    name="Having Filter"
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


// MAIN PAGE
export const DatasetQueryTab = forwardRef<AdminEntityCrudModuleRef>((props, ref) => {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [tenantId, setTenantId] = useState<number | undefined>();
    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [previewSql, setPreviewSql] = useState<string | null>(null);
    const [previewJson, setPreviewJson] = useState<QueryJson | null>(null);
    const [previewValues, setPreviewValues] = useState<Record<string, any> | null>(null);
    const [errors, setErrors] = useState<CompileError>({});

    const loadDatasets = async (tenant_id: number | undefined) => {
        if (!tenant_id) return;
        const ds = await datasetService.all(tenant_id);
        setDatasets(ds || []);
    };

    const loadTenants = async () => {
        const t = await tenantService.all();
        setTenants(t || []);
        if (t?.length) setTenantId(t[0].id ?? undefined);
    };

    // LOAD DATA
    useEffect(() => {
        loadTenants();
    }, []);

    useEffect(() => {
        loadDatasets(tenantId);
    }, [tenantId]);

    // TABLE COLUMNS
    const queryColumns = useMemo(() => getQueryColumns(setPreviewJson, setPreviewSql, setPreviewValues), []);

    const defaultTenantConfig = useMemo(() => ({
        required: true,
        id: tenantId
    }), [tenantId]);

    const renderForm = useCallback((query: DatasetQuery, setValue: any, saving: boolean) => (
        <RenderFormBuilder
            datasets={datasets}
            query={query}
            tenants={tenants}
            errors={errors}
            setValue={setValue}
            setTenantId={setTenantId}
            setPreviewSql={setPreviewSql}
            setErrors={setErrors}
        />
    ),
        [datasets, tenants, errors]
    );

    const validateQuery = (q: DatasetQuery): CompileError => {
        const errors: CompileError = {};

        if (!q.name?.trim()) {
            errors.query_name = "Nom obligatoire !";
        }

        if (!q.dataset_id) {
            errors.query_dataset = "Dataset obligatoire !";
        }

        const hasSelect =
            q.query_json.select.dimensions.length > 0 ||
            q.query_json.select.metrics.length > 0;

        if (!hasSelect) {
            errors.dimensions = "Dimensions ou Metrics obligatoire !";
            errors.metrics = "Metrics ou Dimensions obligatoire !";
        }

        return errors;
    };


    // RENDER
    return (
        <>
            <AdminEntityCrudModule<DatasetQuery>
                ref={ref}
                modalSize="lg"
                title="Dataset Query Management"
                icon={<Shield size={18} />}
                entityName="DatasetQuery"
                columns={queryColumns}
                defaultValue={useMemo(() => DEFAULT_FORM, [])}
                service={queryService}
                defaultTenant={defaultTenantConfig}
                isValid={(q) => Object.keys(validateQuery(q)).length === 0}
                submitValidation={async (q) => {
                    const validationErrors = validateQuery(q);
                    setErrors(validationErrors);

                    return Object.keys(validationErrors).length === 0;
                }}
                renderForm={renderForm}
            />

            {/* SQL PREVIEW *MODAL */}
            <DatasetPreviewModal
                title="SQL Preview"
                open={Boolean(previewSql)}
                data={previewSql || ""}
                type="sql"
                onClose={() => setPreviewSql(null)}
            />

            {/* JSON PREVIEW MODAL */}
            <DatasetPreviewModal
                title="Query JSON"
                open={Boolean(previewJson)}
                data={JSON.stringify(previewJson ?? {}, null, 2)}
                type="json"
                onClose={() => setPreviewJson(null)}
            />

            <DatasetPreviewModal
                title="Query VALUES"
                open={Boolean(previewValues)}
                data={JSON.stringify(previewValues ?? {}, null, 2)}
                type="json"
                onClose={() => setPreviewValues(null)}
            />

        </>
    );
});