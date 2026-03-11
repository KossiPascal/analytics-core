import { useState, useEffect } from 'react';
import { Modal } from '@components/ui/Modal/Modal';
import { Badge } from '@components/ui/Badge/Badge';
import { Spinner } from '@components/ui/Spinner/Spinner';
import { Table, type Column } from '@components/ui/Table/Table';
import { ascsApi } from '../../api';
import type { ASC, Equipment, RepairTicket } from '../../types';
import { STATUS_LABELS } from '../../types';
import styles from '../../EquipmentManager.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  ascId: string | null;
}

export function AscDetailModal({ isOpen, onClose, ascId }: Props) {
  const [asc, setAsc] = useState<ASC | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && ascId) loadDetail();
  }, [isOpen, ascId]);

  const loadDetail = async () => {
    if (!ascId) return;
    setLoading(true);
    const res = await ascsApi.get(ascId);
    if (res.success) setAsc(res.data!);
    setLoading(false);
  };

  const equipColumns: Column<Equipment>[] = [
    { key: 'imei', header: 'IMEI', render: (e) => e.imei },
    { key: 'type', header: 'Type', render: (e) => e.equipment_type },
    { key: 'brand', header: 'Marque/Modele', render: (e) => `${e.brand} ${e.model_name}` },
    { key: 'status', header: 'Statut', render: (e) => <Badge variant={e.status === 'FUNCTIONAL' ? 'success' : 'warning'}>{e.status}</Badge> },
  ];

  const ticketColumns: Column<RepairTicket>[] = [
    { key: 'number', header: 'Numero', render: (t) => t.ticket_number },
    { key: 'status', header: 'Statut', render: (t) => <Badge variant={t.status === 'CLOSED' ? 'success' : t.status === 'CANCELLED' ? 'danger' : 'warning'}>{STATUS_LABELS[t.status]}</Badge> },
    { key: 'delay', header: 'Delai', render: (t) => <Badge variant={t.delay_color === 'red' ? 'danger' : t.delay_color === 'yellow' ? 'warning' : 'success'}>{t.delay_days}j</Badge> },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={asc ? `ASC: ${asc.full_name}` : 'Detail ASC'} size="lg">
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><Spinner /></div>
      ) : asc ? (
        <div>
          <div className={styles.detailGrid}>
            <div className={styles.detailItem}><span className={styles.detailLabel}>Code</span><span className={styles.detailValue}>{asc.code}</span></div>
            <div className={styles.detailItem}><span className={styles.detailLabel}>Genre</span><span className={styles.detailValue}>{asc.gender || '-'}</span></div>
            <div className={styles.detailItem}><span className={styles.detailLabel}>Telephone</span><span className={styles.detailValue}>{asc.phone || '-'}</span></div>
            <div className={styles.detailItem}><span className={styles.detailLabel}>Email</span><span className={styles.detailValue}>{asc.email || '-'}</span></div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Statut</span>
              <Badge variant={asc.is_active ? 'success' : 'danger'}>{asc.is_active ? 'Actif' : 'Inactif'}</Badge>
            </div>
            <div className={styles.detailItem}><span className={styles.detailLabel}>Date debut</span><span className={styles.detailValue}>{asc.start_date || '-'}</span></div>
          </div>

          {asc.equipments && asc.equipments.length > 0 && (
            <>
              <h4 className={styles.sectionTitle}>Equipements ({asc.equipments.length})</h4>
              <Table<any> data={asc.equipments} columns={equipColumns} keyExtractor={(e) => e.id} defaultPageSize={5} />
            </>
          )}

          {asc.tickets && asc.tickets.length > 0 && (
            <>
              <h4 className={styles.sectionTitle}>Tickets ({asc.tickets.length})</h4>
              <Table<any> data={asc.tickets} columns={ticketColumns} keyExtractor={(t) => t.id} defaultPageSize={5} />
            </>
          )}
        </div>
      ) : null}
    </Modal>
  );
}
