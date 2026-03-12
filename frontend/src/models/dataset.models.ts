import { DataSource, DataSourceConnection } from "./datasource.models";
import { Tenant } from "./identity.model";

export type SqlDatasetType = "table" | "view" | "matview" | "function" | "index";
export type SqlChartType = "bar" | "line" | "pie" | "table" | "area" | "kpi" | "donut" | "gauge" | "heatmap" | "radar" | "stacked-area" | "stacked-bar";
export type SqlFieldType = "dimension" | "metric" | "calculated_metric";
export type SqlDataType = "string" | "text" | "integer" | "number" | "bigint" | "numeric" | "float" | "decimal" | "boolean" | "date" | "datetime" | "time" | "json";
export type SqlAggType = "sum" | "avg" | "count" | "min" | "max" | "distinct";
export type SqlOperators = "=" | "!=" | ">" | "<" | "<>" | ">=" | "<=" | "IN" | "BETWEEN" | "LIKE" | "ILIKE" | "IS NULL" | "IS NOT NULL" | "IS TRUE" | "IS NOT TRUE" | "IS FALSE" | "IS NOT FALSE";
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

export const ARRAY_REQUIRED_OPERATORS: SqlOperators[] = ["IN", ...NULL_ONLY_OPERATORS] as const;
export const RANGE_REQUIRED_OPERATORS: SqlOperators[] = ["BETWEEN", ...NULL_ONLY_OPERATORS] as const;

export const NUMERIC_OPERATORS: SqlOperators[] = ["=", "!=", "<>", ">", ">=", "<", "<=", "BETWEEN", "IN", ...NULL_ONLY_OPERATORS] as const;
export const STRING_OPERATORS: SqlOperators[] = ["=", "!=", "<>", "LIKE", "ILIKE", "IN", ...NULL_ONLY_OPERATORS] as const;
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
  string: ["=", "!=", "LIKE", "ILIKE", "IN", "IS NULL", "IS NOT NULL"],
  text: ["=", "!=", "LIKE", "ILIKE", "IN", "IS NULL", "IS NOT NULL"],
  integer: ["=", "!=", ">", ">=", "<", "<=", "BETWEEN", "IN", "IS NULL", "IS NOT NULL"],
  number: ["=", "!=", ">", ">=", "<", "<=", "BETWEEN", "IN", "IS NULL", "IS NOT NULL"],
  bigint: ["=", "!=", ">", ">=", "<", "<=", "BETWEEN", "IN", "IS NULL", "IS NOT NULL"],
  numeric: ["=", "!=", ">", ">=", "<", "<=", "BETWEEN", "IN", "IS NULL", "IS NOT NULL"],
  float: ["=", "!=", ">", ">=", "<", "<=", "BETWEEN", "IN", "IS NULL", "IS NOT NULL"],
  decimal: ["=", "!=", ">", ">=", "<", "<=", "BETWEEN", "IN", "IS NULL", "IS NOT NULL"],
  boolean: ["=", "!=", "IS TRUE", "IS FALSE", "IS NULL", "IS NOT NULL"],
  date: ["=", "!=", ">", ">=", "<", "<=", "BETWEEN", "IS NULL", "IS NOT NULL"],
  datetime: ["=", "!=", ">", ">=", "<", "<=", "BETWEEN", "IS NULL", "IS NOT NULL"],
  time: ["=", "!=", ">", ">=", "<", "<=", "BETWEEN", "IS NULL", "IS NOT NULL"],
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

  is_validated?: boolean
  validated_at?: string
  tenant?: Tenant
  dataset?: Dataset
  fields?: DatasetField[]
  charts?: DatasetChart[]
}

export interface QueryFilter {
  type: "condition";
  field: string;
  operator: SqlOperators;
  value: any;
  value2?: any
}

export type QueryFilterNode = QueryFilter | QueryFilterGroup;

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
    dimensions: string[];
    metrics: string[];
  };
  filters: {
    where: LinkedFilterGroup[],
    having: LinkedFilterGroup[],
  };
  order_by: {
    field: string;
    direction: "asc" | "desc";
  }[];
  limit: number | null;
  offset: number | null;
}

// SHARED TYPES
export interface TableColumn {
  align?: "right" | "left";
  field: string;
  label: string;
  formatter?: "number" | "currency" | "percent" | "string";
}

export interface ChartStructureFilter {
  field: string,
  operator: SqlOperators,
  value: any,
  value2: any;
  field_type: SqlFieldType
}


export interface ChartPivot {
  acitve: boolean
  fill_value: number

  rows_total: boolean
  cols_total: boolean

  rows_subtotal: boolean
  cols_subtotal: boolean

  percent_metrics?: string[]
  top_n?: number
  sort_metric?: string
  sort_desc: boolean
}

export interface ChartDimension {
  field: string,
  alias: string
}
export interface ChartMetric extends ChartDimension {
  aggregation: SqlAggType
}
export interface ChartOrderby {
  field: string,
  direction: "ASC" | "DESC"
}

// ANALYTICAL STRUCTURE (BI CORE)
export interface ChartStructure {
  // Categorical fields (group by) -> Example: ["country", "year"]
  rows_dimensions: ChartDimension[];
  cols_dimensions: ChartDimension[];
  //Numeric fields -> Example: ["revenue", "population"]
  metrics: ChartMetric[];
  // Filter data
  filters: ChartStructureFilter[];
  order_by: ChartOrderby[];
  limit: number | null;
  offset: number | null;
  pivot: ChartPivot;
}

export interface ChartVisualOptions {
  bar?: BarChartOptions;
  line?: LineChartOptions;
  area?: LineChartOptions;
  pie?: PieChartOptions;
  donut?: PieChartOptions;
  kpi?: KpiChartOptions;
  table?: TableChartOptions;
  gauge?: GaugeChartOptions;
  heatmap?: HeatmapChartOptions;
  radar?: RadarChartOptions;
  stacked_area?: LineChartOptions;
  stacked_bar?: BarChartOptions;
};

// BASE VISUAL OPTIONS (COMMON TO ALL CHARTS)
export interface BaseChartOptions {
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
}

// BAR CHART OPTIONS
export interface BarChartOptions extends BaseChartOptions {
  stacked?: boolean;
  normalized?: boolean;
  horizontal?: boolean;
  grouped?: boolean;
  bar_width?: number;
  border_radius?: number;
  rotate_x_labels?: number;
  x_label_height?: number;
  show_subtotal?: boolean;
  show_total?: boolean;
}

// LINE CHART OPTIONS
export interface LineChartOptions extends BaseChartOptions {
  curved?: boolean;
  area?: boolean;
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
}

// PIE / DONUT CHART OPTIONS
export interface PieChartOptions extends BaseChartOptions {
  show_percentage?: boolean;
  inner_radius?: number; // donut charts
  start_angle?: number;
  end_angle?: number;
  sort_slices?: boolean;
  explode_slice?: boolean;
  labels_position?: "inside" | "outside";
}

// KPI CHART OPTIONS
export interface KpiChartOptions extends BaseChartOptions {
  aggregation?: "sum" | "avg" | "min" | "max" | "count";
  icon?: string;
  icon_color?: string;
  trend_indicator?: boolean;
  decimal_precision?: number;
}

// TABLE CHART OPTIONS
export interface TableChartOptions extends BaseChartOptions {
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
export interface GaugeChartOptions extends BaseChartOptions {
  min_value?: number;
  max_value?: number;
  needle_color?: string;
  show_thresholds?: boolean;
  thresholds?: Array<{ value: number; color: string }>;
}

// HEATMAP CHART OPTIONS
export interface HeatmapChartOptions extends BaseChartOptions {
  show_labels?: boolean;
  color_range?: string[];
  cell_padding?: number;
}

// RADAR CHART OPTIONS
export interface RadarChartOptions extends BaseChartOptions {
  max_value?: number;
  show_axes?: boolean;
  fill_area?: boolean;
  line_width?: number;
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
  options: ChartVisualOptions;

  is_active: boolean;

  //Lazy-loaded relations
  tenant?: Tenant;
  dataset?: Dataset;
  query?: DatasetQuery;
}

export interface ChartRenderProp {
  chart: DatasetChart;
  data: {
    header: {
      header_rows: string[][],
      rows: string[],
      columns: string[],
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




export const suggestChartType = (dimensions: string[], metrics: string[]): SqlChartType => {

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