import { Table, type Column } from '@components/ui/Table/Table';
import { Badge } from '@components/ui/Badge/Badge';
import { Edit, Eye, ArrowRightLeft, FileText, AlertTriangle } from 'lucide-react';
import type { Equipment } from '../../types';
import { EQUIPMENT_STATUS_LABELS, EQUIPMENT_STATUS_VARIANT } from '../../types';
import shared from '@components/ui/styles/shared.module.css';

interface Props {
  data: Equipment[];
  isLoading: boolean;
  onEdit: (item: Equipment) => void;
  onView: (item: Equipment) => void;
  onAssign: (item: Equipment) => void;
  onGeneratePdf: (item: Equipment) => void;
  onDeclare: (item: Equipment) => void;
}

export function EquipmentTable({ data, isLoading, onEdit, onView, onAssign, onGeneratePdf, onDeclare }: Props) {
  const columns: Column<Equipment>[] = [
    { key: 'imei', header: 'IMEI', render: (e) => e.imei, sortable: true },
    { key: 'type', header: 'Type', render: (e) => e.category_name || e.equipment_type || '-' },
    { key: 'brand', header: 'Marque/Modele', render: (e) => `${e.brand_name || e.brand || ''} ${e.model_name}`.trim() },
    { key: 'owner', header: 'Proprietaire', render: (e) => e.owner_name || e.employee_name || '-' },
    {
      key: 'status',
      header: 'Statut',
      render: (e) => (
        <Badge variant={EQUIPMENT_STATUS_VARIANT[e.status] || 'secondary'}>
          {EQUIPMENT_STATUS_LABELS[e.status] || e.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (e) => (
        <div className={shared.actionsCell}>
          <button className={shared.actionBtn} title="Voir les détails" onClick={() => onView(e)}><Eye size={16} /></button>
          <button
            className={shared.actionBtn}
            title="Assigner"
            onClick={() => onAssign(e)}
            disabled={!e.is_active}
            style={!e.is_active ? { opacity: 0.35, cursor: 'not-allowed' } : undefined}
          >
            <ArrowRightLeft size={16} />
          </button>
          <button className={shared.actionBtn} title="Fiche de réception PDF" onClick={() => onGeneratePdf(e)}><FileText size={16} /></button>
          <button
            className={shared.actionBtn}
            title="Modifier"
            onClick={() => onEdit(e)}
            disabled={!e.is_active}
            style={!e.is_active ? { opacity: 0.35, cursor: 'not-allowed' } : undefined}
          >
            <Edit size={16} />
          </button>
          <button
            className={shared.actionBtn}
            title={e.is_active ? 'Déclarer (Perdu / Volé / Emporté / Gâté)' : 'Annuler la déclaration'}
            onClick={() => onDeclare(e)}
            style={{ color: e.is_active ? 'var(--color-warning, #f59e0b)' : 'var(--color-success, #10b981)' }}
          >
            <AlertTriangle size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <Table<any>
      data={data}
      columns={columns}
      keyExtractor={(e) => e.id}
      isLoading={isLoading}
      features={{ search: true, pagination: true }}
      searchPlaceholder="Rechercher par IMEI, marque..."
      emptyMessage="Aucun equipement"
    />
  );
}
