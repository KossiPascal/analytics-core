import { Shield, Pencil } from "lucide-react";
import { useEffect, useMemo, useState, forwardRef } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/routes/configs";
import { AdminEntityCrudModule, AdminEntityCrudModuleRef } from "@pages/admins/AdminEntityCrudModule";
import { StatusBadge } from "@components/ui/Badge/Badge";
import { type Column } from "@components/ui/Table/Table";
import { FormSelect } from "@components/forms/FormSelect/FormSelect";
import { Button } from "@components/ui/Button/Button";
import { datasetService, queryService } from "@/services/dataset.service";
import { Tenant } from "@/models/identity.model";
import { Dataset, DatasetQuery, QueryJson } from "@/models/dataset.models";
import { FaDatabase } from "react-icons/fa";
import { CompileError } from "./components/model";
import { RenderFormBuilder } from "./components/RenderFormBuilder";
import { DatasetPreviewModal } from "./components/DatasetPreviewModal";



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
                                field_id: -1,
                                operator: "=",
                                value: "",
                                useSqlInClause: false
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
   tenants:Tenant[];
   tenant_id:number;

   datasets:Dataset[];
   dataset_id:number;
}
// MAIN PAGE
export const DatasetQueryTab = forwardRef<AdminEntityCrudModuleRef, DatasetQueryTabProps>(({ tenants, tenant_id, datasets, dataset_id }, ref) => {
    const navigate = useNavigate();
    const [previewSql, setPreviewSql] = useState<string | null>(null);
    const [previewJson, setPreviewJson] = useState<QueryJson | null>(null);
    const [previewValues, setPreviewValues] = useState<Record<string, any> | null>(null);
    const [errors, setErrors] = useState<CompileError>({});

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
        });
    };

    const DEFAULT_FORM = useMemo(() => createDefaultForm(tenant_id), [tenant_id])

    const cleanQueryJson = (q: DatasetQuery): DatasetQuery => {
        const cleanNode = (node: any): any | null => {
            if (!node) return null;
            if (node.type === "condition") {
                return (!node.field_id || node.field_id <= 0) ? null : node;
            }
            if (node.type === "group") {
                const cleanedChildren = (node.children ?? [])
                    .map(cleanNode)
                    .filter(Boolean);
                return cleanedChildren.length === 0 ? null : { ...node, children: cleanedChildren };
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
                enableEdit={false}
                customActions={(row) => (
                    <button
                        title="Ouvrir dans Query Builder"
                        onClick={() => navigate(ROUTES.builder.queryBuilder(), { state: { query: row } })}
                        style={{ padding: "4px", borderRadius: "4px", border: "none", background: "transparent", cursor: "pointer", color: "#2563eb" }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#dbeafe"}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                    >
                        <Pencil size={15} />
                    </button>
                )}
                isValid={(q) => {
                    return Object.keys(errors).length === 0
                }}
                onBeforeSave={cleanQueryJson}
                submitValidation={async (q) => {
                    const validationErrors = validateQuery(q);
                    setErrors(validationErrors);
                    return Object.keys(validationErrors).length === 0;
                }}
                renderForm={(query, setValue, saving) => (
                    <RenderFormBuilder
                        datasets={datasets}
                        query={query}
                        tenants={tenants}
                        tenant_id={tenant_id}
                        errors={errors}
                        defaultForm={DEFAULT_FORM}
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