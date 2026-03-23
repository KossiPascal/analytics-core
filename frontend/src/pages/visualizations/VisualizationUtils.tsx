import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
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
            padding: '0.5rem 0.75rem',
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
    padding: '0.3rem 0.625rem',
    fontSize: '0.78rem', fontWeight: 500,
    borderRadius: 6, border: '1px solid',
    cursor: 'pointer',
    background: active ? '#e0e7ff' : '#ffffff',
    color: active ? '#4338ca' : '#475569',
    borderColor: active ? '#a5b4fc' : '#e2e8f0',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap' as const,
});

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
        <div className="relative group" >
            {/* Floating actions */}
            {showDownloadBtn && (<div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition flex gap-1">
                <Button size="sm" variant="outline" className="hover:bg-gray-200 p-1 rounded" onClick={executeQuery}>🔄</Button>
                <Button size="sm" variant="outline" className="hover:bg-gray-200 p-1 rounded" onClick={() => console.log("expand")}>⛶</Button>

                <Button size="sm" variant="outline" className="hover:bg-gray-200 p-1 rounded" onClick={() => download("png")}>⬇ PNG</Button>
                <Button size="sm" variant="outline" className="hover:bg-gray-200 p-1 rounded" onClick={() => download("jpg")}>⬇ JPG</Button>
                <Button size="sm" variant="outline" className="hover:bg-gray-200 p-1 rounded" onClick={() => download("pdf-landscape")}>⬇ PDF (L)</Button>
                <Button size="sm" variant="outline" className="hover:bg-gray-200 p-1 rounded" onClick={() => download("pdf-portrait")}>⬇ PDF (P)</Button>
                <Button size="sm" variant="outline" className="hover:bg-gray-200 p-1 rounded" onClick={() => download("excel")}>⬇ Excel</Button>
                <Button size="sm" variant="outline" className="hover:bg-gray-200 p-1 rounded" onClick={() => download("csv")}>⬇ CSV</Button>
                <Button size="sm" variant="outline" className="hover:bg-gray-200 p-1 rounded" onClick={() => download("json")}>⬇ JSON</Button>
            </div>)}

            <ChartRendererPreview ref={chartRef} executeResponse={response} withContainer={false} customOptions={options} />
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

    return (
        <div className={fullscreen ? "fixed inset-0 z-[9999] bg-white flex flex-col overflow-hidden" : ""}>

            {/* ================= TOOLBAR (masqué en fullscreen) ================= */}
            {!fullscreen && (
                <>
                    <VisualizationToolbar
                        viz={viz}
                        charts={charts}
                        startAutoRefresh={startAutoRefresh}
                        showDownloadBtn={showDownloadBtn}
                        showFilters={showFilters}
                        onToggleFilters={() => setShowFilters(v => !v)}
                        onToggleAutoRefresh={() => setStartAutoRefresh(v => !v)}
                        onManualRefresh={() => refreshView?.(viz.id)}
                        onToggleExport={() => setShowDownloadBtn(v => !v)}
                        onFullscreen={() => setFullscreen(true)}
                        onEdit={editView ? () => editView(viz) : undefined}
                        onDelete={removeView ? () => removeView(viz.id) : undefined}
                        onOpen={openView ? () => openView(viz, charts) : undefined}
                    />

                    {/* ================= FILTER PANEL ================= */}
                    {showFilters && (
                        <div className="bg-slate-50 border-b px-4 py-3 flex flex-wrap gap-3">
                            <FormInput placeholder="Region" value={filters.region || ""} onChange={(e) => setFilters({ ...filters, region: e.target.value })} />
                            <FormInput type="date" value={filters.date || ""} onChange={(e) => setFilters({ ...filters, date: e.target.value })} />
                            <Button size="sm" onClick={() => { console.log("apply filters", filters); }}>Appliquer</Button>
                        </div>
                    )}
                </>
            )}

            {/* ================= BOUTON EXIT FULLSCREEN (flottant) ================= */}
            {fullscreen && (
                <button
                    onClick={() => setFullscreen(false)}
                    style={{
                        position: 'fixed', top: 70, right: 18, zIndex: 99999,
                        background: 'rgba(30,41,59,0.9)', color: 'white',
                        border: 'none', borderRadius: 6, padding: '7px 16px',
                        cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                        backdropFilter: 'blur(4px)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    }}
                >
                    ✕ Exit Fullscreen
                </button>
            )}

            {/* ================= EMPTY ================= */}
            {!layout.length && (
                <div className="flex items-center justify-center h-[300px] text-gray-400">No charts in this dashboard</div>
            )}

            {/* ================= GRID ================= */}
            <div
                ref={ref}
                style={fullscreen ? {
                    flex: 1,
                    overflow: 'auto',
                    background: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '24px 32px',
                    width: '100%',
                    boxSizing: 'border-box',
                } : {}}
            >
                <div style={fullscreen ? { width: '100%', maxWidth: '100%' } : { width: '100%' }}>
                    <Responsive
                        width={bounds.width || window.innerWidth}
                        layouts={{ lg: layout }}
                        breakpoints={{ lg: 1200, md: 996, sm: 768 }}
                        cols={{ lg: 12, md: 8, sm: 4 }}
                        rowHeight={fullscreen ? 80 : 40}
                    >
                        {layout.map((item: any) => {
                            const chart = getChart(item.chart_id);
                            return (
                                <div key={item.i} style={fullscreen ? { background: 'white', borderRadius: 8, overflow: 'hidden' } : {}}>
                                    {loading ? <Skeleton /> : <VisualizationChartRenderer chart={chart} filters={filters} showDownloadBtn={showDownloadBtn} />}
                                </div>
                            );
                        })}
                    </Responsive>
                </div>
            </div>
        </div>
    );
};