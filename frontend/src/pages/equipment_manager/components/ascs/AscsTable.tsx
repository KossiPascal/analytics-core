import { Table, type Column } from '@components/ui/Table/Table';
import { Badge } from '@components/ui/Badge/Badge';
import { Edit, Eye, Trash2 } from 'lucide-react';
import type { ASC } from '../../types';

interface Props {
  data: ASC[];
  isLoading: boolean;
  onEdit: (item: ASC) => void;
  onView: (item: ASC) => void;
  onDelete: (item: ASC) => void;
}

export function AscsTable({ data, isLoading, onEdit, onView, onDelete }: Props) {
  const columns: Column<ASC>[] = [
    { key: 'code', header: 'Code', render: (a) => a.code, sortable: true },
    { key: 'name', header: 'Nom', render: (a) => a.full_name, sortable: true },
    { key: 'site', header: 'Site', render: (a) => a.site_name || '-' },
    {
      key: 'status',
      header: 'Statut',
      render: (a) => (
        <Badge variant={a.is_active ? 'success' : 'danger'}>
          {a.is_active ? 'Actif' : 'Inactif'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      actionsMenu: (a) => [
        { label: 'Voir', icon: <Eye size={15} />, onClick: () => onView(a) },
        { label: 'Modifier', icon: <Edit size={15} />, onClick: () => onEdit(a), separator: true },
        { label: 'Supprimer', icon: <Trash2 size={15} />, onClick: () => onDelete(a), danger: true },
      ],
    },
  ];

  return (
    <Table<any>
      data={data}
      columns={columns}
      keyExtractor={(a) => a.id}
      isLoading={isLoading}
      features={{ search: true, pagination: true }}
      searchPlaceholder="Rechercher un ASC..."
      emptyMessage="Aucun ASC"
    />
  );
}
