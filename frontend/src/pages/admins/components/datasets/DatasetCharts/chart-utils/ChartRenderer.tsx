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

export const ChartRendererPreview = ({ executeResponse }: { executeResponse: ExecuteChartResponse | undefined }) => {

  const { chart, data } = executeResponse ?? {};

  if (!chart?.query_id) {
    return <div>Select query to preview</div>;
  }

  if (!SqlChartTypeList.includes(chart?.type)) {
    return <div>Type not supported</div>;
  }

  const Renderer = Renderers[chart?.type];
  if (!Renderer) {
    return <div className="text-gray-400 p-4">Aperçu non disponible</div>;
  }

  return (
    <div style={{ background: "#fafafa", padding: 16 }}>
      <h3>Preview</h3>
      <Renderer chart={chart} data={data || []} />
    </div>
  );
};
