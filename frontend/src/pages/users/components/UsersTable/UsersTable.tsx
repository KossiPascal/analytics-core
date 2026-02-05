import { UserPlus, Edit2, Trash2 } from 'lucide-react';
import { Table, type Column } from '@components/ui/Table/Table';
import { Button } from '@components/ui/Button/Button';
import { StatusBadge, RoleBadge } from '@components/ui/Badge/Badge';
import type { User } from '@/models/OLD/old/auth.types';
import shared from '@components/ui/styles/shared.module.css';

interface UsersTableProps {
  users: User[];
  isLoading: boolean;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onCreate: () => void;
  getUserRoleNames: (user: User) => string;
}

export function UsersTable({
  users,
  isLoading,
  onEdit,
  onDelete,
  onCreate,
  getUserRoleNames,
}: UsersTableProps) {
  const columns: Column<User>[] = [
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
      render: (user) => user.fullname || '-',
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      searchable: true,
      render: (user) => user.email || '-',
    },
    {
      key: 'roles',
      header: 'Rôles',
      render: (user) => <RoleBadge>{getUserRoleNames(user)}</RoleBadge>,
      searchable: false,
    },
    {
      key: 'isActive',
      header: 'Statut',
      sortable: true,
      align: 'center',
      render: (user) => <StatusBadge isActive={user.isActive} />,
      searchable: false,
    },
    {
      key: 'id',
      header: 'Actions',
      align: 'center',
      render: (user) => (
        <div className={shared.actionsCell}>
          <button className={shared.actionBtn} onClick={() => onEdit(user)} title="Modifier">
            <Edit2 size={16} />
          </button>
          <button
            className={`${shared.actionBtn} ${shared.actionBtnDanger}`}
            onClick={() => onDelete(user)}
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
      data={users as any}
      columns={columns as any}
      keyExtractor={(user: any) => user.id as string}
      isLoading={isLoading}
      emptyMessage="Aucun utilisateur trouvé"
      features={{
        search: true,
        export: true,
        pagination: true,
        pageSize: true,
        animate: true,
        columnVisibility: true,
      }}
      searchPlaceholder="Rechercher un utilisateur..."
      exportFilename="utilisateurs"
      exportFormats={['csv', 'excel', 'json']}
      defaultPageSize={10}
      pageSizeOptions={[10, 25, 50, 100]}
      stickyHeader
    />
  );
}
