import { useMemo } from 'react';
import {
  ScatterChart as RechartsScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { ScatterChartProps } from './types';
import {
  CHART_COLORS,
  DEFAULT_MARGIN,
  DEFAULT_ANIMATION,
  DEFAULT_AXIS_STYLE,
  getChartColor,
  abbreviateNumber,
  formatNumber,
} from './theme';
import {
  CustomLegend,
  ChartContainer,
  useHiddenSeries,
} from './ChartHelpers';

// Custom tooltip for scatter chart
function ScatterTooltip({ active, payload, formatter }: any) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload;

  return (
    <div
      style={{
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        padding: '12px 16px',
        minWidth: '150px',
      }}
    >
      {data.name && (
        <div
          style={{
            fontWeight: 600,
            fontSize: '13px',
            color: '#1e293b',
            marginBottom: '8px',
            paddingBottom: '8px',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          {data.name}
        </div>
      )}
      {payload.map((entry: any, index: number) => (
        <div
          key={index}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            padding: '4px 0',
          }}
        >
          <span style={{ color: '#64748b', fontSize: '13px' }}>{entry.name}</span>
          <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '13px' }}>
            {formatter ? formatter(entry.value, entry.name) : formatNumber(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function ScatterChart({
  data,
  series = [],
  height = 300,
  margin = DEFAULT_MARGIN,
  tooltip = { enabled: true },
  legend = { enabled: true },
  grid = { horizontal: true, vertical: true },
  xAxis = { enabled: true },
  yAxis = { enabled: true },
  animation = { enabled: true },
  colors = CHART_COLORS.primary,
  title,
  subtitle,
  loading,
  noDataMessage,
  className,
  onClick,
  options = {},
}: ScatterChartProps) {
  const {
    xAxisKey = 'x',
    yAxisKey = 'y',
    zAxisKey,
    shape = 'circle',
  } = options;

  const { hiddenSeries, toggleSeries, isSeriesHidden } = useHiddenSeries();

  // If data is flat (single series), wrap it
  const chartData = useMemo(() => {
    if (series.length > 0) {
      return series.map((s, index) => ({
        name: s.name || s.dataKey,
        data: data.filter((d) => d.series === s.dataKey || !d.series),
        color: s.color || getChartColor(index, colors),
      }));
    }

    // Single series
    return [
      {
        name: 'Data',
        data: data,
        color: getChartColor(0, colors),
      },
    ];
  }, [data, series, colors]);

  const noData = !data || data.length === 0;

  // Calculate z-axis range if zAxisKey is provided
  const zRange = useMemo(() => {
    if (!zAxisKey) return undefined;
    const values = data.map((d) => Number(d[zAxisKey]) || 0);
    return [Math.min(...values), Math.max(...values)] as [number, number];
  }, [data, zAxisKey]);

  return (
    <ChartContainer
      title={title}
      subtitle={subtitle}
      loading={loading}
      noData={noData}
      noDataMessage={noDataMessage}
      height={height}
      className={className}
    >
      <ResponsiveContainer width="100%" height="100%">
        <RechartsScatterChart margin={margin}>
          {grid.horizontal || grid.vertical ? (
            <CartesianGrid
              horizontal={grid.horizontal}
              vertical={grid.vertical}
              strokeDasharray={grid.strokeDasharray || '3 3'}
              stroke={CHART_COLORS.grid}
            />
          ) : null}

          {xAxis.enabled !== false && (
            <XAxis
              type="number"
              dataKey={xAxisKey}
              name={xAxis.label || xAxisKey}
              tick={{ ...DEFAULT_AXIS_STYLE }}
              tickLine={false}
              axisLine={{ stroke: CHART_COLORS.border }}
              tickFormatter={xAxis.tickFormatter || abbreviateNumber}
              domain={xAxis.domain}
              hide={xAxis.hide}
            />
          )}

          {yAxis.enabled !== false && (
            <YAxis
              type="number"
              dataKey={yAxisKey}
              name={yAxis.label || yAxisKey}
              tick={{ ...DEFAULT_AXIS_STYLE }}
              tickLine={false}
              axisLine={{ stroke: CHART_COLORS.border }}
              tickFormatter={yAxis.tickFormatter || abbreviateNumber}
              domain={yAxis.domain}
              hide={yAxis.hide}
            />
          )}

          {zAxisKey && (
            <ZAxis
              type="number"
              dataKey={zAxisKey}
              range={[50, 400]}
              domain={zRange}
            />
          )}

          {tooltip.enabled !== false && (
            <Tooltip
              content={<ScatterTooltip formatter={tooltip.formatter} />}
              cursor={{ strokeDasharray: '3 3' }}
            />
          )}

          {legend.enabled !== false && chartData.length > 1 && (
            <Legend
              content={
                <CustomLegend
                  onClick={toggleSeries}
                  hiddenSeries={hiddenSeries}
                  iconType="circle"
                />
              }
              verticalAlign="bottom"
              align={legend.align || 'center'}
            />
          )}

          {chartData.map((seriesData, seriesIndex) => (
            <Scatter
              key={seriesData.name}
              name={seriesData.name}
              data={seriesData.data}
              fill={seriesData.color}
              shape={shape}
              hide={isSeriesHidden(seriesData.name)}
              onClick={(entry, index) => onClick?.(entry, index)}
              isAnimationActive={animation.enabled !== false}
              animationDuration={animation.duration || DEFAULT_ANIMATION.duration}
              animationEasing={animation.easing || DEFAULT_ANIMATION.easing}
            >
              {seriesData.data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={(entry.color as string) || seriesData.color}
                />
              ))}
            </Scatter>
          ))}
        </RechartsScatterChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
