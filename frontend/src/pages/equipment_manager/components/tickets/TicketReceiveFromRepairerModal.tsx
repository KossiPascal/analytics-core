import { useState, useEffect } from 'react';
import { FormModal } from '@/components/forms/FormModal/FormModal';
import { FormTextarea } from '@/components/forms/FormTextarea/FormTextarea';
import { PackageCheck } from 'lucide-react';
import shared from '@components/ui/styles/shared.module.css';
import toast from 'react-hot-toast';
import { ticketsApi } from '../../api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  ticketId: string | null;
}

type EquipmentState = 'REPAIRED' | 'COMPLETELY_DAMAGED';

export function TicketReceiveFromRepairerModal({ isOpen, onClose, onSuccess, ticketId }: Props) {
  const [equipmentState, setEquipmentState] = useState<EquipmentState>('REPAIRED');
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setEquipmentState('REPAIRED');
      setComment('');
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!ticketId) return;
    setSaving(true);
    try {
      const res = await ticketsApi.receiveFromRepairer(ticketId, {
        equipment_state: equipmentState,
        comment: comment || undefined,
      });
      if (res.success) {
        toast.success(
          equipmentState === 'REPAIRED'
            ? 'Équipement réceptionné — retour lancé'
            : 'Équipement déclaré non récupérable — ticket clôturé'
        );
        onSuccess();
        onClose();
      } else {
        toast.error(res.message || 'Erreur');
      }
    } catch {
      toast.error('Erreur lors de la réception');
    } finally {
      setSaving(false);
    }
  };

  const isDamaged = equipmentState === 'COMPLETELY_DAMAGED';

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Réceptionner depuis le réparateur"
      size="sm"
      onSubmit={handleSave}
      isLoading={saving}
      submitLabel={isDamaged ? 'Clôturer le ticket' : 'Confirmer le retour'}
      submitIcon={<PackageCheck size={16} />}
    >
      <form className={shared.form} onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
        {/* État de l'équipement */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>
            État de l'équipement <span style={{ color: 'var(--color-error)' }}>*</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.75rem', border: `2px solid ${equipmentState === 'REPAIRED' ? 'var(--color-success, #16a34a)' : 'var(--border-color, #e5e7eb)'}`, borderRadius: '0.5rem' }}>
            <input
              type="radio"
              name="equipment_state"
              value="REPAIRED"
              checked={equipmentState === 'REPAIRED'}
              onChange={() => setEquipmentState('REPAIRED')}
            />
            <span>
              <strong style={{ color: 'var(--color-success, #16a34a)' }}>Réparé</strong>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>
                L'équipement est fonctionnel — le processus de retour sera lancé.
              </span>
            </span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.75rem', border: `2px solid ${isDamaged ? 'var(--color-error, #dc2626)' : 'var(--border-color, #e5e7eb)'}`, borderRadius: '0.5rem' }}>
            <input
              type="radio"
              name="equipment_state"
              value="COMPLETELY_DAMAGED"
              checked={isDamaged}
              onChange={() => setEquipmentState('COMPLETELY_DAMAGED')}
            />
            <span>
              <strong style={{ color: 'var(--color-error, #dc2626)' }}>Non récupérable</strong>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>
                L'équipement est complètement endommagé — le ticket sera clôturé définitivement.
              </span>
            </span>
          </label>
        </div>

        {/* Avertissement si non récupérable */}
        {isDamaged && (
          <div style={{ background: 'var(--color-error-bg, #fef2f2)', border: '1px solid var(--color-error, #dc2626)', borderRadius: '0.375rem', padding: '0.75rem', fontSize: '0.8rem', color: 'var(--color-error, #dc2626)' }}>
            ⚠ Cette action est irréversible. L'équipement sera marqué comme complètement endommagé et le ticket clôturé.
          </div>
        )}

        <FormTextarea
          label="Commentaire (optionnel)"
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </form>
    </FormModal>
  );
}
