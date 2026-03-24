import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { DatasetChart, ExecuteChartResponse } from "@/models/dataset.models";
import { chartService } from "@/services/dataset.service";

import { Responsive } from "react-grid-layout";
import useMeasure from "react-use-measure";

import { Button } from "@/components/ui/Button/Button";
import { Badge } from "@/components/ui/Badge/Badge";
import { FormInput } from "@/components/forms/FormInput/FormInput";

import { Visualization } from "@/models/visualization.model";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { ExportTypes } from "@/components/download/download";
import { ChartRendererPreview } from "../admins/components/datasets/DatasetCharts/components/chart-utils/ChartRenderer";


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

    const layout = (viz.layout || []).map((item: any) => ({ ...item }));

    const getChart = (id: number) => charts?.find((c) => c.id === id);

    return (
        <div className={`${fullscreen ? "fixed inset-0 z-50 bg-gray-50" : ""}`}>
            {/* <div className={`${fullscreen ? "fixed inset-0 z-50 bg-white p-4" : "p-6"} bg-gray-50 min-h-screen`}> */}

            {/* ================= HEADER ================= */}
            <div
            // className="sticky top-0 z-20 backdrop-blur bg-white/80 border-b px-6 py-4 flex flex-wrap justify-between items-center gap-4"
            >
                {/* LEFT */}
                <div className="flex gap-2 mt-2 flex-wrap">
                    <h1 className="text-xl font-semibold">{viz.name}</h1>
                    {/* <p className="text-sm text-gray-500">{viz.description}</p> */}
                    {/* <span className={`px-2 py-1 text-xs rounded ${statusColor(viz.status)}`}>{viz.status}</span> */}
                    <Badge>{viz.type}</Badge>
                    <Badge>{viz.state}</Badge>
                    <Badge>{viz.status}</Badge>
                </div>

                {/* RIGHT ACTIONS */}
                <div className="flex gap-2 flex-wrap">
                    <Button size="sm" variant="outline" onClick={() => setShowFilters(v => !v)}>🔍 Filters</Button>
                    <Button size="sm" variant="outline" onClick={() => setStartAutoRefresh(v => !v)}>{startAutoRefresh ? "⏸ Stop Refresh" : "▶ Auto Refresh"}</Button>
                    <Button size="sm" variant="outline" onClick={() => setShowDownloadBtn(v => !v)}>📄 Export</Button>
                    <Button size="sm" onClick={() => setFullscreen(v => !v)}>{fullscreen ? "🡼 Exit Fullscreen" : "⛶ Fullscreen"}</Button>

                    {editView && (<Button size="sm" onClick={() => editView(viz)}>Edit</Button>)}
                    {removeView && (<Button size="sm" variant="danger" onClick={() => removeView(viz.id)}>Delete</Button>)}
                    {openView && (<Button size="sm" onClick={() => openView(viz, charts)}>Open</Button>)}
                    {refreshView && (<Button size="sm" onClick={() => refreshView(viz.id)}>Refresh</Button>)}



                    {/* <Button onClick={() => workflowAction(viz.id!, "publish")}>Publish</Button>
                    <Button onClick={() => workflowAction(viz.id!, "archive")}>Archive</Button>
                    <Button onClick={() => workflowAction(viz.id!, "execute")}>Run</Button>
                    <Button onClick={() => window.open(`/api/export/pdf/${viz.id}`)}>Export PDF</Button>
                    <Button onClick={() => window.open(`/api/export/excel/${viz.id}`)}>Export Excel</Button> */}
                </div>
            </div>

            {/* ================= FILTER PANEL ================= */}
            {showFilters && (
                <div className="bg-white border-b p-4 flex flex-wrap gap-3 animate-fade-in">
                    <FormInput placeholder="Region" value={filters.region || ""} onChange={(e) => setFilters({ ...filters, region: e.target.value })} />
                    <FormInput type="date" value={filters.date || ""} onChange={(e) => setFilters({ ...filters, date: e.target.value })} />
                    <Button onClick={() => { console.log("apply filters", filters); }} >Apply Filters</Button>
                </div>
            )}

            {/* ================= EMPTY ================= */}
            {!layout.length && (
                <div className="flex items-center justify-center h-[300px] text-gray-400">No charts in this dashboard</div>
            )}

            {/* ================= GRID ================= */}
            {/* <div className="p-4"> */}
            <div ref={ref}>
                <Responsive
                    width={bounds.width || 1200}
                    layouts={{ lg: layout }}
                    breakpoints={{ lg: 1200, md: 996, sm: 768 }}
                    cols={{ lg: 12, md: 8, sm: 4 }}
                    rowHeight={40}
                // isDraggable={false}
                // isResizable={false}
                >
                    {layout.map((item: any) => {
                        const chart = getChart(item.chart_id);

                        return (
                            <div key={item.i}
                            // className="bg-white rounded-xl shadow-md border hover:shadow-xl transition-all group"
                            >

                                {/* <div className="h-full flex flex-col rounded-2xl border bg-white shadow-sm hover:shadow-lg transition overflow-hidden"> */}

                                {/* <div className="flex items-center justify-between px-3 py-2 border-b bg-gray-50">
                                            <span className="text-sm font-medium truncate">{chart?.name || "Chart"}</span>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                            </div>
                                        </div> */}

                                {/* <div className="flex-1 min-h-full"> */}
                                {loading ? <Skeleton /> : <VisualizationChartRenderer chart={chart} filters={filters} showDownloadBtn={showDownloadBtn} />}
                                {/* </div> */}
                                {/* </div> */}
                            </div>
                        );
                    })}
                </Responsive>
            </div>
            {/* </div> */}
        </div>
    );
};