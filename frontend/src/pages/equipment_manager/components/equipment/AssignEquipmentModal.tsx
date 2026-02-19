import { useState, useMemo, useEffect } from 'react';
import { FormModal } from '@/components/forms/FormModal/FormModal';
import { FormSelect } from '@/components/forms/FormSelect/FormSelect';
import { FormTextarea } from '@/components/forms/FormTextarea/FormTextarea';
import { FormInput } from '@/components/forms/FormInput/FormInput';
import { useFormValidation } from '@/components/forms/useFormValidation';

const today = () => new Date().toISOString().slice(0, 10);
import { ArrowRightLeft } from 'lucide-react';
import shared from '@components/ui/styles/shared.module.css';
import toast from 'react-hot-toast';
import { equipmentApi } from '../../api';
import type { Equipment, Employee } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  equipment: Equipment | null;
  employees: Employee[];
}

export function AssignEquipmentModal({ isOpen, onClose, onSuccess, equipment, employees }: Props) {
  const [employeeId, setEmployeeId] = useState('');
  const [notes, setNotes] = useState('');
  const [actionDate, setActionDate] = useState(today());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) setActionDate(today());
  }, [isOpen]);

  const validationRules = useMemo(() => ({
    employee: { required: true, message: 'Selectionner un employe' },
  }), []);

  const { touchField, validateAll, getFieldError, getErrorMessages, isFormValid, reset } = useFormValidation(validationRules);

  const canSubmit = isFormValid({ employee: employeeId });
  const errorMessages = getErrorMessages();

  const handleSave = async () => {
    if (!equipment) return;
    if (!validateAll({ employee: employeeId })) return;

    setSaving(true);
    try {
      const res = await equipmentApi.assign(equipment.id, { employee_id: employeeId, notes, action_date: actionDate });
      if (res.success) {
        toast.success('Equipement assigne avec succes');
        onSuccess();
        onClose();
        setEmployeeId(''); setNotes(''); reset();
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
      title={`Assigner: ${equipment?.imei || ''}`}
      size="md"
      errors={errorMessages}
      onSubmit={handleSave}
      isSubmitDisabled={!canSubmit}
      isLoading={saving}
      submitLabel="Assigner"
      submitIcon={<ArrowRightLeft size={16} />}
    >
      <form className={shared.form} onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
        <FormSelect
          label="Employe"
          required
          value={employeeId}
          onChange={(v) => {
            setEmployeeId(v);
            touchField('employee', v);
          }}
          error={getFieldError('employee')}
          options={[
            { value: '', label: 'Selectionner un employe' },
            ...employees.map((e) => ({ value: e.id, label: `${e.full_name} (${e.employee_id_code})` })),
          ]}
        />
        <FormInput
          label="Date"
          type={"date" as any}
          value={actionDate}
          onChange={(e) => setActionDate(e.target.value)}
        />
        <FormTextarea label="Notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </form>
    </FormModal>
  );
}
