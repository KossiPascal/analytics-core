import { useState, useEffect } from 'react';
import { FormModal } from '@/components/forms/FormModal/FormModal';
import { FormInput } from '@/components/forms/FormInput/FormInput';
import { FormTextarea } from '@/components/forms/FormTextarea/FormTextarea';
import { useFormValidation } from '@/components/forms/useFormValidation';
import { Save } from 'lucide-react';
import shared from '@components/ui/styles/shared.module.css';
import toast from 'react-hot-toast';

const VALIDATION_RULES = {
  name: { required: true, message: 'Le nom est requis' },
  code: { required: true, message: 'Le code est requis' },
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onSave: (data: { name: string; code: string; description: string }) => Promise<{ success: boolean; data?: any; message?: string }>;
  onCreated?: (item: any) => void;
}

export function QuickCreateModal({ isOpen, onClose, title, onSave, onCreated }: Props) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const { touchField, validateAll, getFieldError, getErrorMessages, isFormValid, reset } = useFormValidation(VALIDATION_RULES);

  useEffect(() => {
    if (isOpen) { setName(''); setCode(''); setDescription(''); reset(); }
  }, [isOpen]);

  const canSubmit = isFormValid({ name, code });
  const errorMessages = getErrorMessages();

  const handleSave = async () => {
    if (!validateAll({ name, code })) return;

    setSaving(true);
    try {
      const res = await onSave({ name, code, description });
      if (res.success) {
        toast.success('Cree avec succes');
        if (onCreated && res.data) onCreated(res.data);
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

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
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
      </form>
    </FormModal>
  );
}
