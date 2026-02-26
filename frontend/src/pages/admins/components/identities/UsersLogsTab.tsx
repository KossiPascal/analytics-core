import { type Column } from '@components/ui/Table/Table';
import { Building2 } from 'lucide-react';
import { UsersLog } from '@models/identity.model';
import { usersLogService } from '@services/identity.service';
import { AdminEntityCrudModule } from '@pages/admins/AdminEntityCrudModule';


// Columns definition
const usersLogColumns: Column<UsersLog>[] = [
  {
    key: "user_id",
    header: "user_id",
    sortable: true,
    searchable: true,
  },
  {
    key: "user_agent",
    header: "user_agent",
    sortable: true,
    searchable: true,
  }
];

export function UsersLogsTab() {
  return (
    <AdminEntityCrudModule<UsersLog>
      title="UsersLogs"
      icon={<Building2 size={20} />}
      entityName="UsersLog"
      columns={usersLogColumns}
      defaultValue={{} as any}
      service={usersLogService}
      isValid={(ul: UsersLog): boolean => true}
      enableActions={false}
     />
  );
}
