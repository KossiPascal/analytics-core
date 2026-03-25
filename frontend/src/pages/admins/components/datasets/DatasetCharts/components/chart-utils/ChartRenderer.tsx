import React, { forwardRef, RefObject, useImperativeHandle, useRef } from "react";

import { BarRenderer } from "../renderers/BarRenderer";
import { LineRenderer } from "../renderers/LineRenderer";
import { PieRenderer } from "../renderers/PieRenderer";
import { TableRenderer } from "../renderers/TableRenderer";
import { KpiRenderer } from "../renderers/KpiRenderer";
import { AreaRenderer } from "../renderers/AreaRenderer";
import { DonutRenderer } from "../renderers/DonutRenderer";
import { GaugeRenderer } from "../renderers/GaugeRenderer";
import { HeatmapRenderer } from "../renderers/HeatmapRenderer";
import { HorizontalBarRenderer } from "../renderers/HorizontalBarRenderer";
import { RadarRenderer } from "../renderers/RadarRenderer";
import { StackedAreaRenderer } from "../renderers/StackedAreaRenderer";
import { StackedBarRenderer } from "../renderers/StackedBarRenderer";
import { ChartRenderProp, ExecuteChartResponse, SqlChartTypeList } from "@/models/dataset.models";
import { ExportTypes, handleExport } from "@/components/download/download";

const Renderers: Record<string, any> = {
  bar: BarRenderer,
  line: LineRenderer,
  pie: PieRenderer,
  table: TableRenderer,
  kpi: KpiRenderer,
  horizontal_bar: HorizontalBarRenderer,
  stacked_bar: StackedBarRenderer,
  area: AreaRenderer,
  stacked_area: StackedAreaRenderer,
  donut: DonutRenderer,
  gauge: GaugeRenderer,
  radar: RadarRenderer,
  heatmap: HeatmapRenderer,
};

type Props = {
  executeResponse: ExecuteChartResponse | undefined,
  withContainer?: boolean;
  customOptions?: {
    showTitle?: boolean;
    showSubTitle?: boolean;
    showDownload?: boolean;
    showSearcInput?: boolean;
    showExportBtn?: boolean;
  }
}

export const ChartRendererPreview = forwardRef((props: Props, ref) => {
  const { executeResponse, withContainer, customOptions } = props ?? {};
  const { chart, data } = executeResponse ?? {};

  const containerRef = useRef<HTMLDivElement>(null);

  // const chartRef = ref as RefObject<any>;

  // 👉 expose method
  useImperativeHandle(ref, () => ({
    getElement: () => containerRef.current,
    download: (type: ExportTypes) => handleExport(
      {
        resp: executeResponse,
        element: containerRef.current,
        type,
        filename: chart?.name,
      }),
  }));

  if (!chart?.query_id) return <div>Select query to preview</div>;
  if (!SqlChartTypeList.includes(chart?.type)) return <div>Type not supported</div>;

  const Renderer = Renderers[chart?.type];
  if (!Renderer) return <div className="text-gray-400 p-4">Aperçu non disponible</div>;

  return (
    <div ref={containerRef} style={{ background: "#fafafa", padding: '0.3rem',}} className="w-full h-full bg-white flex flex-col">
      {withContainer && (
        <div className="p-3 border-b bg-gray-50 text-sm font-semibold">
          {chart?.name || "Chart Preview"}
        </div>
      )}

      <div className="flex-1 min-h-0">
        <Renderer chart={chart} data={data || []} customOptions={customOptions} />
      </div>
    </div>
  );
});
