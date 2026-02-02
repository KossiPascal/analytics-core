import type { CurveType } from 'recharts/types/shape/Curve';

// ============================================================================
// COMMON TYPES
// ============================================================================

export type ChartType =
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
  | 'funnel';

export interface ChartDataItem {
  [key: string]: string | number | null | undefined;
}

export interface ChartSeries {
  dataKey: string;
  name?: string;
  color?: string;
  type?: 'line' | 'area' | 'bar';
  strokeWidth?: number;
  fillOpacity?: number;
  stackId?: string;
  hide?: boolean;
}

// ============================================================================
// COMMON OPTIONS
// ============================================================================

export interface ChartMargin {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

export interface TooltipOptions {
  enabled?: boolean;
  formatter?: (value: number, name: string) => string;
  labelFormatter?: (label: string) => string;
}

export interface LegendOptions {
  enabled?: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'left' | 'center' | 'right';
  iconType?: 'line' | 'square' | 'rect' | 'circle' | 'cross' | 'diamond' | 'star' | 'triangle' | 'wye';
}

export interface GridOptions {
  enabled?: boolean;
  horizontal?: boolean;
  vertical?: boolean;
  strokeDasharray?: string;
}

export interface AxisOptions {
  enabled?: boolean;
  label?: string;
  tickFormatter?: (value: number | string) => string;
  domain?: [number | string, number | string];
  tickCount?: number;
  hide?: boolean;
}

export interface AnimationOptions {
  enabled?: boolean;
  duration?: number;
  easing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
}

// ============================================================================
// CHART-SPECIFIC OPTIONS
// ============================================================================

export interface LineChartOptions {
  curveType?: CurveType;
  showDots?: boolean;
  dotSize?: number;
  activeDotSize?: number;
  connectNulls?: boolean;
}

export interface AreaChartOptions extends LineChartOptions {
  stacked?: boolean;
  gradientFill?: boolean;
}

export interface BarChartOptions {
  stacked?: boolean;
  layout?: 'horizontal' | 'vertical';
  barSize?: number;
  barGap?: number;
  barCategoryGap?: string | number;
  radius?: number | [number, number, number, number];
}

export interface PieChartOptions {
  innerRadius?: number | string;
  outerRadius?: number | string;
  paddingAngle?: number;
  startAngle?: number;
  endAngle?: number;
  labelLine?: boolean;
  showLabels?: boolean;
  labelType?: 'percent' | 'value' | 'name';
}

export interface RadarChartOptions {
  polarAngleAxisKey?: string;
  fillOpacity?: number;
  showDots?: boolean;
}

export interface RadialBarChartOptions {
  innerRadius?: number | string;
  outerRadius?: number | string;
  startAngle?: number;
  endAngle?: number;
  barSize?: number;
  background?: boolean;
  clockWise?: boolean;
}

export interface ScatterChartOptions {
  xAxisKey?: string;
  yAxisKey?: string;
  zAxisKey?: string;
  shape?: 'circle' | 'cross' | 'diamond' | 'square' | 'star' | 'triangle' | 'wye';
}

export interface TreemapOptions {
  dataKey?: string;
  aspectRatio?: number;
  animationBegin?: number;
  isAnimationActive?: boolean;
}

export interface FunnelOptions {
  dataKey?: string;
  isAnimationActive?: boolean;
  lastShapeType?: 'rectangle' | 'triangle';
}

// ============================================================================
// MAIN CHART PROPS
// ============================================================================

export interface BaseChartProps {
  data: ChartDataItem[];
  series?: ChartSeries[];
  height?: number | string;
  width?: number | string;
  margin?: ChartMargin;
  tooltip?: TooltipOptions;
  legend?: LegendOptions;
  grid?: GridOptions;
  xAxis?: AxisOptions & { dataKey?: string };
  yAxis?: AxisOptions;
  animation?: AnimationOptions;
  colors?: string[];
  title?: string;
  subtitle?: string;
  loading?: boolean;
  noDataMessage?: string;
  className?: string;
  onClick?: (data: ChartDataItem, index: number) => void;
}

export interface LineChartProps extends BaseChartProps {
  options?: LineChartOptions;
}

export interface AreaChartProps extends BaseChartProps {
  options?: AreaChartOptions;
}

export interface BarChartProps extends BaseChartProps {
  options?: BarChartOptions;
}

export interface PieChartProps extends Omit<BaseChartProps, 'xAxis' | 'yAxis' | 'grid'> {
  dataKey: string;
  nameKey?: string;
  options?: PieChartOptions;
}

export interface RadarChartProps extends Omit<BaseChartProps, 'xAxis' | 'yAxis' | 'grid'> {
  options?: RadarChartOptions;
}

export interface RadialBarChartProps extends Omit<BaseChartProps, 'xAxis' | 'yAxis' | 'grid'> {
  dataKey: string;
  options?: RadialBarChartOptions;
}

export interface ScatterChartProps extends BaseChartProps {
  options?: ScatterChartOptions;
}

export interface ComposedChartProps extends BaseChartProps {
  options?: LineChartOptions & BarChartOptions;
}

export interface TreemapChartProps extends Omit<BaseChartProps, 'xAxis' | 'yAxis' | 'grid' | 'series'> {
  dataKey: string;
  nameKey?: string;
  options?: TreemapOptions;
}

export interface FunnelChartProps extends Omit<BaseChartProps, 'xAxis' | 'yAxis' | 'grid' | 'series'> {
  dataKey: string;
  nameKey?: string;
  options?: FunnelOptions;
}
