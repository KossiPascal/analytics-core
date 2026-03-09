import { Table, type Column } from '@components/ui/Table/Table';
import { Badge } from '@components/ui/Badge/Badge';
import { ArrowRightLeft, Edit, Eye, ToggleLeft, ToggleRight, UserCog } from 'lucide-react';
import type { Employee } from '../../types';

interface Props {
  data: Employee[];
  isLoading: boolean;
  onEdit: (item: Employee) => void;
  onView: (item: Employee) => void;
  onToggleActive: (item: Employee) => void;
  onTransfer: (item: Employee) => void;
  onManageUser: (item: Employee) => void;
}

export function EmployeesTable({ data, isLoading, onEdit, onView, onToggleActive, onTransfer, onManageUser }: Props) {
  const columns: Column<Employee>[] = [
    { key: 'employee_id_code', header: 'Code', render: (e) => e.employee_id_code, sortable: true },
    { key: 'full_name', header: 'Nom', render: (e) => e.full_name, sortable: true },
    { key: 'tenant_name', header: 'Tenant', render: (e) => e.tenant_name || '-', sortable: true },
    { key: 'position_name', header: 'Poste', render: (e) => e.position_name || '-', searchable: false },
    { key: 'phone', header: 'Telephone', render: (e) => e.phone || '-' },
    {
      key: 'is_active',
      header: 'Statut',
      searchable: false,
      render: (e) => <Badge variant={e.is_active ? 'success' : 'danger'}>{e.is_active ? 'Actif' : 'Inactif'}</Badge>,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      actionsMenu: (e) => [
        { label: 'Voir le détail', icon: <Eye size={15} />, onClick: () => onView(e) },
        {
          label: 'Modifier',
          icon: <Edit size={15} />,
          onClick: () => onEdit(e),
          disabled: !e.is_active,
          title: e.is_active ? 'Modifier' : "Employé inactif — activez-le d'abord",
        },
        ...(e.equipment_count > 0
          ? [{ label: 'Transférer un équipement', icon: <ArrowRightLeft size={15} />, onClick: () => onTransfer(e) }]
          : []),
        {
          label: e.user_id ? "Éditer l'utilisateur" : 'Créer un utilisateur',
          icon: <UserCog size={15} />,
          onClick: () => onManageUser(e),
          separator: true,
        },
        {
          label: e.is_active ? 'Désactiver' : 'Activer',
          icon: e.is_active ? <ToggleRight size={15} /> : <ToggleLeft size={15} />,
          onClick: () => onToggleActive(e),
          separator: true,
          style: { color: e.is_active ? 'var(--color-error, #ef4444)' : 'var(--color-success, #10b981)' },
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
      searchPlaceholder="Rechercher un employe..."
      emptyMessage="Aucun employe"
    />
  );
}
