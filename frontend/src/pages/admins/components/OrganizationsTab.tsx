import { useState, useEffect } from 'react';
import { Modal, Button, StatusBadge } from '@components/ui';
import { useNotification } from '@/contexts/OLD/useNotification';
import { OrganizationsApi } from '@/services/OLD/old/api.service';
import { Building2, Save, Edit2, Trash2, RefreshCw, Plus } from 'lucide-react';
import styles from '../AdminPage.module.css';

interface Organization {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export function OrganizationsTab() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [orgDescription, setOrgDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { showError, showSuccess } = useNotification();

  const fetchOrganizations = async () => {
    setIsLoading(true);
    try {
      const response = await OrganizationsApi.getOrganizations();
      if (response?.status === 200) {
        setOrganizations((response.data as Organization[]) || []);
      }
    } catch {
      showError('Erreur lors du chargement des organisations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const handleCreate = () => {
    setIsEditMode(false);
    setSelectedOrg(null);
    setOrgName('');
    setOrgDescription('');
    setIsModalOpen(true);
  };

  const handleEdit = (org: Organization) => {
    setIsEditMode(true);
    setSelectedOrg(org);
    setOrgName(org.name);
    setOrgDescription(org.description || '');
    setIsModalOpen(true);
  };

  const handleDeleteClick = (org: Organization) => {
    setSelectedOrg(org);
    setIsDeleteModalOpen(true);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!orgName.trim()) {
      showError("Le nom de l'organisation est requis.");
      return;
    }

    setIsSaving(true);
    try {
      if (isEditMode && selectedOrg) {
        const response = await OrganizationsApi.updateOrganization({
          id: selectedOrg.id,
          name: orgName,
          description: orgDescription,
        });
        if (response?.status === 200) {
          showSuccess('Organisation mise à jour avec succès');
          setIsModalOpen(false);
          fetchOrganizations();
        } else {
          showError('Erreur lors de la mise à jour');
        }
      } else {
        const response = await OrganizationsApi.createOrganization({
          name: orgName,
          description: orgDescription,
        });
        if (response?.status === 200) {
          showSuccess('Organisation créée avec succès');
          setIsModalOpen(false);
          fetchOrganizations();
        } else {
          showError('Erreur lors de la création');
        }
      }
    } catch {
      showError('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedOrg) return;

    try {
      const response = await OrganizationsApi.deleteOrganization(selectedOrg.id);
      if (response?.status === 200) {
        showSuccess('Organisation supprimée avec succès');
        setIsDeleteModalOpen(false);
        setSelectedOrg(null);
        fetchOrganizations();
      } else {
        showError('Erreur lors de la suppression');
      }
    } catch {
      showError('Erreur lors de la suppression');
    }
  };

  return (
    <>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>
            <Building2 size={20} />
            Gestion des organisations
          </h3>
          <div className={styles.buttonGroup}>
            <button
              className={`${styles.btn} ${styles.btnOutline} ${styles.btnSmall}`}
              onClick={fetchOrganizations}
              disabled={isLoading}
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              Actualiser
            </button>
            <button
              className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSmall}`}
              onClick={handleCreate}
            >
              <Plus size={16} />
              Nouvelle organisation
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className={styles.loading}>
            <RefreshCw size={24} className="animate-spin" />
          </div>
        ) : organizations.length === 0 ? (
          <div className={styles.emptyState}>
            <Building2 size={48} />
            <p>Aucune organisation</p>
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={handleCreate}
            >
              Créer une organisation
            </button>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Description</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {organizations.map((org) => (
                  <tr key={org.id}>
                    <td>{org.name}</td>
                    <td>{org.description || '-'}</td>
                    <td>
                      <StatusBadge isActive={org.isActive} />
                    </td>
                    <td>
                      <div className={styles.actionsCell}>
                        <button
                          className={styles.actionBtn}
                          onClick={() => handleEdit(org)}
                          title="Modifier"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                          onClick={() => handleDeleteClick(org)}
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
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? "Modifier l'organisation" : 'Nouvelle organisation'}
        size="sm"
        footer={
          <div className={styles.buttonGroup}>
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
            <label className={styles.formLabel} htmlFor="orgName">
              Nom de l'organisation
            </label>
            <input
              id="orgName"
              className={styles.formInput}
              placeholder="Ex: Kendeya Analytics"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="orgDescription">
              Description (optionnel)
            </label>
            <textarea
              id="orgDescription"
              className={styles.formInput}
              placeholder="Description de l'organisation"
              value={orgDescription}
              onChange={(e) => setOrgDescription(e.target.value)}
              rows={3}
            />
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
          <div className={styles.buttonGroup}>
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
        <div className={styles.emptyState} style={{ padding: '1rem' }}>
          <Trash2 size={24} style={{ color: '#dc2626', marginBottom: '0.5rem' }} />
          <p>
            Êtes-vous sûr de vouloir supprimer l'organisation <strong>{selectedOrg?.name}</strong> ?
          </p>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Cette action est irréversible.</p>
        </div>
      </Modal>
    </>
  );
}
