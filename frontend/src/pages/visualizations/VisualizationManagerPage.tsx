import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Responsive } from "react-grid-layout";
import useMeasure from "react-use-measure";

import { FormInput } from "@/components/forms/FormInput/FormInput";
import { FormSelect } from "@/components/forms/FormSelect/FormSelect";
import { Button } from "@/components/ui/Button/Button";

import { useAuth } from "@/contexts/AuthContext";
import { tenantService } from "@/services/identity.service";
import { visualizationService } from "@/services/visualization.service";
import { chartService } from "@/services/dataset.service";

import { Visualization, VisualLayoutItem } from "@/models/visualization.model";
import { DatasetChart } from "@/models/dataset.models";

import { Tenant } from "@/models/identity.model";
import { FormTextarea } from "@/components/forms/FormTextarea/FormTextarea";

import { VisualizationChartRenderer, VisualizationViewModule, statusColor } from "./VisualizationUtils";
import { ConfirmModal } from "@components/ui/ConfirmModal/ConfirmModal";
import { RenamesOptionsModal } from "@pages/admins/components/datasets/DatasetCharts/chart-utils/RenamesOptionsModal";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const STATUS = ["draft", "submitted", "reviewed", "approved", "published", "archived"];
const TYPES = ["dashboard", "report"];


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

  // ── Confirmation modal ──
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const askConfirm = (title: string, message: string, onConfirm: () => void) =>
    setConfirmState({ isOpen: true, title, message, onConfirm });

  const closeConfirm = () => setConfirmState(s => ({ ...s, isOpen: false }));

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
    const viz = data.find(v => v.id === id);
    askConfirm(
      'Supprimer la visualisation',
      `"${viz?.name || id}" sera définitivement supprimée. Cette action est irréversible.`,
      async () => { await visualizationService.remove(id); fetchData(); },
    );
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
    askConfirm(
      'Supprimer ce graphique',
      'Ce graphique sera retiré du layout. Vous pourrez le rajouter à tout moment.',
      () => setForm(prev => ({ ...prev, layout: prev.layout.filter(l => l.i !== id) })),
    );
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
    <div style={{ minHeight: '100vh', background: '#f1f5f9', padding: '1.5rem' }}>

      {/* ── HEADER ── */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        borderRadius: 16, padding: '0.6rem 1.25rem',
        display: 'flex', alignItems: 'center', gap: '1rem',
        marginBottom: '1.25rem', boxShadow: '0 4px 20px rgba(15,23,42,0.18)',
        flexWrap: 'wrap',
      }}>
        {/* Titre */}
        <div style={{ flexShrink: 0 }}>
          <div style={{ color: 'white', fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.01em' }}>
            📊 Visualisations
          </div>
          <div style={{ color: '#94a3b8', fontSize: '0.73rem', marginTop: 1 }}>
            {data.length} dashboard{data.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Recherche */}
        <div style={{ width: 220, position: 'relative' }}>
          <input
            placeholder="🔍 Rechercher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '0.4rem 0.75rem',
              borderRadius: 8, border: '1px solid rgba(255,255,255,0.18)',
              background: 'rgba(255,255,255,0.1)', color: 'white',
              fontSize: '0.8rem', outline: 'none',
              '::placeholder': { color: '#94a3b8' },
            } as React.CSSProperties}
          />
        </div>

        {/* Filtre statut */}
        <div style={{ width: 160 }}>
          <FormSelect
            value={statusFilter}
            options={[{ value: "", label: "Tous les statuts" }, ...STATUS.map(s => ({ value: s, label: s }))]}
            onChange={setStatusFilter}
          />
        </div>

        {/* Actions */}
        <button
          onClick={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')}
          style={{
            padding: '0.4rem 0.75rem', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600,
            background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.15)',
            cursor: 'pointer', flexShrink: 0,
          }}
        >{viewMode === 'grid' ? '☰' : '⊞'}</button>
        <button
          onClick={create}
          style={{
            padding: '0.45rem 1rem', borderRadius: 8, fontSize: '0.82rem', fontWeight: 700,
            background: '#6366f1', color: 'white', border: 'none', cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(99,102,241,0.4)', flexShrink: 0, whiteSpace: 'nowrap',
          }}
        >+ Nouvelle visualisation</button>
      </div>

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

      {/* ── GRILLE DE CARDS ── */}
      {!loading && filtered.length > 0 && (
        <div style={{
          display: viewMode === 'grid'
            ? 'grid'
            : 'flex',
          gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(480px, 1fr))' : undefined,
          flexDirection: viewMode === 'list' ? 'column' : undefined,
          gap: '1.25rem',
        }}>
          {filtered.map(v => (
            <div key={v.id} style={{
              background: 'white', borderRadius: 14, overflow: 'hidden',
              boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
              border: '1px solid #e2e8f0',
              transition: 'box-shadow 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.13)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.07)')}
            >
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
          ))}
        </div>
      )}

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
                            <div key={item.i} style={{ background: '#fafafe', border: '1px solid #c7d2fe', borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 6px rgba(99,102,241,0.08)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '0.25rem 0.375rem', background: '#eef2ff', borderBottom: '1px solid #c7d2fe', flexShrink: 0 }}>
                                {/* Sélecteur réduit */}
                                <div style={{ width: 180, flexShrink: 0 }}>
                                  <FormSelect
                                    options={charts.map(c => ({ value: c.id, label: c.name }))}
                                    value={item.chart_id}
                                    onChange={(v) => updateChartBinding(item.i, Number(v))}
                                  />
                                </div>
                                <div style={{ flex: 1 }} />
                                {/* Boutons clone + fermer rapprochés */}
                                <div style={{ display: 'flex', gap: 2 }}>
                                  <button
                                    onClick={() => duplicateBlock(item)}
                                    title="Dupliquer"
                                    style={{
                                      width: 26, height: 26, borderRadius: 6,
                                      border: '1px solid #c7d2fe',
                                      background: '#eef2ff', color: '#4f46e5',
                                      cursor: 'pointer', fontSize: '0.85rem',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}
                                  >⧉</button>
                                  <button
                                    onClick={() => removeBlock(item.i)}
                                    title="Supprimer"
                                    style={{
                                      width: 26, height: 26, borderRadius: 6,
                                      border: '1px solid #fca5a5',
                                      background: '#fef2f2', color: '#dc2626',
                                      cursor: 'pointer', fontSize: '0.8rem',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      fontWeight: 700,
                                    }}
                                  >✕</button>
                                </div>
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

      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={() => { confirmState.onConfirm(); closeConfirm(); }}
        onCancel={closeConfirm}
      />

    </div >
  );
}



