import { forwardRef } from "react";
import { Building2 } from 'lucide-react';
import { Tenant } from '@models/identity.model';
import { type Column } from '@components/ui/Table/Table';
import { FormInput } from '@components/forms/FormInput/FormInput';
import { FormTextarea } from '@components/forms/FormTextarea/FormTextarea';
import { tenantService } from '@services/identity.service';
import { AdminEntityCrudModuleRef, AdminEntityCrudModule } from '@pages/admins/AdminEntityCrudModule';


// Default value
const defaultForm: Tenant = { 
  id: null, 
  name: "", 
  description: "" 
};

// Columns definition
const tenantColumns: Column<Tenant>[] = [
  {
    key: "name",
    header: "Nom",
    sortable: true,
    searchable: true,
  },
  {
    key: "description",
    header: "Description",
    sortable: true,
    searchable: true,
    render: (t) => t.description || "-",
  },
];

export const TenantsTab = forwardRef<AdminEntityCrudModuleRef>((props, ref) => {
  return (
    <AdminEntityCrudModule<Tenant>
      ref={ref}
      title="Gestion des tenants"
      icon={<Building2 size={20} />}
      entityName="Tenant"
      columns={tenantColumns}
      defaultValue={defaultForm}
      defaultTenant={{ required: true, ids: [0] }}
      service={tenantService}
      isValid={(tenant: Tenant): boolean => {
        return tenant.name.trim().length > 0;
      } }
      renderForm={(tenant, setValue) => (
        <>
          <FormInput
            label="Nom du tenant"
            placeholder="Ex: Kendeya Analytics"
            value={tenant.name}
            onChange={(e) => setValue("name", e.target.value)}
            required
            leftIcon={<Building2 size={18} />} />

          <FormTextarea
            label="Description"
            hint="Optionnel"
            placeholder="Description du tenant"
            value={tenant.description || ""}
            onChange={(e) => setValue("description", e.target.value)}
            rows={3} />
        </>
      )}    />
  );
});



//   const CustomForm = ()=>{
//     return (<form className={styles.form} onSubmit={handleSave}>
//           <FormInput
//             label="Nom du tenant"
//             placeholder="Ex: Kendeya Analytics"
//             value={tenant.name}
//             onChange={(e) => setValue("name", e.target.value)}
//             required
//             leftIcon={<Building2 size={18} />}
//           />
//           <FormTextarea
//             label="Description"
//             hint="Optionnel"
//             placeholder="Description du tenant"
//             value={tenant.description}
//             onChange={(e) => setValue("description", e.target.value)}
//             rows={3}
//           />
//         </form>)
//   }

// export function TenantsTab() {
//   const [tenantsList, setTenantsList] = useState<Tenant[]>([]);
//   const [tenant, setTenant] = useState<Tenant>(dafaultTenant);
//   const [loading, setLoading] = useState(true);
//   const [openModal, setOpenModal] = useState(false);
//   const [openDeleteModal, setOpenDeleteModal] = useState(false);
//   const [editing, setEditing] = useState(false);
//   const [saving, setSaving] = useState(false);
//   const { showError, showSuccess } = useNotification();

//   // Form validation
//   const isFormValid = useMemo(() => {
//     return tenant.name.trim().length > 0;
//   }, [tenant]);

//   const fetchTenants = async () => {
//     setLoading(true);
//     try {
//       const res = await tenantService.list();
//       setTenantsList(res || []);
//     } catch {
//       showError('Erreur lors du chargement des tenants');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchTenants();
//   }, []);

//   const handleCreate = () => {
//     setEditing(false);
//     setTenant(dafaultTenant);
//     setOpenModal(true);
//   };

//   const handleEdit = (org: Tenant) => {
//     setEditing(true);
//     setTenant(org);
//     setOpenModal(true);
//   };

//   const handleDeleteClick = (org: Tenant) => {
//     setTenant(org);
//     setOpenDeleteModal(true);
//   };

//   const handleSave = async (event: React.FormEvent) => {
//     event.preventDefault();
//     if (!isFormValid) {
//       showError("Renseigner tous les champs !.");
//       return;
//     }

//     setSaving(true);
//     try {
//       if (editing && tenant && tenant.id) {
//         const res = await tenantService.update(tenant.id, tenant);
//         if (res) {
//           showSuccess('Tenant mise à jour avec succès');
//           setOpenModal(false);
//           fetchTenants();
//         } else {
//           showError('Erreur lors de la mise à jour');
//         }
//       } else {
//         const res = await tenantService.save(tenant);
//         if (res) {
//           showSuccess('Tenant créée avec succès');
//           setOpenModal(false);
//           fetchTenants();
//         } else {
//           showError('Erreur lors de la création');
//         }
//       }
//     } catch {
//       showError('Erreur lors de la sauvegarde');
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleDelete = async () => {
//     if (!tenant || !tenant.id) return;

//     try {
//       const res = await tenantService.remove(tenant.id);
//       if (res) {
//         showSuccess('Tenant supprimée avec succès');
//         setOpenDeleteModal(false);
//         setTenant(dafaultTenant);
//         fetchTenants();
//       } else {
//         showError('Erreur lors de la suppression');
//       }
//     } catch {
//       showError('Erreur lors de la suppression');
//     }
//   };

//   function setValue(key: keyof Tenant, value: string): void {
//     const old = {...tenant, };
//     (old as any)[key] = value;
//     setTenant(old)
//   }

//   return (
//     <>
//       <div className={styles.card}>
//         <div className={styles.cardHeader}>
//           <h3 className={styles.cardTitle}>
//             <Building2 size={20} />
//             Gestion des tenants
//           </h3>
//           <div className={styles.buttonGroup}>
//             <button
//               className={`${styles.btn} ${styles.btnOutline} ${styles.btnSmall}`}
//               onClick={fetchTenants}
//               disabled={loading}
//             >
//               <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
//               Actualiser
//             </button>
//             <button
//               className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSmall}`}
//               onClick={handleCreate}
//             >
//               <Plus size={16} />
//               Nouveau tenant
//             </button>
//           </div>
//         </div>

//         {loading ? (
//           <div className={styles.loading}>
//             <RefreshCw size={24} className="animate-spin" />
//           </div>
//         ) : tenantsList.length === 0 ? (
//           <div className={styles.emptyState}>
//             <Building2 size={48} />
//             <p>Aucun tenant</p>
//             <button
//               className={`${styles.btn} ${styles.btnPrimary}`}
//               onClick={handleCreate}
//             >
//               Créer un tenant
//             </button>
//           </div>
//         ) : (
//           <Table
//             data={tenantsList as any}
//             columns={columns as any}
//             keyExtractor={(org: any) => org.id as string}
//             isLoading={loading}
//             emptyMessage="Aucun tenant trouvée"
//             features={{
//               search: true,
//               export: true,
//               pagination: true,
//               pageSize: true,
//               animate: true,
//               columnVisibility: true,
//               scrollable: true,
//             }}
//             searchPlaceholder="Rechercher un tenant..."
//             exportFilename="tenants"
//             exportFormats={['csv', 'excel', 'json']}
//             defaultPageSize={10}
//             pageSizeOptions={[10, 25, 50, 100]}
//             stickyHeader
//             maxHeight="600px"
//           />
//         )}
//       </div>

//       {/* Create/Edit Modal */}
//       <Modal
//         isOpen={openModal}
//         onClose={() => setOpenModal(false)}
//         title={editing ? "Modifier le tenant" : 'Nouveau tenant'}
//         size="sm"
//         footer={
//           <div className={styles.buttonGroup}>
//             <Button variant="outline" size="sm" onClick={() => setOpenModal(false)}>
//               Annuler
//             </Button>
//             <Button variant="primary" size="sm" onClick={handleSave} disabled={!isFormValid || saving}>
//               <Save size={16} />
//               {saving ? 'Enregistrement...' : 'Enregistrer'}
//             </Button>
//           </div>
//         }
//       >
//         <CustomForm />
//       </Modal>

//       {/* Delete Confirmation Modal */}
//       <Modal
//         isOpen={openDeleteModal}
//         onClose={() => setOpenDeleteModal(false)}
//         title="Confirmer la suppression"
//         size="sm"
//         footer={
//           <div className={styles.buttonGroup}>
//             <Button variant="outline" size="sm" onClick={() => setOpenDeleteModal(false)}>
//               Annuler
//             </Button>
//             <Button variant="danger" size="sm" onClick={handleDelete}>
//               <Trash2 size={16} />
//               Supprimer
//             </Button>
//           </div>
//         }
//       >
//         <div className={styles.emptyState} style={{ padding: '1rem' }}>
//           <Trash2 size={24} style={{ color: '#dc2626', marginBottom: '0.5rem' }} />
//           <p>
//             Êtes-vous sûr de vouloir supprimer le tenant <strong>{tenant?.name}</strong> ?
//           </p>
//           <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Cette action est irréversible.</p>
//         </div>
//       </Modal>
//     </>
//   );
// }
