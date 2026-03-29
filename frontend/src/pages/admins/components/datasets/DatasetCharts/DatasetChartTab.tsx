import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { Dataset, DatasetChart, DatasetQuery, ExecuteChartResponse } from "@/models/dataset.models";
import { chartService, queryService } from "@/services/dataset.service";
import { StatusBadge } from "@/components/ui/Badge/Badge";
import { Column } from "@/components/ui/Table/Table";
import { AdminEntityCrudModule, AdminEntityCrudModuleRef } from "@/pages/admins/AdminEntityCrudModule";
import { Layout } from "react-grid-layout";
import { FormSelect } from "@/components/forms/FormSelect/FormSelect";
import { Shield } from "lucide-react";
import { FaDatabase } from "react-icons/fa";
import { Modal } from "@/components/ui/Modal/Modal";
import { Button } from "@/components/ui/Button/Button";
import { Tenant } from "@/models/identity.model";
import { ChatBuilderInterface } from "@/pages/admins/components/datasets/DatasetCharts/ChartDataBuilder/ChatBuilderInterface";

import styles from "@pages/admins/AdminPage.module.css";
import { Building2 } from "lucide-react";
import { ChartWizard } from "./components/chart-utils/ChartWizard";
import { ChartRendererPreview } from "./components/chart-utils/ChartRenderer";

// Colonnes du tableau
const sourceColumns: Column<DatasetChart>[] = [
    { key: "name", header: "Nom", sortable: true, searchable: true },
    { key: "tenant", header: "Tenant", render: (ds) => ds.tenant?.name ?? "", sortable: true, searchable: true },
    { key: "dataset", header: "Dataset", render: (ds) => ds.dataset?.name ?? "", sortable: true, searchable: true },
    { key: "query", header: "Query", render: (ds) => ds.query?.name ?? "", sortable: true, searchable: true },
    { key: "type", header: "Type", sortable: true, searchable: true },
    { key: "options", header: "Options", render: (ds) => JSON.stringify(ds.options ?? {}), sortable: false, searchable: false },
    { key: "structure", header: "Structure", render: (ds) => JSON.stringify(ds.structure ?? {}), sortable: false, searchable: false },
    { key: "description", header: "Description", render: (ds) => ds.description || "-", sortable: true, searchable: true },
    { key: "is_active", header: "Statut", align: "center", render: (ds) => <StatusBadge isActive={ds.is_active} />, sortable: false, searchable: false },
];


// DatasetChartTab
const createDefaultForm = (tenant_id: number, dataset_id: number, query_id: number): DatasetChart => ({
    id: null,
    name: "",
    tenant_id: tenant_id,
    dataset_id: dataset_id,
    query_id: query_id,
    type: "table",
    description: "",
    is_active: false,
    options: {
        title: "",
        subtitle: "",
        width: "100%",
        height: 400,
        show_legend: true,
        show_tooltip: true,
        show_labels: true,
        show_grid: true,
        table: { columns: [], pagination: true, page_size: undefined, },
        color_scheme: ["#4caf50", "#2196f3", "#ff9800", "#9c27b0"],
    },
    structure: {
        rows_dimensions: [],
        cols_dimensions: [],
        metrics: [],
        filters: [],
        order_by: [],
        limit: null,
        offset: null,
        pivot: {
            acitve: true,
            fill_value: 0,
            rows_total: true,
            cols_total: true,
            rows_subtotal: true,
            cols_subtotal: true,
            sort_desc: true,
            percent_metrics: [],
            top_n: undefined,
            sort_metric: undefined,
        }
    }
});

interface DatasetChartTabProps {
    tenants: Tenant[];
    tenant_id: number;
    datasets: Dataset[];
    dataset_id: number;
}

export const DatasetChartTab = forwardRef<AdminEntityCrudModuleRef, DatasetChartTabProps>(({ tenants, tenant_id, datasets, dataset_id }, ref) => {
    const [queries, setQueries] = useState<DatasetQuery[]>([]);
    const [query_id, setQueryId] = useState<number | undefined>(undefined);
    const [showPreview, setShowPreview] = useState<boolean>(false);
    const [executeResponse, setExecuteResponse] = useState<ExecuteChartResponse | undefined>(undefined);

    // Chargement queries
    useEffect(() => {
        if (!tenant_id || !dataset_id) return;
        queryService.list(tenant_id, dataset_id).then(q => setQueries(q || []));
    }, [tenant_id, dataset_id]);

    // useEffect(() => {
    //     const suggestion = suggestChartType( _chart?.options?.rows ?? [], _chart?.options?.metrics ?? []);
    //     if (!expertMode) setChartType(suggestion);
    // }, [_chart?.options?.rows, _chart?.options?.metrics]);

    const defaultTenant = useMemo(() => {
        return { required: true, ids: [tenant_id, dataset_id, query_id] };
    }, [tenant_id, dataset_id, query_id]);

    const isParamsNotOk = useMemo(() => !tenant_id || !dataset_id || !query_id, [tenant_id, dataset_id, query_id]);
    const DEFAULT_FORM = useMemo(() => createDefaultForm(tenant_id, dataset_id, query_id!), [tenant_id, dataset_id, query_id]);

    const QueriesListForm = () => {
        return (
            <FormSelect
                label={`Queries List`}
                value={query_id}
                options={queries.map((c) => ({ value: c.id, label: c.name }))}
                onChange={(value) => setQueryId(value)}
                placeholder="Sélectionner Query"
                leftIcon={<FaDatabase />}
                required={true}
            />
        );
    }


    if (isParamsNotOk) {
        return (
            <div className={styles.emptyState}>
                <Building2 size={48} />
                <p>Select Query</p>
                <QueriesListForm />
            </div>
        );
    }

    return (
        <>
            <AdminEntityCrudModule<DatasetChart>
                ref={ref}
                modalSize="zl"
                title="Gestion des DatasetChart"
                icon={<Shield size={20} />}
                entityName="DatasetChart"
                columns={sourceColumns}
                defaultValue={DEFAULT_FORM}
                service={chartService}
                defaultTenant={defaultTenant}
                // isValid={(r) => !!r.name && !!r.dataset_id && !!r.query_id}
                isValid={(r) => r.name.trim().length > 0 && r.dataset_id != null && r.query_id != null}
                headerActions={
                    <>
                        <QueriesListForm />
                        {/* <Button onClick={() => setOpenChartBuilder(true)}>Chart Builder</Button> */}
                    </>
                }
                renderForm={(chart, setValue, saving) => (
                    <>
                        <ChatBuilderInterface
                            chart={chart}
                            tenants={tenants}
                            tenant_id={tenant_id}
                            datasets={datasets}
                            dataset_id={dataset_id}
                            queries={queries}
                            query_id={query_id!}
                            onChange={(updatedChart) => {
                                Object.keys(updatedChart).forEach((key) => {
                                    setValue(key as keyof DatasetChart, (updatedChart as any)[key]);
                                });
                            }}
                            onExecute={(ex) => {
                                setExecuteResponse(ex);
                                setShowPreview(true);
                            }}
                        />
                        {/* <ChartWizard
                            chart={chart}
                            tenants={tenants}
                            tenant_id={tenant_id}
                            datasets={datasets}
                            dataset_id={dataset_id}
                            queries={queries}
                            query_id={query_id!}
                            onChange={(updatedChart) => {
                                // Exemple de mise à jour de chaque champ individuellement
                                Object.keys(updatedChart).forEach((key) => {
                                    setValue(key as keyof DatasetChart, (updatedChart as any)[key]);
                                });
                            }}
                            onExecute={(ex) => {
                                setExecuteResponse(ex);
                                setShowPreview(true);
                            }}
                        />

                        {!isParamsNotOk && (
                        <Modal size="full" isOpen={showPreview} onClose={() => setShowPreview(false)}>
                            <ChartRendererPreview executeResponse={executeResponse} />
                        </Modal>)} */}
                    </>
                )}
            />
        </>
    );
});