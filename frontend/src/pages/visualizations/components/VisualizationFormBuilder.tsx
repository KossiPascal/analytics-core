import { FormSelect } from "@/components/forms/FormSelect/FormSelect";
import { FormSwitch } from "@/components/forms/FormSwitch/FormSwitch";
import { Dataset, DatasetChart } from "@/models/dataset.models";
import { Tenant } from "@/models/identity.model";
import { VisualizationForm, Visualization, BreakPointType, VisualLayoutItem, VisualizationFormLayout, LayoutMeta } from "@/models/visualization.model";
import { datasetService, chartService } from "@/services/dataset.service";
import { visualizationService } from "@/services/visualization.service";
import { AnimatePresence, motion } from "framer-motion";
import { Dispatch, SetStateAction, useState, useMemo, useCallback, useEffect } from "react";
import { Layout } from "react-grid-layout";
import useMeasure from "react-use-measure";
import { VisualizationChartRenderer } from "./VisualizationChartRenderer";
import { AskConfirmProps, TYPES, STATUS } from "./VisualizationUtils";
import { FormInput } from "@/components/forms/FormInput/FormInput";
import { Button } from "@/components/ui/Button/Button";
import { CustomResponsiveLayout } from "./CustomResponsiveLayout";
import { JsonConfigSection } from "./JsonConfigSection";


type VisualizationFormBuilderProps = {
    tenants: Tenant[];
    tenant_id: number | undefined;
    form: VisualizationForm;
    defaultForm: VisualizationForm;
    editing: Visualization | null
    setOpen: Dispatch<SetStateAction<boolean>>;
    setShowConfigModal: Dispatch<SetStateAction<boolean>>;
    setForm: Dispatch<SetStateAction<VisualizationForm>>;
    askConfirm: (p: AskConfirmProps) => void;
    setEditing: (value: SetStateAction<Visualization | null>) => void
}

export function VisualizationFormBuilder({ tenants, tenant_id, form, defaultForm, editing, setForm, setOpen, setEditing, setShowConfigModal, askConfirm }: VisualizationFormBuilderProps) {
    const [datasetsMap, setDatasetsMap] = useState<Record<number, Dataset[]>>({});
    const [chartsMap, setChartsMap] = useState<Record<number, DatasetChart[]>>({});

    const [ref, bounds] = useMeasure();
    const [bp, setBp] = useState("lg");

    const getLayouts = (_form: VisualizationForm): Record<BreakPointType, VisualLayoutItem[]> => {
        return _form.layout?.items ?? { lg: [], md: [], sm: [] };
    }

    const currentLayouts = useMemo(() => getLayouts(form), [form?.layout?.items]);

    const addBlock = () => {
        const newItem: VisualLayoutItem = {
            i: Date.now().toString(),
            x: 0,
            y: Infinity,
            w: 4,
            h: 4,
            moved: false,
            static: false,
            meta: {
                tenant_id: tenant_id,
                id: undefined,
                chart_id: undefined,
                dataset_id: undefined,
                visualization_id: undefined
            }
        };

        setForm(prev => {
            const layouts = getLayouts(prev);
            return {
                ...prev,
                layout: {
                    ...(prev.layout ?? {} as VisualizationFormLayout),
                    items: {
                        lg: [...layouts.lg, newItem],
                        md: [...layouts.md, { ...newItem, w: 4 }],
                        sm: [...layouts.sm, { ...newItem, w: 4 }]
                    }
                }
            };
        });
    };


    // ---------------- BUILDER ----------------
    const updateLayout = (layouts: Record<BreakPointType, Layout>) => {
        setForm(prev => {
            const current = getLayouts(prev);

            const updated = (key: BreakPointType) =>
                layouts[key].map(l => ({
                    ...l,
                    meta: current[key].find(p => p.i === l.i)?.meta,
                }));

            return {
                ...prev,
                layout: {
                    ...(prev.layout ?? {} as VisualizationFormLayout),
                    items: {
                        lg: updated('lg'),
                        md: updated('md'),
                        sm: updated('sm'),
                    }
                }
            };
        });
    };


    const updateChartBinding = useCallback((id: string, patch: Partial<LayoutMeta>) => {
        setForm(prev => {
            const layouts = getLayouts(prev);
            const update = (items: VisualLayoutItem[]) => items.map(l => l.i === id ? { ...l, meta: { ...(l.meta ?? {} as LayoutMeta), ...patch } } : l);

            const lg = update(layouts.lg);
            const md = update(layouts.md);
            const sm = update(layouts.sm);
            return {
                ...prev,
                layout: {
                    ...(prev.layout ?? {}),
                    items: { lg, md, sm }
                }
            };
        });
    }, []);



    const removeBlock = (id: string) => {
        askConfirm({
            title: 'Supprimer ce graphique',
            message: 'Ce graphique sera retiré du layout. Vous pourrez le rajouter à tout moment.',
            onConfirm: () => setForm(prev => {
                const layouts = getLayouts(prev);
                return {
                    ...prev,
                    layout: {
                        ...(prev.layout ?? {} as VisualizationFormLayout),
                        items: {
                            lg: layouts.lg.filter(l => l.i !== id),
                            md: layouts.md.filter(l => l.i !== id),
                            sm: layouts.sm.filter(l => l.i !== id),
                        }
                    }
                }
            }),
        });
    };

    const duplicateBlock = (item: VisualLayoutItem) => {
        const copy = { ...item, i: Date.now().toString(), y: Infinity };
        setForm(prev => {
            const layouts = getLayouts(prev);
            return {
                ...prev,
                layout: {
                    id: prev.layout?.id,
                    version: prev.layout?.version,
                    dataset_id: prev.layout?.dataset_id,
                    options: prev.layout?.options ?? {},
                    item: {
                        lg: [...layouts.lg, copy],
                        md: [...layouts.md, copy],
                        sm: [...layouts.sm, copy],
                    }
                }
            };
        });
    };


    useEffect(() => {
        const layouts = currentLayouts?.lg ?? [];

        layouts.forEach(item => {
            const tenantId = item.meta?.tenant_id;
            const datasetId = item.meta?.dataset_id;

            // 🔥 charger datasets si pas encore chargés
            if (tenantId && !datasetsMap[tenantId]) {
                datasetService.list(tenantId).then(res => {
                    setDatasetsMap(prev => ({ ...prev, [tenantId]: res || [] }));
                });
            }

            // 🔥 charger charts si pas encore chargés
            if (tenantId && datasetId && !chartsMap[datasetId]) {
                chartService.list(tenantId, datasetId).then(res => {
                    setChartsMap(prev => ({ ...prev, [datasetId]: res || [] }));
                });
            }
        });

    }, [currentLayouts]);

    const formCharts = useMemo(() => {
        const all = [
            ...currentLayouts.lg,
            ...currentLayouts.md,
            ...currentLayouts.sm
        ];

        return Array.from(
            new Map(
                all.filter(i => i.meta?.chart_id && i.meta?.dataset_id)
                    .map(i => [
                        i.meta!.chart_id,
                        {
                            id: i.meta!.id,
                            tenant_id: i.meta!.tenant_id ?? tenant_id,
                            chart_id: i.meta!.chart_id,
                            dataset_id: i.meta!.dataset_id,
                            visualization_id: i.meta!.visualization_id,
                            layout_id: form.layout?.id,
                            position: { i: i.i, x: i.x, y: i.y, w: i.w, h: i.h }
                        }
                    ])
            ).values()
        );
    }, [currentLayouts.lg, currentLayouts.md, currentLayouts.sm]);



    const formView = useMemo(() => {
        const dt = {
            ...form.view,
            layout_id: form.layout?.id
        };
        return dt
    }, [form.view, form.layout?.id]);

    // ------------ ACTIONS ------------
    const save = async () => {
        if (!form.name || !tenant_id) return;
        const payload: VisualizationForm = {
            ...form,
            tenant_id,
            charts: formCharts,
            view: formView,
        };

        if (editing && form.id) {
            await visualizationService.update(form.id, payload);
        } else {
            await visualizationService.create(payload);
        }

        setOpen(false);
        setEditing(null);
        setForm(defaultForm);
        // fetchCharts();
    };

    return (
        <AnimatePresence>
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
                                <FormInput label="Nom" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                                <FormSelect label="Type" value={form.type} options={TYPES.map(t => ({ value: t, label: t }))} onChange={v => setForm({ ...form, type: v })} />
                                <FormSelect label="Statut" value={form.status} options={STATUS.map(s => ({ value: s, label: s }))} onChange={v => setForm({ ...form, status: v })} />
                                <FormSwitch label={`is_template`} checked={form.is_template} onChange={(e) => setForm({ ...form, is_template: e.target.checked })} />
                                <br />
                                <FormInput label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                            </div>
                        </section>

                        <JsonConfigSection form={form} setForm={setForm} onOpenConfigModal={() => setShowConfigModal(true)} />
                    </div>

                    {/* Colonne droite : Layout Builder */}
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                        {/* Header du builder */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.625rem 1rem',
                            background: '#f1f5f9',
                            borderBottom: '1px solid #e2e8f0',
                            flexShrink: 0,
                        }}>
                            <span style={{ fontWeight: 600, fontSize: '0.78rem', color: '#475569', letterSpacing: '0.04em' }}>
                                🗂️ LAYOUT BUILDER
                                {currentLayouts.lg.length > 0 && (
                                    <span style={{
                                        marginLeft: 8,
                                        background: '#6366f1',
                                        color: 'white',
                                        borderRadius: 10,
                                        padding: '1px 7px',
                                        fontSize: '0.7rem'
                                    }}>
                                        {currentLayouts.lg.length}
                                    </span>
                                )}
                            </span>
                            <button onClick={addBlock} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 5,
                                padding: '0.3rem 0.875rem',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                background: '#6366f1',
                                color: 'white',
                                border: 'none',
                                borderRadius: 6,
                                cursor: 'pointer',
                            }}>+ Ajouter un Layout</button>
                        </div>

                        {/* Zone scrollable de la grille */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '0.875rem' }}>
                            {currentLayouts.lg.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                                    Aucun Layout — cliquez sur "+ Ajouter un Layout"
                                </div>
                            ) : (
                                <div ref={ref} style={{ width: "100%" }}>
                                    <CustomResponsiveLayout
                                        width={bounds.width || 900}
                                        layouts={currentLayouts}
                                        breakpoints={{ lg: 1200, md: 996, sm: 768 }}
                                        cols={{ lg: 12, md: 8, sm: 4 }}
                                        rowHeight={120}
                                        onLayoutChange={(layout, allLayouts) => updateLayout(allLayouts as Record<BreakPointType, VisualLayoutItem[]>)}
                                    >
                                        {currentLayouts.lg.map(item => {
                                            const idTenant = item.meta?.tenant_id;
                                            const idDataset = item.meta?.dataset_id;
                                            const idChart = item.meta?.chart_id;

                                            const itemDatasets = idTenant ? datasetsMap[idTenant] ?? [] : [];
                                            const itemCharts = idDataset ? chartsMap[idDataset] ?? [] : [];
                                            const itemChart = itemCharts.find(c => c.id === idChart);

                                            return (
                                                <div key={item.i} style={{ background: '#fafafe', border: '1px solid #c7d2fe', borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 6px rgba(99,102,241,0.08)' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '0.25rem 0.375rem', background: '#eef2ff', borderBottom: '1px solid #c7d2fe', flexShrink: 0 }}>
                                                        {/* Sélecteur réduit */}
                                                        <div style={{ width: 180, flexShrink: 0 }}>
                                                            <FormSelect
                                                                value={idTenant}
                                                                options={tenants.map(c => ({ value: c.id, label: c.name }))}
                                                                onChange={(v) => {
                                                                    const tenantId = Number(v);

                                                                    updateChartBinding(item.i, {
                                                                        tenant_id: tenantId,
                                                                        dataset_id: undefined,
                                                                        chart_id: undefined
                                                                    });
                                                                    // ✅ éviter refetch inutile
                                                                    if (tenantId && !datasetsMap[tenantId]) {
                                                                        datasetService.list(tenantId).then(res => {
                                                                            setDatasetsMap(prev => ({
                                                                                ...prev,
                                                                                [tenantId]: res || []
                                                                            }));
                                                                        });
                                                                    }
                                                                }}
                                                            />
                                                        </div>
                                                        {idTenant && (<div style={{ width: 180, flexShrink: 0 }}>
                                                            <FormSelect
                                                                value={idDataset}
                                                                options={itemDatasets.map(c => ({ value: c.id, label: c.name }))}
                                                                onChange={(v) => {
                                                                    const datasetId = Number(v);

                                                                    updateChartBinding(item.i, {
                                                                        dataset_id: datasetId,
                                                                        chart_id: undefined
                                                                    });
                                                                    // ✅ éviter refetch inutile
                                                                    if (idTenant && datasetId && !chartsMap[datasetId]) {
                                                                        chartService.list(idTenant, datasetId).then(res => {
                                                                            setChartsMap(prev => ({
                                                                                ...prev,
                                                                                [datasetId]: res || []
                                                                            }));
                                                                        });
                                                                    }
                                                                }}
                                                            />
                                                        </div>)}
                                                        {(idTenant && idDataset) && (<div style={{ width: 180, flexShrink: 0 }}>
                                                            <FormSelect
                                                                value={idChart}
                                                                options={itemCharts.filter(c => c.dataset_id === idDataset).map(c => ({ value: c.id, label: c.name }))}
                                                                onChange={(v) => {
                                                                    updateChartBinding(item.i, {
                                                                        chart_id: Number(v)
                                                                    });
                                                                }}
                                                            />
                                                        </div>)}
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
                                                    {itemChart && (<div style={{ flex: 1, minHeight: 0 }}>
                                                        <VisualizationChartRenderer chart={itemChart} />
                                                    </div>)}
                                                </div>
                                            )
                                        })}
                                    </CustomResponsiveLayout>
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
        </AnimatePresence>
    )
}
