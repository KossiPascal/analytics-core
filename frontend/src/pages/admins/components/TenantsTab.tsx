import { useState, useEffect } from 'react';
import { Modal } from '@components/ui/Modal/Modal';
import { Button } from '@components/ui/Button/Button';
import { Table, type Column, type ActionMenuItem } from '@components/ui/Table/Table';
import { FormInput } from '@/components/forms/FormInput/FormInput';
import { api } from '@/apis/api';
import { Building2, Save, Edit2, Trash2, RefreshCw, Plus } from 'lucide-react';
import styles from '../AdminPage.module.css';
import toast from 'react-hot-toast';

interface Tenant {
  id: string;
  name: string;
  created_at: string;
}

export function TenantsTab() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [tenantName, setTenantName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const isFormValid = tenantName.trim().length > 0;

  const fetchTenants = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/tenants');
      if (res.success) setTenants((res.data as Tenant[]) || []);
      else toast.error('Erreur de chargement des tenants');
    } catch {
      toast.error('Erreur de chargement des tenants');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchTenants(); }, []);

  const handleCreate = () => {
    setIsEditMode(false);
    setSelectedTenant(null);
    setTenantName('');
    setIsModalOpen(true);
  };

  const handleEdit = (tenant: Tenant) => {
    setIsEditMode(true);
    setSelectedTenant(tenant);
    setTenantName(tenant.name);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsDeleteModalOpen(true);
  };

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!tenantName.trim()) return;

    setIsSaving(true);
    try {
      let res;
      if (isEditMode && selectedTenant) {
        res = await api.patch(`/tenants/${selectedTenant.id}`, { name: tenantName });
      } else {
        res = await api.post('/tenants', { name: tenantName });
      }

      if (res.success || res.status === 200 || res.status === 201) {
        toast.success(isEditMode ? 'Tenant mis à jour' : 'Tenant créé');
        setIsModalOpen(false);
        fetchTenants();
      } else {
        toast.error(res.message || 'Erreur lors de la sauvegarde');
      }
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTenant) return;
    try {
      const res = await api.delete(`/tenants/${selectedTenant.id}`);
      if (res.success || res.status === 200) {
        toast.success('Tenant supprimé');
        setIsDeleteModalOpen(false);
        setSelectedTenant(null);
        fetchTenants();
      } else {
        toast.error(res.message || 'Erreur lors de la suppression');
      }
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const columns: Column<Tenant>[] = [
    { key: 'name', header: 'Nom', sortable: true, searchable: true },
    {
      key: 'created_at',
      header: 'Date de création',
      sortable: true,
      render: (t) => t.created_at ? new Date(t.created_at).toLocaleDateString('fr') : '-',
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      actionsMenu: (t): ActionMenuItem[] => [
        {
          label: 'Modifier',
          icon: <Edit2 size={15} />,
          onClick: () => handleEdit(t),
        },
        {
          label: 'Supprimer',
          icon: <Trash2 size={15} />,
          onClick: () => handleDeleteClick(t),
          danger: true,
          separator: true,
        },
      ],
    },
  ];

  return (
    <>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>
            <Building2 size={20} />
            Gestion des tenants
          </h3>
          <div className={styles.buttonGroup}>
            <button
              className={`${styles.btn} ${styles.btnOutline} ${styles.btnSmall}`}
              onClick={fetchTenants}
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
              Nouveau tenant
            </button>
          </div>
        </div>

        <Table
          data={tenants}
          columns={columns}
          keyExtractor={(t) => t.id}
          isLoading={isLoading}
          emptyMessage="Aucun tenant"
          features={{ search: true, pagination: true }}
          searchPlaceholder="Rechercher un tenant..."
        />
      </div>

      {/* Create / Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? 'Modifier le tenant' : 'Nouveau tenant'}
        size="sm"
        footer={
          <div className={styles.buttonGroup}>
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleSave()}
              disabled={!isFormValid || isSaving}
              isLoading={isSaving}
            >
              <Save size={16} />
              Enregistrer
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSave}>
          <FormInput
            label="Nom du tenant"
            placeholder="Ex: Kendeya Analytics"
            value={tenantName}
            onChange={(e) => setTenantName(e.target.value)}
            required
            leftIcon={<Building2 size={18} />}
          />
        </form>
      </Modal>

      {/* Delete confirmation */}
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
            Supprimer le tenant <strong>{selectedTenant?.name}</strong> ?
          </p>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Cette action est irréversible. Tous les utilisateurs et données liés seront affectés.
          </p>
        </div>
      </Modal>
    </>
  );
}
