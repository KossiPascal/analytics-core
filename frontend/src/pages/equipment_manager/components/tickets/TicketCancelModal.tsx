import { useState } from 'react';
import { Modal } from '@components/ui/Modal/Modal';
import { Button } from '@components/ui/Button/Button';
import { FormTextarea } from '@/components/forms/FormTextarea/FormTextarea';
import { XCircle } from 'lucide-react';
import shared from '@components/ui/styles/shared.module.css';
import toast from 'react-hot-toast';
import { ticketsApi } from '../../api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  ticketId: string | null;
}

export function TicketCancelModal({ isOpen, onClose, onSuccess, ticketId }: Props) {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!ticketId || !reason.trim()) { toast.error('Raison requise'); return; }
    setSaving(true);
    try {
      const res = await ticketsApi.cancel(ticketId, { cancellation_reason: reason });
      if (res.success) {
        toast.success('Ticket annule');
        onSuccess(); onClose(); setReason('');
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
      title="Annuler le ticket"
      size="md"
      footer={
        <div className={shared.modalFooter}>
          <Button variant="outline" size="sm" onClick={onClose}>Annuler</Button>
          <Button variant="danger" size="sm" onClick={handleSave} isLoading={saving}>
            <XCircle size={16} /> Annuler le ticket
          </Button>
        </div>
      }
    >
      <form className={shared.form}>
        <FormTextarea label="Raison de l'annulation" required rows={4} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Expliquer la raison de l'annulation..." />
      </form>
    </Modal>
  );
}
