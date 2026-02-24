import { Table, type Column } from '@components/ui/Table/Table';
import { Badge } from '@components/ui/Badge/Badge';
import { Edit, Eye, ArrowRightLeft, FileText, AlertTriangle } from 'lucide-react';
import type { Equipment } from '../../types';
import { EQUIPMENT_STATUS_LABELS, EQUIPMENT_STATUS_VARIANT } from '../../types';

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
    { key: 'equipment_code', header: 'Code', render: (e) => e.equipment_code, sortable: true, searchable: true },
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
      actionsMenu: (e) => [
        {
          label: 'Voir les détails',
          icon: <Eye size={15} />,
          onClick: () => onView(e),
        },
        {
          label: 'Assigner',
          icon: <ArrowRightLeft size={15} />,
          onClick: () => onAssign(e),
          disabled: !e.is_active || !!(e.is_unique && (e.owner_id || e.employee_id)),
          title: !e.is_active
            ? 'Équipement inactif'
            : e.is_unique && (e.owner_id || e.employee_id)
            ? `Déjà assigné à ${e.owner_name || e.employee_name}. Modifier pour changer.`
            : 'Assigner à un employé',
        },
        {
          label: 'Fiche de réception PDF',
          icon: <FileText size={15} />,
          onClick: () => onGeneratePdf(e),
        },
        {
          label: 'Modifier',
          icon: <Edit size={15} />,
          onClick: () => onEdit(e),
          disabled: !e.is_active,
          separator: true,
        },
        {
          label: e.is_active ? 'Déclarer (Perdu / Volé / Gâté)' : 'Annuler la déclaration',
          icon: <AlertTriangle size={15} />,
          onClick: () => onDeclare(e),
          style: { color: e.is_active ? 'var(--color-warning, #f59e0b)' : 'var(--color-success, #10b981)' },
        },
      ],
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
