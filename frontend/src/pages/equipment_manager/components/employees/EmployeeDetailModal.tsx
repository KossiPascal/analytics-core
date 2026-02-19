import { useState, useEffect } from 'react';
import { Modal } from '@components/ui/Modal/Modal';
import { Badge } from '@components/ui/Badge/Badge';
import { Button } from '@components/ui/Button/Button';
import { Spinner } from '@components/ui/Spinner/Spinner';
import { Table, type Column } from '@components/ui/Table/Table';
import { ArrowRightLeft, PackagePlus } from 'lucide-react';
import { employeesApi } from '../../api';
import type { Employee, EmployeeHistory, Equipment } from '../../types';
import { EQUIPMENT_STATUS_LABELS, EQUIPMENT_STATUS_VARIANT } from '../../types';
import { AssignEquipmentToEmployeeModal } from './AssignEquipmentToEmployeeModal';
import { TransferEquipmentModal } from './TransferEquipmentModal';
import styles from '../../EquipmentManager.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string | null;
}

export function EmployeeDetailModal({ isOpen, onClose, employeeId }: Props) {
  const [employee, setEmployee] = useState<(Employee & { history: EmployeeHistory[]; equipments: Equipment[] }) | null>(null);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [assignOpen, setAssignOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

  useEffect(() => {
    if (isOpen && employeeId) loadDetail();
    else setEmployee(null);
  }, [isOpen, employeeId]);

  const loadDetail = async () => {
    if (!employeeId) return;
    setLoading(true);
    const [empRes, allRes] = await Promise.all([
      employeesApi.get(employeeId),
      employeesApi.getAll({ active: 'true' }),
    ]);
    if (empRes.success) setEmployee(empRes.data!);
    if (allRes.success) setAllEmployees(allRes.data!);
    setLoading(false);
  };

  const handleActionSuccess = () => loadDetail();

  const historyColumns: Column<EmployeeHistory>[] = [
    { key: 'action', header: 'Action', render: (h) => h.action },
    { key: 'old', header: 'Ancien dept.', render: (h) => h.old_department_name || '-' },
    { key: 'new', header: 'Nouveau dept.', render: (h) => h.new_department_name || '-' },
    { key: 'notes', header: 'Notes', render: (h) => h.notes || '-' },
    { key: 'date', header: 'Date', render: (h) => h.timestamp ? new Date(h.timestamp).toLocaleDateString('fr') : '-' },
  ];

  const equipColumns: Column<Equipment>[] = [
    { key: 'imei', header: 'IMEI', render: (e) => e.imei },
    { key: 'type', header: 'Type', render: (e) => e.category_name || e.equipment_type || '—' },
    { key: 'brand', header: 'Marque / Modèle', render: (e) => `${e.brand} ${e.model_name}`.trim() || '—' },
    {
      key: 'status',
      header: 'Statut',
      render: (e) => (
        <Badge variant={EQUIPMENT_STATUS_VARIANT[e.status] ?? 'secondary'}>
          {EQUIPMENT_STATUS_LABELS[e.status] ?? e.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (e) => (
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ArrowRightLeft size={14} />}
          title="Transférer vers un autre employé"
          disabled={!e.is_active}
          onClick={() => { setSelectedEquipment(e); setTransferOpen(true); }}
        >
          Transférer
        </Button>
      ),
    },
  ];

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={employee ? `Employé : ${employee.full_name}` : 'Détail Employé'}
        size="lg"
      >
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <Spinner />
          </div>
        ) : employee ? (
          <div>
            {/* Informations générales */}
            <div className={styles.detailGrid}>
              <div className={styles.detailItem}><span className={styles.detailLabel}>Code</span><span className={styles.detailValue}>{employee.employee_id_code}</span></div>
              <div className={styles.detailItem}><span className={styles.detailLabel}>Département</span><span className={styles.detailValue}>{employee.department_name || '-'}</span></div>
              <div className={styles.detailItem}><span className={styles.detailLabel}>Poste</span><span className={styles.detailValue}>{employee.position_name || '-'}</span></div>
              <div className={styles.detailItem}><span className={styles.detailLabel}>Genre</span><span className={styles.detailValue}>{employee.gender || '-'}</span></div>
              <div className={styles.detailItem}><span className={styles.detailLabel}>Téléphone</span><span className={styles.detailValue}>{employee.phone || '-'}</span></div>
              <div className={styles.detailItem}><span className={styles.detailLabel}>Email</span><span className={styles.detailValue}>{employee.email || '-'}</span></div>
              <div className={styles.detailItem}><span className={styles.detailLabel}>Date embauche</span><span className={styles.detailValue}>{employee.hire_date || '-'}</span></div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Statut</span>
                <Badge variant={employee.is_active ? 'success' : 'danger'}>
                  {employee.is_active ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
            </div>

            {/* Section équipements */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', marginBottom: '0.5rem' }}>
              <h4 className={styles.sectionTitle} style={{ margin: 0 }}>
                Équipements ({employee.equipments?.length ?? 0})
              </h4>
              {employee.is_active && (
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<PackagePlus size={14} />}
                  onClick={() => setAssignOpen(true)}
                >
                  Attribuer un équipement
                </Button>
              )}
            </div>

            {employee.equipments && employee.equipments.length > 0 ? (
              <Table<any>
                data={employee.equipments}
                columns={equipColumns}
                keyExtractor={(e) => e.id}
                defaultPageSize={5}
              />
            ) : (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0.5rem 0 1rem' }}>
                Aucun équipement attribué
              </p>
            )}

            {/* Historique */}
            {employee.history && employee.history.length > 0 && (
              <>
                <h4 className={styles.sectionTitle}>Historique</h4>
                <Table<any>
                  data={employee.history}
                  columns={historyColumns}
                  keyExtractor={(h) => h.id}
                  defaultPageSize={5}
                />
              </>
            )}
          </div>
        ) : null}
      </Modal>

      <AssignEquipmentToEmployeeModal
        isOpen={assignOpen}
        onClose={() => setAssignOpen(false)}
        onSuccess={handleActionSuccess}
        employee={employee}
      />

      <TransferEquipmentModal
        isOpen={transferOpen}
        onClose={() => { setTransferOpen(false); setSelectedEquipment(null); }}
        onSuccess={handleActionSuccess}
        equipment={selectedEquipment}
        currentEmployee={employee}
        employees={allEmployees}
      />
    </>
  );
}
