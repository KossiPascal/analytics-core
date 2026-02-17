import { useState, useEffect } from 'react';
import { FormModal } from '@/components/forms/FormModal/FormModal';
import { FormSelect } from '@/components/forms/FormSelect/FormSelect';
import { FormTextarea } from '@/components/forms/FormTextarea/FormTextarea';
import { FormCheckbox } from '@/components/forms/FormCheckbox/FormCheckbox';
import { useFormValidation } from '@/components/forms/useFormValidation';
import { Save } from 'lucide-react';
import shared from '@components/ui/styles/shared.module.css';
import toast from 'react-hot-toast';
import { ticketsApi, ascsApi, equipmentApi } from '../../api';
import type { ASC, Equipment, ProblemType } from '../../types';

const VALIDATION_RULES = {
  equipmentId: { required: true, message: "Selectionner un equipement" },
  description: { required: true, message: 'La description du probleme est requise' },
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function TicketCreateModal({ isOpen, onClose, onSuccess }: Props) {
  const [ascs, setAscs] = useState<ASC[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [problemTypes, setProblemTypes] = useState<ProblemType[]>([]);
  const [ascId, setAscId] = useState('');
  const [equipmentId, setEquipmentId] = useState('');
  const [selectedProblemIds, setSelectedProblemIds] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const { touchField, validateAll, getFieldError, getErrorMessages, isFormValid, reset } = useFormValidation(VALIDATION_RULES);

  useEffect(() => {
    if (isOpen) loadData();
  }, [isOpen]);

  useEffect(() => {
    if (ascId) {
      equipmentApi.getAll({ asc_id: ascId }).then((res) => {
        if (res.success) setEquipment(res.data!);
      });
    } else {
      setEquipment([]);
    }
    setEquipmentId('');
  }, [ascId]);

  const loadData = async () => {
    const [ascsRes, ptRes] = await Promise.all([
      ascsApi.getAll(),
      ticketsApi.getProblemTypes(),
    ]);
    if (ascsRes.success) setAscs(ascsRes.data!);
    if (ptRes.success) setProblemTypes(ptRes.data!);
    reset();
    setAscId(''); setEquipmentId(''); setSelectedProblemIds([]); setDescription('');
  };

  const toggleProblem = (id: string) => {
    setSelectedProblemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const canSubmit = isFormValid({ equipmentId, description });
  const errorMessages = getErrorMessages();

  const handleSave = async () => {
    if (!validateAll({ equipmentId, description })) return;

    setSaving(true);
    try {
      const res = await ticketsApi.create({
        asc_id: ascId || undefined,
        equipment_id: equipmentId,
        problem_description: description,
        problem_type_ids: selectedProblemIds,
      });
      if (res.success) {
        toast.success('Ticket cree avec succes');
        onSuccess();
        onClose();
        setAscId(''); setEquipmentId(''); setSelectedProblemIds([]); setDescription(''); reset();
      } else {
        toast.error(res.message || 'Erreur');
      }
    } catch {
      toast.error('Erreur lors de la creation');
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Nouveau Ticket de Reparation"
      size="lg"
      errors={errorMessages}
      onSubmit={handleSave}
      isSubmitDisabled={!canSubmit}
      isLoading={saving}
      submitLabel="Creer le ticket"
      submitIcon={<Save size={16} />}
    >
      <form className={shared.form} onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
        <FormSelect
          label="ASC"
          value={ascId}
          onChange={(v) => setAscId(v)}
          options={[{ value: '', label: 'Selectionner un ASC' }, ...ascs.map((a) => ({ value: a.id, label: `${a.full_name} (${a.code})` }))]}
        />

        <FormSelect
          label="Equipement"
          required
          value={equipmentId}
          onChange={(v) => {
            setEquipmentId(v);
            touchField('equipmentId', v);
          }}
          error={getFieldError('equipmentId')}
          options={[
            { value: '', label: ascId ? 'Selectionner un equipement' : "Selectionner d'abord un ASC" },
            ...equipment.map((e) => ({ value: e.id, label: `${e.brand} ${e.model_name} (${e.imei})` })),
          ]}
        />

        {problemTypes.length > 0 && (
          <div>
            <label className={shared.formLabel} style={{ display: 'block', marginBottom: '0.5rem' }}>Types de problemes</label>
            <div className={shared.checkboxGrid}>
              {problemTypes.map((pt) => (
                <FormCheckbox
                  key={pt.id}
                  label={`${pt.name} (${pt.category})`}
                  checked={selectedProblemIds.includes(pt.id)}
                  onChange={() => toggleProblem(pt.id)}
                />
              ))}
            </div>
          </div>
        )}

        <FormTextarea
          label="Description du probleme"
          required
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() => touchField('description', description)}
          error={getFieldError('description')}
        />
      </form>
    </FormModal>
  );
}
