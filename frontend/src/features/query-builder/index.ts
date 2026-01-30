/**
 * Query Builder Feature Index
 */

// Components
export { QueryBuilder } from './components';
export type { QueryBuilderProps } from './types';

// Types
export type {
  AnalyticsModel,
  TableDef,
  DimensionDef,
  MetricDef,
  QueryJSON,
  QueryBuilderState,
  SelectField,
  FilterField,
  JoinField,
  OrderField,
  GroupByField,
  ValidationResult,
  ValidationError,
  ColumnType,
  JoinType,
  AggType,
  FilterOp,
  OrderDirection,
  LogicalOperator,
} from './types';

// Constants
export {
  ALLOWED_AGGS,
  ALLOWED_JOIN_TYPES,
  ALLOWED_FILTER_OPS,
  ALLOWED_ORDER,
  AGG_LABELS,
  JOIN_TYPE_LABELS,
  FILTER_OP_LABELS,
  MAX_SELECT,
  MAX_JOINS,
  MAX_FILTERS,
  MAX_HAVING,
  MAX_GROUP_BY,
  MAX_ORDER_BY,
  MAX_LIMIT,
  DEFAULT_LIMIT,
} from './types';

// Hooks
export { useQueryBuilder } from './hooks/useQueryBuilder';
export type { UseQueryBuilderReturn } from './hooks/useQueryBuilder';

// Page
export { QueryBuilderPage } from './pages/QueryBuilderPage';
