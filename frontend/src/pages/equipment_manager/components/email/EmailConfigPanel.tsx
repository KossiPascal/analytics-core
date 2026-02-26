import { useState, useEffect } from 'react';
import { Button } from '@components/ui/Button/Button';
import { FormInput } from '@/components/forms/FormInput/FormInput';
import { FormSelect } from '@/components/forms/FormSelect/FormSelect';
import { Badge } from '@components/ui/Badge/Badge';
import { Save, Wifi } from 'lucide-react';
import { emailConfigApi } from '../../api';
import type { EmailConfig } from '../../types';
import shared from '@components/ui/styles/shared.module.css';
import toast from 'react-hot-toast';

export function EmailConfigPanel() {
  const [config, setConfig] = useState<EmailConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  const [host, setHost] = useState('');
  const [port, setPort] = useState('587');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [fromName, setFromName] = useState('IH Equipment Manager');
  const [useTls, setUseTls] = useState('true');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const res = await emailConfigApi.get();
    if (res.success && res.data) {
      const c = res.data;
      setConfig(c);
      setHost(c.host);
      setPort(String(c.port));
      setUsername(c.username);
      setFromEmail(c.from_email);
      setFromName(c.from_name || 'IH Equipment Manager');
      setUseTls(c.use_tls ? 'true' : 'false');
      setPassword(''); // never pre-fill password
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!host || !username || !fromEmail) {
      toast.error('Host, utilisateur et adresse expéditeur requis');
      return;
    }
    if (!password && !config) {
      toast.error('Mot de passe requis pour une nouvelle configuration');
      return;
    }
    setSaving(true);
    const res = await emailConfigApi.save({
      host,
      port: parseInt(port, 10),
      username,
      password,
      from_email: fromEmail,
      from_name: fromName,
      use_tls: useTls === 'true',
    });
    if (res.success) {
      toast.success('Configuration SMTP enregistrée');
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
      use_tls: useTls === 'true',
    });
    if (res.success) {
      toast.success(res.data?.message || 'Connexion SMTP réussie');
    } else {
      toast.error(res.message || 'Échec de la connexion SMTP');
    }
    setTesting(false);
  };

  const handleDelete = async () => {
    if (!config) return;
    if (!confirm('Supprimer la configuration SMTP active ?')) return;
    const res = await emailConfigApi.delete(config.id);
    if (res.success) {
      toast.success('Configuration supprimée');
      setConfig(null);
      setHost(''); setPort('587'); setUsername(''); setPassword('');
      setFromEmail(''); setFromName('IH Equipment Manager'); setUseTls('true');
    } else {
      toast.error(res.message || 'Erreur');
    }
  };

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600 }}>Configuration SMTP</h4>
        {config ? (
          <Badge variant="success">Configuration active en DB</Badge>
        ) : (
          <Badge variant="secondary">Fallback sur .env</Badge>
        )}
      </div>

      {loading ? (
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Chargement...</p>
      ) : (
        <form className={shared.form} onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem', alignItems: 'end' }}>
            <FormInput label="Serveur SMTP (Host)" required value={host} onChange={(e) => setHost(e.target.value)} placeholder="smtp.example.com" />
            <div style={{ width: 90 }}>
              <FormInput label="Port" required value={port} onChange={(e) => setPort(e.target.value)} placeholder="587" />
            </div>
          </div>

          <FormSelect
            label="TLS"
            value={useTls}
            onChange={setUseTls}
            options={[
              { value: 'true', label: 'STARTTLS (recommandé)' },
              { value: 'false', label: 'Pas de TLS' },
            ]}
          />

          <FormInput label="Utilisateur SMTP" required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="user@example.com" />
          <FormInput
            label={config ? "Nouveau mot de passe (laisser vide pour conserver)" : "Mot de passe SMTP"}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={config ? '••••••••' : 'Mot de passe'}
          />

          <FormInput label="Adresse expéditeur" required value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} placeholder="no-reply@example.com" />
          <FormInput label="Nom expéditeur" value={fromName} onChange={(e) => setFromName(e.target.value)} placeholder="IH Equipment Manager" />

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <Button type="button" variant="outline" size="sm" onClick={handleTest} isLoading={testing}>
              <Wifi size={16} /> Tester la connexion
            </Button>
            <Button type="submit" size="sm" isLoading={saving}>
              <Save size={16} /> Enregistrer
            </Button>
            {config && (
              <Button type="button" variant="danger" size="sm" onClick={handleDelete}>
                Supprimer
              </Button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
