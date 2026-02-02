import {
  RadialBarChart as RechartsRadialBarChart,
  RadialBar,
  Legend,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from 'recharts';
import type { RadialBarChartProps } from './types';
import {
  CHART_COLORS,
  DEFAULT_ANIMATION,
  getChartColor,
  formatNumber,
} from './theme';
import {
  CustomTooltip,
  CustomLegend,
  ChartContainer,
} from './ChartHelpers';

// Custom label renderer for radial bars
const renderCustomLabel = ({ cx, cy, midAngle, value, name, fill }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = 30;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill={fill}
      textAnchor="middle"
      dominantBaseline="central"
      fontSize="11"
      fontWeight="600"
    >
      {formatNumber(value)}
    </text>
  );
};

export function RadialBarChart({
  data,
  dataKey,
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
  onClick,
  options = {},
}: RadialBarChartProps) {
  const {
    innerRadius = '30%',
    outerRadius = '100%',
    startAngle = 180,
    endAngle = 0,
    barSize = 20,
    background = true,
    clockWise = true,
  } = options;

  const noData = !data || data.length === 0;

  // Create legend payload
  const legendPayload = data.map((entry, index) => ({
    value: String(entry.name || ''),
    color: (entry.color as string) || getChartColor(index, colors),
    type: 'circle' as const,
  }));

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
        <RechartsRadialBarChart
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          data={data}
          startAngle={startAngle}
          endAngle={endAngle}
          barSize={barSize}
        >
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
              content={<CustomLegend payload={legendPayload} iconType="circle" />}
              verticalAlign="bottom"
              align={legend.align || 'center'}
            />
          )}

          <RadialBar
            dataKey={dataKey}
            background={background ? { fill: CHART_COLORS.background.muted } : undefined}
            // clockWise={clockWise}
            label={renderCustomLabel}
            onClick={(entry, index) => onClick?.(entry, index)}
            isAnimationActive={animation.enabled !== false}
            animationDuration={animation.duration || DEFAULT_ANIMATION.duration}
            animationEasing={animation.easing || DEFAULT_ANIMATION.easing}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={(entry.color as string) || getChartColor(index, colors)}
              />
            ))}
          </RadialBar>
        </RechartsRadialBarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
