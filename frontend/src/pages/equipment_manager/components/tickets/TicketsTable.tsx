import { Table, type Column } from '@components/ui/Table/Table';
import { Badge } from '@components/ui/Badge/Badge';
import { Eye } from 'lucide-react';
import type { RepairTicket } from '../../types';
import { STATUS_LABELS } from '../../types';
import shared from '@components/ui/styles/shared.module.css';

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'secondary'> = {
  OPEN: 'warning',
  IN_PROGRESS: 'info',
  REPAIRED: 'success',
  RETURNING: 'info',
  CLOSED: 'success',
  CANCELLED: 'danger',
};

interface Props {
  data: RepairTicket[];
  isLoading: boolean;
  onView: (item: RepairTicket) => void;
}

export function TicketsTable({ data, isLoading, onView }: Props) {
  const columns: Column<RepairTicket>[] = [
    { key: 'number', header: 'Numero', render: (t) => t.ticket_number, sortable: true },
    { key: 'equipment', header: 'Equipement', render: (t) => `${t.equipment_brand || ''} ${t.equipment_model || ''}`.trim() || t.equipment_imei || '-' },
    { key: 'asc', header: 'ASC', render: (t) => t.asc_name || '-' },
    {
      key: 'status',
      header: 'Statut',
      render: (t) => <Badge variant={STATUS_VARIANT[t.status] || 'secondary'}>{STATUS_LABELS[t.status] || t.status}</Badge>,
    },
    {
      key: 'stage',
      header: 'Etape',
      render: (t) => <Badge variant="info">{t.current_stage_label}</Badge>,
    },
    {
      key: 'delay',
      header: 'Delai',
      render: (t) => (
        <Badge variant={t.delay_color === 'red' ? 'danger' : t.delay_color === 'yellow' ? 'warning' : 'success'}>
          {t.delay_days}j
        </Badge>
      ),
      sortable: true,
    },
    {
      key: 'date',
      header: 'Date',
      render: (t) => t.created_at ? new Date(t.created_at).toLocaleDateString('fr') : '-',
      sortable: true,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (t) => (
        <button className={shared.actionBtn} onClick={() => onView(t)}><Eye size={16} /></button>
      ),
    },
  ];

  return (
    <Table
      data={data}
      columns={columns}
      keyExtractor={(t) => t.id}
      isLoading={isLoading}
      features={{ search: true, pagination: true }}
      searchPlaceholder="Rechercher par numero..."
      emptyMessage="Aucun ticket"
    />
  );
}
