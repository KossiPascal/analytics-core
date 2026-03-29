import { useEffect, useMemo, useState } from "react";
import { Database, Filter, ArrowUpDown, Play, Loader2 } from "lucide-react";
import { Button } from "@components/ui/Button/Button";
import { Modal } from "@components/ui/Modal/Modal";
import { scriptStore } from "@/stores/scripts.store";
import { Dataset, DatasetQuery, LinkedFilterGroup, QueryJson } from "@/models/dataset.models";
import { DatasetFilterBuilder } from "./components/DatasetFilterBuilder";
import { DatasetOrderByBuilder } from "./components/DatasetOrderByBuilder";
import { DatasetPreviewModal } from "./components/DatasetPreviewModal";
import { compileDatasetQuery } from "./components/compileDatasetQuery";
import { CompileError } from "./components/model";

import ResultsTable from "./components/ResultsTable";
import CodeEditorButtons from "./components/CodeEditorButtons";

import styles from "./QueryBuilderInterface.module.css";
import CodeEditor from "./components/CodeEditor";
import { DatasetQueryPanel } from "./components/DatasetQueryPanel";


interface QueryBuilderInterfaceProps {
    stateQuery: DatasetQuery
    datasets: Dataset[]
    tenant_id: number | undefined
    defaultQueryForm: DatasetQuery
    onAfterSave: ((id: number|undefined) => void)
}



const QueryBuilderInterface: React.FC<QueryBuilderInterfaceProps> = ({ stateQuery, tenant_id, datasets, defaultQueryForm, onAfterSave }) => {
    const { setScript, generateScript, execute, executing } = scriptStore();

    /* ---- Modal visibility ---- */
    const [showQueryPanel, setShowQueryPanel] = useState(false);
    const [showResultsModal, setShowResultsModal] = useState(false);
    const [showWhereModal, setShowWhereModal] = useState(false);
    const [showHavingModal, setShowHavingModal] = useState(false);
    const [showOrderByModal, setShowOrderByModal] = useState(false);
    const [previewSql, setPreviewSql] = useState<string | null>(null);
    const [query, setQuery] = useState<DatasetQuery | null>(null);
    const [errors, setErrors] = useState<CompileError>({});
    const [tempWhere, setTempWhere] = useState<LinkedFilterGroup[]>([]);
    const [tempHaving, setTempHaving] = useState<LinkedFilterGroup[]>([]);
    const [tempOrderBy, setTempOrderBy] = useState<QueryJson["order_by"]>([]);

    useEffect(() => {
        if (!tenant_id) return;
        if (stateQuery) {
            setQuery(stateQuery);
            if (stateQuery.compiled_sql) setScript(generateScript(stateQuery.compiled_sql));
        } else {
            setQuery(prev => prev?.id ? prev : defaultQueryForm);
        }
    }, [tenant_id]);


    const setValue = (k: keyof DatasetQuery, v: any) => setQuery(prev => prev ? { ...prev, [k]: v } : prev);

    /* ---- Derived ---- */
    const dataset = useMemo(() => datasets.find(d => d.id === query?.dataset_id) ?? null, [datasets, query?.dataset_id]);
    const fields = useMemo(() => dataset?.fields || [], [dataset]);
    const dimensionFields = useMemo(() => fields.filter(f => f.field_type === "dimension"), [fields]);
    const metricFields = useMemo(() => fields.filter(f => f.field_type !== "dimension"), [fields]);
    const hasSelectJson = useMemo(() => {
        const dims = query?.query_json?.select?.dimensions?.length ?? 0;
        const mets = query?.query_json?.select?.metrics?.length ?? 0;
        return dims > 0 || mets > 0;
    }, [query?.query_json?.select]);

    /* ---- Recompile & push SQL to editor ---- */
    const recompileAndPush = (updatedQueryJson: QueryJson) => {
        if (!dataset || !query) return;
        const { sql, values, error } = compileDatasetQuery(dataset, fields, updatedQueryJson);
        const hasError = Object.keys(error).length > 0;
        setQuery(prev => prev ? {
            ...prev, query_json: updatedQueryJson,
            compiled_sql: hasError ? prev.compiled_sql : sql,
            values: hasError ? prev.values : values,
        } : prev);
        if (!hasError) setScript(generateScript(sql));
    };

    /* ---- Sub-modal open/confirm ---- */
    const openWhereModal = () => {
        setTempWhere(query?.query_json.filters.where ?? []);
        setShowWhereModal(true);
    };

    const openHavingModal = () => {
        setTempHaving(query?.query_json.filters.having ?? []);
        setShowHavingModal(true);
    };

    const openOrderByModal = () => {
        setTempOrderBy(query?.query_json.order_by ?? []);
        setShowOrderByModal(true);
    };

    const confirmWhere = () => {
        if (!query) return;
        recompileAndPush({ ...query.query_json, filters: { ...query.query_json.filters, where: tempWhere } });
        setShowWhereModal(false);
    };
    const confirmHaving = () => {
        if (!query) return;
        recompileAndPush({ ...query.query_json, filters: { ...query.query_json.filters, having: tempHaving } });
        setShowHavingModal(false);
    };
    const confirmOrderBy = () => {
        if (!query) return;
        recompileAndPush({ ...query.query_json, order_by: tempOrderBy });
        setShowOrderByModal(false);
    };

    /* ---- SQL injection into editor ---- */
    const handleUseSql = (sql: string) => {
        setScript(generateScript(sql));
        setShowQueryPanel(false);
    };

    /* ---- Execute compiled query ---- */
    const handleExecuteQuery = async () => {
        if (!query?.compiled_sql) return;
        setScript(generateScript(query.compiled_sql));
        await execute();
        setShowResultsModal(true);
    };

    const whereCount = useMemo(() => (query?.query_json.filters.where ?? []).filter(g => g.node !== null).length, [query?.query_json.filters.where]);
    const havingCount = useMemo(() => (query?.query_json.filters.having ?? []).filter(g => g.node !== null).length, [query?.query_json.filters.having]);
    const orderByCount = useMemo(() => (query?.query_json.order_by ?? []).filter(o => o.field_id > 0).length, [query?.query_json.order_by]);

    return (
        <div className={styles.container}>
            <div className={styles.grid}>

                {/* SIDEBAR */}
                <aside className={`${styles.sidebar} ${styles.compactCard}`}>
                    <Button variant="outline" size="sm" onClick={() => setShowQueryPanel(true)}>
                        <Database size={16} />
                        Informations générales
                    </Button>
                    {query?.compiled_sql && (
                        <Button variant="primary" size="sm" onClick={handleExecuteQuery} disabled={executing}>
                            {executing ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                            {executing ? "Exécution..." : "Exécuter la requête"}
                        </Button>
                    )}
                    {/* FILTER BUTTONS */}
                    {dataset && hasSelectJson && (
                        <div className={styles.cardHeader} style={{ flexDirection: "column", alignItems: "stretch", gap: "0.5rem" }}>

                            <div className={styles.cardTitle}>
                                <div className={styles.cardIcon}><Filter size={16} /></div>
                                <span>Filtres & Tri</span>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                                <Button variant="outline" size="sm" onClick={openWhereModal} style={{ justifyContent: "space-between" }}>
                                    <span><Filter size={13} style={{ marginRight: 4 }} />Where Filters</span>
                                    {whereCount > 0 && <span style={{ fontSize: "0.7rem", background: "#dbeafe", color: "#1d4ed8", borderRadius: "999px", padding: "0 6px" }}>{whereCount}</span>}
                                </Button>
                                <Button variant="outline" size="sm" onClick={openHavingModal} style={{ justifyContent: "space-between" }}>
                                    <span><Filter size={13} style={{ marginRight: 4 }} />Having Filters</span>
                                    {havingCount > 0 && <span style={{ fontSize: "0.7rem", background: "#dbeafe", color: "#1d4ed8", borderRadius: "999px", padding: "0 6px" }}>{havingCount}</span>}
                                </Button>
                                <Button variant="outline" size="sm" onClick={openOrderByModal} style={{ justifyContent: "space-between" }}>
                                    <span><ArrowUpDown size={13} style={{ marginRight: 4 }} />Order By</span>
                                    {orderByCount > 0 && <span style={{ fontSize: "0.7rem", background: "#dbeafe", color: "#1d4ed8", borderRadius: "999px", padding: "0 6px" }}>{orderByCount}</span>}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* SAVED QUERIES */}
                </aside>

                {/* MAIN CONTENT */}
                <main className={styles.mainContent}>
                    <div className={`${styles.editorSection} ${styles.compactCard}`}>
                        <div className={styles.cardHeader}>
                            <div className={styles.cardTitle}>
                                <CodeEditorButtons
                                    onExecuteComplete={() => setShowResultsModal(true)}
                                    query={query}
                                    onAfterSave={onAfterSave}
                                />
                            </div>
                        </div>
                        <div className={styles.cardBody}>
                            <CodeEditor />
                        </div>
                    </div>
                </main>
            </div>

            {/* DATASET QUERY PANEL MODAL */}
            <Modal isOpen={showQueryPanel} onClose={() => setShowQueryPanel(false)} title="Générateur de requêtes" size="xl">
                {query && tenant_id ? (
                    <DatasetQueryPanel
                        query={query}
                        datasets={datasets}
                        tenant_id={tenant_id}
                        errors={errors}
                        defaultForm={defaultQueryForm}
                        setValue={setValue}
                        setPreviewSql={setPreviewSql}
                        setErrors={setErrors}
                        onUseSql={handleUseSql}
                    />
                ) : (
                    <p className="text-gray-500 text-sm p-4">Chargement...</p>
                )}
            </Modal>

            {/* RESULTS MODAL */}
            <Modal isOpen={showResultsModal} onClose={() => setShowResultsModal(false)} title="Résultats de l'exécution" size="xl">
                <ResultsTable />
            </Modal>

            {/* SQL PREVIEW MODAL */}
            <DatasetPreviewModal title="SQL Preview" open={Boolean(previewSql)} data={previewSql || ""} onClose={() => setPreviewSql(null)} type="sql" />

            {/* WHERE FILTERS SUB-MODAL */}
            <Modal isOpen={showWhereModal} onClose={() => setShowWhereModal(false)} title="Where Filters" size="lg">
                <div className="space-y-4">
                    <DatasetFilterBuilder name="Where Filters" fields={dimensionFields} node={tempWhere} onChange={setTempWhere} />
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" size="sm" onClick={() => setShowWhereModal(false)}>Annuler</Button>
                        <Button variant="primary" size="sm" onClick={confirmWhere}><Play size={13} /> Confirmer</Button>
                    </div>
                </div>
            </Modal>

            {/* HAVING FILTERS SUB-MODAL */}
            <Modal isOpen={showHavingModal} onClose={() => setShowHavingModal(false)} title="Having Filters" size="lg">
                <div className="space-y-4">
                    <DatasetFilterBuilder name="Having Filters" fields={metricFields} node={tempHaving} onChange={setTempHaving} />
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" size="sm" onClick={() => setShowHavingModal(false)}>Annuler</Button>
                        <Button variant="primary" size="sm" onClick={confirmHaving}><Play size={13} /> Confirmer</Button>
                    </div>
                </div>
            </Modal>

            {/* ORDER BY SUB-MODAL */}
            <Modal isOpen={showOrderByModal} onClose={() => setShowOrderByModal(false)} title="Order By" size="md">
                <div className="space-y-4">
                    <DatasetOrderByBuilder fields={fields} orderBy={tempOrderBy} onChange={setTempOrderBy} error={errors.order_by} />
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" size="sm" onClick={() => setShowOrderByModal(false)}>Annuler</Button>
                        <Button variant="primary" size="sm" onClick={confirmOrderBy}><Play size={13} /> Confirmer</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );

    // return (
    //     <PageWrapper title="Query Builder" subtitle="Créer script vos scripts ici">
    //         {QeryBuilderContent}
    //     </PageWrapper>
    // );
};

export default QueryBuilderInterface;
