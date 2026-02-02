import { useMemo } from 'react';
import {
  RadarChart as RechartsRadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { ChartSeries, RadarChartProps } from './types';
import {
  CHART_COLORS,
  DEFAULT_ANIMATION,
  getChartColor,
} from './theme';
import {
  CustomTooltip,
  CustomLegend,
  ChartContainer,
  useHiddenSeries,
} from './ChartHelpers';

export function RadarChart({
  data,
  series = [],
  height = 300,
  tooltip = { enabled: true },
  legend = { enabled: true },
  animation = { enabled: true },
  colors = CHART_COLORS.primary,
  title,
  subtitle,
  loading,
  noDataMessage,
  className,
  options = {},
}: RadarChartProps) {
  const {
    polarAngleAxisKey = 'subject',
    fillOpacity = 0.3,
    showDots = true,
  } = options;

  const { hiddenSeries, toggleSeries, isSeriesHidden } = useHiddenSeries();

  // Auto-generate series from data keys if not provided
  const chartSeries = useMemo(() => {
    if (series.length > 0) return series;

    const dataKeys = data.length > 0
      ? Object.keys(data[0]).filter(
          (key) => key !== polarAngleAxisKey && typeof data[0][key] === 'number'
        )
      : [];

    return dataKeys.map((key, index) => ({
      dataKey: key,
      name: key,
      color: getChartColor(index, colors),
    })) as ChartSeries[];
  }, [data, series, polarAngleAxisKey, colors]);

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
        <RechartsRadarChart data={data} cx="50%" cy="50%" outerRadius="80%">
          <PolarGrid stroke={CHART_COLORS.grid} />
          <PolarAngleAxis
            dataKey={polarAngleAxisKey}
            tick={{ fill: CHART_COLORS.text.secondary, fontSize: 12 }}
          />
          <PolarRadiusAxis
            tick={{ fill: CHART_COLORS.text.muted, fontSize: 10 }}
            axisLine={false}
          />

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
                  iconType="square"
                />
              }
              verticalAlign="bottom"
              align={legend.align || 'center'}
            />
          )}

          {chartSeries.map((s, index) => {
            const color = s.color || getChartColor(index, colors);
            return (
              <Radar
                key={s.dataKey}
                name={s.name || s.dataKey}
                dataKey={s.dataKey}
                stroke={color}
                fill={color}
                fillOpacity={s.fillOpacity || fillOpacity}
                strokeWidth={2}
                dot={showDots ? { r: 4, fill: color, strokeWidth: 2, stroke: 'white' } : false}
                activeDot={{ r: 6, fill: color, strokeWidth: 2, stroke: 'white' }}
                hide={isSeriesHidden(s.name || s.dataKey)}
                isAnimationActive={animation.enabled !== false}
                animationDuration={animation.duration || DEFAULT_ANIMATION.duration}
                animationEasing={animation.easing || DEFAULT_ANIMATION.easing}
              />
            );
          })}
        </RechartsRadarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
