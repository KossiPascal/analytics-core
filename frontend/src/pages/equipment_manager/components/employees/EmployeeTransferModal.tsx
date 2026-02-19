import { useState, useEffect } from 'react';
import { FormModal } from '@/components/forms/FormModal/FormModal';
import { FormSelect } from '@/components/forms/FormSelect/FormSelect';
import { FormTextarea } from '@/components/forms/FormTextarea/FormTextarea';
import { useFormValidation } from '@/components/forms/useFormValidation';
import { ArrowRightLeft } from 'lucide-react';
import shared from '@components/ui/styles/shared.module.css';
import toast from 'react-hot-toast';
import { equipmentApi, employeesApi } from '../../api';
import type { Employee, Equipment } from '../../types';
import { EQUIPMENT_STATUS_LABELS } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employee: Employee | null;
}

const VALIDATION_RULES = {
  equipment: { required: true, message: "Sélectionner l'équipement à transférer" },
  target:    { required: true, message: 'Sélectionner un employé cible' },
};

export function EmployeeTransferModal({ isOpen, onClose, onSuccess, employee }: Props) {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [equipmentId, setEquipmentId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const { touchField, validateAll, getFieldError, getErrorMessages, isFormValid, reset } =
    useFormValidation(VALIDATION_RULES);

  useEffect(() => {
    if (isOpen && employee) loadData();
    else { setEquipmentId(''); setTargetId(''); setNotes(''); reset(); }
  }, [isOpen, employee]);

  const loadData = async () => {
    if (!employee) return;
    setLoading(true);
    const [empDetail, allEmp] = await Promise.all([
      employeesApi.get(employee.id),
      employeesApi.getAll({ active: 'true' }),
    ]);
    if (empDetail.success && empDetail.data) {
      const active = (empDetail.data.equipments ?? []).filter((e) => e.is_active);
      setEquipments(active);
      // Auto-sélection si un seul équipement
      if (active.length === 1) setEquipmentId(active[0].id);
    }
    if (allEmp.success && allEmp.data) setAllEmployees(allEmp.data);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!employee || !validateAll({ equipment: equipmentId, target: targetId })) return;
    setSaving(true);
    const res = await equipmentApi.transfer(equipmentId, {
      employee_id: targetId,
      notes: notes.trim() || undefined,
    });
    if (res.success) {
      const target = allEmployees.find((e) => e.id === targetId);
      toast.success(`Équipement transféré vers ${target?.full_name ?? 'le nouvel employé'}`);
      onSuccess();
      onClose();
    } else {
      toast.error(res.message || 'Erreur lors du transfert');
    }
    setSaving(false);
  };

  const eligibleTargets = allEmployees.filter((e) => e.id !== employee?.id);
  const selectedEquipment = equipments.find((e) => e.id === equipmentId);

  const noEquipment = !loading && equipments.length === 0;

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Transférer un équipement — ${employee?.full_name ?? ''}`}
      size="md"
      errors={getErrorMessages()}
      onSubmit={handleSave}
      isSubmitDisabled={!isFormValid({ equipment: equipmentId, target: targetId }) || noEquipment}
      isLoading={saving}
      submitLabel="Transférer"
      submitIcon={<ArrowRightLeft size={16} />}
    >
      <form className={shared.form} onSubmit={(e) => { e.preventDefault(); handleSave(); }}>

        {/* Source */}
        <div style={{
          padding: '0.625rem 0.875rem', borderRadius: '6px', fontSize: '0.875rem',
          background: !employee?.is_active ? 'var(--color-danger-bg, #fee2e2)' : 'var(--color-bg-secondary, #f8fafc)',
          border: `1px solid ${!employee?.is_active ? 'var(--color-danger, #ef4444)' : 'var(--border-color, #e2e8f0)'}`,
        }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
            Détenteur actuel
            {!employee?.is_active && (
              <strong style={{ color: 'var(--color-danger, #ef4444)', marginLeft: '0.5rem' }}>— Inactif</strong>
            )}
          </span>
          <p style={{ margin: '0.125rem 0 0', fontWeight: 600 }}>
            {employee?.full_name ?? '—'}
            {employee?.employee_id_code && (
              <span style={{ fontWeight: 400, color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                ({employee.employee_id_code})
              </span>
            )}
          </p>
        </div>

        {noEquipment ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
            Cet employé n'a aucun équipement actif à transférer.
          </p>
        ) : (
          <>
            {equipments.length > 1 && (
              <FormSelect
                label="Équipement à transférer"
                required
                value={equipmentId}
                onChange={(v) => { setEquipmentId(v); touchField('equipment', v); }}
                error={getFieldError('equipment')}
                options={[
                  { value: '', label: loading ? 'Chargement...' : 'Sélectionner un équipement' },
                  ...equipments.map((e) => ({
                    value: e.id,
                    label: `${e.brand} ${e.model_name} — IMEI: ${e.imei}`,
                  })),
                ]}
              />
            )}

            {selectedEquipment && (
              <div style={{
                padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem',
                background: 'var(--color-bg-secondary, #f8fafc)',
                border: '1px solid var(--border-color, #e2e8f0)',
                display: 'flex', gap: '1rem',
              }}>
                <span><strong>Type :</strong> {selectedEquipment.category_name || '—'}</span>
                <span><strong>Statut :</strong> {EQUIPMENT_STATUS_LABELS[selectedEquipment.status] ?? selectedEquipment.status}</span>
                <span><strong>S/N :</strong> {selectedEquipment.serial_number || '—'}</span>
              </div>
            )}

            <FormSelect
              label="Transférer vers"
              required
              value={targetId}
              onChange={(v) => { setTargetId(v); touchField('target', v); }}
              error={getFieldError('target')}
              options={[
                { value: '', label: 'Sélectionner un employé' },
                ...eligibleTargets.map((e) => ({
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
          </>
        )}
      </form>
    </FormModal>
  );
}
