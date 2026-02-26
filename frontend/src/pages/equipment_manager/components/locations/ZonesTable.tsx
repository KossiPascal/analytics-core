import { Table, type Column } from '@components/ui/Table/Table';
import { Edit } from 'lucide-react';
import type { ZoneASC } from '../../types';

interface Props {
  data: ZoneASC[];
  isLoading: boolean;
  onEdit: (item: ZoneASC) => void;
}

export function ZonesTable({ data, isLoading, onEdit }: Props) {
  const columns: Column<ZoneASC>[] = [
    { key: 'name', header: 'Nom', render: (z) => z.name, sortable: true },
    { key: 'code', header: 'Code', render: (z) => z.code, sortable: true },
    { key: 'site', header: 'Site', render: (z) => z.site_name || '-' },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      actionsMenu: (z) => [
        { label: 'Modifier', icon: <Edit size={15} />, onClick: () => onEdit(z) },
      ],
    },
  ];

  return (
    <Table<any>
      data={data}
      columns={columns}
      keyExtractor={(z) => z.id}
      isLoading={isLoading}
      features={{ search: true, pagination: true }}
      searchPlaceholder="Rechercher une zone..."
      emptyMessage="Aucune zone"
    />
  );
}
