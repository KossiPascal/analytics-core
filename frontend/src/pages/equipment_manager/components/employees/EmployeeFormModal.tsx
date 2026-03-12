import { useState, useEffect } from 'react';
import { FormModal } from '@/components/forms/FormModal/FormModal';
import { Button } from '@components/ui/Button/Button';
import { FormInput } from '@/components/forms/FormInput/FormInput';
import { FormSelect } from '@/components/forms/FormSelect/FormSelect';
import { useFormValidation } from '@/components/forms/useFormValidation';
import { Save, Plus, UserPlus } from 'lucide-react';
import shared from '@components/ui/styles/shared.module.css';
import toast from 'react-hot-toast';
import { employeesApi } from '../../api';
import { userService } from '@services/identity.service';
import type { Employee, Position } from '../../types';
import type { User } from '@models/identity.model';
import { PositionFormModal } from './PositionFormModal';
import { UserFormModal } from '@pages/admins/components/identities/UserFormModal';

const VALIDATION_RULES = {
  userId:     { required: true, message: "L'utilisateur est requis" },
  positionId: { required: true, message: 'Le poste est requis' },
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
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
  const visited = new Set(result.map((r) => r.value));
  positions
    .filter((p) => p.is_active && !visited.has(p.id))
    .forEach((p) => result.push({ value: p.id, label: p.name }));
  return result;
}

// ── Composant principal ───────────────────────────────────────────────────────
export function EmployeeFormModal({ isOpen, onClose, onSuccess, editData, positions }: Props) {
  const [code,       setCode]       = useState('');
  const [positionId, setPositionId] = useState('');
  const [hireDate,   setHireDate]   = useState('');
  const [saving,     setSaving]     = useState(false);

  // ── User select ──────────────────────────────────────────────────────────────
  const [userId,         setUserId]         = useState('');
  const [users,          setUsers]          = useState<User[]>([]);
  const [usersLoading,   setUsersLoading]   = useState(false);
  const [createUserOpen, setCreateUserOpen] = useState(false);

  const loadUsers = async (): Promise<User[]> => {
    setUsersLoading(true);
    try {
      const list = await userService.full();
      setUsers(list ?? []);
      return list ?? [];
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => { if (isOpen) loadUsers(); }, [isOpen]);

  const handleUserCreated = (newUser: User) => {
    setCreateUserOpen(false);
    loadUsers().then((list) => {
      const found = list.find((u) => String(u.id) === String(newUser.id)) ?? newUser;
      setUserId(String(found.id));
      touchField('userId', String(found.id));
    });
  };

  const [posFormOpen,    setPosFormOpen]    = useState(false);
  const [localPositions, setLocalPositions] = useState<Position[]>([]);

  const isEdit = !!editData;
  const { touchField, validateAll, getFieldError, getErrorMessages, isFormValid, reset } = useFormValidation(VALIDATION_RULES);

  const allPositions    = [...positions, ...localPositions.filter((lp) => !positions.find((p) => p.id === lp.id))];
  const positionOptions = buildPositionOptions(allPositions);

  const userOptions = [
    { value: '', label: 'Sélectionner un utilisateur…' },
    ...users.map((u) => ({
      value: String(u.id),
      label: `${u.firstname} ${u.lastname} (@${u.username})`,
    })),
  ];

  useEffect(() => {
    if (editData) {
      setCode(editData.employee_id_code ?? '');
      setPositionId(editData.position_id || '');
      setHireDate(editData.hire_date || '');
      setUserId(editData.user_id ?? '');
    } else {
      setCode(''); setPositionId(''); setHireDate(''); setUserId('');
    }
    setLocalPositions([]);
    reset();
  }, [editData, isOpen]);

  const formValues    = { userId, positionId };
  const canSubmit     = isFormValid(formValues);
  const errorMessages = getErrorMessages();

  const handleSave = async () => {
    if (!validateAll(formValues)) return;
    setSaving(true);
    try {
      const selectedUser = users.find((u) => String(u.id) === userId);
      const data = {
        first_name:       selectedUser?.firstname ?? '',
        last_name:        selectedUser?.lastname  ?? '',
        employee_id_code: code.trim() || null,
        tenant_id:        selectedUser?.tenant_id ?? null,
        position_id:      positionId || null,
        hire_date:        hireDate || null,
        user_id:          userId || null,
      };
      const res = isEdit
        ? await employeesApi.update(editData!.id, data)
        : await employeesApi.create(data);

      if (res.success) {
        toast.success(`Employé ${isEdit ? 'mis à jour' : 'créé'} avec succès`);
        onSuccess();
        onClose();
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
    <>
      <FormModal
        isOpen={isOpen}
        onClose={onClose}
        title={`${isEdit ? 'Modifier' : 'Nouvel'} Employé`}
        size="md"
        errors={errorMessages}
        onSubmit={handleSave}
        isSubmitDisabled={!canSubmit}
        isLoading={saving}
        submitLabel="Enregistrer"
        submitIcon={<Save size={16} />}
      >
        <form className={shared.form} onSubmit={(e) => { e.preventDefault(); handleSave(); }}>

          {/* ── Utilisateur lié (requis) ─────────────────────────────────── */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <FormSelect
                label="Compte utilisateur"
                required
                value={userId}
                onChange={(v) => { setUserId(v); touchField('userId', v); }}
                error={getFieldError('userId')}
                options={userOptions}
                searchable
                searchPlaceholder="Rechercher par nom, prénom, username…"
                disabled={usersLoading}
                placeholder={usersLoading ? 'Chargement…' : 'Sélectionner un utilisateur…'}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCreateUserOpen(true)}
              title="Créer un nouvel utilisateur"
              style={{ flexShrink: 0, marginBottom: getFieldError('userId') ? '1.5rem' : '0.25rem' }}
            >
              <UserPlus size={16} />
            </Button>
          </div>

          {/* ── Poste (requis) ───────────────────────────────────────────── */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
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

          {/* ── Code employé / Date d'embauche ───────────────────────────── */}
          <div className={shared.formRow}>
            <FormInput
              label="Code employé (optionnel)"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <FormInput
              label="Date d'embauche"
              type={'date' as any}
              value={hireDate}
              onChange={(e) => setHireDate(e.target.value)}
            />
          </div>

        </form>

        <PositionFormModal
          isOpen={posFormOpen}
          onClose={() => setPosFormOpen(false)}
          onSuccess={() => {}}
          onCreated={handlePositionCreated}
          existingPositions={allPositions}
        />
      </FormModal>

      {/* ── Modal création utilisateur ───────────────────────────────────────── */}
      <UserFormModal
        isOpen={createUserOpen}
        onClose={() => setCreateUserOpen(false)}
        onCreated={handleUserCreated}
      />
    </>
  );
}
