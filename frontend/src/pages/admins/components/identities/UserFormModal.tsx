import { useState, useEffect, useRef } from 'react';
import { FormModal } from '@/components/forms/FormModal/FormModal';
import { FormInput } from '@components/forms/FormInput/FormInput';
import { FormSelect } from '@components/forms/FormSelect/FormSelect';
import { FormMultiSelect } from '@components/forms/FormSelect/FormMultiSelect';
import { FormCheckbox } from '@components/forms/FormCheckbox/FormCheckbox';
import { UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { tenantService, roleService, orgunitService, userService } from '@services/identity.service';
import type { Tenant, Role, User, Orgunit } from '@models/identity.model';
import { useAuth } from '@/contexts/AuthContext';

const EMPTY_USER: User = {
  id: null,
  username: '',
  lastname: '',
  firstname: '',
  password: '',
  password_confirm: '',
  email: '',
  phone: '',
  tenant_id: null,
  role_ids: [],
  permission_ids: [],
  orgunit_ids: [],
  is_active: true,
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Appelé avec l'utilisateur créé pour permettre l'auto-sélection */
  onCreated?: (user: User) => void;
  /** Pré-remplir le tenant */
  defaultTenantId?: number | null;
}

export function UserFormModal({ isOpen, onClose, onCreated, defaultTenantId }: Props) {
  const { isSuperAdmin, user } = useAuth();

  const [formUser, setFormUser]     = useState<User>({ ...EMPTY_USER });
  const [saving, setSaving] = useState(false);
  const [tenants,  setTenants]  = useState<Tenant[]>([]);
  const [roles,    setRoles]    = useState<Role[]>([]);
  const [orgunits, setOrgunits] = useState<Orgunit[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [tenant_id, setTenantId] = useState<number | undefined>();
  
    const loaded = useRef(false);
  
    useEffect(() => {
      if (loaded.current) return;
      loaded.current = true;
      tenantService.list().then(t => {
        setTenants(t || []);
        setTenantId(user?.tenant_id);
      });
    }, []);

  useEffect(() => {
    if (!isOpen || !tenant_id) return;
    setFormUser({ ...EMPTY_USER, tenant_id: defaultTenantId ?? null });
    setLoading(true);
    Promise.all([roleService.list(tenant_id), orgunitService.list(tenant_id)])
      .then(([r, o]) => {
        setRoles(r ?? []);
        setOrgunits(o ?? []);
        // Auto-sélectionner le tenant si non fourni et qu'il n'y en a qu'un
        if (!defaultTenantId && tenants.length === 1) {
          setFormUser((prev) => ({ ...prev, tenant_id: tenants[0].id ?? null }));
        }
      })
      .finally(() => setLoading(false));
  }, [tenant_id, isOpen, defaultTenantId]);

  const setValue = <K extends keyof User>(key: K, value: User[K]) =>
    setFormUser((prev) => ({ ...prev, [key]: value }));

  const isValid =
    !!formUser.tenant_id &&
    !!formUser.username?.trim() &&
    !!formUser.lastname?.trim() &&
    !!formUser.firstname?.trim() &&
    !!formUser.password &&
    formUser.password === formUser.password_confirm;

  const handleSave = async () => {
    if (!isValid) return;
    setSaving(true);
    try {
      const created = await userService.create(formUser);
      toast.success(`Utilisateur « ${formUser.username} » créé avec succès`);
      onCreated?.(created);
      onClose();
    } catch (e: any) {
      toast.error(e?.message || 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  const errors: string[] = [];
  if (formUser.password && formUser.password_confirm && formUser.password !== formUser.password_confirm)
    errors.push('Les mots de passe ne correspondent pas');

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Nouvel utilisateur"
      size="md"
      errors={errors}
      onSubmit={handleSave}
      isSubmitDisabled={!isValid || saving || loading}
      isLoading={saving}
      submitLabel="Créer l'utilisateur"
      submitIcon={<UserPlus size={16} />}
    >
      <FormSelect
        label="Tenant"
        required
        value={formUser.tenant_id}
        options={[
          { value: null, label: '— Sélectionner —' },
          ...tenants.map((t) => ({ value: t.id, label: t.name })),
        ]}
        onChange={(v) => setValue('tenant_id', v as number | null)}
        placeholder="Sélectionner un tenant"
      />

      <FormInput
        label="Username"
        required
        value={formUser.username}
        onChange={(e) => setValue('username', e.target.value)}
      />

      <FormInput
        label="Nom"
        required
        value={formUser.lastname}
        onChange={(e) => setValue('lastname', e.target.value)}
      />

      <FormInput
        label="Prénoms"
        required
        value={formUser.firstname}
        onChange={(e) => setValue('firstname', e.target.value)}
      />

      <FormInput
        label="Email"
        type="email"
        value={formUser.email}
        onChange={(e) => setValue('email', e.target.value)}
      />

      <FormInput
        label="Téléphone"
        type="tel"
        value={formUser.phone}
        onChange={(e) => setValue('phone', e.target.value)}
      />

      <FormInput
        label="Mot de passe"
        type="password"
        required
        value={formUser.password}
        onChange={(e) => setValue('password', e.target.value)}
        placeholder="········"
      />

      <FormInput
        label="Confirmer le mot de passe"
        type="password"
        required
        value={formUser.password_confirm}
        onChange={(e) => setValue('password_confirm', e.target.value)}
        placeholder="········"
      />

      <FormMultiSelect
        label="Rôles"
        value={formUser.role_ids}
        options={roles.map((r) => ({ value: r.id, label: r.name }))}
        onChange={(values) => setValue('role_ids', values.filter((v): v is number => v !== null))}
        placeholder="Sélectionner des rôles"
        searchable
      />

      <FormMultiSelect
        label="Orgunits"
        value={formUser.orgunit_ids}
        options={orgunits.map((o) => ({ value: o.id, label: o.name }))}
        onChange={(values) => setValue('orgunit_ids', values.filter((v): v is number => v !== null))}
        placeholder="Sélectionner des orgunits"
        searchable
      />

      <FormCheckbox
        label="Actif"
        checked={Boolean(formUser.is_active)}
        onChange={(e) => setValue('is_active', e.target.checked)}
      />
    </FormModal>
  );
}
