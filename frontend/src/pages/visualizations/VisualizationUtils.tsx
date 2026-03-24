import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
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
    showDownloadBtn?: boolean;
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
    showDownloadBtn: boolean;
    showFilters: boolean;
    onToggleFilters: () => void;
    onToggleAutoRefresh: () => void;
    onManualRefresh: () => void;
    onToggleExport: () => void;
    onFullscreen: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    onOpen?: () => void;
};

function VisualizationToolbar({
    startAutoRefresh, showDownloadBtn, showFilters,
    onToggleFilters, onToggleAutoRefresh, onManualRefresh,
    onToggleExport, onFullscreen, onEdit, onDelete, onOpen,
}: ToolbarProps) {
    const [refreshOpen, setRefreshOpen] = useState(false);

    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '0.375rem',
            padding: '0.375rem 0.625rem',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            flexWrap: 'wrap',
        }}>
            {/* Filters */}
            <button onClick={onToggleFilters} style={btnStyle(showFilters)} title="Filtres">
                🔍
            </button>

            {/* Export */}
            <button onClick={onToggleExport} style={btnStyle(showDownloadBtn)} title="Export">
                📄
            </button>

            {/* Refresh dropdown */}
            <div style={{ position: 'relative' }}>
                <button
                    onClick={() => setRefreshOpen(v => !v)}
                    style={{
                        ...btnStyle(startAutoRefresh),
                        paddingRight: '0.625rem',
                        display: 'flex', alignItems: 'center', gap: 4,
                    }}
                    title="Rafraîchissement"
                >
                    {startAutoRefresh ? '⏳' : '🔄'} Refresh <span style={{ fontSize: '0.6rem', opacity: 0.7 }}>▼</span>
                </button>
                {refreshOpen && (
                    <div style={{
                        position: 'absolute', top: '110%', left: 0, zIndex: 100,
                        background: 'white', border: '1px solid #e2e8f0',
                        borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                        minWidth: 170, overflow: 'hidden',
                    }}>
                        <button
                            onClick={() => { onToggleAutoRefresh(); setRefreshOpen(false); }}
                            style={dropItemStyle(startAutoRefresh)}
                        >
                            {startAutoRefresh ? '⏸ Stop Auto Refresh' : '▶ Auto Refresh'}
                        </button>
                        <button
                            onClick={() => { onManualRefresh(); setRefreshOpen(false); }}
                            style={dropItemStyle(false)}
                        >
                            🔄 Rafraîchir maintenant
                        </button>
                    </div>
                )}
            </div>

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Fullscreen */}
            <button onClick={onFullscreen} style={btnStyle(false)} title="Plein écran">⛶</button>

            {/* Open */}
            {onOpen && (
                <button onClick={onOpen} style={{ ...btnStyle(false), background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }} title="Ouvrir">
                    Ouvrir
                </button>
            )}

            {/* Edit */}
            {onEdit && (
                <button onClick={onEdit} style={{ ...btnStyle(false), background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }} title="Modifier">
                    Modifier
                </button>
            )}

            {/* Delete */}
            {onDelete && (
                <button onClick={onDelete} style={{ ...btnStyle(false), background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }} title="Supprimer">
                    Supprimer
                </button>
            )}
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
export function VisualizationChartRenderer({ chart, filters, showDownloadBtn }: RendererProps) {
    const [response, setResponse] = useState<ExecuteChartResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const chartRef = useRef<any>(null);
    const [showChartMenu, setShowChartMenu] = useState(false);
    const [chartFullscreen, setChartFullscreen] = useState(false);

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
        <>
            {/* ── Fullscreen individuel (modal animé) ── */}
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
                                position: 'fixed', top: '2vh', left: '2vw', right: '2vw', bottom: '2vh',
                                zIndex: 9999, background: 'white', borderRadius: 16,
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

            {/* Barre export */}
            {showDownloadBtn && (
                <div style={{
                    display: 'flex', flexWrap: 'wrap', gap: '0.25rem',
                    padding: '0.3rem 0.625rem',
                    background: '#f1f5f9',
                    borderBottom: '1px solid #e2e8f0',
                }}>
                    <button style={exportBtn} onClick={executeQuery} title="Rafraîchir">🔄</button>
                    {(['png','jpg','pdf-landscape','pdf-portrait','excel','csv','json'] as ExportTypes[]).map(t => (
                        <button key={t} style={exportBtn} onClick={() => download(t)}>
                            ⬇ {t === 'pdf-landscape' ? 'PDF (L)' : t === 'pdf-portrait' ? 'PDF (P)' : t.toUpperCase()}
                        </button>
                    ))}
                </div>
            )}

            {/* Graphique + bouton actions */}
            <div style={{ position: 'relative' }}>
                {/* Bouton ⋮ */}
                <div style={{ position: 'absolute', top: 6, right: 6, zIndex: 10 }}>
                    <button
                        onClick={() => setShowChartMenu(v => !v)}
                        style={{
                            width: 24, height: 24, borderRadius: 4,
                            border: '1px solid #e2e8f0', background: 'white',
                            cursor: 'pointer', fontSize: '1rem', lineHeight: 1,
                            color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                        }}
                        title="Actions"
                    >⋮</button>
                    {showChartMenu && (
                        <div style={{
                            position: 'absolute', top: '110%', right: 0,
                            background: 'white', border: '1px solid #e2e8f0',
                            borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                            minWidth: 160, overflow: 'hidden', zIndex: 20,
                        }}>
                            <button style={dropItemStyle(false)} onClick={() => { setChartFullscreen(true); setShowChartMenu(false); }}>
                                ⛶ Plein écran
                            </button>
                            <button style={dropItemStyle(false)} onClick={() => { executeQuery(); setShowChartMenu(false); }}>
                                🔄 Rafraîchir
                            </button>
                        </div>
                    )}
                </div>

                <ChartRendererPreview ref={chartRef} executeResponse={response} withContainer={false} customOptions={options} />
            </div>
        </>
    );
};

// ---------------- DASHBOARD ----------------
export function VisualizationViewModule({ visualization, charts, refreshSecond=10, editView, removeView, openView, refreshView, autoRefresh }: ViewerProps) {

    const [ref, bounds] = useMeasure();

    const [viz, setViz] = useState<Visualization>(visualization);
    const [loading, setLoading] = useState(false);
    const [fullscreen, setFullscreen] = useState(false);
    const [startAutoRefresh, setStartAutoRefresh] = useState(false);
    const [showDownloadBtn, setShowDownloadBtn] = useState(false);

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

    const grid = (fsMode: boolean) => (
        <div ref={ref} style={{ width: '100%' }}>
            {!layout.length ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Aucun graphique dans ce dashboard</div>
            ) : (
                <Responsive
                    width={bounds.width || (fsMode ? window.innerWidth * 0.96 : 800)}
                    layouts={{ lg: layout }}
                    breakpoints={{ lg: 1200, md: 996, sm: 768 }}
                    cols={{ lg: 12, md: 8, sm: 4 }}
                    rowHeight={fsMode ? 80 : 40}
                >
                    {layout.map((item: any) => {
                        const chart = getChart(item.chart_id);
                        return (
                            <div key={item.i} style={{ background: 'white', borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                {loading ? <Skeleton /> : <VisualizationChartRenderer chart={chart} filters={filters} showDownloadBtn={showDownloadBtn} />}
                            </div>
                        );
                    })}
                </Responsive>
            )}
        </div>
    );

    return (
        <>
            {/* ── Vue normale ── */}
            <VisualizationToolbar
                viz={viz} charts={charts}
                startAutoRefresh={startAutoRefresh} showDownloadBtn={showDownloadBtn} showFilters={showFilters}
                onToggleFilters={() => setShowFilters(v => !v)}
                onToggleAutoRefresh={() => setStartAutoRefresh(v => !v)}
                onManualRefresh={() => refreshView?.(viz.id)}
                onToggleExport={() => setShowDownloadBtn(v => !v)}
                onFullscreen={() => setFullscreen(true)}
                onEdit={editView ? () => editView(viz) : undefined}
                onDelete={removeView ? () => removeView(viz.id) : undefined}
                onOpen={openView ? () => openView(viz, charts) : undefined}
            />
            {showFilters && (
                <div style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '0.625rem 1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                    <FormInput placeholder="Region" value={filters.region || ""} onChange={(e) => setFilters({ ...filters, region: e.target.value })} />
                    <FormInput type="date" value={filters.date || ""} onChange={(e) => setFilters({ ...filters, date: e.target.value })} />
                    <Button size="sm" onClick={() => { console.log("apply filters", filters); }}>Appliquer</Button>
                </div>
            )}
            {grid(false)}

            {/* ── Fullscreen dashboard (modal animé) ── */}
            <AnimatePresence>
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
                                position: 'fixed', top: '2vh', left: '2vw', right: '2vw', bottom: '2vh',
                                zIndex: 9991, background: 'white', borderRadius: 16,
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
                                    {/* Toggle export */}
                                    <button style={{ ...exportBtn, background: 'rgba(255,255,255,0.12)', color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}
                                        onClick={() => setShowDownloadBtn(v => !v)}>
                                        📄 Export
                                    </button>
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

                            {/* Barre export si active */}
                            {showDownloadBtn && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', padding: '0.375rem 1rem', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
                                    {(['png','jpg','pdf-landscape','pdf-portrait','excel','csv','json'] as ExportTypes[]).map(t => (
                                        <button key={t} style={exportBtn}>⬇ {t === 'pdf-landscape' ? 'PDF (L)' : t === 'pdf-portrait' ? 'PDF (P)' : t.toUpperCase()}</button>
                                    ))}
                                </div>
                            )}

                            {/* Grille fullscreen */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                                {grid(true)}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};