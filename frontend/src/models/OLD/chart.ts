// src/models/chart.ts
import { ChartData, ChartOptions } from "chart.js";

export type ChartType = "line" | "bar" | "pie" | "doughnut" | "radar" | "polarArea" | "table" | "kpi" | "heatmap" | "scatter" | "bubble";


// export interface ChartOptions {
//   xKey?: string;
//   yKeys?: string[];
//   valueKey?: string;
//   nameKey?: string;
//   label?: string;
//   value?: string | number;
//   [key: string]: any; // options additionnelles
// }

// export interface ChartData {
//   [key: string]: any;
// }

export interface BaseChartOptions {
  title?: string;
}

export interface CartesianChartOptions extends BaseChartOptions {
  xKey: string;
  yKeys: string[];
}

export interface PieChartOptions extends BaseChartOptions {
  nameKey: string;
  valueKey: string;
}

export interface KPIOptions extends BaseChartOptions {
  label: string;
  value: string | number;
}

export type ChartsOptions =CartesianChartOptions| PieChartOptions| KPIOptions | ChartOptions;

export interface Chart {
  id: string;
  name: string;
  tenantId: string;
  queryId: string;
  type: ChartType;
  data: ChartData[];
  options: ChartOptions;
  createdAt?: string;
}


export interface DynamicChartConfig {
  type: ChartType;
  data: ChartData;
  options?: ChartOptions;
}