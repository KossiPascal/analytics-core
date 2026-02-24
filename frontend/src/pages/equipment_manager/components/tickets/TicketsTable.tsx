import { Table, type Column } from '@components/ui/Table/Table';
import { Badge } from '@components/ui/Badge/Badge';
import { Eye, ArrowRight, CheckCircle, Wrench, XCircle } from 'lucide-react';
import type { RepairTicket } from '../../types';
import { STATUS_LABELS } from '../../types';
import { useAuth } from '@/contexts/AuthContext';

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
  onSend: (id: string) => void;
  onReceive: (id: string) => void;
  onRepair: (id: string) => void;
  onCancel: (id: string) => void;
}

export function TicketsTable({ data, isLoading, onView, onSend, onReceive, onRepair, onCancel }: Props) {
  const { user, isAdmin } = useAuth();

  const columns: Column<RepairTicket>[] = [
    { key: 'number', header: 'Numero', render: (t) => t.ticket_number, sortable: true },
    { key: 'equipment', header: 'Equipement', render: (t) => `${t.equipment_brand || ''} ${t.equipment_model || ''}`.trim() || t.equipment_imei || '-' },
    { key: 'owner', header: 'Propriétaire', render: (t) => t.employee_name || '-' },
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
      actionsMenu: (t) => {
        const isActive = !['CLOSED', 'CANCELLED'].includes(t.status);
        // current_holder_id = null  → ticket envoyé, en attente de confirmation par le récepteur
        // current_holder_id = <id>  → ticket confirmé et détenu, prêt à être renvoyé
        const hasHolder = t.current_holder_id !== null;
        const isHolder  = t.current_holder_id === user?.id;
        const isCreator = t.created_by_id === user?.id;

        // Envoyer : seulement si le ticket est détenu (pas en transit)
        //   + être le détenteur ou admin
        const showSend = isActive && hasHolder
          && (isAdmin || isHolder)
          && t.current_stage !== 'RETURNED_ASC';

        // Confirmer réception : seulement si le ticket est en transit (pas de détenteur)
        //   visible pour tout utilisateur authentifié (le destinataire prévu vient confirmer)
        const showReceive = isActive && !hasHolder;

        // Marquer réparé : uniquement chez le réparateur/E-Santé, ticket en cours (pas déjà réparé),
        //   et l'utilisateur est détenteur ou admin
        const showRepair = isActive && hasHolder
          && (isAdmin || isHolder)
          && ['REPAIRER', 'ESANTE'].includes(t.current_stage)
          && t.status === 'IN_PROGRESS';

        // Annuler : ticket actif + admin, détenteur actuel, ou créateur
        const showCancel = isActive && (isAdmin || isHolder || isCreator);

        return [
          { label: 'Voir le détail', icon: <Eye size={15} />, onClick: () => onView(t) },
          ...(showReceive ? [{
            label: 'Confirmer réception',
            icon: <CheckCircle size={15} />,
            onClick: () => onReceive(t.id),
          }] : []),
          ...(showSend ? [{
            label: 'Envoyer',
            icon: <ArrowRight size={15} />,
            onClick: () => onSend(t.id),
          }] : []),
          ...(showRepair ? [{
            label: 'Marquer réparé',
            icon: <Wrench size={15} />,
            onClick: () => onRepair(t.id),
          }] : []),
          ...(showCancel ? [{
            label: 'Annuler',
            icon: <XCircle size={15} />,
            onClick: () => onCancel(t.id),
            danger: true as const,
            separator: true,
          }] : []),
        ];
      },
    },
  ];

  return (
    <Table<any>
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
