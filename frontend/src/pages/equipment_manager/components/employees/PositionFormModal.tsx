import { useState, useEffect } from 'react';
import { FormModal } from '@/components/forms/FormModal/FormModal';
import { FormInput } from '@/components/forms/FormInput/FormInput';
import { FormSelect } from '@/components/forms/FormSelect/FormSelect';
import { FormTextarea } from '@/components/forms/FormTextarea/FormTextarea';
import { FormCheckbox } from '@/components/forms/FormCheckbox/FormCheckbox';
import { useFormValidation } from '@/components/forms/useFormValidation';
import { Save } from 'lucide-react';
import shared from '@components/ui/styles/shared.module.css';
import toast from 'react-hot-toast';
import { employeesApi } from '../../api';
import type { Position, Department } from '../../types';

const VALIDATION_RULES = {
  name: { required: true, message: 'Le nom est requis' },
  code: { required: true, message: 'Le code est requis' },
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editData?: Position | null;
  onCreated?: (position: Position) => void;
  existingPositions?: Position[];
  departments?: (Department & { children: Department[] })[];
}

export function PositionFormModal({ isOpen, onClose, onSuccess, editData, onCreated, existingPositions, departments }: Props) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [parentId, setParentId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isZoneAssignable, setIsZoneAssignable] = useState(false);
  const [saving, setSaving] = useState(false);

  const isEdit = !!editData;
  const { touchField, validateAll, getFieldError, getErrorMessages, isFormValid, reset } = useFormValidation(VALIDATION_RULES);

  useEffect(() => {
    if (editData) {
      setName(editData.name);
      setCode(editData.code);
      setParentId(editData.parent_id ?? '');
      setDepartmentId(editData.department_id ?? '');
      setDescription(editData.description);
      setIsActive(editData.is_active);
      setIsZoneAssignable(editData.is_zone_assignable);
    } else {
      setName(''); setCode(''); setParentId(''); setDepartmentId(''); setDescription(''); setIsActive(true); setIsZoneAssignable(false);
    }
    reset();
  }, [editData, isOpen]);

  const canSubmit = isFormValid({ name, code });
  const errorMessages = getErrorMessages();

  // Parent options: exclude self (when editing) and inactive positions
  const parentOptions = (existingPositions ?? []).filter(
    (p) => p.is_active && p.id !== editData?.id,
  );

  const handleSave = async () => {
    if (!validateAll({ name, code })) return;

    setSaving(true);
    try {
      const data = {
        name,
        code,
        parent_id: parentId || null,
        department_id: departmentId || null,
        description,
        is_active: isActive,
        is_zone_assignable: isZoneAssignable,
      };
      const res = isEdit
        ? await employeesApi.updatePosition(editData!.id, data)
        : await employeesApi.createPosition(data);

      if (res.success) {
        toast.success(`Poste ${isEdit ? 'mis à jour' : 'créé'} avec succès`);
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
      title={`${isEdit ? 'Modifier' : 'Nouveau'} Poste`}
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

        {/* Département */}
        <FormSelect
          label="Département"
          value={departmentId}
          onChange={(v) => setDepartmentId(v)}
          options={[
            { value: '', label: '— Aucun' },
            ...(departments ?? []).flatMap((d) => [
              { value: d.id, label: d.name },
              ...(d.children ?? []).map((c) => ({ value: c.id, label: `\u00A0\u00A0└ ${c.name}` })),
            ]),
          ]}
        />

        {/* Poste parent : définit la hiérarchie */}
        <FormSelect
          label="Poste supérieur (optionnel)"
          value={parentId}
          onChange={(v) => setParentId(v)}
          options={[
            { value: '', label: '— Aucun (poste racine)' },
            ...parentOptions.map((p) => ({
              value: p.id,
              label: p.parent_name ? `${p.parent_name} › ${p.name}` : p.name,
            })),
          ]}
        />

        <FormTextarea label="Description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        <FormCheckbox
          label="Assignable à une zone d'intervention"
          checked={isZoneAssignable}
          onChange={(e) => setIsZoneAssignable(e.target.checked)}
        />
        <FormCheckbox label="Actif" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
      </form>
    </FormModal>
  );
}
