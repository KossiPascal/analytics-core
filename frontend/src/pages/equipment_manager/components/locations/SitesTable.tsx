import { Table, type Column } from '@components/ui/Table/Table';
import { Edit } from 'lucide-react';
import type { Site } from '../../types';

interface Props {
  data: Site[];
  isLoading: boolean;
  onEdit: (item: Site) => void;
}

export function SitesTable({ data, isLoading, onEdit }: Props) {
  const columns: Column<Site>[] = [
    { key: 'name', header: 'Nom', render: (s) => s.name, sortable: true },
    { key: 'code', header: 'Code', render: (s) => s.code, sortable: true },
    { key: 'district', header: 'District', render: (s) => s.district_name || '-' },
    { key: 'region', header: 'Region', render: (s) => s.region_name || '-' },
    { key: 'phone', header: 'Telephone', render: (s) => s.phone || '-' },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      actionsMenu: (s) => [
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
      searchPlaceholder="Rechercher un site..."
      emptyMessage="Aucun site"
    />
  );
}
