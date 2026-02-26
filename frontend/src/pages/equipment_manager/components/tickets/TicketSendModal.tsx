import { useState, useEffect } from 'react';
import { FormModal } from '@/components/forms/FormModal/FormModal';
import { FormSelect } from '@/components/forms/FormSelect/FormSelect';
import { FormTextarea } from '@/components/forms/FormTextarea/FormTextarea';
import { useFormValidation } from '@/components/forms/useFormValidation';
import { Send } from 'lucide-react';
import shared from '@components/ui/styles/shared.module.css';
import toast from 'react-hot-toast';
import { ticketsApi } from '../../api';
import { STAGE_LABELS } from '../../types';
import type { Employee } from '../../types';

const VALIDATION_RULES = {
  recipientId: { required: true, message: 'Sélectionner un destinataire' },
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  ticketId: string | null;
}

export function TicketSendModal({ isOpen, onClose, onSuccess, ticketId }: Props) {
  const [comment, setComment]           = useState('');
  const [recipientId, setRecipientId]   = useState('');
  const [toRole, setToRole]             = useState('');       // auto ou choisi
  const [nextStages, setNextStages]     = useState<string[]>([]);
  const [employees, setEmployees]       = useState<Employee[]>([]);
  const [isFinal, setIsFinal]           = useState(false);
  const [loading, setLoading]           = useState(false);
  const [saving, setSaving]             = useState(false);

  const { touchField, validateAll, getFieldError, getErrorMessages, isFormValid, reset } =
    useFormValidation(isFinal ? {} : VALIDATION_RULES);

  const needsStageChoice = nextStages.length > 1;
  const canSubmit = isFinal
    ? true
    : isFormValid({ recipientId }) && (!needsStageChoice || !!toRole);

  /* ── chargement à l'ouverture ─────────────────────────────────────── */
  useEffect(() => {
    if (!isOpen || !ticketId) return;

    setLoading(true);
    setEmployees([]);
    setRecipientId('');
    setToRole('');
    setNextStages([]);
    setIsFinal(false);

    ticketsApi.getCandidates(ticketId)
      .then((res) => {
        if (!res.success || !res.data) return;
        const { is_final, next_stages, employees: emps } = res.data;
        setIsFinal(is_final);
        setNextStages(next_stages);
        setEmployees(emps);
        // Auto-sélectionner le to_role si une seule étape suivante
        if (!is_final && next_stages.length === 1) setToRole(next_stages[0]);
      })
      .finally(() => setLoading(false));
  }, [isOpen, ticketId]);

  /* ── reset à la fermeture ─────────────────────────────────────────── */
  useEffect(() => {
    if (!isOpen) {
      setComment(''); setRecipientId(''); setToRole('');
      setNextStages([]); setEmployees([]); setIsFinal(false);
      reset();
    }
  }, [isOpen]);

  /* ── soumission ───────────────────────────────────────────────────── */
  const handleSave = async () => {
    if (!ticketId) return;
    if (!isFinal && !validateAll({ recipientId })) return;
    if (!isFinal && needsStageChoice && !toRole) {
      toast.error('Sélectionner le type de destination');
      return;
    }

    setSaving(true);
    try {
      const res = await ticketsApi.send(ticketId, {
        to_role: isFinal ? 'RETURNED_ASC' : toRole,
        comment,
        recipient_employee_id: isFinal ? undefined : recipientId,
      });
      if (res.success) {
        toast.success('Ticket envoyé');
        onSuccess();
        onClose();
        reset();
      } else {
        toast.error(res.message || 'Erreur');
      }
    } catch {
      toast.error("Erreur lors de l'envoi");
    } finally {
      setSaving(false);
    }
  };

  /* ── options du select destinataire ──────────────────────────────── */
  const recipientOptions = [
    {
      value: '',
      label: loading
        ? 'Chargement...'
        : employees.length === 0
        ? 'Aucun employé actif trouvé'
        : 'Sélectionner un destinataire',
    },
    ...employees.map((e) => ({
      value: e.id,
      label: `${e.full_name}${e.position_name ? ` — ${e.position_name}` : ''}${e.email ? ` (${e.email})` : ''}`,
    })),
  ];

  /* ── options du mini-sélecteur de type (seulement si > 1 étape) ──── */
  const stageOptions = [
    { value: '', label: 'Sélectionner le type de destination' },
    ...nextStages
      .filter((s) => s !== 'RETURNED_ASC')
      .map((s) => ({ value: s, label: STAGE_LABELS[s] || s })),
  ];

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Envoyer le ticket"
      size="md"
      errors={getErrorMessages()}
      onSubmit={handleSave}
      isSubmitDisabled={!canSubmit || loading || saving}
      isLoading={saving}
      submitLabel="Envoyer"
      submitIcon={<Send size={16} />}
    >
      <form className={shared.form} onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
        {isFinal ? (
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted, #6b7280)', margin: 0 }}>
            Cette étape retourne le ticket à l'employé propriétaire de l'équipement. Le ticket sera clôturé.
          </p>
        ) : (
          <>
            {/* Sélecteur de type uniquement quand LOGISTICS → REPAIRER / ESANTE */}
            {needsStageChoice && (
              <FormSelect
                label="Type de destination"
                required
                value={toRole}
                onChange={setToRole}
                options={stageOptions}
              />
            )}

            <FormSelect
              label="Destinataire"
              required
              value={recipientId}
              onChange={(v) => { setRecipientId(v); touchField('recipientId', v); }}
              error={getFieldError('recipientId')}
              options={recipientOptions}
              disabled={loading}
            />
          </>
        )}

        <FormTextarea
          label="Commentaire"
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </form>
    </FormModal>
  );
}
