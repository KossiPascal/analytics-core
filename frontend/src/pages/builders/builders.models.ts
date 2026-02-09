/**
 * Query Builder Types
 * Types et interfaces pour le module Query Builder
 */

// ============================================================================
// BASIC TYPES
// ============================================================================

export type ColumnType = 'string' | 'number' | 'date' | 'boolean';
export type JoinType = 'inner' | 'left' | 'right' | 'full';
export type AggType = 'sum' | 'avg' | 'count' | 'min' | 'max' | 'distinct';
export type FilterOp = '=' | '!=' | '>' | '>=' | '<' | '<=' | 'in' | 'not_in' | 'between' | 'like' | 'not_like' | 'is_null' | 'is_not_null';
export type OrderDirection = 'asc' | 'desc';
export type LogicalOperator = 'AND' | 'OR';


// ============================================================================
// CONNECTIONS
// ============================================================================
export type DbType = 'postgresql' | 'mysql' | 'mssql' | 'mariadb' | 'sqlite' | 'couchdb' | 'mongodb' | 'oracle' | 'other';

export interface DbConnectionDetails {
  functions: any[],
  indexes: any[],
  materialized_views: any[],
  schemas: any[],
  sequences: any[],
  tables: {
    columns: { default: string, name: string, nullable: boolean, type: string }[],
    foreign_keys: any[];
    indexes: any[],
    primary_key: string[];
    table_name:string
  }[],
  triggers: any[],
  views: any[]
}

export interface DbConnection {
  id?: number | null;
  type: DbType;
  description: string;
  name: string;
  dbname: string;
  username: string;
  password?: string;
  host: string;
  port: number;
  ssh_enabled: boolean;
  ssh_host?: string;
  ssh_port?: number;
  ssh_username?: string;
  ssh_password?: string;
  ssh_key?: string;
  ssh_key_pass?: string;
  details?: DbConnectionDetails
  auto_sync: boolean;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
}

export interface DbConnectionParams {
  id?: number | null;
  type: DbType;
  name: string;
  description: string;
  host: string;
  username: string;
  dbname: string;
  port: number;
  password?: string;
  auto_sync: boolean;
  ssh?: {
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    key?: string;
    key_pass?: string;
  } | null;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export type TestType = "test-ssh" | "test-ssh-db"



// ============================================================================
// FIELD DEFINITIONS
// ============================================================================

export type EntityType = 'table' | 'view' | 'materialized_view';

export interface DatabaseDef {
  id: string|number;
  label: string;
  type: DbType;
  description?: string;
  icon?: string;
  color?: string;
}

export interface TableDef {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  color?: string;
  database?: string; // ID of the database this table belongs to
  type?: EntityType; // table, view, or materialized_view
}

export interface DimensionDef {
  id: string;
  label: string;
  table: string;
  type: ColumnType;
  description?: string;
  groupable: boolean;
  filterable: boolean;
  icon?: string;
  defaultAgg?: AggType;
}

export interface MetricDef {
  id: string;
  label: string;
  table: string;
  description?: string;
  defaultAgg?: AggType;
  returnType: 'number';
  icon?: string;
}

export interface AttributDef {
  id: string;
  label: string;
  table: string;
  type: ColumnType;
  description?: string;
  groupable: boolean;
  filterable: boolean;
  icon?: string;
  defaultAgg?: AggType;
}

// ============================================================================
// QUERY COMPONENTS
// ============================================================================

export interface SelectField {
  id: string;
  field: string;
  label: string;
  agg?: AggType;
  alias?: string;
  isMetric: boolean;
}

export interface JoinField {
  id: string;
  table: string;
  tableLabel?: string;
  type: JoinType;
  on: {
    left: string;
    leftLabel?: string;
    right: string;
    rightLabel?: string;
  };
}

export interface FilterField {
  id: string;
  field: string;
  fieldLabel?: string;
  op: FilterOp;
  value: unknown;
  logicalOp?: LogicalOperator;
}

export interface FilterGroup {
  id: string;
  logicalOp: LogicalOperator;
  filters: (FilterField | FilterGroup)[];
}

export interface OrderField {
  id: string;
  field: string;
  fieldLabel?: string;
  direction: OrderDirection;
}

export interface GroupByField {
  id: string;
  field: string;
  fieldLabel?: string;
}

// ============================================================================
// QUERY JSON OUTPUT
// ============================================================================

export interface QueryJSON {
  from: string;
  fromLabel?: string;
  joins?: Array<{
    table: string;
    type: JoinType;
    on: { left: string; right: string };
  }>;
  select: Array<{
    field: string;
    agg?: AggType;
    alias?: string;
  }>;
  filters?: Array<{
    field: string;
    op: FilterOp;
    value: unknown;
    logicalOp?: LogicalOperator;
  }>;
  having?: Array<{
    field: string;
    op: FilterOp;
    value: unknown;
    logicalOp?: LogicalOperator;
  }>;
  group_by?: string[];
  order_by?: Array<{
    field: string;
    direction: OrderDirection;
  }>;
  limit?: number;
  offset?: number;
}

// ============================================================================
// ANALYTICS MODEL
// ============================================================================

export interface AnalyticsModel {
  databases: DatabaseDef[];
  tables: TableDef[];
  dimensions: DimensionDef[];
  metrics: MetricDef[];
  attributs: AttributDef[];
}

// ============================================================================
// QUERY BUILDER STATE
// ============================================================================

export interface SqlBuilderState {
  from: string;
  fromLabel: string;
  select: SelectField[];
  joins: JoinField[];
  filters: FilterField[];
  having: FilterField[];
  groupBy: GroupByField[];
  orderBy: OrderField[];
  limit: number | undefined;
  offset: number | undefined;
}

// ============================================================================
// VALIDATION
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

// ============================================================================
// DRAG AND DROP
// ============================================================================

export type DragItemType = 'dimension' | 'metric' | 'select' | 'filter' | 'groupby' | 'orderby';

export interface DragItem {
  type: DragItemType;
  id: string;
  field: string;
  label: string;
  sourceType: 'dimension' | 'metric';
  index?: number;
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

export interface SqlBuilderProps {
  model: AnalyticsModel;
  initialQuery?: Partial<SqlBuilderState>;
  onQueryChange?: (query: QueryJSON) => void;
  onLoadTables?: (query: QueryJSON) => void;
  onLoadDimensions?: () => void;
  onLoadMetrics?: () => void;
  onLoadDatabases?: () => Promise<void>;
  onRun?: (query: QueryJSON) => void;
  onSave?: (query: QueryJSON, name: string) => void;
  readOnly?: boolean;
  compact?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const ALLOWED_AGGS: AggType[] = ['sum', 'avg', 'count', 'min', 'max', 'distinct'];
export const ALLOWED_JOIN_TYPES: JoinType[] = ['inner', 'left', 'right', 'full'];
export const ALLOWED_FILTER_OPS: FilterOp[] = ['=', '!=', '>', '>=', '<', '<=', 'in', 'not_in', 'between', 'like', 'not_like', 'is_null', 'is_not_null'];
export const ALLOWED_FILTER_OPS_NUMERIC: FilterOp[] = ['=', '!=', '>', '>=', '<', '<=', 'between', 'in', 'is_null', 'is_not_null'];
export const ALLOWED_FILTER_OPS_STRING: FilterOp[] = ['=', '!=', 'like', 'not_like', 'in', 'not_in', 'is_null', 'is_not_null'];
export const ALLOWED_FILTER_OPS_DATE: FilterOp[] = ['=', '!=', '>', '>=', '<', '<=', 'between', 'is_null', 'is_not_null'];
export const ALLOWED_ORDER: OrderDirection[] = ['asc', 'desc'];

export const MAX_SELECT = 20;
export const MAX_GROUP_BY = 15;
export const MAX_FILTERS = 20;
export const MAX_HAVING = 20;
export const MAX_JOINS = 8;
export const MAX_ORDER_BY = 10;
export const MAX_LIMIT = 100000;
export const DEFAULT_LIMIT = 100;

export const FILTER_OP_LABELS: Record<FilterOp, string> = {
  '=': 'Égal à',
  '!=': 'Différent de',
  '>': 'Supérieur à',
  '>=': 'Supérieur ou égal à',
  '<': 'Inférieur à',
  '<=': 'Inférieur ou égal à',
  'in': 'Dans la liste',
  'not_in': 'Pas dans la liste',
  'between': 'Entre',
  'like': 'Contient',
  'not_like': 'Ne contient pas',
  'is_null': 'Est vide',
  'is_not_null': 'N\'est pas vide',
};

export const AGG_LABELS: Record<AggType, string> = {
  sum: 'Somme',
  avg: 'Moyenne',
  count: 'Nombre',
  min: 'Minimum',
  max: 'Maximum',
  distinct: 'Distinct',
};

export const JOIN_TYPE_LABELS: Record<JoinType, string> = {
  inner: 'INNER JOIN',
  left: 'LEFT JOIN',
  right: 'RIGHT JOIN',
  full: 'FULL JOIN',
};

export const COLUMN_TYPE_ICONS: Record<ColumnType, string> = {
  string: 'Aa',
  number: '#',
  date: '📅',
  boolean: '✓',
};
