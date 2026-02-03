import { memo, useCallback, useMemo, useState } from 'react';
import { Database, Plug, ShieldCheck, ShieldAlert, Server, KeyRound } from 'lucide-react';
import {
  FaDatabase, FaServer, FaUser, FaLock, FaKey,
  FaSave, FaVial, FaTrash, FaEdit, FaShieldAlt,
  FaCheckCircle, FaExclamationTriangle
} from "react-icons/fa";
import { Card, CardHeader, CardBody } from '@components/ui';
import { Button } from '@components/ui/Button/Button';
import { useNotification } from '@/contexts/OLD/useNotification';
import { connService as API, DbConnectionParams, type TestType } from '@/services/connection.service';
import styles from '@pages/admins/AdminPage.module.css';
import { DbConnectionForm } from '@/services/connection.service';

interface SelectModel {
  value: any;
  label: string;
}

const DB_TYPES: SelectModel[] = [
  { value: 'postgres', label: 'PostgreSQL' },
  { value: 'mysql', label: 'MySQL' },
  { value: 'mariadb', label: 'MariaDB' },
  { value: 'mssql', label: 'SQL Server' },
  { value: 'oracle', label: 'Oracle' },
  { value: 'mongodb', label: 'MongoDB' },
  { value: 'couchdb', label: 'CouchDB' },
  { value: 'sqlite', label: 'SQLite' },
  { value: 'other', label: 'Autre' },
]

const DEFAULT_FORM = Object.freeze<DbConnectionForm>({
  type: 'postgres',
  name: "",
  host: "localhost",
  port: 5432,
  dbname: "",
  username: "",
  password: "",
  ssh_enabled: false,
  ssh_host: "",
  ssh_port: 22,
  ssh_user: "",
  ssh_password: "",
  ssh_key: "",
  ssh_key_pass: ""
});


interface FieldProps {
  label: string;
  name: keyof DbConnectionForm;
  value: any;
  onChange: (key: keyof DbConnectionForm, value: any) => void;
  placeholder?: string;
  required?: boolean;
  list?: SelectModel[]
  icon?: React.ReactNode;
  type?: 'text' | 'textarea' | 'number' | 'password' | 'checkbox' | 'select';
  cols?: number | undefined
  rows?: number | undefined
  simple?: boolean
}

const convertToConnParams = (form: DbConnectionForm): DbConnectionParams => {
  return {
    id: form.id,
    type: form.type,
    name: form.name,
    dbname: form.dbname,
    username: form.username,
    password: form.password,
    host: form.host,
    port: form.port,
    ssh: form.ssh_enabled
      ? {
        host: form.ssh_host,
        port: form.ssh_port,
        username: form.ssh_user,
        password: form.ssh_password,
        key: form.ssh_key,
      }
      : null,
  }
}

const convertToConnForm = (param: DbConnectionParams): DbConnectionForm => {
  return {
    id: param.id,
    type: param.type,
    name: param.name,
    dbname: param.dbname,
    username: param.username,
    password: param.password,
    host: param.host,
    port: param.port,
    ssh_enabled: !!param.ssh,
    ssh_host: param.ssh?.host,
    ssh_port: param.ssh?.port,
    ssh_user: param.ssh?.username,
    ssh_password: param.ssh?.password,
    ssh_key: param.ssh?.key,
    ssh_key_pass: param.ssh?.key_pass,
  }
}


const Field = memo<FieldProps>(function Field({ label, name, value, onChange, type = "text", list = undefined, placeholder = undefined, rows = undefined, cols = undefined, required = false, icon = null, simple = false }) {

  value = value ?? "";
  const id = "host_" + name;
  const fieldLabel = <label className={styles.formLabel} htmlFor={id}>{label}</label>;

  let InputElement = <></>;

  if (type === 'textarea') {
    InputElement = (
      <>
        {fieldLabel}
        <textarea id={id} name={name} value={value} placeholder={placeholder} className={styles.formInput} required={required} rows={rows} cols={cols} onChange={(e) => onChange(name, e.target.value)} />
      </>
    );
  } else if (type === 'checkbox') {
    InputElement = (
      <label htmlFor={id} className={styles.checkbox}>
        <input id={id} type="checkbox" checked={value} onChange={(e) => onChange(name, e.target.checked)} />
        <span>{label}</span>
      </label>
    );
  } else if (type === 'select') {
    InputElement = (
      <>
        {fieldLabel}
        <select id={id} className={styles.formSelect} value={value} onChange={(e) => onChange(name, e.target.value)}>
          {list && list.map((l) => (<option key={'select_' + l.value} value={l.value}>{l.label}</option>))}
        </select>
      </>
    );
  } else {
    InputElement = (
      <>
        {fieldLabel}
        <input id={id} name={name} type={type} value={value} placeholder={placeholder} className={styles.formInput} required={required} onChange={(e) => onChange(name, e.target.value)} />
      </>
    );
  }

  /* ---------- SIMPLE MODE ---------- */
  if (simple) return InputElement;

  /* ---------- FULL MODE ---------- */
  return (
    <div className={styles.formGroup}>
      {InputElement}
    </div>
  );
});

export function DatabaseConnectionTab() {
  const [form, setForm] = useState<DbConnectionForm>(DEFAULT_FORM);
  const [testing, setTesting] = useState<TestType|null>(null);
  const [response, setResponse] = useState<{ type: "success" | "error", msg: string } | null>(null);
  const [list, setList] = useState<DbConnectionForm[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useNotification();

  const isValid = useMemo(() => {
    if (!form.name?.trim() || !form.host?.trim() || !form.dbname?.trim() || !form.username?.trim() || !form.type?.trim().length) {
      showError("Veuillez renseigner tous les champs obligatoires.");
      return false;
    }
    if (form.port <= 0) {
      showError("Invalid database port");
      return false;
    }
    if (form.ssh_enabled && (!form.ssh_host || !form.ssh_user)) {
      showError("SSH host and user required");
      return false;
    }
    return true;
  }, [form]);
  

  const updateField = useCallback((key: keyof DbConnectionForm, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const refresh = async () => {
    try {
      const { data } = await API.list();
      setList(data);
    } catch {
      setResponse({ type: "error", msg: "Failed to load connections" });
    }
  };

  const save = async () => {
    if (!isValid) return;
    setLoading(true);
    setResponse(null);

    try {
      const data = convertToConnParams(form);
      editId ? await API.update(editId, data) : await API.create(data);

      setForm(DEFAULT_FORM);
      setEditId(null);
      refresh();
      setResponse({ type: "success", msg: "Connection saved successfully" });
    } catch (e: any) {
      setResponse({ type: "error", msg: e?.response?.data?.error || "Save failed" });
    } finally {
      setLoading(false);
    }
  };

  const edit = (conn: DbConnectionParams) => {
    setEditId(conn.id ?? null);
    setForm({ ...DEFAULT_FORM, ...convertToConnForm(conn) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this connection?")) return;
    await API.delete(id);
    refresh();
  };

  const handleTest = async (type: TestType) => {
    if (!isValid) return;

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

  return (
    <>
      {/* <h1 className="title"><Database/>PostgreSQL Connections</h1> */}

      <Card>
        <CardHeader
          title={
            <div className={styles.cardTitle}>
              <FaDatabase size={20} />
              Connexion à une base de données
            </div>
          }
          action={
            <div className={styles.buttonGroup}>
              <Button disabled={!isValid || loading || testing === 'test-ssh'} variant="primary" size="sm" onClick={() => handleTest('test-ssh')}>
                {testing === 'test-ssh' ? (<><Plug size={16} className="animate-spin" />Test SSH en cours...</>) :
                  (<><Plug size={16} />Tester le tunel ssh</>)}
              </Button>
              <Button disabled={!isValid || loading || testing === 'test-ssh-db'} variant="primary" size="sm" onClick={() => handleTest('test-ssh-db')}>
                {testing === 'test-ssh-db' ? (<><Plug size={16} className="animate-spin" />Test en cours...</>) :
                  (<><Database size={16} />Tester la connexion</>)}
              </Button>
            </div>
          }
        />
        <CardBody>
          <div className={styles.form}>
            <div className={styles.grid + ' ' + styles.grid3}>
              <Field name="type" value={form.type} onChange={updateField} type={"select"} list={DB_TYPES} label={"Type"} icon={<Database />} placeholder="Ex: postgres" required={true} />
              <Field name="name" value={form.name} onChange={updateField} label={"Nom Connexion"} icon={<FaDatabase />} placeholder="Ex: Production PostgreSQL" />
              <Field name="dbname" value={form.dbname} onChange={updateField} label={"Nom de la base de donnée"} icon={<Database />} placeholder="Ex: kendeya_prod" />
            </div>

            <div className={styles.grid + ' ' + styles.grid2}>
              <Field name="host" value={form.host} onChange={updateField} label={"URL / Hôte"} icon={<FaServer />} placeholder="Ex: 10.0.0.12 ou db.example.com" required={true} />
              <Field name="port" value={form.port} onChange={updateField} type={'number'} label={"Port"} icon={<Database />} placeholder="Ex: 5432" />
            </div>

            <div className={styles.grid + ' ' + styles.grid2}>
              <Field name="username" value={form.username} onChange={updateField} label={"Utilisateur"} icon={<FaUser />} placeholder="Ex: admin" required={true} />
              <Field name="password" value={form.password} onChange={updateField} type='password' label={"Mot de passe"} icon={<FaLock />} placeholder="••••••••" />
            </div>

            <Field name="ssh_enabled" value={form.ssh_enabled} onChange={updateField} type={"checkbox"} label={"🔐 Utiliser un tunnel SSH"} icon={<FaShieldAlt />} />


            {form.ssh_enabled && (
              <div className={styles.grid + ' ' + styles.grid3}>
                {/* <h3>SSH Configuration</h3> */}
                <Field name="ssh_host" value={form.ssh_host} onChange={updateField} label={"Hôte SSH"} icon={<FaServer />} placeholder="Ex: ssh.example.com" required={true} />
                <Field name="ssh_port" value={form.ssh_port} onChange={updateField} type={'number'} label={"Port SSH"} icon={<Database />} placeholder="Ex: 22" />

                <Field name="ssh_user" value={form.ssh_user} onChange={updateField} label={"Utilisateur SSH"} icon={<FaUser />} placeholder="Ex: ubuntu" required={true} />
                <Field name="ssh_password" value={form.ssh_password} onChange={updateField} type='password' label={"Mot de passe SSH"} icon={<FaLock />} placeholder="••••••••" />

                <Field name="ssh_key" value={form.ssh_key} onChange={updateField} type={'textarea'} label={"Clé privée SSH"} icon={<FaKey />} placeholder="Coller la clé privée ici" rows={4} />
                <Field name="ssh_key_pass" value={form.ssh_key_pass} onChange={updateField} type='password' label={"PassPhrase Clé privée SSH"} icon={<FaKey />} placeholder="••••••••" />
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
                <strong>Conseil: </strong>
                <span style={alertStyle}>
                  Assurez-vous que la base est accessible depuis le serveur et que les ports sont ouverts.
                </span>
              </div>
            </div>

            <div className={styles.buttonGroup}>
              <Button disabled={loading || !!testing} variant="outline" size="sm" onClick={() => setForm(DEFAULT_FORM)}>
                <KeyRound size={16} />
                Réinitialiser
              </Button>

              <Button disabled={!isValid || loading || !!testing} isLoading={loading} onClick={() => save()} color="success">
                <FaSave />
                {editId ? "Update" : "Save"}
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="list">
        {list.map(c => (
          <div key={c.id} className="item">
            <div>
              <strong>{c.name}</strong><br />
              <small>{c.host}:{c.port}</small>
            </div>
            <div>
              <Button variant="outline" size="sm" onClick={() => edit(c)} disabled={!!testing}>
                <FaEdit size={16} />
              </Button>
              <Button variant="outline" size="sm" onClick={() => remove(c.id!)} disabled={!!testing}>
                <FaTrash size={16} />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default DatabaseConnectionTab;
