import { Table, type Column } from '@components/ui/Table/Table';
import { Edit } from 'lucide-react';
import type { District } from '../../types';

interface Props {
  data: District[];
  isLoading: boolean;
  onEdit: (item: District) => void;
}

export function DistrictsTable({ data, isLoading, onEdit }: Props) {
  const columns: Column<District>[] = [
    { key: 'name', header: 'Nom', render: (d) => d.name, sortable: true },
    { key: 'code', header: 'Code', render: (d) => d.code, sortable: true },
    { key: 'region', header: 'Region', render: (d) => d.region_name || '-' },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      actionsMenu: (d) => [
        { label: 'Modifier', icon: <Edit size={15} />, onClick: () => onEdit(d) },
      ],
    },
  ];

  return (
    <Table<any>
      data={data}
      columns={columns}
      keyExtractor={(d) => d.id}
      isLoading={isLoading}
      features={{ search: true, pagination: true }}
      searchPlaceholder="Rechercher un district..."
      emptyMessage="Aucun district"
    />
  );
}
