import { useState, useEffect } from 'react';
import { Modal } from '@components/ui/Modal/Modal';
import { Button } from '@components/ui/Button/Button';
import { FormSelect } from '@/components/forms/FormSelect/FormSelect';
import { FormTextarea } from '@/components/forms/FormTextarea/FormTextarea';
import { FormCheckbox } from '@/components/forms/FormCheckbox/FormCheckbox';
import { Save } from 'lucide-react';
import shared from '@components/ui/styles/shared.module.css';
import toast from 'react-hot-toast';
import { ticketsApi, ascsApi, equipmentApi } from '../../api';
import type { ASC, Equipment, ProblemType } from '../../types';

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
  };

  const toggleProblem = (id: string) => {
    setSelectedProblemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipmentId || !description.trim()) {
      toast.error('Equipement et description sont requis');
      return;
    }

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
        // Reset
        setAscId(''); setEquipmentId(''); setSelectedProblemIds([]); setDescription('');
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nouveau Ticket de Reparation"
      size="lg"
      footer={
        <div className={shared.modalFooter}>
          <Button variant="outline" size="sm" onClick={onClose}>Annuler</Button>
          <Button variant="primary" size="sm" onClick={handleSave} isLoading={saving}>
            <Save size={16} /> Creer le ticket
          </Button>
        </div>
      }
    >
      <form className={shared.form} onSubmit={handleSave}>
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
          onChange={(v) => setEquipmentId(v)}
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
        />
      </form>
    </Modal>
  );
}
