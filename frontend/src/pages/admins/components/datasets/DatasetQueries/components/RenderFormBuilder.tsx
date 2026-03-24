import { FormMultiSelect } from "@/components/forms/FormSelect/FormMultiSelect";
import { FormSelect } from "@/components/forms/FormSelect/FormSelect";
import { FormSwitch } from "@/components/forms/FormSwitch/FormSwitch";
import { QueryJson, DatasetField, AGGRAGATE_TYPES, SqlAggType, DatasetQuery } from "@/models/dataset.models";
import { useState, useMemo, useCallback } from "react";
import { RenderFormProp, CompileError } from "./model";
import { compileDatasetQuery } from "./compileDatasetQuery";
import styles from '@pages/admins/AdminPage.module.css';
import { FormInput } from "@/components/forms/FormInput/FormInput";
import { DatasetFilterBuilder } from "./DatasetFilterBuilder";
import { DatasetOrderByBuilder } from "./DatasetOrderByBuilder";
import { Button } from "@/components/ui/Button/Button";
import { RefreshCw } from "lucide-react";
import { MoreVertical } from "lucide-react";
import { Trash2 } from "lucide-react";
import { Pencil } from "lucide-react";

// FORM RENDER
export const RenderFormBuilder = ({ datasets, query, tenants, errors, tenant_id, defaultForm, setErrors, setValue, setPreviewSql, hideFilters = false }: RenderFormProp) => {
    const [_query, setQuery] = useState<DatasetQuery>(query);
    const [buildError, setBuildError] = useState<string | null>(null);
    const [editing, setEditing] = useState<number | null>(null);
    const [menuOpen, setMenuOpen] = useState<number | null>(null);

    //   const updateQuery = (updater: DatasetQuery | ((prev: DatasetQuery) => DatasetQuery)) => {
    //     setQuery(prev => {
    //       const newChart = typeof updater === "function" ? updater(prev) : updater;
    //       onChange(newChart); // ici c'est sûr que c'est la valeur correcte
    //       return newChart;
    //     });
    //   };

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

    const querySelector = useMemo(() => {
        const queryErrors: CompileError = {};
        if (!query?.name?.trim()) queryErrors["query_name"] = "Nom obligatoire !";
        if (!query?.dataset_id) queryErrors["query_dataset"] = "Dataset obligatoire !";

        const dimensions = query?.query_json?.select?.dimensions ?? [];
        const metrics = query?.query_json?.select?.metrics ?? [];

        if (dimensions.length === 0 && metrics.length === 0) {
            queryErrors["dimensions"] = "Dimensions ou Metrics obligatoire !";
            queryErrors["metrics"] = "Metrics ou Dimensions obligatoire !";
        }
        return { errors: queryErrors, dimensions, metrics };
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
                ...updated.select.dimensions.map(r => r.field_id),
                ...updated.select.metrics.map(r => r.field_id)
            ];

            updated = {
                ...updated,
                order_by: (updated.order_by || []).filter(o => !o.field_id || allowedFields.includes(o.field_id))
            };
        }

        setValue("query_json", updated);

        if (!dataset) return;

        const queryErrors = querySelector.errors;

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

    const resetBuilder = useCallback(() => {
        setValue("query_json", defaultForm.query_json);
        setValue("compiled_sql", "");
    }, [defaultForm.query_json, setValue]);

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
                <div>
                    <FormMultiSelect
                        label="Dimensions (Group By)"
                        value={querySelector.dimensions.map(d => d.field_id)}
                        options={dimensions.map(f => ({ value: f.id, label: f.name }))}
                        onChange={(vals) => {
                            const oldError = { ...errors };
                            delete oldError["dimensions"];
                            delete oldError["metrics"];
                            setErrors(oldError);
                            const dimensions = (vals || []).filter(d => d !== null).map(d => ({ field_id: d, alias: undefined }))
                            updateQueryJson({ select: { ...querySelector, dimensions } });
                        }}
                        error={errors["dimensions"]}
                    />

                    <div className="w-full border rounded-xl p-3 bg-gray-50">
                        <div className="font-semibold mb-2">Rows</div>
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100 text-gray-600">
                                <tr>
                                    <th className="text-left px-4 py-2">Nom</th>
                                    <th className="text-left px-4 py-2">Alias</th>
                                    <th className="w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {querySelector.dimensions.map((rd) => {

                                    const field_name = fields.find(f=>f.id === rd.field_id)?.name ?? rd.field_id;
                                    
                                    return (
                                        <tr key={rd.field_id} className="border-t hover:bg-gray-50 transition">
                                            <td className="px-4 py-2 font-medium">{field_name}</td>
                                            <td className="px-4 py-2">
                                                {editing === rd.field_id ? (
                                                    <FormInput type="text" value={rd.alias || field_name || ""} className="border rounded-lg px-2 py-1 w-full"
                                                        onChange={(e) => {
                                                            const dimensions = querySelector.dimensions.map(d => d.field_id === rd.field_id ? { ...d, alias: e.target.value?.trim() } : d)
                                                            updateQueryJson({ select: { ...querySelector, dimensions } });
                                                        }}
                                                        onBlur={() => setEditing(null)} />
                                                ) : (
                                                    <span className="text-gray-500">
                                                        {rd.alias || field_name || "—"}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-2 py-2 relative">
                                                <button
                                                    className="p-2 rounded hover:bg-gray-200"
                                                    onClick={() => setMenuOpen(menuOpen === rd.field_id ? null : rd.field_id)}>
                                                    <MoreVertical size={16} />
                                                </button>

                                                {menuOpen === rd.field_id && (
                                                    <div className="absolute right-2 mt-1 w-32 bg-white border rounded-lg shadow-lg z-10">
                                                        <Button size="sm" className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-100"
                                                            onClick={() => { setEditing(rd.field_id); setMenuOpen(null); }}>
                                                            <Pencil size={14} />
                                                            Rename
                                                        </Button>
                                                        <Button variant="danger" size="sm" className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                                            onClick={() => {
                                                                const dimensions = querySelector.dimensions.filter((r) => r.field_id !== rd.field_id);
                                                                updateQueryJson({ select: { ...querySelector, dimensions } });
                                                            }}>
                                                            <Trash2 size={14} />
                                                            Delete
                                                        </Button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div>

                    {/* Metrics */}
                    <FormMultiSelect
                        label="Metrics"
                        value={querySelector.metrics.map(d => d.field_id)}
                        options={metrics.map(f => ({ value: f.id, label: f.name }))}
                        onChange={(vals) => {
                            const oldError = { ...errors };
                            delete oldError["dimensions"];
                            delete oldError["metrics"];
                            setErrors(oldError);

                            const metrics = (vals || []).filter(m => m !== null).map(d => ({ field_id: d, alias: undefined }));
                            updateQueryJson({ select: { ...querySelector, metrics } });
                        }}
                        error={errors.metrics}
                    />


                    <div className="w-full border rounded-xl p-3 bg-gray-50">
                        <div className="font-semibold mb-2">Metrics</div>
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100 text-gray-600">
                                <tr>
                                    <th className="text-left px-4 py-2">Nom</th>
                                    <th className="text-left px-4 py-2">Alias</th>
                                    <th className="w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {querySelector.metrics.map((m) => {

                                    const field_name = fields.find(f=>f.id === m.field_id)?.name ?? m.field_id;

                                    return (
                                        <tr key={m.field_id} className="border-t hover:bg-gray-50 transition">
                                            <td className="px-4 py-2 font-medium">{field_name}</td>
                                            <td className="px-4 py-2">
                                                {editing === m.field_id ? (
                                                    <FormInput
                                                        type="text" value={m.alias || ""}
                                                        className="border rounded-lg px-2 py-1 w-full"
                                                        onChange={(e) => {
                                                            const metrics = querySelector.metrics.map(d => {
                                                                return d.field_id === m.field_id ? { ...d, alias: e.target.value?.trim() } : d;
                                                            })
                                                            updateQueryJson({ select: { ...querySelector, metrics } });
                                                        }}
                                                        onBlur={() => setEditing(null)} />

                                                ) : (
                                                    <span className="text-gray-500">
                                                        {m.alias || "—"}
                                                    </span>
                                                )}
                                            </td>
                                            {/* <td>
                                                <FormSelect
                                                    value={m.aggregation || ""}
                                                    className="border rounded-lg px-2 py-1 w-full"
                                                    options={AGGRAGATE_TYPES.map(a => ({ value: a, label: a.toUpperCase() }))}
                                                    onChange={(val) => updateMetricAgg(m.field_id, val as SqlAggType)}
                                                />
                                            </td> */}
                                            <td className="px-2 py-2 relative">
                                                <button
                                                    className="p-2 rounded hover:bg-gray-200"
                                                    onClick={() => setMenuOpen(menuOpen === m.field_id ? null : m.field_id)}>
                                                    <MoreVertical size={16} />
                                                </button>

                                                {menuOpen === m.field_id && (
                                                    <div className="absolute right-2 mt-1 w-32 bg-white border rounded-lg shadow-lg z-10">

                                                        <button
                                                            className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-100"
                                                            onClick={() => { setEditing(m.field_id); setMenuOpen(null); }}>
                                                            <Pencil size={14} />
                                                            Rename
                                                        </button>

                                                        <button
                                                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                                            onClick={() => {
                                                                const metrics = querySelector.metrics.filter((r) => r.field_id !== m.field_id);
                                                                updateQueryJson({ select: { ...querySelector, metrics } });
                                                            }}>
                                                            <Trash2 size={14} />
                                                            Delete
                                                        </button>

                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* BUILDER */}
            {dataset && (
                // <div className="space-y-6 max-w-4xl">
                <>
                    {hasSelectJson && (
                        <>
                            {!hideFilters && (
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
                                </>
                            )}

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
