import { useState, useEffect } from 'react';
import { PageWrapper } from '@components/layout';
import { Card, CardBody, CardHeader, Button } from '@components/ui';
import { Modal } from '@components/ui/Modal/Modal';
import { useNotification } from '@/hooks/useNotification';
import { AuthApi, OrganizationsApi } from '@/services/api/api.service';
import { ShieldPlus, Save, Edit2, Trash2, RefreshCw } from 'lucide-react';
import styles from './RolesPage.module.css';

interface Role {
  id: string;
  name: string;
  organization?: string;
  authorizations: string[];
  isDeleted: boolean;
}

interface Organization {
  id: string;
  name: string;
}

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

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [roleName, setRoleName] = useState('');
  const [organization, setOrganization] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const { showError, showSuccess } = useNotification();

  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const response = await AuthApi.getRoles();
      if (response?.status === 200) {
        setRoles((response.data as Role[]) || []);
      }
    } catch (error) {
      showError('Erreur lors du chargement des rôles');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const response = await OrganizationsApi.getOrganizations();
      if (response?.status === 200) {
        setOrganizations((response.data as Organization[]) || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des organisations');
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchOrganizations();
  }, []);

  const togglePermission = (value: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  const handleCreate = () => {
    setIsEditMode(false);
    setSelectedRole(null);
    setRoleName('');
    setOrganization('');
    setSelectedPermissions([]);
    setIsModalOpen(true);
  };

  const handleEdit = (role: Role) => {
    setIsEditMode(true);
    setSelectedRole(role);
    setRoleName(role.name);
    setOrganization(role.organization || '');
    setSelectedPermissions(role.authorizations || []);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (role: Role) => {
    setSelectedRole(role);
    setIsDeleteModalOpen(true);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!roleName.trim()) {
      showError('Le nom du rôle est requis.');
      return;
    }

    setIsSaving(true);
    try {
      if (isEditMode && selectedRole) {
        const response = await AuthApi.updateRole({
          id: selectedRole.id,
          name: roleName,
          organization,
          authorizations: selectedPermissions,
        });
        if (response?.status === 200) {
          showSuccess('Rôle mis à jour avec succès');
          setIsModalOpen(false);
          fetchRoles();
        } else {
          showError('Erreur lors de la mise à jour');
        }
      } else {
        const response = await AuthApi.createRole({
          name: roleName,
          organization,
          authorizations: selectedPermissions,
        });
        if (response?.status === 200) {
          showSuccess('Rôle créé avec succès');
          setIsModalOpen(false);
          fetchRoles();
        } else {
          showError('Erreur lors de la création');
        }
      }
    } catch (error) {
      showError('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRole) return;

    try {
      const response = await AuthApi.deleteRole({ id: selectedRole.id });
      if (response?.status === 200) {
        showSuccess('Rôle supprimé avec succès');
        setIsDeleteModalOpen(false);
        setSelectedRole(null);
        fetchRoles();
      } else {
        showError('Erreur lors de la suppression');
      }
    } catch (error) {
      showError('Erreur lors de la suppression');
    }
  };

  return (
    <PageWrapper
      title="Gestion des rôles"
      subtitle="Associer des rôles aux organisations et permissions"
      actions={
        <div className={styles.headerActions}>
          <Button variant="ghost" size="sm" onClick={fetchRoles} disabled={isLoading}>
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </Button>
          <Button leftIcon={<ShieldPlus size={18} />} onClick={handleCreate}>
            Nouveau rôle
          </Button>
        </div>
      }
    >
      <Card>
        <CardHeader title="Liste des rôles" />
        <CardBody>
          {isLoading ? (
            <div className={styles.loading}>
              <RefreshCw size={24} className="animate-spin" />
              <p>Chargement...</p>
            </div>
          ) : roles.length === 0 ? (
            <div className={styles.emptyState}>
              <ShieldPlus size={48} />
              <p>Aucun rôle</p>
              <Button variant="primary" onClick={handleCreate}>
                Créer un rôle
              </Button>
            </div>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
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
                        <div className={styles.permissionsList}>
                          {role.authorizations?.slice(0, 3).map((perm) => (
                            <span key={perm} className={styles.permBadge}>
                              {AVAILABLE_PERMISSIONS.find(p => p.value === perm)?.label || perm}
                            </span>
                          ))}
                          {role.authorizations?.length > 3 && (
                            <span className={styles.permBadge}>+{role.authorizations.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className={styles.actionsCell}>
                          <button
                            className={styles.actionBtn}
                            onClick={() => handleEdit(role)}
                            title="Modifier"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                            onClick={() => handleDeleteClick(role)}
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
        </CardBody>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? 'Modifier le rôle' : 'Nouveau rôle'}
        size="md"
        footer={
          <div className={styles.modalFooter}>
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave} disabled={isSaving}>
              <Save size={16} />
              {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        }
      >
        <form className={styles.form} onSubmit={handleSave}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="roleName">
              Nom du rôle
            </label>
            <input
              id="roleName"
              className={styles.formInput}
              placeholder="Ex: Administrateur"
              value={roleName}
              onChange={(event) => setRoleName(event.target.value)}
              required
              autoFocus
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="organization">
              Organisation
            </label>
            <select
              id="organization"
              className={styles.formInput}
              value={organization}
              onChange={(event) => setOrganization(event.target.value)}
            >
              <option value="">Sélectionner une organisation</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.name}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Permissions</label>
            <div className={styles.checkboxGrid}>
              {AVAILABLE_PERMISSIONS.map((perm) => (
                <label key={perm.value} className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={selectedPermissions.includes(perm.value)}
                    onChange={() => togglePermission(perm.value)}
                  />
                  <span>{perm.label}</span>
                </label>
              ))}
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmer la suppression"
        size="sm"
        footer={
          <div className={styles.modalFooter}>
            <Button variant="outline" size="sm" onClick={() => setIsDeleteModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete}>
              <Trash2 size={16} />
              Supprimer
            </Button>
          </div>
        }
      >
        <div className={styles.deleteWarning}>
          <Trash2 size={24} />
          <p>Êtes-vous sûr de vouloir supprimer le rôle <strong>{selectedRole?.name}</strong> ?</p>
          <p className={styles.warningText}>Cette action est irréversible.</p>
        </div>
      </Modal>
    </PageWrapper>
  );
}
