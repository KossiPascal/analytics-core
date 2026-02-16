import { Table, type Column } from '@components/ui/Table/Table';
import { Button } from '@components/ui/Button/Button';
import { Edit, Trash2 } from 'lucide-react';
import type { Region } from '../../types';
import shared from '@components/ui/styles/shared.module.css';

interface Props {
  data: Region[];
  isLoading: boolean;
  onEdit: (item: Region) => void;
  onDelete: (item: Region) => void;
}

export function RegionsTable({ data, isLoading, onEdit, onDelete }: Props) {
  const columns: Column<Region>[] = [
    { key: 'name', header: 'Nom', render: (r) => r.name, sortable: true },
    { key: 'code', header: 'Code', render: (r) => r.code, sortable: true },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (r) => (
        <div className={shared.actionsCell}>
          <button className={shared.actionBtn} onClick={() => onEdit(r)}><Edit size={16} /></button>
          <button className={`${shared.actionBtn} ${shared.actionBtnDanger}`} onClick={() => onDelete(r)}><Trash2 size={16} /></button>
        </div>
      ),
    },
  ];

  return (
    <Table<any>       data={data}
      columns={columns}
      keyExtractor={(r) => r.id}
      isLoading={isLoading}
      features={{ search: true, pagination: true }}
      searchPlaceholder="Rechercher une region..."
      emptyMessage="Aucune region"
    />
  );
}
