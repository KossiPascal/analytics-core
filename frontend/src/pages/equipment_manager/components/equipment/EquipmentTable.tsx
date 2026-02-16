import { Table, type Column } from '@components/ui/Table/Table';
import { Badge } from '@components/ui/Badge/Badge';
import { Edit, Eye, ArrowRightLeft } from 'lucide-react';
import type { Equipment } from '../../types';
import shared from '@components/ui/styles/shared.module.css';

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger'> = {
  FUNCTIONAL: 'success',
  FAULTY: 'danger',
  UNDER_REPAIR: 'warning',
};

const STATUS_LABEL: Record<string, string> = {
  FUNCTIONAL: 'Fonctionnel',
  FAULTY: 'Defaillant',
  UNDER_REPAIR: 'En reparation',
};

interface Props {
  data: Equipment[];
  isLoading: boolean;
  onEdit: (item: Equipment) => void;
  onView: (item: Equipment) => void;
  onAssign: (item: Equipment) => void;
}

export function EquipmentTable({ data, isLoading, onEdit, onView, onAssign }: Props) {
  const columns: Column<Equipment>[] = [
    { key: 'imei', header: 'IMEI', render: (e) => e.imei, sortable: true },
    { key: 'type', header: 'Type', render: (e) => e.equipment_type },
    { key: 'brand', header: 'Marque/Modele', render: (e) => `${e.brand} ${e.model_name}` },
    { key: 'owner', header: 'Proprietaire', render: (e) => e.owner_name || e.employee_name || '-' },
    {
      key: 'status',
      header: 'Statut',
      render: (e) => <Badge variant={STATUS_VARIANT[e.status] || 'secondary'}>{STATUS_LABEL[e.status] || e.status}</Badge>,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (e) => (
        <div className={shared.actionsCell}>
          <button className={shared.actionBtn} onClick={() => onView(e)}><Eye size={16} /></button>
          <button className={shared.actionBtn} onClick={() => onAssign(e)}><ArrowRightLeft size={16} /></button>
          <button className={shared.actionBtn} onClick={() => onEdit(e)}><Edit size={16} /></button>
        </div>
      ),
    },
  ];

  return (
    <Table<any>       data={data}
      columns={columns}
      keyExtractor={(e) => e.id}
      isLoading={isLoading}
      features={{ search: true, pagination: true }}
      searchPlaceholder="Rechercher par IMEI, marque..."
      emptyMessage="Aucun equipement"
    />
  );
}
