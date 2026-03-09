import { Shield } from 'lucide-react';
import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import { StatusBadge } from '@components/ui/Badge/Badge';
import { type Column } from '@components/ui/Table/Table';
import { FormInput } from '@components/forms/FormInput/FormInput';
import { FormTextarea } from '@components/forms/FormTextarea/FormTextarea';
import { Tenant } from '@models/identity.model';
import { tenantService } from '@/services/identity.service';
import { FormSelect } from '@components/forms/FormSelect/FormSelect';
import { FormCheckbox } from '@components/forms/FormCheckbox/FormCheckbox';
import { AdminEntityCrudModuleRef, AdminEntityCrudModule } from '@pages/admins/AdminEntityCrudModule';
import { Dataset, DatasetColumn, SqlDatasetTypeList, SqlWithUtils } from '@/models/dataset.models';
import { datasetService } from '@/services/dataset.service';
import { datasourceService } from '@/services/datasource.service';
import { FaDatabase } from 'react-icons/fa';
import { DataSource } from '@/models/datasource.models';
import { FormMultiSelect } from '@/components/forms/FormSelect/FormMultiSelect';
import { Modal } from '@/components/ui/Modal/Modal';
import { Button } from '@/components/ui/Button/Button';
import { FormSwitch } from '@/components/forms/FormSwitch/FormSwitch';


// SqlFieldTypeList
const DEFAULT_FORM = Object.freeze<Dataset>({
    id: null,
    name: "",
    view_name: "",
    sql: null,
    use_local_view: false,
    sql_type: "matview",
    tenant_id: null,
    datasource_id: null,
    connection_id: null,
    description: "",
    is_active: false,
    columns: [],
    version: 1
});

const getSourceColumns = (openSqlModal: (ds: Dataset) => void, openSqlColumnsModal: (ds: Dataset) => void): Column<Dataset>[] => [
    {
        key: "name",
        header: "Nom",
        sortable: true,
        searchable: true,
    },
    {
        key: "view_name",
        header: "Nom Vue",
        sortable: true,
        searchable: true,
    },
    {
        key: "sql",
        header: "SQL",
        align: "center",
        sortable: false,
        searchable: false,
        render: (ds) => (
            ds.sql ? (
                <Button onClick={() => openSqlModal(ds)}>
                    Voir SQL
                </Button>
            ) : ""
        )
    },
    {
        key: "columns",
        header: "Columns",
        sortable: false,
        searchable: false,
        align: "center",
        // render: (ds) => ds.columns ? ds.columns.map(c => `${c.name}:${c.type}`).join(", \n") : "",
        render: (ds) => (
            ds.sql ? (
                <Button onClick={() => openSqlColumnsModal(ds)}>
                    Voir Columns
                </Button>
            ) : ""
        )
    },
    {
        key: "sql_type",
        header: "Sql type",
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
        key: "datasource",
        header: "Datasource",
        render: (ds) => ds.datasource ? ds.datasource.name : "",
        sortable: true,
        searchable: true,
    },
    {
        key: "connection",
        header: "Connection",
        render: (ds) => ds.connection ? ds.connection.dbname : "",
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
        key: "is_active",
        header: "Active",
        sortable: true,
        align: "center",
        render: (ou) => (<StatusBadge isActive={ou.is_active === true} />),
        searchable: false,
    },
    {
        key: "version",
        header: "Version",
        sortable: true,
        align: "center",
        render: (ds) => ds.version ?? "",
        searchable: false,
    },
];



export const DatasetTab = forwardRef<AdminEntityCrudModuleRef>((props, ref) => {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [tenant_id, setTenantId] = useState<number | undefined>(undefined);
    const [dataSources, setDataSources] = useState<DataSource[]>([]);
    const [sqlColumns, setSqlColumns] = useState<DatasetColumn[]>([]);
    const [localViews, setLocalViews] = useState<{ name: string, type: string }[]>([]);
    const [selectedDatasetName, setSelectedDatasetName] = useState<string>("");
    const [selectedSql, setSelectedSql] = useState<string | null>(null);
    const [showSql, setShowSql] = useState<boolean>(false);
    const [selectedColumns, setSelectedColumns] = useState<DatasetColumn[]>([]);
    const [showSqlColumns, setShowSqlColumns] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);

    const openSqlModal = (ds: Dataset) => {
        setSelectedSql(ds.sql ?? "");
        setSelectedDatasetName(ds.name);
        setShowSql(true);
    };

    const openSqlColumnsModal = (ds: Dataset) => {
        setSelectedColumns(ds.columns ?? []);
        setShowSqlColumns(true);
    };


    const sourceColumns = getSourceColumns(openSqlModal, openSqlColumnsModal);

    const didLoad = useRef(false);
    const didLoad2 = useRef(false);

    useEffect(() => {
        if (didLoad.current) return;
        didLoad.current = true;
        tenantService.all().then(t=>setTenants(t || []));
    }, []);

    useEffect(() => {
        if (!tenant_id) return;
        datasourceService.all(tenant_id).then(d=>setDataSources(d || []));
    }, [tenant_id]);

    useEffect(() => {
        if (didLoad2.current) return;
        didLoad2.current = true;
        datasetService.getLocalViews().then(l=>setLocalViews(l as any || []));
    }, []);

    const defaultTenant = useMemo(() => {
        return { required: true, ids: [tenant_id] };
    }, [tenant_id]);

    return (
        <>
            <FormSelect
                label={`Tenant List`}
                value={tenant_id}
                options={tenants.map((c) => ({ value: c.id, label: c.name }))}
                onChange={(value) => setTenantId(value)}
                placeholder="Sélectionner Tenant"
                leftIcon={<FaDatabase />}
                required={true}
            />
            <br />
            <AdminEntityCrudModule<Dataset>
                ref={ref}
                title="Gestion des Dataset"
                icon={<Shield size={20} />}
                entityName="Dataset"
                columns={sourceColumns}
                defaultValue={DEFAULT_FORM}
                service={datasetService}
                defaultTenant={defaultTenant}
                isValid={(r) => r.name.trim().length > 0}
                renderForm={(dataset, setValue, saving) => (
                    <>
                        <FormSelect
                            label={`Tenant`}
                            value={dataset.tenant_id}
                            options={tenants.map((c) => ({ value: c.id, label: c.name }))}
                            onChange={(value) => { setValue("tenant_id", value) }}
                            placeholder="Sélectionner Tenant"
                            leftIcon={<FaDatabase />}
                            required={true}
                        />
                        <FormSelect
                            label={`Datasource`}
                            value={dataset.datasource_id}
                            options={dataSources.map((c) => ({ value: c.id, label: c.name }))}
                            onChange={(value) => { setValue("datasource_id", value) }}
                            leftIcon={<FaDatabase />}
                            required={true}
                        />
                        {dataset.connection && (<FormSelect
                            label={`Connection`}
                            value={dataset.connection_id}
                            options={[{ id: dataset.connection.id, name: dataset.connection.dbname }].map((c) => ({ value: c.id, label: c.name }))}
                            onChange={(value) => { setValue("connection_id", value) }}
                            leftIcon={<FaDatabase />}
                            required={true}
                        />)}
                        <FormSelect
                            label={`Sql Type`}
                            value={dataset.sql_type}
                            options={SqlDatasetTypeList.map((c) => ({ value: c, label: c }))}
                            onChange={(value) => { setValue("sql_type", value) }}
                            leftIcon={<FaDatabase />}

                            required={true}
                        />

                        <FormInput
                            label="Nom"
                            value={dataset.name}
                            onChange={(e) => setValue("name", e.target.value)}
                            leftIcon={<FaDatabase />}
                            required={true}
                        />

                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="flex items-center justify-between">
                                <FormSwitch
                                    label="Use local view"
                                    checked={Boolean(dataset.use_local_view)}
                                    onChange={(e) => setValue("use_local_view", e.target.checked)}
                                />
                            </div>
                        </div>

                        {dataset.use_local_view && (<FormSelect
                            label={`Nom View`}
                            value={dataset.view_name}
                            options={localViews.filter(l => l.type === dataset.sql_type).map((c) => ({ value: c.name, label: c.name }))}
                            onChange={async (value) => {
                                setValue("view_name", value);
                                if (!dataset.sql_type || (value ?? "") === "") return;
                                if (dataset.use_local_view && value) {
                                    const sqlDefinition: SqlWithUtils = await datasetService.getViewSql(value, dataset.sql_type) as any;
                                    if (sqlDefinition) {
                                        setValue("sql", sqlDefinition.sql)
                                        setSqlColumns(sqlDefinition.columns)
                                    }
                                }
                            }}
                            leftIcon={<FaDatabase />}
                            required={true}
                        />)}

                        {dataset.use_local_view && (
                            <FormTextarea
                                label="SQL (auto)"
                                value={dataset.sql || ""}
                                disabled={true}
                                rows={4}
                            />
                        )}

                        <FormMultiSelect
                            label={`Columns`}
                            value={dataset.columns?.map(c => c.name) || []}
                            options={(sqlColumns.length === 0 ? (dataset.columns ?? []) : sqlColumns).map((s) => ({ value: s.name, label: s.name }))}
                            onChange={(values) => {
                                const selectedNames = values?.filter(Boolean) || [];
                                const selectedColumns = sqlColumns.filter(col => selectedNames.includes(col.name));
                                setValue("columns", selectedColumns);
                            }}
                            placeholder="Sélectionner Columns"
                            required={true}
                        />

                        {!dataset.use_local_view && (<FormInput
                            label="Nom View"
                            value={dataset.view_name}
                            onChange={(e) => setValue("view_name", e.target.value)}
                            leftIcon={<FaDatabase />}
                        />)}

                        {!dataset.use_local_view && (<FormTextarea
                            label="SQL"
                            value={dataset.sql || ""}
                            onChange={(e) => setValue("sql", e.target.value)}
                            placeholder="Ex: SELECT * FROM table;"
                            leftIcon={<FaDatabase />}
                            rows={0} cols={0}
                        />)}

                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="flex items-center justify-between">
                                <FormSwitch
                                    label="Active"
                                    checked={Boolean(dataset.is_active)}
                                    onChange={(e) => setValue("is_active", e.target.checked)}
                                />
                            </div>
                        </div>

                        <FormTextarea
                            label="Description"
                            // hint="Optionnel"
                            value={dataset.description || ""}
                            onChange={(e) => setValue("description", e.target.value)}
                            placeholder="Description du orgunit"
                            rows={0} cols={0}
                        />
                    </>
                )}
            />

            {selectedSql && (<Modal
                isOpen={showSql}
                onClose={() => setShowSql(false)}
                title={"SQL - " + selectedDatasetName}
                size="full"
                footer={
                    <div className="flex gap-3">

                        <Button variant="outline" size="sm" onClick={() => {
                            setShowSql(false);
                            setSelectedSql(null);
                        }}>
                            Fermer
                        </Button>

                        <Button
                            className="text-sm px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
                            onClick={() => navigator.clipboard.writeText(selectedSql)}>
                            Copier
                        </Button>
                    </div>
                }
            >

                <div className="flex-1 overflow-auto bg-[#1e1e1e] p-6">
                    <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">
                        {selectedSql}
                    </pre>
                </div>
            </Modal>
            )}


            <Modal
                isOpen={showSqlColumns}
                onClose={() => setShowSqlColumns(false)}
                title={"SQL - Columns"}
                size="sm"
                footer={
                    <div className="flex gap-3">
                        <Button variant="outline" size="sm" onClick={() => {
                            setShowSqlColumns(false);
                            setSelectedColumns([]);
                        }}>
                            Fermer
                        </Button>
                    </div>
                }
            >

                <div className="flex-1 overflow-auto bg-[#1e1e1e] p-6">
                    <table>
                        <tr>
                            <th>Nom</th>
                            <th>Type</th>
                        </tr>
                        {selectedColumns.map(c => (<tr>
                            <td>{c.name}</td>
                            <td>{c.type}</td>
                        </tr>))}
                    </table>
                </div>
            </Modal>

        </>
    );
});
