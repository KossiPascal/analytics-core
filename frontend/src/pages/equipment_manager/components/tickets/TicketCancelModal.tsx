import { useState } from 'react';
import { FormModal } from '@/components/forms/FormModal/FormModal';
import { FormTextarea } from '@/components/forms/FormTextarea/FormTextarea';
import { useFormValidation } from '@/components/forms/useFormValidation';
import { XCircle } from 'lucide-react';
import shared from '@components/ui/styles/shared.module.css';
import toast from 'react-hot-toast';
import { ticketsApi } from '../../api';

const VALIDATION_RULES = {
  reason: { required: true, message: "La raison de l'annulation est requise" },
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  ticketId: string | null;
}

export function TicketCancelModal({ isOpen, onClose, onSuccess, ticketId }: Props) {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const { touchField, validateAll, getFieldError, getErrorMessages, isFormValid, reset } = useFormValidation(VALIDATION_RULES);

  const canSubmit = isFormValid({ reason });
  const errorMessages = getErrorMessages();

  const handleSave = async () => {
    if (!ticketId || !validateAll({ reason })) return;
    setSaving(true);
    try {
      const res = await ticketsApi.cancel(ticketId, { cancellation_reason: reason });
      if (res.success) {
        toast.success('Ticket annule');
        onSuccess(); onClose(); setReason(''); reset();
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
      title="Annuler le ticket"
      size="md"
      errors={errorMessages}
      onSubmit={handleSave}
      isSubmitDisabled={!canSubmit}
      isLoading={saving}
      submitLabel="Annuler le ticket"
      submitIcon={<XCircle size={16} />}
      submitVariant="danger"
    >
      <form className={shared.form} onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
        <FormTextarea
          label="Raison de l'annulation"
          required
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          onBlur={() => touchField('reason', reason)}
          error={getFieldError('reason')}
          placeholder="Expliquer la raison de l'annulation..."
        />
      </form>
    </FormModal>
  );
}
