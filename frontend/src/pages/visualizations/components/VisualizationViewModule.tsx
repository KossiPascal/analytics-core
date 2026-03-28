import { Visualization } from "@/models/visualization.model";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import useMeasure from "react-use-measure";
import { Skeleton, exportBtnStyles } from "./VisualizationUtils";
import { Button } from "@/components/ui/Button/Button";
import { FormInput } from "@/components/forms/FormInput/FormInput";
import { CustomResponsiveLayout } from "./CustomResponsiveLayout";
import { VisualizationChartRenderer } from "./VisualizationChartRenderer";
import { VisualizationToolbar } from "./VisualizationToolbar";



type ViewerProps = {
    visualization: Visualization;
    editView?: (v: Visualization) => void;
    removeView?: (id: number | undefined) => Promise<void>;
    openView?: (v: Visualization) => Promise<void>;
    refreshSecond?: number;
    refreshView?: (id: number | undefined) => Promise<void>
    autoRefresh?: (id: number | undefined) => Promise<void>
}

// ---------------- DASHBOARD ----------------
export function VisualizationViewModule({ visualization, refreshSecond = 10, editView, removeView, openView }: ViewerProps) {

    const [ref, bounds] = useMeasure();

    const [viz, setViz] = useState<Visualization>(visualization);
    const [loading, setLoading] = useState(false);
    const [fullscreen, setFullscreen] = useState(false);
    const [startAutoRefresh, setStartAutoRefresh] = useState(false);

    const [filters, setFilters] = useState<Record<string, any>>({});
    const [showFilters, setShowFilters] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    // ---------------- AUTO REFRESH ----------------
    useEffect(() => {
        if (!startAutoRefresh) return;
        const interval = setInterval(() => {
            setRefreshKey(k => k + 1);
        }, (refreshSecond ?? 10) * 1000);
        return () => clearInterval(interval);
    }, [startAutoRefresh, refreshSecond]);

    if (!viz) return <Skeleton />;

    // const rawLayout = (viz.layouts ?? []).map(l => l.layout);
    // const layoutArray: any[] = Array.isArray(rawLayout) ? rawLayout : (rawLayout as any)['lg'] ?? Object.values(rawLayout)[0] ?? [];
    // const layoutItems = layoutArray.map((item: any) => ({ ...item }));

    // console.log(charts)



    const layouts = viz.layouts ?? [];
    // 🔥 prendre la dernière version (important)
    const latestLayout = layouts.length ? layouts.sort((a, b) => (b.version ?? 1) - (a.version ?? 1))[0] : null;
    const layoutItems = latestLayout?.layout?.lg?.map(item => ({ ...item })) ?? [];

    const getChart = (chart_id: number | undefined) => {
        if (!chart_id) return undefined;
        const vizCharts = (viz.charts ?? []).filter(v => v.chart !== undefined);
        const datasetCharts = vizCharts.map(v => v.chart).filter(v => v !== undefined);
        return datasetCharts.find((c) => c.id === chart_id)
    };

    // rowHeight adaptatif : assez grand pour voir le graphique + légende
    const makeGrid = (fsMode: boolean) => {
        const rh = fsMode ? 100 : 130;
        return (
            <div ref={ref} style={{ width: '100%' }}>
                {!layoutItems?.length ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                        Aucun graphique dans ce dashboard
                    </div>
                ) : (
                    <CustomResponsiveLayout
                        width={bounds.width || (fsMode ? window.innerWidth * 0.96 : 800)}
                        layouts={{ lg: layoutItems }}
                        breakpoints={{ lg: 1200, md: 996, sm: 768 }}
                        cols={{ lg: 12, md: 8, sm: 4 }}
                        rowHeight={rh}
                        draggableHandle='.chart-drag-handle'
                    >
                        {layoutItems.map((item, index) => {
                            const chart = getChart(item.meta?.chart_id);
                            if (!chart) {
                                return (
                                    <div style={{ padding: 10, color: 'red' }}>
                                        Chart introuvable
                                    </div>
                                );
                            }

                            return (
                                <div
                                    key={item.i}
                                    style={{
                                        background: 'white',
                                        borderRadius: 8,
                                        overflow: 'hidden',
                                        border: '1px solid #e2e8f0',
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column'
                                    }}>
                                    {/* Poignée drag graphique */}
                                    <div className="chart-drag-handle"
                                        style={{
                                            height: 5,
                                            flexShrink: 0,
                                            background: 'linear-gradient(90deg, #c7d2fe, #a5b4fc)',
                                            cursor: 'grab',
                                        }}
                                        title="Maintenir pour déplacer" />
                                    <div style={{ flex: 1, minHeight: 0 }}>
                                        {loading ? (
                                            <Skeleton />
                                        ) : chart ? (
                                            <VisualizationChartRenderer
                                                chart={chart}
                                                filters={filters}
                                                refreshKey={refreshKey}
                                            />
                                        ) : (
                                            <div style={{ padding: 10, color: 'red' }}>
                                                Chart introuvable
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </CustomResponsiveLayout>
                )}
            </div>
        );
    };
    const cardGrid = () => makeGrid(false);
    const fullscreenGrid = () => makeGrid(true);

    return (
        <>
            {/* ── Vue normale ── */}
            <div style={{ position: 'relative' }}>
                <VisualizationToolbar
                    viz={viz}
                    startAutoRefresh={startAutoRefresh} showFilters={showFilters}
                    onToggleFilters={() => setShowFilters(v => !v)}
                    onToggleAutoRefresh={() => setStartAutoRefresh(v => !v)}
                    onManualRefresh={() => setRefreshKey(k => k + 1)}
                    onFullscreen={() => setFullscreen(true)}
                    onEdit={editView ? () => editView(viz) : undefined}
                    onDelete={removeView ? () => removeView(viz.id) : undefined}
                    onOpen={openView ? () => openView(viz) : undefined}
                />
                {/* ── Popover filtre flottant ── */}
                {showFilters && (
                    <div style={{
                        position: 'absolute', top: '100%', right: 0, zIndex: 200,
                        background: 'white', border: '1px solid #e2e8f0',
                        borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                        padding: '0.875rem 1rem',
                        display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center',
                        minWidth: 280,
                    }}>
                        <FormInput placeholder="Region" value={filters.region || ""} onChange={(e) => setFilters({ ...filters, region: e.target.value })} />
                        <FormInput type="date" value={filters.date || ""} onChange={(e) => setFilters({ ...filters, date: e.target.value })} />
                        <Button size="sm" onClick={() => setShowFilters(false)}>Appliquer</Button>
                    </div>
                )}
                {cardGrid()}
            </div>

            {/* ── Fullscreen dashboard (modal animé) ── */}
            {createPortal(<AnimatePresence>
                {fullscreen && (
                    <>
                        <motion.div key="dash-backdrop"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            style={{ position: 'fixed', inset: 0, zIndex: 9990, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(3px)' }}
                            onClick={() => setFullscreen(false)}
                        />
                        <motion.div key="dash-panel"
                            initial={{ opacity: 0, scale: 0.95, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 30 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                            style={{
                                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                                zIndex: 9991, background: 'white', borderRadius: 0,
                                boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
                                display: 'flex', flexDirection: 'column', overflow: 'hidden',
                            }}
                        >
                            {/* Header du modal fullscreen */}
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '0.75rem 1.25rem', flexShrink: 0,
                                background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                            }}>
                                <div>
                                    <div style={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>{viz.name}</div>
                                    <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{viz.type} · {viz.status}</div>
                                </div>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    {/* Toggle auto refresh */}
                                    <button style={{ ...exportBtnStyles, background: startAutoRefresh ? '#6366f1' : 'rgba(255,255,255,0.12)', color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}
                                        onClick={() => setStartAutoRefresh(v => !v)}>
                                        {startAutoRefresh ? '⏸ Stop' : '▶ Auto'}
                                    </button>
                                    <button style={{ ...exportBtnStyles, background: 'rgba(255,255,255,0.12)', color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}
                                        onClick={() => setRefreshKey(k => k + 1)}>
                                        🔄 Rafraîchir
                                    </button>
                                    <button onClick={() => setFullscreen(false)} style={{
                                        marginLeft: 8, background: 'rgba(255,255,255,0.15)',
                                        border: 'none', color: 'white', borderRadius: 8,
                                        width: 32, height: 32, cursor: 'pointer', fontSize: '1rem',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>✕</button>
                                </div>
                            </div>

                            {/* Grille fullscreen */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                                {fullscreenGrid()}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>, document.body)}
        </>
    );
};