import { useState, useEffect } from 'react';
import { Button } from '@components/ui/Button/Button';
import { Plus } from 'lucide-react';
import { supervisorsApi, locationsApi } from '../../api';
import type { Supervisor, District, Site } from '../../types';
import { SupervisorsTable } from './SupervisorsTable';
import { SupervisorFormModal } from './SupervisorFormModal';
import { SupervisorDetailModal } from './SupervisorDetailModal';
import toast from 'react-hot-toast';

export function SupervisorsTab() {
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<Supervisor | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState<Supervisor | null>(null);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [supRes, distRes, sitesRes] = await Promise.all([
        supervisorsApi.getAll(),
        locationsApi.getDistricts(),
        locationsApi.getSites(),
      ]);
      if (supRes.success) setSupervisors(supRes.data!);
      if (distRes.success) setDistricts(distRes.data!);
      if (sitesRes.success) setSites(sitesRes.data!);
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <Button size="sm" leftIcon={<Plus size={16} />} onClick={() => { setEditData(null); setFormOpen(true); }}>
          Nouveau Superviseur
        </Button>
      </div>

      <SupervisorsTable
        data={supervisors}
        isLoading={loading}
        onEdit={(s) => { setEditData(s); setFormOpen(true); }}
        onView={(s) => { setDetailData(s); setDetailOpen(true); }}
      />

      <SupervisorFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={loadAll}
        editData={editData}
        districts={districts}
        sites={sites}
      />

      <SupervisorDetailModal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        supervisor={detailData}
      />
    </div>
  );
}
