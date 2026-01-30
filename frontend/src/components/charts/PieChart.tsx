import { useState, useCallback } from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Sector,
} from 'recharts';
import type { PieChartProps, ChartDataItem } from './types';
import {
  CHART_COLORS,
  DEFAULT_ANIMATION,
  getChartColor,
  formatNumber,
  formatPercent,
} from './theme';
import {
  CustomTooltip,
  CustomLegend,
  ChartContainer,
} from './ChartHelpers';

// Active shape for hover effect
const renderActiveShape = (props: any) => {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    percent,
    value,
  } = props;

  return (
    <g>
      <text x={cx} y={cy - 10} dy={8} textAnchor="middle" fill={fill} fontWeight="600" fontSize="14">
        {payload.name}
      </text>
      <text x={cx} y={cy + 10} dy={8} textAnchor="middle" fill="#64748b" fontSize="12">
        {formatNumber(value)} ({(percent * 100).toFixed(1)}%)
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      {innerRadius > 0 && (
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={innerRadius - 4}
          outerRadius={innerRadius - 2}
          fill={fill}
        />
      )}
    </g>
  );
};

// Custom label renderer
const renderLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  name,
  value,
  labelType,
}: any) => {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius * 1.2;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null; // Don't show labels for small slices

  let labelText = '';
  switch (labelType) {
    case 'percent':
      labelText = `${(percent * 100).toFixed(0)}%`;
      break;
    case 'value':
      labelText = formatNumber(value);
      break;
    case 'name':
      labelText = name;
      break;
    default:
      labelText = `${(percent * 100).toFixed(0)}%`;
  }

  return (
    <text
      x={x}
      y={y}
      fill="#64748b"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize="12"
      fontWeight="500"
    >
      {labelText}
    </text>
  );
};

export function PieChart({
  data,
  dataKey,
  nameKey = 'name',
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
}: PieChartProps) {
  const {
    innerRadius = 0,
    outerRadius = '80%',
    paddingAngle = 2,
    startAngle = 90,
    endAngle = -270,
    showLabels = false,
    labelType = 'percent',
  } = options;

  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  const onPieEnter = useCallback((_: any, index: number) => {
    setActiveIndex(index);
  }, []);

  const onPieLeave = useCallback(() => {
    setActiveIndex(undefined);
  }, []);

  const noData = !data || data.length === 0;

  // Calculate total for percentage
  const total = data.reduce((sum, item) => sum + (Number(item[dataKey]) || 0), 0);

  // Create legend payload
  const legendPayload = data.map((entry, index) => ({
    value: String(entry[nameKey] || ''),
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
        <RechartsPieChart>
          {tooltip.enabled !== false && (
            <Tooltip
              content={
                <CustomTooltip
                  formatter={(value, name) => {
                    if (tooltip.formatter) return tooltip.formatter(value, name);
                    const percent = total > 0 ? value / total : 0;
                    return `${formatNumber(value)} (${formatPercent(percent)})`;
                  }}
                  labelFormatter={tooltip.labelFormatter}
                />
              }
            />
          )}

          {legend.enabled !== false && (
            <Legend
              content={<CustomLegend payload={legendPayload} iconType="circle" />}
              verticalAlign={legend.position === 'top' ? 'top' : 'bottom'}
              align={legend.align || 'center'}
            />
          )}

          <Pie
            data={data}
            dataKey={dataKey}
            nameKey={nameKey}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={paddingAngle}
            startAngle={startAngle}
            endAngle={endAngle}
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            onMouseEnter={onPieEnter}
            onMouseLeave={onPieLeave}
            onClick={(entry, index) => onClick?.(entry as ChartDataItem, index)}
            label={showLabels ? (props) => renderLabel({ ...props, labelType }) : undefined}
            labelLine={showLabels}
            isAnimationActive={animation.enabled !== false}
            animationDuration={animation.duration || DEFAULT_ANIMATION.duration}
            animationEasing={animation.easing || DEFAULT_ANIMATION.easing}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={(entry.color as string) || getChartColor(index, colors)}
                stroke="white"
                strokeWidth={2}
              />
            ))}
          </Pie>
        </RechartsPieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

// DonutChart is just a PieChart with innerRadius
export function DonutChart(props: PieChartProps) {
  const { options = {}, ...rest } = props;
  return (
    <PieChart
      {...rest}
      options={{
        innerRadius: '60%',
        outerRadius: '80%',
        ...options,
      }}
    />
  );
}
