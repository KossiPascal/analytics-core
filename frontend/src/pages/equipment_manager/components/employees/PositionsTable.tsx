import { Table, type Column } from '@components/ui/Table/Table';
import { Badge } from '@components/ui/Badge/Badge';
import { Edit } from 'lucide-react';
import type { Position } from '../../types';
import shared from '@components/ui/styles/shared.module.css';

interface Props {
  data: Position[];
  isLoading: boolean;
  onEdit: (item: Position) => void;
}

export function PositionsTable({ data, isLoading, onEdit }: Props) {
  const columns: Column<Position>[] = [
    { key: 'name', header: 'Nom', render: (p) => p.name, sortable: true },
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
      render: (p) => (
        <button className={shared.actionBtn} onClick={() => onEdit(p)}><Edit size={16} /></button>
      ),
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
