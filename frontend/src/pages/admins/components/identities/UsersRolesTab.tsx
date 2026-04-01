import { type Column } from '@components/ui/Table/Table';
import { Building2 } from 'lucide-react';
import { Role } from '@models/identity.model';
import { RoleService } from '@/services/identity.service';
import { AdminEntityCrudModule } from '@pages/admins/AdminEntityCrudModule';


// Columns definition
const RoleColumns: Column<Role>[] = [
  {
    key: "user",
    header: "Utilisateur",
    render: (ur) => ur?.user ? ur.user.fullname : "",
    sortable: true,
    searchable: true,
  },
  {
    key: "role",
    header: "Role",
    render: (ur) => ur?.role ? ur.role.name : "",
    sortable: true,
    searchable: true,
  }
];

export function UsersRolesTab() {
  return (
    <AdminEntityCrudModule<Role>
      title="Role"
      icon={<Building2 size={20} />}
      entityName="Role"
      columns={RoleColumns}
      defaultValue={{} as any}
      service={RoleService}
      isValid={(ur: Role): boolean => true}   
      enableActions={false}
    />
  );
}
