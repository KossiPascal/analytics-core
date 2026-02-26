import { Key } from 'lucide-react';
import { forwardRef } from 'react';
import { Permission } from '@models/identity.model';
import { type Column } from '@components/ui/Table/Table';
import { FormInput } from '@components/forms/FormInput/FormInput';
import { FormTextarea } from '@components/forms/FormTextarea/FormTextarea';
import { permissionService } from '@services/identity.service';
import { AdminEntityCrudModuleRef, AdminEntityCrudModule } from '@pages/admins/AdminEntityCrudModule';

const defaultPermission: Permission = {
  id: null,
  name: "",
  description: "",
};

const permissionColumns: Column<Permission>[] = [
  {
    key: "name",
    header: "Permission",
    sortable: true,
    searchable: true,
  },
  {
    key: "description",
    header: "Description",
    sortable: true,
    searchable: true,
    render: (p) => p.description || "-",
  },
];

export const PermissionsTab = forwardRef<AdminEntityCrudModuleRef>((props, ref) => {
  return (
    <AdminEntityCrudModule<Permission>
      ref={ref}
      title="Gestion des permissions"
      icon={<Key size={20} />}
      entityName="Permission"
      columns={permissionColumns}
      defaultValue={defaultPermission}
      service={permissionService}
      isValid={(p) => {
        return p.name.trim().length > 0;
        // /^can:(create|read|update|delete)$/.test(p.name);
      }}
      renderForm={(permission, setValue) => (
        <>
          <FormInput
            label="Nom de la permission"
            placeholder="Ex: can:create"
            value={permission.name}
            onChange={(e) => setValue("name", e.target.value)}
            required
          />

          <FormTextarea
            label="Description"
            hint="Optionnel"
            placeholder="Description de la permission"
            value={permission.description || ""}
            onChange={(e) => setValue("description", e.target.value)}
          />
        </>
      )}
    />
  );
});







// import { ShieldCheck, Edit2, Trash2 } from 'lucide-react';
// import { Table, type Column } from '@components/ui/Table/Table';
// import { Button } from '@components/ui/Button/Button';
// import { CrudBadge } from '@components/ui/Badge/Badge';
// import shared from '@components/ui/styles/shared.module.css';
// import { Permission } from '../../../models/identity.model';
// import { useEffect, useState } from 'react';
// import { permService } from '@/services/identity.service';



// export const PermissionsTab:React.FC<any> = () => {
//   // Permissions state
//   const [permissions, setPermissions] = useState<Permission[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [isPermModalOpen, setIsPermModalOpen] = useState(false);
//   const [isDeletePermModalOpen, setIsDeletePermModalOpen] = useState(false);
//   const [selectedPerm, setSelectedPerm] = useState<Permission | null>(null);
//   const [isPermEditMode, setIsPermEditMode] = useState(false);
//   const [permissionName, setPermissionName] = useState('');
//   const [permissionDescription, setPermissionDescription] = useState('');
//   const [canCreate, setCanCreate] = useState(false);
//   const [canRead, setCanRead] = useState(true);
//   const [canUpdate, setCanUpdate] = useState(false);
//   const [canDelete, setCanDelete] = useState(false);
//   const [isPermSaving, setIsPermSaving] = useState(false);


//   // Fetch functions
//   const fetchRoles = async () => {
//     setIsRolesLoading(true);
//     try {
//       const response = await AuthApi.getRoles();
//       if (response?.status === 200) {
//         setRoles((response.data as Role[]) || []);
//       }
//     } catch {
//       showError('Erreur lors du chargement des rôles');
//     } finally {
//       setIsRolesLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchRoles();
//   }, []);

//   const columns: Column<Permission>[] = [
//     {
//       key: 'name',
//       header: 'Nom',
//       sortable: true,
//       searchable: true,
//     },
//     {
//       key: 'description',
//       header: 'Description',
//       sortable: true,
//       searchable: true,
//       render: (perm) => perm.description || '-',
//     },
//     {
//       key: 'canCreate',
//       header: 'CRUD',
//       render: (perm) => <div className={shared.list}>{renderCrudBadges(perm)}</div>,
//       searchable: false,
//     },
//     {
//       key: 'id',
//       header: 'Actions',
//       align: 'center',
//       render: (perm) => (
//         <div className={shared.actionsCell}>
//           <button className={shared.actionBtn} onClick={() => onEdit(perm)} title="Modifier">
//             <Edit2 size={16} />
//           </button>
//           <button className={`${shared.actionBtn} ${shared.actionBtnDanger}`} onClick={() => onDelete(perm)} title="Supprimer" >
//             <Trash2 size={16} />
//           </button>
//         </div>
//       ),
//       searchable: false,
//     },
//   ];

//   if (permissions.length === 0 && !loading) {
//     return (
//       <div className={shared.emptyState}>
//         <ShieldCheck size={48} />
//         <p>Aucune permission</p>
//         <Button variant="primary" onClick={onCreate}>
//           Créer une permission
//         </Button>
//       </div>
//     );
//   }

//   return (
//     <Table
//       data={permissions as any}
//       columns={columns as any}
//       keyExtractor={(perm: any) => perm.id as string}
//       isLoading={loading}
//       emptyMessage="Aucune permission trouvée"
//       features={{
//         search: true,
//         export: true,
//         pagination: true,
//         pageSize: true,
//         animate: true,
//         columnVisibility: true,
//       }}
//       searchPlaceholder="Rechercher une permission..."
//       exportFilename="permissions"
//       exportFormats={['csv', 'excel', 'json']}
//       defaultPageSize={10}
//       pageSizeOptions={[10, 25, 50, 100]}
//       stickyHeader
//     />
//   );
// }
