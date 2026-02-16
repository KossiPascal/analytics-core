import { useState } from 'react';
import { Modal } from '@components/ui/Modal/Modal';
import { Button } from '@components/ui/Button/Button';
import { FormSelect } from '@/components/forms/FormSelect/FormSelect';
import { FormTextarea } from '@/components/forms/FormTextarea/FormTextarea';
import { FormInput } from '@/components/forms/FormInput/FormInput';
import { Send } from 'lucide-react';
import shared from '@components/ui/styles/shared.module.css';
import toast from 'react-hot-toast';
import { ticketsApi } from '../../api';
import { STAGE_LABELS } from '../../types';

const STAGES = Object.entries(STAGE_LABELS).map(([value, label]) => ({ value, label }));

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

  const handleSave = async () => {
    if (!ticketId || !toRole) { toast.error('Destination requise'); return; }

    setSaving(true);
    try {
      const res = await ticketsApi.send(ticketId, { to_role: toRole, comment, recipient_email: recipientEmail });
      if (res.success) {
        toast.success('Ticket envoye');
        onSuccess();
        onClose();
        setToRole(''); setComment(''); setRecipientEmail('');
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
      title="Envoyer le ticket"
      size="md"
      footer={
        <div className={shared.modalFooter}>
          <Button variant="outline" size="sm" onClick={onClose}>Annuler</Button>
          <Button variant="primary" size="sm" onClick={handleSave} isLoading={saving}>
            <Send size={16} /> Envoyer
          </Button>
        </div>
      }
    >
      <form className={shared.form}>
        <FormSelect
          label="Destination"
          required
          value={toRole}
          onChange={(v) => setToRole(v)}
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
    </Modal>
  );
}
