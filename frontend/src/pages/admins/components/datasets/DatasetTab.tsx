import { Shield } from 'lucide-react';
import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import { StatusBadge } from '@components/ui/Badge/Badge';
import { type Column } from '@components/ui/Table/Table';
import { FormInput } from '@components/forms/FormInput/FormInput';
import { FormTextarea } from '@components/forms/FormTextarea/FormTextarea';
import { Tenant } from '@models/identity.model';
import { FormSelect } from '@components/forms/FormSelect/FormSelect';
import { AdminEntityCrudModuleRef, AdminEntityCrudModule } from '@pages/admins/AdminEntityCrudModule';
import { Dataset, SqlDatasetTypeList, SqlWithUtils } from '@/models/dataset.models';
import { datasetService } from '@/services/dataset.service';
import { datasourceService } from '@/services/datasource.service';
import { FaDatabase } from 'react-icons/fa';
import { DataSource } from '@/models/datasource.models';
import { Modal } from '@/components/ui/Modal/Modal';
import { Button } from '@/components/ui/Button/Button';
import { FormSwitch } from '@/components/forms/FormSwitch/FormSwitch';

const createDefaultForm = (tenant_id: number): Dataset => ({
    id: null,
    name: "",
    tenant_id: tenant_id,
    view_name: "",
    sql: null,
    use_local_view: false,
    sql_type: "matview",
    datasource_id: null,
    connection_id: null,
    description: "",
    is_active: false,
    columns: [],
    version: 1,
    options: {},
    only_execute: false,
    max_rows: null,
    explain: false,
    success_executed: false,
});

/** Textarea that manages its own string state and commits on blur as parsed JSON */
const JsonTextarea = ({ value, onChange }: { value: Record<string, any> | undefined; onChange: (v: Record<string, any>) => void }) => {
    const [str, setStr] = useState(() => JSON.stringify(value ?? {}, null, 2));
    const [jsonError, setJsonError] = useState<string | null>(null);
    return (
        <FormTextarea
            label="Options (JSON)"
            hint={'Optionnel - objet JSON ex: {"key": "value"}'}
            value={str}
            onChange={(e) => { setStr(e.target.value); setJsonError(null); }}
            onBlur={() => {
                try {
                    onChange(JSON.parse(str));
                    setJsonError(null);
                } catch {
                    setJsonError("JSON invalide");
                }
            }}
            error={jsonError ?? undefined}
            rows={3}
        />
    );
};

const getSourceColumns = (openSqlModal: (ds: Dataset) => void): Column<Dataset>[] => [
    { key: "name", header: "Nom", sortable: true, searchable: true },
    {
        key: "sql", header: "SQL", align: "center",
        render: (ds) => ds.sql ? <Button onClick={() => openSqlModal(ds)}>Voir SQL</Button> : "",
    },
    { key: "sql_type", header: "Sql type", sortable: true, searchable: true },
    { key: "tenant", header: "Tenant", render: (ds) => ds.tenant?.name ?? "", sortable: true, searchable: true },
    { key: "datasource", header: "Datasource", render: (ds) => ds.datasource?.name ?? "", sortable: true, searchable: true },
    { key: "description", header: "Description", sortable: true, searchable: true },
    {
        key: "is_active", header: "Active", sortable: true, align: "center",
        render: (ou) => <StatusBadge isActive={ou.is_active === true} />, searchable: false,
    },
    { key: "version", header: "Version", sortable: true, align: "center", render: (ds) => ds.version ?? "", searchable: false },
];

interface DatasetTabProps {
    tenants: Tenant[];
    tenant_id: number;
}

export const DatasetTab = forwardRef<AdminEntityCrudModuleRef, DatasetTabProps>(({ tenants, tenant_id }, ref) => {
    const [dataSources, setDataSources] = useState<DataSource[]>([]);
    const [localViews, setLocalViews] = useState<{ name: string; type: string }[]>([]);
    const [selectedDatasetName, setSelectedDatasetName] = useState<string>("");
    const [selectedSql, setSelectedSql] = useState<string | null>(null);
    const [showSql, setShowSql] = useState<boolean>(false);

    const openSqlModal = (ds: Dataset) => {
        setSelectedSql(ds.sql ?? "");
        setSelectedDatasetName(ds.name);
        setShowSql(true);
    };

    const sourceColumns = useMemo(() => getSourceColumns(openSqlModal), []);

    const didLoad = useRef(false);

    const loadDataSource = (tenantId: number) => {
        datasourceService.all(tenantId).then(d => setDataSources(d || []));
    };

    useEffect(() => {
        if (!tenant_id) return;
        loadDataSource(tenant_id);
    }, [tenant_id]);

    useEffect(() => {
        if (didLoad.current) return;
        didLoad.current = true;
        datasetService.getLocalViews().then(l => setLocalViews((l as any) || []));
    }, []);

    const defaultTenant = useMemo(() => ({ required: true, ids: [tenant_id] }), [tenant_id]);
    const DEFAULT_FORM = useMemo(() => createDefaultForm(tenant_id), [tenant_id]);

    return (
        <>
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
                renderForm={(dataset, setValue, _saving) => {
                    const isUpdate = Boolean(dataset.id);
                    return (
                        <>
                            {/* ── Datasource, Connection, Sql Type : création uniquement ── */}
                            {!isUpdate && <>
                                <FormSelect
                                    label="Datasource"
                                    value={dataset.datasource_id}
                                    options={dataSources.map((c) => ({ value: c.id, label: c.name }))}
                                    onChange={(value) => setValue("datasource_id", value)}
                                    leftIcon={<FaDatabase />}
                                    required
                                />
                                {dataset.connection && (
                                    <FormSelect
                                        label="Connection"
                                        value={dataset.connection_id}
                                        options={[{ id: dataset.connection.id, name: dataset.connection.dbname }].map((c) => ({ value: c.id, label: c.name }))}
                                        onChange={(value) => setValue("connection_id", value)}
                                        leftIcon={<FaDatabase />}
                                        required
                                    />
                                )}
                                <FormSelect
                                    label="Sql Type"
                                    value={dataset.sql_type}
                                    options={SqlDatasetTypeList.map((c) => ({ value: c, label: c }))}
                                    onChange={(value) => setValue("sql_type", value)}
                                    leftIcon={<FaDatabase />}
                                    required
                                />
                            </>}

                            {/* ── Champs toujours visibles ── */}
                            <FormInput
                                label="Nom"
                                value={dataset.name}
                                onChange={(e) => setValue("name", e.target.value)}
                                leftIcon={<FaDatabase />}
                                required
                            />

                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <FormSwitch
                                    label="Utiliser une vue locale"
                                    checked={Boolean(dataset.use_local_view)}
                                    onChange={(e) => setValue("use_local_view", e.target.checked)}
                                />
                            </div>

                            {dataset.use_local_view && (
                                <FormSelect
                                    label="Sélectionner la vue"
                                    value={dataset.view_name}
                                    options={localViews.filter(l => l.type === dataset.sql_type).map((c) => ({ value: c.name, label: c.name }))}
                                    onChange={async (value) => {
                                        setValue("view_name", value);
                                        if (!dataset.sql_type || !value) return;
                                        const sqlDef: SqlWithUtils = await datasetService.getViewSql(value, dataset.sql_type) as any;
                                        if (sqlDef) setValue("sql", sqlDef.sql);
                                    }}
                                    leftIcon={<FaDatabase />}
                                    required
                                />
                            )}
                            {dataset.use_local_view
                                ? <FormTextarea label="SQL (auto)" value={dataset.sql || ""} disabled rows={4} />
                                : <FormTextarea
                                    label="SQL"
                                    value={dataset.sql || ""}
                                    onChange={(e) => setValue("sql", e.target.value)}
                                    placeholder="Ex: SELECT * FROM table;"
                                    rows={4}
                                  />
                            }

                            {/* ── Nouveaux champs ── */}
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <FormSwitch
                                    label="Exécution seule"
                                    checked={Boolean(dataset.only_execute)}
                                    onChange={(e) => setValue("only_execute", e.target.checked)}
                                />
                                <FormSwitch
                                    label="Mode Explain"
                                    checked={Boolean(dataset.explain)}
                                    onChange={(e) => setValue("explain", e.target.checked)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormSwitch
                                    label="Exécution réussie"
                                    checked={Boolean(dataset.success_executed)}
                                    onChange={(e) => setValue("success_executed", e.target.checked)}
                                />
                                <FormInput
                                    label="Lignes max"
                                    type="number"
                                    value={dataset.max_rows ?? ""}
                                    onChange={(e) => setValue("max_rows", e.target.value ? Number(e.target.value) : null)}
                                />
                            </div>

                            <JsonTextarea
                                value={dataset.options}
                                onChange={(v) => setValue("options", v)}
                            />

                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <FormSwitch
                                    label="Actif"
                                    checked={Boolean(dataset.is_active)}
                                    onChange={(e) => setValue("is_active", e.target.checked)}
                                />
                            </div>

                            <FormTextarea
                                label="Description"
                                value={dataset.description || ""}
                                onChange={(e) => setValue("description", e.target.value)}
                                placeholder="Description du dataset"
                                rows={2}
                            />
                        </>
                    );
                }}
            />

            {selectedSql && (
                <Modal
                    isOpen={showSql}
                    onClose={() => setShowSql(false)}
                    title={"SQL — " + selectedDatasetName}
                    size="full"
                    footer={
                        <div className="flex gap-3">
                            <Button variant="outline" size="sm" onClick={() => { setShowSql(false); setSelectedSql(null); }}>
                                Fermer
                            </Button>
                            <Button onClick={() => navigator.clipboard.writeText(selectedSql)}>
                                Copier
                            </Button>
                        </div>
                    }
                >
                    <div className="flex-1 overflow-auto bg-[#1e1e1e] p-6">
                        <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">{selectedSql}</pre>
                    </div>
                </Modal>
            )}
        </>
    );
});
