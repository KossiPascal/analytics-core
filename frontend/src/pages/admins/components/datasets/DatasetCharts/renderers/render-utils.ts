import { DatasetChart } from "@/models/dataset.models";

export const getDimensionKeys = (chart: DatasetChart) => [...(chart.structure.rows_dimensions||[]), ...(chart.structure.cols_dimensions||[])];

export const getMetricKeys = (chart: DatasetChart) => {
    if (!chart.options) return [];
    if (chart.structure.metrics?.length) return chart.structure.metrics || [];
    return [];
};

// Pour Donut/Pie
export const buildPieData = (data: Record<string, any>[],dimension: string,metric: string) => {
  return data.map((row) => ({name: row?.[dimension] ?? "",value: Number(row?.[metric] ?? 0)}));
};

export const sumMetric = (data: any[], metric: string) =>
    data.reduce((acc, row) => acc + Number(row[metric] || 0), 0);

export const averageMetric = (data: any[], metric: string) => {
    if (data.length === 0) return 0;
    return sumMetric(data, metric) / data.length;
}