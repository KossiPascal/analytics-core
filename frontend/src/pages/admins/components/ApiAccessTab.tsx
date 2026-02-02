import { useState, useEffect } from 'react';
import { Key, Plus, Edit2, Trash2, Copy, Check, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardBody } from '@components/ui';
import { Button } from '@components/ui/Button/Button';
import { Modal } from '@components/ui/Modal/Modal';
import { useNotification } from '@/contexts/OLD/useNotification';
import { AdminApi } from '@/services/OLD/old/api.service';
import styles from '@pages/admins/AdminPage.module.css';

interface ApiToken {
  id: string;
  token: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const DEFAULT_TOKEN_LENGTH = 30;

function generateToken(length: number = DEFAULT_TOKEN_LENGTH): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export function ApiAccessTab() {
  const [apis, setApis] = useState<ApiToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedApi, setSelectedApi] = useState<ApiToken | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({ token: '', isActive: false });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { showSuccess, showError } = useNotification();

  const fetchApis = async () => {
    setIsLoading(true);
    try {
      const response = await AdminApi.getApiTokens();
      if (response?.status === 200) {
        setApis((response.data as ApiToken[]) || []);
      }
    } catch (error) {
      showError('Erreur lors du chargement des API');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApis();
  }, []);

  const handleCreate = () => {
    setIsEditMode(false);
    setSelectedApi(null);
    setFormData({ token: generateToken(), isActive: true });
    setIsModalOpen(true);
  };

  const handleEdit = (api: ApiToken) => {
    setIsEditMode(true);
    setSelectedApi(api);
    setFormData({ token: api.token, isActive: api.isActive });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (api: ApiToken) => {
    setSelectedApi(api);
    setIsDeleteModalOpen(true);
  };

  const handleSave = async () => {
    if (formData.token.length !== DEFAULT_TOKEN_LENGTH) {
      showError(`Le token doit contenir exactement ${DEFAULT_TOKEN_LENGTH} caractères`);
      return;
    }

    setIsSaving(true);
    try {
      const action = isEditMode ? 'update' : 'create';
      const response = await AdminApi.manageApiToken({
        action,
        id: selectedApi?.id,
        token: formData.token,
        isActive: formData.isActive,
      });

      if (response?.status === 200) {
        showSuccess(isEditMode ? 'API mise à jour avec succès' : 'API créée avec succès');
        setIsModalOpen(false);
        fetchApis();
      } else {
        showError((response?.data as string) || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      showError('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedApi) return;

    try {
      const response = await AdminApi.manageApiToken({
        action: 'delete',
        id: selectedApi.id,
      });

      if (response?.status === 200) {
        showSuccess('API supprimée avec succès');
        setIsDeleteModalOpen(false);
        setSelectedApi(null);
        fetchApis();
      } else {
        showError('Erreur lors de la suppression');
      }
    } catch (error) {
      showError('Erreur lors de la suppression');
    }
  };

  const copyToClipboard = (token: string, id: string) => {
    navigator.clipboard.writeText(token);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Card>
      <CardHeader
        title={
          <div className={styles.cardTitle}>
            <Key size={20} />
            Gestion des API d'accès
          </div>
        }
        action={
          <div className={styles.buttonGroup}>
            <Button variant="ghost" size="sm" onClick={fetchApis} disabled={isLoading}>
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreate}>
              <Plus size={16} />
              Nouveau
            </Button>
          </div>
        }
      />
      <CardBody>
        {isLoading ? (
          <div className={styles.loading}>
            <RefreshCw size={24} className="animate-spin" />
          </div>
        ) : apis.length === 0 ? (
          <div className={styles.emptyState}>
            <Key size={48} />
            <p>Aucune API configurée</p>
            <Button variant="primary" onClick={handleCreate}>
              <Plus size={16} />
              Créer une API
            </Button>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {apis.map((api) => (
                  <tr key={api.id}>
                    <td>
                      <div className={styles.tokenDisplay}>
                        {api.token.substring(0, 8)}...{api.token.substring(api.token.length - 8)}
                        <button
                          className={styles.actionBtn}
                          onClick={() => copyToClipboard(api.token, api.id)}
                          title="Copier"
                        >
                          {copiedId === api.id ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${api.isActive ? styles.badgeSuccess : styles.badgeDanger}`}>
                        {api.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionsCell}>
                        <button
                          className={styles.actionBtn}
                          onClick={() => handleEdit(api)}
                          title="Modifier"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                          onClick={() => handleDeleteClick(api)}
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

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? 'Modifier API' : 'Nouvelle API'}
      >
        <div className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Token ({formData.token.length}/{DEFAULT_TOKEN_LENGTH} caractères)
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className={styles.formInput}
                value={formData.token}
                onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                maxLength={DEFAULT_TOKEN_LENGTH}
                style={{ flex: 1, fontFamily: 'monospace' }}
              />
              <Button
                variant="outline"
                onClick={() => setFormData({ ...formData, token: generateToken() })}
                title="Générer un nouveau token"
              >
                <RefreshCw size={16} />
              </Button>
            </div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              <span>Actif</span>
            </label>
          </div>
          <div className={styles.buttonGroup}>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmer la suppression"
      >
        <div className={styles.form}>
          <div className={`${styles.alert} ${styles.alertDanger}`}>
            <Trash2 size={20} />
            <p>Êtes-vous sûr de vouloir supprimer cette API ? Cette action est irréversible.</p>
          </div>
          <div className={styles.buttonGroup}>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              <Trash2 size={16} />
              Supprimer
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}
