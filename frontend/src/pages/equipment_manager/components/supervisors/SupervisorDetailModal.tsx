import { Modal } from '@components/ui/Modal/Modal';
import { Badge } from '@components/ui/Badge/Badge';
import type { Supervisor } from '../../types';
import styles from '../../EquipmentManager.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  supervisor: Supervisor | null;
}

export function SupervisorDetailModal({ isOpen, onClose, supervisor }: Props) {
  if (!supervisor) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Superviseur: ${supervisor.full_name}`} size="md">
      <div className={styles.detailGrid}>
        <div className={styles.detailItem}><span className={styles.detailLabel}>Code</span><span className={styles.detailValue}>{supervisor.code}</span></div>
        <div className={styles.detailItem}><span className={styles.detailLabel}>Email</span><span className={styles.detailValue}>{supervisor.email || '-'}</span></div>
        <div className={styles.detailItem}><span className={styles.detailLabel}>Telephone</span><span className={styles.detailValue}>{supervisor.phone || '-'}</span></div>
      </div>

      <h4 className={styles.sectionTitle}>Sites assignes ({supervisor.sites.length})</h4>
      {supervisor.sites.length > 0 ? (
        <div className={styles.badgeGroup}>
          {supervisor.sites.map((s) => (
            <Badge key={s.id} variant="info">{s.name} ({s.code})</Badge>
          ))}
        </div>
      ) : (
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Aucun site assigne</p>
      )}
    </Modal>
  );
}
