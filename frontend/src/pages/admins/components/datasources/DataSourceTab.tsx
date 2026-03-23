import { Shield } from 'lucide-react';
import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import { StatusBadge } from '@components/ui/Badge/Badge';
import { type Column } from '@components/ui/Table/Table';
import { FormInput } from '@components/forms/FormInput/FormInput';
import { FormTextarea } from '@components/forms/FormTextarea/FormTextarea';
import { Tenant } from '@models/identity.model';
import { FormSelect } from '@components/forms/FormSelect/FormSelect';
import { FormCheckbox } from '@components/forms/FormCheckbox/FormCheckbox';
import { AdminEntityCrudModuleRef, AdminEntityCrudModule } from '@pages/admins/AdminEntityCrudModule';
import { DataSource, DB_SOURCE_TYPES } from '@/models/datasource.models';
import { datasourceService } from '@/services/datasource.service';
import { FaDatabase, FaKey, FaLock, FaServer, FaUser } from 'react-icons/fa';

import styles from '@pages/admins/AdminPage.module.css';
import { Button } from '@/components/ui/Button/Button';

interface DataSourceTabProps {
    tenants: Tenant[];
    tenant_id: number
}

const createDefaultForm = (tenant_id: number): DataSource => ({
    id: null,
    type: "postgresql",
    tenant_id: tenant_id,
    name: "",
    technical_name: "",
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
    is_active: false,
});

const sourceColumns: Column<DataSource>[] = [
    {
        key: "name",
        header: "Nom",
        sortable: true,
        searchable: true,
    },
    {
        key: "technical_name",
        header: "Nom Technique",
        sortable: true,
        searchable: true,
    },
    {
        key: "dbname",
        header: "Nom DB",
        sortable: true,
        searchable: true,
    },
    {
        key: "host",
        header: "Host",
        sortable: true,
        searchable: true,
    },
    {
        key: "port",
        header: "Port",
        sortable: true,
        searchable: true,
    },
    {
        key: "tenant",
        header: "Tenant",
        render: (ds) => ds.tenant ? ds.tenant.name : "-",
        sortable: true,
        searchable: true,
    },
    {
        key: "type",
        header: "Type",
        render: (ds) => ds.type ?? "-",
        sortable: true,
        searchable: true,
    },
    {
        key: "description",
        header: "Description",
        sortable: true,
        searchable: true,
    },
    {
        key: "ssh_host",
        header: "SSH Host",
        sortable: true,
        searchable: true,
    },
    {
        key: "ssh_port",
        header: "SSH Port",
        sortable: true,
        searchable: true,
    },
    {
        key: "ssh_enabled",
        header: "Ssh enabled",
        sortable: true,
        align: "center",
        render: (ds) => (<StatusBadge isActive={ds.ssh_enabled === true} />),
        searchable: false,
    },
    {
        key: "auto_sync",
        header: "Auto sync",
        sortable: true,
        align: "center",
        render: (ds) => (<StatusBadge isActive={ds.auto_sync === true} />),
        searchable: false,
    },
    {
        key: "is_main",
        header: "Is main",
        sortable: true,
        align: "center",
        render: (ds) => (<StatusBadge isActive={ds.is_main === true} />),
        searchable: false,
    },
    {
        key: "is_active",
        header: "Statut",
        sortable: true,
        align: "center",
        render: (ou) => (<StatusBadge isActive={ou.is_active === true} />),
        searchable: false,
    },
];


export const DataSourceTab = forwardRef<AdminEntityCrudModuleRef, DataSourceTabProps>(({ tenants, tenant_id }, ref) => {
    const [testing, setTesting] = useState<{ db: boolean, ssh: boolean }|null>(null);

    const defaultTenant = useMemo(() => {
        return { required: true, ids: [tenant_id] };
    }, [tenant_id]);


    const DEFAULT_FORM = useMemo(() => createDefaultForm(tenant_id), [tenant_id])

    return (
        <AdminEntityCrudModule<DataSource>
            ref={ref}
            title="Gestion des DataSource"
            icon={<Shield size={20} />}
            entityName="Orgunit"
            columns={sourceColumns}
            defaultValue={DEFAULT_FORM}
            service={datasourceService}
            defaultTenant={defaultTenant}
            isValid={(r) => r.name.trim().length > 0}
            modalSize={"lg"}
            formActionsButtons={({ entity, isFormValid, saving, close }) => (
                <>
                    <Button
                        variant="secondary"
                        size="sm"
                        disabled={!isFormValid || saving || testing !== null}
                        onClick={async () => {
                            try {
                                setTesting({ db: true, ssh: false });
                                await datasourceService.testTunnel('test-ssh-db', entity); // close(false);

                            } catch (error) {
                            } finally {
                                setTesting(null);
                            }
                        }}>
                        
                        {"Test Database" + testing?.db ? ' ...': ''}
                    </Button>

                    <Button
                        variant="secondary"
                        size="sm"
                        disabled={!isFormValid || saving || testing !== null}
                        onClick={async () => {
                            try {
                                setTesting({ db: false, ssh: true });
                                await datasourceService.testTunnel('test-ssh', entity); // close(false);

                            } catch (error) {
                            } finally {
                                setTesting(null);
                            }
                        }}>
                        {"Test Tunel SSH" + testing?.ssh ? ' ...': ''}
                    </Button>
                </>
            )}
            renderForm={(source, setValue, saving) => (
                <>
                    <div className={styles.form}>
                        <div className={styles.grid + ' ' + styles.grid3}>
                            {/* <FormSelect
                                    label={`Tenant`}
                                    value={source.tenant_id || tenant_id}
                                    options={tenants.map((c) => ({ value: c.id, label: c.name }))}
                                    onChange={(value) => { setValue("tenant_id", value) }}
                                    placeholder="Sélectionner Tenant"
                                    leftIcon={<FaDatabase />}
                                    required={true}
                                /> */}
                            <FormSelect
                                label={`Type`}
                                value={source.type}
                                options={DB_SOURCE_TYPES.map((c) => ({ value: c.value, label: c.name }))}
                                onChange={(value) => { setValue("type", value) }}
                                placeholder="Ex: postgres"
                                leftIcon={<FaDatabase />}
                                required={true}
                            />
                            <FormInput
                                label="Nom Source"
                                value={source.name}
                                onChange={(e) => setValue("name", e.target.value)}
                                placeholder="Ex: Production PostgreSQL"
                                leftIcon={<FaDatabase />}
                                required={true}
                            />
                        </div>

                        <div className={styles.grid + ' ' + styles.grid3}>
                            <FormInput
                                label="Nom Technique"
                                value={source.technical_name}
                                onChange={(e) => setValue("technical_name", e.target.value)}
                                placeholder="Ex: kendeya"
                                leftIcon={<FaDatabase />}
                                required={true}
                            />
                            <FormInput
                                label={"Base de donnée"}
                                value={source.dbname}
                                onChange={(e) => setValue("dbname", e.target.value)}
                                leftIcon={<FaDatabase />}
                                placeholder="Ex: kendeya_prod"
                                required={true}
                            />
                            <FormInput
                                label={"URL / Hôte"}
                                value={source.host}
                                onChange={(e) => setValue("host", e.target.value)}
                                leftIcon={<FaServer />}
                                placeholder="Ex: 10.0.0.12 ou db.example.com"
                            />
                        </div>

                        <div className={styles.grid + ' ' + styles.grid3}>
                            <FormInput
                                label="Port"
                                type="number"
                                value={source.port}
                                onChange={(e) => setValue("port", e.target.value)}
                                leftIcon={<FaDatabase />}
                                placeholder="Ex: 5432"
                            />
                            <FormInput
                                label="Utilisateur"
                                value={source.username}
                                onChange={(e) => setValue("username", e.target.value)}
                                leftIcon={<FaUser />}
                                placeholder="Ex: admin"
                                required={true}
                            />
                            <FormInput
                                label="password"
                                type="password"
                                value={source.password}
                                onChange={(e) => setValue("password", e.target.value)}
                                leftIcon={<FaLock />}
                                placeholder="••••••••"
                            />
                        </div>

                        <div className={styles.grid + ' ' + styles.grid3}>
                            <FormCheckbox
                                label={`Auto sync`}
                                checked={Boolean(source.auto_sync)}
                                onChange={(e) => setValue("auto_sync", e.target.checked)}
                            />
                            <FormCheckbox
                                label={`Is Active`}
                                checked={Boolean(source.is_active)}
                                onChange={(e) => setValue("is_active", e.target.checked)}
                            />
                            <FormCheckbox
                                label={"🔐 Utiliser un tunnel SSH"}
                                checked={Boolean(source.ssh_enabled)}
                                onChange={(e) => setValue("ssh_enabled", e.target.checked)}
                            />
                        </div>

                        {source.ssh_enabled && (
                            <>
                                <div className={styles.grid + ' ' + styles.grid3}>
                                    <FormInput
                                        label={"Hôte SSH"}
                                        value={source.ssh_host}
                                        onChange={(e) => setValue("ssh_host", e.target.value)}
                                        leftIcon={<FaServer />}
                                        placeholder="Ex: ssh.example.com"
                                        required={true}
                                    />
                                    <FormInput
                                        label={"Port SSH"}
                                        value={source.ssh_port}
                                        onChange={(e) => setValue("ssh_port", e.target.value)}
                                        leftIcon={<FaDatabase />}
                                        placeholder="Ex: 22"
                                        required={true}
                                    />
                                    <FormInput
                                        label={"Utilisateur SSH"}
                                        value={source.ssh_username}
                                        onChange={(e) => setValue("ssh_username", e.target.value)}
                                        leftIcon={<FaUser />}
                                        placeholder="Ex: ubuntu"
                                        required={true}
                                    />
                                </div>

                                <div className={styles.grid + ' ' + styles.grid3}>
                                    <FormInput
                                        label={"Mot de passe SSH"}
                                        value={source.ssh_password}
                                        onChange={(e) => setValue("ssh_password", e.target.value)}
                                        leftIcon={<FaLock />}
                                        placeholder="••••••••"
                                    />
                                    <FormTextarea
                                        label="Clé privée SSH"
                                        // hint="Optionnel"
                                        value={source.ssh_key}
                                        onChange={(e) => setValue("ssh_key", e.target.value)}
                                        placeholder="Coller la clé privée ici"
                                        rows={0} cols={0}
                                    />
                                    <FormInput
                                        label={"PassPhrase Clé privée SSH"}
                                        value={source.ssh_key_pass}
                                        onChange={(e) => setValue("ssh_key_pass", e.target.value)}
                                        leftIcon={<FaKey />}
                                        placeholder="••••••••"
                                    />
                                    <FormTextarea
                                        label="Description"
                                        // hint="Optionnel"
                                        value={source.description || ""}
                                        onChange={(e) => setValue("description", e.target.value)}
                                        placeholder="Description du orgunit"
                                        rows={0} cols={0}
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </>
            )}
        />
    );
});
