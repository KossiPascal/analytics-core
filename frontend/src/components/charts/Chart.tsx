import type {
  ChartType,
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
  LineChartOptions,
  AreaChartOptions,
  BarChartOptions,
  PieChartOptions,
  RadarChartOptions,
  RadialBarChartOptions,
  ScatterChartOptions,
  TreemapOptions,
  FunnelOptions,
} from './types';

import { LineChart } from './LineChart';
import { AreaChart } from './AreaChart';
import { BarChart } from './BarChart';
import { PieChart, DonutChart } from './PieChart';
import { RadarChart } from './RadarChart';
import { RadialBarChart } from './RadialBarChart';
import { ScatterChart } from './ScatterChart';
import { ComposedChart } from './ComposedChart';
import { TreemapChart } from './TreemapChart';
import { FunnelChart } from './FunnelChart';

// ============================================================================
// UNIFIED CHART COMPONENT
// ============================================================================

type ChartOptions =
  | LineChartOptions
  | AreaChartOptions
  | BarChartOptions
  | PieChartOptions
  | RadarChartOptions
  | RadialBarChartOptions
  | ScatterChartOptions
  | TreemapOptions
  | FunnelOptions;

interface ChartProps extends Omit<BaseChartProps, 'xAxis' | 'yAxis' | 'grid'> {
  type: ChartType;
  options?: ChartOptions;
  // Required for certain chart types
  dataKey?: string;
  nameKey?: string;
  // Optional axis/grid config for charts that support it
  xAxis?: BaseChartProps['xAxis'];
  yAxis?: BaseChartProps['yAxis'];
  grid?: BaseChartProps['grid'];
}

/**
 * Unified Chart component that renders any chart type based on the `type` prop.
 *
 * @example
 * ```tsx
 * // Line Chart
 * <Chart
 *   type="line"
 *   data={data}
 *   series={[{ dataKey: 'value', name: 'Ventes' }]}
 *   xAxis={{ dataKey: 'month' }}
 * />
 *
 * // Bar Chart
 * <Chart
 *   type="bar"
 *   data={data}
 *   series={[{ dataKey: 'sales', name: 'Ventes' }]}
 *   options={{ stacked: true, radius: 8 }}
 * />
 *
 * // Pie Chart
 * <Chart
 *   type="pie"
 *   data={data}
 *   dataKey="value"
 *   nameKey="name"
 *   options={{ innerRadius: '40%' }}
 * />
 *
 * // Composed Chart (mixed bar/line)
 * <Chart
 *   type="composed"
 *   data={data}
 *   series={[
 *     { dataKey: 'sales', name: 'Ventes', type: 'bar' },
 *     { dataKey: 'trend', name: 'Tendance', type: 'line' },
 *   ]}
 * />
 * ```
 */
export function Chart({
  type,
  data,
  series,
  dataKey,
  nameKey,
  height,
  width,
  margin,
  tooltip,
  legend,
  grid,
  xAxis,
  yAxis,
  animation,
  colors,
  title,
  subtitle,
  loading,
  noDataMessage,
  className,
  onClick,
  options,
}: ChartProps) {
  const commonProps = {
    data,
    height,
    width,
    margin,
    tooltip,
    legend,
    animation,
    colors,
    title,
    subtitle,
    loading,
    noDataMessage,
    className,
    onClick,
  };

  const axisProps = {
    grid,
    xAxis,
    yAxis,
  };

  switch (type) {
    case 'line':
      return (
        <LineChart
          {...commonProps}
          {...axisProps}
          series={series}
          options={options as LineChartOptions}
        />
      );

    case 'area':
      return (
        <AreaChart
          {...commonProps}
          {...axisProps}
          series={series}
          options={options as AreaChartOptions}
        />
      );

    case 'bar':
      return (
        <BarChart
          {...commonProps}
          {...axisProps}
          series={series}
          options={options as BarChartOptions}
        />
      );

    case 'pie':
      if (!dataKey) {
        console.error('Chart: dataKey is required for pie chart');
        return null;
      }
      return (
        <PieChart
          {...commonProps}
          dataKey={dataKey}
          nameKey={nameKey}
          options={options as PieChartOptions}
        />
      );

    case 'donut':
      if (!dataKey) {
        console.error('Chart: dataKey is required for donut chart');
        return null;
      }
      return (
        <DonutChart
          {...commonProps}
          dataKey={dataKey}
          nameKey={nameKey}
          options={options as PieChartOptions}
        />
      );

    case 'radar':
      return (
        <RadarChart
          {...commonProps}
          series={series}
          options={options as RadarChartOptions}
        />
      );

    case 'radialBar':
      if (!dataKey) {
        console.error('Chart: dataKey is required for radialBar chart');
        return null;
      }
      return (
        <RadialBarChart
          {...commonProps}
          dataKey={dataKey}
          options={options as RadialBarChartOptions}
        />
      );

    case 'scatter':
      return (
        <ScatterChart
          {...commonProps}
          {...axisProps}
          series={series}
          options={options as ScatterChartOptions}
        />
      );

    case 'composed':
      return (
        <ComposedChart
          {...commonProps}
          {...axisProps}
          series={series}
          options={options as LineChartOptions & BarChartOptions}
        />
      );

    case 'treemap':
      if (!dataKey) {
        console.error('Chart: dataKey is required for treemap chart');
        return null;
      }
      return (
        <TreemapChart
          {...commonProps}
          dataKey={dataKey}
          nameKey={nameKey}
          options={options as TreemapOptions}
        />
      );

    case 'funnel':
      if (!dataKey) {
        console.error('Chart: dataKey is required for funnel chart');
        return null;
      }
      return (
        <FunnelChart
          {...commonProps}
          dataKey={dataKey}
          nameKey={nameKey}
          options={options as FunnelOptions}
        />
      );

    default:
      console.error(`Chart: Unknown chart type "${type}"`);
      return null;
  }
}
