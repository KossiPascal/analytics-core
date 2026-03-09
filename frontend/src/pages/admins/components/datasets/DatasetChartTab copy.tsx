// import { Shield } from 'lucide-react';
// import { forwardRef, useEffect, useState } from 'react';
// import { StatusBadge } from '@components/ui/Badge/Badge';
// import { type Column } from '@components/ui/Table/Table';
// import { FormInput } from '@components/forms/FormInput/FormInput';
// import { FormTextarea } from '@components/forms/FormTextarea/FormTextarea';
// import { Tenant } from '@models/identity.model';
// import { tenantService } from '@/services/identity.service';
// import { FormSelect } from '@components/forms/FormSelect/FormSelect';
// import { FormCheckbox } from '@components/forms/FormCheckbox/FormCheckbox';
// import { AdminEntityCrudModuleRef, AdminEntityCrudModule } from '@pages/admins/AdminEntityCrudModule';
// import { Dataset, DatasetChart, DatasetQuery, SqlChartTypeList } from '@/models/dataset.models';
// import { chartService, datasetService, queryService } from '@/services/dataset.service';
// import { FaDatabase, } from 'react-icons/fa';


// const DEFAULT_FORM = Object.freeze<DatasetChart>({
//     id: null,
//     name: "",
//     tenant_id: null,
//     query_id: null,
//     dataset_id: null,
//     type: "table",
//     options: {},
//     description: "",
//     is_active: false,
// });

// const sourceColumns: Column<DatasetChart>[] = [
//     {
//         key: "name",
//         header: "Nom",
//         sortable: true,
//         searchable: true,
//     },
//     {
//         key: "tenant",
//         header: "Tenant",
//         render: (ds) => ds.tenant ? ds.tenant.name : "",
//         sortable: true,
//         searchable: true,
//     },
//     {
//         key: "query",
//         header: "Query",
//         render: (ds) => ds.query ? ds.query.name : "",
//         sortable: true,
//         searchable: true,
//     },
//     {
//         key: "dataset",
//         header: "Dataset",
//         render: (ds) => ds.dataset ? ds.dataset.name : "",
//         sortable: true,
//         searchable: true,
//     },
//     {
//         key: "type",
//         header: "Type",
//         sortable: true,
//         searchable: true,
//     },
//     {
//         key: "options",
//         header: "Options",
//         sortable: true,
//         render: (ou) => String(ou.options ?? {}),
//         searchable: false,
//     },
//     {
//         key: "description",
//         header: "Description",
//         sortable: true,
//         searchable: true,
//         render: (t) => t.description || "-",
//     },
//     {
//         key: "is_active",
//         header: "Statut",
//         sortable: true,
//         align: "center",
//         render: (ou) => (<StatusBadge isActive={ou.is_active === true} />),
//         searchable: false,
//     },
// ];


// export const DatasetChartTab = forwardRef<AdminEntityCrudModuleRef>((props, ref) => {
//     const [tenants, setTenants] = useState<Tenant[]>([]);
//     const [tenant_id, setTenantId] = useState<number | undefined>(undefined);
//     const [datasets, setDatasets] = useState<Dataset[]>([]);
//     const [queries, setQueries] = useState<DatasetQuery[]>([]);
//     const [loading, setLoading] = useState(true);

//     useEffect(() => {
//         const loadTenants = async () => {
//             const tenantRes = await tenantService.all();
//             setTenants(tenantRes || []);
//             if (tenantRes && tenantRes.length > 0) {
//                 const firstTenantId = tenantRes[0].id || undefined;
//                 setTenantId(firstTenantId);
//             }
//         };
//         loadTenants();
//     }, []);

//     useEffect(() => {
//         if (tenant_id == null) return;
//         const load = async () => {
//             const [datasetRes, queryRes] = await Promise.all([
//                 datasetService.all(tenant_id),
//                 queryService.all(tenant_id),
//             ]);

//             setDatasets(datasetRes || []);
//             setQueries(queryRes || []);
//         };
//         load();
//     }, [tenant_id]);

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
//             isValid={(r) => r.name.trim().length > 0}
//             renderForm={(chart, setValue, saving) => (
//                 <>
//                     <FormSelect
//                         label={`Tenant`}
//                         value={chart.tenant_id}
//                         options={tenants.map((c) => ({ value: c.id, label: c.name }))}
//                         onChange={(value) => { setValue("tenant_id", value) }}
//                         placeholder="Sélectionner Tenant"
//                         leftIcon={<FaDatabase />}
//                         required={true}
//                     />
//                     <FormSelect
//                         label={`Dataset`}
//                         value={chart.dataset_id}
//                         options={datasets.map((c) => ({ value: c.id, label: c.name }))}
//                         onChange={(value) => { setValue("dataset_id", value) }}
//                         leftIcon={<FaDatabase />}
//                         required={true}
//                     />
//                     <FormSelect
//                         label={`Query`}
//                         value={chart.query_id}
//                         options={queries.map((c) => ({ value: c.id, label: c.name }))}
//                         onChange={(value) => { setValue("query_id", value) }}
//                         leftIcon={<FaDatabase />}
//                         required={true}
//                     />
//                     <FormSelect
//                         label={`Chart Type`}
//                         value={chart.type}
//                         options={SqlChartTypeList.map((c) => ({ value: c, label: c }))}
//                         onChange={(value) => { setValue("type", value) }}
//                         leftIcon={<FaDatabase />}
//                         required={true}
//                     />
//                     <FormInput
//                         label="Nom"
//                         value={chart.name}
//                         onChange={(e) => setValue("name", e.target.value)}
//                         leftIcon={<FaDatabase />}
//                         required={true}
//                     />
//                     <FormCheckbox
//                         label={`Is Active`}
//                         checked={Boolean(chart.is_active)}
//                         onChange={(e) => setValue("is_active", e.target.checked)}
//                     />
//                     <FormTextarea
//                         label="Description"
//                         // hint="Optionnel"
//                         value={chart.description || ""}
//                         onChange={(e) => setValue("description", e.target.value)}
//                         placeholder="Description du orgunit"
//                         rows={0} cols={0}
//                     />
//                 </>
//             )}
//         />
//     );
// });
