import { useMemo } from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { LineChartProps } from './types';
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

export function LineChart({
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
}: LineChartProps) {
  const {
    curveType = 'monotone',
    showDots = true,
    dotSize = 4,
    activeDotSize = 6,
    connectNulls = false,
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
        <RechartsLineChart
          data={data}
          margin={margin}
          onClick={(e) => e?.activePayload && onClick?.(e.activePayload[0].payload, e.activeTooltipIndex || 0)}
        >
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
            />
          )}

          {legend.enabled !== false && (
            <Legend
              content={
                <CustomLegend
                  onClick={toggleSeries}
                  hiddenSeries={hiddenSeries}
                  iconType="line"
                />
              }
              verticalAlign={legend.position === 'top' ? 'top' : 'bottom'}
              align={legend.align || 'center'}
            />
          )}

          {chartSeries.map((s, index) => (
            <Line
              key={s.dataKey}
              type={curveType}
              dataKey={s.dataKey}
              name={s.name || s.dataKey}
              stroke={s.color || getChartColor(index, colors)}
              strokeWidth={s.strokeWidth || 2}
              dot={showDots ? { r: dotSize, strokeWidth: 2 } : false}
              activeDot={{ r: activeDotSize, strokeWidth: 2 }}
              connectNulls={connectNulls}
              hide={isSeriesHidden(s.name || s.dataKey)}
              isAnimationActive={animation.enabled !== false}
              animationDuration={animation.duration || DEFAULT_ANIMATION.duration}
              animationEasing={animation.easing || DEFAULT_ANIMATION.easing}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
