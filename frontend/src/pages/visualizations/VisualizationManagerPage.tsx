import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Responsive } from "react-grid-layout";
import useMeasure from "react-use-measure";

import { FormInput } from "@/components/forms/FormInput/FormInput";
import { FormSelect } from "@/components/forms/FormSelect/FormSelect";
import { Button } from "@/components/ui/Button/Button";
import { Card } from "@/components/ui/Card/Card";

import { useAuth } from "@/contexts/AuthContext";
import { tenantService } from "@/services/identity.service";
import { visualizationService } from "@/services/visualization.service";
import { chartService } from "@/services/dataset.service";

import { Visualization, VisualLayoutItem } from "@/models/visualization.model";
import { DatasetChart } from "@/models/dataset.models";

import { Tenant } from "@/models/identity.model";
import { FormTextarea } from "@/components/forms/FormTextarea/FormTextarea";

import { VisualizationChartRenderer, VisualizationViewModule, statusColor } from "./VisualizationUtils";
import { RenamesOptionsModal } from "@pages/admins/components/datasets/DatasetCharts/chart-utils/RenamesOptionsModal";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const STATUS = ["draft", "submitted", "reviewed", "approved", "published", "archived"];
const TYPES = ["dashboard", "report"];

const blockBtn: React.CSSProperties = {
  width: 24, height: 24, borderRadius: 4,
  border: '1px solid #e2e8f0', background: 'white',
  cursor: 'pointer', fontSize: '0.85rem',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: '#64748b', flexShrink: 0,
};

function JsonConfigSection({ form, setForm, onOpenConfigModal }: {
  form: Visualization;
  setForm: (f: Visualization) => void;
  onOpenConfigModal: () => void;
}) {
  const [open, setOpen] = useState(true);
  return (
    <section style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
      <div style={{
        padding: '0.5rem 1rem', background: '#f1f5f9',
        borderBottom: open ? '1px solid #e2e8f0' : 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button
          onClick={() => setOpen(v => !v)}
          style={{ flex: 1, textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', color: '#475569', letterSpacing: '0.03em', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <span>⚙️ CONFIG JSON</span>
          <span style={{ fontSize: '0.7rem' }}>{open ? '▲' : '▼'}</span>
        </button>
        <button
          onClick={onOpenConfigModal}
          style={{
            padding: '0.25rem 0.75rem', fontSize: '0.75rem', fontWeight: 600,
            background: '#6366f1', color: 'white', border: 'none', borderRadius: 6,
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}
        >
          🗂️ Configurer
        </button>
      </div>
      {open && (
        <div style={{ padding: '0.875rem' }}>
          <FormTextarea
            rows={6}
            value={JSON.stringify(form.config, null, 2)}
            onChange={e => {
              try { setForm({ ...form, config: JSON.parse(e.target.value) }); } catch { }
            }}
          />
        </div>
      )}
    </section>
  );
}

const getDefaultForm = (): Visualization => ({
  id: null,
  tenant_id: null,
  name: "",
  type: "dashboard",
  description: "",
  status: "draft",
  state: "pending",
  layout: [],
  filters: {},
  config: {},
  generated_data: {}
});

export default function VisualizationHome() {

  const { user } = useAuth();

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenant_id, setTenantId] = useState<number>();
  const [data, setData] = useState<Visualization[]>([]);
  const [charts, setCharts] = useState<DatasetChart[]>([]);
  const [chart_id, setChartId] = useState<number | undefined>(undefined);

  const [form, setForm] = useState<Visualization>(getDefaultForm());
  const [editing, setEditing] = useState<Visualization | null>(null);

  const [open, setOpen] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [ref, bounds] = useMeasure();
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

  // ---------------- FETCH ----------------
  const fetchData = async () => {
    if (!tenant_id) return;
    setLoading(true);
    const res = await visualizationService.list(tenant_id);
    setData(res || []);
    setLoading(false);
  };

  const fetchCharts = async () => {
    if (!tenant_id) return;
    const res = await chartService.list(tenant_id);
    setCharts(res || []);
  };


  const refresh = () => {
    fetchData();
    fetchCharts();
  }

  const refreshView = async (id: number | null) => {
    console.log("👉 refresh...");
    // Make refresh view function
    refresh();
  }

  useEffect(() => {
    if (!tenant_id) return;
    refresh();
  }, [tenant_id]);

  // ---------------- ACTIONS ----------------
  const save = async () => {
    if (!form.name || !tenant_id) return;

    const payload = { ...form, tenant_id };

    if (editing && form.id) {
      await visualizationService.update(form.id, payload);
    } else {
      await visualizationService.create(payload);
    }

    setOpen(false);
    setEditing(null);
    setForm(getDefaultForm());
    fetchData();
  };

  const remove = async (id: number | null) => {
    if (!id) return;
    await visualizationService.remove(id);
    fetchData();
  };

  const create = () => {
    setEditing(null);
    setForm(getDefaultForm());
    setOpen(true);
  };

  const startEdit = (v: Visualization) => {
    setEditing(v);
    setForm({ ...v, layout: [...(v.layout || [])] });
    setOpen(true);
  };

  // ---------------- BUILDER ----------------
  const updateLayout = (layout: VisualLayoutItem[]) => {
    setForm(prev => ({
      ...prev,
      layout: layout.map(l => {
        const existing = prev.layout.find(p => p.i === l.i);
        return { ...l, chart_id: existing?.chart_id };
      }),
    }));
  };

  const updateChartBinding = (id: string, chart_id: number) => {
    setForm(prev => ({
      ...prev,
      layout: prev.layout.map(l =>
        l.i === id ? { ...l, chart_id } : l
      ),
    }));
  };

  const addBlock = () => {
    const newItem: VisualLayoutItem = {
      i: Date.now().toString(),
      x: 0,
      y: Infinity,
      w: 4,
      h: 4,
    };
    setForm(prev => ({ ...prev, layout: [...prev.layout, newItem] }));
  };

  const removeBlock = (id: string) => {
    setForm(prev => ({
      ...prev,
      layout: prev.layout.filter(l => l.i !== id),
    }));
  };

  const duplicateBlock = (item: VisualLayoutItem) => {
    const copy = { ...item, i: Date.now().toString(), y: Infinity };
    setForm(prev => ({ ...prev, layout: [...prev.layout, copy] }));
  };

  // ---------------- FILTER ----------------
  const filtered = useMemo(() => {
    return data.filter(v =>
      v.name.toLowerCase().includes(search.toLowerCase()) &&
      (statusFilter ? v.status === statusFilter : true)
    );
  }, [data, search, statusFilter]);


  const workflowAction = async (id: number, action: string) => {
    await fetch(`/api/visualizations/${id}/${action}`, { method: "POST" });
    fetchData();
  };

  const openView = async (viz: Visualization, charts: DatasetChart[]) => {
    window.open(`/dashboard/${viz.id}`)
  }


  // ---------------- UI ----------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">📊 Visualizations</h1>
          <p className="text-gray-500 text-sm">Create, manage and explore dashboards</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}>
            Toggle View
          </Button>
          <Button onClick={create} className="shadow-md">+ New Visualization</Button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-4 rounded-2xl shadow-sm mb-6 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px]">
          <FormInput
            placeholder="🔍 Search visualization..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="w-[200px]">
          <FormSelect
            value={statusFilter}
            options={[{ value: "", label: "All Status" }, ...STATUS.map(s => ({ value: s, label: s }))]}
            onChange={setStatusFilter}
          />
        </div>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 bg-gray-200 animate-pulse rounded-xl" />
          ))}
        </div>
      )}

      {/* EMPTY */}
      {!loading && !filtered.length && (
        <div className="text-center py-20 text-gray-400">
          🚀 No visualization yet. Create your first one!
        </div>
      )}

      {/* GRID */}
      <div className={viewMode === "grid" ? "grid md:grid-cols-2 xl:grid-cols-2 gap-6" : "space-y-4"}>
        {filtered.map(v => (
          <Card key={v.id} className="rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow" style={{ borderColor: "#7e035f", background: "#e9e6e6" }}>

            {/* ── Visualisation preview ── */}
            <div style={{ width: '100%' }}>
              <VisualizationViewModule
                visualization={v}
                charts={charts}
                removeView={remove}
                editView={startEdit}
                openView={openView}
                refreshView={refreshView}
                autoRefresh={refreshView}
              />
            </div>
          </Card>
        ))}
      </div>

      {/* BUILDER DRAWER */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 1200, backdropFilter: 'blur(2px)' }}
            />

            {/* Modal pleine page */}
            <motion.div
              key="drawer"
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              style={{
                position: 'fixed', top: '2vh', left: '2vw', right: '2vw', bottom: '2vh',
                zIndex: 1300,
                background: '#f8fafc', display: 'flex', flexDirection: 'column',
                borderRadius: 16, boxShadow: '0 24px 80px rgba(0,0,0,0.28)',
                overflow: 'hidden',
              }}
            >
              {/* ── Header ── */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '1rem 1.5rem',
                background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                flexShrink: 0,
              }}>
                <div>
                  <div style={{ color: 'white', fontWeight: 700, fontSize: '1.05rem' }}>
                    {editing ? '✏️ Modifier la visualisation' : '✨ Nouvelle visualisation'}
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: 2 }}>
                    Configurez les informations et le layout
                  </div>
                </div>
                <button onClick={() => setOpen(false)} style={{
                  background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white',
                  borderRadius: 8, width: 32, height: 32, cursor: 'pointer',
                  fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>✕</button>
              </div>

              {/* ── Body : 2 colonnes ── */}
              <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 0, overflow: 'hidden' }}>

                {/* Colonne gauche : Infos + Config JSON */}
                <div style={{ width: 320, flexShrink: 0, borderRight: '1px solid #e2e8f0', overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                  <section style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <div style={{ padding: '0.625rem 1rem', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', fontWeight: 600, fontSize: '0.78rem', color: '#475569', letterSpacing: '0.04em' }}>
                      📋 INFORMATIONS GÉNÉRALES
                    </div>
                    <div style={{ padding: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <FormInput label="Nom *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                      <FormSelect label="Type" value={form.type} options={TYPES.map(t => ({ value: t, label: t }))} onChange={v => setForm({ ...form, type: v })} />
                      <FormSelect label="Statut" value={form.status} options={STATUS.map(s => ({ value: s, label: s }))} onChange={v => setForm({ ...form, status: v })} />
                      <FormInput label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                    </div>
                  </section>

                  <JsonConfigSection form={form} setForm={setForm} onOpenConfigModal={() => setShowConfigModal(true)} />
                </div>

                {/* Colonne droite : Layout Builder */}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                  {/* Header du builder */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.625rem 1rem', background: '#f1f5f9',
                    borderBottom: '1px solid #e2e8f0', flexShrink: 0,
                  }}>
                    <span style={{ fontWeight: 600, fontSize: '0.78rem', color: '#475569', letterSpacing: '0.04em' }}>
                      🗂️ LAYOUT BUILDER
                      {form.layout?.length > 0 && (
                        <span style={{ marginLeft: 8, background: '#6366f1', color: 'white', borderRadius: 10, padding: '1px 7px', fontSize: '0.7rem' }}>
                          {form.layout.length}
                        </span>
                      )}
                    </span>
                    <button onClick={addBlock} style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '0.3rem 0.875rem', fontSize: '0.78rem', fontWeight: 600,
                      background: '#6366f1', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer',
                    }}>+ Ajouter un graphique</button>
                  </div>

                  {/* Zone scrollable de la grille */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '0.875rem' }}>
                    {(form.layout || []).length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                        Aucun graphique — cliquez sur "+ Ajouter un graphique"
                      </div>
                    ) : (
                      <div ref={ref}>
                        <Responsive
                          width={bounds.width || 900}
                          layouts={{ lg: form.layout }}
                          breakpoints={{ lg: 1200, md: 996, sm: 768 }}
                          cols={{ lg: 12, md: 8, sm: 4 }}
                          rowHeight={40}
                          onLayoutChange={(layout) => updateLayout(layout as any)}
                        >
                          {(form.layout || []).map(item => (
                            <div key={item.i} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.3rem 0.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <FormSelect
                                    options={charts.map(c => ({ value: c.id, label: c.name }))}
                                    value={item.chart_id}
                                    onChange={(v) => updateChartBinding(item.i, Number(v))}
                                  />
                                </div>
                                <button onClick={() => duplicateBlock(item)} title="Dupliquer" style={blockBtn}>⧉</button>
                                <button onClick={() => removeBlock(item.i)} title="Supprimer" style={{ ...blockBtn, color: '#ef4444' }}>✕</button>
                              </div>
                              <div style={{ flex: 1, minHeight: 0 }}>
                                <VisualizationChartRenderer chart={charts.find(c => c.id === item.chart_id)} />
                              </div>
                            </div>
                          ))}
                        </Responsive>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* ── Footer fixe ── */}
              <div style={{
                flexShrink: 0, padding: '0.875rem 1.5rem',
                background: 'white', borderTop: '1px solid #e2e8f0',
                display: 'flex', justifyContent: 'flex-end', gap: '0.625rem',
              }}>
                <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
                <Button onClick={save} disabled={!form.name}>
                  {editing ? '💾 Enregistrer' : '✨ Créer'}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <RenamesOptionsModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        values={(form.config as Record<string, Record<string, string>>) ?? {}}
        onChange={(newValues) => setForm(prev => ({ ...prev, config: newValues }))}
      />

    </div >
  );
}



