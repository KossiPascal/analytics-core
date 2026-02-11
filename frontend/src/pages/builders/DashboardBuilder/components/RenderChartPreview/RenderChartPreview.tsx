import React, { useMemo } from "react";
import { Chart } from '@components/charts/Chart';
import { CHART_COLORS } from '@components/charts/theme';
import type { ChartType } from '@components/charts/types';
import { Table } from '@components/ui/Table/Table';
import type { Column } from '@components/ui/Table/Table';

const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'] as const;

type TableRow = Record<string, unknown>;

export const RenderChartPreview: React.FC<{ chartType: string; previewData: any[]; previewSeries: any[]; options: any }> = ({ chartType, previewData, previewSeries, options }) => {
  const tableData = useMemo<TableRow[]>(() => {
    if (chartType !== 'table') return [];
    return previewSeries.map((s) => {
      const row: TableRow = { indicateur: s.name };
      MONTHS.forEach((m) => {
        row[m.toLowerCase()] = Math.floor(Math.random() * 300) + 50;
      });
      return row;
    });
  }, [chartType, previewSeries]);

  const tableColumns = useMemo<Column<TableRow>[]>(() => {
    if (chartType !== 'table') return [];
    return [
      { key: 'indicateur', header: 'Indicateur', searchable: true },
      ...MONTHS.map((m) => ({
        key: m.toLowerCase(),
        header: m,
        align: 'right' as const,
      })),
    ];
  }, [chartType]);

  if (chartType === 'table') {
    return (
      <Table<TableRow>
        data={tableData}
        columns={tableColumns}
        keyExtractor={(_, i) => i}
        features={{ search: true, pagination: true, pageSize: true }}
        defaultPageSize={10}
        scrollable
        maxHeight={300}
        emptyMessage="Aucun indicateur sélectionné"
      />
    );
  }

  const chartProps = {
    data: previewData,
    height: 350,
    title: options.title,
    subtitle: options.subtitle,
    legend: { enabled: options.showLegend },
    tooltip: { enabled: options.showTooltip },
    grid: { horizontal: options.showGrid, vertical: false },
    animation: { enabled: options.animation },
    colors: options.colors ?? CHART_COLORS.primary,
  };

  const needsDataKey = ['pie', 'donut', 'radialBar', 'treemap', 'funnel'].includes(chartType);
  const needsSeries = ['line', 'area', 'bar', 'radar', 'scatter', 'composed'].includes(chartType);

  return (
    <Chart
      type={chartType as ChartType}
      {...chartProps}
      series={needsSeries ? previewSeries : undefined}
      dataKey={needsDataKey ? 'value' : undefined}
      nameKey={needsDataKey ? 'name' : undefined}
      xAxis={{ dataKey: chartType === 'radar' ? undefined : 'name' }}
      options={{
        stacked: options.stacked,
        polarAngleAxisKey: chartType === 'radar' ? 'subject' : undefined,
        xAxisKey: chartType === 'scatter' ? 'x' : undefined,
        yAxisKey: chartType === 'scatter' ? 'y' : undefined,
      }}
    />
  );
};
