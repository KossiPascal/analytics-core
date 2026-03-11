import { useState, useEffect, useRef } from 'react';
import { FormModal } from '@/components/forms/FormModal/FormModal';
import { Button } from '@components/ui/Button/Button';
import { FormInput } from '@/components/forms/FormInput/FormInput';
import { FormSelect } from '@/components/forms/FormSelect/FormSelect';
import { useFormValidation } from '@/components/forms/useFormValidation';
import { Save, Plus, UserPlus, X } from 'lucide-react';
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

// ── Composant UserAutocomplete ────────────────────────────────────────────────
interface UserAutocompleteProps {
  users: User[];
  value: string;
  onChange: (id: string, user: User | null) => void;
  loading?: boolean;
}

function UserAutocomplete({ users, value, onChange, loading }: UserAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen]   = useState(false);
  const wrapRef           = useRef<HTMLDivElement>(null);

  const selectedUser  = users.find((u) => String(u.id) === value) ?? null;
  const displayLabel  = selectedUser
    ? `${selectedUser.firstname} ${selectedUser.lastname} (@${selectedUser.username})`
    : '';

  useEffect(() => { if (!open) setQuery(''); }, [open]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const filtered = query.trim()
    ? users.filter((u) => {
        const q = query.toLowerCase();
        return (
          u.username?.toLowerCase().includes(q) ||
          u.firstname?.toLowerCase().includes(q) ||
          u.lastname?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q)
        );
      })
    : users;

  return (
    <div ref={wrapRef} style={{ position: 'relative', flex: 1 }}>
      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--text-secondary, #64748b)' }}>
        Compte utilisateur <span style={{ color: 'var(--color-danger, #dc2626)' }}>*</span>
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={open ? query : displayLabel}
          placeholder={loading ? 'Chargement…' : 'Rechercher un utilisateur…'}
          disabled={loading}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          style={{
            width: '100%',
            padding: '0.45rem 2rem 0.45rem 0.65rem',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: '0.375rem',
            fontSize: '0.88rem',
            background: 'var(--input-bg, #fff)',
            color: 'var(--text-primary, #1e293b)',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        {value && (
          <button
            type="button"
            onClick={() => { onChange('', null); setQuery(''); setOpen(false); }}
            style={{ position: 'absolute', right: '0.4rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted, #94a3b8)', padding: 0, display: 'flex' }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {open && filtered.length > 0 && (
        <ul style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000, background: 'var(--surface, #fff)', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '0.375rem', boxShadow: '0 4px 12px rgba(0,0,0,0.12)', maxHeight: '180px', overflowY: 'auto', margin: '2px 0 0', padding: 0, listStyle: 'none' }}>
          {filtered.slice(0, 30).map((u) => (
            <li
              key={u.id}
              onMouseDown={() => { onChange(String(u.id), u); setOpen(false); }}
              style={{ padding: '0.45rem 0.7rem', fontSize: '0.85rem', cursor: 'pointer', background: String(u.id) === value ? 'var(--color-primary-light, #eff6ff)' : 'transparent', color: 'var(--text-primary, #1e293b)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--hover-bg, #f1f5f9)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = String(u.id) === value ? 'var(--color-primary-light, #eff6ff)' : 'transparent')}
            >
              <strong>{u.firstname} {u.lastname}</strong>
              <span style={{ color: 'var(--text-muted, #94a3b8)', marginLeft: '0.4rem', fontSize: '0.78rem' }}>@{u.username}</span>
              {u.email && <span style={{ color: 'var(--text-muted, #94a3b8)', marginLeft: '0.4rem', fontSize: '0.78rem' }}>· {u.email}</span>}
            </li>
          ))}
        </ul>
      )}

      {open && filtered.length === 0 && query.trim() && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000, background: 'var(--surface, #fff)', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '0.375rem', padding: '0.6rem 0.7rem', fontSize: '0.82rem', color: 'var(--text-muted, #94a3b8)' }}>
          Aucun utilisateur trouvé pour « {query} »
        </div>
      )}
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────
export function EmployeeFormModal({ isOpen, onClose, onSuccess, editData, positions }: Props) {
  const [code,       setCode]       = useState('');
  const [positionId, setPositionId] = useState('');
  const [hireDate,   setHireDate]   = useState('');
  const [saving,     setSaving]     = useState(false);

  // ── User select ──────────────────────────────────────────────────────────────
  const [userId,          setUserId]          = useState('');
  const [selectedUser,    setSelectedUser]    = useState<User | null>(null);
  const [users,           setUsers]           = useState<User[]>([]);
  const [usersLoading,    setUsersLoading]    = useState(false);
  const [createUserOpen,  setCreateUserOpen]  = useState(false);

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
      const found = list.find((u) => u.id === newUser.id) ?? newUser;
      if (found?.id) { setUserId(String(found.id)); setSelectedUser(found); }
    });
  };

  const [posFormOpen,     setPosFormOpen]     = useState(false);
  const [localPositions,  setLocalPositions]  = useState<Position[]>([]);

  const isEdit = !!editData;
  const { touchField, validateAll, getFieldError, getErrorMessages, isFormValid, reset } = useFormValidation(VALIDATION_RULES);

  const allPositions    = [...positions, ...localPositions.filter((lp) => !positions.find((p) => p.id === lp.id))];
  const positionOptions = buildPositionOptions(allPositions);

  useEffect(() => {
    if (editData) {
      setCode(editData.employee_id_code ?? '');
      setPositionId(editData.position_id || '');
      setHireDate(editData.hire_date || '');
      setUserId(editData.user_id ?? '');
      setSelectedUser(users.find((u) => String(u.id) === editData.user_id) ?? null);
    } else {
      setCode(''); setPositionId(''); setHireDate('');
      setUserId(''); setSelectedUser(null);
    }
    setLocalPositions([]);
    reset();
  }, [editData, isOpen]);

  const formValues  = { userId, positionId };
  const canSubmit   = isFormValid(formValues);
  const errorMessages = getErrorMessages();

  const handleSave = async () => {
    if (!validateAll(formValues)) return;
    setSaving(true);
    try {
      // Nom/prénom dérivés de l'utilisateur sélectionné
      const user = selectedUser ?? users.find((u) => String(u.id) === userId);
      const data = {
        first_name:       user?.firstname ?? '',
        last_name:        user?.lastname  ?? '',
        employee_id_code: code.trim() || null,
        tenant_id:        user?.tenant_id ?? null,
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
            <UserAutocomplete
              users={users}
              value={userId}
              onChange={(id, u) => { setUserId(id); setSelectedUser(u); touchField('userId', id); }}
              loading={usersLoading}
            />
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
