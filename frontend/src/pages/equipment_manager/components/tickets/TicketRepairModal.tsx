import { useState } from 'react';
import { FormModal } from '@/components/forms/FormModal/FormModal';
import { FormTextarea } from '@/components/forms/FormTextarea/FormTextarea';
import { useFormValidation } from '@/components/forms/useFormValidation';
import { Wrench } from 'lucide-react';
import shared from '@components/ui/styles/shared.module.css';
import toast from 'react-hot-toast';
import { ticketsApi } from '../../api';

const VALIDATION_RULES = {
  notes: { required: true, message: 'Les notes de resolution sont requises' },
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  ticketId: string | null;
}

export function TicketRepairModal({ isOpen, onClose, onSuccess, ticketId }: Props) {
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const { touchField, validateAll, getFieldError, getErrorMessages, isFormValid, reset } = useFormValidation(VALIDATION_RULES);

  const canSubmit = isFormValid({ notes });
  const errorMessages = getErrorMessages();

  const handleSave = async () => {
    if (!ticketId || !validateAll({ notes })) return;
    setSaving(true);
    try {
      const res = await ticketsApi.markRepaired(ticketId, { resolution_notes: notes });
      if (res.success) {
        toast.success('Ticket marque comme repare');
        onSuccess(); onClose(); setNotes(''); reset();
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
      title="Marquer comme repare"
      size="md"
      errors={errorMessages}
      onSubmit={handleSave}
      isSubmitDisabled={!canSubmit}
      isLoading={saving}
      submitLabel="Marquer repare"
      submitIcon={<Wrench size={16} />}
      submitVariant="success"
    >
      <form className={shared.form} onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
        <FormTextarea
          label="Notes de resolution"
          required
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => touchField('notes', notes)}
          error={getFieldError('notes')}
          placeholder="Decrire la reparation effectuee..."
        />
      </form>
    </FormModal>
  );
}
