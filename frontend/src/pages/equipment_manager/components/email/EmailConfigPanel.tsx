import { useState, useEffect } from 'react';
import { Button } from '@components/ui/Button/Button';
import { Badge } from '@components/ui/Badge/Badge';
import { Table, type Column } from '@components/ui/Table/Table';
import { FormInput } from '@/components/forms/FormInput/FormInput';
import { FormSelect } from '@/components/forms/FormSelect/FormSelect';
import { FormModal } from '@/components/forms/FormModal/FormModal';
import { Plus, Save, Wifi, Trash2 } from 'lucide-react';
import { emailConfigApi } from '../../api';
import type { EmailConfig } from '../../types';
import shared from '@components/ui/styles/shared.module.css';
import toast from 'react-hot-toast';

type TlsMode = 'starttls' | 'ssl' | 'none';

const TLS_OPTIONS = [
  { value: 'starttls', label: 'STARTTLS — port 587 (Gmail, Outlook…)' },
  { value: 'ssl',      label: 'SSL/TLS — port 465' },
  { value: 'none',     label: 'Pas de chiffrement — port 25' },
];

const DEFAULT_PORTS: Record<TlsMode, string> = {
  starttls: '587',
  ssl:      '465',
  none:     '25',
};

const TLS_MODE_LABEL: Record<TlsMode, string> = {
  starttls: 'STARTTLS',
  ssl:      'SSL/TLS',
  none:     'Non chiffré',
};

function tlsModeFromConfig(c: EmailConfig): TlsMode {
  if (c.port === 465) return 'ssl';
  if (!c.use_tls)    return 'none';
  return 'starttls';
}

export function EmailConfigPanel() {
  const [configs, setConfigs] = useState<EmailConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editConfig, setEditConfig] = useState<EmailConfig | null>(null);
  const [host, setHost] = useState('');
  const [port, setPort] = useState('587');
  const [tlsMode, setTlsMode] = useState<TlsMode>('starttls');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [fromName, setFromName] = useState('IH Equipment Manager');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const res = await emailConfigApi.getAll();
    if (res.success) setConfigs(res.data ?? []);
    setLoading(false);
  };

  const openCreate = () => {
    setEditConfig(null);
    setHost(''); setPort('587'); setTlsMode('starttls');
    setUsername(''); setPassword(''); setFromEmail('');
    setFromName('IH Equipment Manager');
    setFormOpen(true);
  };

  const openEdit = (c: EmailConfig) => {
    setEditConfig(c);
    setHost(c.host || '');
    setPort(c.port != null ? String(c.port) : '587');
    setTlsMode(tlsModeFromConfig(c));
    setUsername(c.username || '');
    setFromEmail(c.from_email || '');
    setFromName(c.from_name || 'IH Equipment Manager');
    setPassword('');
    setFormOpen(true);
  };

  const handleTlsModeChange = (mode: string) => {
    const m = mode as TlsMode;
    setTlsMode(m);
    setPort(DEFAULT_PORTS[m]);
  };

  const handleSave = async () => {
    if (!host || !username || !fromEmail) {
      toast.error('Host, utilisateur et adresse expéditeur requis');
      return;
    }
    if (!password && !editConfig) {
      toast.error('Mot de passe requis pour une nouvelle configuration');
      return;
    }
    setSaving(true);
    const payload = {
      host,
      port: parseInt(port, 10),
      username,
      password,
      from_email: fromEmail,
      from_name: fromName,
      use_tls: tlsMode === 'starttls',
      use_ssl: tlsMode === 'ssl',
    };
    const res = editConfig
      ? await emailConfigApi.update(editConfig.id, payload)
      : await emailConfigApi.save(payload);
    if (res.success) {
      toast.success(editConfig ? 'Configuration mise à jour' : 'Configuration SMTP enregistrée');
      setFormOpen(false);
      load();
    } else {
      toast.error(res.message || 'Erreur lors de l\'enregistrement');
    }
    setSaving(false);
  };

  const handleTest = async () => {
    if (!host || !username) {
      toast.error('Host et utilisateur requis pour le test');
      return;
    }
    setTesting(true);
    const res = await emailConfigApi.test({
      host,
      port: parseInt(port, 10),
      username,
      password,
      use_tls: tlsMode === 'starttls',
      use_ssl: tlsMode === 'ssl',
    });
    if (res.success) {
      toast.success(res.data?.message || 'Connexion SMTP réussie');
    } else {
      toast.error(res.message || 'Échec de la connexion SMTP', { duration: 6000 });
    }
    setTesting(false);
  };

  const handleActivate = async (c: EmailConfig) => {
    const res = await emailConfigApi.activate(c.id);
    if (res.success) { toast.success('Configuration activée'); load(); }
    else toast.error(res.message || 'Erreur');
  };

  const handleDelete = async (c: EmailConfig) => {
    if (!confirm(`Supprimer la configuration ${c.host} ?`)) return;
    const res = await emailConfigApi.delete(c.id);
    if (res.success) { toast.success('Configuration supprimée'); load(); }
    else toast.error(res.message || 'Erreur');
  };

  const columns: Column<EmailConfig>[] = [
    {
      key: 'server',
      header: 'Serveur',
      render: (c) => `${c.host}:${c.port}`,
    },
    {
      key: 'mode',
      header: 'Mode',
      render: (c) => TLS_MODE_LABEL[tlsModeFromConfig(c)],
    },
    { key: 'username', header: 'Utilisateur', render: (c) => c.username },
    { key: 'from', header: 'Expéditeur', render: (c) => c.from_email },
    {
      key: 'status',
      header: 'Statut',
      render: (c) => (
        <Badge variant={c.is_active ? 'success' : 'secondary'}>
          {c.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (c) => (
        <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
          {!c.is_active && (
            <Button size="sm" variant="ghost" onClick={() => handleActivate(c)}>
              Activer
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => openEdit(c)}>
            Modifier
          </Button>
          <Button size="sm" variant="ghost" onClick={() => handleDelete(c)}>
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ];

  const formFooter = (
    <div className={shared.modalFooter}>
      <Button type="button" variant="outline" size="sm" onClick={() => setFormOpen(false)}>
        Annuler
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleTest}
        isLoading={testing}
        leftIcon={<Wifi size={16} />}
      >
        Tester
      </Button>
      <Button
        type="button"
        size="sm"
        onClick={handleSave}
        isLoading={saving}
        leftIcon={<Save size={16} />}
      >
        {editConfig ? 'Mettre à jour' : 'Enregistrer'}
      </Button>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600 }}>
          Configurations SMTP
        </h4>
        <Button size="sm" leftIcon={<Plus size={16} />} onClick={openCreate}>
          Ajouter
        </Button>
      </div>

      <Table<EmailConfig>
        data={configs}
        columns={columns}
        keyExtractor={(c) => c.id}
        isLoading={loading}
        emptyMessage="Aucune configuration SMTP enregistrée"
      />

      <FormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editConfig ? 'Modifier la configuration SMTP' : 'Nouvelle configuration SMTP'}
        size="md"
        onSubmit={handleSave}
        isLoading={saving}
        footer={formFooter}
      >
        <div className={shared.form}>
          <FormSelect
            label="Mode de connexion"
            value={tlsMode}
            onChange={handleTlsModeChange}
            options={TLS_OPTIONS}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem', alignItems: 'end' }}>
            <FormInput
              label="Serveur SMTP (Host)"
              required
              value={host}
              onChange={(e) => setHost(e.target.value)}
              placeholder="smtp.gmail.com"
            />
            <div style={{ width: 90 }}>
              <FormInput
                label="Port"
                required
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder="587"
              />
            </div>
          </div>

          <FormInput
            label="Utilisateur SMTP"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="user@gmail.com"
          />
          <FormInput
            label={editConfig ? 'Nouveau mot de passe (laisser vide pour conserver)' : 'Mot de passe SMTP'}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={editConfig ? '••••••••' : 'Mot de passe ou App Password'}
          />
          <FormInput
            label="Adresse expéditeur"
            required
            value={fromEmail}
            onChange={(e) => setFromEmail(e.target.value)}
            placeholder="no-reply@example.com"
          />
          <FormInput
            label="Nom expéditeur"
            value={fromName}
            onChange={(e) => setFromName(e.target.value)}
            placeholder="IH Equipment Manager"
          />

          {host.includes('gmail') && (
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.5rem', lineHeight: 1.5 }}>
              <strong>Gmail :</strong> utilisez un{' '}
              <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)' }}>
                mot de passe d'application
              </a>{' '}
              (16 caractères sans espaces). Activez la validation en 2 étapes d'abord.
              Si le port 587 est bloqué, essayez le mode <strong>SSL/TLS — port 465</strong>.
            </p>
          )}
        </div>
      </FormModal>
    </div>
  );
}
