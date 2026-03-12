import { useState, useEffect } from 'react';
import { Button } from '@components/ui/Button/Button';
import { Modal } from '@components/ui/Modal/Modal';
import { Plus, RefreshCw, Trash2 } from 'lucide-react';
import { ascsApi, supervisorsApi } from '../../api';
import { SyncPanel } from '../sync/SyncPanel';
import type { ASC, Supervisor } from '../../types';
import { AscsTable } from './AscsTable';
import { AscFormModal } from './AscFormModal';
import { AscDetailModal } from './AscDetailModal';
import shared from '@components/ui/styles/shared.module.css';
import styles from '../../EquipmentManager.module.css';
import toast from 'react-hot-toast';

export function AscsTab() {
  const [ascs, setAscs] = useState<ASC[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<ASC | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ASC | null>(null);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [ascsRes, supRes] = await Promise.all([
        ascsApi.getAll(),
        supervisorsApi.getAll(),
      ]);
      if (ascsRes.success) setAscs(ascsRes.data!);
      if (supRes.success) setSupervisors(supRes.data!);
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await ascsApi.delete(deleteTarget.id);
    if (res.success) { toast.success('ASC desactive'); loadAll(); }
    else toast.error(res.message || 'Erreur');
    setDeleteOpen(false);
    setDeleteTarget(null);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <SyncPanel onSyncComplete={loadAll} />
        <Button size="sm" leftIcon={<Plus size={16} />} onClick={() => { setEditData(null); setFormOpen(true); }}>
          Nouvel ASC
        </Button>
      </div>

      {!initialized && loading ? (
        <div className={styles.loading}><RefreshCw size={28} className="animate-spin" /></div>
      ) : (
        <AscsTable
          data={ascs}
          isLoading={loading && initialized}
          onEdit={(a) => { setEditData(a); setFormOpen(true); }}
          onView={(a) => { setDetailId(a.id); setDetailOpen(true); }}
          onDelete={(a) => { setDeleteTarget(a); setDeleteOpen(true); }}
        />
      )}

      <AscFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={loadAll}
        editData={editData}
        supervisors={supervisors}
      />

      <AscDetailModal isOpen={detailOpen} onClose={() => setDetailOpen(false)} ascId={detailId} />

      <Modal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Desactiver l'ASC"
        size="sm"
        footer={
          <div className={shared.modalFooter}>
            <Button variant="outline" size="sm" onClick={() => setDeleteOpen(false)}>Annuler</Button>
            <Button variant="danger" size="sm" onClick={handleDelete}><Trash2 size={16} /> Desactiver</Button>
          </div>
        }
      >
        <div className={shared.deleteWarning}>
          <Trash2 size={24} />
          <p>Desactiver l'ASC <strong>{deleteTarget?.full_name}</strong> ?</p>
        </div>
      </Modal>
    </div>
  );
}
