import { Shield, Copy, X, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState, forwardRef } from "react";
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
import { Dataset, DatasetField, DatasetQuery, QueryJson, SqlOperatorsList, SqlOperatorsNoValueList } from "@/models/dataset.models";
import { Modal } from "@/components/ui/Modal/Modal";
import { z } from "zod";

interface CompiledQuery { sql: string; values: Record<string, any>; }
interface SqlPreviewProps { title:string; open: boolean; data: string | null; type: "sql" | "json"; onClose: () => void; }
interface FilterBuilderProps { fields: DatasetField[]; filters: QueryJson["filters"]; onChange: (filters: QueryJson["filters"]) => void; }

const AVAILABLE_OPERATORS = ["=", "!=", ">", "<", ">=", "<=", "LIKE", "IN", "BETWEEN"];
const ALLOWED_OPERATORS = new Set(AVAILABLE_OPERATORS);

export const QueryFilterSchema = z.object({
    field: z.string().min(1),
    operator: z.enum(AVAILABLE_OPERATORS),
    value: z.any(),
    value2: z.any().optional()
}).superRefine((val, ctx) => {
    if (val.operator === "BETWEEN" && val.value2 === undefined) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "BETWEEN requires value2"
        });
    }
});

export const QueryJsonSchema = z.object({
    select: z.object({
        dimensions: z.array(z.string()),
        metrics: z.array(z.string())
    }),
    filters: z.array(QueryFilterSchema),
    order_by: z.array(
        z.object({
            field: z.string(),
            direction: z.enum(["asc", "desc"])
        })
    ).optional(),
    limit: z.number().positive().optional(),
    offset: z.number().nonnegative().optional()
});


// DEFAULT FORM
const DEFAULT_FORM: DatasetQuery = {
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
        filters: [],
        limit: null,
        offset: null
    },
    compiled_sql: "",
    values: {},
    description: "",
    is_active: true
};

const quoteIdentifier = (id: string) => `"${id.replace(/"/g, "")}"`;

const isMetricField = (f: DatasetField) => f.field_type === "metric" || f.field_type === "calculated_metric";

// SQL COMPILER
const compileDatasetQuery = (dataset: Dataset, fields: DatasetField[], query: QueryJson): CompiledQuery => {

    if (!dataset?.view_name) {
        throw new Error("Dataset invalide.");
    }

    // QueryJsonSchema.parse(query);

    const fieldMap = new Map(fields.map(f => [f.name, f]));

    const select: string[] = [];
    const groupBy: string[] = [];
    const where: string[] = [];
    const having: string[] = [];
    const values: Record<string, unknown> = {};

    const { dimensions, metrics } = query.select;
    if (!dimensions.length && !metrics.length) {
        throw new Error("At least one dimension or metric required.");
    }

    // ---- SELECT DIMENSIONS
    for (const name of dimensions) {
        const field = fieldMap.get(name);
        if (!field || field.field_type !== "dimension") continue;

        const alias = quoteIdentifier(field.name);

        select.push(`${field.expression} AS ${alias}`);
        groupBy.push(field.expression);
        // groupByParts.push(name);
    }

    // ---- SELECT METRICS
    for (const name of metrics) {
        const field = fieldMap.get(name);
        if (!field || !isMetricField(field)) continue;

        const alias = quoteIdentifier(field.name);

        if (field.aggregation) {

            // if (field.aggregation === "COUNT_DISTINCT") {
            //     select.push(`COUNT(DISTINCT ${field.expression}) AS ${alias}`);
            // } else {
            //     select.push(`${field.aggregation}(${field.expression}) AS ${alias}`);
            // }
            select.push(`${field.aggregation}(${field.expression}) AS ${alias}`);
        } else {
            select.push(`${field.expression} AS ${alias}`);
        }
    }

    if (select.length === 0) {
        throw new Error("Au moins un champ doit être sélectionné.");
    }

    // ---- FILTERS
    query.filters.forEach((filter, i) => {
        const field = fieldMap.get(filter.field);
        if (!field) return;

        if (!ALLOWED_OPERATORS.has(filter.operator.toUpperCase())) {
            throw new Error(`Opérateur non autorisé: ${filter.operator}`);
        }

        const baseKey = `p_${i}`;

        let clause = "";

        if (filter.operator === "BETWEEN") {

            values[`${baseKey}_1`] = filter.value;
            values[`${baseKey}_2`] = filter.value2;

            clause = `${field.expression} BETWEEN :${baseKey}_1 AND :${baseKey}_2`;

        } else if (filter.operator === "IN") {

            if (!Array.isArray(filter.value)) {
                throw new Error("IN operator requires array value.");
            }

            const keys = filter.value.map((v: any, idx: number) => {
                const k = `${baseKey}_${idx}`;
                values[k] = v;
                return `:${k}`;
            });

            clause = `${field.expression} IN (${keys.join(", ")})`;

        } else {

            values[baseKey] = filter.value;
            clause = `${field.expression} ${filter.operator} :${baseKey}`;
        }

        if (field.field_type === "dimension") {
            where.push(clause);
        } else {
            having.push(clause);
        }
    });

    // ---- ORDER BY
    const orderBy = query.order_by?.length
        ? `ORDER BY ${query.order_by
            .map(o => {
                const field = fieldMap.get(o.field);
                if (!field) return null;
                return `${field.expression} ${o.direction === "desc" ? "DESC" : "ASC"}`;
            })
            .filter(Boolean)
            .join(", ")}`
        : "";

    // ---- LIMIT / OFFSET
    const limit =
        query.limit !== null && query.limit !== undefined
            ? `LIMIT ${Math.max(0, Number(query.limit))}`
            : "";

    const offset =
        query.offset !== null && query.offset !== undefined
            ? `OFFSET ${Math.max(0, Number(query.offset))}`
            : "";



    // ---- FINAL SQL
    const sql = `
SELECT
  ${select.join(",\n  ")}
FROM ${dataset.view_name}
${where.length ? `WHERE ${where.join(" AND ")}` : ""}
${metrics.length > 0 && groupBy.length ? `GROUP BY ${groupBy.join(", ")}` : ""}
${having.length ? `HAVING ${having.join(" AND ")}` : ""}
${orderBy}
${limit}
${offset}
`.trim();

    return { sql, values };
}

// FILTER BUILDER
const DatasetFilterBuilder = ({ fields, filters, onChange }: FilterBuilderProps) => {

    const add = () => {
        onChange([...filters, { field: "", operator: "=", value: "" }]);
    };

    const update = (index: number, patch: Partial<typeof filters[number]>) => {
        const updated = [...filters];
        updated[index] = { ...updated[index], ...patch };
        onChange(updated);
    };

    const remove = (index: number) => {
        onChange(filters.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-4 border rounded-xl p-4 bg-gray-50">
            <div className="flex justify-between items-center">
                <h6 className="font-semibold">
                    Filters ({filters.length})
                </h6>
                <Button size="sm" onClick={add}>+ Add Filter</Button>
            </div>

            {filters.map((f, i) => (
                <div key={i} className="flex gap-2 items-center">
                    <FormSelect
                        value={f.field}
                        options={fields.map(field => ({
                            value: field.name,
                            label: field.name
                        }))}
                        onChange={(v) => update(i, { field: v })}
                    />

                    <FormSelect
                        value={f.operator}
                        options={SqlOperatorsList.map(o => ({ value: o, label: o }))}
                        onChange={(v) => update(i, { operator: v })}
                    />

                    {!SqlOperatorsNoValueList.includes(f.operator) && (
                        <>
                            <FormInput
                                value={f.value}
                                onChange={(e: any) => update(i, { value: e.target.value })}
                            />

                            {f.operator === "BETWEEN" && (<FormInput
                                value={f.value2}
                                onChange={(e: any) => update(i, { value: e.target.value })}
                            />)}
                        </>
                    )}

                    <Button size="sm" variant="outline" onClick={() => remove(i)}>
                        ✕
                    </Button>
                </div>
            ))}
        </div>
    );
};

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

// MAIN PAGE
export const DatasetQueryTab = forwardRef<AdminEntityCrudModuleRef>((props, ref) => {

    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [tenantId, setTenantId] = useState<number | undefined>();
    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [previewSql, setPreviewSql] = useState<string | null>(null);
    const [previewJson, setPreviewJson] = useState<QueryJson|null>(null);
    const [previewValues, setPreviewValues] = useState<Record<string,any>|null>(null);
    

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

    // FORM RENDER
    const renderForm = (query: DatasetQuery, setValue: (k: keyof DatasetQuery, v: any) => void) => {

        // const dataset = datasets.find(d => d.id === query.dataset_id);
        const dataset = useMemo(
            () => datasets.find(d => d.id === query.dataset_id) ?? null,
            [datasets, query.dataset_id]
        );
        const fields = dataset?.fields || [];
        // const dimensions = fields.filter(f => f.field_type === "dimension");
        // const metrics = fields.filter(f => f.field_type === "metric" || f.field_type === "calculated_metric");

        const updateQueryJson = (patch: Partial<QueryJson>) => {
            const updated = { ...query.query_json, ...patch };
            setValue("query_json", updated);

            if (!dataset) return;

            try {
                const { sql, values } = compileDatasetQuery(dataset, fields, updated);
                setValue("compiled_sql", sql);
                setValue("values", values);
            } catch (err) {
                console.error(err);
            }
        };

        const resetBuilder = () => {
            setValue("query_json", DEFAULT_FORM.query_json);
            setValue("compiled_sql", "");
        };

        return (
            <div className="space-y-6 max-w-5xl">

                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Query Builder</h2>
                    <Button size="sm" variant="outline" onClick={resetBuilder}>
                        <RefreshCw size={14} className="mr-1" />
                        Reset
                    </Button>
                </div>

                <FormSelect
                    label="Tenant"
                    value={query.tenant_id}
                    options={tenants.map(t => ({ value: t.id, label: t.name }))}
                    onChange={(v) => {
                        setValue("tenant_id", v);
                        if (v) setTenantId(v);
                    }}
                    required
                />

                <FormSelect
                    label="Dataset"
                    value={query.dataset_id}
                    options={datasets.map(d => ({ value: d.id, label: d.name }))}
                    onChange={(v) => {
                        setValue("dataset_id", v);
                        // const dataset = datasets.find(d => d.id === query.dataset_id) ?? null;
                        // const fields = dataset?.fields ?? [];
                    }}
                    required
                />

                <FormInput
                    label="Nom"
                    value={query.name}
                    onChange={e => setValue("name", e.target.value)}
                    required
                />

                {/* BUILDER */}
                {dataset && (
                    // <div className="space-y-6 max-w-4xl">
                    <>
                        {/* Dimensions */}
                        <FormMultiSelect
                            label="Dimensions (Group By)"
                            value={query.query_json.select.dimensions}
                            options={fields.filter(f => f.field_type === "dimension").map(f => ({
                                value: f.name,
                                label: f.name
                            }))}
                            onChange={(vals) =>
                                updateQueryJson({
                                    select: { ...query.query_json.select, dimensions: vals || [] }
                                })
                            }
                        />

                        {/* Metrics */}
                        <FormMultiSelect
                            label="Metrics"
                            value={query.query_json.select.metrics}
                            options={fields.filter(f => f.field_type !== "dimension").map(f => ({
                                value: f.name,
                                label: f.name
                            }))}
                            onChange={(vals) =>
                                updateQueryJson({
                                    select: { ...query.query_json.select, metrics: vals || [] }
                                })
                            }
                        />

                        <DatasetFilterBuilder
                            fields={fields}
                            filters={query.query_json.filters}
                            onChange={(filters) => updateQueryJson({ filters })}
                        />

                        <FormInput
                            label="Limit"
                            type="number"
                            value={query.query_json.limit || ""}
                            onChange={(e: any) => {
                                const value = e.target.value;
                                updateQueryJson({ limit: value ? Number(value) : null })
                            }}
                        />

                        <div className="space-y-2">
                            <br />
                            <div className="flex justify-between items-center">
                                <span className="font-medium">Compiled SQL</span>
                                <Button size="sm" variant="outline" onClick={() => setPreviewSql(query.compiled_sql)}>
                                    Preview
                                </Button>
                            </div>

                            {/* <FormTextarea
                                label="Compiled SQL"
                                value={query.compiled_sql}
                                disabled
                                rows={6}
                            /> */}
                        </div>
                    </>
                )}

                <FormSwitch
                    label="Active"
                    checked={query.is_active}
                    onChange={(e) => setValue("is_active", e.target.checked)}
                />
            </div>
        );
    };

    // RENDER
    return (
        <>
            <AdminEntityCrudModule<DatasetQuery>
                ref={ref}
                title="Dataset Query Management"
                icon={<Shield size={18} />}
                entityName="DatasetQuery"
                columns={queryColumns}
                defaultValue={DEFAULT_FORM}
                service={queryService}
                defaultTenant={{ required: true, id: tenantId }}
                isValid={(q) =>
                    Boolean(
                        q.name?.trim() &&
                        q.dataset_id &&
                        (
                            q.query_json.select.dimensions.length > 0 ||
                            q.query_json.select.metrics.length > 0
                        )
                    )
                }
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
                data={JSON.stringify(previewJson??{}, null, 2)} 
                type="json" 
                onClose={() => setPreviewJson(null)} 
            />

            <DatasetPreviewModal 
                title="Query VALUES" 
                open={Boolean(previewValues)} 
                data={JSON.stringify(previewValues??{}, null, 2)} 
                type="json" 
                onClose={() => setPreviewValues(null)} 
            />

        </>
    );
});