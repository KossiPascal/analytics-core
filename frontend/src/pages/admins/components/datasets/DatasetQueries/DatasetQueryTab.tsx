import { Shield } from "lucide-react";
import { useMemo, useState, forwardRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AdminEntityCrudModule, AdminEntityCrudModuleRef } from "@pages/admins/AdminEntityCrudModule";
import { StatusBadge } from "@components/ui/Badge/Badge";
import { type Column } from "@components/ui/Table/Table";
import { Button } from "@components/ui/Button/Button";
import { queryService } from "@/services/dataset.service";
import { Tenant } from "@/models/identity.model";
import { Dataset, DatasetQuery, QueryJson } from "@/models/dataset.models";
import { CompileError } from "./components/model";
import { DatasetPreviewModal } from "./components/DatasetPreviewModal";
import QueryBuilderInterface from "./QueryBuilderInterface";
import { scriptStore } from "@/stores/scripts.store";



// DEFAULT FORM
const createDefaultForm = (tenant_id: number): DatasetQuery => ({
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
                // {
                //     linkWithPrevious: undefined,
                //     node: {
                //         type: "group",
                //         operator: "AND",
                //         children: [ { type: "condition", field_id: -1, operator: "=", value: "", useSqlInClause: false } ]
                //     }
                // }
            ],
            having: []
        },
        limit: null,
        offset: null
    },
    compiled_sql: "",
    values: {},
    description: "",
    is_active: true,
    fields_ids: []
});

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

interface DatasetQueryTabProps {
    tenants: Tenant[];
    tenant_id: number;
    datasets: Dataset[];
    dataset_id: number;
}

export const DatasetQueryTab = forwardRef<AdminEntityCrudModuleRef, DatasetQueryTabProps>(({ tenants, tenant_id, datasets, dataset_id }, ref) => {
    const { loading, script, resetEditor } = scriptStore();

    const [previewSql, setPreviewSql] = useState<string | null>(null);
    const [previewJson, setPreviewJson] = useState<QueryJson | null>(null);
    const [previewValues, setPreviewValues] = useState<Record<string, any> | null>(null);
    const [errors, setErrors] = useState<CompileError>({});

    const DEFAULT_FORM = useMemo(() => createDefaultForm(tenant_id), [tenant_id])

    const queryColumns = useMemo(() => getQueryColumns(setPreviewJson, setPreviewSql, setPreviewValues), []);

    const defaultTenant = useMemo(() => {
        return {
            required: true,
            ids: [tenant_id, dataset_id]
        };
    }, [tenant_id, dataset_id]);


    const safeReset = useCallback(() => {
        if (!loading && script?.content) resetEditor();
    }, [loading, script, resetEditor]);

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

    const formatJson = (obj: any, inline: boolean = false) => {
        const pretty = JSON.stringify(obj, null, 2);

        if (!inline) return pretty;
        return pretty.replace(/\[\s+([\s\S]*?)\s+\]/g, (match) => {
            return match.replace(/\n/g, "").replace(/\s+/g, " ").replace(/\s?,\s?/g, ", ");
        });
    };


    const cleanQueryJson = (q: DatasetQuery): DatasetQuery => {
        const cleanNode = (node: any): any | null => {
            if (!node) return null;
            if (node.type === "condition") {
                return (!node.field_id || node.field_id <= 0) ? null : node;
            }
            if (node.type === "group") {
                const children = (node.children ?? [])
                    .map(cleanNode)
                    .filter(Boolean);
                return children.length === 0 ? null : { ...node, children };
            }
            return node;
        };

        const cleanGroups = (groups: any[]): any[] =>
            (groups ?? [])
                .map(g => ({ ...g, node: cleanNode(g.node) }))
                .filter(g => g.node !== null);

        return {
            ...q,
            dataset_id: q.dataset_id ?? dataset_id ?? null,
            query_json: {
                ...q.query_json,
                filters: {
                    where: cleanGroups(q.query_json?.filters?.where ?? []),
                    having: cleanGroups(q.query_json?.filters?.having ?? []),
                },
            },
        };
    };

    const getRef = () => {
        if (!ref) return null;
        if (typeof ref === "function") return null;
        return ref.current;
    };

    return (
        <>
            <AdminEntityCrudModule<DatasetQuery>
                ref={ref}
                modalSize="full"
                entityName="DatasetQuery"
                title="Dataset Query Management"
                icon={<Shield size={18} />}
                columns={queryColumns}
                service={queryService}
                defaultTenant={defaultTenant}
                defaultValue={DEFAULT_FORM}
                processLoading={loading}
                isValid={(q) => {
                    return Object.keys(errors).length === 0
                }}
                onBeforeSave={cleanQueryJson}
                submitValidation={async (q) => {
                    const validationErrors = validateQuery(q);
                    setErrors(validationErrors);
                    return Object.keys(validationErrors).length === 0;
                }}
                afterModalClose={() => safeReset()}

                showFromFooterActionsBtn={false}
                renderForm={(query, setValue, saving) => (
                    <>
                        <QueryBuilderInterface
                            stateQuery={query}
                            datasets={datasets}
                            tenant_id={tenant_id}
                            defaultQueryForm={DEFAULT_FORM}
                            onAfterSave={(id) => {
                                const r = getRef();

                                r?.setOpenModal?.(false);
                                r?.setEntity?.(DEFAULT_FORM);
                                r?.setEditing?.(false);
                                r?.refresh?.();

                            }} />
                        {/* <RenderFormBuilder
                                datasets={datasets}
                                query={query}
                                tenants={tenants}
                                tenant_id={tenant_id}
                                errors={errors}
                                defaultForm={DEFAULT_FORM}
                                setValue={setValue}
                                setPreviewSql={setPreviewSql}
                                setErrors={setErrors}
                            /> */}
                    </>
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
                data={formatJson(previewJson ?? {})}
                onClose={() => setPreviewJson(null)}
                type="json"
            />

            <DatasetPreviewModal
                title="Query VALUES"
                open={Boolean(previewValues)}
                data={formatJson(previewValues ?? {}, true)}
                onClose={() => setPreviewValues(null)}
                type="json"
            />
        </>
    );
});