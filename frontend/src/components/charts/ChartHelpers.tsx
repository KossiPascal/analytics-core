import { useState } from 'react';
import type { TooltipProps } from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { formatNumber } from './theme';
import styles from './charts.module.css';

// ============================================================================
// CUSTOM TOOLTIP
// ============================================================================

interface CustomTooltipProps extends TooltipProps<ValueType, NameType> {
  formatter?: (value: number, name: string) => string;
  labelFormatter?: (label: string) => string;
}

export function CustomTooltip({
  active,
  payload,
  label,
  formatter,
  labelFormatter,
}: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const formattedLabel = labelFormatter ? labelFormatter(String(label)) : label;

  return (
    <div className={styles.customTooltip}>
      {formattedLabel && <div className={styles.tooltipLabel}>{formattedLabel}</div>}
      {payload.map((entry, index) => {
        const value = entry.value as number;
        const name = entry.name as string;
        const color = entry.color || entry.payload?.fill;
        const formattedValue = formatter
          ? formatter(value, name)
          : formatNumber(value);

        return (
          <div key={`tooltip-${index}`} className={styles.tooltipItem}>
            <span className={styles.tooltipItemLabel}>
              <span
                className={styles.tooltipItemDot}
                style={{ backgroundColor: color }}
              />
              {name}
            </span>
            <span className={styles.tooltipItemValue}>{formattedValue}</span>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// CUSTOM LEGEND
// ============================================================================

interface LegendItem {
  value: string;
  color: string;
  type?: 'line' | 'square' | 'circle';
}

interface CustomLegendProps {
  payload?: LegendItem[];
  onClick?: (dataKey: string) => void;
  hiddenSeries?: string[];
  iconType?: 'line' | 'square' | 'circle';
}

export function CustomLegend({
  payload,
  onClick,
  hiddenSeries = [],
  iconType = 'square',
}: CustomLegendProps) {
  if (!payload) return null;

  const getIconClass = (type: string) => {
    switch (type) {
      case 'line':
        return styles.legendItemIconLine;
      case 'circle':
        return styles.legendItemIconCircle;
      default:
        return styles.legendItemIcon;
    }
  };

  return (
    <div className={styles.customLegend}>
      {payload.map((entry, index) => {
        const isHidden = hiddenSeries.includes(entry.value);
        return (
          <div
            key={`legend-${index}`}
            className={`${styles.legendItem} ${isHidden ? styles.legendItemInactive : ''}`}
            onClick={() => onClick?.(entry.value)}
          >
            <span
              className={getIconClass(entry.type || iconType)}
              style={{ backgroundColor: entry.color }}
            />
            <span className={styles.legendItemText}>{entry.value}</span>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// LOADING OVERLAY
// ============================================================================

export function ChartLoading() {
  return (
    <div className={styles.loadingOverlay}>
      <div className={styles.loadingSpinner} />
    </div>
  );
}

// ============================================================================
// NO DATA MESSAGE
// ============================================================================

interface NoDataProps {
  message?: string;
}

export function ChartNoData({ message = 'Aucune donnée disponible' }: NoDataProps) {
  return (
    <div className={styles.noData}>
      <svg
        className={styles.noDataIcon}
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 3v18h18" />
        <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
      </svg>
      <span className={styles.noDataText}>{message}</span>
    </div>
  );
}

// ============================================================================
// CHART CONTAINER
// ============================================================================

interface ChartContainerProps {
  title?: string;
  subtitle?: string;
  loading?: boolean;
  noData?: boolean;
  noDataMessage?: string;
  height?: number | string;
  className?: string;
  children: React.ReactNode;
}

export function ChartContainer({
  title,
  subtitle,
  loading,
  noData,
  noDataMessage,
  height = 300,
  className,
  children,
}: ChartContainerProps) {
  return (
    <div className={`${styles.chartContainer} ${className || ''}`}>
      {(title || subtitle) && (
        <div className={styles.chartHeader}>
          {title && <h3 className={styles.chartTitle}>{title}</h3>}
          {subtitle && <p className={styles.chartSubtitle}>{subtitle}</p>}
        </div>
      )}
      <div
        className={styles.chartWrapper}
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
      >
        {loading && <ChartLoading />}
        {!loading && noData && <ChartNoData message={noDataMessage} />}
        {!loading && !noData && children}
      </div>
    </div>
  );
}

// ============================================================================
// HOOK: USE HIDDEN SERIES
// ============================================================================

export function useHiddenSeries(initialHidden: string[] = []) {
  const [hiddenSeries, setHiddenSeries] = useState<string[]>(initialHidden);

  const toggleSeries = (dataKey: string) => {
    setHiddenSeries((prev) =>
      prev.includes(dataKey)
        ? prev.filter((key) => key !== dataKey)
        : [...prev, dataKey]
    );
  };

  const isSeriesHidden = (dataKey: string) => hiddenSeries.includes(dataKey);

  const resetHidden = () => setHiddenSeries([]);

  return {
    hiddenSeries,
    toggleSeries,
    isSeriesHidden,
    resetHidden,
  };
}
