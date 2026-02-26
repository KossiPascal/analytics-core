import { DataSource, DataSourceConnection } from "./datasource.models";
import { Tenant } from "./identity.model";

export type SqlDatasetType = "table" | "view" | "matview" | "function" | "index";
export type SqlChartType = "bar" | "line" | "pie" | "table" | "area" | "kpi";
export type SqlFieldType = "dimension" | "metric" | "calculated_metric";
export type SqlDataType = "string" | "integer" | "bigint" | "numeric" | "float" | "decimal" | "boolean" | "date" | "datetime" | "time" | "json";
export type SqlAggType = "sum" | "avg" | "count" | "min" | "max" | "distinct";
export type SqlOperators = "=" | "!=" | ">" | "<" | "IN" | "BETWEEN" | "LIKE" | "IS NULL" | "IS NOT NULL" | "IS TRUE" | "IS NOT TRUE";

export const SqlDatasetTypeList: SqlDatasetType[] = ["table", "view", "matview", "function", "index"] as const;
export const SqlFieldTypeList: SqlFieldType[] = ["dimension", "metric", "calculated_metric"] as const;
export const SqlChartTypeList: SqlChartType[] = ["bar", "line", "pie", "table", "area", "kpi"] as const;

export const SqlDataNumericTypeList: SqlDataType[] = ["integer", "bigint", "numeric", "float", "decimal"] as const;
export const SqlDataTypeList: SqlDataType[] = ["string", ...SqlDataNumericTypeList, "boolean", "date", "datetime", "time", "json"] as const;

export const SqlAggTypeList: SqlAggType[] = ["sum", "avg", "count", "min", "max", "distinct"] as const;

export const SqlOperatorsNoValueList:SqlOperators[] = ["IS NULL", "IS NOT NULL", "IS TRUE", "IS NOT TRUE"] as const;
export const SqlOperatorsList:SqlOperators[] = ["=", "!=", ">", "<", "IN", "BETWEEN", "LIKE", ...SqlOperatorsNoValueList] as const;

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
  charts?: DatasetChart[]
}

export interface QueryFilter {
  field: string;
  operator: SqlOperators;
  value: any;
  value2?:any
}

export interface QueryJson {
  // dataset_id: number;
  select: {
    dimensions: string[];
    metrics: string[];
  };
  filters: QueryFilter[];
  order_by: {
    field: string;
    direction: "asc" | "desc";
  }[];
  limit: number|null;
  offset: number|null;
}

export interface DatasetChart {
  id: number | null
  name: string
  description: string
  tenant_id: number | null
  query_id: number | null
  dataset_id: number | null
  type: SqlChartType
  options: Record<string, any>
  // visualizations: VisualizationChart[]
  tenant?: Tenant
  dataset?: Dataset
  query?: DatasetQuery
  is_active: boolean;
}