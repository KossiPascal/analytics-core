import { useState, useEffect } from 'react';
import { FormModal } from '@/components/forms/FormModal/FormModal';
import { FormSelect } from '@/components/forms/FormSelect/FormSelect';
import { FormTextarea } from '@/components/forms/FormTextarea/FormTextarea';
import { useFormValidation } from '@/components/forms/useFormValidation';
import { PackagePlus } from 'lucide-react';
import shared from '@components/ui/styles/shared.module.css';
import toast from 'react-hot-toast';
import { equipmentApi } from '../../api';
import type { Employee, Equipment } from '../../types';
import { EQUIPMENT_STATUS_LABELS } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employee: Employee | null;
}

const VALIDATION_RULES = {
  equipment: { required: true, message: 'Sélectionner un équipement' },
};

export function AssignEquipmentToEmployeeModal({ isOpen, onClose, onSuccess, employee }: Props) {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [equipmentId, setEquipmentId] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const { touchField, validateAll, getFieldError, getErrorMessages, isFormValid, reset } =
    useFormValidation(VALIDATION_RULES);

  useEffect(() => {
    if (isOpen) loadAvailableEquipments();
    else { setEquipmentId(''); setNotes(''); reset(); }
  }, [isOpen]);

  const loadAvailableEquipments = async () => {
    setLoading(true);
    // Équipements actifs sans employé assigné
    const res = await equipmentApi.getAll();
    if (res.success && res.data) {
      const available = res.data.filter(
        (e) => e.is_active && !e.employee_id && !e.owner_id
      );
      setEquipments(available);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!employee || !validateAll({ equipment: equipmentId })) return;
    setSaving(true);
    const res = await equipmentApi.assign(equipmentId, {
      employee_id: employee.id,
      notes: notes.trim() || undefined,
    });
    if (res.success) {
      toast.success(`Équipement attribué à ${employee.full_name}`);
      onSuccess();
      onClose();
    } else {
      toast.error(res.message || "Erreur lors de l'attribution");
    }
    setSaving(false);
  };

  const selectedEquipment = equipments.find((e) => e.id === equipmentId);

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Attribuer un équipement — ${employee?.full_name ?? ''}`}
      size="md"
      errors={getErrorMessages()}
      onSubmit={handleSave}
      isSubmitDisabled={!isFormValid({ equipment: equipmentId })}
      isLoading={saving}
      submitLabel="Attribuer"
      submitIcon={<PackagePlus size={16} />}
    >
      <form className={shared.form} onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
        <FormSelect
          label="Équipement disponible"
          required
          value={equipmentId}
          onChange={(v) => { setEquipmentId(v); touchField('equipment', v); }}
          error={getFieldError('equipment')}
          options={[
            {
              value: '',
              label: loading
                ? 'Chargement...'
                : equipments.length === 0
                ? 'Aucun équipement disponible'
                : 'Sélectionner un équipement',
            },
            ...equipments.map((e) => ({
              value: e.id,
              label: `${e.brand} ${e.model_name} — IMEI: ${e.imei}`,
            })),
          ]}
        />

        {selectedEquipment && (
          <div style={{
            padding: '0.625rem 0.875rem',
            borderRadius: '6px',
            background: 'var(--color-bg-secondary, #f8fafc)',
            border: '1px solid var(--border-color, #e2e8f0)',
            fontSize: '0.8rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
          }}>
            <span><strong>Type :</strong> {selectedEquipment.category_name || selectedEquipment.equipment_type || '—'}</span>
            <span><strong>N° série :</strong> {selectedEquipment.serial_number || '—'}</span>
            <span><strong>Statut :</strong> {EQUIPMENT_STATUS_LABELS[selectedEquipment.status] ?? selectedEquipment.status}</span>
          </div>
        )}

        <FormTextarea
          label="Notes (optionnel)"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Informations complémentaires..."
        />
      </form>
    </FormModal>
  );
}
