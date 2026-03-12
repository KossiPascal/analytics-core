import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { ChartWizard } from "./chart-utils/ChartWizard";
import { Dataset, DatasetChart, DatasetQuery, ExecuteChartResponse, TableChartOptions } from "@/models/dataset.models";
import { chartService, datasetService, queryService } from "@/services/dataset.service";
import { StatusBadge } from "@/components/ui/Badge/Badge";
import { Column } from "@/components/ui/Table/Table";
import { AdminEntityCrudModule, AdminEntityCrudModuleRef } from "@/pages/admins/AdminEntityCrudModule";
import { Layout } from "react-grid-layout";
import { FormSelect } from "@/components/forms/FormSelect/FormSelect";
import { Shield } from "lucide-react";
import { FaDatabase } from "react-icons/fa";
import { ChartRendererPreview } from "./chart-utils/ChartRenderer";
import { Modal } from "@/components/ui/Modal/Modal";
import { Tenant } from "@/models/identity.model";

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

interface DatasetChartTabProps {
    tenants: Tenant[];
    tenant_id: number
}

const defaultTableOptions: TableChartOptions = {
  title: "",
  subtitle: "",

  width: "100%",
  height: 400,

  color_scheme: ["#4caf50", "#2196f3", "#ff9800", "#9c27b0"],

  show_legend: true,
  show_tooltip: true,
  show_labels: true,
  show_grid: true,

  columns: [],
  pagination: true,
  page_size: undefined,
}

// DatasetChartTab
const createDefaultForm = (tenant_id:number): DatasetChart => ({
  id: null,
  name: "",
  tenant_id: tenant_id,
  query_id: null,
  dataset_id: null,
  type: "table",
  description: "",
  is_active: false,
  options: {
    table: defaultTableOptions,
    bar: {},
    line: {},
    area: {},
    pie: {},
    donut: {},
    kpi: {},
    gauge: {},
    heatmap: {},
    radar: {},
    stacked_area: {},
    stacked_bar: {},
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

export const DatasetChartTab = forwardRef<AdminEntityCrudModuleRef, DatasetChartTabProps>(({ tenants, tenant_id }, ref) => {
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

    // Chargement datasets
    useEffect(() => {
        if (!tenant_id) return;
        datasetService.all(tenant_id).then(d => setDatasets(d ?? []));
    }, [tenant_id]);

    // Chargement queries
    useEffect(() => {
        if (!tenant_id || !options.dataset_id) return;
        queryService.all(tenant_id, options.dataset_id).then(q => setQueries(q || []));
    }, [tenant_id, options.dataset_id]);


    // useEffect(() => {
    //     const suggestion = suggestChartType( _chart?.options?.rows ?? [], _chart?.options?.metrics ?? []);
    //     if (!expertMode) setChartType(suggestion);
    // }, [_chart?.options?.rows, _chart?.options?.metrics]);


    const defaultTenant = useMemo(() => {
        return {
            required: true,
            ids: [tenant_id, options.dataset_id, options.query_id]
        };
    }, [tenant_id, options.dataset_id, options.query_id]);

    const mockData = useMemo(() => {
        return [
            { name: "Jan", value: 400 },
            { name: "Feb", value: 300 },
            { name: "Mar", value: 500 },
        ]
    }, []);

    const DEFAULT_FORM = useMemo(() => createDefaultForm(tenant_id), [tenant_id])

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
                headerActions={(
                    <>
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
                    </>
                )}
                renderForm={(chart, setValue, saving) => (
                    <>
                        {/* <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}> */}
                        {/* ChartWizard doit mettre à jour champ par champ */}
                        <ChartWizard
                            chart={chart}
                            tenants={tenants}
                            tenant_id={tenant_id}
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