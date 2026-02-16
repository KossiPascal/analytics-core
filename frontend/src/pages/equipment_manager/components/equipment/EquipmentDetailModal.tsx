import { useState, useEffect } from 'react';
import { Modal } from '@components/ui/Modal/Modal';
import { Badge } from '@components/ui/Badge/Badge';
import { Spinner } from '@components/ui/Spinner/Spinner';
import { Table, type Column } from '@components/ui/Table/Table';
import { equipmentApi } from '../../api';
import type { Equipment, EquipmentHistory, RepairTicket } from '../../types';
import { STATUS_LABELS } from '../../types';
import styles from '../../EquipmentManager.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  equipmentId: string | null;
}

export function EquipmentDetailModal({ isOpen, onClose, equipmentId }: Props) {
  const [equipment, setEquipment] = useState<(Equipment & { history: EquipmentHistory[]; tickets: RepairTicket[] }) | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && equipmentId) loadDetail();
  }, [isOpen, equipmentId]);

  const loadDetail = async () => {
    if (!equipmentId) return;
    setLoading(true);
    const res = await equipmentApi.get(equipmentId);
    if (res.success) setEquipment(res.data!);
    setLoading(false);
  };

  const historyColumns: Column<EquipmentHistory>[] = [
    { key: 'action', header: 'Action', render: (h) => h.action },
    { key: 'old', header: 'Ancien', render: (h) => h.old_value || '-' },
    { key: 'new', header: 'Nouveau', render: (h) => h.new_value || '-' },
    { key: 'date', header: 'Date', render: (h) => h.created_at ? new Date(h.created_at).toLocaleDateString('fr') : '-' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={equipment ? `Equipement: ${equipment.imei}` : 'Detail Equipement'} size="lg">
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><Spinner /></div>
      ) : equipment ? (
        <div>
          <div className={styles.detailGrid}>
            <div className={styles.detailItem}><span className={styles.detailLabel}>Type</span><span className={styles.detailValue}>{equipment.equipment_type}</span></div>
            <div className={styles.detailItem}><span className={styles.detailLabel}>Marque/Modele</span><span className={styles.detailValue}>{equipment.brand} {equipment.model_name}</span></div>
            <div className={styles.detailItem}><span className={styles.detailLabel}>IMEI</span><span className={styles.detailValue}>{equipment.imei}</span></div>
            <div className={styles.detailItem}><span className={styles.detailLabel}>N. Serie</span><span className={styles.detailValue}>{equipment.serial_number || '-'}</span></div>
            <div className={styles.detailItem}><span className={styles.detailLabel}>Proprietaire ASC</span><span className={styles.detailValue}>{equipment.owner_name || '-'}</span></div>
            <div className={styles.detailItem}><span className={styles.detailLabel}>Employe</span><span className={styles.detailValue}>{equipment.employee_name || '-'}</span></div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Statut</span>
              <Badge variant={equipment.status === 'FUNCTIONAL' ? 'success' : equipment.status === 'FAULTY' ? 'danger' : 'warning'}>
                {equipment.status}
              </Badge>
            </div>
            <div className={styles.detailItem}><span className={styles.detailLabel}>Acquisition</span><span className={styles.detailValue}>{equipment.acquisition_date || '-'}</span></div>
          </div>

          {equipment.history && equipment.history.length > 0 && (
            <>
              <h4 className={styles.sectionTitle}>Historique</h4>
              <Table<any> data={equipment.history} columns={historyColumns} keyExtractor={(h) => h.id} defaultPageSize={5} />
            </>
          )}

          {equipment.tickets && equipment.tickets.length > 0 && (
            <>
              <h4 className={styles.sectionTitle}>Tickets ({equipment.tickets.length})</h4>
              <div className={styles.badgeGroup}>
                {equipment.tickets.map((t) => (
                  <Badge key={t.id} variant={t.status === 'CLOSED' ? 'success' : t.status === 'CANCELLED' ? 'danger' : 'warning'}>
                    {t.ticket_number} - {STATUS_LABELS[t.status]}
                  </Badge>
                ))}
              </div>
            </>
          )}
        </div>
      ) : null}
    </Modal>
  );
}
