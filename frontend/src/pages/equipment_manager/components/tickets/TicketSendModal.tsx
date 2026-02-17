import { useState } from 'react';
import { FormModal } from '@/components/forms/FormModal/FormModal';
import { FormSelect } from '@/components/forms/FormSelect/FormSelect';
import { FormTextarea } from '@/components/forms/FormTextarea/FormTextarea';
import { FormInput } from '@/components/forms/FormInput/FormInput';
import { useFormValidation } from '@/components/forms/useFormValidation';
import { Send } from 'lucide-react';
import shared from '@components/ui/styles/shared.module.css';
import toast from 'react-hot-toast';
import { ticketsApi } from '../../api';
import { STAGE_LABELS } from '../../types';

const STAGES = Object.entries(STAGE_LABELS).map(([value, label]) => ({ value, label }));

const VALIDATION_RULES = {
  toRole: { required: true, message: 'Selectionner une destination' },
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  ticketId: string | null;
}

export function TicketSendModal({ isOpen, onClose, onSuccess, ticketId }: Props) {
  const [toRole, setToRole] = useState('');
  const [comment, setComment] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const { touchField, validateAll, getFieldError, getErrorMessages, isFormValid, reset } = useFormValidation(VALIDATION_RULES);

  const canSubmit = isFormValid({ toRole });
  const errorMessages = getErrorMessages();

  const handleSave = async () => {
    if (!ticketId || !validateAll({ toRole })) return;

    setSaving(true);
    try {
      const res = await ticketsApi.send(ticketId, { to_role: toRole, comment, recipient_email: recipientEmail });
      if (res.success) {
        toast.success('Ticket envoye');
        onSuccess();
        onClose();
        setToRole(''); setComment(''); setRecipientEmail(''); reset();
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
      title="Envoyer le ticket"
      size="md"
      errors={errorMessages}
      onSubmit={handleSave}
      isSubmitDisabled={!canSubmit}
      isLoading={saving}
      submitLabel="Envoyer"
      submitIcon={<Send size={16} />}
    >
      <form className={shared.form} onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
        <FormSelect
          label="Destination"
          required
          value={toRole}
          onChange={(v) => {
            setToRole(v);
            touchField('toRole', v);
          }}
          error={getFieldError('toRole')}
          options={[{ value: '', label: 'Selectionner' }, ...STAGES]}
        />
        <FormInput
          label="Email destinataire"
          type="email"
          value={recipientEmail}
          onChange={(e) => setRecipientEmail(e.target.value)}
          hint="Optionnel - pour notification"
        />
        <FormTextarea label="Commentaire" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} />
      </form>
    </FormModal>
  );
}
