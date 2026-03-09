// import { Shield } from 'lucide-react';
// import { forwardRef, useEffect, useState } from 'react';
// import { StatusBadge } from '@components/ui/Badge/Badge';
// import { type Column } from '@components/ui/Table/Table';
// import { FormInput } from '@components/forms/FormInput/FormInput';
// import { FormTextarea } from '@components/forms/FormTextarea/FormTextarea';
// import { FormSelect } from '@components/forms/FormSelect/FormSelect';
// import { FormCheckbox } from '@components/forms/FormCheckbox/FormCheckbox';
// import { AdminEntityCrudModuleRef, AdminEntityCrudModule } from '@pages/admins/AdminEntityCrudModule';
// import { Dataset, DatasetChart, DatasetQuery, SqlChartTypeList } from '@/models/dataset.models';
// import { chartService, datasetService, queryService } from '@/services/dataset.service';
// import { FaDatabase } from 'react-icons/fa';
// import { Tenant } from '@/models/identity.model';
// import { tenantService } from '@/services/identity.service';

// const DEFAULT_FORM = Object.freeze<DatasetChart>({
//     id: null,
//     name: "",
//     tenant_id: null,
//     query_id: null,
//     dataset_id: null,
//     type: "table",
//     options: {},  // options JSON
//     description: "",
//     is_active: false,
// });

// // Colonnes pour la liste
// const sourceColumns: Column<DatasetChart>[] = [
//     { key: "name", header: "Nom", sortable: true, searchable: true },
//     { key: "tenant", header: "Tenant", render: (ds) => ds.tenant?.name ?? "", sortable: true, searchable: true },
//     { key: "dataset", header: "Dataset", render: (ds) => ds.dataset?.name ?? "", sortable: true, searchable: true },
//     { key: "query", header: "Query", render: (ds) => ds.query?.name ?? "", sortable: true, searchable: true },
//     { key: "type", header: "Type", sortable: true, searchable: true },
//     { key: "options", header: "Options", render: (ds) => JSON.stringify(ds.options ?? {}), sortable: false, searchable: false },
//     { key: "description", header: "Description", render: (ds) => ds.description || "-", sortable: true, searchable: true },
//     { key: "is_active", header: "Statut", align: "center", render: (ds) => <StatusBadge isActive={ds.is_active} />, sortable: false, searchable: false },
// ];

// // Composant DatasetChartTab
// export const DatasetChartTab = forwardRef<AdminEntityCrudModuleRef>((props, ref) => {
//     const [tenants, setTenants] = useState<Tenant[]>([]);
//     const [tenant_id, setTenantId] = useState<number | undefined>(undefined);
//     const [datasets, setDatasets] = useState<Dataset[]>([]);
//     const [queries, setQueries] = useState<DatasetQuery[]>([]);
    
//     useEffect(() => {
//         const loadTenants = async () => {
//             const tenantRes = await tenantService.all();
//             setTenants(tenantRes ?? []);
//             if (tenantRes?.length) setTenantId(tenantRes[0].id?? undefined);
//         };
//         loadTenants();
//     }, []);

//     useEffect(() => {
//         if (!tenant_id) return;
//         const loadData = async () => {
//             const [datasetRes, queryRes] = await Promise.all([
//                 datasetService.all(tenant_id),
//                 queryService.all(tenant_id)
//             ]);
//             setDatasets(datasetRes ?? []);
//             setQueries(queryRes ?? []);
//         };
//         loadData();
//     }, [tenant_id]);

//     // Sous-composant pour éditer les options du chart
//     const ChartOptionsEditor = ({ options, setOptions, type }: { options: any; setOptions: (opt: any) => void; type: string }) => {
//         const [localOptions, setLocalOptions] = useState(options || {});

//         useEffect(() => setLocalOptions(options || {}), [options]);

//         const updateOption = (key: string, value: any) => {
//             const newOptions = { ...localOptions, [key]: value };
//             setLocalOptions(newOptions);
//             setOptions(newOptions);
//         };

//         return (
//             <div className="chart-options-editor">
//                 {/* Axes */}
//                 {["bar", "line", "area"].includes(type) && (
//                     <>
//                         <FormInput
//                             label="X Axis"
//                             value={localOptions.x_axis ?? ""}
//                             onChange={(e) => updateOption("x_axis", e.target.value)}
//                             placeholder="Dimension X"
//                         />
//                         <FormInput
//                             label="Metrics (comma-separated)"
//                             value={localOptions.metrics?.join(",") ?? ""}
//                             onChange={(e) => updateOption("metrics", e.target.value.split(","))}
//                             placeholder="Ex: sum_case_role_patient,total_id_between_year_2025_2026"
//                         />
//                     </>
//                 )}
//                 {type === "pie" && (
//                     <>
//                         <FormInput
//                             label="Dimension"
//                             value={localOptions.dimension ?? ""}
//                             onChange={(e) => updateOption("dimension", e.target.value)}
//                         />
//                         <FormInput
//                             label="Metric"
//                             value={localOptions.metric ?? ""}
//                             onChange={(e) => updateOption("metric", e.target.value)}
//                         />
//                     </>
//                 )}
//                 {type === "kpi" && (
//                     <FormInput
//                         label="Metric"
//                         value={localOptions.metric ?? ""}
//                         onChange={(e) => updateOption("metric", e.target.value)}
//                     />
//                 )}
//                 {type === "table" && (
//                     <FormTextarea
//                         label="Columns JSON"
//                         value={JSON.stringify(localOptions.columns ?? [], null, 2)}
//                         onChange={(e) => {
//                             try {
//                                 const cols = JSON.parse(e.target.value);
//                                 updateOption("columns", cols);
//                             } catch { /* ignore invalid JSON */ }
//                         }}
//                         placeholder="Ex: [{ field: 'name', label: 'Nom' }]"
//                         rows={5}
//                     />
//                 )}

//                 {/* Visual Options */}
//                 <FormInput
//                     label="Color Scheme"
//                     value={localOptions.color_scheme ?? ""}
//                     onChange={(e) => updateOption("color_scheme", e.target.value)}
//                     placeholder="Ex: category10, tableau10, accent"
//                 />
//                 <FormCheckbox
//                     label="Show Legend"
//                     checked={localOptions.show_legend ?? true}
//                     onChange={(e) => updateOption("show_legend", e.target.checked)}
//                 />
//                 <FormCheckbox
//                     label="Show Labels"
//                     checked={localOptions.show_labels ?? true}
//                     onChange={(e) => updateOption("show_labels", e.target.checked)}
//                 />
//             </div>
//         );
//     };

//     return (
//         <AdminEntityCrudModule<DatasetChart>
//             ref={ref}
//             title="Gestion des DatasetChart"
//             icon={<Shield size={20} />}
//             entityName="DatasetChart"
//             columns={sourceColumns}
//             defaultValue={DEFAULT_FORM}
//             service={chartService}
//             defaultTenant={{ required: true, ids: [tenant_id] }}
//             isValid={(r) => r.name.trim().length > 0 && r.dataset_id != null && r.query_id != null}
//             renderForm={(chart, setValue, saving) => (
//                 <>
//                     <FormSelect
//                         label={`Tenant`}
//                         value={chart.tenant_id}
//                         options={tenants.map((c) => ({ value: c.id, label: c.name }))}
//                         onChange={(value) => setValue("tenant_id", value)}
//                         placeholder="Sélectionner Tenant"
//                         leftIcon={<FaDatabase />}
//                         required
//                     />
//                     <FormSelect
//                         label={`Dataset`}
//                         value={chart.dataset_id}
//                         options={datasets.map((c) => ({ value: c.id, label: c.name }))}
//                         onChange={(value) => setValue("dataset_id", value)}
//                         leftIcon={<FaDatabase />}
//                         required
//                     />
//                     <FormSelect
//                         label={`Query`}
//                         value={chart.query_id}
//                         options={queries.map((c) => ({ value: c.id, label: c.name }))}
//                         onChange={(value) => setValue("query_id", value)}
//                         leftIcon={<FaDatabase />}
//                         required
//                     />
//                     <FormSelect
//                         label={`Chart Type`}
//                         value={chart.type}
//                         options={SqlChartTypeList.map((c) => ({ value: c, label: c }))}
//                         onChange={(value) => setValue("type", value)}
//                         required
//                     />
//                     <FormInput
//                         label="Nom"
//                         value={chart.name}
//                         onChange={(e) => setValue("name", e.target.value)}
//                         required
//                     />
//                     <FormCheckbox
//                         label={`Is Active`}
//                         checked={Boolean(chart.is_active)}
//                         onChange={(e) => setValue("is_active", e.target.checked)}
//                     />
//                     <FormTextarea
//                         label="Description"
//                         value={chart.description || ""}
//                         onChange={(e) => setValue("description", e.target.value)}
//                         placeholder="Description du chart"
//                     />
//                     {/* Chart Options Editor */}
//                     <ChartOptionsEditor
//                         options={chart.options}
//                         setOptions={(opts) => setValue("options", opts)}
//                         type={chart.type}
//                     />
//                 </>
//             )}
//         />
//     );
// });