import { useState, useEffect, useMemo } from 'react';
import { FormModal } from '@/components/forms/FormModal/FormModal';
import { FormInput } from '@/components/forms/FormInput/FormInput';
import { FormSelect } from '@/components/forms/FormSelect/FormSelect';
import { useFormValidation } from '@/components/forms/useFormValidation';
import { Save } from 'lucide-react';
import shared from '@components/ui/styles/shared.module.css';
import toast from 'react-hot-toast';
import { locationsApi } from '../../api';
import type { Region, District, Site } from '../../types';

type LocationType = 'region' | 'district' | 'site';

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
};

export function LocationFormModal({ isOpen, onClose, onSuccess, type, editData, regions = [], districts = [], sites = [] }: LocationFormModalProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [parentId, setParentId] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const isEdit = !!editData;

  const parentLabel = () => {
    if (type === 'district') return 'Region';
    if (type === 'site') return 'District';
    return '';
  };

  const validationRules = useMemo(() => ({
    name: { required: true, message: 'Le nom est requis' },
    code: { required: true, message: 'Le code est requis' },
    ...(type !== 'region' ? {
      parentId: { required: true, message: `${parentLabel()} est requis(e)` },
    } : {}),
  }), [type]);

  const { touchField, validateAll, getFieldError, getErrorMessages, isFormValid, reset } = useFormValidation(validationRules);

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
    reset();
  }, [editData, isOpen]);

  const currentFields = type !== 'region'
    ? { name, code, parentId }
    : { name, code };

  const canSubmit = isFormValid(currentFields);
  const errorMessages = getErrorMessages();

  const parentOptions = () => {
    if (type === 'district') return regions.map((r) => ({ value: r.id, label: r.name }));
    if (type === 'site') return districts.map((d) => ({ value: d.id, label: `${d.name} (${d.region_name})` }));
    return [];
  };

  const handleSave = async () => {
    if (!validateAll(currentFields)) return;

    setSaving(true);
    try {
      let res;
      if (type === 'region') {
        res = isEdit
          ? await locationsApi.updateRegion(editData!.id, { name, code })
          : await locationsApi.createRegion({ name, code });
      } else if (type === 'district') {
        const data = { name, code, region_id: parentId };
        res = isEdit
          ? await locationsApi.updateDistrict(editData!.id, data)
          : await locationsApi.createDistrict(data);
      } else if (type === 'site') {
        const data = { name, code, district_id: parentId, address, phone };
        res = isEdit
          ? await locationsApi.updateSite(editData!.id, data)
          : await locationsApi.createSite(data);
      }

      if (res!.success) {
        toast.success(`${TYPE_LABELS[type]} ${isEdit ? 'mis a jour' : 'cree'} avec succes`);
        onSuccess();
        onClose();
      } else {
        toast.error(res!.message || 'Erreur');
      }
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={`${isEdit ? 'Modifier' : 'Nouveau'} ${TYPE_LABELS[type]}`}
      size="md"
      errors={errorMessages}
      onSubmit={handleSave}
      isSubmitDisabled={!canSubmit}
      isLoading={saving}
      submitLabel="Enregistrer"
      submitIcon={<Save size={16} />}
    >
      <form className={shared.form} onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
        <div className={shared.formRow}>
          <FormInput
            label="Nom"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => touchField('name', name)}
            error={getFieldError('name')}
          />
          <FormInput
            label="Code"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onBlur={() => touchField('code', code)}
            error={getFieldError('code')}
          />
        </div>

        {type !== 'region' && (
          <FormSelect
            label={parentLabel()}
            required
            options={parentOptions()}
            value={parentId}
            onChange={(v) => {
              setParentId(v);
              touchField('parentId', v);
            }}
            error={getFieldError('parentId')}
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
    </FormModal>
  );
}
