import { useMemo } from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { BarChartProps } from './types';
import {
  CHART_COLORS,
  DEFAULT_MARGIN,
  DEFAULT_ANIMATION,
  DEFAULT_AXIS_STYLE,
  getChartColor,
  abbreviateNumber,
} from './theme';
import {
  CustomTooltip,
  CustomLegend,
  ChartContainer,
  useHiddenSeries,
} from './ChartHelpers';

export function BarChart({
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
}: BarChartProps) {
  const {
    stacked = false,
    layout = 'horizontal',
    barSize,
    barGap = 4,
    barCategoryGap = '20%',
    radius = 4,
  } = options;

  const { hiddenSeries, toggleSeries, isSeriesHidden } = useHiddenSeries();

  // Auto-generate series from data keys if not provided
  const chartSeries = useMemo(() => {
    if (series.length > 0) return series;

    const dataKeys = data.length > 0
      ? Object.keys(data[0]).filter(
          (key) => key !== (xAxis.dataKey || 'name') && typeof data[0][key] === 'number'
        )
      : [];

    return dataKeys.map((key, index) => ({
      dataKey: key,
      name: key,
      color: getChartColor(index, colors),
    }));
  }, [data, series, xAxis.dataKey, colors]);

  const noData = !data || data.length === 0;

  // Calculate bar radius based on options
  const barRadius = useMemo(() => {
    if (Array.isArray(radius)) return radius;
    if (typeof radius === 'number') {
      return stacked
        ? [0, 0, 0, 0] // No radius for stacked (except top)
        : [radius, radius, radius, radius];
    }
    return [4, 4, 4, 4];
  }, [radius, stacked]);

  const isVertical = layout === 'vertical';

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
        <RechartsBarChart
          data={data}
          layout={layout}
          margin={margin}
          barGap={barGap}
          barCategoryGap={barCategoryGap}
          onClick={(e) => e?.activePayload && onClick?.(e.activePayload[0].payload, e.activeTooltipIndex || 0)}
        >
          {grid.horizontal || grid.vertical ? (
            <CartesianGrid
              horizontal={isVertical ? grid.vertical : grid.horizontal}
              vertical={isVertical ? grid.horizontal : grid.vertical}
              strokeDasharray={grid.strokeDasharray || '3 3'}
              stroke={CHART_COLORS.grid}
            />
          ) : null}

          {xAxis.enabled !== false && (
            <XAxis
              dataKey={isVertical ? undefined : (xAxis.dataKey || 'name')}
              type={isVertical ? 'number' : 'category'}
              tick={{ ...DEFAULT_AXIS_STYLE }}
              tickLine={false}
              axisLine={{ stroke: CHART_COLORS.border }}
              tickFormatter={isVertical ? (yAxis.tickFormatter || abbreviateNumber) : xAxis.tickFormatter}
              hide={xAxis.hide}
            />
          )}

          {yAxis.enabled !== false && (
            <YAxis
              dataKey={isVertical ? (xAxis.dataKey || 'name') : undefined}
              type={isVertical ? 'category' : 'number'}
              tick={{ ...DEFAULT_AXIS_STYLE }}
              tickLine={false}
              axisLine={{ stroke: CHART_COLORS.border }}
              tickFormatter={isVertical ? xAxis.tickFormatter : (yAxis.tickFormatter || abbreviateNumber)}
              domain={yAxis.domain}
              tickCount={yAxis.tickCount}
              hide={yAxis.hide}
              width={isVertical ? 100 : undefined}
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

          {chartSeries.map((s, index) => (
            <Bar
              key={s.dataKey}
              dataKey={s.dataKey}
              name={s.name || s.dataKey}
              fill={s.color || getChartColor(index, colors)}
              stackId={stacked ? 'stack' : s.stackId}
              barSize={barSize}
              radius={barRadius as [number, number, number, number]}
              hide={isSeriesHidden(s.name || s.dataKey)}
              isAnimationActive={animation.enabled !== false}
              animationDuration={animation.duration || DEFAULT_ANIMATION.duration}
              animationEasing={animation.easing || DEFAULT_ANIMATION.easing}
            >
              {/* Apply individual colors if only one series and data has color property */}
              {chartSeries.length === 1 &&
                data.map((entry, dataIndex) => (
                  <Cell
                    key={`cell-${dataIndex}`}
                    fill={entry.color as string || getChartColor(dataIndex, colors)}
                  />
                ))}
            </Bar>
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
