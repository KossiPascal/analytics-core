import { useState, useEffect } from 'react';
import { FormModal } from '@/components/forms/FormModal/FormModal';
import { FormSelect } from '@/components/forms/FormSelect/FormSelect';
import { FormTextarea } from '@/components/forms/FormTextarea/FormTextarea';
import { useFormValidation } from '@/components/forms/useFormValidation';
import { Send } from 'lucide-react';
import shared from '@components/ui/styles/shared.module.css';
import toast from 'react-hot-toast';
import { ticketsApi, employeesApi } from '../../api';
import { STAGE_LABELS } from '../../types';
import type { Employee, Department } from '../../types';

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
  const [comment, setComment]               = useState('');
  const [recipientId, setRecipientId]       = useState('');
  const [toRole, setToRole]                 = useState('');
  const [nextStages, setNextStages]         = useState<string[]>([]);
  const [allEmployees, setAllEmployees]     = useState<Employee[]>([]);
  const [departments, setDepartments]       = useState<Department[]>([]);
  const [deptCode, setDeptCode]             = useState('');
  const [deptEmployees, setDeptEmployees]   = useState<Employee[]>([]);
  const [deptLoading, setDeptLoading]       = useState(false);
  const [isFinal, setIsFinal]               = useState(false);
  const [loading, setLoading]               = useState(false);
  const [saving, setSaving]                 = useState(false);

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
    setAllEmployees([]);
    setDeptEmployees([]);
    setDepartments([]);
    setRecipientId('');
    setDeptCode('');
    setToRole('');
    setNextStages([]);
    setIsFinal(false);

    Promise.all([
      ticketsApi.getCandidates(ticketId),
      employeesApi.getDepartments(),
    ]).then(([candRes, deptRes]) => {
      if (candRes.success && candRes.data) {
        const { is_final, next_stages, employees: emps } = candRes.data;
        setIsFinal(is_final);
        setNextStages(next_stages);
        setAllEmployees(emps);
        if (!is_final && next_stages.length === 1) setToRole(next_stages[0]);
      }
      if (deptRes.success && deptRes.data) {
        // Aplatir l'arborescence en liste simple
        const flatDepts: Department[] = [];
        const flatten = (depts: Department[]) => {
          depts.forEach((d) => { flatDepts.push(d); if (d.children) flatten(d.children); });
        };
        flatten(deptRes.data);
        setDepartments(flatDepts);
      }
    }).finally(() => setLoading(false));
  }, [isOpen, ticketId]);

  /* ── filtre employés par département ────────────────────────────── */
  useEffect(() => {
    setRecipientId('');
    if (!deptCode) {
      setDeptEmployees([]);
      return;
    }
    setDeptLoading(true);
    employeesApi.getAll({ active: 'true', department_code: deptCode })
      .then((res) => {
        if (res.success) {
          // Intersectionner avec les candidats valides (allEmployees)
          const candidateIds = new Set(allEmployees.map((e) => e.id));
          setDeptEmployees((res.data ?? []).filter((e) => candidateIds.has(e.id)));
        }
      })
      .finally(() => setDeptLoading(false));
  }, [deptCode]);

  /* ── reset à la fermeture ─────────────────────────────────────────── */
  useEffect(() => {
    if (!isOpen) {
      setComment(''); setRecipientId(''); setToRole(''); setDeptCode('');
      setNextStages([]); setAllEmployees([]); setDeptEmployees([]);
      setDepartments([]); setIsFinal(false);
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
      // CC = tous les membres du département sélectionné sauf le destinataire
      const ccIds = deptEmployees
        .filter((e) => e.id !== recipientId)
        .map((e) => e.id);

      const res = await ticketsApi.send(ticketId, {
        to_role: isFinal ? 'RETURNED_ASC' : toRole,
        comment,
        recipient_employee_id: isFinal ? undefined : recipientId,
        cc_employee_ids: ccIds.length ? ccIds : undefined,
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

  /* ── options du select département ────────────────────────────────── */
  const deptOptions = [
    { value: '', label: 'Sélectionner un département' },
    ...departments.map((d) => ({ value: d.code, label: d.name })),
  ];

  /* ── options du select destinataire ──────────────────────────────── */
  const recipientOptions = [
    {
      value: '',
      label: !deptCode
        ? 'Sélectionner d\'abord un département'
        : deptLoading
        ? 'Chargement...'
        : deptEmployees.length === 0
        ? 'Aucun employé trouvé dans ce département'
        : 'Sélectionner un destinataire',
    },
    ...deptEmployees.map((e) => ({
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
              label="Département"
              value={deptCode}
              onChange={(v) => setDeptCode(v)}
              options={deptOptions}
              disabled={loading}
            />

            <FormSelect
              label="Destinataire"
              required
              value={recipientId}
              onChange={(v) => { setRecipientId(v); touchField('recipientId', v); }}
              error={getFieldError('recipientId')}
              options={recipientOptions}
              disabled={loading || !deptCode || deptLoading}
            />
            {deptCode && recipientId && deptEmployees.length > 1 && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted, #6b7280)', margin: '-0.25rem 0 0' }}>
                Les {deptEmployees.length - 1} autre(s) membre(s) du département recevront une copie de l'email.
              </p>
            )}
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
