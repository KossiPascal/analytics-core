import { Table, type Column } from '@components/ui/Table/Table';
import { Badge } from '@components/ui/Badge/Badge';
import { Edit } from 'lucide-react';
import type { Position } from '../../types';

interface Props {
  data: Position[];
  isLoading: boolean;
  onEdit: (item: Position) => void;
}

export function PositionsTable({ data, isLoading, onEdit }: Props) {
  const columns: Column<Position>[] = [
    {
      key: 'name',
      header: 'Nom',
      sortable: true,
      render: (p) => (
        <span>
          {p.parent_name && (
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginRight: '0.4rem' }}>
              {p.parent_name} ›
            </span>
          )}
          <strong>{p.name}</strong>
        </span>
      ),
    },
    {
      key: 'department',
      header: 'Département',
      render: (p) => p.department_name
        ? <Badge variant="info">{p.department_name}</Badge>
        : <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>—</span>,
    },
    {
      key: 'parent',
      header: 'Poste supérieur',
      render: (p) => p.parent_name
        ? <Badge variant="secondary">{p.parent_name}</Badge>
        : <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>— Racine</span>,
    },
    { key: 'code', header: 'Code', render: (p) => p.code, sortable: true },
    { key: 'description', header: 'Description', render: (p) => p.description || '-' },
    {
      key: 'status',
      header: 'Statut',
      render: (p) => <Badge variant={p.is_active ? 'success' : 'danger'}>{p.is_active ? 'Actif' : 'Inactif'}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      actionsMenu: (p) => [
        { label: 'Modifier', icon: <Edit size={15} />, onClick: () => onEdit(p) },
      ],
    },
  ];

  return (
    <Table<any>
      data={data}
      columns={columns}
      keyExtractor={(p) => p.id}
      isLoading={isLoading}
      features={{ search: true, pagination: true }}
      searchPlaceholder="Rechercher un poste..."
      emptyMessage="Aucun poste"
    />
  );
}
