import { Table, type Column } from '@components/ui/Table/Table';
import { Edit, Trash2 } from 'lucide-react';
import type { Region } from '../../types';

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
      actionsMenu: (r) => [
        { label: 'Modifier', icon: <Edit size={15} />, onClick: () => onEdit(r) },
        { label: 'Supprimer', icon: <Trash2 size={15} />, onClick: () => onDelete(r), danger: true, separator: true },
      ],
    },
  ];

  return (
    <Table<any>
      data={data}
      columns={columns}
      keyExtractor={(r) => r.id}
      isLoading={isLoading}
      features={{ search: true, pagination: true }}
      searchPlaceholder="Rechercher une region..."
      emptyMessage="Aucune region"
    />
  );
}
