import { useState, useEffect } from 'react';
import { FormModal } from '@/components/forms/FormModal/FormModal';
import { Button } from '@components/ui/Button/Button';
import { FormInput } from '@/components/forms/FormInput/FormInput';
import { FormSelect } from '@/components/forms/FormSelect/FormSelect';
import { FormTextarea } from '@/components/forms/FormTextarea/FormTextarea';
import { useFormValidation } from '@/components/forms/useFormValidation';
import { Save, Plus } from 'lucide-react';
import shared from '@components/ui/styles/shared.module.css';
import toast from 'react-hot-toast';
import { employeesApi } from '../../api';
import { api } from '@/apis/api';
import type { Employee, Position, GeneratedCredentials } from '../../types';
import { PositionFormModal } from './PositionFormModal';

interface Tenant { id: string; name: string; }

const VALIDATION_RULES = {
  firstName:  { required: true, message: 'Le prénom est requis' },
  lastName:   { required: true, message: 'Le nom est requis' },
  phone:      { required: true, message: 'Le téléphone est requis' },
  positionId: { required: true, message: 'Le poste est requis' },
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (credentials?: GeneratedCredentials, employeeName?: string, employeeId?: string) => void;
  editData?: Employee | null;
  positions: Position[];
}

/** Flatten positions in depth-first order for a hierarchical select. */
function buildPositionOptions(positions: Position[]): { value: string; label: string }[] {
  const result: { value: string; label: string }[] = [];
  const roots = positions.filter((p) => !p.parent_id && p.is_active);

  function traverse(items: Position[], depth: number) {
    for (const item of items) {
      const prefix = depth === 0 ? '' : '\u00A0\u00A0'.repeat(depth) + '└\u00A0';
      result.push({ value: item.id, label: `${prefix}${item.name}` });
      const children = positions.filter((p) => p.parent_id === item.id && p.is_active);
      traverse(children, depth + 1);
    }
  }

  traverse(roots, 0);

  // Orphans (parent missing/inactive) appended at root level
  const visited = new Set(result.map((r) => r.value));
  positions
    .filter((p) => p.is_active && !visited.has(p.id))
    .forEach((p) => result.push({ value: p.id, label: p.name }));

  return result;
}

export function EmployeeFormModal({ isOpen, onClose, onSuccess, editData, positions }: Props) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [code, setCode] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [gender, setGender] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [positionId, setPositionId] = useState('');
  const [hireDate, setHireDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Charger la liste des tenants au montage
  useEffect(() => {
    api.get<Tenant[]>('/tenants').then((res) => {
      if (res.success) setTenants(res.data ?? []);
    });
  }, []);

  const [posFormOpen, setPosFormOpen] = useState(false);
  const [localPositions, setLocalPositions] = useState<Position[]>([]);

  const isEdit = !!editData;
  const { touchField, validateAll, getFieldError, getErrorMessages, isFormValid, reset } = useFormValidation(VALIDATION_RULES);

  const allPositions = [...positions, ...localPositions.filter((lp) => !positions.find((p) => p.id === lp.id))];
  const positionOptions = buildPositionOptions(allPositions);

  useEffect(() => {
    if (editData) {
      setFirstName(editData.first_name);
      setLastName(editData.last_name);
      setCode(editData.employee_id_code ?? '');
      setTenantId(editData.tenant_id ?? '');
      setGender(editData.gender);
      setPhone(editData.phone);
      setEmail(editData.email);
      setPositionId(editData.position_id || '');
      setHireDate(editData.hire_date || '');
      setNotes(editData.notes);
    } else {
      setFirstName(''); setLastName(''); setCode('');
      setTenantId(''); setGender(''); setPhone(''); setEmail('');
      setPositionId(''); setHireDate(''); setNotes('');
    }
    setLocalPositions([]);
    reset();
  }, [editData, isOpen]);

  const formValues = { firstName, lastName, phone, positionId };
  const canSubmit = isFormValid(formValues);
  const errorMessages = getErrorMessages();

  const handleSave = async () => {
    if (!validateAll(formValues)) return;

    setSaving(true);
    try {
      const data = {
        first_name: firstName,
        last_name: lastName,
        employee_id_code: code.trim() || null,
        tenant_id: tenantId || null,
        gender,
        phone,
        email,
        position_id: positionId || null,
        hire_date: hireDate || null,
        notes,
      };
      const res = isEdit
        ? await employeesApi.update(editData!.id, data)
        : await employeesApi.create(data);

      if (res.success) {
        toast.success(`Employé ${isEdit ? 'mis à jour' : 'créé'} avec succès`);
        const creds = !isEdit ? (res.data as any)?.generated_credentials as GeneratedCredentials | undefined : undefined;
        const empId = !isEdit ? (res.data as any)?.id as string | undefined : undefined;
        onSuccess(creds, `${firstName} ${lastName}`, empId); onClose();
      } else {
        toast.error(res.message || 'Erreur');
      }
    } catch {
      toast.error('Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handlePositionCreated = (pos: Position) => {
    setLocalPositions((prev) => [...prev, pos]);
    setPositionId(pos.id);
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={`${isEdit ? 'Modifier' : 'Nouvel'} Employé`}
      size="lg"
      errors={errorMessages}
      onSubmit={handleSave}
      isSubmitDisabled={!canSubmit}
      isLoading={saving}
      submitLabel="Enregistrer"
      submitIcon={<Save size={16} />}
    >
      <form className={shared.form} onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
        {/* Prénom / Nom */}
        <div className={shared.formRow}>
          <FormInput
            label="Prénom"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            onBlur={() => touchField('firstName', firstName)}
            error={getFieldError('firstName')}
          />
          <FormInput
            label="Nom"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            onBlur={() => touchField('lastName', lastName)}
            error={getFieldError('lastName')}
          />
        </div>

        {/* Téléphone (requis) / Email (optionnel) */}
        <div className={shared.formRow}>
          <FormInput
            label="Téléphone"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onBlur={() => touchField('phone', phone)}
            error={getFieldError('phone')}
          />
          <FormInput
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Poste (requis) */}
        <div className={shared.formRow}>
          {/* Poste hiérarchique + bouton création rapide */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', flex: 1 }}>
            <div style={{ flex: 1 }}>
              <FormSelect
                label="Poste"
                required
                value={positionId}
                onChange={(v) => { setPositionId(v); touchField('positionId', v); }}
                error={getFieldError('positionId')}
                options={[{ value: '', label: 'Sélectionner' }, ...positionOptions]}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPosFormOpen(true)}
              style={{ marginBottom: getFieldError('positionId') ? '1.5rem' : '0.25rem', flexShrink: 0 }}
              title="Créer un nouveau poste"
            >
              <Plus size={16} />
            </Button>
          </div>
        </div>

        {/* Tenant */}
        <FormSelect
          label="Tenant (organisation)"
          value={tenantId}
          onChange={(v) => setTenantId(v)}
          options={[
            { value: '', label: '— Aucun —' },
            ...tenants.map((t) => ({ value: t.id, label: t.name })),
          ]}
        />

        {/* Genre / Code (optionnel) */}
        <div className={shared.formRow}>
          <FormSelect
            label="Genre"
            value={gender}
            onChange={(v) => setGender(v)}
            options={[{ value: '', label: '-' }, { value: 'M', label: 'Masculin' }, { value: 'F', label: 'Féminin' }]}
          />
          <FormInput
            label="Code employé (optionnel)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </div>

        {/* Date d'embauche */}
        <div className={shared.formRow}>
          <FormInput
            label="Date d'embauche"
            type={'date' as any}
            value={hireDate}
            onChange={(e) => setHireDate(e.target.value)}
          />
        </div>

        <FormTextarea label="Notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </form>

      <PositionFormModal
        isOpen={posFormOpen}
        onClose={() => setPosFormOpen(false)}
        onSuccess={() => {}}
        onCreated={handlePositionCreated}
        existingPositions={allPositions}
      />
    </FormModal>
  );
}
