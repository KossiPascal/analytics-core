import { useState, useEffect } from 'react';
import { Modal } from '@components/ui/Modal/Modal';
import { Badge } from '@components/ui/Badge/Badge';
import { Spinner } from '@components/ui/Spinner/Spinner';
import { Table, type Column } from '@components/ui/Table/Table';
import { employeesApi } from '../../api';
import type { Employee, EmployeeHistory, Equipment } from '../../types';
import styles from '../../EquipmentManager.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string | null;
}

export function EmployeeDetailModal({ isOpen, onClose, employeeId }: Props) {
  const [employee, setEmployee] = useState<(Employee & { history: EmployeeHistory[]; equipments: Equipment[] }) | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && employeeId) loadDetail();
  }, [isOpen, employeeId]);

  const loadDetail = async () => {
    if (!employeeId) return;
    setLoading(true);
    const res = await employeesApi.get(employeeId);
    if (res.success) setEmployee(res.data!);
    setLoading(false);
  };

  const historyColumns: Column<EmployeeHistory>[] = [
    { key: 'action', header: 'Action', render: (h) => h.action },
    { key: 'old', header: 'Ancien dept.', render: (h) => h.old_department_name || '-' },
    { key: 'new', header: 'Nouveau dept.', render: (h) => h.new_department_name || '-' },
    { key: 'notes', header: 'Notes', render: (h) => h.notes || '-' },
    { key: 'date', header: 'Date', render: (h) => h.timestamp ? new Date(h.timestamp).toLocaleDateString('fr') : '-' },
  ];

  const equipColumns: Column<Equipment>[] = [
    { key: 'imei', header: 'IMEI', render: (e) => e.imei },
    { key: 'type', header: 'Type', render: (e) => e.equipment_type },
    { key: 'brand', header: 'Marque/Modele', render: (e) => `${e.brand} ${e.model_name}` },
    { key: 'status', header: 'Statut', render: (e) => <Badge variant={e.status === 'FUNCTIONAL' ? 'success' : 'warning'}>{e.status}</Badge> },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={employee ? `Employe: ${employee.full_name}` : 'Detail Employe'} size="lg">
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><Spinner /></div>
      ) : employee ? (
        <div>
          <div className={styles.detailGrid}>
            <div className={styles.detailItem}><span className={styles.detailLabel}>Code</span><span className={styles.detailValue}>{employee.employee_id_code}</span></div>
            <div className={styles.detailItem}><span className={styles.detailLabel}>Departement</span><span className={styles.detailValue}>{employee.department_name}</span></div>
            <div className={styles.detailItem}><span className={styles.detailLabel}>Poste</span><span className={styles.detailValue}>{employee.position}</span></div>
            <div className={styles.detailItem}><span className={styles.detailLabel}>Genre</span><span className={styles.detailValue}>{employee.gender || '-'}</span></div>
            <div className={styles.detailItem}><span className={styles.detailLabel}>Telephone</span><span className={styles.detailValue}>{employee.phone || '-'}</span></div>
            <div className={styles.detailItem}><span className={styles.detailLabel}>Email</span><span className={styles.detailValue}>{employee.email || '-'}</span></div>
            <div className={styles.detailItem}><span className={styles.detailLabel}>Date embauche</span><span className={styles.detailValue}>{employee.hire_date || '-'}</span></div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Statut</span>
              <Badge variant={employee.is_active ? 'success' : 'danger'}>{employee.is_active ? 'Actif' : 'Inactif'}</Badge>
            </div>
          </div>

          {employee.equipments && employee.equipments.length > 0 && (
            <>
              <h4 className={styles.sectionTitle}>Equipements ({employee.equipments.length})</h4>
              <Table<any> data={employee.equipments} columns={equipColumns} keyExtractor={(e) => e.id} defaultPageSize={5} />
            </>
          )}

          {employee.history && employee.history.length > 0 && (
            <>
              <h4 className={styles.sectionTitle}>Historique</h4>
              <Table<any> data={employee.history} columns={historyColumns} keyExtractor={(h) => h.id} defaultPageSize={5} />
            </>
          )}
        </div>
      ) : null}
    </Modal>
  );
}
