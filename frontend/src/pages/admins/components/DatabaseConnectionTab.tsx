import { useMemo, useState } from 'react';
import { Database, Plug, ShieldCheck, ShieldAlert, Server, KeyRound } from 'lucide-react';
import { Card, CardHeader, CardBody } from '@components/ui';
import { Button } from '@components/ui/Button/Button';
import { useNotification } from '@/contexts/OLD/useNotification';
import { AdminApi } from '@/services/OLD/old/api.service';
import styles from '@pages/admins/AdminPage.module.css';

type DbType = 'postgres' | 'mysql' | 'mssql' | 'mariadb' | 'sqlite' | 'couchdb' | 'mongodb' | 'oracle' | 'other';

interface DbConnectionForm {
  connectionName: string;
  databaseName: string;
  username: string;
  password: string;
  host: string;
  port: string;
  type: DbType;
  sshEnabled: boolean;
  sshHost: string;
  sshPort: string;
  sshUser: string;
  sshPassword: string;
  sshKey: string;
}

const DEFAULT_FORM: DbConnectionForm = {
  connectionName: '',
  databaseName: '',
  username: '',
  password: '',
  host: '',
  port: '',
  type: 'postgres',
  sshEnabled: false,
  sshHost: '',
  sshPort: '22',
  sshUser: '',
  sshPassword: '',
  sshKey: '',
};

export function DatabaseConnectionTab() {
  const [form, setForm] = useState<DbConnectionForm>(DEFAULT_FORM);
  const [isTesting, setIsTesting] = useState(false);
  const [lastStatus, setLastStatus] = useState<'success' | 'error' | null>(null);
  const { showSuccess, showError } = useNotification();

  const isValid = useMemo(() => {
    return (
      form.databaseName.trim().length > 0 &&
      form.host.trim().length > 0 &&
      form.port.trim().length > 0 &&
      form.username.trim().length > 0 &&
      form.type.trim().length > 0
    );
  }, [form]);

  const updateField = (key: keyof DbConnectionForm, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleTest = async () => {
    if (!isValid) {
      showError('Veuillez renseigner tous les champs obligatoires.');
      return;
    }

    setIsTesting(true);
    setLastStatus(null);
    try {
      const response = await AdminApi.testDatabaseConnection({
        connectionName: form.connectionName,
        databaseName: form.databaseName,
        username: form.username,
        password: form.password,
        host: form.host,
        port: form.port,
        type: form.type,
        ssh: form.sshEnabled
          ? {
              host: form.sshHost,
              port: form.sshPort,
              username: form.sshUser,
              password: form.sshPassword,
              key: form.sshKey,
            }
          : null,
      });

      if (response?.status === 200) {
        const message = (response.data as { message?: string } | undefined)?.message;
        showSuccess(message || 'Connexion réussie.');
        setLastStatus('success');
      } else {
        showError('Échec du test de connexion.');
        setLastStatus('error');
      }
    } catch (error) {
      showError('Échec du test de connexion.');
      setLastStatus('error');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader
        title={
          <div className={styles.cardTitle}>
            <Database size={20} />
            Connexion à une base de données
          </div>
        }
        action={
          <div className={styles.buttonGroup}>
            <Button variant="primary" size="sm" onClick={handleTest} disabled={isTesting}>
              {isTesting ? (
                <>
                  <Plug size={16} className="animate-spin" />
                  Test en cours...
                </>
              ) : (
                <>
                  <Plug size={16} />
                  Tester la connexion
                </>
              )}
            </Button>
          </div>
        }
      />
      <CardBody>
        <div className={styles.form}>
          <div className={styles.grid + ' ' + styles.grid2}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="connectionName">Connexion</label>
              <input
                id="connectionName"
                className={styles.formInput}
                placeholder="Ex: Production PostgreSQL"
                value={form.connectionName}
                onChange={(e) => updateField('connectionName', e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="databaseName">Nom de la base</label>
              <input
                id="databaseName"
                className={styles.formInput}
                placeholder="Ex: kendeya_prod"
                value={form.databaseName}
                onChange={(e) => updateField('databaseName', e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.grid + ' ' + styles.grid3}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="dbType">Type</label>
              <select
                id="dbType"
                className={styles.formSelect}
                value={form.type}
                onChange={(e) => updateField('type', e.target.value as DbType)}
              >
                <option value="postgres">PostgreSQL</option>
                <option value="mysql">MySQL</option>
                <option value="mariadb">MariaDB</option>
                <option value="mssql">SQL Server</option>
                <option value="oracle">Oracle</option>
                <option value="mongodb">MongoDB</option>
                <option value="couchdb">CouchDB</option>
                <option value="sqlite">SQLite</option>
                <option value="other">Autre</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="host">URL / Hôte</label>
              <input
                id="host"
                className={styles.formInput}
                placeholder="Ex: 10.0.0.12 ou db.example.com"
                value={form.host}
                onChange={(e) => updateField('host', e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="port">Port</label>
              <input
                id="port"
                className={styles.formInput}
                placeholder="5432"
                value={form.port}
                onChange={(e) => updateField('port', e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.grid + ' ' + styles.grid3}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="username">Utilisateur</label>
              <input
                id="username"
                className={styles.formInput}
                placeholder="Ex: admin"
                value={form.username}
                onChange={(e) => updateField('username', e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="password">Mot de passe</label>
              <input
                id="password"
                type="password"
                className={styles.formInput}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => updateField('password', e.target.value)}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={form.sshEnabled}
                onChange={(e) => updateField('sshEnabled', e.target.checked)}
              />
              <span>Utiliser un tunnel SSH</span>
            </label>
          </div>

          {form.sshEnabled && (
            <div className={styles.grid + ' ' + styles.grid3}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="sshHost">Hôte SSH</label>
                <input
                  id="sshHost"
                  className={styles.formInput}
                  placeholder="Ex: ssh.example.com"
                  value={form.sshHost}
                  onChange={(e) => updateField('sshHost', e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="sshPort">Port SSH</label>
                <input
                  id="sshPort"
                  className={styles.formInput}
                  placeholder="22"
                  value={form.sshPort}
                  onChange={(e) => updateField('sshPort', e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="sshUser">Utilisateur SSH</label>
                <input
                  id="sshUser"
                  className={styles.formInput}
                  placeholder="Ex: ubuntu"
                  value={form.sshUser}
                  onChange={(e) => updateField('sshUser', e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="sshPassword">Mot de passe SSH</label>
                <input
                  id="sshPassword"
                  type="password"
                  className={styles.formInput}
                  placeholder="••••••••"
                  value={form.sshPassword}
                  onChange={(e) => updateField('sshPassword', e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="sshKey">Clé privée SSH</label>
                <textarea
                  id="sshKey"
                  className={styles.formInput}
                  placeholder="Coller la clé privée ici"
                  rows={4}
                  value={form.sshKey}
                  onChange={(e) => updateField('sshKey', e.target.value)}
                />
              </div>
            </div>
          )}

          {lastStatus === 'success' && (
            <div className={`${styles.alert} ${styles.alertSuccess}`}>
              <ShieldCheck size={20} />
              <div>
                <strong>Connexion validée</strong>
                <p style={{ margin: 0, fontSize: '0.875rem' }}>
                  Les paramètres semblent corrects. Vous pouvez utiliser cette connexion.
                </p>
              </div>
            </div>
          )}

          {lastStatus === 'error' && (
            <div className={`${styles.alert} ${styles.alertDanger}`}>
              <ShieldAlert size={20} />
              <div>
                <strong>Connexion échouée</strong>
                <p style={{ margin: 0, fontSize: '0.875rem' }}>
                  Vérifiez l\'URL, le port, les identifiants et les paramètres SSH.
                </p>
              </div>
            </div>
          )}

          <div className={`${styles.alert} ${styles.alertInfo}`}>
            <Server size={20} />
            <div>
              <strong>Conseil</strong>
              <p style={{ margin: 0, fontSize: '0.875rem' }}>
                Assurez-vous que la base est accessible depuis le serveur et que les ports sont ouverts.
              </p>
            </div>
          </div>

          <div className={styles.buttonGroup}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setForm(DEFAULT_FORM)}
              disabled={isTesting}
            >
              <KeyRound size={16} />
              Réinitialiser
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export default DatabaseConnectionTab;
