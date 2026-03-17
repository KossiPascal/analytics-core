import { LabelPosition } from "recharts/types/component/Label";
import { DataSource, DataSourceConnection } from "./datasource.models";
import { Tenant } from "./identity.model";

export type SqlDatasetType = "table" | "view" | "matview" | "function" | "index";
export type SqlChartType = "bar" | "line" | "pie" | "table" | "area" | "kpi" | "donut" | "gauge" | "heatmap" | "radar" | "stacked-area" | "stacked-bar";
export type SqlChartVisualType = 'bar' | 'line' | 'area' | 'pie' | 'donut' | 'kpi' | 'table' | 'gauge' | 'heatmap' | 'radar' | 'stacked_area' | 'stacked_bar';

export type SqlFieldType = "dimension" | "metric" | "calculated_metric";
export type SqlDataType = "string" | "text" | "integer" | "number" | "bigint" | "numeric" | "float" | "decimal" | "boolean" | "date" | "datetime" | "time" | "json";
export type SqlAggType = "sum" | "avg" | "count" | "min" | "max" | "distinct";
export type SqlOperators = "=" | "!=" | ">" | "<" | "<>" | ">=" | "<=" | "IN" | "NOT IN" | "BETWEEN" | "NOT BETWEEN" | "LIKE" | "ILIKE" | "IS NULL" | "IS NOT NULL" | "IS TRUE" | "IS NOT TRUE" | "IS FALSE" | "IS NOT FALSE";
export type SqlLogicalOperator = "AND" | "OR";
export type ChartPivotMode = "dynamic" | "rows_to_columns" | "columns_to_rows"

export const SqlDatasetTypeList: SqlDatasetType[] = ["table", "view", "matview", "function", "index"] as const;
export const SqlFieldTypeList: SqlFieldType[] = ["dimension", "metric", "calculated_metric"] as const;
export const SqlChartTypeList: SqlChartType[] = ["bar", "line", "pie", "table", "area", "kpi", "donut", "gauge", "heatmap", "radar", "stacked-area", "stacked-bar"] as const;

export const NUMERIC_DATA_TYPES: SqlDataType[] = ["integer", "number", "bigint", "numeric", "float", "decimal"] as const;
export const DATETIME_DATA_TYPES: SqlDataType[] = ["date", "datetime", "time"] as const;
export const FULL_DATA_TYPES: SqlDataType[] = ["string", "text", ...NUMERIC_DATA_TYPES, "boolean", ...DATETIME_DATA_TYPES, "json"] as const;

export const AGGRAGATE_TYPES: SqlAggType[] = ["sum", "avg", "count", "min", "max", "distinct"] as const;
export const LOGICAL_OPERATORS: SqlLogicalOperator[] = ["AND", "OR"] as const;

export const NULL_ONLY_OPERATORS: SqlOperators[] = ["IS NULL", "IS NOT NULL"] as const;
export const BOOLEAN_ONLY_OPERATORS: SqlOperators[] = ["IS TRUE", "IS NOT TRUE", "IS FALSE", "IS NOT FALSE"] as const;
export const NO_VALUE_OPERATORS: SqlOperators[] = [...BOOLEAN_ONLY_OPERATORS, ...NULL_ONLY_OPERATORS] as const;

export const ARRAY_REQUIRED_OPERATORS: SqlOperators[] = ["IN", "NOT IN", ...NULL_ONLY_OPERATORS] as const;
export const RANGE_REQUIRED_OPERATORS: SqlOperators[] = ["BETWEEN", "NOT BETWEEN", ...NULL_ONLY_OPERATORS] as const;

export const NUMERIC_OPERATORS: SqlOperators[] = ["=", "!=", "<>", ">", ">=", "<", "<=", "BETWEEN", "NOT BETWEEN", "IN", "NOT IN", ...NULL_ONLY_OPERATORS] as const;
export const STRING_OPERATORS: SqlOperators[] = ["=", "!=", "<>", "LIKE", "ILIKE", "IN", "NOT IN", ...NULL_ONLY_OPERATORS] as const;
export const DATE_OPERATORS: SqlOperators[] = [...NUMERIC_OPERATORS] as const;

export const CHART_PIVOT_MODE: ChartPivotMode[] = ["dynamic", "rows_to_columns", "columns_to_rows"]
export const NUMERIC_DATA_TYPE = new Set(NUMERIC_DATA_TYPES);

export const FULL_OPERATORS: SqlOperators[] = Array.from(new Set([
  ...NUMERIC_OPERATORS,
  ...STRING_OPERATORS,
  ...DATE_OPERATORS,
  ...NO_VALUE_OPERATORS,
  ...ARRAY_REQUIRED_OPERATORS,
  ...RANGE_REQUIRED_OPERATORS,
  ...NULL_ONLY_OPERATORS
]));

export const OPERATORS_BY_TYPE: Record<SqlDataType, SqlOperators[]> = {
  string: ["=", "!=", "LIKE", "ILIKE", "IN", "NOT IN", "IS NULL", "IS NOT NULL"],
  text: ["=", "!=", "LIKE", "ILIKE", "IN", "NOT IN", "IS NULL", "IS NOT NULL"],
  integer: ["=", "!=", ">", ">=", "<", "<=", "BETWEEN", "NOT BETWEEN", "IN", "NOT IN", "IS NULL", "IS NOT NULL"],
  number: ["=", "!=", ">", ">=", "<", "<=", "BETWEEN", "NOT BETWEEN", "IN", "NOT IN", "IS NULL", "IS NOT NULL"],
  bigint: ["=", "!=", ">", ">=", "<", "<=", "BETWEEN", "NOT BETWEEN", "IN", "NOT IN", "IS NULL", "IS NOT NULL"],
  numeric: ["=", "!=", ">", ">=", "<", "<=", "BETWEEN", "NOT BETWEEN", "IN", "NOT IN", "IS NULL", "IS NOT NULL"],
  float: ["=", "!=", ">", ">=", "<", "<=", "BETWEEN", "NOT BETWEEN", "IN", "NOT IN", "IS NULL", "IS NOT NULL"],
  decimal: ["=", "!=", ">", ">=", "<", "<=", "BETWEEN", "NOT BETWEEN", "IN", "NOT IN", "IS NULL", "IS NOT NULL"],
  boolean: ["=", "!=", "IS TRUE", "IS FALSE", "IS NULL", "IS NOT NULL"],
  date: ["=", "!=", ">", ">=", "<", "<=", "BETWEEN", "NOT BETWEEN", "IS NULL", "IS NOT NULL"],
  datetime: ["=", "!=", ">", ">=", "<", "<=", "BETWEEN", "NOT BETWEEN", "IS NULL", "IS NOT NULL"],
  time: ["=", "!=", ">", ">=", "<", "<=", "BETWEEN", "NOT BETWEEN", "IS NULL", "IS NOT NULL"],
  json: ["=", "!=", "IS NULL", "IS NOT NULL"],
};

export const INPUT_TYPE_BY_SQL_TYPE: Record<SqlDataType, string> = {
  string: "text",
  text: "text",
  integer: "number",
  number: "number",
  bigint: "number",
  numeric: "number",
  float: "number",
  decimal: "number",
  boolean: "select",
  date: "date",
  datetime: "datetime-local",
  time: "time",
  json: "textarea",
};

export const CHART_COLS_SEPARATOR = "___";

export const getOperatorsForField = (dataType?: SqlDataType) => {
  if (!dataType) return [];
  return OPERATORS_BY_TYPE[dataType] ?? [];
};

export const getInputTypeForField = (dataType?: SqlDataType) => {
  if (!dataType) return "text";
  return INPUT_TYPE_BY_SQL_TYPE[dataType] ?? "text";
};

export interface DatasetColumn {
  name: string;
  type: string;
}

export interface SqlWithUtils {
  sql: string,
  columns: DatasetColumn[]
}

export interface Dataset {
  id: number | null;
  name: string;
  view_name: string;
  sql_type: SqlDatasetType;
  tenant_id: number | null;
  datasource_id: number | null;
  connection_id: number | null;
  description: string
  use_local_view: boolean;
  sql: string | null;
  columns?: DatasetColumn[];
  version: number;
  is_active: boolean;

  tenant?: Tenant;
  datasource?: DataSource;
  connection?: DataSourceConnection;
  is_validated?: boolean;
  validated_at?: string;
  validated_by_id?: number
  validated_by?: string;
  parent_id?: number | null;
  fields?: DatasetField[];
  queries?: DatasetQuery[];
  parents?: Dataset[];
  created_at?: string;
}

export interface DatasetField {
  id: number | null
  tenant_id: number | null
  dataset_id: number | null
  name: string
  description: string
  expression: string
  aggregation: SqlAggType | null
  field_type: SqlFieldType | null
  data_type: SqlDataType
  format: Record<string, any>
  is_public: boolean
  is_filterable: boolean;
  is_groupable: boolean;
  is_sortable: boolean;
  is_selectable: boolean;
  is_hidden: boolean;
  is_active: boolean;
  tenant?: Tenant
  dataset?: Dataset
  is_dimension?: boolean
  is_metric?: boolean;
}

export interface DatasetQuery {
  id: number | null
  name: string
  description: string
  tenant_id: number | null
  dataset_id: number | null
  query_json: QueryJson
  compiled_sql: string
  values: Record<string, any>
  is_active: boolean;

  fields_ids: number[]
  is_validated?: boolean
  validated_at?: string
  tenant?: Tenant
  dataset?: Dataset
  fields?: DatasetField[]
  charts?: DatasetChart[]
}

export type QueryFilterNode = QueryFilter | QueryFilterGroup;

export interface QueryFilter {
  type: "condition";
  field_id: number;
  operator: SqlOperators;
  value: any;
  value2?: any
  useSqlInClause?: boolean
}

export interface QueryFilterGroup {
  type: "group";
  operator: SqlLogicalOperator;
  children: QueryFilterNode[];
};


export interface LinkedFilterGroup {
  linkWithPrevious?: SqlLogicalOperator;
  node: QueryFilterNode;
}
export interface QueryJson {
  // dataset_id: number;
  select: {
    dimensions: { field_id: number, alias?: string }[];
    metrics: { field_id: number, alias?: string }[];
  };
  filters: {
    where: LinkedFilterGroup[],
    having: LinkedFilterGroup[],
  };
  order_by: {
    field_id: number;
    direction: "asc" | "desc";
  }[];
  limit: number | null;
  offset: number | null;
}

// SHARED TYPES
export interface TableColumn {
  align?: "right" | "left";
  field_id: number;
  label: string;
  formatter?: "number" | "currency" | "percent" | "string";
}

export interface ChartStructureFilter {
  field_id: number,
  field_type: SqlFieldType
  operator: SqlOperators,
  value: any,
  value2: any;
  useSqlInClause: boolean
}

export interface ChartStructureMetric {
  field_id: number;
  alias: string;
  aggregation: SqlAggType
}

export interface ChartStructureDimension {
  field_id: number;
  alias: string
}

export interface ChartStructureOrderBy {
  field_id: number;
  direction: "ASC" | "DESC"
}

export interface ChartPivot {
  acitve: boolean
  fill_value: number

  rows_total: boolean
  cols_total: boolean

  rows_subtotal: boolean
  cols_subtotal: boolean

  percent_metrics?: number[]
  top_n?: number
  sort_metric?: number
  sort_desc: boolean
}

export interface ChartDimension {
  field_id: number;
  name?: string;
  alias: string;
  data_type?: SqlDataType;
  operator?: SqlOperators,
  value?: any,
  value2?: any,
  useSqlInClause?: boolean
}
export interface ChartMetric extends ChartDimension {
  aggregation: SqlAggType
}
export interface ChartOrderby {
  field_id: number,
  direction: "ASC" | "DESC"
}

// ANALYTICAL STRUCTURE (BI CORE)
export interface ChartStructure {
  rows_dimensions: ChartDimension[];
  cols_dimensions: ChartDimension[];
  metrics: ChartMetric[];
  // Filter data
  filters: ChartStructureFilter[];
  order_by: ChartOrderby[];
  limit: number | null;
  offset: number | null;
  pivot: ChartPivot;
}

// BAR CHART OPTIONS
export interface BarChartOptions {
  stacked?: boolean;
  normalized?: boolean;
  horizontal?: boolean;
  // vertical: boolean;
  grouped?: boolean;
  bar_width?: number;
  border_radius?: number;
  
  rotate_x_labels?: number;
  x_label_height?: number;
  show_subtotal?: boolean;
  show_total?: boolean;

  bar_radius?: [number, number, number, number];
  bar_gap?: number;
  bar_category_gap?: number | string;
  grid_stroke?: string;
  grid_dasharray?: string;
  y_label_width?: number;
  show_right_y_axis?: boolean;
  animation_delay_per_bar?: number;
  label_format?: "percent";
  label_angle?: number;
  label_offset?: number;

  // stacked_bar
  animation_duration?: number;
  radius?: [number, number, number, number]
  show_labels?: boolean;
}

// LINE CHART OPTIONS
export interface LineChartOptions {
  curved?: boolean;
  is_area?: boolean;
  horizontal?: boolean;
  line_width?: number;
  point_shape?: "circle" | "square" | "triangle";
  point_size?: number;
  show_markers?: boolean;
  smoothness?: number; // 0-1
  multi_axis?: boolean;

  rotate_x_labels?: number;
  x_label_height?: number;
  show_subtotal?: boolean;
  show_total?: boolean;

  grid_stroke?: string;
  grid_dasharray?: string;
  grid_vertical?: boolean;
  grid_horizontal?: boolean;
  show_right_y_axis?: boolean;
  show_brush?: boolean;
  gradient_fill?: string;
  fill_opacity?: number;
  label_position?: LabelPosition;
  reference_lines?: { x?: string; y?: string; stroke?: string; dash?: string; label?: string }[],

  // stacked_area
  animation_duration?: number;
  stroke_width?: number;
}

export interface AreaChartOptions extends LineChartOptions {
  grid_stroke?: string;
  grid_dasharray?: string;
  grid_vertical?: boolean;
  grid_horizontal?: boolean;
  show_brush?: boolean;
  reference_lines?: { x?: string; y?: string; stroke?: string; dash?: string; label?: string }[]
  gradient_fill?: string;
  fill_opacity?: number;
  label_position?: LabelPosition;
}

// PIE / DONUT CHART OPTIONS
export interface PieChartOptions {
  show_percentage?: boolean;
  inner_radius?: number; // donut charts
  outer_radius?: number;
  start_angle?: number;
  end_angle?: number;
  sort_slices?: boolean;
  explode_slice?: boolean;
  labels_position?: "inside" | "outside";
  animation_duration?: number;
  show_labels?: boolean;
  label_position?: string;
  label_formatter?: string;
  colors?: string[];
  show_tooltip?: boolean;
  show_legend?: boolean;
  hover_offset?: number;

  clockwise?: boolean;
  show_label_lines?: boolean;
  stroke_color?: string;
  stroke_width?: number;
}

// KPI CHART OPTIONS
export interface KpiChartOptions {
  aggregation?: "sum" | "avg" | "min" | "max" | "count";
  icon?: string;
  icon_color?: string;
  trend_indicator?: boolean;
  decimal_precision?: number;

  value_format?: "number" | "percent" | "currency";
  show_trend?: boolean;
  background_opacity?: number;
  columns_per_row?: number;
}

// TABLE CHART OPTIONS
export interface TableChartOptions {
  // columns?: TableColumn[];
  columns?: TableColumn[];
  pagination?: boolean;
  page_size?: number;
  sortable?: boolean;
  filterable?: boolean;
  searchable?: boolean;
  exportable?: boolean;
  row_highlight?: boolean;
  conditional_formatting?: boolean;
}

// GAUGE CHART OPTIONS
export interface GaugeChartOptions {
  min_value?: number;
  max_value?: number;
  needle_color?: string;
  show_thresholds?: boolean;
  thresholds?: Array<{ value: number; color: string }>;

  width?: number;
  height?: number;
  min?: number;
  max?: number;
  show_value?: boolean;
  show_label?: boolean;
  label_formatter?: (val: number) => string;
  thickness?: number;
  animation_duration?: number;
}

// HEATMAP CHART OPTIONS
export interface HeatmapChartOptions {
  show_labels?: boolean;
  color_range?: string[];
  cell_padding?: number;

  cell_width?: number;
  cell_height?: number;
  color_min?: string;
  color_max?: string;
  show_values?: boolean;
  min_value?: number;
  max_value?: number;
}

// RADAR CHART OPTIONS
export interface RadarChartOptions {
  max_value?: number;
  show_axes?: boolean;
  fill_area?: boolean;
  line_width?: number;

  animation_duration?: number;
  stroke_width?: number;
  fill_opacity?: number;
  show_dots?: boolean;
  outer_radius?: string;
  grid_dasharray?: string;
  label_font_size?: number;
  label_formatter?: (val: any) => string;
  angle?: number;
  radius_angle?: number;
  tick_count?: number;
  dot_size?: number;
}

export type FullChartOptions = BarChartOptions | LineChartOptions | PieChartOptions | TableChartOptions | KpiChartOptions | GaugeChartOptions | HeatmapChartOptions | RadarChartOptions

export const getOptionKey = (type: SqlChartType): SqlChartVisualType => {
  switch (type) {
    case "bar": return "bar";
    case "stacked-bar": return "stacked_bar";
    case "line": return "line";
    case "area": return "area";
    case "stacked-area": return "stacked_area";
    case "pie": return "pie";
    case "donut": return "donut";
    case "kpi": return "kpi";
    case "table": return "table";
    case "gauge": return "gauge";
    case "heatmap": return "heatmap";
    case "radar": return "radar";
    default:
      return "bar";
  }
};

// export type ChartVisualOptions = BarChartOptions | LineChartOptions | PieChartOptions | KpiChartOptions | TableChartOptions | GaugeChartOptions | HeatmapChartOptions | RadarChartOptions 

// BASE VISUAL OPTIONS (COMMON TO ALL CHARTS)
export interface ChartOptions {
  title?: string;
  subtitle?: string;

  width?: number | `${number}%`;
  height?: number | `${number}%`;

  color_scheme?: string[];
  show_legend?: boolean;
  show_tooltip?: boolean;
  show_labels?: boolean;
  show_grid?: boolean;

  // Axes
  x_axis_label?: string;
  y_axis_label?: string;
  x_axis_format?: string; // e.g., date, number
  y_axis_format?: string;

  // Style & font
  font_family?: string;
  font_size?: number;
  font_color?: string;

  // Margins
  margin_top?: number;
  margin_bottom?: number;
  margin_left?: number;
  margin_right?: number;

  // Animation
  animation_duration?: number;
  animation_easing?: "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out";

  // Responsiveness
  responsive?: boolean;

  renames?: Record<string, Record<string, string>>

  max?: number;
  stacked?: number;

  // Chart Options
  bar?: BarChartOptions;
  line?: LineChartOptions;
  area?: AreaChartOptions;
  pie?: PieChartOptions;
  donut?: PieChartOptions;
  kpi?: KpiChartOptions;
  table?: TableChartOptions;
  gauge?: GaugeChartOptions;
  heatmap?: HeatmapChartOptions;
  radar?: RadarChartOptions;
  stacked_area?: LineChartOptions;
  stacked_bar?: BarChartOptions;
}

// MAIN DATASET CHART MODEL
export interface DatasetChart {
  id: number | null;

  name: string;
  description?: string;

  tenant_id: number | null;
  dataset_id: number | null;
  query_id: number | null;

  type: SqlChartType;

  // Analytical definition (what we analyze)
  structure: ChartStructure;

  // Visual configuration (how we render it)
  options: ChartOptions;

  is_active: boolean;

  //Lazy-loaded relations
  tenant?: Tenant;
  dataset?: Dataset;
  query?: DatasetQuery;
}

export interface ChartRenderProp {
  chart: DatasetChart;
  query: DatasetQuery;
  data: {
    header: {
      header_rows: (string | string[])[][],
      rows: string[],
      columns: string[],
      column_maps: Record<string, string[] | number[]>
      column_label_maps: Record<number, string>
      metrics: string[],
      _all_columns_order: string[],
    },
    rows: Record<string, any>[]
  }
}

export interface ChartFormProps {
  chart: DatasetChart;
  onChange: (val: DatasetChart) => void;
  onExecute?: (val: ExecuteChartResponse | undefined) => void;
  tenants?: Tenant[];
  tenant_id?: number;
  datasets?: Dataset[];
  queries?: DatasetQuery[];
}

// Métadonnées de la réponse
export interface DatasetChartMeta {
  row_count: number;      // Nombre de lignes retournées
  columns: string[];      // Colonnes de la query
  dimensions: string[];   // Champs catégoriels sélectionnés
  metrics: string[];      // Champs numériques sélectionnés
  generated_at: string;   // ISO timestamp
}

// Réponse de l'endpoint execute_chart
export interface ExecuteChartResponse {
  chart: DatasetChart;    // Objet DatasetChart complet
  data: Record<string, any>[]; // Tableau des lignes retournées
  meta: DatasetChartMeta; // Métadonnées supplémentaires
}




export const suggestChartType = (dimensions: number[], metrics: number[]): SqlChartType => {

  const d = dimensions.length;
  const m = metrics.length;

  // rien
  if (d === 0 && m === 0) return "table";

  // KPI
  if (d === 0 && m === 1) return "kpi";

  // Gauge
  if (d === 0 && m === 1) return "gauge";

  // Table si trop complexe
  if (d > 3 || m > 5) return "table";

  // Pie / Donut
  if (d === 1 && m === 1) return "pie";

  // Bar simple
  if (d === 1 && m === 1) return "bar";

  // Line chart
  if (d === 1 && m > 1) return "line";

  // Area
  if (d === 1 && m >= 2) return "area";

  // Stacked bar
  if (d === 2 && m === 1) return "stacked-bar";

  // Stacked area
  if (d === 2 && m >= 2) return "stacked-area";

  // Heatmap
  if (d === 2 && m === 1) return "heatmap";

  // Radar
  if (d === 1 && m >= 3) return "radar";

  // fallback
  return "table";
};