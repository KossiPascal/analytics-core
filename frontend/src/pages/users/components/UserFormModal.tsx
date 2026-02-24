import { useState, useEffect } from 'react';
import { User as UserIcon, Mail, Lock, Phone } from 'lucide-react';
import { FormModal } from '@/components/forms/FormModal/FormModal';
import { FormInput } from '@/components/forms/FormInput/FormInput';
import { FormSelect } from '@/components/forms/FormSelect/FormSelect';
import { FormSwitch } from '@/components/forms/FormSwitch/FormSwitch';
import { api } from '@/apis/api';
import type { ApiUser, ApiRole, ApiTenant } from '../types';
import shared from '@components/ui/styles/shared.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editData: ApiUser | null;
}

export function UserFormModal({ isOpen, onClose, onSuccess, editData }: Props) {
  const isEdit = !!editData;

  const [username, setUsername]   = useState('');
  const [fullname, setFullname]   = useState('');
  const [email, setEmail]         = useState('');
  const [phone, setPhone]         = useState('');
  const [password, setPassword]   = useState('');
  const [isActive, setIsActive]   = useState(true);
  const [tenantId, setTenantId]   = useState('');
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

  const [tenants, setTenants]     = useState<ApiTenant[]>([]);
  const [roles, setRoles]         = useState<ApiRole[]>([]);
  const [saving, setSaving]       = useState(false);
  const [errors, setErrors]       = useState<string[]>([]);

  // Charger tenants et rôles
  useEffect(() => {
    if (!isOpen) return;
    api.get<ApiTenant[]>('/tenants').then((r) => { if (r.success) setTenants(r.data ?? []); });
    api.get<ApiRole[]>('/roles').then((r) => { if (r.success) setRoles(r.data ?? []); });
  }, [isOpen]);

  // Pré-remplissage en mode édition
  useEffect(() => {
    if (isOpen && editData) {
      setUsername(editData.username);
      setFullname(editData.fullname ?? '');
      setEmail(editData.email ?? '');
      setPhone(editData.phone ?? '');
      setIsActive(editData.is_active);
      setTenantId(editData.tenant_id ?? '');
      setPassword('');
    } else if (isOpen) {
      setUsername(''); setFullname(''); setEmail(''); setPhone('');
      setIsActive(true); setTenantId(''); setPassword('');
      setSelectedRoleIds([]);
    }
    setErrors([]);
  }, [isOpen, editData]);

  // Pré-cocher les rôles de l'utilisateur (après chargement des rôles)
  useEffect(() => {
    if (isEdit && editData && roles.length > 0) {
      const matched = roles.filter((r) => editData.roles.includes(r.name)).map((r) => r.id);
      setSelectedRoleIds(matched);
    }
  }, [roles, editData, isEdit]);

  const toggleRole = (id: string) => {
    setSelectedRoleIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleSave = async () => {
    const errs: string[] = [];
    if (!isEdit && !username.trim()) errs.push("Le nom d'utilisateur est requis");
    if (!isEdit && !password.trim()) errs.push('Le mot de passe est requis');
    if (!isEdit && password.length > 0 && password.length < 6) errs.push('Le mot de passe doit contenir au moins 6 caractères');
    if (!tenantId) errs.push('Le tenant est requis');
    if (errs.length > 0) { setErrors(errs); return; }

    setSaving(true);
    const payload: Record<string, unknown> = {
      fullname: fullname.trim() || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
      is_active: isActive,
      tenant_id: tenantId,
      role_ids: selectedRoleIds,
    };
    if (!isEdit) payload.username = username.trim();
    if (password.trim()) payload.password = password.trim();

    const res = isEdit
      ? await api.patch<ApiUser>(`/users/${editData!.id}`, payload)
      : await api.post<ApiUser>('/users', payload);

    setSaving(false);
    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setErrors([res.message ?? 'Erreur lors de la sauvegarde']);
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
      size="md"
      errors={errors}
      onSubmit={handleSave}
      isSubmitDisabled={saving}
      isLoading={saving}
      submitLabel={isEdit ? 'Modifier' : 'Créer'}
    >
      <div className={shared.form}>
        <FormInput
          label="Nom d'utilisateur"
          required={!isEdit}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="ex: jean_dupont"
          disabled={isEdit}
          leftIcon={<UserIcon size={16} />}
        />

        <FormInput
          label="Nom complet"
          value={fullname}
          onChange={(e) => setFullname(e.target.value)}
          placeholder="Prénom Nom"
          leftIcon={<UserIcon size={16} />}
        />

        <FormInput
          type="email"
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@exemple.com"
          leftIcon={<Mail size={16} />}
        />

        <FormInput
          type="tel"
          label="Téléphone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+224 XXX XXX XXX"
          leftIcon={<Phone size={16} />}
        />

        <FormInput
          type="password"
          label={isEdit ? 'Nouveau mot de passe' : 'Mot de passe'}
          required={!isEdit}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={isEdit ? 'Laisser vide pour ne pas modifier' : 'Minimum 6 caractères'}
          leftIcon={<Lock size={16} />}
          hint={isEdit ? 'Optionnel' : 'Minimum 6 caractères'}
        />

        <FormSelect
          label="Tenant"
          required
          value={tenantId}
          onChange={(v) => setTenantId(v)}
          options={tenants.map((t) => ({ value: t.id, label: t.name }))}
          placeholder="Sélectionner un tenant"
        />

        {/* Rôles */}
        <div>
          <label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'block', marginBottom: '0.5rem' }}>
            Rôles
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', maxHeight: '160px', overflowY: 'auto', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
            {roles.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Aucun rôle disponible</span>}
            {roles.map((r) => (
              <label key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                <input
                  type="checkbox"
                  checked={selectedRoleIds.includes(r.id)}
                  onChange={() => toggleRole(r.id)}
                />
                {r.name}
              </label>
            ))}
          </div>
        </div>

        <FormSwitch
          label="Utilisateur actif"
          description="Désactiver bloque la connexion"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
      </div>
    </FormModal>
  );
}
