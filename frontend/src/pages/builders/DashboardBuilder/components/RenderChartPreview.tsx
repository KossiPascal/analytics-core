import React from "react";
import { Chart } from '@components/charts/Chart';
import { CHART_COLORS } from '@components/charts/theme';
import styles from '@pages/builders/DashboardBuilder/DashboardBuilder.module.css';
import type { ChartType } from '@components/charts/types';

  // Render chart preview
  export const RenderChartPreview:React.FC<{ chartType: string; previewData: any[]; previewSeries: any[]; options: any }> = ({ chartType, previewData, previewSeries, options }) => {
    if (chartType === 'table') {
      return (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Indicateur</th>
                {['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'].map((month) => (
                  <th key={month}>{month}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewSeries.slice(0, 5).map((s) => (
                <tr key={s.dataKey}>
                  <td>{s.name}</td>
                  {Array.from({ length: 6 }, (_, i) => (
                    <td key={i}>{Math.floor(Math.random() * 300) + 50}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
      colors: CHART_COLORS.primary,
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