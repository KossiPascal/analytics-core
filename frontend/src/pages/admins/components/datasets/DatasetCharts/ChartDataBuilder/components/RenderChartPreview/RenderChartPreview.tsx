import React, { useMemo } from "react";
import { Chart } from '@components/charts/Chart';
import { CHART_COLORS } from '@components/charts/theme';
import { transposeTableData } from '@components/charts/transpose';
import type { ChartDataItem, ChartSeries, ChartType } from '@components/charts/types';
import { Table } from '@components/ui/Table/Table';
import type { Column } from '@components/ui/Table/Table';

const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'] as const;

// ── Demo data used when no real metrics are configured ────────────────────────
const DEMO_METRIC_NAME = 'Indicateur';
const DEMO_LINE_BAR_DATA: ChartDataItem[] = MONTHS.map((name, i) => ({
  name,
  [DEMO_METRIC_NAME]: [120, 180, 150, 240, 200, 280][i],
}));
const DEMO_SERIES_BASE: ChartSeries[] = [
  { dataKey: DEMO_METRIC_NAME, name: DEMO_METRIC_NAME },
];
const DEMO_PIE_DATA: ChartDataItem[] = [
  { name: 'Catégorie A', value: 420 },
  { name: 'Catégorie B', value: 320 },
  { name: 'Catégorie C', value: 180 },
  { name: 'Catégorie D', value: 90 },
];
const DEMO_RADAR_DATA: ChartDataItem[] = [
  'Qualité', 'Accès', 'Délai', 'Suivi', 'Impact',
].map((subject, i) => ({ subject, [DEMO_METRIC_NAME]: [80, 65, 75, 90, 70][i] }));
const DEMO_HEATMAP_DATA: Array<Record<string, unknown>> = ['Lomé', 'Kara', 'Sokodé'].map((row) => ({
  row,
  jan: 12, fev: 8, mar: 15,
}));

type TableRow = Record<string, unknown>;

interface RenderChartPreviewProps {
  chartType: string;
  previewData: any[];
  previewSeries: any[];
  options: any;
  isTransposed?: boolean;
  compact?: boolean;
}

export const RenderChartPreview: React.FC<RenderChartPreviewProps> = ({
  chartType,
  previewData,
  previewSeries,
  options,
  isTransposed = false,
  compact = false,
}) => {
  const isStackedBar = chartType === 'stacked-bar';
  const isStackedArea = chartType === 'stacked-area';
  const effectiveChartType = isStackedBar ? 'bar' : isStackedArea ? 'area' : chartType;
  const safeOptions = {
    ...options,
    colors: Array.isArray(options?.colors) && options.colors.length > 0
      ? options.colors.filter((color: unknown): color is string => typeof color === 'string' && color.length > 0)
      : CHART_COLORS.primary,
  };
  const safePreviewData: ChartDataItem[] = Array.isArray(previewData)
    ? previewData
        .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === 'object')
        .map((entry) => {
          const normalized: ChartDataItem = {};
          Object.entries(entry).forEach(([key, value]) => {
            if (
              typeof value === 'string' ||
              typeof value === 'number' ||
              value === null ||
              value === undefined
            ) {
              normalized[key] = value;
            }
          });
          return normalized;
        })
    : [];
  const safePreviewSeries = Array.isArray(previewSeries)
    ? previewSeries.filter(
        (series): series is ChartSeries =>
          Boolean(series) &&
          typeof series === 'object' &&
          typeof series.dataKey === 'string' &&
          series.dataKey.length > 0 &&
          (series.type === undefined || series.type === 'line' || series.type === 'area' || series.type === 'bar'),
      )
    : [];

  // When no real data is available, fall back to demo data so every chart
  // type shows a representative preview even before metrics are configured.
  const isDemo = safePreviewData.length === 0 || safePreviewSeries.length === 0;
  const demoSeries: ChartSeries[] = DEMO_SERIES_BASE.map((s, i) => ({
    ...s,
    color: safeOptions.colors[i % safeOptions.colors.length],
  }));

  const tableData = useMemo<TableRow[]>(() => {
    if (effectiveChartType !== 'table') return [];
    const series = isDemo ? demoSeries : safePreviewSeries;
    return series.map((s) => {
      const row: TableRow = { indicateur: s.name };
      MONTHS.forEach((m) => {
        row[m.toLowerCase()] = Math.floor(Math.random() * 300) + 50;
      });
      return row;
    });
  }, [effectiveChartType, safePreviewSeries, isDemo, demoSeries]);

  // Transpose table data if needed
  const { data: displayTableData, columns: displayTableColumns } = useMemo(() => {
    if (effectiveChartType !== 'table') return { data: [], columns: [] };

    if (isTransposed && tableData.length > 0) {
      const { data: transposed } = transposeTableData(tableData, 'indicateur');

      // Build columns: first col is the header key, then one col per original row
      const rowLabels = tableData.map((row) => String(row.indicateur ?? ''));
      const cols: Column<TableRow>[] = [
        { key: 'indicateur', header: 'Période', searchable: true },
        ...rowLabels.map((label) => ({
          key: label,
          header: label,
          align: 'right' as const,
        })),
      ];

      return { data: transposed, columns: cols };
    }

    // Normal (not transposed)
    const cols: Column<TableRow>[] = [
      { key: 'indicateur', header: 'Indicateur', searchable: true },
      ...MONTHS.map((m) => ({
        key: m.toLowerCase(),
        header: m,
        align: 'right' as const,
      })),
    ];

    return { data: tableData, columns: cols };
  }, [effectiveChartType, tableData, isTransposed]);

  if (effectiveChartType === 'table') {
    return (
      <Table<TableRow>
        data={displayTableData}
        columns={displayTableColumns}
        keyExtractor={(_, i) => i}
        features={{ search: true, pagination: true, pageSize: true }}
        defaultPageSize={10}
        scrollable
        maxHeight={compact ? 220 : 300}
        emptyMessage="Aucun indicateur sélectionné"
      />
    );
  }

  if (effectiveChartType === 'kpi') {
    const firstMetric = previewSeries[0]?.name ?? 'Valeur';
    const value = typeof safePreviewData[0]?.value === 'number'
      ? safePreviewData[0].value
      : safePreviewData[0]?.[safePreviewSeries[0]?.dataKey] ?? 128;
    const displayValue = typeof value === 'number' || typeof value === 'string' ? value : 128;

    return (
      <div
        style={{
          height: compact ? 220 : 350,
          borderRadius: 18,
          background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)',
          border: '1px solid #dbeafe',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 12,
          color: '#0f172a',
        }}
      >
        <div style={{ fontSize: 14, color: '#475569' }}>{firstMetric}</div>
        <div style={{ fontSize: compact ? 36 : 54, fontWeight: 800, color: safeOptions.colors[0] }}>
          {displayValue}
        </div>
      </div>
    );
  }

  if (effectiveChartType === 'heatmap') {
    const rows = (isDemo ? DEMO_HEATMAP_DATA : safePreviewData) as Array<Record<string, unknown>>;
    const columns = rows.length > 0 ? Object.keys(rows[0]).filter((key) => key !== 'row') : [];
    const values = rows.flatMap((row) => columns.map((column) => Number(row[column] ?? 0)));
    const max = Math.max(...values, 1);

    return (
      <div
        style={{
          height: compact ? 220 : 350,
          display: 'grid',
          gap: 8,
          alignContent: 'start',
        }}
      >
        {rows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            style={{
              display: 'grid',
              gridTemplateColumns: `88px repeat(${columns.length}, 1fr)`,
              gap: 8,
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>{String(row.row ?? `Ligne ${rowIndex + 1}`)}</span>
            {columns.map((column) => {
              const value = Number(row[column] ?? 0);
              const ratio = value / max;
              const baseColor = safeOptions.colors[0];
              return (
                <div
                  key={column}
                  style={{
                    height: compact ? 38 : 52,
                    borderRadius: 10,
                    background: `linear-gradient(180deg, ${baseColor}${Math.round((0.15 + ratio * 0.65) * 255).toString(16).padStart(2, '0')} 0%, ${baseColor} 100%)`,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {value}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  }

  // Pick correct demo data per chart family
  const isPieFamily = ['pie', 'donut'].includes(effectiveChartType);
  const isRadar = effectiveChartType === 'radar';
  const activeData = isDemo
    ? (isPieFamily ? DEMO_PIE_DATA : isRadar ? DEMO_RADAR_DATA : DEMO_LINE_BAR_DATA)
    : safePreviewData;
  const activeSeries = isDemo ? demoSeries : safePreviewSeries;

  const chartProps = {
    data: activeData,
    height: compact ? 220 : 350,
    title: safeOptions.title,
    subtitle: safeOptions.subtitle,
    legend: { enabled: safeOptions.showLegend },
    tooltip: { enabled: safeOptions.showTooltip },
    grid: { horizontal: safeOptions.showGrid, vertical: false },
    animation: { enabled: safeOptions.animation },
    colors: safeOptions.colors,
  };

  const needsDataKey = ['pie', 'donut', 'radialBar', 'treemap', 'funnel'].includes(effectiveChartType);
  const needsSeries = ['line', 'area', 'bar', 'radar', 'scatter', 'composed'].includes(effectiveChartType);

  return (
    <Chart
      type={effectiveChartType as ChartType}
      {...chartProps}
      series={needsSeries ? activeSeries : undefined}
      dataKey={needsDataKey ? 'value' : undefined}
      nameKey={needsDataKey ? 'name' : undefined}
      xAxis={{ dataKey: effectiveChartType === 'radar' ? undefined : 'name' }}
      options={{
        stacked: safeOptions.stacked || isStackedBar || isStackedArea,
        polarAngleAxisKey: effectiveChartType === 'radar' ? 'subject' : undefined,
        xAxisKey: effectiveChartType === 'scatter' ? 'x' : undefined,
        yAxisKey: effectiveChartType === 'scatter' ? 'y' : undefined,
      }}
    />
  );
};
