// ============================================================================
// CHART COMPONENTS - Export all chart components
// ============================================================================

// Main unified component
export { Chart } from './Chart';

// Individual chart components
export { LineChart } from './LineChart';
export { AreaChart } from './AreaChart';
export { BarChart } from './BarChart';
export { PieChart, DonutChart } from './PieChart';
export { RadarChart } from './RadarChart';
export { RadialBarChart } from './RadialBarChart';
export { ScatterChart } from './ScatterChart';
export { ComposedChart } from './ComposedChart';
export { TreemapChart } from './TreemapChart';
export { FunnelChart } from './FunnelChart';

// Helper components
export {
  CustomTooltip,
  CustomLegend,
  ChartContainer,
  ChartLoading,
  ChartNoData,
  useHiddenSeries,
} from './ChartHelpers';

// Theme and utilities
export {
  CHART_COLORS,
  DEFAULT_ANIMATION,
  DEFAULT_MARGIN,
  DEFAULT_GRID,
  DEFAULT_TOOLTIP_STYLE,
  DEFAULT_LEGEND_STYLE,
  DEFAULT_AXIS_STYLE,
  getChartColor,
  generateGradientId,
  createGradientDef,
  formatNumber,
  formatPercent,
  abbreviateNumber,
} from './theme';

// Types
export type {
  ChartType,
  ChartDataItem,
  ChartSeries,
  ChartMargin,
  TooltipOptions,
  LegendOptions,
  GridOptions,
  AxisOptions,
  AnimationOptions,
  LineChartOptions,
  AreaChartOptions,
  BarChartOptions,
  PieChartOptions,
  RadarChartOptions,
  RadialBarChartOptions,
  ScatterChartOptions,
  TreemapOptions,
  FunnelOptions,
  BaseChartProps,
  LineChartProps,
  AreaChartProps,
  BarChartProps,
  PieChartProps,
  RadarChartProps,
  RadialBarChartProps,
  ScatterChartProps,
  ComposedChartProps,
  TreemapChartProps,
  FunnelChartProps,
} from './types';
