import { useState, useEffect } from 'react';
import { Button } from '@components/ui/Button/Button';
import { Modal } from '@components/ui/Modal/Modal';
import { Plus, RefreshCw, Trash2 } from 'lucide-react';
import { locationsApi } from '../../api';
import type { Region, District, Site } from '../../types';
import { RegionsTable } from './RegionsTable';
import { DistrictsTable } from './DistrictsTable';
import { SitesTable } from './SitesTable';
import { LocationFormModal } from './LocationFormModal';
import styles from '../../EquipmentManager.module.css';
import shared from '@components/ui/styles/shared.module.css';
import toast from 'react-hot-toast';

type SubTab = 'regions' | 'districts' | 'sites';

export function LocationsTab() {
  const [subTab, setSubTab] = useState<SubTab>('regions');
  const [regions, setRegions] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<Record<string, any> | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Region | null>(null);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [regRes, distRes, sitesRes] = await Promise.all([
        locationsApi.getRegions(),
        locationsApi.getDistricts(),
        locationsApi.getSites(),
      ]);
      if (regRes.success) setRegions(regRes.data!);
      if (distRes.success) setDistricts(distRes.data!);
      if (sitesRes.success) setSites(sitesRes.data!);
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  const handleCreate = () => { setEditData(null); setFormOpen(true); };
  const handleEdit = (item: Record<string, any>) => { setEditData(item); setFormOpen(true); };

  const handleDeleteRegion = async () => {
    if (!deleteTarget) return;
    const res = await locationsApi.deleteRegion(deleteTarget.id);
    if (res.success) {
      toast.success('Region supprimee');
      loadAll();
    } else {
      toast.error(res.message || 'Erreur');
    }
    setDeleteOpen(false);
    setDeleteTarget(null);
  };

  const SUB_TABS: { key: SubTab; label: string }[] = [
    { key: 'regions', label: 'Regions' },
    { key: 'districts', label: 'Districts' },
    { key: 'sites', label: 'Sites' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div className={styles.subTabsList}>
          {SUB_TABS.map((t) => (
            <button
              key={t.key}
              className={`${styles.subTabItem} ${subTab === t.key ? styles.active : ''}`}
              onClick={() => setSubTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Button size="sm" leftIcon={<Plus size={16} />} onClick={handleCreate}>
          Nouveau
        </Button>
      </div>

      {!initialized && loading ? (
        <div className={styles.loading}><RefreshCw size={28} className="animate-spin" /></div>
      ) : (
        <>
          {subTab === 'regions' && (
            <RegionsTable
              data={regions}
              isLoading={loading && initialized}
              onEdit={handleEdit}
              onDelete={(r) => { setDeleteTarget(r); setDeleteOpen(true); }}
            />
          )}
          {subTab === 'districts' && <DistrictsTable data={districts} isLoading={loading && initialized} onEdit={handleEdit} />}
          {subTab === 'sites' && <SitesTable data={sites} isLoading={loading && initialized} onEdit={handleEdit} />}
        </>
      )}

      <LocationFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={loadAll}
        type={subTab === 'regions' ? 'region' : subTab === 'districts' ? 'district' : 'site'}
        editData={editData}
        regions={regions}
        districts={districts}
        sites={sites}
      />

      <Modal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Confirmer la suppression"
        size="sm"
        footer={
          <div className={shared.modalFooter}>
            <Button variant="outline" size="sm" onClick={() => setDeleteOpen(false)}>Annuler</Button>
            <Button variant="danger" size="sm" onClick={handleDeleteRegion}><Trash2 size={16} /> Supprimer</Button>
          </div>
        }
      >
        <div className={shared.deleteWarning}>
          <Trash2 size={24} />
          <p>Supprimer la region <strong>{deleteTarget?.name}</strong> et tous ses districts, sites et zones ?</p>
          <p className={shared.warningText}>Cette action est irreversible.</p>
        </div>
      </Modal>
    </div>
  );
}
