import { useState, useEffect } from 'react';
import { Button } from '@components/ui/Button/Button';
import { Badge } from '@components/ui/Badge/Badge';
import { Table, type Column } from '@components/ui/Table/Table';
import { Modal } from '@components/ui/Modal/Modal';
import { FormSelect } from '@/components/forms/FormSelect/FormSelect';
import { Plus, Trash2, Save } from 'lucide-react';
import { alertConfigApi, alertRecipientConfigsApi, employeesApi } from '../../api';
import type { AlertConfig, AlertRecipientConfig, AlertLevel, Employee, Position } from '../../types';
import { STAGE_LABELS } from '../../types';
import shared from '@components/ui/styles/shared.module.css';
import toast from 'react-hot-toast';

const ALERT_LEVEL_LABELS: Record<AlertLevel, string> = {
  WARNING: 'Rappel (>warning j)',
  ESCALATION: 'Escalade (>escalation j)',
  BCC: 'BCC permanent',
};

const ALERT_LEVEL_VARIANT: Record<AlertLevel, 'warning' | 'danger' | 'info'> = {
  WARNING: 'warning',
  ESCALATION: 'danger',
  BCC: 'info',
};

const STAGE_OPTIONS = [
  { value: '', label: 'Toutes les étapes' },
  ...Object.entries(STAGE_LABELS).map(([v, l]) => ({ value: v, label: l })),
];

export function AlertConfigPanel() {
  const [config, setConfig] = useState<AlertConfig | null>(null);
  const [warningDays, setWarningDays] = useState('7');
  const [escalationDays, setEscalationDays] = useState('14');
  const [frequencyHours, setFrequencyHours] = useState('24');
  const [savingConfig, setSavingConfig] = useState(false);

  const [recipients, setRecipients] = useState<AlertRecipientConfig[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [formLevel, setFormLevel] = useState<string>('WARNING');
  const [formStage, setFormStage] = useState<string>('');
  const [formType, setFormType] = useState<string>('EMPLOYEE');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [formEmployeeId, setFormEmployeeId] = useState('');
  const [formPositionId, setFormPositionId] = useState('');
  const [savingRecipient, setSavingRecipient] = useState(false);

  useEffect(() => { loadConfig(); loadRecipients(); loadOptions(); }, []);

  const loadConfig = async () => {
    const res = await alertConfigApi.get();
    if (res.success && res.data) {
      const c = res.data;
      setConfig(c);
      setWarningDays(String(c.warning_days));
      setEscalationDays(String(c.escalation_days));
      setFrequencyHours(String(c.frequency_hours));
    }
  };

  const loadRecipients = async () => {
    setLoadingRecipients(true);
    const res = await alertRecipientConfigsApi.getAll();
    if (res.success) setRecipients(res.data!);
    setLoadingRecipients(false);
  };

  const loadOptions = async () => {
    const [empRes, posRes] = await Promise.all([
      employeesApi.getAll({ active: 'true' }),
      employeesApi.getPositions(),
    ]);
    if (empRes.success) setEmployees(empRes.data!);
    if (posRes.success) setPositions(posRes.data!);
  };

  const handleSaveConfig = async () => {
    const w = parseInt(warningDays, 10);
    const e = parseInt(escalationDays, 10);
    const f = parseInt(frequencyHours, 10);
    if (isNaN(w) || isNaN(e) || isNaN(f)) { toast.error('Valeurs invalides'); return; }
    setSavingConfig(true);
    const res = await alertConfigApi.update({ warning_days: w, escalation_days: e, frequency_hours: f });
    if (res.success) { toast.success('Paramètres sauvegardés'); loadConfig(); }
    else toast.error(res.message || 'Erreur');
    setSavingConfig(false);
  };

  const handleCreateRecipient = async () => {
    if (formType === 'EMPLOYEE' && !formEmployeeId) { toast.error('Sélectionner un employé'); return; }
    if (formType === 'POSITION' && !formPositionId) { toast.error('Sélectionner un poste'); return; }
    setSavingRecipient(true);
    const res = await alertRecipientConfigsApi.create({
      alert_level: formLevel,
      recipient_type: formType,
      stage: formStage || null,
      employee_id: formType === 'EMPLOYEE' ? formEmployeeId : null,
      position_id: formType === 'POSITION' ? formPositionId : null,
    });
    if (res.success) {
      toast.success('Destinataire ajouté');
      setFormOpen(false);
      resetForm();
      loadRecipients();
    } else {
      toast.error(res.message || 'Erreur');
    }
    setSavingRecipient(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce destinataire ?')) return;
    const res = await alertRecipientConfigsApi.delete(id);
    if (res.success) { toast.success('Supprimé'); loadRecipients(); }
    else toast.error('Erreur');
  };

  const handleToggle = async (id: string) => {
    const res = await alertRecipientConfigsApi.toggle(id);
    if (res.success) loadRecipients();
    else toast.error('Erreur');
  };

  const resetForm = () => {
    setFormLevel('WARNING'); setFormStage('');
    setFormType('EMPLOYEE'); setFormEmployeeId(''); setFormPositionId('');
  };

  const columns: Column<AlertRecipientConfig>[] = [
    {
      key: 'level',
      header: 'Niveau',
      render: (r) => <Badge variant={ALERT_LEVEL_VARIANT[r.alert_level]}>{r.alert_level}</Badge>,
    },
    { key: 'stage', header: 'Étape', render: (r) => r.stage_label },
    { key: 'type', header: 'Type', render: (r) => r.recipient_type === 'EMPLOYEE' ? 'Employé' : 'Poste' },
    {
      key: 'recipient',
      header: 'Destinataire',
      render: (r) => r.recipient_type === 'EMPLOYEE' ? (r.employee_name ?? '—') : (r.position_name ?? '—'),
    },
    {
      key: 'status',
      header: 'Actif',
      render: (r) => (
        <Badge variant={r.is_active ? 'success' : 'secondary'}>
          {r.is_active ? 'Oui' : 'Non'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) => (
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <Button size="sm" variant="ghost" onClick={() => handleToggle(r.id)}>
            {r.is_active ? 'Désactiver' : 'Activer'}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => handleDelete(r.id)}>
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ];

  const frequencyOptions = [
    { value: '1', label: 'Toutes les heures' },
    { value: '6', label: 'Toutes les 6 heures' },
    { value: '12', label: 'Toutes les 12 heures' },
    { value: '24', label: 'Quotidien (24h)' },
    { value: '48', label: 'Tous les 2 jours' },
    { value: '72', label: 'Tous les 3 jours' },
    { value: '168', label: 'Hebdomadaire (7j)' },
  ];

  return (
    <div>
      {/* Paramètres globaux */}
      <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.9375rem', fontWeight: 600 }}>Paramètres des alertes</h4>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'flex-end' }}>
        <div style={{ minWidth: 160 }}>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Rappel après (jours)
          </label>
          <input
            type="number"
            min={1}
            value={warningDays}
            onChange={(e) => setWarningDays(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--form-border)', borderRadius: '6px', background: 'var(--form-bg)', color: 'var(--form-text)' }}
          />
        </div>
        <div style={{ minWidth: 160 }}>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.25rem' }}>
            Escalade après (jours)
          </label>
          <input
            type="number"
            min={1}
            value={escalationDays}
            onChange={(e) => setEscalationDays(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--form-border)', borderRadius: '6px', background: 'var(--form-bg)', color: 'var(--form-text)' }}
          />
        </div>
        <div style={{ minWidth: 200 }}>
          <FormSelect
            label="Fréquence d'envoi"
            value={frequencyHours}
            onChange={setFrequencyHours}
            options={frequencyOptions}
          />
        </div>
        <Button size="sm" onClick={handleSaveConfig} isLoading={savingConfig}>
          <Save size={16} /> Enregistrer
        </Button>
      </div>

      {/* Destinataires */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1.5rem 0 0.75rem' }}>
        <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600 }}>
          Destinataires configurés
        </h4>
        <Button size="sm" leftIcon={<Plus size={16} />} onClick={() => { resetForm(); setFormOpen(true); }}>
          Ajouter
        </Button>
      </div>

      <Table<AlertRecipientConfig>
        data={recipients}
        columns={columns}
        keyExtractor={(r) => r.id}
        isLoading={loadingRecipients}
        emptyMessage="Aucun destinataire configuré"
      />

      {/* Formulaire d'ajout */}
      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title="Ajouter un destinataire"
        size="sm"
        footer={
          <div className={shared.modalFooter}>
            <Button variant="outline" size="sm" onClick={() => setFormOpen(false)}>Annuler</Button>
            <Button size="sm" onClick={handleCreateRecipient} isLoading={savingRecipient}>
              <Save size={16} /> Ajouter
            </Button>
          </div>
        }
      >
        <div className={shared.form}>
          <FormSelect
            label="Niveau d'alerte"
            required
            value={formLevel}
            onChange={setFormLevel}
            options={[
              { value: 'WARNING', label: 'Rappel (délai dépassé)' },
              { value: 'ESCALATION', label: 'Escalade (délai critique)' },
              { value: 'BCC', label: 'BCC permanent (copie cachée)' },
            ]}
          />
          <FormSelect
            label="Étape concernée"
            value={formStage}
            onChange={setFormStage}
            options={STAGE_OPTIONS}
          />
          <FormSelect
            label="Type de destinataire"
            value={formType}
            onChange={(v) => { setFormType(v); setFormEmployeeId(''); setFormPositionId(''); }}
            options={[
              { value: 'EMPLOYEE', label: 'Employé individuel' },
              { value: 'POSITION', label: 'Par poste (tous les employés du poste)' },
            ]}
          />
          {formType === 'EMPLOYEE' ? (
            <FormSelect
              label="Employé"
              required
              value={formEmployeeId}
              onChange={setFormEmployeeId}
              options={[
                { value: '', label: 'Sélectionner un employé' },
                ...employees.map((e) => ({ value: e.id, label: `${e.full_name} (${e.employee_id_code ?? ''})` })),
              ]}
            />
          ) : (
            <FormSelect
              label="Poste"
              required
              value={formPositionId}
              onChange={setFormPositionId}
              options={[
                { value: '', label: 'Sélectionner un poste' },
                ...positions.map((p) => ({ value: p.id, label: p.name })),
              ]}
            />
          )}
        </div>
      </Modal>
    </div>
  );
}
