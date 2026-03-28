import { ExportTypes } from "@/components/download/download";
import { DatasetChart, ExecuteChartResponse } from "@/models/dataset.models";
import { ChartRendererPreview } from "@/pages/admins/components/datasets/DatasetCharts/components/chart-utils/ChartRenderer";
import { chartService } from "@/services/dataset.service";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { Skeleton, exportBtnStyles, VisualizationBtnStyle } from "./VisualizationUtils";
import { Button } from "@/components/ui/Button/Button";



type RendererProps = {
    chart?: DatasetChart;
    filters?: Record<string, any>;
    refreshKey?: number;
};


// ---------------- CHART ----------------
export function VisualizationChartRenderer({ chart, filters, refreshKey }: RendererProps) {
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


    // ---------------- INITIAL LOAD + REFRESH ----------------
    useEffect(() => {
        executeQuery();
    }, [executeQuery, refreshKey]);


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
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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
                                        {(['png', 'jpg', 'excel', 'csv'] as ExportTypes[]).map(t => (
                                            <button key={t} style={{ ...exportBtnStyles, background: 'rgba(255,255,255,0.12)', color: 'white', borderColor: 'rgba(255,255,255,0.2)' }} onClick={() => download(t)}>
                                                ⬇ {t.toUpperCase()}
                                            </button>
                                        ))}
                                        <button style={{ ...exportBtnStyles, background: 'rgba(255,255,255,0.12)', color: 'white', borderColor: 'rgba(255,255,255,0.2)' }} onClick={executeQuery}>
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
                    {(['png', 'jpg', 'pdf-landscape', 'pdf-portrait', 'excel', 'csv', 'json'] as ExportTypes[]).map(t => (
                        <button key={t} style={exportBtnStyles} onClick={() => download(t)}>
                            ⬇ {t === 'pdf-landscape' ? 'PDF (L)' : t === 'pdf-portrait' ? 'PDF (P)' : t.toUpperCase()}
                        </button>
                    ))}
                </div>
            )}

            {/* Barre de boutons au-dessus du graphique */}
            <div style={{
                display: 'flex', justifyContent: 'flex-end', gap: 4,
                padding: '0.25rem 0.5rem',
                background: '#f8fafc', borderBottom: '1px solid #e2e8f0',
                flexShrink: 0,
            }}>
                <button onClick={() => setShowExport(v => !v)} style={VisualizationBtnStyle(showExport)} title="Export">📄</button>
                <button onClick={executeQuery} style={VisualizationBtnStyle(false)} title="Rafraîchir">🔄</button>
                <button onClick={() => setChartFullscreen(true)} style={VisualizationBtnStyle(false)} title="Plein écran">⛶</button>
            </div>

            {/* Graphique */}
            <div style={{ flex: 1, minHeight: 0 }}>
                <ChartRendererPreview ref={chartRef} executeResponse={response} withContainer={false} customOptions={options} />
            </div>
        </div>
    );
};