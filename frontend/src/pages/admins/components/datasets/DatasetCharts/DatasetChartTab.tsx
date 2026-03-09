import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { ChartWizard } from "./chart-utils/ChartWizard";
import { Dataset, DatasetChart, DatasetQuery, DEFAULT_CHART_FORM, ExecuteChartResponse } from "@/models/dataset.models";
import { chartService, datasetService, queryService } from "@/services/dataset.service";
import { StatusBadge } from "@/components/ui/Badge/Badge";
import { Column } from "@/components/ui/Table/Table";
import { AdminEntityCrudModule, AdminEntityCrudModuleRef } from "@/pages/admins/AdminEntityCrudModule";
import { tenantService } from "@/services/identity.service";
import { Layout } from "react-grid-layout";
import { FormSelect } from "@/components/forms/FormSelect/FormSelect";
import { Shield } from "lucide-react";
import { FaDatabase } from "react-icons/fa";
import { ChartRendererPreview } from "./chart-utils/ChartRenderer";
import { Modal } from "@/components/ui/Modal/Modal";


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


interface DefaultOptions {
    tenant_id?: number;
    dataset_id?: number;
    query_id?: number;
}


export const DatasetChartTab = forwardRef<AdminEntityCrudModuleRef>((props, ref) => {
    const [tenants, setTenants] = useState<any[]>([]);
    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [queries, setQueries] = useState<DatasetQuery[]>([]);
    const [options, setOptions] = useState<DefaultOptions>({});
    const [showPreview, setShowPreview] = useState<boolean>(false);
    const [executeResponse, setExecuteResponse] = useState<ExecuteChartResponse | undefined>(undefined);

    const [layout, setLayout] = useState<Layout | undefined>(undefined);
    const [charts, setCharts] = useState<DatasetChart[]>([]);
    const [breakpoint, setBreakpoint] = useState<string | undefined>(undefined);

    const [containerWidth, setContainerWidth] = useState<number | undefined>(undefined);
    const [containerCols, setContainerCols] = useState<number | undefined>(undefined);
    const [containerMargin, setContainerMargin] = useState<[number, number] | undefined>(undefined);
    const [containerPadding, setContainerPadding] = useState<[number, number] | undefined | null>(undefined);

    const [expertMode, setExpertMode] = useState<boolean>(false);
    const [chartType, setChartType] = useState<string>("table");
    const [selectedChart, setSelectedChart] = useState<DatasetChart | null>(null);

    const didLoad = useRef(false);

    // Chargement tenants
    useEffect(() => {
        if (didLoad.current) return;
        didLoad.current = true;
        tenantService.all().then(t => setTenants(t ?? []));
    }, []);

    // Chargement datasets
    useEffect(() => {
        if (!options.tenant_id) return;
        datasetService.all(options.tenant_id).then(d => setDatasets(d ?? []));
    }, [options.tenant_id]);

    // Chargement queries
    useEffect(() => {
        if (!options.tenant_id || !options.dataset_id) return;
        queryService.all(options.tenant_id, options.dataset_id).then(q => setQueries(q || []));
    }, [options.tenant_id, options.dataset_id]);


    // useEffect(() => {
    //     const suggestion = suggestChartType( _chart?.options?.rows ?? [], _chart?.options?.metrics ?? []);
    //     if (!expertMode) setChartType(suggestion);
    // }, [_chart?.options?.rows, _chart?.options?.metrics]);


    const defaultTenant = useMemo(() => {
        return {
            required: true,
            ids: [options.tenant_id, options.dataset_id, options.query_id]
        };
    }, [options.tenant_id, options.dataset_id, options.query_id]);

    const mockData = useMemo(() => {
        return [
            { name: "Jan", value: 400 },
            { name: "Feb", value: 300 },
            { name: "Mar", value: 500 },
        ]
    }, []);

    return (
        <>
            <div className="grid grid-cols-3 gap-4 mt-4">
                <FormSelect
                    label={`Tenant List`}
                    value={options.tenant_id}
                    options={tenants.map((c) => ({ value: c.id, label: c.name }))}
                    onChange={(value) => setOptions({ tenant_id: value })}
                    placeholder="Sélectionner Tenant"
                    leftIcon={<FaDatabase />}
                    required={true}
                />
                <FormSelect
                    label={`Dataset List`}
                    value={options.dataset_id}
                    options={datasets.map((c) => ({ value: c.id, label: c.name }))}
                    onChange={(value) => setOptions({ ...options, dataset_id: value, query_id: undefined })}
                    placeholder="Sélectionner Dataset"
                    leftIcon={<FaDatabase />}
                    required={true}
                />
                <FormSelect
                    label={`Queries List`}
                    value={options.query_id}
                    options={queries.map((c) => ({ value: c.id, label: c.name }))}
                    onChange={(value) => setOptions({ ...options, query_id: value })}
                    placeholder="Sélectionner Query"
                    leftIcon={<FaDatabase />}
                    required={true}
                />
            </div>

            <br />

            <AdminEntityCrudModule<DatasetChart>
                ref={ref}
                modalSize="zl"
                title="Gestion des DatasetChart"
                icon={<Shield size={20} />}
                entityName="DatasetChart"
                columns={sourceColumns}
                defaultValue={DEFAULT_CHART_FORM}
                service={chartService}
                defaultTenant={defaultTenant}
                // isValid={(r) => !!r.name && !!r.dataset_id && !!r.query_id}
                isValid={(r) => r.name.trim().length > 0 && r.dataset_id != null && r.query_id != null}
                renderForm={(chart, setValue, saving) => (
                    <>
                        {/* <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}> */}
                        {/* ChartWizard doit mettre à jour champ par champ */}
                        <ChartWizard
                            chart={chart}
                            onChange={(updatedChart) => {
                                // Exemple de mise à jour de chaque champ individuellement
                                Object.keys(updatedChart).forEach((key) => {
                                    setValue(key as keyof DatasetChart, (updatedChart as any)[key]);
                                });
                            }}
                            onExecute={(ex) => {
                                setExecuteResponse(ex)
                                setShowPreview(true)
                            }}
                        />


                        <Modal size="full" isOpen={showPreview} onClose={() => setShowPreview(false)}>
                            <ChartRendererPreview executeResponse={executeResponse} />
                        </Modal>

                        {/* </div> */}
                    </>
                )}
            />
        </>
    );
});