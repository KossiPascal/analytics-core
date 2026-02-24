import { useState, useEffect } from 'react';
import { Modal } from '@components/ui/Modal/Modal';
import { Badge } from '@components/ui/Badge/Badge';
import { Spinner } from '@components/ui/Spinner/Spinner';
import { employeesApi } from '../../api';
import type { Employee } from '../../types';
import styles from '../../EquipmentManager.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string | null;
}

export function EmployeeDetailModal({ isOpen, onClose, employeeId }: Props) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && employeeId) loadDetail();
    else setEmployee(null);
  }, [isOpen, employeeId]);

  const loadDetail = async () => {
    if (!employeeId) return;
    setLoading(true);
    const res = await employeesApi.get(employeeId);
    if (res.success) setEmployee(res.data!);
    setLoading(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={employee ? `Employé : ${employee.full_name}` : 'Détail Employé'}
      size="md"
    >
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <Spinner />
        </div>
      ) : employee ? (
        <div className={styles.detailGrid}>
          <div className={styles.detailItem}><span className={styles.detailLabel}>Code</span><span className={styles.detailValue}>{employee.employee_id_code}</span></div>
          <div className={styles.detailItem}><span className={styles.detailLabel}>Nom complet</span><span className={styles.detailValue}>{employee.full_name}</span></div>
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
          {employee.notes && (
            <div className={styles.detailItem} style={{ gridColumn: '1 / -1' }}>
              <span className={styles.detailLabel}>Notes</span>
              <span className={styles.detailValue}>{employee.notes}</span>
            </div>
          )}
        </div>
      ) : null}
    </Modal>
  );
}
