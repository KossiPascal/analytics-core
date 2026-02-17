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
import type { Department } from '../../types';

const VALIDATION_RULES = {
  name: { required: true, message: 'Le nom est requis' },
  code: { required: true, message: 'Le code est requis' },
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editData?: Department | null;
  departments: Department[];
}

export function DepartmentFormModal({ isOpen, onClose, onSuccess, editData, departments }: Props) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const isEdit = !!editData;
  const { touchField, validateAll, getFieldError, getErrorMessages, isFormValid, reset } = useFormValidation(VALIDATION_RULES);

  useEffect(() => {
    if (editData) {
      setName(editData.name);
      setCode(editData.code);
      setDescription(editData.description);
      setParentId(editData.parent_id || '');
      setIsActive(editData.is_active);
    } else {
      setName(''); setCode(''); setDescription(''); setParentId(''); setIsActive(true);
    }
    reset();
  }, [editData, isOpen]);

  // Build flat list of departments for parent select
  const allDepts: { id: string; name: string }[] = [];
  const flattenDepts = (items: (Department & { children?: Department[] })[]) => {
    for (const d of items) {
      if (!editData || d.id !== editData.id) {
        allDepts.push({ id: d.id, name: d.name });
      }
      if (d.children) flattenDepts(d.children);
    }
  };
  flattenDepts(departments as (Department & { children?: Department[] })[]);

  const canSubmit = isFormValid({ name, code });
  const errorMessages = getErrorMessages();

  const handleSave = async () => {
    if (!validateAll({ name, code })) return;

    setSaving(true);
    try {
      const data = { name, code, description, parent_id: parentId || null, is_active: isActive };
      const res = isEdit
        ? await employeesApi.updateDepartment(editData!.id, data)
        : await employeesApi.createDepartment(data);

      if (res.success) {
        toast.success(`Departement ${isEdit ? 'mis a jour' : 'cree'} avec succes`);
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
      title={`${isEdit ? 'Modifier' : 'Nouveau'} Departement`}
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
        <FormTextarea label="Description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        <FormSelect
          label="Parent"
          value={parentId}
          onChange={(v) => setParentId(v)}
          options={[{ value: '', label: 'Aucun (departement principal)' }, ...allDepts.map((d) => ({ value: d.id, label: d.name }))]}
        />
        <FormCheckbox label="Actif" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
      </form>
    </FormModal>
  );
}
