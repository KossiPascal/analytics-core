import { Table, type Column } from '@components/ui/Table/Table';
import { Badge } from '@components/ui/Badge/Badge';
import { ArrowRightLeft, Edit, Eye, ToggleLeft, ToggleRight } from 'lucide-react';
import type { Employee } from '../../types';
import shared from '@components/ui/styles/shared.module.css';

interface Props {
  data: Employee[];
  isLoading: boolean;
  onEdit: (item: Employee) => void;
  onView: (item: Employee) => void;
  onToggleActive: (item: Employee) => void;
  onTransfer: (item: Employee) => void;
}

export function EmployeesTable({ data, isLoading, onEdit, onView, onToggleActive, onTransfer }: Props) {
  const columns: Column<Employee>[] = [
    { key: 'code', header: 'Code', render: (e) => e.employee_id_code, sortable: true },
    { key: 'name', header: 'Nom', render: (e) => e.full_name, sortable: true },
    { key: 'department', header: 'Departement', render: (e) => e.department_name || '-' },
    { key: 'position', header: 'Poste', render: (e) => e.position_name || '-' },
    { key: 'phone', header: 'Telephone', render: (e) => e.phone || '-' },
    {
      key: 'status',
      header: 'Statut',
      render: (e) => <Badge variant={e.is_active ? 'success' : 'danger'}>{e.is_active ? 'Actif' : 'Inactif'}</Badge>,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (e) => (
        <div className={shared.actionsCell}>
          <button className={shared.actionBtn} title="Voir le détail" onClick={() => onView(e)}>
            <Eye size={16} />
          </button>
          <button
            className={shared.actionBtn}
            title={e.is_active ? 'Modifier' : "Employé inactif — activez-le d'abord"}
            disabled={!e.is_active}
            style={!e.is_active ? { opacity: 0.35, cursor: 'not-allowed' } : undefined}
            onClick={() => e.is_active && onEdit(e)}
          >
            <Edit size={16} />
          </button>
          {e.equipment_count > 0 && (
            <button
              className={shared.actionBtn}
              title="Transférer un équipement"
              onClick={() => onTransfer(e)}
            >
              <ArrowRightLeft size={16} />
            </button>
          )}
          <button
            className={shared.actionBtn}
            title={e.is_active ? 'Désactiver' : 'Activer'}
            onClick={() => onToggleActive(e)}
          >
            {e.is_active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
          </button>
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
      searchPlaceholder="Rechercher un employe..."
      emptyMessage="Aucun employe"
    />
  );
}
