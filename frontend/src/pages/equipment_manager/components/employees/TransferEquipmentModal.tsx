import { useState } from 'react';
import { FormModal } from '@/components/forms/FormModal/FormModal';
import { FormSelect } from '@/components/forms/FormSelect/FormSelect';
import { FormTextarea } from '@/components/forms/FormTextarea/FormTextarea';
import { useFormValidation } from '@/components/forms/useFormValidation';
import { ArrowRightLeft } from 'lucide-react';
import shared from '@components/ui/styles/shared.module.css';
import toast from 'react-hot-toast';
import { equipmentApi } from '../../api';
import type { Employee, Equipment } from '../../types';
import { EQUIPMENT_STATUS_LABELS } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  equipment: Equipment | null;
  currentEmployee: Employee | null;
  employees: Employee[];
}

const VALIDATION_RULES = {
  target: { required: true, message: 'Sélectionner un employé cible' },
};

export function TransferEquipmentModal({ isOpen, onClose, onSuccess, equipment, currentEmployee, employees }: Props) {
  const [targetId, setTargetId] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const { touchField, validateAll, getFieldError, getErrorMessages, isFormValid, reset } =
    useFormValidation(VALIDATION_RULES);

  const handleClose = () => {
    setTargetId(''); setNotes(''); reset();
    onClose();
  };

  const handleSave = async () => {
    if (!equipment || !validateAll({ target: targetId })) return;
    setSaving(true);
    const res = await equipmentApi.transfer(equipment.id, {
      employee_id: targetId,
      notes: notes.trim() || undefined,
    });
    if (res.success) {
      const target = employees.find((e) => e.id === targetId);
      toast.success(`Équipement transféré vers ${target?.full_name ?? 'le nouvel employé'}`);
      onSuccess();
      handleClose();
    } else {
      toast.error(res.message || 'Erreur lors du transfert');
    }
    setSaving(false);
  };

  // Exclure l'employé actuel de la liste cible
  const eligibleEmployees = employees.filter(
    (e) => e.is_active && e.id !== currentEmployee?.id
  );

  return (
    <FormModal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Transférer — ${equipment?.brand ?? ''} ${equipment?.model_name ?? ''} (${equipment?.imei ?? ''})`}
      size="md"
      errors={getErrorMessages()}
      onSubmit={handleSave}
      isSubmitDisabled={!isFormValid({ target: targetId })}
      isLoading={saving}
      submitLabel="Transférer"
      submitIcon={<ArrowRightLeft size={16} />}
    >
      <form className={shared.form} onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
        {/* Employé actuel */}
        <div style={{
          padding: '0.625rem 0.875rem',
          borderRadius: '6px',
          background: 'var(--color-bg-secondary, #f8fafc)',
          border: '1px solid var(--border-color, #e2e8f0)',
          fontSize: '0.875rem',
        }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Détenteur actuel</span>
          <p style={{ margin: '0.125rem 0 0', fontWeight: 600 }}>
            {currentEmployee?.full_name ?? '—'}
            {currentEmployee?.employee_id_code && (
              <span style={{ fontWeight: 400, color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                ({currentEmployee.employee_id_code})
              </span>
            )}
          </p>
          <p style={{ margin: '0.125rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Statut : {EQUIPMENT_STATUS_LABELS[equipment?.status ?? ''] ?? equipment?.status ?? '—'}
          </p>
        </div>

        <FormSelect
          label="Transférer vers"
          required
          value={targetId}
          onChange={(v) => { setTargetId(v); touchField('target', v); }}
          error={getFieldError('target')}
          options={[
            { value: '', label: 'Sélectionner un employé' },
            ...eligibleEmployees.map((e) => ({
              value: e.id,
              label: `${e.full_name} (${e.employee_id_code})${e.department_name ? ` — ${e.department_name}` : ''}`,
            })),
          ]}
        />

        <FormTextarea
          label="Notes (optionnel)"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Raison du transfert..."
        />
      </form>
    </FormModal>
  );
}
