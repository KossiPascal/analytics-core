import { useState, useEffect } from 'react';
import { FormModal } from '@/components/forms/FormModal/FormModal';
import { FormInput } from '@/components/forms/FormInput/FormInput';
import { FormTextarea } from '@/components/forms/FormTextarea/FormTextarea';
import { ToggleLeft, ToggleRight } from 'lucide-react';
import shared from '@components/ui/styles/shared.module.css';
import toast from 'react-hot-toast';
import { employeesApi } from '../../api';
import type { Employee } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employee: Employee | null;
}

const today = () => new Date().toISOString().slice(0, 10);

export function ConfirmToggleEmployeeModal({ isOpen, onClose, onSuccess, employee }: Props) {
  const [actionDate, setActionDate] = useState(today());
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const willActivate = !employee?.is_active;

  useEffect(() => {
    if (isOpen) {
      setActionDate(today());
      setNotes('');
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (!employee) return;
    setSaving(true);
    const res = await employeesApi.toggleActive(employee.id, {
      notes: notes.trim() || undefined,
      action_date: actionDate,
    });
    if (res.success) {
      toast.success(`Employé ${willActivate ? 'activé' : 'désactivé'} avec succès`);
      onSuccess();
      onClose();
    } else {
      toast.error(res.message || 'Erreur');
    }
    setSaving(false);
  };

  const handleClose = () => {
    setNotes('');
    setActionDate(today());
    onClose();
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={handleClose}
      title={`${willActivate ? 'Activer' : 'Désactiver'} l'employé`}
      size="sm"
      errors={[]}
      onSubmit={handleConfirm}
      isSubmitDisabled={false}
      isLoading={saving}
      submitLabel={willActivate ? 'Activer' : 'Désactiver'}
      submitIcon={willActivate ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
    >
      <form className={shared.form} onSubmit={(e) => { e.preventDefault(); handleConfirm(); }}>
        <div style={{
          padding: '0.625rem 0.875rem',
          borderRadius: '6px',
          background: willActivate ? 'var(--color-success-bg, #d1fae5)' : 'var(--color-danger-bg, #fee2e2)',
          border: `1px solid ${willActivate ? 'var(--color-success, #10b981)' : 'var(--color-danger, #ef4444)'}`,
          fontSize: '0.875rem',
        }}>
          {willActivate
            ? <>Activer l'employé <strong>{employee?.full_name}</strong> ?</>
            : <>Désactiver l'employé <strong>{employee?.full_name}</strong> ? Toutes modifications seront bloquées.</>
          }
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
          placeholder={willActivate ? 'Raison de la réactivation...' : 'Raison de la désactivation...'}
        />
      </form>
    </FormModal>
  );
}
