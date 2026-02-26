import { Table, type Column } from '@components/ui/Table/Table';
import { Badge } from '@components/ui/Badge/Badge';
import { Edit, Eye } from 'lucide-react';
import type { Supervisor } from '../../types';

interface Props {
  data: Supervisor[];
  isLoading: boolean;
  onEdit: (item: Supervisor) => void;
  onView: (item: Supervisor) => void;
}

export function SupervisorsTable({ data, isLoading, onEdit, onView }: Props) {
  const columns: Column<Supervisor>[] = [
    { key: 'code', header: 'Code', render: (s) => s.code, sortable: true },
    { key: 'name', header: 'Nom', render: (s) => s.full_name, sortable: true },
    { key: 'email', header: 'Email', render: (s) => s.email || '-' },
    { key: 'phone', header: 'Telephone', render: (s) => s.phone || '-' },
    {
      key: 'sites',
      header: 'Sites',
      render: (s) => <Badge variant="info">{s.sites.length} site{s.sites.length !== 1 ? 's' : ''}</Badge>,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      actionsMenu: (s) => [
        { label: 'Voir', icon: <Eye size={15} />, onClick: () => onView(s) },
        { label: 'Modifier', icon: <Edit size={15} />, onClick: () => onEdit(s) },
      ],
    },
  ];

  return (
    <Table<any>
      data={data}
      columns={columns}
      keyExtractor={(s) => s.id}
      isLoading={isLoading}
      features={{ search: true, pagination: true }}
      searchPlaceholder="Rechercher un superviseur..."
      emptyMessage="Aucun superviseur"
    />
  );
}
