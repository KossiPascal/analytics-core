import { UserPlus, Edit2, Trash2 } from 'lucide-react';
import { Table, type Column } from '@components/ui/Table/Table';
import { Button } from '@components/ui/Button/Button';
import { StatusBadge } from '@components/ui/Badge/Badge';
import type { ApiUser } from '../../types';
import shared from '@components/ui/styles/shared.module.css';

interface Props {
  users: ApiUser[];
  isLoading: boolean;
  onEdit: (user: ApiUser) => void;
  onDelete: (user: ApiUser) => void;
  onCreate: () => void;
}

export function UsersTable({ users, isLoading, onEdit, onDelete, onCreate }: Props) {
  const columns: Column<ApiUser>[] = [
    {
      key: 'username',
      header: "Nom d'utilisateur",
      sortable: true,
      searchable: true,
    },
    {
      key: 'fullname',
      header: 'Nom complet',
      sortable: true,
      searchable: true,
      render: (u) => u.fullname || '-',
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      searchable: true,
      render: (u) => u.email || '-',
    },
    {
      key: 'roles',
      header: 'Rôles',
      render: (u) => u.roles.length > 0 ? u.roles.join(', ') : '-',
      searchable: false,
    },
    {
      key: 'is_active',
      header: 'Statut',
      sortable: true,
      align: 'center',
      render: (u) => <StatusBadge isActive={u.is_active} />,
      searchable: false,
    },
    {
      key: 'id',
      header: 'Actions',
      align: 'center',
      render: (u) => (
        <div className={shared.actionsCell}>
          <button className={shared.actionBtn} onClick={() => onEdit(u)} title="Modifier">
            <Edit2 size={16} />
          </button>
          <button
            className={`${shared.actionBtn} ${shared.actionBtnDanger}`}
            onClick={() => onDelete(u)}
            title="Supprimer"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
      searchable: false,
    },
  ];

  if (users.length === 0 && !isLoading) {
    return (
      <div className={shared.emptyState}>
        <UserPlus size={48} />
        <p>Aucun utilisateur</p>
        <Button variant="primary" onClick={onCreate}>
          Créer un utilisateur
        </Button>
      </div>
    );
  }

  return (
    <Table
      data={users}
      columns={columns}
      keyExtractor={(u) => u.id}
      isLoading={isLoading}
      emptyMessage="Aucun utilisateur trouvé"
      features={{ search: true, export: true, pagination: true, pageSize: true, animate: true, columnVisibility: true }}
      searchPlaceholder="Rechercher un utilisateur..."
      exportFilename="utilisateurs"
      exportFormats={['csv', 'excel', 'json']}
      defaultPageSize={10}
      pageSizeOptions={[10, 25, 50, 100]}
      stickyHeader
    />
  );
}
