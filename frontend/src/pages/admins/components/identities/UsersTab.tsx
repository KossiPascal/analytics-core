import { User as UserIcon } from 'lucide-react';
import { StatusBadge } from '@components/ui/Badge/Badge';
import { type Column } from '@components/ui/Table/Table';
import { FormInput } from '@components/forms/FormInput/FormInput';
import { Tenant, Role, User, Orgunit } from '@models/identity.model';
import { tenantService, roleService, userService,orgunitService } from '@services/identity.service';
import { forwardRef, useEffect, useState } from 'react';
import { FormCheckbox } from '@components/forms/FormCheckbox/FormCheckbox';
import { FormMultiSelect } from '@components/forms/FormSelect/FormMultiSelect';
import { FormSelect } from '@components/forms/FormSelect/FormSelect';
import { AdminEntityCrudModuleRef, AdminEntityCrudModule } from '@pages/admins/AdminEntityCrudModule';

const defaultUser: User = {
  id: null,
  username: "",
  lastname: "",
  firstname: "",
  password: "",
  password_confirm: '',
  email: "",
  phone: "",
  tenant_id: null,
  role_ids: [],
  permission_ids: [],
  orgunit_ids: [],
  is_active: false,
};

const userColumns: Column<User>[] = [
  {
    key: "tenant",
    header: "tenant",
    render: (user) => user?.tenant ? user.tenant.name : "",
    sortable: true,
    searchable: false,
  },
  {
    key: "username",
    header: "Username",
    sortable: true,
    searchable: true,
  },
  {
    key: "lastname",
    header: "Nom",
    sortable: true,
    searchable: true,
  },
  {
    key: "firstname",
    header: "Prénoms",
    sortable: true,
    searchable: true,
  },
  {
    key: "email",
    header: "Email",
    sortable: true,
    searchable: true,
  },
  {
    key: "phone",
    header: "Téléphone",
    sortable: true,
  },
  {
    key: "roles",
    header: "Rôles",
    render: (u) => {
      if(!u.roles || u.roles.length === 0) return "-";
      return u.roles.map((r) => r.name).join(", ");
    },
    searchable: false,
  },
  {
    key: "permissions",
    header: "Permissions",
    render: (u) => {
      if(!u.permissions || u.permissions.length === 0) return "-";
      return u.permissions.map((p) => p.name).join(", ");
    },
    searchable: false,
  },
  {
    key: "orgunits",
    header: "Orgunits",
    render: (u) => {
      if(!u.orgunits || u.orgunits.length === 0) return "-";
      return u.orgunits.map((o) => o.name).join(", ");
    },
    searchable: false,
  },
  {
    key: "is_active",
    header: "Statut",
    align: "center",
    render: (u) => (<StatusBadge isActive={u.is_active === true} />),
    searchable: false,
  },
];

export const UsersTab = forwardRef<AdminEntityCrudModuleRef>((props, ref) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [orgunits, setOrgunits] = useState<Orgunit[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const tenantRes = await tenantService.all();
      const roleRes = await roleService.all();
      const orgunitRes = await orgunitService.all();
      // const orgunitRes = [{ "id": 1, "name": "Country" }, { "id": 2, "name": "Region" }];
      setTenants(tenantRes || []);
      setRoles(roleRes || []);
      setOrgunits(orgunitRes || []);
    } catch {
      // showError(`Erreur chargement`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  return (
    <AdminEntityCrudModule<User>
      ref={ref}
      title="Gestion des utilisateurs"
      icon={<UserIcon size={20} />}
      entityName="User"
      columns={userColumns}
      defaultValue={defaultUser}
      service={userService}
      isValid={(u) =>{
        if(!u.username || !u.lastname|| !u.firstname) return false;
        const isVaid = (
          u.username.trim().length > 0 &&
          u.lastname.trim().length > 0 &&
          u.firstname.trim().length > 0
        )
        return isVaid && (u.password === u.password_confirm);
      }
      }
      renderForm={(user, setValue) => (
        <>
          <FormSelect
            label={`Tenant`}
            value={user.tenant_id}
            options={tenants.map((c) => ({ value: c.id, label: c.name }))}
            onChange={(value) => { setValue("tenant_id", value) }}
            placeholder="Sélectionner Tenant"
            required
          />
          <FormInput
            label="Username"
            value={user.username}
            onChange={(e) => setValue("username", e.target.value)}
            required
          />
          <FormInput
            label="Nom"
            value={user.lastname}
            onChange={(e) => setValue("lastname", e.target.value)}
            required
          />
          <FormInput
            label="Prénoms"
            value={user.firstname}
            onChange={(e) => setValue("firstname", e.target.value)}
            required
          />
          <FormInput
            label="Email"
            type="email"
            value={user.email}
            onChange={(e) => setValue("email", e.target.value)}
          />
          <FormInput
            label="Mot de passe"
            type="password"
            value={user.password}
            onChange={(e) => setValue("password", e.target.value)}
            placeholder="........"
            required={user.id === null}
          />
          <FormInput
            label="Confirme Mot de passe"
            type="password"
            value={user.password_confirm}
            onChange={(e) => setValue("password_confirm", e.target.value)}
            placeholder="........"
            required={user.id === null}
          />
          <FormInput
            label="Téléphone"
            type="tel"
            value={user.phone}
            onChange={(e) => setValue("phone", e.target.value)}
          />
          <FormMultiSelect
            label={`Rôles`}
            value={user.role_ids}
            options={roles.map((r) => ({ value: r.id, label: r.name }))}
            onChange={(values) => setValue("role_ids", values.filter(v => v !== null))}
            placeholder="Sélectionner Rôle"
            required
          />
          <FormMultiSelect
            label={`Orgunits`}
            value={user.orgunit_ids}
            options={orgunits.map((c) => ({ value: c.id, label: c.name }))}
            onChange={(values) => setValue("orgunit_ids", values.filter(v => v !== null))}
            placeholder="Sélectionner Permissions"
            required
          />
          <FormCheckbox
            label={`Actif`}
            checked={Boolean(user.is_active)}
            onChange={(e) => setValue("is_active", e.target.checked)}
          />
        </>
      )}
    />
  );
});



// import { UserPlus, Edit2, Trash2 } from 'lucide-react';
// import { Table, type Column } from '@components/ui/Table/Table';
// import { Button } from '@components/ui/Button/Button';
// import { StatusBadge, RoleBadge } from '@components/ui/Badge/Badge';
// import shared from '@components/ui/styles/shared.module.css';
// import { User } from '../../../models/identity.model';
// import { userService } from '@/services/identity.service';



// userService
// export function UsersTab({users,isLoading,onEdit,onDelete,onCreate,getRolesName}: UserProp) {
//   const columns: Column<User>[] = [
//     {
//       key: 'username',
//       header: "Nom d'utilisateur",
//       sortable: true,
//       searchable: true,
//     },
//     {
//       key: 'fullname',
//       header: 'Nom complet',
//       sortable: true,
//       searchable: true,
//       render: (user) => user.fullname || '-',
//     },
//     {
//       key: 'email',
//       header: 'Email',
//       sortable: true,
//       searchable: true,
//       render: (user) => user.email || '-',
//     },
//     {
//       key: 'roles',
//       header: 'Rôles',
//       render: (user) => <RoleBadge>{getRolesName(user)}</RoleBadge>,
//       searchable: false,
//     },
//     {
//       key: 'isActive',
//       header: 'Statut',
//       sortable: true,
//       align: 'center',
//       render: (user) => <StatusBadge isActive={user.isActive} />,
//       searchable: false,
//     },
//     {
//       key: 'id',
//       header: 'Actions',
//       align: 'center',
//       render: (user) => (
//         <div className={shared.actionsCell}>
//           <button className={shared.actionBtn} onClick={() => onEdit(user)} title="Modifier">
//             <Edit2 size={16} />
//           </button>
//           <button
//             className={`${shared.actionBtn} ${shared.actionBtnDanger}`}
//             onClick={() => onDelete(user)}
//             title="Supprimer"
//           >
//             <Trash2 size={16} />
//           </button>
//         </div>
//       ),
//       searchable: false,
//     },
//   ];

//   if (users.length === 0 && !isLoading) {
//     return (
//       <div className={shared.emptyState}>
//         <UserPlus size={48} />
//         <p>Aucun utilisateur</p>
//         <Button variant="primary" onClick={onCreate}>
//           Créer un utilisateur
//         </Button>
//       </div>
//     );
//   }

//   return (
//     <Table
//       data={users as any}
//       columns={columns as any}
//       keyExtractor={(user: any) => user.id as string}
//       isLoading={isLoading}
//       emptyMessage="Aucun utilisateur trouvé"
//       features={{
//         search: true,
//         export: true,
//         pagination: true,
//         pageSize: true,
//         animate: true,
//         columnVisibility: true,
//       }}
//       searchPlaceholder="Rechercher un utilisateur..."
//       exportFilename="utilisateurs"
//       exportFormats={['csv', 'excel', 'json']}
//       defaultPageSize={10}
//       pageSizeOptions={[10, 25, 50, 100]}
//       stickyHeader
//     />
//   );
// }
