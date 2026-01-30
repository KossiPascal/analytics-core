import { useState, useEffect } from 'react';
import { PageWrapper } from '@components/layout';
import { Card, CardBody, CardHeader, Button } from '@components/ui';
import { Modal } from '@components/ui/Modal/Modal';
import { useNotification } from '@/hooks/useNotification';
import { PermissionsApi } from '@/services/api/api.service';
import { ShieldCheck, Save, Edit2, Trash2, RefreshCw } from 'lucide-react';
import styles from './PermissionsPage.module.css';

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

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPerm, setSelectedPerm] = useState<Permission | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [permissionName, setPermissionName] = useState('');
  const [permissionDescription, setPermissionDescription] = useState('');
  const [canCreate, setCanCreate] = useState(false);
  const [canRead, setCanRead] = useState(true);
  const [canUpdate, setCanUpdate] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { showError, showSuccess } = useNotification();

  const fetchPermissions = async () => {
    setIsLoading(true);
    try {
      const response = await PermissionsApi.getPermissions();
      if (response?.status === 200) {
        setPermissions((response.data as Permission[]) || []);
      }
    } catch (error) {
      showError('Erreur lors du chargement des permissions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const resetForm = () => {
    setPermissionName('');
    setPermissionDescription('');
    setCanCreate(false);
    setCanRead(true);
    setCanUpdate(false);
    setCanDelete(false);
  };

  const handleCreate = () => {
    setIsEditMode(false);
    setSelectedPerm(null);
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (perm: Permission) => {
    setIsEditMode(true);
    setSelectedPerm(perm);
    setPermissionName(perm.name);
    setPermissionDescription(perm.description || '');
    setCanCreate(perm.canCreate);
    setCanRead(perm.canRead);
    setCanUpdate(perm.canUpdate);
    setCanDelete(perm.canDelete);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (perm: Permission) => {
    setSelectedPerm(perm);
    setIsDeleteModalOpen(true);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!permissionName.trim()) {
      showError('Le nom de la permission est requis.');
      return;
    }

    setIsSaving(true);
    try {
      if (isEditMode && selectedPerm) {
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
          setIsModalOpen(false);
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
          setIsModalOpen(false);
          fetchPermissions();
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
    if (!selectedPerm) return;

    try {
      const response = await PermissionsApi.deletePermission(selectedPerm.id);
      if (response?.status === 200) {
        showSuccess('Permission supprimée avec succès');
        setIsDeleteModalOpen(false);
        setSelectedPerm(null);
        fetchPermissions();
      } else {
        showError('Erreur lors de la suppression');
      }
    } catch (error) {
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
      <span key={b.label} className={styles.crudBadge} title={b.title}>
        {b.label}
      </span>
    ));
  };

  return (
    <PageWrapper
      title="Gestion des permissions"
      subtitle="Définir les permissions et les accès"
      actions={
        <div className={styles.headerActions}>
          <Button variant="ghost" size="sm" onClick={fetchPermissions} disabled={isLoading}>
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </Button>
          <Button leftIcon={<ShieldCheck size={18} />} onClick={handleCreate}>
            Nouvelle permission
          </Button>
        </div>
      }
    >
      <Card>
        <CardHeader title="Liste des permissions" />
        <CardBody>
          {isLoading ? (
            <div className={styles.loading}>
              <RefreshCw size={24} className="animate-spin" />
              <p>Chargement...</p>
            </div>
          ) : permissions.length === 0 ? (
            <div className={styles.emptyState}>
              <ShieldCheck size={48} />
              <p>Aucune permission</p>
              <Button variant="primary" onClick={handleCreate}>
                Créer une permission
              </Button>
            </div>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
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
                        <div className={styles.crudList}>
                          {renderCrudBadges(perm)}
                        </div>
                      </td>
                      <td>
                        <div className={styles.actionsCell}>
                          <button
                            className={styles.actionBtn}
                            onClick={() => handleEdit(perm)}
                            title="Modifier"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                            onClick={() => handleDeleteClick(perm)}
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
        title={isEditMode ? 'Modifier la permission' : 'Nouvelle permission'}
        size="sm"
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
            <label className={styles.formLabel} htmlFor="permissionName">
              Nom de la permission
            </label>
            <input
              id="permissionName"
              className={styles.formInput}
              placeholder="Ex: manage_users"
              value={permissionName}
              onChange={(event) => setPermissionName(event.target.value)}
              required
              autoFocus
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="permissionDescription">
              Description (optionnel)
            </label>
            <textarea
              id="permissionDescription"
              className={styles.formInput}
              placeholder="Description de la permission"
              value={permissionDescription}
              onChange={(event) => setPermissionDescription(event.target.value)}
              rows={2}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Accès (CRUD)</label>
            <div className={styles.checkboxGrid}>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={canCreate}
                  onChange={(event) => setCanCreate(event.target.checked)}
                />
                <span>Créer</span>
              </label>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={canRead}
                  onChange={(event) => setCanRead(event.target.checked)}
                />
                <span>Lire</span>
              </label>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={canUpdate}
                  onChange={(event) => setCanUpdate(event.target.checked)}
                />
                <span>Mettre à jour</span>
              </label>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={canDelete}
                  onChange={(event) => setCanDelete(event.target.checked)}
                />
                <span>Supprimer</span>
              </label>
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
          <p>Êtes-vous sûr de vouloir supprimer la permission <strong>{selectedPerm?.name}</strong> ?</p>
          <p className={styles.warningText}>Cette action est irréversible.</p>
        </div>
      </Modal>
    </PageWrapper>
  );
}
