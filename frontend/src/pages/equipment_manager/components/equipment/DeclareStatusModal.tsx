import { useState } from 'react';
import { Modal } from '@components/ui/Modal/Modal';
import { Button } from '@components/ui/Button/Button';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { equipmentApi } from '../../api';
import type { Equipment } from '../../types';
import { EQUIPMENT_STATUS_LABELS } from '../../types';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  equipment: Equipment | null;
}

const DECLARATIONS = [
  { value: 'LOST',               label: 'Perdu',              description: "L'équipement est introuvable." },
  { value: 'STOLEN',             label: 'Volé',               description: "L'équipement a été volé." },
  { value: 'TAKEN_AWAY',         label: 'Emporté',            description: "L'équipement a été emporté par l'employé." },
  { value: 'COMPLETELY_DAMAGED', label: 'Complètement gâté',  description: "L'équipement est irréparable. Tout ticket actif sera automatiquement fermé." },
];

export function DeclareStatusModal({ isOpen, onClose, onSuccess, equipment }: Props) {
  const [declaration, setDeclaration] = useState('LOST');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const isCancelling = equipment ? !equipment.is_active : false;

  const handleDeclare = async () => {
    if (!equipment || !reason.trim()) return;
    setLoading(true);
    const res = await equipmentApi.declare(equipment.id, { declaration, reason: reason.trim(), notes: notes.trim() || undefined });
    if (res.success) {
      toast.success(`Équipement déclaré : ${EQUIPMENT_STATUS_LABELS[declaration]}`);
      resetAndClose();
      onSuccess();
    } else {
      toast.error(res.message || 'Erreur lors de la déclaration');
    }
    setLoading(false);
  };

  const handleCancelDeclaration = async () => {
    if (!equipment) return;
    setLoading(true);
    const res = await equipmentApi.cancelDeclaration(equipment.id, { notes: notes.trim() || undefined });
    if (res.success) {
      toast.success('Déclaration annulée — équipement remis en attente');
      resetAndClose();
      onSuccess();
    } else {
      toast.error(res.message || "Erreur lors de l'annulation");
    }
    setLoading(false);
  };

  const resetAndClose = () => {
    setReason('');
    setNotes('');
    setDeclaration('LOST');
    onClose();
  };

  const currentStatusLabel = equipment ? (EQUIPMENT_STATUS_LABELS[equipment.status] ?? equipment.status) : '';
  const hasOwner = !!(equipment?.owner_id || equipment?.employee_id);
  const restoredStatusLabel = hasOwner ? 'Fonctionnel' : 'En attente';

  return (
    <Modal
      isOpen={isOpen}
      onClose={resetAndClose}
      title={isCancelling
        ? `Annuler la déclaration — ${equipment?.imei ?? ''}`
        : `Déclarer un changement d'état — ${equipment?.imei ?? ''}`}
      size="md"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {isCancelling ? (
          /* ── MODE ANNULATION ─────────────────────────────────────── */
          <>
            {/* Info banner */}
            <div style={{
              display: 'flex', gap: '0.5rem', alignItems: 'flex-start',
              padding: '0.75rem 1rem', borderRadius: '8px',
              background: 'var(--color-success-bg, #d1fae5)',
              border: '1px solid var(--color-success, #10b981)',
              fontSize: '0.875rem',
            }}>
              <CheckCircle size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#10b981' }} />
              <span>
                L'équipement est actuellement <strong>{currentStatusLabel}</strong>. L'annulation le remettra au statut <strong>{restoredStatusLabel}</strong>.
              </span>
            </div>

            {/* Notes */}
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.375rem', fontSize: '0.875rem' }}>
                Notes (optionnel)
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Raison de l'annulation..."
                style={{
                  width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px',
                  border: '1px solid var(--border-color, #e5e7eb)',
                  fontSize: '0.875rem', resize: 'vertical', boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <Button variant="ghost" onClick={resetAndClose} disabled={loading}>Fermer</Button>
              <Button variant="primary" onClick={handleCancelDeclaration} isLoading={loading}>
                Confirmer l'annulation
              </Button>
            </div>
          </>
        ) : (
          /* ── MODE DÉCLARATION ────────────────────────────────────── */
          <>
            {/* Warning banner */}
            <div style={{
              display: 'flex', gap: '0.5rem', alignItems: 'flex-start',
              padding: '0.75rem 1rem', borderRadius: '8px',
              background: 'var(--color-warning-bg, #fef3c7)',
              border: '1px solid var(--color-warning, #f59e0b)',
              fontSize: '0.875rem',
            }}>
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#f59e0b' }} />
              <span>
                Cette action rendra l'équipement <strong>inactif</strong>. Seule l'annulation de la déclaration permettra de le réactiver.
              </span>
            </div>

            {/* Declaration type */}
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                Type de déclaration <span style={{ color: 'var(--color-danger, #ef4444)' }}>*</span>
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {DECLARATIONS.map((d) => (
                  <label key={d.value} style={{
                    display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                    padding: '0.625rem 0.75rem', borderRadius: '8px', cursor: 'pointer',
                    border: `2px solid ${declaration === d.value ? 'var(--color-primary, #6366f1)' : 'var(--border-color, #e5e7eb)'}`,
                    background: declaration === d.value ? 'var(--color-primary-light, #eef2ff)' : 'transparent',
                  }}>
                    <input
                      type="radio"
                      name="declaration"
                      value={d.value}
                      checked={declaration === d.value}
                      onChange={() => setDeclaration(d.value)}
                      style={{ marginTop: '2px' }}
                    />
                    <span>
                      <strong style={{ fontSize: '0.875rem' }}>{d.label}</strong>
                      <br />
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{d.description}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Reason */}
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.375rem', fontSize: '0.875rem' }}>
                Raison <span style={{ color: 'var(--color-danger, #ef4444)' }}>*</span>
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex : Équipement non retrouvé lors de l'inventaire..."
                style={{
                  width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px',
                  border: '1px solid var(--border-color, #e5e7eb)',
                  fontSize: '0.875rem', boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Notes */}
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.375rem', fontSize: '0.875rem' }}>
                Notes (optionnel)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Informations supplémentaires..."
                style={{
                  width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px',
                  border: '1px solid var(--border-color, #e5e7eb)',
                  fontSize: '0.875rem', resize: 'vertical', boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <Button variant="ghost" onClick={resetAndClose} disabled={loading}>Annuler</Button>
              <Button variant="danger" onClick={handleDeclare} isLoading={loading} disabled={!reason.trim()}>
                Confirmer la déclaration
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
