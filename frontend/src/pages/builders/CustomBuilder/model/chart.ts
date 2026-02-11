export type ChartType =
  | "bar"
  | "line"
  | "area"
  | "pie"
  | "table"
  | "kpi"

export interface ChartAxis {
  field: string
  label?: string
}

export interface ChartSeries {
  metric: string
  label?: string
  color?: string
}

export interface ChartConfig {
  type: ChartType
  x?: ChartAxis
  y?: ChartAxis
  series?: ChartSeries[]
  stacked?: boolean
  timeGrain?: "day" | "week" | "month"
}
