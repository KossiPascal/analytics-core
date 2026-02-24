import { useState, useEffect } from 'react';
import { FormModal } from '@/components/forms/FormModal/FormModal';
import { FormSelect } from '@/components/forms/FormSelect/FormSelect';
import { FormTextarea } from '@/components/forms/FormTextarea/FormTextarea';
import { FormInput } from '@/components/forms/FormInput/FormInput';
import { PackagePlus } from 'lucide-react';
import shared from '@components/ui/styles/shared.module.css';
import toast from 'react-hot-toast';
import { equipmentApi, employeesApi } from '../../api';
import type { Employee, Equipment } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);

export function ReserveDeclarationModal({ isOpen, onClose, onSuccess }: Props) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [employeeId, setEmployeeId] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionDate, setActionDate] = useState(today());
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
      setActionDate(today());
      setNotes('');
      setSelectedIds([]);
      setEmployeeId('');
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    const [empRes, eqRes] = await Promise.all([
      employeesApi.getAll({ active: 'true' }),
      equipmentApi.getAll({ status: 'PENDING' }),
    ]);
    if (empRes.success && empRes.data) setEmployees(empRes.data);
    if (eqRes.success && eqRes.data) {
      // Only show truly unassigned PENDING equipment
      setEquipments(eqRes.data.filter((e) => !e.employee_id && !e.owner_id));
    }
    setLoading(false);
  };

  const toggleEquipment = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const canSubmit = !!employeeId && selectedIds.length > 0;

  const handleSave = async () => {
    if (!canSubmit) return;
    setSaving(true);
    const res = await equipmentApi.reserve({
      employee_id: employeeId,
      equipment_ids: selectedIds,
      notes: notes.trim() || undefined,
      action_date: actionDate,
    });
    if (res.success) {
      toast.success(`${selectedIds.length} équipement(s) déclaré(s) en réserve`);
      onSuccess();
      onClose();
    } else {
      toast.error(res.message || 'Erreur lors de la déclaration');
    }
    setSaving(false);
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Déclarer des équipements en réserve"
      size="md"
      errors={[]}
      onSubmit={handleSave}
      isSubmitDisabled={!canSubmit}
      isLoading={saving}
      submitLabel="Déclarer en réserve"
      submitIcon={<PackagePlus size={16} />}
    >
      <form className={shared.form} onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
        {/* Info banner */}
        <div style={{
          padding: '0.625rem 0.875rem',
          borderRadius: '6px',
          background: 'var(--color-bg-secondary, #f8fafc)',
          border: '1px solid var(--border-color, #e2e8f0)',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
        }}>
          Les équipements en réserve restent au statut <strong>En attente</strong> — l'employé les conserve pour distribution à ses subordonnés.
        </div>

        <FormSelect
          label="Responsable de la réserve"
          required
          value={employeeId}
          onChange={(v) => setEmployeeId(v)}
          options={[
            { value: '', label: loading ? 'Chargement...' : 'Sélectionner un employé' },
            ...employees.map((e) => ({
              value: e.id,
              label: `${e.full_name} (${e.employee_id_code})${e.position_name ? ` — ${e.position_name}` : ''}`,
            })),
          ]}
        />

        {/* Equipment multi-select */}
        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.875rem' }}>
            Équipements à mettre en réserve
            <span style={{ color: 'var(--color-danger, #ef4444)', marginLeft: '0.2rem' }}>*</span>
            {selectedIds.length > 0 && (
              <span style={{ fontWeight: 400, color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                ({selectedIds.length} sélectionné{selectedIds.length > 1 ? 's' : ''})
              </span>
            )}
          </label>
          {loading ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>Chargement...</p>
          ) : equipments.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>
              Aucun équipement disponible (en attente, non assigné)
            </p>
          ) : (
            <div style={{
              maxHeight: '200px',
              overflowY: 'auto',
              border: '1px solid var(--border-color, #e2e8f0)',
              borderRadius: '6px',
              padding: '0.375rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem',
            }}>
              {equipments.map((eq) => (
                <label
                  key={eq.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.375rem 0.5rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    background: selectedIds.includes(eq.id) ? 'var(--color-primary-light, #eff6ff)' : 'transparent',
                    border: `1px solid ${selectedIds.includes(eq.id) ? 'var(--color-primary, #3b82f6)' : 'transparent'}`,
                    fontSize: '0.8rem',
                    transition: 'background 0.15s, border-color 0.15s',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(eq.id)}
                    onChange={() => toggleEquipment(eq.id)}
                    style={{ cursor: 'pointer', flexShrink: 0 }}
                  />
                  <span>
                    <strong>{eq.brand} {eq.model_name}</strong>
                    {' '}
                    <span style={{ color: 'var(--text-secondary)' }}>IMEI: {eq.imei}</span>
                    {eq.category_name && (
                      <span style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                        ({eq.category_name})
                      </span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        <FormInput
          label="Date"
          type={"date" as any}
          value={actionDate}
          onChange={(e) => setActionDate(e.target.value)}
        />

        <FormTextarea
          label="Notes (optionnel)"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Informations sur la réserve..."
        />
      </form>
    </FormModal>
  );
}
