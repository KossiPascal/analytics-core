import { useMemo } from 'react';
import {
  ComposedChart as RechartsComposedChart,
  Line,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { ComposedChartProps } from './types';
import {
  CHART_COLORS,
  DEFAULT_MARGIN,
  DEFAULT_ANIMATION,
  DEFAULT_AXIS_STYLE,
  getChartColor,
  abbreviateNumber,
  generateGradientId,
} from './theme';
import {
  CustomTooltip,
  CustomLegend,
  ChartContainer,
  useHiddenSeries,
} from './ChartHelpers';

export function ComposedChart({
  data,
  series = [],
  height = 300,
  margin = DEFAULT_MARGIN,
  tooltip = { enabled: true },
  legend = { enabled: true },
  grid = { horizontal: true, vertical: false },
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
}: ComposedChartProps) {
  const {
    curveType = 'monotone',
    showDots = true,
    dotSize = 4,
    activeDotSize = 6,
    barSize,
    radius = 4,
  } = options;

  const { hiddenSeries, toggleSeries, isSeriesHidden } = useHiddenSeries();

  // Series must be explicitly defined for composed charts
  const chartSeries = useMemo(() => {
    if (series.length > 0) return series;

    // Auto-generate with default types (bar for first, line for rest)
    const dataKeys = data.length > 0
      ? Object.keys(data[0]).filter(
          (key) => key !== (xAxis.dataKey || 'name') && typeof data[0][key] === 'number'
        )
      : [];

    return dataKeys.map((key, index) => ({
      dataKey: key,
      name: key,
      color: getChartColor(index, colors),
      type: index === 0 ? 'bar' : 'line' as 'bar' | 'line' | 'area',
    }));
  }, [data, series, xAxis.dataKey, colors]);

  const noData = !data || data.length === 0;

  // Separate series by type
  const barSeries = chartSeries.filter((s) => s.type === 'bar');
  const lineSeries = chartSeries.filter((s) => s.type === 'line');
  const areaSeries = chartSeries.filter((s) => s.type === 'area');

  // Calculate bar radius
  const barRadius = useMemo(() => {
    if (Array.isArray(radius)) return radius;
    return [radius, radius, radius, radius];
  }, [radius]);

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
        <RechartsComposedChart
          data={data}
          margin={margin}
          onClick={(e) => e?.activePayload && onClick?.(e.activePayload[0].payload, e.activeTooltipIndex || 0)}
        >
          <defs>
            {areaSeries.map((s, index) => {
              const color = s.color || getChartColor(chartSeries.indexOf(s), colors);
              const gradientId = generateGradientId(color, index);
              return (
                <linearGradient key={gradientId} id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.1} />
                </linearGradient>
              );
            })}
          </defs>

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
              dataKey={xAxis.dataKey || 'name'}
              tick={{ ...DEFAULT_AXIS_STYLE }}
              tickLine={false}
              axisLine={{ stroke: CHART_COLORS.border }}
              tickFormatter={xAxis.tickFormatter}
              hide={xAxis.hide}
            />
          )}

          {yAxis.enabled !== false && (
            <YAxis
              tick={{ ...DEFAULT_AXIS_STYLE }}
              tickLine={false}
              axisLine={{ stroke: CHART_COLORS.border }}
              tickFormatter={yAxis.tickFormatter || abbreviateNumber}
              domain={yAxis.domain}
              tickCount={yAxis.tickCount}
              hide={yAxis.hide}
            />
          )}

          {tooltip.enabled !== false && (
            <Tooltip
              content={
                <CustomTooltip
                  formatter={tooltip.formatter}
                  labelFormatter={tooltip.labelFormatter}
                />
              }
              cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
            />
          )}

          {legend.enabled !== false && (
            <Legend
              content={
                <CustomLegend
                  onClick={toggleSeries}
                  hiddenSeries={hiddenSeries}
                  iconType="square"
                />
              }
              verticalAlign={legend.position === 'top' ? 'top' : 'bottom'}
              align={legend.align || 'center'}
            />
          )}

          {/* Render Areas first (background) */}
          {areaSeries.map((s) => {
            const seriesIndex = chartSeries.indexOf(s);
            const color = s.color || getChartColor(seriesIndex, colors);
            const gradientId = generateGradientId(color, seriesIndex);
            return (
              <Area
                key={s.dataKey}
                type={curveType}
                dataKey={s.dataKey}
                name={s.name || s.dataKey}
                stroke={color}
                strokeWidth={s.strokeWidth || 2}
                fill={`url(#${gradientId})`}
                fillOpacity={s.fillOpacity || 1}
                stackId={s.stackId}
                hide={isSeriesHidden(s.name || s.dataKey)}
                isAnimationActive={animation.enabled !== false}
                animationDuration={animation.duration || DEFAULT_ANIMATION.duration}
                animationEasing={animation.easing || DEFAULT_ANIMATION.easing}
              />
            );
          })}

          {/* Render Bars */}
          {barSeries.map((s) => {
            const seriesIndex = chartSeries.indexOf(s);
            return (
              <Bar
                key={s.dataKey}
                dataKey={s.dataKey}
                name={s.name || s.dataKey}
                fill={s.color || getChartColor(seriesIndex, colors)}
                barSize={barSize}
                radius={barRadius as [number, number, number, number]}
                stackId={s.stackId}
                hide={isSeriesHidden(s.name || s.dataKey)}
                isAnimationActive={animation.enabled !== false}
                animationDuration={animation.duration || DEFAULT_ANIMATION.duration}
                animationEasing={animation.easing || DEFAULT_ANIMATION.easing}
              />
            );
          })}

          {/* Render Lines last (foreground) */}
          {lineSeries.map((s) => {
            const seriesIndex = chartSeries.indexOf(s);
            return (
              <Line
                key={s.dataKey}
                type={curveType}
                dataKey={s.dataKey}
                name={s.name || s.dataKey}
                stroke={s.color || getChartColor(seriesIndex, colors)}
                strokeWidth={s.strokeWidth || 2}
                dot={showDots ? { r: dotSize, strokeWidth: 2 } : false}
                activeDot={{ r: activeDotSize, strokeWidth: 2 }}
                hide={isSeriesHidden(s.name || s.dataKey)}
                isAnimationActive={animation.enabled !== false}
                animationDuration={animation.duration || DEFAULT_ANIMATION.duration}
                animationEasing={animation.easing || DEFAULT_ANIMATION.easing}
              />
            );
          })}
        </RechartsComposedChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
