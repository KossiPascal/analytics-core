// import { Shield } from 'lucide-react';
// import { forwardRef, useEffect, useMemo, useState } from 'react';
// import { StatusBadge } from '@components/ui/Badge/Badge';
// import { type Column } from '@components/ui/Table/Table';
// import { FormInput } from '@components/forms/FormInput/FormInput';
// import { FormTextarea } from '@components/forms/FormTextarea/FormTextarea';
// import { Tenant } from '@models/identity.model';
// import { tenantService } from '@/services/identity.service';
// import { FormSelect } from '@components/forms/FormSelect/FormSelect';
// import { AdminEntityCrudModuleRef, AdminEntityCrudModule } from '@pages/admins/AdminEntityCrudModule';
// import { Dataset, DatasetQuery } from '@/models/dataset.models';
// import { datasetService, queryService } from '@/services/dataset.service';
// import { FaDatabase } from 'react-icons/fa';
// import { Button } from '@/components/ui/Button/Button';
// import { FormSwitch } from '@/components/forms/FormSwitch/FormSwitch';
// import { Modal } from '@/components/ui/Modal/Modal';


// const DEFAULT_FORM = Object.freeze<DatasetQuery>({
//     id: null,
//     name: "",
//     tenant_id: null,
//     dataset_id: null,
//     query_json: {},
//     description: "",
//     compiled_sql: "",
//     values: {},
//     is_active: false,
// });

// const getQueryColumns = (openSqlModal: (q: DatasetQuery) => void, openJsonModal: (q: DatasetQuery) => void): Column<DatasetQuery>[] => [
//     {
//         key: "name",
//         header: "Nom",
//         sortable: true,
//         searchable: true,
//     },
//     {
//         key: "query_json",
//         header: "Query",
//         align: "center",
//         render: (q) => (
//             <Button size="sm" variant="outline" onClick={() => openJsonModal(q)}>
//                 Voir JSON
//             </Button>
//         )
//     },
//     {
//         key: "compiled_sql",
//         header: "SQL",
//         align: "center",
//         render: (q) => (
//             <Button size="sm" variant="outline" onClick={() => openSqlModal(q)}>
//                 Voir SQL
//             </Button>
//         )
//     },
//     {
//         key: "values",
//         header: "values",
//         render: (ds) => String(ds.values ?? {}),
//         sortable: true,
//         searchable: true,
//     },
//     {
//         key: "tenant",
//         header: "Tenant",
//         render: (ds) => ds.tenant?.name ?? "",
//         sortable: true,
//         searchable: true,
//     },
//     {
//         key: "dataset",
//         header: "Dataset",
//         render: (ds) => ds.dataset?.name ?? "",
//         sortable: true,
//         searchable: true,
//     },
//     {
//         key: "description",
//         header: "Description",
//         sortable: true,
//         searchable: true,
//     },
//     {
//         key: "is_active",
//         header: "Statut",
//         sortable: true,
//         align: "center",
//         render: (ou) => (<StatusBadge isActive={ou.is_active === true} />),
//         searchable: false,
//     }
// ];

// const DatasetQueryForm = ({ query, setValue, tenants, datasets }: { query: DatasetQuery; setValue: (key: keyof DatasetQuery, value: any) => void; tenants: Tenant[]; datasets: Dataset[]; }) => {

//     const [jsonError, setJsonError] = useState<string | null>(null);
//     const [valuesError, setValuesError] = useState<string | null>(null);

//     const handleJsonChange = (val: string) => {
//         try {
//             const parsed = val ? JSON.parse(val) : {};
//             setValue("query_json", parsed);
//             setJsonError(null);
//         } catch {
//             setJsonError("JSON invalide");
//         }
//     };

//     const handleValuesChange = (val: string) => {
//         try {
//             const parsed = val ? JSON.parse(val) : {};
//             setValue("values", parsed);
//             setValuesError(null);
//         } catch {
//             setValuesError("JSON invalide");
//         }
//     };

//     return (
//         <div className="space-y-4 max-w-2xl">
//             <FormSelect
//                 label="Tenant"
//                 value={query.tenant_id}
//                 options={tenants.map(t => ({ value: t.id, label: t.name }))}
//                 onChange={(v) => setValue("tenant_id", v)}
//                 placeholder="Sélectionner Tenant"
//                 leftIcon={<FaDatabase />}
//                 required
//             />

//             <FormSelect
//                 label="Dataset"
//                 value={query.dataset_id}
//                 options={datasets.map(d => ({ value: d.id, label: d.name }))}
//                 onChange={(v) => setValue("dataset_id", v)}
//                 leftIcon={<FaDatabase />}
//                 required
//             />

//             <FormInput
//                 label="Nom"
//                 value={query.name}
//                 onChange={(e) => setValue("name", e.target.value)}
//                 leftIcon={<FaDatabase />}
//                 required
//             />

//             <FormTextarea
//                 label="Query JSON"
//                 value={JSON.stringify(query.query_json ?? {}, null, 2)}
//                 onChange={(e) => handleJsonChange(e.target.value)}
//                 leftIcon={<FaDatabase />}
//                 error={jsonError ?? undefined}
//                 rows={6}
//                 required
//             />

//             <FormTextarea
//                 label="Values (paramètres)"
//                 value={JSON.stringify(query.values ?? {}, null, 2)}
//                 onChange={(e) => handleValuesChange(e.target.value)}
//                 error={valuesError ?? undefined}
//                 rows={4}
//             />

//             <FormTextarea
//                 label="Compiled SQL"
//                 value={query.compiled_sql || ""}
//                 disabled
//                 rows={6}
//             />

//             <FormSwitch
//                 label="Active"
//                 checked={Boolean(query.is_active)}
//                 onChange={(e) => setValue("is_active", e.target.checked)}
//             />

//             <FormTextarea
//                 label="Description"
//                 value={query.description || ""}
//                 onChange={(e) => setValue("description", e.target.value)}
//                 placeholder="Description du Query"
//                 rows={3}
//             />
//         </div>
//     );
// };

// export const DatasetQueryTab = forwardRef<AdminEntityCrudModuleRef>((props, ref) => {
//     const [tenants, setTenants] = useState<Tenant[]>([]);
//     const [tenant_id, setTenantId] = useState<number | undefined>(undefined);
//     const [datasets, setDatasets] = useState<Dataset[]>([]);
//     const [selectedSql, setSelectedSql] = useState<string | null>(null);
//     const [selectedJson, setSelectedJson] = useState<any>(null);
//     const [loading, setLoading] = useState(true);

//     const openSqlModal = (q: DatasetQuery) => {
//         setSelectedSql(q.compiled_sql);
//     };

//     const openJsonModal = (q: DatasetQuery) => {
//         setSelectedJson(q.query_json);
//     };

//     const queryColumns = useMemo(
//         () => getQueryColumns(openSqlModal, openJsonModal), []
//     );

//     useEffect(() => {
//         const load = async () => {
//             const t = await tenantService.all();
//             setTenants(t || []);
//             if (t?.length) setTenantId(t[0].id ?? undefined);
//         };
//         load();
//     }, []);

//     useEffect(() => {
//         if (!tenant_id) return;
//         datasetService.all(tenant_id).then(d => setDatasets(d || []));
//     }, [tenant_id]);


//     //   query_json: Record<string, any>
//     //   values: Record<string, any>
//     return (
//         <>
//             <AdminEntityCrudModule<DatasetQuery>
//                 ref={ref}
//                 title="Gestion des DatasetQuery"
//                 icon={<Shield size={20} />}
//                 entityName="DatasetQuery"
//                 columns={queryColumns}
//                 defaultValue={DEFAULT_FORM}
//                 service={queryService}
//                 defaultTenant={{ required: true, id: tenant_id }}
//                 isValid={(q) => Boolean(q.name.trim() && q.dataset_id && q.query_json)}
//                 renderForm={(query, setValue, saving) => (
//                     <DatasetQueryForm
//                         query={query}
//                         setValue={setValue}
//                         tenants={tenants}
//                         datasets={datasets}
//                     />
//                 )}
//             />

//             {/* SQL Modal */}
//             <Modal
//                 isOpen={Boolean(selectedSql)}
//                 onClose={() => setSelectedSql(null)}
//                 title="Compiled SQL"
//                 size="full"
//                 footer={
//                     <Button variant="outline" onClick={() => setSelectedSql(null)}>
//                         Fermer
//                     </Button>
//                 }
//             >
//                 <pre className="bg-black text-green-400 p-6 overflow-auto">
//                     {selectedSql}
//                 </pre>
//             </Modal>

//             {/* JSON Modal */}
//             <Modal
//                 isOpen={Boolean(selectedJson)}
//                 onClose={() => setSelectedJson(null)}
//                 title="Query JSON"
//                 size="md"
//                 footer={
//                     <Button variant="outline" onClick={() => setSelectedJson(null)}>
//                         Fermer
//                     </Button>
//                 }
//             >
//                 <pre className="bg-gray-100 p-6 overflow-auto text-sm">
//                     {JSON.stringify(selectedJson, null, 2)}
//                 </pre>
//             </Modal>
//         </>
//     );
// });
