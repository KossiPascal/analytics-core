import React from 'react';
import { ChartRenderDataProp, DatasetChart, DatasetQuery } from '@/models/dataset.models';
import { BarRenderer } from '../../../components/renderers/BarRenderer';
import { LineRenderer } from '../../../components/renderers/LineRenderer';
import { AreaRenderer } from '../../../components/renderers/AreaRenderer';
import { StackedBarRenderer } from '../../../components/renderers/StackedBarRenderer';
import { StackedAreaRenderer } from '../../../components/renderers/StackedAreaRenderer';
import { PieRenderer } from '../../../components/renderers/PieRenderer';
import { DonutRenderer } from '../../../components/renderers/DonutRenderer';
import { KpiRenderer } from '../../../components/renderers/KpiRenderer';
import { TableRenderer } from '../../../components/renderers/TableRenderer';
import { RadarRenderer } from '../../../components/renderers/RadarRenderer';
import { HeatmapRenderer } from '../../../components/renderers/HeatmapRenderer';
import { GaugeRenderer } from '../../../components/renderers/GaugeRenderer';

interface RenderChartPreviewProps {
  chartType: string;
  chart: DatasetChart;
  query?: DatasetQuery;
  renderData: ChartRenderDataProp;
}

export const RenderChartPreview: React.FC<RenderChartPreviewProps> = ({
  chartType,
  chart,
  query,
  renderData,
}) => {
  const props = {
    chart,
    query: (query ?? {}) as DatasetQuery,
    data: renderData,
  };

  switch (chartType) {
    case 'bar':
      return <BarRenderer {...props} />;
    case 'stacked-bar':
      return <StackedBarRenderer {...props} />;
    case 'line':
      return <LineRenderer {...props} />;
    case 'area':
      return <AreaRenderer {...props} />;
    case 'stacked-area':
      return <StackedAreaRenderer {...props} />;
    case 'pie':
      return <PieRenderer {...props} />;
    case 'donut':
      return <DonutRenderer {...props} />;
    case 'kpi':
      return <KpiRenderer {...props} />;
    case 'table':
      return <TableRenderer {...props} />;
    case 'radar':
      return <RadarRenderer {...props} />;
    case 'heatmap':
      return <HeatmapRenderer {...props} />;
    case 'gauge':
      return <GaugeRenderer {...props} />;
    default:
      return <TableRenderer {...props} />;
  }
};
