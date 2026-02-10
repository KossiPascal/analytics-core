import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Modal } from '@components/ui/Modal/Modal';
import { Button } from '@components/ui/Button/Button';
import { StatusBadge } from '@components/ui/Badge/Badge';
import { Table, type Column } from '@components/ui/Table/Table';
import { FormInput } from '@/components/forms/FormInput/FormInput';
import { FormTextarea } from '@/components/forms/FormTextarea/FormTextarea';
import { useNotification } from '@/contexts/OLD/useNotification';
import { connectionService as API } from '@/services/connection.service';
import { Building2, Save, Edit2, Trash2, RefreshCw, Plus } from 'lucide-react';
import styles from '../AdminPage.module.css';
import { DbConnection, DbConnectionParams, TestType } from '@/pages/builders/builders.models';
import { Card, CardHeader, CardBody } from '@components/ui/Card/Card';
import { ShieldCheck, ShieldAlert, KeyRound, Plug, Database, Server } from 'lucide-react';
import { FaDatabase, FaServer, FaUser, FaLock, FaShieldAlt, FaKey, FaSave } from 'react-icons/fa';
import { FormSelect } from '@/components/forms/FormSelect/FormSelect';
import { FormCheckbox } from '@/components/forms/FormCheckbox/FormCheckbox';

const DEFAULT_FORM = Object.freeze<DbConnection>({
  type: '' as any,
  name: "",
  description: "",
  host: "localhost",
  port: 5432,
  dbname: "",
  username: "",
  password: "",
  ssh_enabled: false,
  ssh_host: "",
  ssh_port: 22,
  ssh_username: "",
  ssh_password: "",
  ssh_key: "",
  ssh_key_pass: "",
  auto_sync: false,
});


const convertToConnParams = (form: DbConnection): DbConnectionParams => {
  return {
    id: form.id,
    type: form.type,
    name: form.name,
    description: form.description,
    dbname: form.dbname,
    username: form.username,
    password: form.password,
    host: form.host,
    port: form.port,
    auto_sync: form.auto_sync,
    ssh: form.ssh_enabled
      ? {
        host: form.ssh_host,
        port: form.ssh_port,
        username: form.ssh_username,
        password: form.ssh_password,
        key: form.ssh_key,
      }
      : null,
  }
}

export const DatabaseConnectionTab: React.FC<{ showTitle?: boolean, afterUpsert?: () => Promise<void>, onlyCardField?: boolean }> = ({ showTitle = true, onlyCardField = false, afterUpsert }) => {
  const [form, setForm] = useState<DbConnection>(DEFAULT_FORM);
  const [dbConnections, setDbConnections] = useState<DbConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dbTypes, setDbTypes] = useState<{ value: any; label: string; }[]>([]);
  const [response, setResponse] = useState<{ type: "success" | "error", msg: string } | null>(null);
  const [testing, setTesting] = useState<TestType | null>(null);
  const { showError, showSuccess } = useNotification();


  const fetchTypes = async () => {
    try {
      const res = await API.typesList<any>();
      if (res?.status === 200) {
        const types = (res.data ?? []).map((d: any) => ({ value: String(d.id), label: d.name }));
        setDbTypes(types);
      }
    } catch {
      // ne pas écraser le state response du formulaire
    }
  };

  const fetchDbConnections = async () => {
    setLoading(true);
    try {
      const response = await API.list<DbConnection>();
      if (response?.status === 200) {
        setDbConnections(response.data || []);
      } else {
        setDbConnections([]);
        showResError('Erreur lors du chargement des connexions');
      }
    } catch {
      showResError('Erreur lors du chargement des connexions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
    fetchDbConnections();
  }, []);


  const showResError = useCallback((msg: string) => {
    setResponse({ type: 'error', msg });
    showError(msg);
  }, []);

  const showResSuccess = useCallback((msg: string) => {
    setResponse({ type: 'success', msg });
    showSuccess(msg);
  }, []);

  // Form validation
  const isFormValid = useMemo(() => {
    if (!form.name?.trim() || !form.host?.trim() || !form.dbname?.trim() || !form.username?.trim() || !form.type) {
      return false;
    }
    if (form.type !== 'couchdb') {
      if (form.port <= 0) {
        return false;
      }
      if (form.ssh_enabled && (!form.ssh_host || !form.ssh_port || !form.ssh_username)) {
        return false;
      }
    }
    return true;
  }, [form]);

  const updateField = useCallback((key: keyof DbConnection, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const edit = (conn: DbConnectionParams) => {
  };

  const handleCreate = () => {
    setEditing(false);
    setForm(DEFAULT_FORM);
    setResponse(null);
    setIsModalOpen(true);
  };

  const handleEdit = (conn: DbConnection) => {
    setEditing(true);
    setForm({ ...DEFAULT_FORM, ...conn });
    setResponse(null);
    setIsModalOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteClick = (org: DbConnection) => {
    setForm(org);
    setIsDeleteModalOpen(true);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isFormValid) {
      showResError("Des champs requis ne sont pas renseigné.");
      return;
    }

    setSaving(true);
    try {
      const data = convertToConnParams(form);
      if (editing && data.id) {
        const response = await API.update(data.id, data);
        if (response?.status === 200) {
          showResSuccess('mise à jour réussi');
          setIsModalOpen(false);
          fetchDbConnections();
          afterUpsert?.();
        } else {
          showResError('Erreur lors de la mise à jour');
        }
      } else {
        const response = await API.create(data);
        if (response?.status === 200) {
          showResSuccess('Ajout réussi');
          setIsModalOpen(false);
          fetchDbConnections();
          afterUpsert?.();
        } else {
          showResError('Erreur lors de la création');
        }
      }
    } catch {
      showResError('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!id) return;
    if (!window.confirm("Delete this connection?")) return;

    try {
      const response = await API.delete(id);
      if (response?.status === 200) {
        showResSuccess('Connexion supprimée avec succès');
        setIsDeleteModalOpen(false);
        setForm(DEFAULT_FORM);
        fetchDbConnections();
        afterUpsert?.();
      } else {
        showResError('Erreur lors de la suppression');
      }
    } catch {
      showResError('Erreur lors de la suppression');
    }
  };


  const handleTest = async (type: TestType) => {
    if (!isFormValid) return;

    setTesting(type);
    setResponse(null);
    showSuccess(null)
    try {
      const dataToTest = convertToConnParams(form);
      const res: any = await API.test(type, dataToTest);

      if (res?.status === 200) {
        const message = res.data?.message || "Connection réussie";
        setResponse({ type: "success", msg: message });
        showSuccess(message)
      } else {
        setResponse({ type: "error", msg: "Échec du test de connexion." });
      }
    } catch (e: any) {
      setResponse({ type: "error", msg: e?.response?.data?.error || "Échec du test de connexion." });
    } finally {
      setTesting(null);
    }
  };
  const alertStyle = { margin: 0, fontSize: '0.875rem' }


  const renderConnexionCardField = () => {
    return (
      <>
        <CardBody>
          <div className={styles.form}>
            <div className={styles.grid + ' ' + styles.grid3}>
              <FormSelect value={form.type} onChange={(value) => updateField('type', value)} options={dbTypes} leftIcon={<FaDatabase />} label="Type" placeholder="Ex: postgres" required={true} />
              <FormInput name="name" value={form.name} onChange={(e) => updateField('name', e.target.value)} label={"Nom Connexion"} leftIcon={<FaDatabase />} placeholder="Ex: Production PostgreSQL" required={true} />
              <FormTextarea name="description" label="Description" placeholder="Description ..." value={form.description} onChange={(e) => updateField('description', e.target.value)}  rows={1} cols={1} />
            </div>

            <div className={styles.grid + ' ' + styles.grid3}>
              <FormInput name="dbname" value={form.dbname} onChange={(e) => updateField('dbname', e.target.value)} label={"Nom de la base de donnée"} leftIcon={<FaDatabase />} placeholder="Ex: kendeya_prod" required={true} />
              <FormInput name="host" value={form.host} onChange={(e) => updateField('host', e.target.value)} label={"URL / Hôte"} leftIcon={<FaServer />} placeholder="Ex: 10.0.0.12 ou db.example.com" required={true} />
              <FormInput name="port" value={form.port} onChange={(e) => updateField('port', e.target.value)} type={'number'} label={"Port"} leftIcon={<FaDatabase />} placeholder="Ex: 5432" />
            </div>

            <div className={styles.grid + ' ' + styles.grid2}>
              <FormInput name="username" value={form.username} onChange={(e) => updateField('username', e.target.value)} label={"Utilisateur"} leftIcon={<FaUser />} placeholder="Ex: admin" required={true} />
              <FormInput name="password" value={form.password} onChange={(e) => updateField('password', e.target.value)} type='password' label={"Mot de passe"} leftIcon={<FaLock />} placeholder="••••••••" />
            </div>

            <FormCheckbox name="ssh_enabled" checked={form.ssh_enabled} onChange={(e) => updateField('ssh_enabled', e.target.checked)} label={"🔐 Utiliser un tunnel SSH"}  />

            {form.ssh_enabled && (
              <div className={styles.grid + ' ' + styles.grid3}>
                <FormInput name="ssh_host" value={form.ssh_host} onChange={(e) => updateField('ssh_host', e.target.value)} label={"Hôte SSH"} leftIcon={<FaServer />} placeholder="Ex: ssh.example.com" required={true} />
                <FormInput name="ssh_port" value={form.ssh_port} onChange={(e) => updateField('ssh_port', e.target.value)} type={'number'} label={"Port SSH"} leftIcon={<FaDatabase />} placeholder="Ex: 22"  required={true} />
                <FormInput name="ssh_username" value={form.ssh_username} onChange={(e) => updateField('ssh_username', e.target.value)} label={"Utilisateur SSH"} leftIcon={<FaUser />} placeholder="Ex: ubuntu" required={true} />
                <FormInput name="ssh_password" value={form.ssh_password} onChange={(e) => updateField('ssh_password', e.target.value)} type='password' label={"Mot de passe SSH"} leftIcon={<FaLock />} placeholder="••••••••" />
                <FormTextarea name="ssh_key" label="Clé privée SSH" hint="Optionnel" placeholder="Coller la clé privée ici" value={form.ssh_key} onChange={(e) => updateField('ssh_key', e.target.value)}  rows={0} cols={0} />
                <FormInput name="ssh_key_pass" value={form.ssh_key_pass} onChange={(e) => updateField('ssh_key_pass', e.target.value)} type='password' label={"PassPhrase Clé privée SSH"} leftIcon={<FaKey />} placeholder="••••••••" />
              </div>
            )}

            {response?.type === 'success' && (
              <div className={`${styles.alert} ${styles.alertSuccess}`}>
                <ShieldCheck size={20} />
                <div>
                  <strong>Connexion validée: </strong>
                  <span style={alertStyle}>
                    Les paramètres semblent corrects. Vous pouvez utiliser cette connexion.
                  </span>
                </div>
              </div>
            )}

            {response?.type === 'error' && (
              <div className={`${styles.alert} ${styles.alertDanger}`}>
                <ShieldAlert size={20} />
                <div>
                  <strong>Connexion échouée: </strong>
                  <span style={alertStyle}>
                    Vérifiez l'URL, le port, les identifiants et les paramètres SSH.
                  </span>
                </div>
              </div>
            )}

            <div className={`${styles.alert} ${styles.alertInfo}`}>
              <Server size={20} />
              <div>
                <span style={alertStyle}>
                  Assurez-vous que la base et son port sont accessible depuis le serveur.
                </span>
              </div>
            </div>

            <div className={styles.buttonGroup}>
              <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Annuler
              </Button>

              <Button disabled={loading || !!testing} variant="outline" size="sm" onClick={() => setForm(DEFAULT_FORM)}>
                <KeyRound size={16} /> Réinitialiser
              </Button>

              {form.ssh_enabled && (<Button disabled={!isFormValid || loading || testing === 'test-ssh'} variant="primary" size="sm" onClick={() => handleTest('test-ssh')}>
                {testing === 'test-ssh' ? (<><Plug size={16} className="animate-spin" />Test SSH en cours...</>) :
                  (<><Plug size={16} /> Tester le tunel ssh</>)}
              </Button>)}

              <Button disabled={!isFormValid || loading || testing === 'test-ssh-db'} variant="primary" size="sm" onClick={() => handleTest('test-ssh-db')}>
                {testing === 'test-ssh-db' ? (<><Plug size={16} className="animate-spin" />Test en cours...</>) :
                  (<><Database size={16} /> Tester la connexion</>)}
              </Button>

              <Button disabled={!isFormValid || saving || loading || !!testing} isLoading={loading} variant="dark-success" size="sm" onClick={(e) => handleSave(e)} color="success">
                <FaSave /> {form.id ? (editing ? "Modification ..." : "Modifier") : (saving ? 'Enregistrement...' : 'Enregistrer')}
              </Button>
            </div>
          </div>
        </CardBody>
      </>
    );
  }

  if (onlyCardField) {
    return renderConnexionCardField();
  }


  const renderConnexionHeader = () => (
    <div className={styles.cardHeader}>
      <h3 className={styles.cardTitle}>
        <Building2 size={20} /> Gestion des DB COnnection
      </h3>
      <div className={styles.buttonGroup}>
        <button className={`${styles.btn} ${styles.btnOutline} ${styles.btnSmall}`} onClick={fetchDbConnections} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Actualiser
        </button>
        <button className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSmall}`} onClick={handleCreate}>
          <Plus size={16} /> Nouvelle connexion
        </button>
      </div>
    </div>
  );

  const renderEmptyState = () => (
    <div className={styles.emptyState}>
      <Building2 size={48} />
      <p>Aucune connexion à une base de données n'est configurée.</p>
      <Button className={`${styles.btn} ${styles.btnPrimary}`} variant="primary" onClick={handleCreate}>
        <Plus size={16} /> Ajouter une connexion
      </Button>
    </div>
  );

  const columns: Column<DbConnection>[] = [
    {
      key: 'id',
      header: 'ID',
      sortable: true,
      searchable: false,
    },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      searchable: true,
    },
    {
      key: 'name',
      header: 'Nom',
      sortable: true,
      searchable: true,
    },
    {
      key: 'description',
      header: 'Description',
      sortable: true,
      searchable: true,
      render: (org) => org.description || '-',
    },

    {
      key: 'host',
      header: 'Host',
      sortable: true,
      searchable: true,
    },

    {
      key: 'port',
      header: 'Port',
      sortable: true,
      searchable: true,
    },

    {
      key: 'dbname',
      header: 'DB Name',
      sortable: true,
      searchable: true,
    },

    {
      key: 'is_active',
      header: 'Statut',
      sortable: true,
      align: 'center',
      render: (org) => <StatusBadge isActive={org.is_active === true} />,
      searchable: false,
    },
    {
      key: 'id',
      header: 'Actions',
      align: 'center',
      render: (org) => (
        <div className={styles.actionsCell}>
          <button className={styles.actionBtn} onClick={() => handleEdit(org)} title="Modifier">
            <Edit2 size={16} />
          </button>
          <button className={`${styles.actionBtn} ${styles.actionBtnDanger}`} onClick={() => handleDeleteClick(org)} title="Supprimer">
            <Trash2 size={16} />
          </button>
        </div>
      ),
      searchable: false,
    },
  ];

  return (
    <Card>
      <div className={styles.card}>
        {renderConnexionHeader()}

        {loading ? (<div className={styles.loading}><RefreshCw size={24} className="animate-spin" /></div>) :
          dbConnections.length === 0 ? (renderEmptyState()) :
            (
              <Table
                data={dbConnections as any}
                columns={columns as any}
                keyExtractor={(org: any) => org.id as string}
                isLoading={loading}
                emptyMessage="Aucune données trouvée"
                features={{
                  search: true,
                  export: true,
                  pagination: true,
                  pageSize: true,
                  animate: true,
                  columnVisibility: true,
                  scrollable: true,
                }}
                searchPlaceholder="Rechercher une connexion..."
                exportFilename="connexions_export"
                exportFormats={['csv', 'excel', 'json']}
                defaultPageSize={10}
                pageSizeOptions={[10, 25, 50, 100]}
                stickyHeader
                maxHeight="600px"
              />
            )}
      </div>
<FaDatabase size={20} />Connexion à une base de données
      {/* Create/Edit Modal */}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={<><FaDatabase size={20} /> {editing ? " Modifier la connexion" : " Nouvelle connexion"}</> } size="xl">

        {renderConnexionCardField()}

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
            <Button variant="danger" size="sm" onClick={() => handleDelete(form.id!)}>
              <Trash2 size={16} />
              Supprimer
            </Button>
          </div>
        }
      >
        <div className={styles.emptyState} style={{ padding: '1rem' }}>
          <Trash2 size={24} style={{ color: '#dc2626', marginBottom: '0.5rem' }} />
          <p>
            Êtes-vous sûr de vouloir supprimer la connexion <strong>{form.name}</strong> ?
          </p>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Cette action est irréversible.</p>
        </div>
      </Modal>
    </Card>
  );
}