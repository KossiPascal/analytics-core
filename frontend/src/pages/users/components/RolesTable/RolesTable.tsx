import { ShieldPlus, Edit2, Trash2 } from 'lucide-react';
import { Table, type Column } from '@components/ui/Table';
import { Button, PermissionBadge } from '@components/ui';
import shared from '@components/ui/styles/shared.module.css';

interface Role {
  id: string;
  name: string;
  organization?: string;
  authorizations: string[];
  isDeleted: boolean;
}

interface RolesTableProps {
  roles: Role[];
  isLoading: boolean;
  onEdit: (role: Role) => void;
  onDelete: (role: Role) => void;
  onCreate: () => void;
  availablePermissions: { value: string; label: string }[];
}

export function RolesTable({
  roles,
  isLoading,
  onEdit,
  onDelete,
  onCreate,
  availablePermissions,
}: RolesTableProps) {
  const columns: Column<Role>[] = [
    {
      key: 'name',
      header: 'Nom',
      sortable: true,
      searchable: true,
    },
    {
      key: 'authorizations',
      header: 'Permissions',
      render: (role) => (
        <div className={shared.list}>
          {role.authorizations?.slice(0, 3).map((perm) => (
            <PermissionBadge key={perm}>
              {availablePermissions.find((p) => p.value === perm)?.label || perm}
            </PermissionBadge>
          ))}
          {role.authorizations?.length > 3 && (
            <PermissionBadge>+{role.authorizations.length - 3}</PermissionBadge>
          )}
        </div>
      ),
      searchable: false,
    },
    {
      key: 'id',
      header: 'Actions',
      align: 'center',
      render: (role) => (
        <div className={shared.actionsCell}>
          <button className={shared.actionBtn} onClick={() => onEdit(role)} title="Modifier">
            <Edit2 size={16} />
          </button>
          <button
            className={`${shared.actionBtn} ${shared.actionBtnDanger}`}
            onClick={() => onDelete(role)}
            title="Supprimer"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
      searchable: false,
    },
  ];

  if (roles.length === 0 && !isLoading) {
    return (
      <div className={shared.emptyState}>
        <ShieldPlus size={48} />
        <p>Aucun rôle</p>
        <Button variant="primary" onClick={onCreate}>
          Créer un rôle
        </Button>
      </div>
    );
  }

  return (
    <Table
      data={roles as any}
      columns={columns as any}
      keyExtractor={(role: any) => role.id as string}
      isLoading={isLoading}
      emptyMessage="Aucun rôle trouvé"
      features={{
        search: true,
        export: true,
        pagination: true,
        pageSize: true,
        animate: true,
        columnVisibility: true,
      }}
      searchPlaceholder="Rechercher un rôle..."
      exportFilename="roles"
      exportFormats={['csv', 'excel', 'json']}
      defaultPageSize={10}
      pageSizeOptions={[10, 25, 50, 100]}
      stickyHeader
    />
  );
}
