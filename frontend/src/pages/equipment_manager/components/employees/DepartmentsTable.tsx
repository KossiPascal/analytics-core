import { Table, type Column } from '@components/ui/Table/Table';
import { Badge } from '@components/ui/Badge/Badge';
import { Edit } from 'lucide-react';
import type { Department } from '../../types';
import shared from '@components/ui/styles/shared.module.css';

interface Props {
  data: (Department & { children?: Department[] })[];
  isLoading: boolean;
  onEdit: (item: Department) => void;
}

export function DepartmentsTable({ data, isLoading, onEdit }: Props) {
  // Flatten tree for display
  const flattened: (Department & { level: number })[] = [];
  const flatten = (items: (Department & { children?: Department[] })[], level: number) => {
    for (const item of items) {
      flattened.push({ ...item, level });
      if (item.children && item.children.length > 0) {
        flatten(item.children, level + 1);
      }
    }
  };
  flatten(data, 0);

  const columns: Column<Department & { level: number }>[] = [
    {
      key: 'name',
      header: 'Nom',
      render: (d) => (
        <span style={{ paddingLeft: `${d.level * 1.5}rem` }}>
          {d.level > 0 && '└ '}
          {d.name}
        </span>
      ),
    },
    { key: 'code', header: 'Code', render: (d) => d.code },
    { key: 'description', header: 'Description', render: (d) => d.description || '-' },
    {
      key: 'status',
      header: 'Statut',
      render: (d) => <Badge variant={d.is_active ? 'success' : 'danger'}>{d.is_active ? 'Actif' : 'Inactif'}</Badge>,
    },
    {
      key: 'type',
      header: 'Type',
      render: (d) => <Badge variant={d.is_root ? 'primary' : 'secondary'}>{d.is_root ? 'Principal' : 'Sous-dept.'}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (d) => (
        <button className={shared.actionBtn} onClick={() => onEdit(d)}><Edit size={16} /></button>
      ),
    },
  ];

  return (
    <Table<any>       data={flattened}
      columns={columns}
      keyExtractor={(d) => d.id}
      isLoading={isLoading}
      features={{ search: true, pagination: true }}
      searchPlaceholder="Rechercher un departement..."
      emptyMessage="Aucun departement"
    />
  );
}
