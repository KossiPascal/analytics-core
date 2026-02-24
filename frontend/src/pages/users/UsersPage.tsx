import { useState, useEffect } from 'react';
import { PageWrapper } from '@components/layout/PageWrapper/PageWrapper';
import { Card, CardBody } from '@components/ui/Card/Card';
import { Button } from '@components/ui/Button/Button';
import { Modal } from '@components/ui/Modal/Modal';
import { FormInput } from '@/components/forms/FormInput/FormInput';
import { FormTextarea } from '@/components/forms/FormTextarea/FormTextarea';
import { UsersTable } from './components/UsersTable/UsersTable';
import { UserFormModal } from './components/UserFormModal';
import { api } from '@/apis/api';
import type { ApiUser, ApiRole, ApiPerm } from './types';
import {
  Users, Shield, ShieldCheck, UserPlus, ShieldPlus, RefreshCw, Save, Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './UsersPage.module.css';
import shared from '@components/ui/styles/shared.module.css';

type TabType = 'users' | 'roles' | 'permissions';

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState<TabType>('users');

  // ── Users ────────────────────────────────────────────────────────────────
  const [users, setUsers]             = useState<ApiUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [userEditData, setUserEditData] = useState<ApiUser | null>(null);
  const [deleteUserTarget, setDeleteUserTarget] = useState<ApiUser | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);

  // ── Roles ─────────────────────────────────────────────────────────────────
  const [roles, setRoles]               = useState<ApiRole[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [roleFormOpen, setRoleFormOpen] = useState(false);
  const [roleEditData, setRoleEditData] = useState<ApiRole | null>(null);
  const [roleName, setRoleName]         = useState('');
  const [roleSaving, setRoleSaving]     = useState(false);
  const [deleteRoleTarget, setDeleteRoleTarget] = useState<ApiRole | null>(null);

  // ── Permissions ───────────────────────────────────────────────────────────
  const [perms, setPerms]               = useState<ApiPerm[]>([]);
  const [permsLoading, setPermsLoading] = useState(false);
  const [permFormOpen, setPermFormOpen] = useState(false);
  const [permEditData, setPermEditData] = useState<ApiPerm | null>(null);
  const [permName, setPermName]         = useState('');
  const [permDesc, setPermDesc]         = useState('');
  const [permSaving, setPermSaving]     = useState(false);
  const [deletePermTarget, setDeletePermTarget] = useState<ApiPerm | null>(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchUsers = async () => {
    setUsersLoading(true);
    const res = await api.get<ApiUser[]>('/users');
    if (res.success) setUsers(res.data ?? []);
    else toast.error('Erreur lors du chargement des utilisateurs');
    setUsersLoading(false);
  };

  const fetchRoles = async () => {
    setRolesLoading(true);
    const res = await api.get<ApiRole[]>('/roles');
    if (res.success) setRoles(res.data ?? []);
    else toast.error('Erreur lors du chargement des rôles');
    setRolesLoading(false);
  };

  const fetchPerms = async () => {
    setPermsLoading(true);
    const res = await api.get<ApiPerm[]>('/permissions');
    if (res.success) setPerms(res.data ?? []);
    else toast.error('Erreur lors du chargement des permissions');
    setPermsLoading(false);
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchPerms();
  }, []);

  const handleRefresh = () => {
    if (activeTab === 'users') fetchUsers();
    else if (activeTab === 'roles') fetchRoles();
    else fetchPerms();
  };

  const isCurrentTabLoading =
    (activeTab === 'users' && usersLoading) ||
    (activeTab === 'roles' && rolesLoading) ||
    (activeTab === 'permissions' && permsLoading);

  // ── User CRUD ─────────────────────────────────────────────────────────────
  const handleDeleteUser = async () => {
    if (!deleteUserTarget) return;
    setDeletingUser(true);
    const res = await api.delete(`/users/${deleteUserTarget.id}`);
    setDeletingUser(false);
    if (res.success) {
      toast.success('Utilisateur supprimé');
      setDeleteUserTarget(null);
      fetchUsers();
    } else {
      toast.error(res.message ?? 'Erreur');
    }
  };

  // ── Role CRUD ─────────────────────────────────────────────────────────────
  const openRoleForm = (role: ApiRole | null) => {
    setRoleEditData(role);
    setRoleName(role?.name ?? '');
    setRoleFormOpen(true);
  };

  const handleSaveRole = async () => {
    if (!roleName.trim()) { toast.error('Le nom du rôle est requis'); return; }
    setRoleSaving(true);
    const res = roleEditData
      ? await api.patch<ApiRole>(`/roles/${roleEditData.id}`, { name: roleName.trim() })
      : await api.post<ApiRole>('/roles', { name: roleName.trim() });
    setRoleSaving(false);
    if (res.success) {
      toast.success(roleEditData ? 'Rôle mis à jour' : 'Rôle créé');
      setRoleFormOpen(false);
      fetchRoles();
    } else {
      toast.error(res.message ?? 'Erreur');
    }
  };

  const handleDeleteRole = async () => {
    if (!deleteRoleTarget) return;
    const res = await api.delete(`/roles/${deleteRoleTarget.id}`);
    if (res.success) {
      toast.success('Rôle supprimé');
      setDeleteRoleTarget(null);
      fetchRoles();
    } else {
      toast.error(res.message ?? 'Erreur');
    }
  };

  // ── Permission CRUD ───────────────────────────────────────────────────────
  const openPermForm = (perm: ApiPerm | null) => {
    setPermEditData(perm);
    setPermName(perm?.name ?? '');
    setPermDesc(perm?.description ?? '');
    setPermFormOpen(true);
  };

  const handleSavePerm = async () => {
    if (!permName.trim()) { toast.error('Le nom de la permission est requis'); return; }
    setPermSaving(true);
    const payload = { name: permName.trim(), description: permDesc.trim() || null };
    const res = permEditData
      ? await api.patch<ApiPerm>(`/permissions/${permEditData.id}`, payload)
      : await api.post<ApiPerm>('/permissions', payload);
    setPermSaving(false);
    if (res.success) {
      toast.success(permEditData ? 'Permission mise à jour' : 'Permission créée');
      setPermFormOpen(false);
      fetchPerms();
    } else {
      toast.error(res.message ?? 'Erreur');
    }
  };

  const handleDeletePerm = async () => {
    if (!deletePermTarget) return;
    const res = await api.delete(`/permissions/${deletePermTarget.id}`);
    if (res.success) {
      toast.success('Permission supprimée');
      setDeletePermTarget(null);
      fetchPerms();
    } else {
      toast.error(res.message ?? 'Erreur');
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  const getCreateButton = () => {
    if (activeTab === 'users')
      return <Button leftIcon={<UserPlus size={18} />} onClick={() => { setUserEditData(null); setUserFormOpen(true); }}>Nouvel utilisateur</Button>;
    if (activeTab === 'roles')
      return <Button leftIcon={<ShieldPlus size={18} />} onClick={() => openRoleForm(null)}>Nouveau rôle</Button>;
    return <Button leftIcon={<ShieldCheck size={18} />} onClick={() => openPermForm(null)}>Nouvelle permission</Button>;
  };

  return (
    <PageWrapper
      title="Gestion des utilisateurs"
      subtitle="Utilisateurs, rôles et permissions"
      actions={
        <div className={shared.headerActions}>
          <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isCurrentTabLoading}>
            <RefreshCw size={16} className={isCurrentTabLoading ? 'animate-spin' : ''} />
          </Button>
          {getCreateButton()}
        </div>
      }
    >
      <Card>
        <CardBody>
          <div className={styles.tabsContainer}>
            <div className={styles.tabsList}>
              {([
                { key: 'users', label: 'Utilisateurs', icon: <Users size={18} /> },
                { key: 'roles', label: 'Rôles', icon: <Shield size={18} /> },
                { key: 'permissions', label: 'Permissions', icon: <ShieldCheck size={18} /> },
              ] as { key: TabType; label: string; icon: React.ReactNode }[]).map((t) => (
                <button
                  key={t.key}
                  className={`${styles.tabItem} ${activeTab === t.key ? styles.active : ''}`}
                  onClick={() => setActiveTab(t.key)}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.tabContent}>
            {/* ── USERS ── */}
            {activeTab === 'users' && (
              <UsersTable
                users={users}
                isLoading={usersLoading}
                onEdit={(u) => { setUserEditData(u); setUserFormOpen(true); }}
                onDelete={(u) => setDeleteUserTarget(u)}
                onCreate={() => { setUserEditData(null); setUserFormOpen(true); }}
              />
            )}

            {/* ── ROLES ── */}
            {activeTab === 'roles' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '0.5rem 1rem', textAlign: 'left' }}>Nom</th>
                    <th style={{ padding: '0.5rem 1rem', textAlign: 'left' }}>Système</th>
                    <th style={{ padding: '0.5rem 1rem', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((r) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.5rem 1rem' }}>{r.name}</td>
                      <td style={{ padding: '0.5rem 1rem' }}>{r.is_system ? 'Oui' : 'Non'}</td>
                      <td style={{ padding: '0.5rem 1rem', textAlign: 'center' }}>
                        <div className={shared.actionsCell}>
                          <button className={shared.actionBtn} onClick={() => openRoleForm(r)}>Modifier</button>
                          <button className={`${shared.actionBtn} ${shared.actionBtnDanger}`} onClick={() => setDeleteRoleTarget(r)} disabled={r.is_system}>Supprimer</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!rolesLoading && roles.length === 0 && (
                    <tr><td colSpan={3} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Aucun rôle</td></tr>
                  )}
                </tbody>
              </table>
            )}

            {/* ── PERMISSIONS ── */}
            {activeTab === 'permissions' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '0.5rem 1rem', textAlign: 'left' }}>Nom</th>
                    <th style={{ padding: '0.5rem 1rem', textAlign: 'left' }}>Description</th>
                    <th style={{ padding: '0.5rem 1rem', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {perms.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.5rem 1rem' }}><code style={{ fontSize: '0.8rem' }}>{p.name}</code></td>
                      <td style={{ padding: '0.5rem 1rem', color: 'var(--text-muted)' }}>{p.description || '-'}</td>
                      <td style={{ padding: '0.5rem 1rem', textAlign: 'center' }}>
                        <div className={shared.actionsCell}>
                          <button className={shared.actionBtn} onClick={() => openPermForm(p)}>Modifier</button>
                          <button className={`${shared.actionBtn} ${shared.actionBtnDanger}`} onClick={() => setDeletePermTarget(p)}>Supprimer</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!permsLoading && perms.length === 0 && (
                    <tr><td colSpan={3} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Aucune permission</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </CardBody>
      </Card>

      {/* ── User form modal ── */}
      <UserFormModal
        isOpen={userFormOpen}
        onClose={() => setUserFormOpen(false)}
        onSuccess={() => { fetchUsers(); }}
        editData={userEditData}
      />

      {/* ── Delete user ── */}
      <Modal isOpen={!!deleteUserTarget} onClose={() => setDeleteUserTarget(null)} title="Confirmer la suppression" size="sm"
        footer={
          <div className={shared.modalFooter}>
            <Button variant="outline" size="sm" onClick={() => setDeleteUserTarget(null)} disabled={deletingUser}>Annuler</Button>
            <Button variant="danger" size="sm" onClick={handleDeleteUser} isLoading={deletingUser}><Trash2 size={16} />Supprimer</Button>
          </div>
        }
      >
        <div className={shared.deleteWarning}>
          <Trash2 size={24} />
          <p>Supprimer l'utilisateur <strong>{deleteUserTarget?.username}</strong> ?</p>
          <p className={shared.warningText}>Cette action est irréversible.</p>
        </div>
      </Modal>

      {/* ── Role form ── */}
      <Modal isOpen={roleFormOpen} onClose={() => setRoleFormOpen(false)} title={roleEditData ? 'Modifier le rôle' : 'Nouveau rôle'} size="sm"
        footer={
          <div className={shared.modalFooter}>
            <Button variant="outline" size="sm" onClick={() => setRoleFormOpen(false)}>Annuler</Button>
            <Button size="sm" onClick={handleSaveRole} isLoading={roleSaving}><Save size={16} />{roleSaving ? 'Enregistrement...' : 'Enregistrer'}</Button>
          </div>
        }
      >
        <div className={shared.form}>
          <FormInput label="Nom du rôle" required value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder="Ex: Administrateur" leftIcon={<Shield size={16} />} />
        </div>
      </Modal>

      {/* ── Delete role ── */}
      <Modal isOpen={!!deleteRoleTarget} onClose={() => setDeleteRoleTarget(null)} title="Confirmer la suppression" size="sm"
        footer={
          <div className={shared.modalFooter}>
            <Button variant="outline" size="sm" onClick={() => setDeleteRoleTarget(null)}>Annuler</Button>
            <Button variant="danger" size="sm" onClick={handleDeleteRole}><Trash2 size={16} />Supprimer</Button>
          </div>
        }
      >
        <div className={shared.deleteWarning}>
          <Trash2 size={24} />
          <p>Supprimer le rôle <strong>{deleteRoleTarget?.name}</strong> ?</p>
        </div>
      </Modal>

      {/* ── Permission form ── */}
      <Modal isOpen={permFormOpen} onClose={() => setPermFormOpen(false)} title={permEditData ? 'Modifier la permission' : 'Nouvelle permission'} size="sm"
        footer={
          <div className={shared.modalFooter}>
            <Button variant="outline" size="sm" onClick={() => setPermFormOpen(false)}>Annuler</Button>
            <Button size="sm" onClick={handleSavePerm} isLoading={permSaving}><Save size={16} />{permSaving ? 'Enregistrement...' : 'Enregistrer'}</Button>
          </div>
        }
      >
        <div className={shared.form}>
          <FormInput label="Nom" required value={permName} onChange={(e) => setPermName(e.target.value)} placeholder="ex: equipment:read" leftIcon={<ShieldCheck size={16} />} />
          <FormTextarea label="Description" value={permDesc} onChange={(e) => setPermDesc(e.target.value)} placeholder="Description de la permission" rows={2} hint="Optionnel" />
        </div>
      </Modal>

      {/* ── Delete permission ── */}
      <Modal isOpen={!!deletePermTarget} onClose={() => setDeletePermTarget(null)} title="Confirmer la suppression" size="sm"
        footer={
          <div className={shared.modalFooter}>
            <Button variant="outline" size="sm" onClick={() => setDeletePermTarget(null)}>Annuler</Button>
            <Button variant="danger" size="sm" onClick={handleDeletePerm}><Trash2 size={16} />Supprimer</Button>
          </div>
        }
      >
        <div className={shared.deleteWarning}>
          <Trash2 size={24} />
          <p>Supprimer la permission <strong>{deletePermTarget?.name}</strong> ?</p>
        </div>
      </Modal>
    </PageWrapper>
  );
}
