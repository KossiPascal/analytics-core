import { useState } from 'react';
import { UserCheck, RefreshCw } from 'lucide-react';
import { FormModal } from '@/components/forms/FormModal/FormModal';
import { FormInput } from '@/components/forms/FormInput/FormInput';
import toast from 'react-hot-toast';
import { employeesApi } from '../../api';
import type { GeneratedCredentials } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  credentials: GeneratedCredentials;
  employeeId: string;
  employeeName: string;
  onAccountCreated: () => void;
}

function randomPassword(length = 10): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

const USERNAME_RE = /^[a-zA-Z0-9_-]+$/;

export function CredentialsModal({ isOpen, onClose, credentials, employeeId, employeeName, onAccountCreated }: Props) {
  const [username, setUsername] = useState(credentials.username);
  const [password, setPassword] = useState(credentials.password);
  const [saving, setSaving] = useState(false);

  const usernameError = username && !USERNAME_RE.test(username)
    ? 'Lettres, chiffres, tirets et underscores uniquement'
    : '';

  const canSubmit = username.trim().length > 0 && !usernameError && password.length >= 6;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    const res = await employeesApi.createAccount(employeeId, {
      username: username.trim(),
      password,
    });
    setSaving(false);
    if (res.success) {
      toast.success('Compte utilisateur créé avec succès');
      onAccountCreated();
      onClose();
    } else {
      toast.error(res.message || 'Erreur lors de la création du compte');
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Créer le compte utilisateur"
      size="sm"
      errors={[]}
      onSubmit={handleSubmit}
      isSubmitDisabled={!canSubmit}
      isLoading={saving}
      submitLabel="Créer le compte"
      submitIcon={<UserCheck size={16} />}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Bandeau info */}
        <div style={{
          padding: '0.625rem 0.875rem',
          borderRadius: '6px',
          background: 'var(--color-info-bg, #dbeafe)',
          border: '1px solid var(--color-info, #3b82f6)',
          fontSize: '0.8rem',
        }}>
          Définissez les identifiants de connexion pour <strong>{employeeName}</strong>.
          Ces informations ne seront plus affichées après confirmation.
        </div>

        <FormInput
          label="Nom d'utilisateur"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          error={usernameError}
          placeholder="ex: jean_dupont"
        />

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <FormInput
              label="Mot de passe temporaire"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={password.length > 0 && password.length < 6 ? 'Au moins 6 caractères' : ''}
              placeholder="Mot de passe"
            />
          </div>
          <button
            type="button"
            onClick={() => setPassword(randomPassword())}
            title="Générer un nouveau mot de passe"
            style={{
              padding: '0.5rem',
              borderRadius: '6px',
              border: '1px solid var(--border-color, #e5e7eb)',
              background: 'var(--bg-secondary, #f9fafb)',
              cursor: 'pointer',
              marginBottom: password.length > 0 && password.length < 6 ? '1.5rem' : '0.25rem',
              display: 'flex',
              alignItems: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <RefreshCw size={15} />
          </button>
        </div>

        <p style={{
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          margin: 0,
          padding: '0.5rem 0.75rem',
          borderRadius: '6px',
          background: 'var(--color-warning-bg, #fef9c3)',
          border: '1px solid var(--color-warning, #f59e0b)',
        }}>
          L'employé devra changer son mot de passe à la première connexion.
        </p>
      </div>
    </FormModal>
  );
}
