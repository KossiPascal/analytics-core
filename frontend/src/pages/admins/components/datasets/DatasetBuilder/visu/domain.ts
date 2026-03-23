export type VisualizationType = 'dashboard' | 'report';

export type ChartVariant =
  | 'line'
  | 'area'
  | 'bar'
  | 'pie'
  | 'donut'
  | 'radar'
  | 'radialBar'
  | 'scatter'
  | 'composed'
  | 'treemap'
  | 'funnel'
  | 'table';

export interface DimensionItem {
  id: string;
  name: string;
  code?: string;
}

export interface LayoutDimension {
  dimension: string;
  items: string[];
}

export interface VisualizationOptions {
  title?: string;
  subtitle?: string;
  showLegend: boolean;
  showTooltip: boolean;
  showGrid: boolean;
  stacked: boolean;
  animation: boolean;
}

export interface VisualizationConfig {
  id?: string;
  name: string;
  description?: string;
  type: VisualizationType;
  chartType: ChartVariant;
  columns: LayoutDimension[];
  rows: LayoutDimension[];
  filters: LayoutDimension[];
  options: VisualizationOptions;
}

export interface StoredVisualization extends VisualizationConfig {
  id: string;
  createdAt: string;
  updatedAt: string;
}
