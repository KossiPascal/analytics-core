import { useState } from 'react';
import { Modal } from '@components/ui/Modal/Modal';
import { Button } from '@components/ui/Button/Button';
import { FormTextarea } from '@/components/forms/FormTextarea/FormTextarea';
import { Wrench } from 'lucide-react';
import shared from '@components/ui/styles/shared.module.css';
import toast from 'react-hot-toast';
import { ticketsApi } from '../../api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  ticketId: string | null;
}

export function TicketRepairModal({ isOpen, onClose, onSuccess, ticketId }: Props) {
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!ticketId || !notes.trim()) { toast.error('Notes de resolution requises'); return; }
    setSaving(true);
    try {
      const res = await ticketsApi.markRepaired(ticketId, { resolution_notes: notes });
      if (res.success) {
        toast.success('Ticket marque comme repare');
        onSuccess(); onClose(); setNotes('');
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
      title="Marquer comme repare"
      size="md"
      footer={
        <div className={shared.modalFooter}>
          <Button variant="outline" size="sm" onClick={onClose}>Annuler</Button>
          <Button variant="success" size="sm" onClick={handleSave} isLoading={saving}>
            <Wrench size={16} /> Marquer repare
          </Button>
        </div>
      }
    >
      <form className={shared.form}>
        <FormTextarea label="Notes de resolution" required rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Decrire la reparation effectuee..." />
      </form>
    </Modal>
  );
}
