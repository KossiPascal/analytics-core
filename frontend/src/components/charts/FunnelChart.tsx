import {
  FunnelChart as RechartsFunnelChart,
  Funnel,
  Cell,
  LabelList,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { FunnelChartProps, ChartDataItem } from './types';
import {
  CHART_COLORS,
  DEFAULT_ANIMATION,
  getChartColor,
  formatNumber,
} from './theme';
import {
  CustomLegend,
  ChartContainer,
} from './ChartHelpers';
import styles from './charts.module.css';

// Custom tooltip for funnel
function FunnelTooltip({ active, payload, formatter }: any) {
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
      <div
        style={{
          fontWeight: 600,
          fontSize: '13px',
          color: '#1e293b',
          marginBottom: '4px',
        }}
      >
        {data.name}
      </div>
      <div
        style={{
          fontSize: '13px',
          color: '#64748b',
        }}
      >
        {formatter ? formatter(data.value, data.name) : formatNumber(data.value)}
      </div>
    </div>
  );
}

export function FunnelChart({
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
}: FunnelChartProps) {
  const {
    isAnimationActive = true,
    lastShapeType = 'rectangle',
  } = options;

  const noData = !data || data.length === 0;

  // Create legend payload
  const legendPayload = data.map((entry, index) => ({
    value: String(entry[nameKey] || ''),
    color: (entry.color as string) || getChartColor(index, colors),
    type: 'square' as const,
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
        <RechartsFunnelChart>
          {tooltip.enabled !== false && (
            <Tooltip content={<FunnelTooltip formatter={tooltip.formatter} />} />
          )}

          {legend.enabled !== false && (
            <Legend
              content={<CustomLegend payload={legendPayload} iconType="square" />}
              verticalAlign="bottom"
              align={legend.align || 'center'}
            />
          )}

          <Funnel
            dataKey={dataKey}
            data={data}
            nameKey={nameKey}
            lastShapeType={lastShapeType}
            onClick={(entry, index) => onClick?.(entry as ChartDataItem, index)}
            isAnimationActive={animation.enabled !== false && isAnimationActive}
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
            <LabelList
              position="right"
              fill="#64748b"
              stroke="none"
              dataKey={nameKey}
              className={styles.funnelLabel}
            />
            <LabelList
              position="center"
              fill="white"
              stroke="none"
              dataKey={dataKey}
              formatter={(value: number) => formatNumber(value)}
              style={{ fontWeight: 600, fontSize: '13px' }}
            />
          </Funnel>
        </RechartsFunnelChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
