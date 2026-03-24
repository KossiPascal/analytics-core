import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { DatasetChart, ExecuteChartResponse } from "@/models/dataset.models";
import { chartService } from "@/services/dataset.service";
import { ChartRendererPreview } from "../admins/components/datasets/DatasetCharts/chart-utils/ChartRenderer";

import { Responsive } from "react-grid-layout";
import useMeasure from "react-use-measure";

import { Button } from "@/components/ui/Button/Button";
import { Badge } from "@/components/ui/Badge/Badge";
import { FormInput } from "@/components/forms/FormInput/FormInput";

import { Visualization } from "@/models/visualization.model";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { ExportTypes } from "@/components/download/download";


type RendererProps = {
    chart?: DatasetChart;
    filters?: Record<string, any>;
};

type ViewerProps = {
    visualization: Visualization;
    charts: DatasetChart[];
    editView?: (v: Visualization) => void;
    removeView?: (id: number | null) => Promise<void>;
    openView?: (v: Visualization, charts: DatasetChart[]) => Promise<void>;
    refreshSecond?: number;
    refreshView?: (id: number | null) => Promise<void>
    autoRefresh?: (id: number | null) => Promise<void>
}

// ---------------- UI HELPERS ----------------
export const Skeleton = () => (
    <div className="animate-pulse bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 h-full w-full rounded-xl" />
);

export const statusColor = (status?: string) => {
    switch (status) {
        case "published": return "bg-green-100 text-green-700";
        case "draft": return "bg-gray-100 text-gray-600";
        case "failed": return "bg-red-100 text-red-600";
        default: return "bg-blue-100 text-blue-600";
    }
};

// ---------------- TOOLBAR ----------------
type ToolbarProps = {
    viz: Visualization;
    charts: DatasetChart[];
    startAutoRefresh: boolean;
    showFilters: boolean;
    onToggleFilters: () => void;
    onToggleAutoRefresh: () => void;
    onManualRefresh: () => void;
    onFullscreen: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    onOpen?: () => void;
};

function VisualizationToolbar({
    viz, startAutoRefresh, showFilters,
    onToggleFilters, onToggleAutoRefresh, onManualRefresh,
    onFullscreen, onEdit, onDelete, onOpen,
}: ToolbarProps) {
    const sep = <div style={{ width: 1, height: 18, background: '#e2e8f0', margin: '0 2px' }} />;
    const iconBtn = (extra: React.CSSProperties = {}) => ({
        ...btnStyle(false), width: 28, height: 28, padding: 0, justifyContent: 'center' as const, ...extra,
    });

    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '0.3rem',
            padding: '0.3rem 0.5rem',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            position: 'relative',
        }}>
            {/* ── Gauche : nom ── */}
            <span style={{
                fontWeight: 700, fontSize: '0.82rem', color: '#1e293b',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                maxWidth: 160, flexShrink: 1,
            }} title={viz.name}>{viz.name}</span>

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* ── Droite : tous les boutons ── */}
            <button onClick={onToggleFilters} style={btnStyle(showFilters)} title="Filtres">🔍</button>
            {sep}
            <button onClick={onToggleAutoRefresh} style={btnStyle(startAutoRefresh)} title={startAutoRefresh ? 'Arrêter auto refresh' : 'Auto refresh'}>
                {startAutoRefresh ? '⏸' : '▶'}
            </button>
            <button onClick={onManualRefresh} style={btnStyle(false)} title="Rafraîchir">🔄</button>
            {sep}
            <button onClick={onFullscreen} style={iconBtn()} title="Plein écran">⛶</button>
            {onOpen   && <button onClick={onOpen}   style={iconBtn({ background: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' })} title="Ouvrir">📂</button>}
            {onEdit   && <button onClick={onEdit}   style={iconBtn({ background: '#f0fdf4', color: '#15803d', borderColor: '#bbf7d0' })} title="Modifier">✏️</button>}
            {onDelete && <button onClick={onDelete} style={iconBtn({ background: '#fef2f2', color: '#b91c1c', borderColor: '#fecaca' })} title="Supprimer">🗑️</button>}
        </div>
    );
}

const btnStyle = (active: boolean): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '0.2rem 0.5rem',
    fontSize: '0.75rem', fontWeight: 500,
    borderRadius: 6, border: '1px solid',
    cursor: 'pointer',
    background: active ? '#e0e7ff' : '#ffffff',
    color: active ? '#4338ca' : '#475569',
    borderColor: active ? '#a5b4fc' : '#e2e8f0',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap' as const,
});

const exportBtn: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 3,
    padding: '0.18rem 0.45rem',
    fontSize: '0.72rem', fontWeight: 500,
    borderRadius: 5, border: '1px solid #e2e8f0',
    cursor: 'pointer', background: 'white', color: '#475569',
    whiteSpace: 'nowrap',
};

const dropItemStyle = (active: boolean): React.CSSProperties => ({
    display: 'block', width: '100%', textAlign: 'left',
    padding: '0.5rem 0.875rem', fontSize: '0.82rem',
    border: 'none', cursor: 'pointer',
    background: active ? '#e0e7ff' : 'transparent',
    color: active ? '#4338ca' : '#1e293b',
    fontWeight: active ? 600 : 400,
});

// ---------------- CHART ----------------
export function VisualizationChartRenderer({ chart, filters }: RendererProps) {
    const [response, setResponse] = useState<ExecuteChartResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const chartRef = useRef<any>(null);
    const [showChartMenu, setShowChartMenu] = useState(false);
    const [chartFullscreen, setChartFullscreen] = useState(false);
    const [showExport, setShowExport] = useState(false);

    const options = {
        showTitle: false,
        showSubTitle: false,
        showDownload: false,
        showSearcInput: false,
        showExportBtn: false,
    }

    const download = (type: ExportTypes) => {
        if (!chartRef.current) {
            console.warn("Chart not ready");
            return;
        }
        chartRef.current?.download(type);
    };


    // ---------------- EXECUTE ----------------
    const executeQuery = useCallback(async () => {
        if (!chart?.query_id) return;

        try {
            setLoading(true);
            setError(null);
            const res = await chartService.execute(chart.query_id, { ...chart, filters });
            setResponse(res ?? null);
        } catch (e: any) {
            console.error(e);
            setError("Failed to load chart");
        } finally {
            setLoading(false);
        }
    }, [chart?.query_id, JSON.stringify(filters)]);


    // ---------------- INITIAL LOAD ----------------
    useEffect(() => {
        executeQuery();
    }, [executeQuery]);


    // ---------------- STATES ----------------
    if (!chart) return (
        <div className="flex items-center justify-center text-gray-400 text-sm">
            No chart selected
        </div>
    );

    if (loading) return (
        <div className="h-full flex items-center justify-center">
            <Skeleton />
        </div>
    );

    if (error) return (
        <div className="flex flex-col items-center justify-center text-red-500 gap-2">
            <span>{error}</span>
            <Button size="sm" onClick={executeQuery}>Retry</Button>
        </div>
    );

    if (!response) return <div className="flex items-center justify-center text-gray-400">No data</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* ── Fullscreen individuel (modal animé) ── */}
            {createPortal(
            <AnimatePresence>
                {chartFullscreen && (
                    <>
                        <motion.div key="fs-backdrop"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(3px)' }}
                            onClick={() => setChartFullscreen(false)}
                        />
                        <motion.div key="fs-panel"
                            initial={{ opacity: 0, scale: 0.94, y: 24 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.94, y: 24 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                            style={{
                                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                                zIndex: 9999, background: 'white', borderRadius: 0,
                                boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
                                display: 'flex', flexDirection: 'column', overflow: 'hidden',
                            }}
                        >
                            {/* Header modal */}
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '0.75rem 1.25rem',
                                background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                                flexShrink: 0,
                            }}>
                                <span style={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>
                                    📊 {chart?.name || 'Graphique'}
                                </span>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    {/* Boutons export dans le header */}
                                    {(['png','jpg','excel','csv'] as ExportTypes[]).map(t => (
                                        <button key={t} style={{ ...exportBtn, background: 'rgba(255,255,255,0.12)', color: 'white', borderColor: 'rgba(255,255,255,0.2)' }} onClick={() => download(t)}>
                                            ⬇ {t.toUpperCase()}
                                        </button>
                                    ))}
                                    <button style={{ ...exportBtn, background: 'rgba(255,255,255,0.12)', color: 'white', borderColor: 'rgba(255,255,255,0.2)' }} onClick={executeQuery}>
                                        🔄 Rafraîchir
                                    </button>
                                    <button
                                        onClick={() => setChartFullscreen(false)}
                                        style={{
                                            marginLeft: 8, background: 'rgba(255,255,255,0.15)', border: 'none',
                                            color: 'white', borderRadius: 8, width: 32, height: 32,
                                            cursor: 'pointer', fontSize: '1rem', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center',
                                        }}
                                    >✕</button>
                                </div>
                            </div>
                            {/* Contenu pleine hauteur */}
                            <div style={{ flex: 1, padding: '1.5rem', minHeight: 0 }}>
                                <ChartRendererPreview ref={chartRef} executeResponse={response} withContainer={false} customOptions={options} />
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
            , document.body)}

            {/* Barre export par graphique */}
            {showExport && (
                <div style={{
                    display: 'flex', flexWrap: 'wrap', gap: '0.25rem',
                    padding: '0.3rem 0.625rem',
                    background: '#f1f5f9',
                    borderBottom: '1px solid #e2e8f0',
                }}>
                    {(['png','jpg','pdf-landscape','pdf-portrait','excel','csv','json'] as ExportTypes[]).map(t => (
                        <button key={t} style={exportBtn} onClick={() => download(t)}>
                            ⬇ {t === 'pdf-landscape' ? 'PDF (L)' : t === 'pdf-portrait' ? 'PDF (P)' : t.toUpperCase()}
                        </button>
                    ))}
                </div>
            )}

            {/* Graphique avec icônes superposées */}
            <div style={{ position: 'relative', minHeight: 220 }}>
                <div style={{
                    position: 'absolute', top: 6, right: 6, zIndex: 10,
                    display: 'flex', gap: 4,
                }}>
                    <button onClick={() => setShowExport(v => !v)} style={btnStyle(showExport)} title="Export">📄</button>
                    <button onClick={executeQuery} style={btnStyle(false)} title="Rafraîchir">🔄</button>
                    <button onClick={() => setChartFullscreen(true)} style={btnStyle(false)} title="Plein écran">⛶</button>
                </div>
                <ChartRendererPreview ref={chartRef} executeResponse={response} withContainer={false} customOptions={options} />
            </div>
        </div>
    );
};

// ---------------- DASHBOARD ----------------
export function VisualizationViewModule({ visualization, charts, refreshSecond=10, editView, removeView, openView, refreshView, autoRefresh }: ViewerProps) {

    const [ref, bounds] = useMeasure();

    const [viz, setViz] = useState<Visualization>(visualization);
    const [loading, setLoading] = useState(false);
    const [fullscreen, setFullscreen] = useState(false);
    const [startAutoRefresh, setStartAutoRefresh] = useState(false);

    const [filters, setFilters] = useState<Record<string, any>>({});
    const [showFilters, setShowFilters] = useState(false);

    // ---------------- AUTO REFRESH ----------------
    useEffect(() => {
        if (!startAutoRefresh || !autoRefresh) return;
        const interval = setInterval(() => {
            autoRefresh(viz.id);
        }, (refreshSecond ?? 10) * 1000);
        return () => clearInterval(interval);
    }, [startAutoRefresh, autoRefresh, refreshSecond]);

    if (!viz) return <Skeleton />;

    const rawLayout = viz.layout || [];
    const layoutArray: any[] = Array.isArray(rawLayout)
        ? rawLayout
        : (rawLayout as any)['lg'] ?? Object.values(rawLayout)[0] ?? [];
    const layout = layoutArray.map((item: any) => ({ ...item }));

    const getChart = (id: number) => charts?.find((c) => c.id === id);

    // rowHeight adaptatif : assez grand pour voir le graphique + légende
    const makeGrid = (fsMode: boolean) => {
        const rh = fsMode ? 100 : 130;
        return (
            <div ref={ref} style={{ width: '100%' }}>
                {!layout.length ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Aucun graphique dans ce dashboard</div>
                ) : (
                    <Responsive
                        width={bounds.width || (fsMode ? window.innerWidth * 0.96 : 800)}
                        layouts={{ lg: layout }}
                        breakpoints={{ lg: 1200, md: 996, sm: 768 }}
                        cols={{ lg: 12, md: 8, sm: 4 }}
                        rowHeight={rh}
                        {...{ draggableHandle: '.chart-drag-handle' }}
                    >
                        {layout.map((item: any) => {
                            const chart = getChart(item.chart_id);
                            return (
                                <div key={item.i} style={{ background: 'white', borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0', height: '100%', display: 'flex', flexDirection: 'column' }}>
                                    {/* Poignée drag graphique */}
                                    <div className="chart-drag-handle" style={{
                                        height: 5, flexShrink: 0,
                                        background: 'linear-gradient(90deg, #c7d2fe, #a5b4fc)',
                                        cursor: 'grab',
                                    }} title="Maintenir pour déplacer" />
                                    <div style={{ flex: 1, minHeight: 0 }}>
                                        {loading ? <Skeleton /> : <VisualizationChartRenderer chart={chart} filters={filters} />}
                                    </div>
                                </div>
                            );
                        })}
                    </Responsive>
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
                    viz={viz} charts={charts}
                    startAutoRefresh={startAutoRefresh} showFilters={showFilters}
                    onToggleFilters={() => setShowFilters(v => !v)}
                    onToggleAutoRefresh={() => setStartAutoRefresh(v => !v)}
                    onManualRefresh={() => refreshView?.(viz.id)}
                    onFullscreen={() => setFullscreen(true)}
                    onEdit={editView ? () => editView(viz) : undefined}
                    onDelete={removeView ? () => removeView(viz.id) : undefined}
                    onOpen={openView ? () => openView(viz, charts) : undefined}
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
            </div>
            {cardGrid()}

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
                                    <button style={{ ...exportBtn, background: startAutoRefresh ? '#6366f1' : 'rgba(255,255,255,0.12)', color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}
                                        onClick={() => setStartAutoRefresh(v => !v)}>
                                        {startAutoRefresh ? '⏸ Stop' : '▶ Auto'}
                                    </button>
                                    <button style={{ ...exportBtn, background: 'rgba(255,255,255,0.12)', color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}
                                        onClick={() => refreshView?.(viz.id)}>
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