import { useState, useEffect } from 'react';
import { FormModal } from '@/components/forms/FormModal/FormModal';
import { FormInput } from '@/components/forms/FormInput/FormInput';
import { FormSelect } from '@/components/forms/FormSelect/FormSelect';
import { FormTextarea } from '@/components/forms/FormTextarea/FormTextarea';
import { useFormValidation } from '@/components/forms/useFormValidation';
import { Save } from 'lucide-react';
import shared from '@components/ui/styles/shared.module.css';
import toast from 'react-hot-toast';
import { equipmentApi } from '../../api';
import type { Accessory } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  equipmentId?: string | null;
  editData?: Accessory | null;
  onCreated?: (accessory: Accessory) => void;
  /** When true, accessory is collected locally without API call (no equipmentId yet) */
  localMode?: boolean;
}

const VALIDATION_RULES = {
  name: { required: true, message: 'Le nom de l\'accessoire est requis' },
};

export function AccessoryFormModal({ isOpen, onClose, onSuccess, equipmentId, editData, onCreated, localMode }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [status, setStatus] = useState('FUNCTIONAL');
  const [saving, setSaving] = useState(false);

  const isEdit = !!editData;
  const { touchField, validateAll, getFieldError, getErrorMessages, isFormValid, reset } = useFormValidation(VALIDATION_RULES);

  useEffect(() => {
    if (editData) {
      setName(editData.name);
      setDescription(editData.description);
      setSerialNumber(editData.serial_number);
      setStatus(editData.status);
    } else {
      setName(''); setDescription(''); setSerialNumber(''); setStatus('FUNCTIONAL');
    }
    reset();
  }, [editData, isOpen]);

  const canSubmit = isFormValid({ name });
  const errorMessages = getErrorMessages();

  const handleSave = async () => {
    if (!validateAll({ name })) return;

    setSaving(true);
    try {
      const data = { name, description, serial_number: serialNumber, status };

      if (localMode) {
        const tempAcc: Accessory = {
          id: `temp_${Date.now()}`,
          equipment_id: '',
          name,
          description,
          serial_number: serialNumber,
          status: status as Accessory['status'],
          created_at: null,
          updated_at: null,
        };
        if (onCreated) onCreated(tempAcc);
        toast.success('Accessoire ajoute');
        onClose();
        return;
      }

      const res = isEdit
        ? await equipmentApi.updateAccessory(equipmentId!, editData!.id, data)
        : await equipmentApi.createAccessory(equipmentId!, data);

      if (res.success) {
        toast.success(`Accessoire ${isEdit ? 'mis a jour' : 'ajoute'} avec succes`);
        if (!isEdit && onCreated && res.data) onCreated(res.data);
        onSuccess(); onClose();
      } else {
        toast.error(res.message || 'Erreur');
      }
    } catch {
      toast.error('Erreur');
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={`${isEdit ? 'Modifier' : 'Ajouter'} Accessoire`}
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
          <FormInput label="N. Serie" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} />
        </div>
        <FormSelect
          label="Statut"
          value={status}
          onChange={(v) => setStatus(v)}
          options={[
            { value: 'FUNCTIONAL', label: 'Fonctionnel' },
            { value: 'FAULTY', label: 'Defectueux' },
            { value: 'MISSING', label: 'Manquant' },
          ]}
        />
        <FormTextarea label="Description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
      </form>
    </FormModal>
  );
}
