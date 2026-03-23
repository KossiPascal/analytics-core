import { Shield } from 'lucide-react';
import { forwardRef, useEffect, useRef, useState } from 'react';
import { type Column } from '@components/ui/Table/Table';
import { FormInput } from '@components/forms/FormInput/FormInput';
import { FormTextarea } from '@components/forms/FormTextarea/FormTextarea';
import { Tenant, Permission, Role } from '@models/identity.model';
import { tenantService, permissionService, roleService } from '@services/identity.service';
import { FormMultiSelect } from '@components/forms/FormSelect/FormMultiSelect';
import { FormSelect } from '@components/forms/FormSelect/FormSelect';
import { FormCheckbox } from '@components/forms/FormCheckbox/FormCheckbox';
import { StatusBadge } from '@components/ui/Badge/Badge';
import { AdminEntityCrudModuleRef, AdminEntityCrudModule } from '@pages/admins/AdminEntityCrudModule';
import { useAuth } from '@/contexts/AuthContext';
import { FaDatabase } from 'react-icons/fa';

const defaultRole: Role = {
  id: null,
  name: "",
  description: "",
  tenant_id: null,
  permission_ids: [],
  is_system: false,
};

const roleColumns: Column<Role>[] = [
  {
    key: "name",
    header: "Nom",
    sortable: true,
    searchable: true,
  },
  {
    key: "tenant",
    header: "Tenant",
    render: (r) => r.tenant?.name || "-",
    sortable: true,
    searchable: true,
    getSearchValue: (r) => r.tenant?.name || "",
    getSortValue: (r) => r.tenant?.name || "",
  },
  {
    key: "authorizations",
    header: "Permissions",
    render: (r) => r.permissions?.length ? r.permissions.map(p => p.name).join(", ") : "-",
    sortable: false,
    searchable: true,
    getSearchValue: (r) => r.permissions?.map(p => p.name).join(" ") || "",
  },
  {
    key: "description",
    header: "Description",
    sortable: true,
    searchable: true,
    render: (r) => r.description || "-",
  },
  {
    key: "is_system",
    header: "Is System",
    sortable: true,
    align: "center",
    searchable: false,
    render: (r) => (<StatusBadge isActive={r.is_system === true} />),
    getSortValue: (r) => r.is_system ? 1 : 0,
  },
];

export const RolesTab = forwardRef<AdminEntityCrudModuleRef>((props, ref) => {
  const { isSuperAdmin, user } = useAuth();

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [tenant_id, setTenantId] = useState<number | undefined>();
  const [loading, setLoading] = useState(true);


  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    tenantService.list().then(t => {
      setTenants(t || []);
      setTenantId(user?.tenant_id);
    });
  }, []);

  const fetchInitialData = async () => {
    if(!tenant_id) return;
    setLoading(true);
    try {
      const permsRes = await permissionService.list(tenant_id);
      setPermissions(permsRes || []);
    } catch {
      // showError(`Erreur chargement`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [tenant_id]);

  return (
    <>
      <div className="grid grid-cols-2 gap-4 pt-2">
        <FormSelect
          label="Tenant"
          value={tenant_id}
          options={tenants.map((t) => ({ value: t.id, label: t.name }))}
          onChange={(value) => setTenantId(value)}
          leftIcon={<FaDatabase />}
          required
        />
      </div>

      <AdminEntityCrudModule<Role>
        ref={ref}
        title="Gestion des rôles"
        icon={<Shield size={20} />}
        entityName="Role"
        columns={roleColumns}
        defaultValue={defaultRole}
        service={roleService}
        isValid={(r) => r.name.trim().length > 0}
        renderForm={(role, setValue) => (
          <>
            <FormInput
              label="Nom du rôle"
              value={role.name}
              onChange={(e) => setValue("name", e.target.value)}
              required
            />
            <FormSelect
              label={`Tenant`}
              value={role.tenant_id}
              options={tenants.map((c) => ({ value: c.id, label: c.name }))}
              onChange={(value) => { setValue("tenant_id", value) }}
              placeholder="Sélectionner Tenant"
              required
            />
            <FormMultiSelect
              label={`Permission`}
              value={role.permission_ids}
              options={permissions.map((c) => ({ value: c.id, label: c.name }))}
              onChange={(values) => setValue("permission_ids", values.filter(v => v !== null))}
              placeholder="Sélectionner Permissions"
              required
            />
            <FormCheckbox
              label={`Is System`}
              checked={Boolean(role.is_system)}
              onChange={(e) => setValue("is_system", e.target.checked)}
            />
            <FormTextarea
              label="Description"
              hint="Optionnel"
              placeholder="Description du role"
              value={role.description || ""}
              onChange={(e) => setValue("description", e.target.value)}
            />
          </>
        )}
      />
    </>
  );
});








// import { ShieldPlus, Edit2, Trash2 } from 'lucide-react';
// import { Table, type Column } from '@components/ui/Table/Table';
// import { Button } from '@components/ui/Button/Button';
// import { PermissionBadge } from '@components/ui/Badge/Badge';
// import shared from '@components/ui/styles/shared.module.css';
// import { Role } from '../../../models/identity.model';
// import { useState } from 'react';
// import { roleService } from '@/services/identity.service';


// roleService
// export const RolesTab: React.FC<any> = () => {

//   // Roles state
//   const [roles, setRoles] = useState<Role[]>([]);
//   const [isRolesLoading, setIsRolesLoading] = useState(false);
//   const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
//   const [isDeleteRoleModalOpen, setIsDeleteRoleModalOpen] = useState(false);
//   const [selectedRole, setSelectedRole] = useState<Role | null>(null);
//   const [isRoleEditMode, setIsRoleEditMode] = useState(false);
//   const [roleName, setRoleName] = useState('');
//   const [selectedRolePermissions, setSelectedRolePermissions] = useState<string[]>([]);
//   const [isRoleSaving, setIsRoleSaving] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);




//   const handleCreateRole = () => {
//     setIsRoleEditMode(false);
//     setSelectedRole(null);
//     setRoleName('');
//     setSelectedRolePermissions([]);
//     setIsRoleModalOpen(true);
//   };

//   const handleEditRole = (role: Role) => {
//     setIsRoleEditMode(true);
//     setSelectedRole(role);
//     setRoleName(role.name);
//     setSelectedRolePermissions(role.authorizations || []);
//     setIsRoleModalOpen(true);
//   };

//   const handleDeleteRoleClick = (role: Role) => {
//     setSelectedRole(role);
//     setIsDeleteRoleModalOpen(true);
//   };



//   // Role handlers
//   const toggleRolePermission = (value: string) => {
//     setSelectedRolePermissions((prev) =>
//       prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
//     );
//   };

//   const handleSaveRole = async (event: React.FormEvent) => {
//     event.preventDefault();
//     if (!roleName.trim()) {
//       showError('Le nom du rôle est requis.');
//       return;
//     }

//     setIsRoleSaving(true);
//     try {
//       if (isRoleEditMode && selectedRole) {
//         const response = await AuthApi.updateRole({
//           id: selectedRole.id,
//           name: roleName,
//           authorizations: selectedRolePermissions,
//         });
//         if (response?.status === 200) {
//           showSuccess('Rôle mis à jour avec succès');
//           setIsRoleModalOpen(false);
//           fetchRoles();
//         } else {
//           showError('Erreur lors de la mise à jour');
//         }
//       } else {
//         const response = await AuthApi.createRole({
//           name: roleName,
//           authorizations: selectedRolePermissions,
//         });
//         if (response?.status === 200) {
//           showSuccess('Rôle créé avec succès');
//           setIsRoleModalOpen(false);
//           fetchRoles();
//         } else {
//           showError('Erreur lors de la création');
//         }
//       }
//     } catch {
//       showError('Erreur lors de la sauvegarde');
//     } finally {
//       setIsRoleSaving(false);
//     }
//   };

//   const handleDeleteRole = async () => {
//     if (!selectedRole) return;

//     try {
//       const response = await AuthApi.deleteRole({ id: selectedRole.id });
//       if (response?.status === 200) {
//         showSuccess('Rôle supprimé avec succès');
//         setIsDeleteRoleModalOpen(false);
//         setSelectedRole(null);
//         fetchRoles();
//       } else {
//         showError('Erreur lors de la suppression');
//       }
//     } catch {
//       showError('Erreur lors de la suppression');
//     }
//   };


//   const fetchPermissions = async () => {
//     setIsPermissionsLoading(true);
//     try {
//       const response = await PermissionsApi.getPermissions();
//       if (response?.status === 200) {
//         setPermissions((response.data as Permission[]) || []);
//       }
//     } catch {
//       showError('Erreur lors du chargement des permissions');
//     } finally {
//       setIsPermissionsLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchPermissions();
//   }, []);

//   const columns: Column<Role>[] = [
//     {
//       key: 'name',
//       header: 'Nom',
//       sortable: true,
//       searchable: true,
//     },
//     {
//       key: 'authorizations',
//       header: 'Permissions',
//       render: (role) => (
//         <div className={shared.list}>
//           {role.authorizations?.slice(0, 3).map((perm) => (
//             <PermissionBadge key={perm}>
//               {availablePermissions.find((p) => p.value === perm)?.label || perm}
//             </PermissionBadge>
//           ))}
//           {role.authorizations?.length > 3 && (
//             <PermissionBadge>+{role.authorizations.length - 3}</PermissionBadge>
//           )}
//         </div>
//       ),
//       searchable: false,
//     },
//     {
//       key: 'id',
//       header: 'Actions',
//       align: 'center',
//       render: (role) => (
//         <div className={shared.actionsCell}>
//           <button className={shared.actionBtn} onClick={() => onEdit(role)} title="Modifier">
//             <Edit2 size={16} />
//           </button>
//           <button
//             className={`${shared.actionBtn} ${shared.actionBtnDanger}`}
//             onClick={() => onDelete(role)}
//             title="Supprimer"
//           >
//             <Trash2 size={16} />
//           </button>
//         </div>
//       ),
//       searchable: false,
//     },
//   ];

//   if (roles.length === 0 && !isLoading) {
//     return (
//       <div className={shared.emptyState}>
//         <ShieldPlus size={48} />
//         <p>Aucun rôle</p>
//         <Button variant="primary" onClick={onCreate}>
//           Créer un rôle
//         </Button>
//       </div>
//     );
//   }

//   return (
//     <Table
//       data={roles as any}
//       columns={columns as any}
//       keyExtractor={(role: any) => role.id as string}
//       isLoading={isLoading}
//       emptyMessage="Aucun rôle trouvé"
//       features={{
//         search: true,
//         export: true,
//         pagination: true,
//         pageSize: true,
//         animate: true,
//         columnVisibility: true,
//       }}
//       searchPlaceholder="Rechercher un rôle..."
//       exportFilename="roles"
//       exportFormats={['csv', 'excel', 'json']}
//       defaultPageSize={10}
//       pageSizeOptions={[10, 25, 50, 100]}
//       stickyHeader
//     />
//   );
// }
