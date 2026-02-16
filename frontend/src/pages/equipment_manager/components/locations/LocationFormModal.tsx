import { useState, useEffect } from 'react';
import { Modal } from '@components/ui/Modal/Modal';
import { Button } from '@components/ui/Button/Button';
import { FormInput } from '@/components/forms/FormInput/FormInput';
import { FormSelect } from '@/components/forms/FormSelect/FormSelect';
import { Save } from 'lucide-react';
import shared from '@components/ui/styles/shared.module.css';
import toast from 'react-hot-toast';
import { locationsApi } from '../../api';
import type { Region, District, Site } from '../../types';

type LocationType = 'region' | 'district' | 'site' | 'zone';

interface LocationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  type: LocationType;
  editData?: Record<string, any> | null;
  regions?: Region[];
  districts?: District[];
  sites?: Site[];
}

const TYPE_LABELS: Record<LocationType, string> = {
  region: 'Region',
  district: 'District',
  site: 'Site',
  zone: 'Zone ASC',
};

export function LocationFormModal({ isOpen, onClose, onSuccess, type, editData, regions = [], districts = [], sites = [] }: LocationFormModalProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [parentId, setParentId] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const isEdit = !!editData;

  useEffect(() => {
    if (editData) {
      setName(editData.name || '');
      setCode(editData.code || '');
      setParentId(editData.region_id || editData.district_id || editData.site_id || '');
      setAddress(editData.address || '');
      setPhone(editData.phone || '');
    } else {
      setName('');
      setCode('');
      setParentId('');
      setAddress('');
      setPhone('');
    }
  }, [editData, isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      toast.error('Nom et code sont requis');
      return;
    }

    setSaving(true);
    try {
      let res;
      if (type === 'region') {
        res = isEdit
          ? await locationsApi.updateRegion(editData!.id, { name, code })
          : await locationsApi.createRegion({ name, code });
      } else if (type === 'district') {
        if (!parentId) { toast.error('Region est requise'); setSaving(false); return; }
        const data = { name, code, region_id: parentId };
        res = isEdit
          ? await locationsApi.updateDistrict(editData!.id, data)
          : await locationsApi.createDistrict(data);
      } else if (type === 'site') {
        if (!parentId) { toast.error('District est requis'); setSaving(false); return; }
        const data = { name, code, district_id: parentId, address, phone };
        res = isEdit
          ? await locationsApi.updateSite(editData!.id, data)
          : await locationsApi.createSite(data);
      } else {
        if (!parentId) { toast.error('Site est requis'); setSaving(false); return; }
        const data = { name, code, site_id: parentId };
        res = isEdit
          ? await locationsApi.updateZone(editData!.id, data)
          : await locationsApi.createZone(data);
      }

      if (res.success) {
        toast.success(`${TYPE_LABELS[type]} ${isEdit ? 'mis a jour' : 'cree'} avec succes`);
        onSuccess();
        onClose();
      } else {
        toast.error(res.message || 'Erreur');
      }
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const parentOptions = () => {
    if (type === 'district') return regions.map((r) => ({ value: r.id, label: r.name }));
    if (type === 'site') return districts.map((d) => ({ value: d.id, label: `${d.name} (${d.region_name})` }));
    if (type === 'zone') return sites.map((s) => ({ value: s.id, label: `${s.name} (${s.district_name})` }));
    return [];
  };

  const parentLabel = () => {
    if (type === 'district') return 'Region';
    if (type === 'site') return 'District';
    if (type === 'zone') return 'Site';
    return '';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${isEdit ? 'Modifier' : 'Nouveau'} ${TYPE_LABELS[type]}`}
      size="md"
      footer={
        <div className={shared.modalFooter}>
          <Button variant="outline" size="sm" onClick={onClose}>Annuler</Button>
          <Button variant="primary" size="sm" onClick={handleSave} isLoading={saving}>
            <Save size={16} /> Enregistrer
          </Button>
        </div>
      }
    >
      <form className={shared.form} onSubmit={handleSave}>
        <div className={shared.formRow}>
          <FormInput label="Nom" required value={name} onChange={(e) => setName(e.target.value)} />
          <FormInput label="Code" required value={code} onChange={(e) => setCode(e.target.value)} />
        </div>

        {type !== 'region' && (
          <FormSelect
            label={parentLabel()}
            required
            options={parentOptions()}
            value={parentId}
            onChange={(v) => setParentId(v)}
            placeholder={`Selectionner ${parentLabel().toLowerCase()}`}
          />
        )}

        {type === 'site' && (
          <div className={shared.formRow}>
            <FormInput label="Adresse" value={address} onChange={(e) => setAddress(e.target.value)} />
            <FormInput label="Telephone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        )}
      </form>
    </Modal>
  );
}
