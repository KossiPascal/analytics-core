import { useState, useEffect } from 'react';
import { PageWrapper } from '@components/layout';
import { Card, CardBody, Button, Modal, StatusBadge, CrudBadge, PermissionBadge, RoleBadge } from '@components/ui';
import { UserModal } from './components/UserModal';
import { useUsers } from '@/contexts/OLD/useUsers';
import { useNotification } from '@/contexts/OLD/useNotification';
import { AuthApi, PermissionsApi, OrganizationsApi } from '@/services/OLD/old/api.service';
import {
  Users,
  Shield,
  ShieldCheck,
  UserPlus,
  ShieldPlus,
  Edit2,
  Trash2,
  RefreshCw,
  Save,
} from 'lucide-react';
import type { User } from '@/models/OLD/old/auth.types';
import styles from './UsersPage.module.css';
import shared from '@components/ui/styles/shared.module.css';

// Types
interface Role {
  id: string;
  name: string;
  organization?: string;
  authorizations: string[];
  isDeleted: boolean;
}

interface Permission {
  id: string;
  name: string;
  description?: string;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Organization {
  id: string;
  name: string;
}

type TabType = 'users' | 'roles' | 'permissions';

const AVAILABLE_PERMISSIONS = [
  { value: 'admin', label: 'Administration' },
  { value: 'view_users', label: 'Voir les utilisateurs' },
  { value: 'manage_users', label: 'Gérer les utilisateurs' },
  { value: 'view_reports', label: 'Voir les rapports' },
  { value: 'validate_reports', label: 'Valider les rapports' },
  { value: 'manage_data', label: 'Gérer les données' },
  { value: 'validate_data', label: 'Valider les données' },
  { value: 'view_dashboards', label: 'Voir les tableaux de bord' },
  { value: 'view_maps', label: 'Voir les cartes' },
  { value: 'send_to_dhis2', label: 'Envoyer vers DHIS2' },
];

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState<TabType>('users');

  // Users state
  const {
    users,
    roles: userRoles,
    orgUnits,
    status,
    selectedUser,
    isUserModalOpen,
    isDeleteUserModalOpen,
    initializeData,
    fetchUsers,
    saveUser,
    deleteUser,
    openUserModal,
    closeUserModal,
    openDeleteUserModal,
    closeDeleteUserModal,
    getUserRoleNames,
  } = useUsers();

  // Roles state
  const [roles, setRoles] = useState<Role[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isRolesLoading, setIsRolesLoading] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isDeleteRoleModalOpen, setIsDeleteRoleModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isRoleEditMode, setIsRoleEditMode] = useState(false);
  const [roleName, setRoleName] = useState('');
  const [roleOrganization, setRoleOrganization] = useState('');
  const [selectedRolePermissions, setSelectedRolePermissions] = useState<string[]>([]);
  const [isRoleSaving, setIsRoleSaving] = useState(false);

  // Permissions state
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isPermissionsLoading, setIsPermissionsLoading] = useState(false);
  const [isPermModalOpen, setIsPermModalOpen] = useState(false);
  const [isDeletePermModalOpen, setIsDeletePermModalOpen] = useState(false);
  const [selectedPerm, setSelectedPerm] = useState<Permission | null>(null);
  const [isPermEditMode, setIsPermEditMode] = useState(false);
  const [permissionName, setPermissionName] = useState('');
  const [permissionDescription, setPermissionDescription] = useState('');
  const [canCreate, setCanCreate] = useState(false);
  const [canRead, setCanRead] = useState(true);
  const [canUpdate, setCanUpdate] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [isPermSaving, setIsPermSaving] = useState(false);

  const { showError, showSuccess } = useNotification();

  const isUsersLoading = status.users === 'loading';
  const isUserSaving = status.saving === 'loading';
  const isUserDeleting = status.deleting === 'loading';

  // Fetch functions
  const fetchRoles = async () => {
    setIsRolesLoading(true);
    try {
      const response = await AuthApi.getRoles();
      if (response?.status === 200) {
        setRoles((response.data as Role[]) || []);
      }
    } catch {
      showError('Erreur lors du chargement des rôles');
    } finally {
      setIsRolesLoading(false);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const response = await OrganizationsApi.getOrganizations();
      if (response?.status === 200) {
        setOrganizations((response.data as Organization[]) || []);
      }
    } catch {
      console.error('Erreur lors du chargement des organisations');
    }
  };

  const fetchPermissions = async () => {
    setIsPermissionsLoading(true);
    try {
      const response = await PermissionsApi.getPermissions();
      if (response?.status === 200) {
        setPermissions((response.data as Permission[]) || []);
      }
    } catch {
      showError('Erreur lors du chargement des permissions');
    } finally {
      setIsPermissionsLoading(false);
    }
  };

  useEffect(() => {
    initializeData();
    fetchRoles();
    fetchOrganizations();
    fetchPermissions();
  }, []);

  // Refresh based on active tab
  const handleRefresh = () => {
    if (activeTab === 'users') fetchUsers();
    else if (activeTab === 'roles') fetchRoles();
    else if (activeTab === 'permissions') fetchPermissions();
  };

  const isCurrentTabLoading =
    (activeTab === 'users' && isUsersLoading) ||
    (activeTab === 'roles' && isRolesLoading) ||
    (activeTab === 'permissions' && isPermissionsLoading);

  // User handlers
  const handleDeleteUser = async () => {
    if (selectedUser) {
      await deleteUser(selectedUser);
    }
  };

  // Role handlers
  const toggleRolePermission = (value: string) => {
    setSelectedRolePermissions((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  const handleCreateRole = () => {
    setIsRoleEditMode(false);
    setSelectedRole(null);
    setRoleName('');
    setRoleOrganization('');
    setSelectedRolePermissions([]);
    setIsRoleModalOpen(true);
  };

  const handleEditRole = (role: Role) => {
    setIsRoleEditMode(true);
    setSelectedRole(role);
    setRoleName(role.name);
    setRoleOrganization(role.organization || '');
    setSelectedRolePermissions(role.authorizations || []);
    setIsRoleModalOpen(true);
  };

  const handleDeleteRoleClick = (role: Role) => {
    setSelectedRole(role);
    setIsDeleteRoleModalOpen(true);
  };

  const handleSaveRole = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!roleName.trim()) {
      showError('Le nom du rôle est requis.');
      return;
    }

    setIsRoleSaving(true);
    try {
      if (isRoleEditMode && selectedRole) {
        const response = await AuthApi.updateRole({
          id: selectedRole.id,
          name: roleName,
          organization: roleOrganization,
          authorizations: selectedRolePermissions,
        });
        if (response?.status === 200) {
          showSuccess('Rôle mis à jour avec succès');
          setIsRoleModalOpen(false);
          fetchRoles();
        } else {
          showError('Erreur lors de la mise à jour');
        }
      } else {
        const response = await AuthApi.createRole({
          name: roleName,
          organization: roleOrganization,
          authorizations: selectedRolePermissions,
        });
        if (response?.status === 200) {
          showSuccess('Rôle créé avec succès');
          setIsRoleModalOpen(false);
          fetchRoles();
        } else {
          showError('Erreur lors de la création');
        }
      }
    } catch {
      showError('Erreur lors de la sauvegarde');
    } finally {
      setIsRoleSaving(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!selectedRole) return;

    try {
      const response = await AuthApi.deleteRole({ id: selectedRole.id });
      if (response?.status === 200) {
        showSuccess('Rôle supprimé avec succès');
        setIsDeleteRoleModalOpen(false);
        setSelectedRole(null);
        fetchRoles();
      } else {
        showError('Erreur lors de la suppression');
      }
    } catch {
      showError('Erreur lors de la suppression');
    }
  };

  // Permission handlers
  const resetPermForm = () => {
    setPermissionName('');
    setPermissionDescription('');
    setCanCreate(false);
    setCanRead(true);
    setCanUpdate(false);
    setCanDelete(false);
  };

  const handleCreatePerm = () => {
    setIsPermEditMode(false);
    setSelectedPerm(null);
    resetPermForm();
    setIsPermModalOpen(true);
  };

  const handleEditPerm = (perm: Permission) => {
    setIsPermEditMode(true);
    setSelectedPerm(perm);
    setPermissionName(perm.name);
    setPermissionDescription(perm.description || '');
    setCanCreate(perm.canCreate);
    setCanRead(perm.canRead);
    setCanUpdate(perm.canUpdate);
    setCanDelete(perm.canDelete);
    setIsPermModalOpen(true);
  };

  const handleDeletePermClick = (perm: Permission) => {
    setSelectedPerm(perm);
    setIsDeletePermModalOpen(true);
  };

  const handleSavePerm = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!permissionName.trim()) {
      showError('Le nom de la permission est requis.');
      return;
    }

    setIsPermSaving(true);
    try {
      if (isPermEditMode && selectedPerm) {
        const response = await PermissionsApi.updatePermission({
          id: selectedPerm.id,
          name: permissionName,
          description: permissionDescription,
          canCreate,
          canRead,
          canUpdate,
          canDelete,
        });
        if (response?.status === 200) {
          showSuccess('Permission mise à jour avec succès');
          setIsPermModalOpen(false);
          fetchPermissions();
        } else {
          showError('Erreur lors de la mise à jour');
        }
      } else {
        const response = await PermissionsApi.createPermission({
          name: permissionName,
          description: permissionDescription,
          canCreate,
          canRead,
          canUpdate,
          canDelete,
        });
        if (response?.status === 200) {
          showSuccess('Permission créée avec succès');
          setIsPermModalOpen(false);
          fetchPermissions();
        } else {
          showError('Erreur lors de la création');
        }
      }
    } catch {
      showError('Erreur lors de la sauvegarde');
    } finally {
      setIsPermSaving(false);
    }
  };

  const handleDeletePerm = async () => {
    if (!selectedPerm) return;

    try {
      const response = await PermissionsApi.deletePermission(selectedPerm.id);
      if (response?.status === 200) {
        showSuccess('Permission supprimée avec succès');
        setIsDeletePermModalOpen(false);
        setSelectedPerm(null);
        fetchPermissions();
      } else {
        showError('Erreur lors de la suppression');
      }
    } catch {
      showError('Erreur lors de la suppression');
    }
  };

  const renderCrudBadges = (perm: Permission) => {
    const badges = [];
    if (perm.canCreate) badges.push({ label: 'C', title: 'Créer' });
    if (perm.canRead) badges.push({ label: 'R', title: 'Lire' });
    if (perm.canUpdate) badges.push({ label: 'U', title: 'Modifier' });
    if (perm.canDelete) badges.push({ label: 'D', title: 'Supprimer' });

    return badges.map((b) => (
      <CrudBadge key={b.label} label={b.label} title={b.title} />
    ));
  };

  // Get create button based on active tab
  const getCreateButton = () => {
    switch (activeTab) {
      case 'users':
        return (
          <Button leftIcon={<UserPlus size={18} />} onClick={() => openUserModal(null)}>
            Nouvel utilisateur
          </Button>
        );
      case 'roles':
        return (
          <Button leftIcon={<ShieldPlus size={18} />} onClick={handleCreateRole}>
            Nouveau rôle
          </Button>
        );
      case 'permissions':
        return (
          <Button leftIcon={<ShieldCheck size={18} />} onClick={handleCreatePerm}>
            Nouvelle permission
          </Button>
        );
    }
  };

  // Render Users Tab
  const renderUsersTab = () => (
    <>
      {isUsersLoading ? (
        <div className={shared.loading}>
          <RefreshCw size={24} className="animate-spin" />
          <p>Chargement...</p>
        </div>
      ) : users.length === 0 ? (
        <div className={shared.emptyState}>
          <UserPlus size={48} />
          <p>Aucun utilisateur</p>
          <Button variant="primary" onClick={() => openUserModal(null)}>
            Créer un utilisateur
          </Button>
        </div>
      ) : (
        <div className={shared.tableContainer}>
          <table className={shared.table}>
            <thead>
              <tr>
                <th>Nom d'utilisateur</th>
                <th>Nom complet</th>
                <th>Email</th>
                <th>Rôles</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user: User) => (
                <tr key={user.id}>
                  <td>{user.username}</td>
                  <td>{user.fullname || '-'}</td>
                  <td>{user.email || '-'}</td>
                  <td>
                    <RoleBadge>{getUserRoleNames(user)}</RoleBadge>
                  </td>
                  <td>
                    <StatusBadge isActive={user.isActive} />
                  </td>
                  <td>
                    <div className={shared.actionsCell}>
                      <button
                        className={shared.actionBtn}
                        onClick={() => openUserModal(user)}
                        title="Modifier"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className={`${shared.actionBtn} ${shared.actionBtnDanger}`}
                        onClick={() => openDeleteUserModal(user)}
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );

  // Render Roles Tab
  const renderRolesTab = () => (
    <>
      {isRolesLoading ? (
        <div className={shared.loading}>
          <RefreshCw size={24} className="animate-spin" />
          <p>Chargement...</p>
        </div>
      ) : roles.length === 0 ? (
        <div className={shared.emptyState}>
          <ShieldPlus size={48} />
          <p>Aucun rôle</p>
          <Button variant="primary" onClick={handleCreateRole}>
            Créer un rôle
          </Button>
        </div>
      ) : (
        <div className={shared.tableContainer}>
          <table className={shared.table}>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Organisation</th>
                <th>Permissions</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role.id}>
                  <td>{role.name}</td>
                  <td>{role.organization || '-'}</td>
                  <td>
                    <div className={shared.list}>
                      {role.authorizations?.slice(0, 3).map((perm) => (
                        <PermissionBadge key={perm}>
                          {AVAILABLE_PERMISSIONS.find((p) => p.value === perm)?.label || perm}
                        </PermissionBadge>
                      ))}
                      {role.authorizations?.length > 3 && (
                        <PermissionBadge>+{role.authorizations.length - 3}</PermissionBadge>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className={shared.actionsCell}>
                      <button
                        className={shared.actionBtn}
                        onClick={() => handleEditRole(role)}
                        title="Modifier"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className={`${shared.actionBtn} ${shared.actionBtnDanger}`}
                        onClick={() => handleDeleteRoleClick(role)}
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );

  // Render Permissions Tab
  const renderPermissionsTab = () => (
    <>
      {isPermissionsLoading ? (
        <div className={shared.loading}>
          <RefreshCw size={24} className="animate-spin" />
          <p>Chargement...</p>
        </div>
      ) : permissions.length === 0 ? (
        <div className={shared.emptyState}>
          <ShieldCheck size={48} />
          <p>Aucune permission</p>
          <Button variant="primary" onClick={handleCreatePerm}>
            Créer une permission
          </Button>
        </div>
      ) : (
        <div className={shared.tableContainer}>
          <table className={shared.table}>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Description</th>
                <th>CRUD</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {permissions.map((perm) => (
                <tr key={perm.id}>
                  <td>{perm.name}</td>
                  <td>{perm.description || '-'}</td>
                  <td>
                    <div className={shared.list}>{renderCrudBadges(perm)}</div>
                  </td>
                  <td>
                    <div className={shared.actionsCell}>
                      <button
                        className={shared.actionBtn}
                        onClick={() => handleEditPerm(perm)}
                        title="Modifier"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className={`${shared.actionBtn} ${shared.actionBtnDanger}`}
                        onClick={() => handleDeletePermClick(perm)}
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );

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
          {/* Tabs */}
          <div className={styles.tabsContainer}>
            <div className={styles.tabsList}>
              <button
                className={`${styles.tabItem} ${activeTab === 'users' ? styles.active : ''}`}
                onClick={() => setActiveTab('users')}
              >
                <Users size={18} />
                Utilisateurs
              </button>
              <button
                className={`${styles.tabItem} ${activeTab === 'roles' ? styles.active : ''}`}
                onClick={() => setActiveTab('roles')}
              >
                <Shield size={18} />
                Rôles
              </button>
              <button
                className={`${styles.tabItem} ${activeTab === 'permissions' ? styles.active : ''}`}
                onClick={() => setActiveTab('permissions')}
              >
                <ShieldCheck size={18} />
                Permissions
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className={styles.tabContent}>
            {activeTab === 'users' && renderUsersTab()}
            {activeTab === 'roles' && renderRolesTab()}
            {activeTab === 'permissions' && renderPermissionsTab()}
          </div>
        </CardBody>
      </Card>

      {/* ==================== USER MODALS ==================== */}
      <UserModal
        isOpen={isUserModalOpen}
        onClose={closeUserModal}
        onSave={saveUser}
        user={selectedUser}
        roles={userRoles}
        orgUnits={orgUnits}
        isLoading={isUserSaving}
      />

      <Modal
        isOpen={isDeleteUserModalOpen}
        onClose={closeDeleteUserModal}
        title="Confirmer la suppression"
        size="sm"
        footer={
          <div className={shared.modalFooter}>
            <Button variant="outline" size="sm" onClick={closeDeleteUserModal} disabled={isUserDeleting}>
              Annuler
            </Button>
            <Button variant="danger" size="sm" onClick={handleDeleteUser} isLoading={isUserDeleting}>
              <Trash2 size={16} />
              Supprimer
            </Button>
          </div>
        }
      >
        <div className={shared.deleteWarning}>
          <Trash2 size={24} />
          <p>
            Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{selectedUser?.username}</strong> ?
          </p>
          <p className={shared.warningText}>Cette action est irréversible.</p>
        </div>
      </Modal>

      {/* ==================== ROLE MODALS ==================== */}
      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        title={isRoleEditMode ? 'Modifier le rôle' : 'Nouveau rôle'}
        size="md"
        footer={
          <div className={shared.modalFooter}>
            <Button variant="outline" size="sm" onClick={() => setIsRoleModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveRole} disabled={isRoleSaving}>
              <Save size={16} />
              {isRoleSaving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        }
      >
        <form className={shared.form} onSubmit={handleSaveRole}>
          <div className={shared.formGroup}>
            <label className={shared.formLabel} htmlFor="roleName">
              Nom du rôle
            </label>
            <input
              id="roleName"
              className={shared.formInput}
              placeholder="Ex: Administrateur"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className={shared.formGroup}>
            <label className={shared.formLabel} htmlFor="organization">
              Organisation
            </label>
            <select
              id="organization"
              className={shared.formInput}
              value={roleOrganization}
              onChange={(e) => setRoleOrganization(e.target.value)}
            >
              <option value="">Sélectionner une organisation</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.name}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          <div className={shared.formGroup}>
            <label className={shared.formLabel}>Permissions</label>
            <div className={shared.checkboxGrid}>
              {AVAILABLE_PERMISSIONS.map((perm) => (
                <label key={perm.value} className={shared.checkbox}>
                  <input
                    type="checkbox"
                    checked={selectedRolePermissions.includes(perm.value)}
                    onChange={() => toggleRolePermission(perm.value)}
                  />
                  <span>{perm.label}</span>
                </label>
              ))}
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isDeleteRoleModalOpen}
        onClose={() => setIsDeleteRoleModalOpen(false)}
        title="Confirmer la suppression"
        size="sm"
        footer={
          <div className={shared.modalFooter}>
            <Button variant="outline" size="sm" onClick={() => setIsDeleteRoleModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="danger" size="sm" onClick={handleDeleteRole}>
              <Trash2 size={16} />
              Supprimer
            </Button>
          </div>
        }
      >
        <div className={shared.deleteWarning}>
          <Trash2 size={24} />
          <p>
            Êtes-vous sûr de vouloir supprimer le rôle <strong>{selectedRole?.name}</strong> ?
          </p>
          <p className={shared.warningText}>Cette action est irréversible.</p>
        </div>
      </Modal>

      {/* ==================== PERMISSION MODALS ==================== */}
      <Modal
        isOpen={isPermModalOpen}
        onClose={() => setIsPermModalOpen(false)}
        title={isPermEditMode ? 'Modifier la permission' : 'Nouvelle permission'}
        size="sm"
        footer={
          <div className={shared.modalFooter}>
            <Button variant="outline" size="sm" onClick={() => setIsPermModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="primary" size="sm" onClick={handleSavePerm} disabled={isPermSaving}>
              <Save size={16} />
              {isPermSaving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        }
      >
        <form className={shared.form} onSubmit={handleSavePerm}>
          <div className={shared.formGroup}>
            <label className={shared.formLabel} htmlFor="permissionName">
              Nom de la permission
            </label>
            <input
              id="permissionName"
              className={shared.formInput}
              placeholder="Ex: manage_users"
              value={permissionName}
              onChange={(e) => setPermissionName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className={shared.formGroup}>
            <label className={shared.formLabel} htmlFor="permissionDescription">
              Description (optionnel)
            </label>
            <textarea
              id="permissionDescription"
              className={shared.formInput}
              placeholder="Description de la permission"
              value={permissionDescription}
              onChange={(e) => setPermissionDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className={shared.formGroup}>
            <label className={shared.formLabel}>Accès (CRUD)</label>
            <div className={shared.checkboxGrid}>
              <label className={shared.checkbox}>
                <input
                  type="checkbox"
                  checked={canCreate}
                  onChange={(e) => setCanCreate(e.target.checked)}
                />
                <span>Créer</span>
              </label>
              <label className={shared.checkbox}>
                <input
                  type="checkbox"
                  checked={canRead}
                  onChange={(e) => setCanRead(e.target.checked)}
                />
                <span>Lire</span>
              </label>
              <label className={shared.checkbox}>
                <input
                  type="checkbox"
                  checked={canUpdate}
                  onChange={(e) => setCanUpdate(e.target.checked)}
                />
                <span>Mettre à jour</span>
              </label>
              <label className={shared.checkbox}>
                <input
                  type="checkbox"
                  checked={canDelete}
                  onChange={(e) => setCanDelete(e.target.checked)}
                />
                <span>Supprimer</span>
              </label>
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isDeletePermModalOpen}
        onClose={() => setIsDeletePermModalOpen(false)}
        title="Confirmer la suppression"
        size="sm"
        footer={
          <div className={shared.modalFooter}>
            <Button variant="outline" size="sm" onClick={() => setIsDeletePermModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="danger" size="sm" onClick={handleDeletePerm}>
              <Trash2 size={16} />
              Supprimer
            </Button>
          </div>
        }
      >
        <div className={shared.deleteWarning}>
          <Trash2 size={24} />
          <p>
            Êtes-vous sûr de vouloir supprimer la permission <strong>{selectedPerm?.name}</strong> ?
          </p>
          <p className={shared.warningText}>Cette action est irréversible.</p>
        </div>
      </Modal>
    </PageWrapper>
  );
}
