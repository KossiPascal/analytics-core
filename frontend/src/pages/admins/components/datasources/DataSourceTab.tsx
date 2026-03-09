import { Shield } from 'lucide-react';
import { forwardRef, useEffect, useState } from 'react';
import { StatusBadge } from '@components/ui/Badge/Badge';
import { type Column } from '@components/ui/Table/Table';
import { FormInput } from '@components/forms/FormInput/FormInput';
import { FormTextarea } from '@components/forms/FormTextarea/FormTextarea';
import { Tenant } from '@models/identity.model';
import { tenantService } from '@/services/identity.service';
import { FormSelect } from '@components/forms/FormSelect/FormSelect';
import { FormCheckbox } from '@components/forms/FormCheckbox/FormCheckbox';
import { AdminEntityCrudModuleRef, AdminEntityCrudModule } from '@pages/admins/AdminEntityCrudModule';
import { DataSource, DataSourceType } from '@/models/datasource.models';
import { datasourceService, dsTypeService } from '@/services/datasource.service';
import { FaDatabase, FaKey, FaLock, FaServer, FaUser } from 'react-icons/fa';

import styles from '@pages/admins/AdminPage.module.css';
import { Button } from '@/components/ui/Button/Button';


const DEFAULT_FORM = Object.freeze<DataSource>({
    id: null,
    type_id: null,
    tenant_id: null,
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
        render: (ds) => ds.tenant ? ds.tenant.name : "",
        sortable: true,
        searchable: true,
    },
    {
        key: "type",
        header: "Type",
        render: (ds) => ds.type ? ds.type.name : "",
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


export const DataSourceTab = forwardRef<AdminEntityCrudModuleRef>((props, ref) => {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [tenant_id, setTenantId] = useState<number | undefined>(undefined);
    const [types, setTypes] = useState<DataSourceType[]>([]);
    const [dataSources, setDataSources] = useState<DataSource[]>([]);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        const loadTenants = async () => {
            const tenantRes = await tenantService.all();
            setTenants(tenantRes || []);
            if (tenantRes && tenantRes.length > 0) {
                const firstTenantId = tenantRes[0].id || undefined;
                setTenantId(firstTenantId);
            }
        };
        loadTenants();
    }, []);

    useEffect(() => {
        const fetchTypes = async () => {
            const typeRes = await dsTypeService.all();
            setTypes(typeRes || []);
        };
        fetchTypes();
    }, []);

    useEffect(() => {
        if (!tenant_id) return;
        const loadDatasets = async () => {
            const datasourceRes = await datasourceService.all(tenant_id);
            setDataSources(datasourceRes || []);
        };
        loadDatasets();
    }, [tenant_id]);

    
    return (
        <AdminEntityCrudModule<DataSource>
            ref={ref}
            title="Gestion des DataSource"
            icon={<Shield size={20} />}
            entityName="Orgunit"
            columns={sourceColumns}
            defaultValue={DEFAULT_FORM}
            service={datasourceService}
            defaultTenant={({ required: true, ids: [tenant_id] })}
            isValid={(r) => r.name.trim().length > 0}
            modalSize={"lg"}

            formButtons={(source, { handleAction, close }) => (
                <>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            handleAction(async () => {
                                // console.log("Preview entity:", entity);
                            }, false) // false => pas de refetch
                        }
                    >
                        Preview
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                            handleAction(async () => {
                                // const newEntity = await duplicateService.duplicate(entity.id!);
                                // console.log("Duplicated:", newEntity);
                            }, true)
                        }
                    >
                        Dupliquer
                    </Button>

                    <Button
                        variant="warning"
                        size="sm"
                        onClick={() =>
                            handleAction(async () => {
                                // await validateService.validate(entity.id!);
                            }, false)
                        }
                    >
                        Valider
                    </Button>

                    <Button
                        variant="danger"
                        size="sm"
                        onClick={() =>
                            handleAction(async () => {
                                // await archiveService.archive(entity.id!);
                                close(); // fermeture manuelle
                            }, true)
                        }
                    >
                        Archiver
                    </Button>
                </>
            )}

            //      : (
            // entity: T,
            // helpers: {
            //     handleAction: (action: () => Promise<void>,fethAfterAction:boolean) => Promise<void>;
            //     close: () => void;
            // }
            // )

            renderForm={(source, setValue, saving) => (
                <>
                    <div className={styles.form}>
                        <div className={styles.grid + ' ' + styles.grid3}>
                            <FormSelect
                                label={`Tenant`}
                                value={source.tenant_id}
                                options={tenants.map((c) => ({ value: c.id, label: c.name }))}
                                onChange={(value) => { setValue("tenant_id", value) }}
                                placeholder="Sélectionner Tenant"
                                leftIcon={<FaDatabase />}
                                required={true}
                            />
                            <FormSelect
                                label={`Type`}
                                value={source.type_id}
                                options={types.map((c) => ({ value: c.id, label: c.name }))}
                                onChange={(value) => { setValue("type_id", value) }}
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
