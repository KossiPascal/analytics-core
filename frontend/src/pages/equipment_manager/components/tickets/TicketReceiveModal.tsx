import { useState } from 'react';
import { FormModal } from '@/components/forms/FormModal/FormModal';
import { FormTextarea } from '@/components/forms/FormTextarea/FormTextarea';
import { CheckCircle } from 'lucide-react';
import shared from '@components/ui/styles/shared.module.css';
import toast from 'react-hot-toast';
import { ticketsApi } from '../../api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  ticketId: string | null;
}

export function TicketReceiveModal({ isOpen, onClose, onSuccess, ticketId }: Props) {
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!ticketId) return;
    setSaving(true);
    try {
      const res = await ticketsApi.receive(ticketId, { comment: comment || undefined });
      if (res.success) {
        toast.success('Reception confirmee');
        onSuccess(); onClose(); setComment('');
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
      title="Confirmer la reception"
      size="sm"
      onSubmit={handleSave}
      isLoading={saving}
      submitLabel="Confirmer"
      submitIcon={<CheckCircle size={16} />}
    >
      <form className={shared.form} onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
        <FormTextarea label="Commentaire (optionnel)" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} />
      </form>
    </FormModal>
  );
}
