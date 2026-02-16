import { useState, useEffect } from 'react';
import { Modal } from '@components/ui/Modal/Modal';
import { Badge } from '@components/ui/Badge/Badge';
import { Button } from '@components/ui/Button/Button';
import { Spinner } from '@components/ui/Spinner/Spinner';
import { Table, type Column } from '@components/ui/Table/Table';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { equipmentApi } from '../../api';
import type { Equipment, EquipmentHistory, RepairTicket, Accessory } from '../../types';
import { STATUS_LABELS } from '../../types';
import { AccessoryFormModal } from './AccessoryFormModal';
import styles from '../../EquipmentManager.module.css';
import shared from '@components/ui/styles/shared.module.css';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  equipmentId: string | null;
}

const ACCESSORY_STATUS_VARIANT: Record<string, 'success' | 'danger' | 'warning'> = {
  FUNCTIONAL: 'success',
  FAULTY: 'danger',
  MISSING: 'warning',
};

const ACCESSORY_STATUS_LABEL: Record<string, string> = {
  FUNCTIONAL: 'Fonctionnel',
  FAULTY: 'Defectueux',
  MISSING: 'Manquant',
};

export function EquipmentDetailModal({ isOpen, onClose, equipmentId }: Props) {
  const [equipment, setEquipment] = useState<(Equipment & { history: EquipmentHistory[]; tickets: RepairTicket[]; accessories: Accessory[] }) | null>(null);
  const [loading, setLoading] = useState(false);

  // Accessory modal
  const [accFormOpen, setAccFormOpen] = useState(false);
  const [accEditData, setAccEditData] = useState<Accessory | null>(null);

  useEffect(() => {
    if (isOpen && equipmentId) loadDetail();
  }, [isOpen, equipmentId]);

  const loadDetail = async () => {
    if (!equipmentId) return;
    setLoading(true);
    const res = await equipmentApi.get(equipmentId);
    if (res.success) setEquipment(res.data! as any);
    setLoading(false);
  };

  const handleDeleteAccessory = async (acc: Accessory) => {
    if (!equipmentId) return;
    const res = await equipmentApi.deleteAccessory(equipmentId, acc.id);
    if (res.success) {
      toast.success('Accessoire supprime');
      loadDetail();
    } else {
      toast.error('Erreur');
    }
  };

  const historyColumns: Column<EquipmentHistory>[] = [
    { key: 'action', header: 'Action', render: (h) => h.action },
    { key: 'old', header: 'Ancien', render: (h) => h.old_value || '-' },
    { key: 'new', header: 'Nouveau', render: (h) => h.new_value || '-' },
    { key: 'date', header: 'Date', render: (h) => h.created_at ? new Date(h.created_at).toLocaleDateString('fr') : '-' },
  ];

  const accessoryColumns: Column<Accessory>[] = [
    { key: 'name', header: 'Nom', render: (a) => a.name },
    { key: 'serial_number', header: 'N. Serie', render: (a) => a.serial_number || '-' },
    {
      key: 'status',
      header: 'Statut',
      render: (a) => (
        <Badge variant={ACCESSORY_STATUS_VARIANT[a.status] || 'secondary'}>
          {ACCESSORY_STATUS_LABEL[a.status] || a.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (a) => (
        <div className={shared.actionsCell}>
          <button className={shared.actionBtn} onClick={() => { setAccEditData(a); setAccFormOpen(true); }}><Edit size={16} /></button>
          <button className={shared.actionBtn} onClick={() => handleDeleteAccessory(a)}><Trash2 size={16} /></button>
        </div>
      ),
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={equipment ? `Equipement: ${equipment.imei}` : 'Detail Equipement'} size="lg">
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><Spinner /></div>
      ) : equipment ? (
        <div>
          <div className={styles.detailGrid}>
            <div className={styles.detailItem}><span className={styles.detailLabel}>Type</span><span className={styles.detailValue}>{equipment.category_name || equipment.equipment_type || '-'}</span></div>
            <div className={styles.detailItem}><span className={styles.detailLabel}>Marque/Modele</span><span className={styles.detailValue}>{equipment.brand_name || equipment.brand || ''} {equipment.model_name}</span></div>
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

          {/* Accessories section */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
            <h4 className={styles.sectionTitle} style={{ margin: 0 }}>
              Accessoires ({equipment.accessories?.length || 0})
            </h4>
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Plus size={14} />}
              onClick={() => { setAccEditData(null); setAccFormOpen(true); }}
            >
              Ajouter
            </Button>
          </div>
          {equipment.accessories && equipment.accessories.length > 0 ? (
            <Table<any> data={equipment.accessories} columns={accessoryColumns} keyExtractor={(a) => a.id} defaultPageSize={5} />
          ) : (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>Aucun accessoire</p>
          )}

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

          <AccessoryFormModal
            isOpen={accFormOpen}
            onClose={() => setAccFormOpen(false)}
            onSuccess={loadDetail}
            equipmentId={equipmentId!}
            editData={accEditData}
          />
        </div>
      ) : null}
    </Modal>
  );
}
