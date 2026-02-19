import { useState, useEffect } from 'react';
import { Modal } from '@components/ui/Modal/Modal';
import { Badge } from '@components/ui/Badge/Badge';
import { Button } from '@components/ui/Button/Button';
import { Spinner } from '@components/ui/Spinner/Spinner';
import { Table, type Column } from '@components/ui/Table/Table';
import { Plus, Edit, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { equipmentApi } from '../../api';
import type { Equipment, EquipmentHistory, RepairTicket, Accessory } from '../../types';
import {
  EQUIPMENT_STATUS_LABELS, EQUIPMENT_STATUS_VARIANT,
  HISTORY_ACTION_LABELS, STATUS_LABELS,
} from '../../types';
import { AccessoryFormModal } from './AccessoryFormModal';
import styles from '../../EquipmentManager.module.css';
import shared from '@components/ui/styles/shared.module.css';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  equipmentId: string | null;
  onStatusChange?: () => void;
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

export function EquipmentDetailModal({ isOpen, onClose, equipmentId, onStatusChange }: Props) {
  const [equipment, setEquipment] = useState<(Equipment & { history: EquipmentHistory[]; tickets: RepairTicket[]; accessories: Accessory[] }) | null>(null);
  const [loading, setLoading] = useState(false);
  const [cancellingDecl, setCancellingDecl] = useState(false);

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

  const handleCancelDeclaration = async () => {
    if (!equipmentId) return;
    setCancellingDecl(true);
    const res = await equipmentApi.cancelDeclaration(equipmentId);
    if (res.success) {
      toast.success("Déclaration annulée — équipement remis en attente");
      loadDetail();
      onStatusChange?.();
    } else {
      toast.error(res.message || "Erreur lors de l'annulation");
    }
    setCancellingDecl(false);
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
    {
      key: 'action',
      header: 'Action',
      render: (h) => HISTORY_ACTION_LABELS[h.action] || h.action,
    },
    { key: 'old', header: 'Avant', render: (h) => EQUIPMENT_STATUS_LABELS[h.old_value] || h.old_value || '-' },
    { key: 'new', header: 'Après', render: (h) => EQUIPMENT_STATUS_LABELS[h.new_value] || h.new_value || '-' },
    { key: 'notes', header: 'Notes', render: (h) => h.notes || '-' },
    { key: 'date', header: 'Date', render: (h) => h.created_at ? new Date(h.created_at).toLocaleString('fr') : '-' },
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
      render: (a) => equipment?.is_active ? (
        <div className={shared.actionsCell}>
          <button className={shared.actionBtn} onClick={() => { setAccEditData(a); setAccFormOpen(true); }}><Edit size={16} /></button>
          <button className={shared.actionBtn} onClick={() => handleDeleteAccessory(a)}><Trash2 size={16} /></button>
        </div>
      ) : null,
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={equipment ? `Equipement: ${equipment.imei}` : 'Detail Equipement'} size="lg">
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><Spinner /></div>
      ) : equipment ? (
        <div>

          {/* ── Inactive state banner ── */}
          {!equipment.is_active && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem',
              padding: '0.875rem 1rem', borderRadius: '8px', marginBottom: '1.25rem',
              background: '#fee2e2', border: '1px solid #f87171',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={18} color="#dc2626" />
                <span style={{ fontWeight: 600, color: '#dc2626', fontSize: '0.9rem' }}>
                  Équipement inactif —{' '}
                  <Badge variant="danger">
                    {EQUIPMENT_STATUS_LABELS[equipment.status] || equipment.status}
                  </Badge>
                </span>
                <span style={{ color: '#7f1d1d', fontSize: '0.82rem' }}>
                  Aucune action n'est possible sur cet équipement.
                </span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<CheckCircle size={14} />}
                onClick={handleCancelDeclaration}
                isLoading={cancellingDecl}
              >
                Annuler la déclaration
              </Button>
            </div>
          )}

          {/* ── Equipment info ── */}
          <div className={styles.detailGrid}>
            <div className={styles.detailItem}><span className={styles.detailLabel}>Type</span><span className={styles.detailValue}>{equipment.category_name || equipment.equipment_type || '-'}</span></div>
            <div className={styles.detailItem}><span className={styles.detailLabel}>Marque/Modele</span><span className={styles.detailValue}>{equipment.brand_name || equipment.brand || ''} {equipment.model_name}</span></div>
            <div className={styles.detailItem}><span className={styles.detailLabel}>IMEI</span><span className={styles.detailValue}>{equipment.imei}</span></div>
            <div className={styles.detailItem}><span className={styles.detailLabel}>N. Serie</span><span className={styles.detailValue}>{equipment.serial_number || '-'}</span></div>
            <div className={styles.detailItem}><span className={styles.detailLabel}>Proprietaire ASC</span><span className={styles.detailValue}>{equipment.owner_name || '-'}</span></div>
            <div className={styles.detailItem}><span className={styles.detailLabel}>Employe</span><span className={styles.detailValue}>{equipment.employee_name || '-'}</span></div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Statut</span>
              <Badge variant={EQUIPMENT_STATUS_VARIANT[equipment.status] || 'secondary'}>
                {EQUIPMENT_STATUS_LABELS[equipment.status] || equipment.status}
              </Badge>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Unicité</span>
              <span className={styles.detailValue}>{equipment.is_unique ? 'Unique (non partageable)' : 'Partageable'}</span>
            </div>
            <div className={styles.detailItem}><span className={styles.detailLabel}>Acquisition</span><span className={styles.detailValue}>{equipment.acquisition_date || '-'}</span></div>
          </div>

          {/* ── Accessories section ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
            <h4 className={styles.sectionTitle} style={{ margin: 0 }}>
              Accessoires ({equipment.accessories?.length || 0})
            </h4>
            {equipment.is_active && (
              <Button
                size="sm"
                variant="outline"
                leftIcon={<Plus size={14} />}
                onClick={() => { setAccEditData(null); setAccFormOpen(true); }}
              >
                Ajouter
              </Button>
            )}
          </div>
          {equipment.accessories && equipment.accessories.length > 0 ? (
            <Table<any> data={equipment.accessories} columns={accessoryColumns} keyExtractor={(a) => a.id} defaultPageSize={5} />
          ) : (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>Aucun accessoire</p>
          )}

          {/* ── History ── */}
          {equipment.history && equipment.history.length > 0 && (
            <>
              <h4 className={styles.sectionTitle}>Historique des changements</h4>
              <Table<any> data={equipment.history} columns={historyColumns} keyExtractor={(h) => h.id} defaultPageSize={8} />
            </>
          )}

          {/* ── Tickets ── */}
          {equipment.tickets && equipment.tickets.length > 0 && (
            <>
              <h4 className={styles.sectionTitle}>Tickets ({equipment.tickets.length})</h4>
              <div className={styles.badgeGroup}>
                {equipment.tickets.map((t) => (
                  <Badge key={t.id} variant={t.status === 'CLOSED' ? 'success' : t.status === 'CANCELLED' ? 'danger' : 'warning'}>
                    {t.ticket_number} — {STATUS_LABELS[t.status] || t.status}
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
