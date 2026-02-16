import { Table, type Column } from '@components/ui/Table/Table';
import { Badge } from '@components/ui/Badge/Badge';
import { Edit, Eye, Trash2 } from 'lucide-react';
import type { ASC } from '../../types';
import shared from '@components/ui/styles/shared.module.css';

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
      render: (a) => (
        <div className={shared.actionsCell}>
          <button className={shared.actionBtn} onClick={() => onView(a)}><Eye size={16} /></button>
          <button className={shared.actionBtn} onClick={() => onEdit(a)}><Edit size={16} /></button>
          <button className={`${shared.actionBtn} ${shared.actionBtnDanger}`} onClick={() => onDelete(a)}><Trash2 size={16} /></button>
        </div>
      ),
    },
  ];

  return (
    <Table
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
