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
import { Save } from 'lucide-react';

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
    is_active: true,
    is_public: false,
    columns: [],
    version: 1,
    options: {},
    max_rows: null,
    explain: false,
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
    {
        key: "values", header: "Sql Values", sortable: true, searchable: true,
        render: (ds) => JSON.stringify(ds.values ?? {}),
    },
    {
        key: "options", header: "Sql Options", sortable: true, searchable: true,
        render: (ds) => JSON.stringify(ds.options ?? {}),
    },

    { key: "sql_type", header: "Sql type", sortable: true, searchable: true },
    { key: "tenant", header: "Tenant", render: (ds) => ds.tenant?.name ?? "", sortable: true, searchable: true },
    { key: "datasource", header: "Datasource", render: (ds) => ds.datasource?.name ?? "", sortable: true, searchable: true },
    { key: "description", header: "Description", sortable: true, searchable: true },
    {
        key: "is_active", header: "Active", sortable: true, align: "center",
        render: (ou) => <StatusBadge isActive={ou.is_active === true} />, searchable: false,
    },
    {
        key: "is_public", header: "Is public", sortable: true, align: "center",
        render: (ou) => <StatusBadge isActive={ou.is_public === true} />, searchable: false,
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
    const [validatedSqlResult, setValidatedSqlResult] = useState<{ columns: string[]; rows: Record<string, any>[]; } | null>(null);
    const [hoveredRow, setHoveredRow] = useState<number | null>(null);
    const [validating, setValidating] = useState<boolean>(false);

    const openSqlModal = (ds: Dataset) => {
        setSelectedSql(ds.sql);
        setSelectedDatasetName(ds.name);
    };

    const sourceColumns = useMemo(() => getSourceColumns(openSqlModal), []);

    const didLoad = useRef(false);

    const loadDataSource = (tenantId: number) => {
        datasourceService.list(tenantId).then(d => setDataSources(d || []));
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


    const renderCell = (value: any) => {
        if (value === null || value === undefined) return <span className="text-gray-400">NULL</span>;
        if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
        if (typeof value === "object") return JSON.stringify(value);
        return value.toString();
    };

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
                formActionsButtons={({ entity, isFormValid, saving, close }) => (
                    <Button
                        variant="secondary"
                        size="sm"
                        disabled={!isFormValid || saving || validating}
                        onClick={async () => {
                            try {
                                setValidating(true);
                                const res = await datasetService.validateSql(entity);
                                const rows = Array.isArray(res?.rows) ? res.rows : [];
                                const has_data = rows.length > 0 && typeof rows[0] === "object";
                                const columns = has_data && rows.length > 0 ? Object.keys(rows[0]) : [];
                                setValidatedSqlResult({ columns, rows });
                            } catch (error) {
                                setValidatedSqlResult({ columns: [], rows: [] });
                            } finally {
                                setValidating(false);
                                // close(false);
                            }
                        }}
                    >
                        <Save size={16} />
                        {validating ? "Validation Sql ..." : "Valider Sql"}
                    </Button>
                )}
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

                            <FormTextarea
                                label="SQL"
                                value={dataset.sql || ""}
                                onChange={(e) => setValue("sql", e.target.value)}
                                placeholder="Ex: SELECT * FROM table;"
                                rows={4}
                            />

                            {/* ── Nouveaux champs ── */}
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <FormSwitch
                                    label="Mode Explain"
                                    checked={Boolean(dataset.explain)}
                                    onChange={(e) => setValue("explain", e.target.checked)}
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
                                <FormSwitch
                                    label="Is public"
                                    checked={Boolean(dataset.is_public)}
                                    onChange={(e) => setValue("is_public", e.target.checked)}
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
                    isOpen={true}
                    onClose={() => setSelectedSql(null)}
                    title={"SQL — " + selectedDatasetName}
                    size="full"
                    footer={
                        <div className="flex gap-3">
                            <Button variant="outline" size="sm" onClick={() => setSelectedSql(null)}>
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


            {validatedSqlResult && (
                <Modal
                    isOpen={true}
                    onClose={() => setValidatedSqlResult(null)}
                    title={"Résultat SQL"}
                    size="full"
                    footer={
                        <div className="flex gap-3">
                            <Button variant="outline" size="sm" onClick={() => setValidatedSqlResult(null)}>
                                Fermer
                            </Button>
                        </div>
                    }
                >
                    <table className="min-w-full border-collapse text-sm">
                        <thead className="bg-gray-100 sticky top-0">
                            <tr>
                                {validatedSqlResult.columns.map((key) => (
                                    <th key={key} className="px-4 py-2 border text-left font-semibold">
                                        {key}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {validatedSqlResult.rows.map((row, i) => (
                                <tr
                                    key={i}
                                    onMouseEnter={() => setHoveredRow(i)}
                                    onMouseLeave={() => setHoveredRow(null)}
                                    className={hoveredRow === i ? "bg-gray-50" : ""}
                                >
                                    {validatedSqlResult.columns.map((col) => (
                                        <td key={col} className="px-4 py-2 border">
                                            {renderCell(row[col])}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Modal>
            )}
        </>
    );
});
