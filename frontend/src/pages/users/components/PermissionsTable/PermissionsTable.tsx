import { ShieldCheck, Edit2, Trash2 } from 'lucide-react';
import { Table, type Column } from '@components/ui/Table';
import { Button, CrudBadge } from '@components/ui';
import shared from '@components/ui/styles/shared.module.css';

interface Permission {
  id: string;
  name: string;
  description?: string;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PermissionsTableProps {
  permissions: Permission[];
  isLoading: boolean;
  onEdit: (permission: Permission) => void;
  onDelete: (permission: Permission) => void;
  onCreate: () => void;
}

export function PermissionsTable({
  permissions,
  isLoading,
  onEdit,
  onDelete,
  onCreate,
}: PermissionsTableProps) {
  const renderCrudBadges = (perm: Permission) => {
    const badges = [];
    if (perm.canCreate) badges.push({ label: 'C', title: 'Créer' });
    if (perm.canRead) badges.push({ label: 'R', title: 'Lire' });
    if (perm.canUpdate) badges.push({ label: 'U', title: 'Modifier' });
    if (perm.canDelete) badges.push({ label: 'D', title: 'Supprimer' });

    return badges.map((b) => <CrudBadge key={b.label} label={b.label} title={b.title} />);
  };

  const columns: Column<Permission>[] = [
    {
      key: 'name',
      header: 'Nom',
      sortable: true,
      searchable: true,
    },
    {
      key: 'description',
      header: 'Description',
      sortable: true,
      searchable: true,
      render: (perm) => perm.description || '-',
    },
    {
      key: 'canCreate',
      header: 'CRUD',
      render: (perm) => <div className={shared.list}>{renderCrudBadges(perm)}</div>,
      searchable: false,
    },
    {
      key: 'id',
      header: 'Actions',
      align: 'center',
      render: (perm) => (
        <div className={shared.actionsCell}>
          <button className={shared.actionBtn} onClick={() => onEdit(perm)} title="Modifier">
            <Edit2 size={16} />
          </button>
          <button
            className={`${shared.actionBtn} ${shared.actionBtnDanger}`}
            onClick={() => onDelete(perm)}
            title="Supprimer"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
      searchable: false,
    },
  ];

  if (permissions.length === 0 && !isLoading) {
    return (
      <div className={shared.emptyState}>
        <ShieldCheck size={48} />
        <p>Aucune permission</p>
        <Button variant="primary" onClick={onCreate}>
          Créer une permission
        </Button>
      </div>
    );
  }

  return (
    <Table
      data={permissions as any}
      columns={columns as any}
      keyExtractor={(perm: any) => perm.id as string}
      isLoading={isLoading}
      emptyMessage="Aucune permission trouvée"
      features={{
        search: true,
        export: true,
        pagination: true,
        pageSize: true,
        animate: true,
        columnVisibility: true,
      }}
      searchPlaceholder="Rechercher une permission..."
      exportFilename="permissions"
      exportFormats={['csv', 'excel', 'json']}
      defaultPageSize={10}
      pageSizeOptions={[10, 25, 50, 100]}
      stickyHeader
    />
  );
}
