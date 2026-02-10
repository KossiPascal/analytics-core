import {
  Treemap,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { TreemapChartProps, ChartDataItem } from './types';
import {
  CHART_COLORS,
  DEFAULT_ANIMATION,
  getChartColor,
  formatNumber,
} from './theme';
import { ChartContainer } from './ChartHelpers';
import styles from './charts.module.css';

// Custom content renderer for treemap cells
interface CustomizedContentProps {
  root?: any;
  depth?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
  name?: string;
  value?: number;
  colors: string[];
}

function CustomizedContent({
  depth,
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  index = 0,
  name,
  value,
  colors,
}: CustomizedContentProps) {
  if (depth !== 1) return null;

  const color = getChartColor(index, colors);
  const showLabel = width > 50 && height > 30;
  const showValue = width > 70 && height > 50;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={color}
        stroke="white"
        strokeWidth={2}
        rx={4}
        className={styles.treemapCell}
      />
      {showLabel && (
        <text
          x={x + width / 2}
          y={y + height / 2 - (showValue ? 8 : 0)}
          textAnchor="middle"
          dominantBaseline="central"
          className={styles.treemapLabel}
          style={{
            fontSize: Math.min(14, Math.max(10, width / 8)),
          }}
        >
          {name && name.length > 15 ? `${name.substring(0, 12)}...` : name}
        </text>
      )}
      {showValue && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 10}
          textAnchor="middle"
          dominantBaseline="central"
          fill="rgba(255,255,255,0.9)"
          style={{
            fontSize: Math.min(12, Math.max(9, width / 10)),
            fontWeight: 500,
          }}
        >
          {formatNumber(value || 0)}
        </text>
      )}
    </g>
  );
}

// Custom tooltip for treemap
function TreemapTooltip({ active, payload, formatter }: any) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload;

  return (
    <div className={styles.customTooltip}>
      <div className={styles.tooltipLabel}>{data.name}</div>
      <div className={styles.tooltipItemValue}>
        {formatter ? formatter(data.value, data.name) : formatNumber(data.value)}
      </div>
    </div>
  );
}

export function TreemapChart({
  data,
  dataKey,
  nameKey = 'name',
  height = 300,
  tooltip = { enabled: true },
  animation = { enabled: true },
  colors = CHART_COLORS.primary,
  title,
  subtitle,
  loading,
  noDataMessage,
  className,
  onClick,
  options = {},
}: TreemapChartProps) {
  const {
    aspectRatio = 4 / 3,
    isAnimationActive = true,
  } = options;

  const noData = !data || data.length === 0;

  // Transform data to include colors
  const transformedData = data.map((item, index) => ({
    ...item,
    fill: (item.color as string) || getChartColor(index, colors),
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
        <Treemap
          data={transformedData}
          dataKey={dataKey}
          nameKey={nameKey}
          aspectRatio={aspectRatio}
          stroke="white"
          content={<CustomizedContent colors={colors} />}
          onClick={(node) => onClick?.(node as ChartDataItem, 0)}
          isAnimationActive={animation.enabled !== false && isAnimationActive}
          animationDuration={animation.duration || DEFAULT_ANIMATION.duration}
          animationEasing={animation.easing || DEFAULT_ANIMATION.easing}
        >
          {tooltip.enabled !== false && (
            <Tooltip content={<TreemapTooltip formatter={tooltip.formatter} />} />
          )}
        </Treemap>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
