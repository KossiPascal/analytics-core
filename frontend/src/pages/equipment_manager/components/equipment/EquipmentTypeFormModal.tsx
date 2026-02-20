import { useState, useEffect } from 'react';
import { FormModal } from '@/components/forms/FormModal/FormModal';
import { FormInput } from '@/components/forms/FormInput/FormInput';
import { FormSelect } from '@/components/forms/FormSelect/FormSelect';
import { FormTextarea } from '@/components/forms/FormTextarea/FormTextarea';
import { useFormValidation } from '@/components/forms/useFormValidation';
import { Button } from '@components/ui/Button/Button';
import { Save, Plus } from 'lucide-react';
import shared from '@components/ui/styles/shared.module.css';
import toast from 'react-hot-toast';
import { equipmentApi } from '../../api';
import type { EquipmentCategory, EquipmentCategoryGroup } from '../../types';
import { QuickCreateModal } from './QuickCreateModal';

const VALIDATION_RULES = {
  name: { required: true, message: 'Le nom est requis' },
  code: { required: true, message: 'Le code est requis' },
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (category: EquipmentCategory) => void;
  categoryGroups: EquipmentCategoryGroup[];
  onCategoryGroupCreated?: (group: EquipmentCategoryGroup) => void;
}

export function EquipmentTypeFormModal({ isOpen, onClose, onCreated, categoryGroups, onCategoryGroupCreated }: Props) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [groupId, setGroupId] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [groupCreateOpen, setGroupCreateOpen] = useState(false);
  const [localGroups, setLocalGroups] = useState<EquipmentCategoryGroup[]>([]);

  const { touchField, validateAll, getFieldError, getErrorMessages, isFormValid, reset } = useFormValidation(VALIDATION_RULES);

  const allGroups = [...categoryGroups, ...localGroups.filter((lg) => !categoryGroups.find((g) => g.id === lg.id))];
  const activeGroups = allGroups.filter((g) => g.is_active);

  useEffect(() => {
    if (isOpen) { setName(''); setCode(''); setGroupId(''); setDescription(''); setLocalGroups([]); reset(); }
  }, [isOpen]);

  const canSubmit = isFormValid({ name, code });
  const errorMessages = getErrorMessages();

  const handleSave = async () => {
    if (!validateAll({ name, code })) return;

    setSaving(true);
    try {
      const res = await equipmentApi.createCategory({
        name,
        code,
        category_group_id: groupId || null,
        description,
      });
      if (res.success && res.data) {
        toast.success('Type d\'équipement créé avec succès');
        if (onCreated) onCreated(res.data);
        onClose();
      } else {
        toast.error(res.message || 'Erreur');
      }
    } catch {
      toast.error('Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleGroupCreated = (group: EquipmentCategoryGroup) => {
    setLocalGroups((prev) => [...prev, group]);
    setGroupId(group.id);
    if (onCategoryGroupCreated) onCategoryGroupCreated(group);
  };

  return (
    <>
      <FormModal
        isOpen={isOpen}
        onClose={onClose}
        title="Nouveau Type d'équipement"
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
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onBlur={() => touchField('code', code)}
              error={getFieldError('code')}
            />
          </div>

          {/* Groupe de catégorie avec bouton "+" */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <FormSelect
                label="Catégorie"
                value={groupId}
                onChange={(v) => setGroupId(v)}
                options={[
                  { value: '', label: '— Sélectionner' },
                  ...activeGroups.map((g) => ({ value: g.id, label: g.name })),
                ]}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setGroupCreateOpen(true)}
              style={{ marginBottom: '0.25rem', flexShrink: 0 }}
              title="Nouvelle catégorie"
            >
              <Plus size={16} />
            </Button>
          </div>

          <FormTextarea label="Description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </form>
      </FormModal>

      <QuickCreateModal
        isOpen={groupCreateOpen}
        onClose={() => setGroupCreateOpen(false)}
        title="Nouvelle Catégorie"
        onSave={(data) => equipmentApi.createCategoryGroup(data)}
        onCreated={handleGroupCreated}
      />
    </>
  );
}
