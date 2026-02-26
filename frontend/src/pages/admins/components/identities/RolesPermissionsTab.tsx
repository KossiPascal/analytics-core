import { Building2 } from 'lucide-react';
import { type Column } from '@components/ui/Table/Table';
import { RolePermissionLink } from '@models/identity.model';
import { rolePermissionService } from '@services/identity.service';
import { AdminEntityCrudModule } from '@pages/admins/AdminEntityCrudModule';


// Columns definition
const rolePermissionColumns: Column<RolePermissionLink>[] = [
  {
    key: "role",
    header: "role",
    render: (rolPerm) => rolPerm.role ? rolPerm.role.name : "",
    sortable: true,
    searchable: true,
  },
  {
    key: "permission",
    header: "permission",
    render: (rolPerm) => rolPerm.permission ? rolPerm.permission.name : "",
    sortable: true,
    searchable: true,
  }
];

export function RolesPermissionsTab() {
  return (
    <AdminEntityCrudModule<RolePermissionLink>
      title="RolePermission"
      icon={<Building2 size={20} />}
      entityName="RolePermission"
      columns={rolePermissionColumns}
      service={rolePermissionService}
      enableActions={false}
     />
  );
}
