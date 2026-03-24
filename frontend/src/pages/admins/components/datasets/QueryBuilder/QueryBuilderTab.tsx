import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Database, RefreshCw, Filter, ArrowUpDown, Play, Loader2, FolderOpen } from "lucide-react";
import { Button } from "@components/ui/Button/Button";
import { Modal } from "@components/ui/Modal/Modal";
import { DatasetQueryPanel } from "./components/DatasetQueryPanel";
import { DatasetFilterBuilder } from "../DatasetQueries/components/DatasetFilterBuilder";
import { DatasetOrderByBuilder } from "../DatasetQueries/components/DatasetOrderByBuilder";
import { DatasetPreviewModal } from "../DatasetQueries/components/DatasetPreviewModal";
import { compileDatasetQuery } from "../DatasetQueries/components/compileDatasetQuery";
import { CompileError } from "../DatasetQueries/components/model";
import { scriptStore } from "@/stores/scripts.store";
import { useAuth } from "@contexts/AuthContext";
import { datasetService, queryService } from "@/services/dataset.service";
import { Dataset, DatasetQuery, LinkedFilterGroup, QueryJson } from "@/models/dataset.models";
import { PageWrapper } from "@/components/layout/PageWrapper/PageWrapper";
import styles from "./QueryBuilder.module.css";
import CodeEditor from "./components/CodeEditor";
import ResultsTable from "./components/ResultsTable";
import CodeEditorButtons from "./components/CodeEditorButtons";

interface QueryBuilderPageProps {
  embedded?: boolean;
}

const createDefaultQuery = (tenant_id: number): DatasetQuery => ({
  id: null, name: "", tenant_id, dataset_id: null,
  query_json: {
    select: { dimensions: [], metrics: [] },
    order_by: [],
    filters: {
      where: [],
      having: [],
    },
    limit: null, offset: null,
  },
  compiled_sql: "", values: {}, description: "", is_active: true, fields_ids: [],
});

const QueryBuilderPage: React.FC<QueryBuilderPageProps> = ({ embedded = false }) => {
  const { setScript, defaultScript, execute, executing } = scriptStore();
  const { user } = useAuth();
  const location = useLocation();
  const stateQuery = (location.state as any)?.query as DatasetQuery | undefined;

  /* ---- Modal visibility ---- */
  const [showQueryPanel, setShowQueryPanel] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showWhereModal, setShowWhereModal] = useState(false);
  const [showHavingModal, setShowHavingModal] = useState(false);
  const [showOrderByModal, setShowOrderByModal] = useState(false);
  const [previewSql, setPreviewSql] = useState<string | null>(null);

  /* ---- Dataset query state ---- */
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [tenant_id, setTenantId] = useState<number | undefined>();
  const [query, setQuery] = useState<DatasetQuery | null>(null);
  const [errors, setErrors] = useState<CompileError>({});

  /* ---- Saved queries ---- */
  const [savedQueries, setSavedQueries] = useState<DatasetQuery[]>([]);

  /* ---- Temp state for sub-modals ---- */
  const [tempWhere, setTempWhere] = useState<LinkedFilterGroup[]>([]);
  const [tempHaving, setTempHaving] = useState<LinkedFilterGroup[]>([]);
  const [tempOrderBy, setTempOrderBy] = useState<QueryJson["order_by"]>([]);

  const loaded = useRef(false);
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    const tid = user?.tenant_id;
    setTenantId(tid);
    if (!stateQuery && tid) setQuery(createDefaultQuery(tid));
  }, []);

  useEffect(() => {
    if (!tenant_id) return;
    datasetService.allWithRelations(tenant_id).then(d => {
      setDatasets(d || []);
      if (stateQuery) {
        setQuery(stateQuery);
        if (stateQuery.compiled_sql) setScript(defaultScript(stateQuery.compiled_sql));
      } else {
        setQuery(prev => prev?.id ? prev : createDefaultQuery(tenant_id));
      }
    });
  }, [tenant_id]);

  useEffect(() => {
    if (!tenant_id || !query?.dataset_id) { setSavedQueries([]); return; }
    queryService.list(tenant_id, query.dataset_id).then(q => setSavedQueries(q || []));
  }, [tenant_id, query?.dataset_id]);

  
  const defaultForm = useMemo(() => createDefaultQuery(tenant_id ?? 0), [tenant_id]);

  const setValue = (k: keyof DatasetQuery, v: any) =>
    setQuery(prev => prev ? { ...prev, [k]: v } : prev);

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
    if (!hasError) setScript(defaultScript(sql));
  };

  /* ---- Sub-modal open/confirm ---- */
  const openWhereModal = () => { setTempWhere(query?.query_json.filters.where ?? []); setShowWhereModal(true); };
  const openHavingModal = () => { setTempHaving(query?.query_json.filters.having ?? []); setShowHavingModal(true); };
  const openOrderByModal = () => { setTempOrderBy(query?.query_json.order_by ?? []); setShowOrderByModal(true); };

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

  /* ---- Load saved query into builder ---- */
  const handleLoadQuery = (saved: DatasetQuery) => {
    setQuery(saved);
    if (saved.compiled_sql) setScript(defaultScript(saved.compiled_sql));
  };

  /* ---- SQL injection into editor ---- */
  const handleUseSql = (sql: string) => {
    setScript(defaultScript(sql));
    setShowQueryPanel(false);
  };

  /* ---- Execute compiled query ---- */
  const handleExecuteQuery = async () => {
    if (!query?.compiled_sql) return;
    setScript(defaultScript(query.compiled_sql));
    await execute();
    setShowResultsModal(true);
  };

  const whereCount = (query?.query_json.filters.where ?? []).filter(g => g.node !== null).length;
  const havingCount = (query?.query_json.filters.having ?? []).filter(g => g.node !== null).length;
  const orderByCount = (query?.query_json.order_by ?? []).filter(o => o.field_id > 0).length;

  const content = (
    <div className={styles.container}>
      <div className={styles.grid}>

        {/* SIDEBAR */}
        <aside className={`${styles.sidebar} ${styles.compactCard}`}>
          <Button variant="outline" size="sm" onClick={() => setShowQueryPanel(true)}>
            <Database size={16} />
            Informations générales
          </Button>
          {query?.compiled_sql && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleExecuteQuery}
              disabled={executing}
            >
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
          {savedQueries.length > 0 && (
            <>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitle}>
                  <div className={styles.cardIcon}><FolderOpen size={16} /></div>
                  <span>Requêtes sauvegardées</span>
                </div>
                <Button
                  variant="ghost" size="sm" title="Rafraîchir"
                  onClick={() => tenant_id && query?.dataset_id && queryService.list(tenant_id, query.dataset_id).then(q => setSavedQueries(q || []))}
                >
                  <RefreshCw size={16} />
                </Button>
              </div>
              <div className={styles.cardBody} style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                {savedQueries.map(sq => (
                  <button
                    key={sq.id}
                    onClick={() => handleLoadQuery(sq)}
                    title={sq.description || sq.name}
                    style={{
                      textAlign: "left", padding: "0.4rem 0.6rem", borderRadius: "6px",
                      fontSize: "0.78rem", cursor: "pointer", border: "none",
                      background: query?.id === sq.id ? "#dbeafe" : "transparent",
                      color: query?.id === sq.id ? "#1d4ed8" : "#374151",
                      fontWeight: query?.id === sq.id ? 600 : 400,
                    }}
                    onMouseEnter={e => { if (query?.id !== sq.id) (e.currentTarget as HTMLElement).style.background = "#f3f4f6"; }}
                    onMouseLeave={e => { if (query?.id !== sq.id) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    {sq.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </aside>

        {/* MAIN CONTENT */}
        <main className={styles.mainContent}>
          <div className={`${styles.editorSection} ${styles.compactCard}`}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>
                <CodeEditorButtons
                  onExecuteComplete={() => setShowResultsModal(true)}
                  query={query}
                  onAfterSave={(id) => {
                    setValue("id", id);
                    if (tenant_id && query?.dataset_id)
                      queryService.list(tenant_id, query.dataset_id).then(q => setSavedQueries(q || []));
                  }}
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
            defaultForm={defaultForm}
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

  if (embedded) return content;

  return (
    <PageWrapper title="Query Builder" subtitle="Créer script vos scripts ici">
      {content}
    </PageWrapper>
  );
};

export default QueryBuilderPage;
