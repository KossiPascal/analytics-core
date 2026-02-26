import { type Column } from '@components/ui/Table/Table';
import { Building2 } from 'lucide-react';
import { UserRole } from '@models/identity.model';
import { userRoleService } from '@/services/identity.service';
import { AdminEntityCrudModule } from '@pages/admins/AdminEntityCrudModule';


// Columns definition
const userRoleColumns: Column<UserRole>[] = [
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
    <AdminEntityCrudModule<UserRole>
      title="UserRole"
      icon={<Building2 size={20} />}
      entityName="UserRole"
      columns={userRoleColumns}
      defaultValue={{} as any}
      service={userRoleService}
      isValid={(ur: UserRole): boolean => true}   
      enableActions={false}
    />
  );
}
