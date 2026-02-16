import { useState } from 'react';
import { Modal } from '@components/ui/Modal/Modal';
import { Button } from '@components/ui/Button/Button';
import { FormSelect } from '@/components/forms/FormSelect/FormSelect';
import { FormTextarea } from '@/components/forms/FormTextarea/FormTextarea';
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

  const handleSave = async () => {
    if (!equipment) return;
    if (assignType === 'asc' && !ascId) { toast.error('Selectionner un ASC'); return; }
    if (assignType === 'employee' && !employeeId) { toast.error('Selectionner un employe'); return; }

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Assigner: ${equipment?.imei || ''}`}
      size="md"
      footer={
        <div className={shared.modalFooter}>
          <Button variant="outline" size="sm" onClick={onClose}>Annuler</Button>
          <Button variant="primary" size="sm" onClick={handleSave} isLoading={saving}>
            <ArrowRightLeft size={16} /> Assigner
          </Button>
        </div>
      }
    >
      <form className={shared.form}>
        <FormSelect
          label="Assigner a"
          value={assignType}
          onChange={(v) => setAssignType(v as 'asc' | 'employee')}
          options={[{ value: 'asc', label: 'ASC' }, { value: 'employee', label: 'Employe' }]}
        />
        {assignType === 'asc' ? (
          <FormSelect
            label="ASC"
            required
            value={ascId}
            onChange={(v) => setAscId(v)}
            options={[{ value: '', label: 'Selectionner' }, ...ascs.map((a) => ({ value: a.id, label: `${a.full_name} (${a.code})` }))]}
          />
        ) : (
          <FormSelect
            label="Employe"
            required
            value={employeeId}
            onChange={(v) => setEmployeeId(v)}
            options={[{ value: '', label: 'Selectionner' }, ...employees.map((e) => ({ value: e.id, label: `${e.full_name} (${e.employee_id_code})` }))]}
          />
        )}
        <FormTextarea label="Notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </form>
    </Modal>
  );
}
