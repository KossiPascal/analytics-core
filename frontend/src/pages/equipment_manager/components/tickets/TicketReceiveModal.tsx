import { useState } from 'react';
import { Modal } from '@components/ui/Modal/Modal';
import { Button } from '@components/ui/Button/Button';
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirmer la reception"
      size="sm"
      footer={
        <div className={shared.modalFooter}>
          <Button variant="outline" size="sm" onClick={onClose}>Annuler</Button>
          <Button variant="primary" size="sm" onClick={handleSave} isLoading={saving}>
            <CheckCircle size={16} /> Confirmer
          </Button>
        </div>
      }
    >
      <form className={shared.form}>
        <FormTextarea label="Commentaire (optionnel)" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} />
      </form>
    </Modal>
  );
}
