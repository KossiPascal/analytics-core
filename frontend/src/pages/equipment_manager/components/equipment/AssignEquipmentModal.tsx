import { useState, useMemo } from 'react';
import { FormModal } from '@/components/forms/FormModal/FormModal';
import { FormSelect } from '@/components/forms/FormSelect/FormSelect';
import { FormTextarea } from '@/components/forms/FormTextarea/FormTextarea';
import { useFormValidation } from '@/components/forms/useFormValidation';
import { ArrowRightLeft } from 'lucide-react';
import shared from '@components/ui/styles/shared.module.css';
import toast from 'react-hot-toast';
import { equipmentApi } from '../../api';
import type { Equipment, ASC, Employee } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  equipment: Equipment | null;
  ascs: ASC[];
  employees: Employee[];
}

export function AssignEquipmentModal({ isOpen, onClose, onSuccess, equipment, ascs, employees }: Props) {
  const [assignType, setAssignType] = useState<'asc' | 'employee'>('asc');
  const [ascId, setAscId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const targetValue = assignType === 'asc' ? ascId : employeeId;

  const validationRules = useMemo(() => ({
    target: {
      required: true,
      message: assignType === 'asc' ? 'Selectionner un ASC' : 'Selectionner un employe',
    },
  }), [assignType]);

  const { touchField, validateAll, getFieldError, getErrorMessages, isFormValid, reset } = useFormValidation(validationRules);

  const canSubmit = isFormValid({ target: targetValue });
  const errorMessages = getErrorMessages();

  const handleSave = async () => {
    if (!equipment) return;
    if (!validateAll({ target: targetValue })) return;

    setSaving(true);
    try {
      const data = assignType === 'asc'
        ? { asc_id: ascId, notes }
        : { employee_id: employeeId, notes };

      const res = await equipmentApi.assign(equipment.id, data);
      if (res.success) {
        toast.success('Equipement assigne avec succes');
        onSuccess();
        onClose();
        setAscId(''); setEmployeeId(''); setNotes(''); reset();
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
          label="Assigner a"
          value={assignType}
          onChange={(v) => {
            setAssignType(v as 'asc' | 'employee');
            setAscId(''); setEmployeeId('');
            reset();
          }}
          options={[{ value: 'asc', label: 'ASC' }, { value: 'employee', label: 'Employe' }]}
        />
        {assignType === 'asc' ? (
          <FormSelect
            label="ASC"
            required
            value={ascId}
            onChange={(v) => {
              setAscId(v);
              touchField('target', v);
            }}
            error={getFieldError('target')}
            options={[{ value: '', label: 'Selectionner' }, ...ascs.map((a) => ({ value: a.id, label: `${a.full_name} (${a.code})` }))]}
          />
        ) : (
          <FormSelect
            label="Employe"
            required
            value={employeeId}
            onChange={(v) => {
              setEmployeeId(v);
              touchField('target', v);
            }}
            error={getFieldError('target')}
            options={[{ value: '', label: 'Selectionner' }, ...employees.map((e) => ({ value: e.id, label: `${e.full_name} (${e.employee_id_code})` }))]}
          />
        )}
        <FormTextarea label="Notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </form>
    </FormModal>
  );
}
