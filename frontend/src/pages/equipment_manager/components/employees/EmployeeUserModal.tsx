import { useState, useEffect } from 'react';
import { FormModal } from '@/components/forms/FormModal/FormModal';
import { FormInput } from '@/components/forms/FormInput/FormInput';
import { FormSwitch } from '@/components/forms/FormSwitch/FormSwitch';
import { FormMultiSelect } from '@/components/forms/FormSelect/FormMultiSelect';
import { useFormValidation } from '@/components/forms/useFormValidation';
import { Badge } from '@components/ui/Badge/Badge';
import { UserCog } from 'lucide-react';
import shared from '@components/ui/styles/shared.module.css';
import toast from 'react-hot-toast';
import { employeesApi, identityApi } from '../../api';
import type { Employee, OrgUnit, Role, UserAccount } from '../../types';

// ─── Styles internes ──────────────────────────────────────────────────────────
const sectionLabel: React.CSSProperties = {
  margin: '0.75rem 0 0.375rem',
  fontWeight: 600,
  fontSize: '0.8rem',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: 'var(--text-muted, #64748b)',
};

const infoCard: React.CSSProperties = {
  background: 'var(--bg-subtle, #f8fafc)',
  border: '1px solid var(--border-muted, #e2e8f0)',
  borderRadius: '0.5rem',
  padding: '0.75rem 1rem',
  display: 'flex',
  flexWrap: 'wrap' as const,
  gap: '0.25rem 1.5rem',
  fontSize: '0.85rem',
  color: 'var(--text-secondary, #475569)',
  marginBottom: '0.25rem',
};

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  employee: Employee;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// ─── Composant ────────────────────────────────────────────────────────────────
export function EmployeeUserModal({ employee, isOpen, onClose, onSuccess }: Props) {
  const isCreate = !employee.user_id;
  const requiresOrgunits = employee.position_is_zone_assignable ?? false;

  // ── Champs du formulaire ──────────────────────────────────────────────────
  const [username, setUsername]               = useState('');
  const [password, setPassword]               = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [isActive, setIsActive]               = useState(true);
  const [selectedRoleIds, setSelectedRoleIds]       = useState<string[]>([]);
  const [selectedOrgunitIds, setSelectedOrgunitIds] = useState<string[]>([]);

  // ── Données de référence ──────────────────────────────────────────────────
  const [roles, setRoles]       = useState<Role[]>([]);
  const [orgunits, setOrgunits] = useState<OrgUnit[]>([]);
  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState(false);

  // ── Règles de validation ──────────────────────────────────────────────────
  const VALIDATION_RULES = {
    username: { required: isCreate, message: "Le nom d'utilisateur est requis" },
    password: { required: isCreate, message: 'Le mot de passe est requis' },
    orgunit_ids: {
      required: requiresOrgunits,
      validate: (v: string[]) =>
        requiresOrgunits && (!Array.isArray(v) || v.length === 0)
          ? "Sélectionnez au moins une zone d'intervention"
          : undefined,
    },
  };

  const { touchField, validateAll, getFieldError, getErrorMessages, isFormValid, reset } =
    useFormValidation(VALIDATION_RULES);

  // ── Chargement au montage ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    setPassword('');
    setPasswordConfirm('');
    reset();

    // Charger orgunits et rôles en parallèle
    Promise.all([identityApi.getOrgUnits(), identityApi.getRoles()]).then(([ou, r]) => {
      if (ou.success) setOrgunits(ou.data ?? []);
      if (r.success) setRoles(r.data ?? []);
    });

    if (!isCreate) {
      // Mode ÉDITION : charger les données actuelles du compte
      employeesApi.getAccount(employee.id).then((res) => {
        if (res.success && res.data) {
          const u = res.data as UserAccount;
          setIsActive(u.is_active ?? true);
          setSelectedRoleIds((u.role_ids ?? []).map(String));
          setSelectedOrgunitIds((u.orgunit_ids ?? []).map(String));
        } else {
          setIsActive(true);
          setSelectedRoleIds([]);
          setSelectedOrgunitIds([]);
        }
        setLoading(false);
      });
    } else {
      // Mode CRÉATION
      setUsername('');
      setIsActive(true);
      setSelectedRoleIds([]);
      setSelectedOrgunitIds([]);
      setLoading(false);
    }
  }, [isOpen, employee.id]);

  // ── Validation ────────────────────────────────────────────────────────────
  const formValues = { username, password, orgunit_ids: selectedOrgunitIds };
  const canSubmit  = isFormValid(formValues);
  const errorMessages = getErrorMessages();

  // ── Soumission ────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validateAll(formValues)) return;
    if (password && password !== passwordConfirm) {
      toast.error('Les mots de passe ne concordent pas');
      return;
    }

    setSaving(true);
    try {
      // Les données de l'employé sont transmises en arrière-plan
      const payload: Record<string, unknown> = {
        firstname:   employee.first_name,
        lastname:    employee.last_name,
        email:       employee.email  || null,
        phone:       employee.phone  || null,
        role_ids:    selectedRoleIds.map(Number),
        orgunit_ids: selectedOrgunitIds.map(Number),
      };

      let res;
      if (isCreate) {
        res = await employeesApi.createAccount(employee.id, {
          ...payload,
          username,
          password,
        });
      } else {
        payload.is_active = isActive;
        if (password) {
          payload.password         = password;
          payload.password_confirm = passwordConfirm;
        }
        res = await employeesApi.updateAccount(employee.id, payload);
      }

      if (res.success) {
        toast.success(`Compte utilisateur ${isCreate ? 'créé' : 'mis à jour'} avec succès`);
        onSuccess();
      } else {
        toast.error(res.message || 'Une erreur est survenue');
      }
    } catch {
      toast.error('Une erreur est survenue');
    } finally {
      setSaving(false);
    }
  };

  // ── Options select ────────────────────────────────────────────────────────
  const roleOptions    = roles.map((r) => ({ value: r.id, label: r.name }));
  const orgunitOptions = orgunits
    .filter((o) => o.is_active)
    .map((o) => ({ value: o.id, label: o.name }));

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={`${isCreate ? 'Créer' : 'Modifier'} le compte — ${employee.full_name}`}
      size="lg"
      errors={errorMessages}
      onSubmit={handleSave}
      isSubmitDisabled={!canSubmit || loading}
      isLoading={saving}
      submitLabel={isCreate ? 'Créer le compte' : 'Enregistrer'}
      submitIcon={<UserCog size={16} />}
    >
      <form className={shared.form} onSubmit={(e) => { e.preventDefault(); handleSave(); }}>

        {/* ── Carte info employé (lecture seule) ────────────────────────── */}
        <div style={infoCard}>
          <span><strong>Employé&nbsp;:</strong>&nbsp;{employee.full_name}</span>
          {employee.position_name && (
            <span><strong>Poste&nbsp;:</strong>&nbsp;{employee.position_name}</span>
          )}
          {employee.email && (
            <span><strong>Email&nbsp;:</strong>&nbsp;{employee.email}</span>
          )}
          {employee.phone && (
            <span><strong>Tél&nbsp;:</strong>&nbsp;{employee.phone}</span>
          )}
          {!isCreate && (
            <Badge variant="success">Compte existant</Badge>
          )}
        </div>

        {/* ── Informations du compte ────────────────────────────────────── */}
        <p style={sectionLabel}>Informations du compte</p>

        {/* Username — uniquement en création */}
        {isCreate && (
          <FormInput
            label="Nom d'utilisateur"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onBlur={() => touchField('username', username)}
            error={getFieldError('username')}
            hint="Lettres, chiffres, tirets ( - ) et underscores ( _ ) uniquement"
          />
        )}

        {/* Mot de passe */}
        <div className={shared.formRow}>
          <FormInput
            label={isCreate ? 'Mot de passe' : 'Nouveau mot de passe (optionnel)'}
            type="password"
            required={isCreate}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => isCreate && touchField('password', password)}
            error={getFieldError('password')}
          />
          <FormInput
            label="Confirmer le mot de passe"
            type="password"
            required={isCreate || !!password}
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
          />
        </div>

        {/* Statut du compte — uniquement en édition */}
        {!isCreate && (
          <FormSwitch
            label="Compte actif"
            description="Désactivez pour bloquer l'accès sans supprimer le compte"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            layout="inline"
          />
        )}

        {/* ── Rôles ────────────────────────────────────────────────────── */}
        <p style={sectionLabel}>Rôles &amp; Accès</p>
        <FormMultiSelect
          label="Rôles assignés"
          options={roleOptions}
          value={selectedRoleIds}
          onChange={(vals) => setSelectedRoleIds((vals as string[]).map(String))}
          searchable
          searchPlaceholder="Rechercher un rôle…"
          placeholder="Aucun rôle sélectionné"
        />

        {/* ── Zones d'intervention (conditionnel : poste assignable à une zone) ── */}
        {requiresOrgunits && (
          <>
            <p style={sectionLabel}>
              Zones d&apos;intervention
              <span style={{ color: 'var(--color-danger, #ef4444)', marginLeft: '0.2rem' }}>*</span>
            </p>
            <FormMultiSelect
              label="Unités d'organisation"
              required
              options={orgunitOptions}
              value={selectedOrgunitIds}
              onChange={(vals) => {
                const ids = (vals as string[]).map(String);
                setSelectedOrgunitIds(ids);
                touchField('orgunit_ids', ids);
              }}
              searchable
              searchPlaceholder="Rechercher une zone…"
              placeholder="Sélectionner les zones d'intervention…"
              error={getFieldError('orgunit_ids')}
            />
          </>
        )}

      </form>
    </FormModal>
  );
}
