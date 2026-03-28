import { useEffect, useMemo, useRef, useState } from "react";
import { FormSelect } from "@/components/forms/FormSelect/FormSelect";
import { useAuth } from "@/contexts/AuthContext";
import { tenantService } from "@/services/identity.service";
import { visualizationService } from "@/services/visualization.service";
import { BreakPointType, toVisualizationForm, Visualization, VisualizationForm } from "@/models/visualization.model";
import { Tenant } from "@/models/identity.model";
import { AskConfirmProps, ConfirmStateProps, defaultConfirmState, STATUS, ViewGridOrListModeBtn } from "./components/VisualizationUtils";
import { ConfirmModal } from "@components/ui/ConfirmModal/ConfirmModal";
import { RenamesOptionsModal } from "../admins/components/datasets/DatasetCharts/components/chart-utils/RenamesOptionsModal";
import { Layout } from "react-grid-layout";
import { BuildVisualizationView } from "./components/BuildVisualizationView";
import { VisualizationFormBuilder } from "./components/VisualizationFormBuilder";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";


const getDefaultForm = (): VisualizationForm => ({
  id: undefined,
  tenant_id: undefined,
  name: "",
  type: "dashboard",
  description: "",
  status: "draft",
  is_template: false,

  layout: {
    id: undefined,
    version: undefined,
    dataset_id: undefined,
    items: { lg: [], md: [], sm: [] },
    options: {}
  },
  definition: {
    id: undefined,
    version: undefined,
    config: {},
    filters: {}
  },
  charts: [],
  view: {
    id: undefined,
    layout_id: undefined,
    name: "Default",
    is_default: false,
    tenant_id: undefined,
    visualization_id: undefined
  },
});


type ViewMode = 'grid' | 'list';

export default function VisualizationHome() {

  const { user } = useAuth();

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenant_id, setTenantId] = useState<number>();

  // const [datasets, setDatasets] = useState<Dataset[]>([]);
  // const [dataset_id, setDatasetId] = useState<number | undefined>(undefined);

  // const [charts, setCharts] = useState<DatasetChart[]>([]);
  // const [chart_id, setChartId] = useState<number | undefined>(undefined);

  const [visualizations, setVisualizations] = useState<Visualization[]>([]);
  const [form, setForm] = useState<VisualizationForm>(getDefaultForm());
  const [editing, setEditing] = useState<Visualization | null>(null);
  const [open, setOpen] = useState<boolean>(false);
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [cardsLayout, setCardsLayout] = useState<Record<BreakPointType, Layout>>({ lg: [], md: [], sm: [] });



  // ── Confirmation modal ──
  const [confirmState, setConfirmState] = useState<ConfirmStateProps>(defaultConfirmState);

  const askConfirm = (p: AskConfirmProps) => {
    return setConfirmState({
      isOpen: true,
      title: p.title,
      message: p.message,
      onConfirm: p.onConfirm
    });
  }

  const closeConfirm = () => setConfirmState(s => ({ ...s, isOpen: false }));
  const didLoad = useRef(false);

  // ---------------- INIT ----------------
  useEffect(() => {
    if (didLoad.current) return;
    didLoad.current = true;

    tenantService.list().then(t => {
      setTenants(t || []);
      setTenantId(user?.tenant_id);
    });
  }, []);

  const fetchVisualizations = () => {
    if (!tenant_id) return;
    visualizationService.list(tenant_id).then(res => {
      setVisualizations(res || []);
    });
  }

  // ---------------- FETCH ----------------
  useEffect(() => {
    if (!tenant_id) return;
    fetchVisualizations();
    // datasetService.list(tenant_id).then(res => setDatasets(res || []));
  }, [tenant_id]);


  // const fetchCharts = () => {
  //   if (!tenant_id || !dataset_id) return;
  //   chartService.list(tenant_id, dataset_id).then(res => setCharts(res || []));
  // };

  // useEffect(() => {
  //   if (!tenant_id || !dataset_id) return;
  //   fetchCharts();
  // }, [tenant_id, dataset_id]);



  const removeView = async (id: number | undefined) => {
    if (!id) return;
    const viz = visualizations.find(v => v.id === id);
    askConfirm({
      title: 'Supprimer la visualisation',
      message: `"${viz?.name || id}" sera définitivement supprimée. Cette action est irréversible.`,
      onConfirm: async () => {
        await visualizationService.remove(id);
        fetchVisualizations();
      }
    });
  };

  const create = () => {
    setEditing(null);
    setForm(getDefaultForm());
    setOpen(true);
  };

  const editView = (v: Visualization) => {
    setEditing(v);
    setForm(toVisualizationForm(v));
    setOpen(true);
  };
  // ---------------- FILTER ----------------
  const filtered = useMemo(() => {
    return visualizations.filter(v =>
      v.name.toLowerCase().includes(search.toLowerCase()) &&
      (statusFilter ? v.status === statusFilter : true)
    );
  }, [visualizations, search, statusFilter]);


  const workflowAction = async (id: number, action: string) => {
    await fetch(`/api/visualizations/${id}/${action}`, { method: "POST" });
    fetchVisualizations();
  };

  const openView = async (viz: Visualization) => {
    window.open(`/dashboard/${viz.id}`)
  }

  // Renvoie le layout le plus récent
  const getActiveLayout = (viz: Visualization) => {
    if (!Array.isArray(viz.layouts) || viz.layouts.length === 0) return null;
    // trier par version descendante
    const sorted = [...viz.layouts].sort((a, b) => (b.version ?? 1) - (a.version ?? 1));
    return sorted[0]; // layout le plus récent
  };

  // Calcule la hauteur (en unités de rowHeight=80) nécessaire pour afficher tous les graphiques
  const getCardH = (viz: Visualization) => {
    const activeLayout = getActiveLayout(viz);
    if (!activeLayout || !activeLayout.layout) return 5; // hauteur par défaut

    // On prend le breakpoint lg pour calculer la hauteur
    const lgItems = activeLayout.layout.lg ?? [];
    if (!lgItems.length) return 5;

    const maxBottom = Math.max(...lgItems.map(item => (item.y || 0) + (item.h || 1)));
    const innerRowH = 130; // rowHeight
    const toolbarH = 58;
    const total = maxBottom * innerRowH + toolbarH + 20;

    return Math.ceil(total / 80) + 1;
  };

  const layoutLG = useMemo(() => {
    const saved = cardsLayout.lg || [];

    // garder uniquement ceux encore présents
    const valid = saved.filter(l => filtered.some(v => String(v.id) === l.i));

    if (valid.length === filtered.length) return valid;

    const missing = filtered
      .filter(v => !valid.some(l => l.i === String(v.id)))
      .map((v, i) => ({
        i: String(v.id),
        x: (i % 2) * 6,
        y: Infinity,
        w: 6,
        h: getCardH(v),
      }));

    return [...valid, ...missing];
  }, [cardsLayout, filtered]);


  // ---------------- UI ----------------
  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>

      {/* ── HEADER STICKY ── */}
      <div style={{ position: 'sticky', top: 'var(--navbar-height, 60px)', zIndex: 200, background: '#f1f5f9', padding: '0.6rem 1.5rem 0' }}>
        <div style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          borderRadius: 12, padding: '0.6rem 1.25rem',
          display: 'flex', alignItems: 'center', gap: '1rem',
          marginBottom: '0.75rem', boxShadow: '0 4px 20px rgba(15,23,42,0.18)',
          flexWrap: 'wrap',
        }}>
          {/* Titre */}
          <div style={{ flexShrink: 0 }}>
            <div style={{ color: 'white', fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.01em' }}>
              📊 Visualisations
            </div>
            <div style={{ color: '#94a3b8', fontSize: '0.73rem', marginTop: 1 }}>
              {visualizations.length} dashboard{visualizations.length > 1 ? 's' : ''}
            </div>
          </div>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Groupe droite responsive */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>

            {/* Recherche */}
            <input
              placeholder="🔍 Rechercher..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                minWidth: 140, maxWidth: 200, flex: '1 1 140px', height: 34, padding: '0 0.75rem',
                borderRadius: 8, border: '1px solid rgba(255,255,255,0.18)',
                background: 'rgba(255,255,255,0.1)', color: 'white',
                fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box',
              } as React.CSSProperties}
            />

            {/* Filtre statut */}
            <div style={{ flex: '1 1 140px', maxWidth: 165, height: 34 }}>
              <FormSelect
                value={statusFilter}
                options={[{ value: "", label: "Tous les statuts" }, ...STATUS.map(s => ({ value: s, label: s }))]}
                onChange={setStatusFilter}
                variant="dark"
              />
            </div>

            {/* Toggle vue grille/liste */}
            <ViewGridOrListModeBtn
              viewMode={viewMode}
              setViewMode={setViewMode}
              setCardsLayout={setCardsLayout}
            />

            {/* Nouvelle visualisation */}
            <button
              onClick={create}
              style={{
                height: 34, padding: '0 1rem', borderRadius: 8, fontSize: '0.82rem', fontWeight: 700,
                background: '#6366f1', color: 'white', border: 'none', cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(99,102,241,0.4)', flexShrink: 0, whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center',
              }}
            >
              + Nouvelle visualisation
            </button>

          </div>
        </div>
      </div>{/* /sticky wrapper */}

      {/* ── CONTENU ── */}
      <div style={{ padding: '0 1.5rem 1.5rem' }}>

        {/* ── LOADING ── */}
        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(480px, 1fr))', gap: '1.25rem' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: 220, background: '#e2e8f0', borderRadius: 14, animation: 'pulse 1.5s infinite' }} />
            ))}
          </div>
        )}

        {/* ── EMPTY ── */}
        {!loading && !filtered.length && (
          <div style={{
            textAlign: 'center', padding: '4rem 2rem',
            color: '#94a3b8', background: 'white', borderRadius: 14,
            border: '1px dashed #cbd5e1',
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📊</div>
            <div style={{ fontWeight: 600, fontSize: '1rem', color: '#475569' }}>Aucune visualisation</div>
            <div style={{ fontSize: '0.82rem', marginTop: 4 }}>Créez votre première visualisation en cliquant sur "+ Nouvelle visualisation"</div>
          </div>
        )}

        {/* ── GRILLE DE CARDS (draggable) ── */}
        {!loading && filtered.length > 0 && (
          // <BuildVisualizationView visualizations={filtered} refreshSecond={refreshSecond} removeView={removeView} editView={editView} openView={openView} refreshView={refreshView} autoRefresh={autoRefresh} />
          <BuildVisualizationView visualizations={filtered} removeView={removeView} editView={editView} openView={openView} />
        )}


        {/* BUILDER DRAWER */}
        {open && (
          <VisualizationFormBuilder
            tenants={tenants}
            tenant_id={tenant_id}
            form={form}
            defaultForm={getDefaultForm()}
            editing={editing}
            setOpen={setOpen}
            setShowConfigModal={setShowConfigModal}
            setForm={setForm}
            askConfirm={askConfirm}
            setEditing={setEditing} />
        )}

        <RenamesOptionsModal
          isOpen={showConfigModal}
          onClose={() => setShowConfigModal(false)}
          values={form.definition?.config ?? {}}
          onChange={(newValues) => setForm(prev => ({ ...prev, config: newValues }))}
        />

        <ConfirmModal
          isOpen={confirmState.isOpen}
          title={confirmState.title}
          message={confirmState.message}
          onConfirm={() => { confirmState.onConfirm(); closeConfirm(); }}
          onCancel={closeConfirm}
        />

      </div>
    </div>
  );
}



