import { useState, useEffect, useMemo, useCallback } from 'react';
import { Modal, Button, StatusBadge } from '@components/ui';
import { FormCheckbox, FormInput, FormTextarea } from '@/components/forms';
import { useNotification } from '@/contexts/OLD/useNotification';
import { couchdbService, ChtCouchdbConnect } from '@/services/couchdb.service';
import { Building2, Save, Edit2, Trash2, RefreshCw, Plus } from 'lucide-react';
import styles from '../AdminPage.module.css';
import { SyncBadge } from '@/components/ui/Badge/Badge';



const DEFAULT_FORM = Object.freeze<ChtCouchdbConnect>({
  name: 'kendeya',
  description: 'kendeya host for sync',
  host: 'kendeya.portal-integratehealth.org',
  port: '',
  username: 'admin',
  password: 'IntHea2004',
  test_db: 'medic',
  auto_sync: true
});


export function ChtCouchdbRegisterTab() {
  const [form, setForm] = useState<ChtCouchdbConnect>(DEFAULT_FORM);
  const [couchdbRegistered, setCouchdbRegistered] = useState<ChtCouchdbConnect[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { showError, showSuccess } = useNotification();

  // Form validation
  const isFormValid = useMemo(() => {
    return form.name.trim().length > 0 
        && form.host.trim().length > 0;
  }, [form.name, form.host]);

//   name
// base_url
// username
// password
// auto_sync

  const updateField = useCallback((key: keyof ChtCouchdbConnect, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);



  const fetchCouchdbRegistered = async () => {
    setIsLoading(true);
    try {
    } catch {
      showError('Erreur lors du chargement des organisations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCouchdbRegistered();
  }, []);

  const handleConnect = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isFormValid) {
      showError("Renseigner tous les champs requis.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await couchdbService.connect(form);

      if (res?.status === 200) {
        showSuccess('Couchdb connecté avec succès');
        setIsModalOpen(false);
        fetchCouchdbRegistered();
      } else {
        showError('Erreur lors de la connection');
      }
    } catch {
      showError('Erreur lors de la connection');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpsert = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isFormValid) {
      showError("Le nom de l'application est requis.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await couchdbService.create(form);
      if (res?.status === 200) {
        showSuccess('Couchdb ajouté avec succès');
        setIsModalOpen(false);
        fetchCouchdbRegistered();
      } else {
        showError('Erreur lors de la sauvegarde');
      }
    } catch {
      showError('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLastseq = async (event: React.FormEvent) => {
    event.preventDefault();
    // if (!couchdbName.trim()) {
    //   showError("Le nom de l'application est requis.");
    //   return;
    // }

    // setIsSaving(true);
    // try {
    //   db_name: string, seq: string
    //   const res = await couchdbService.lastseq(couchdbName, seq);

    //   if (res?.status === 200) {
    //     showSuccess('Couchdb mise à jour avec succès');
    //     setIsModalOpen(false);
    //     fetchCouchdbRegistered();
    //   } else {
    //     showError('Erreur lors de la mise à jour');
    //   }
    // } catch {
    //   showError('Erreur lors de la sauvegarde');
    // } finally {
    //   setIsSaving(false);
    // }
  };

  const handleCreate = () => {
    setIsEditMode(false);
    setForm(DEFAULT_FORM);
    setIsModalOpen(true);
  };

  const handleEdit = (couchdb: ChtCouchdbConnect) => {
    setIsEditMode(true);
    setForm(couchdb);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (couchdb: ChtCouchdbConnect) => {
    setForm(couchdb);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
  };

  return (
    <>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>
            <Building2 size={20} />
            Gestion des CHT Couchdb
          </h3>
          <div className={styles.buttonGroup}>
            <button
              className={`${styles.btn} ${styles.btnOutline} ${styles.btnSmall}`}
              onClick={fetchCouchdbRegistered}
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
              Nouvelle connection
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className={styles.loading}>
            <RefreshCw size={24} className="animate-spin" />
          </div>
        ) : couchdbRegistered.length === 0 ? (
          <div className={styles.emptyState}>
            <Building2 size={48} />
            <p>Aucun Couchdb</p>
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={handleCreate}
            >
              Créer une connection
            </button>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Sync</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {couchdbRegistered.map((cdb) => (
                  <tr key={cdb.id}>
                    <td>{cdb.name}</td>
                    <td>
                      <SyncBadge sync={cdb.auto_sync} />
                    </td>
                    <td>
                      <div className={styles.actionsCell}>
                        <button
                          className={styles.actionBtn}
                          onClick={() => handleEdit(cdb)}
                          title="Modifier"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                          onClick={() => handleDeleteClick(cdb)}
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
        title={isEditMode ? "Modifier CHT Couchdb" : 'Nouvelle CHT Couchdb'}
        size="sm"
        footer={
          <div className={styles.buttonGroup}>
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="primary" size="sm" onClick={handleUpsert} disabled={!isFormValid || isSaving}>
              <Save size={16} />
              {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        }
      >
        <FormInput
          label="Nom du projet"
          placeholder="Ex: kendeya"
          value={form.name}
          onChange={(e) => updateField('name', e.target.value)}
          required
          leftIcon={<Building2 size={18} />}
        />
        <FormInput
          label="Description"
          placeholder="Ex: kendeya pour sync"
          value={form.description}
          onChange={(e) => updateField('description', e.target.value)}
          required
          leftIcon={<Building2 size={18} />}
        />
        <FormInput
          label="Couchdb Host"
          placeholder="Ex: https://kendeya.org"
          value={form.host}
          onChange={(e) => updateField('host', e.target.value)}
          required
          leftIcon={<Building2 size={18} />}
        />
        <FormInput
          label="Couchdb Port"
          placeholder="Ex: 443"
          value={form.port}
          onChange={(e) => updateField('port', e.target.value)}
          leftIcon={<Building2 size={18} />}
        />
        <FormInput
          label="Couchdb Username"
          placeholder="Ex: kossi"
          value={form.username}
          onChange={(e) => updateField('username', e.target.value)}
          leftIcon={<Building2 size={18} />}
        />
        <FormInput
          label="Couchdb Password"
          type={'password'}
          placeholder="••••••••"
          value={form.password}
          onChange={(e) => updateField('password', e.target.value)}
          leftIcon={<Building2 size={18} />}
        />
        <FormInput
          label="Couchdb TestDb"
          placeholder="Ex: kendeya"
          value={form.test_db}
          onChange={(e) => updateField('test_db', e.target.value)}
          leftIcon={<Building2 size={18} />}
        />

        <FormCheckbox
          label="Auto Sync"
          value={Boolean(form.auto_sync)}
          onChange={(e) => updateField('auto_sync', e.target.checked)}
        />
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
            Êtes-vous sûr de vouloir supprimer l'organisation <strong>{form.name}</strong> ?
          </p>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Cette action est irréversible.</p>
        </div>
      </Modal>
    </>
  );
}
