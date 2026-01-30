/**
 * useQueryBuilder Hook
 * Gère l'état complet du Query Builder
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import type {
  QueryBuilderState,
  QueryJSON,
  SelectField,
  JoinField,
  FilterField,
  OrderField,
  GroupByField,
  AnalyticsModel,
  ValidationResult,
  ValidationError,
  AggType,
  JoinType,
  FilterOp,
  OrderDirection,
  DimensionDef,
  MetricDef,
} from '../types';
import {
  MAX_SELECT,
  MAX_JOINS,
  MAX_FILTERS,
  MAX_HAVING,
  MAX_GROUP_BY,
  MAX_ORDER_BY,
  MAX_LIMIT,
  DEFAULT_LIMIT,
  ALLOWED_AGGS,
  ALLOWED_JOIN_TYPES,
  ALLOWED_FILTER_OPS,
  ALLOWED_ORDER,
} from '../types';

// ============================================================================
// ID GENERATOR (replaces uuid)
// ============================================================================

let idCounter = 0;
const generateId = (): string => {
  idCounter += 1;
  return `qb_${Date.now()}_${idCounter}_${Math.random().toString(36).substring(2, 9)}`;
};

// Alias for compatibility
const uuidv4 = generateId;

// ============================================================================
// INITIAL STATE
// ============================================================================

const createInitialState = (): QueryBuilderState => ({
  from: '',
  fromLabel: '',
  select: [],
  joins: [],
  filters: [],
  having: [],
  groupBy: [],
  orderBy: [],
  limit: DEFAULT_LIMIT,
  offset: 0,
});

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

const SAFE_FIELD_REGEX = /^[a-zA-Z_][a-zA-Z0-9_.]*$/;
const ALIAS_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

function validateField(field: string): boolean {
  return SAFE_FIELD_REGEX.test(field);
}

function validateAlias(alias: string): boolean {
  return ALIAS_REGEX.test(alias);
}

// ============================================================================
// HOOK
// ============================================================================

export function useQueryBuilder(
  model: AnalyticsModel,
  initialQuery?: Partial<QueryBuilderState>
) {
  const [state, setState] = useState<QueryBuilderState>(() => ({
    ...createInitialState(),
    ...initialQuery,
  }));

  const [validation, setValidation] = useState<ValidationResult>({
    isValid: true,
    errors: [],
    warnings: [],
  });

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const allFields = useMemo(() => {
    return [...model.dimensions, ...model.metrics];
  }, [model]);

  const availableDimensions = useMemo(() => {
    if (!state.from) return model.dimensions;
    return model.dimensions.filter(
      (d) => d.table === state.from || state.joins.some((j) => j.table === d.table)
    );
  }, [model.dimensions, state.from, state.joins]);

  const availableMetrics = useMemo(() => {
    if (!state.from) return model.metrics;
    return model.metrics.filter(
      (m) => m.table === state.from || state.joins.some((j) => j.table === m.table)
    );
  }, [model.metrics, state.from, state.joins]);

  const availableTables = useMemo(() => {
    return model.tables.filter((t) => t.id !== state.from && !state.joins.some((j) => j.table === t.id));
  }, [model.tables, state.from, state.joins]);

  // ============================================================================
  // VALIDATION
  // ============================================================================

  const validate = useCallback((): ValidationResult => {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // FROM validation
    if (!state.from) {
      errors.push({ field: 'from', message: 'Veuillez sélectionner une table source', severity: 'error' });
    } else if (!model.tables.find((t) => t.id === state.from)) {
      errors.push({ field: 'from', message: `Table inconnue: ${state.from}`, severity: 'error' });
    }

    // SELECT validation
    if (state.select.length === 0) {
      errors.push({ field: 'select', message: 'Veuillez sélectionner au moins un champ', severity: 'error' });
    }
    if (state.select.length > MAX_SELECT) {
      errors.push({ field: 'select', message: `Maximum ${MAX_SELECT} champs autorisés`, severity: 'error' });
    }

    const seenAliases = new Set<string>();
    state.select.forEach((s, i) => {
      if (!s.field) {
        errors.push({ field: `select[${i}]`, message: 'Champ requis', severity: 'error' });
      } else if (!validateField(s.field)) {
        errors.push({ field: `select[${i}]`, message: `Champ invalide: ${s.field}`, severity: 'error' });
      }
      if (s.agg && !ALLOWED_AGGS.includes(s.agg)) {
        errors.push({ field: `select[${i}]`, message: `Agrégation invalide: ${s.agg}`, severity: 'error' });
      }
      if (s.alias) {
        if (!validateAlias(s.alias)) {
          errors.push({ field: `select[${i}]`, message: `Alias invalide: ${s.alias}`, severity: 'error' });
        }
        if (seenAliases.has(s.alias)) {
          errors.push({ field: `select[${i}]`, message: `Alias dupliqué: ${s.alias}`, severity: 'error' });
        }
        seenAliases.add(s.alias);
      }
    });

    // JOINS validation
    if (state.joins.length > MAX_JOINS) {
      errors.push({ field: 'joins', message: `Maximum ${MAX_JOINS} jointures autorisées`, severity: 'error' });
    }
    state.joins.forEach((j, i) => {
      if (!j.table) {
        errors.push({ field: `joins[${i}]`, message: 'Table de jointure requise', severity: 'error' });
      }
      if (!ALLOWED_JOIN_TYPES.includes(j.type)) {
        errors.push({ field: `joins[${i}]`, message: `Type de jointure invalide: ${j.type}`, severity: 'error' });
      }
      if (!j.on.left || !j.on.right) {
        errors.push({ field: `joins[${i}]`, message: 'Conditions de jointure requises', severity: 'error' });
      }
    });

    // FILTERS validation
    if (state.filters.length > MAX_FILTERS) {
      errors.push({ field: 'filters', message: `Maximum ${MAX_FILTERS} filtres autorisés`, severity: 'error' });
    }
    state.filters.forEach((f, i) => {
      if (!f.field) {
        errors.push({ field: `filters[${i}]`, message: 'Champ de filtre requis', severity: 'error' });
      }
      if (!ALLOWED_FILTER_OPS.includes(f.op)) {
        errors.push({ field: `filters[${i}]`, message: `Opérateur invalide: ${f.op}`, severity: 'error' });
      }
      if (!['is_null', 'is_not_null'].includes(f.op)) {
        if (f.op === 'in' || f.op === 'not_in') {
          if (!Array.isArray(f.value) || f.value.length === 0) {
            errors.push({ field: `filters[${i}]`, message: 'Liste de valeurs requise', severity: 'error' });
          }
        } else if (f.op === 'between') {
          if (!Array.isArray(f.value) || f.value.length !== 2) {
            errors.push({ field: `filters[${i}]`, message: 'Deux valeurs requises pour BETWEEN', severity: 'error' });
          }
        } else if (f.value === undefined || f.value === '') {
          errors.push({ field: `filters[${i}]`, message: 'Valeur requise', severity: 'error' });
        }
      }
    });

    // HAVING validation
    if (state.having.length > MAX_HAVING) {
      errors.push({ field: 'having', message: `Maximum ${MAX_HAVING} conditions HAVING autorisées`, severity: 'error' });
    }

    // GROUP BY validation
    if (state.groupBy.length > MAX_GROUP_BY) {
      errors.push({ field: 'groupBy', message: `Maximum ${MAX_GROUP_BY} champs GROUP BY autorisés`, severity: 'error' });
    }

    // Check if GROUP BY is needed
    const hasAggregation = state.select.some((s) => s.agg);
    const hasNonAggregated = state.select.some((s) => !s.agg && !s.isMetric);
    if (hasAggregation && hasNonAggregated && state.groupBy.length === 0) {
      warnings.push({
        field: 'groupBy',
        message: 'Des champs non agrégés nécessitent un GROUP BY',
        severity: 'warning',
      });
    }

    // ORDER BY validation
    if (state.orderBy.length > MAX_ORDER_BY) {
      errors.push({ field: 'orderBy', message: `Maximum ${MAX_ORDER_BY} champs ORDER BY autorisés`, severity: 'error' });
    }
    state.orderBy.forEach((o, i) => {
      if (!o.field) {
        errors.push({ field: `orderBy[${i}]`, message: 'Champ de tri requis', severity: 'error' });
      }
      if (!ALLOWED_ORDER.includes(o.direction)) {
        errors.push({ field: `orderBy[${i}]`, message: `Direction invalide: ${o.direction}`, severity: 'error' });
      }
    });

    // LIMIT validation
    if (state.limit !== undefined) {
      if (state.limit <= 0 || state.limit > MAX_LIMIT) {
        errors.push({ field: 'limit', message: `LIMIT doit être entre 1 et ${MAX_LIMIT}`, severity: 'error' });
      }
    }

    // OFFSET validation
    if (state.offset !== undefined && state.offset < 0) {
      errors.push({ field: 'offset', message: 'OFFSET doit être positif', severity: 'error' });
    }
    if (state.offset && !state.limit) {
      warnings.push({ field: 'offset', message: 'OFFSET sans LIMIT peut causer des problèmes', severity: 'warning' });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }, [state, model.tables]);

  // Update validation on state change
  useEffect(() => {
    const result = validate();
    setValidation(result);
  }, [validate]);

  // ============================================================================
  // JSON BUILDER
  // ============================================================================

  const buildJSON = useCallback((): QueryJSON => {
    const selectWithAggs = state.select.map((s) => {
      const agg = s.isMetric && !s.agg ? 'sum' : s.agg;
      const alias = s.alias || (agg ? `${agg}_${s.field.replace(/\./g, '_')}` : undefined);
      return {
        field: s.field,
        agg: agg as AggType | undefined,
        alias,
      };
    });

    const json: QueryJSON = {
      from: state.from,
      fromLabel: state.fromLabel,
      select: selectWithAggs,
    };

    if (state.joins.length > 0) {
      json.joins = state.joins.map((j) => ({
        table: j.table,
        type: j.type,
        on: { left: j.on.left, right: j.on.right },
      }));
    }

    if (state.filters.length > 0) {
      json.filters = state.filters.map((f) => ({
        field: f.field,
        op: f.op,
        value: f.value,
        logicalOp: f.logicalOp,
      }));
    }

    if (state.having.length > 0) {
      json.having = state.having.map((h) => ({
        field: h.field,
        op: h.op,
        value: h.value,
        logicalOp: h.logicalOp,
      }));
    }

    if (state.groupBy.length > 0) {
      json.group_by = state.groupBy.map((g) => g.field);
    }

    if (state.orderBy.length > 0) {
      json.order_by = state.orderBy.map((o) => ({
        field: o.field,
        direction: o.direction,
      }));
    }

    if (state.limit !== undefined) {
      json.limit = state.limit;
    }

    if (state.offset !== undefined && state.offset > 0) {
      json.offset = state.offset;
    }

    return json;
  }, [state]);

  // ============================================================================
  // SQL BUILDER
  // ============================================================================

  const buildSQL = useCallback((): string => {
    if (!state.from || state.select.length === 0) return '';

    const parts: string[] = [];

    // SELECT
    const selectParts = state.select.map((s) => {
      const agg = s.isMetric && !s.agg ? 'SUM' : s.agg?.toUpperCase();
      const alias = s.alias || (agg ? `${agg.toLowerCase()}_${s.field.replace(/\./g, '_')}` : null);
      if (agg) {
        return `${agg}(${s.field})${alias ? ` AS ${alias}` : ''}`;
      }
      return s.field;
    });
    parts.push(`SELECT ${selectParts.join(', ')}`);

    // FROM
    parts.push(`FROM ${state.from}`);

    // JOINS
    state.joins.forEach((j) => {
      parts.push(`${j.type.toUpperCase()} JOIN ${j.table} ON ${j.on.left} = ${j.on.right}`);
    });

    // WHERE
    if (state.filters.length > 0) {
      const filterParts = state.filters.map((f, i) => {
        let condition = '';
        if (f.op === 'in' || f.op === 'not_in') {
          const values = Array.isArray(f.value) ? f.value.map((v) => `'${v}'`).join(', ') : f.value;
          condition = `${f.field} ${f.op === 'not_in' ? 'NOT IN' : 'IN'} (${values})`;
        } else if (f.op === 'between') {
          const [start, end] = Array.isArray(f.value) ? f.value : [f.value, f.value];
          condition = `${f.field} BETWEEN '${start}' AND '${end}'`;
        } else if (f.op === 'is_null') {
          condition = `${f.field} IS NULL`;
        } else if (f.op === 'is_not_null') {
          condition = `${f.field} IS NOT NULL`;
        } else if (f.op === 'like' || f.op === 'not_like') {
          condition = `${f.field} ${f.op === 'not_like' ? 'NOT LIKE' : 'LIKE'} '%${f.value}%'`;
        } else {
          condition = `${f.field} ${f.op} '${f.value}'`;
        }
        return i === 0 ? condition : `${f.logicalOp || 'AND'} ${condition}`;
      });
      parts.push(`WHERE ${filterParts.join(' ')}`);
    }

    // GROUP BY
    if (state.groupBy.length > 0) {
      parts.push(`GROUP BY ${state.groupBy.map((g) => g.field).join(', ')}`);
    }

    // HAVING
    if (state.having.length > 0) {
      const havingParts = state.having.map((h, i) => {
        const condition = `${h.field} ${h.op} ${h.value}`;
        return i === 0 ? condition : `${h.logicalOp || 'AND'} ${condition}`;
      });
      parts.push(`HAVING ${havingParts.join(' ')}`);
    }

    // ORDER BY
    if (state.orderBy.length > 0) {
      parts.push(`ORDER BY ${state.orderBy.map((o) => `${o.field} ${o.direction.toUpperCase()}`).join(', ')}`);
    }

    // LIMIT
    if (state.limit) {
      parts.push(`LIMIT ${state.limit}`);
    }

    // OFFSET
    if (state.offset) {
      parts.push(`OFFSET ${state.offset}`);
    }

    return parts.join('\n');
  }, [state]);

  // ============================================================================
  // ACTIONS
  // ============================================================================

  // FROM
  const setFrom = useCallback((tableId: string) => {
    const table = model.tables.find((t) => t.id === tableId);
    setState((prev) => ({
      ...prev,
      from: tableId,
      fromLabel: table?.label || tableId,
      // Reset joins when changing main table
      joins: [],
    }));
  }, [model.tables]);

  // SELECT
  const addSelect = useCallback((field: string, isMetric: boolean) => {
    if (state.select.length >= MAX_SELECT) return;
    const fieldDef = isMetric
      ? model.metrics.find((m) => m.id === field)
      : model.dimensions.find((d) => d.id === field);

    const newField: SelectField = {
      id: uuidv4(),
      field,
      label: fieldDef?.label || field,
      isMetric,
      agg: isMetric ? (fieldDef as MetricDef)?.defaultAgg || 'sum' : undefined,
    };
    setState((prev) => ({ ...prev, select: [...prev.select, newField] }));
  }, [state.select.length, model.dimensions, model.metrics]);

  const updateSelect = useCallback((id: string, updates: Partial<SelectField>) => {
    setState((prev) => ({
      ...prev,
      select: prev.select.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }));
  }, []);

  const removeSelect = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      select: prev.select.filter((s) => s.id !== id),
    }));
  }, []);

  const reorderSelect = useCallback((fromIndex: number, toIndex: number) => {
    setState((prev) => {
      const newSelect = [...prev.select];
      const [moved] = newSelect.splice(fromIndex, 1);
      newSelect.splice(toIndex, 0, moved);
      return { ...prev, select: newSelect };
    });
  }, []);

  // JOINS
  const addJoin = useCallback((tableId: string) => {
    if (state.joins.length >= MAX_JOINS) return;
    const table = model.tables.find((t) => t.id === tableId);
    const newJoin: JoinField = {
      id: uuidv4(),
      table: tableId,
      tableLabel: table?.label || tableId,
      type: 'left',
      on: { left: '', right: '' },
    };
    setState((prev) => ({ ...prev, joins: [...prev.joins, newJoin] }));
  }, [state.joins.length, model.tables]);

  const updateJoin = useCallback((id: string, updates: Partial<JoinField>) => {
    setState((prev) => ({
      ...prev,
      joins: prev.joins.map((j) => (j.id === id ? { ...j, ...updates } : j)),
    }));
  }, []);

  const removeJoin = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      joins: prev.joins.filter((j) => j.id !== id),
    }));
  }, []);

  // FILTERS
  const addFilter = useCallback((field: string, target: 'where' | 'having' = 'where') => {
    const maxFilters = target === 'where' ? MAX_FILTERS : MAX_HAVING;
    const currentFilters = target === 'where' ? state.filters : state.having;
    if (currentFilters.length >= maxFilters) return;

    const fieldDef = model.dimensions.find((d) => d.id === field) || model.metrics.find((m) => m.id === field);
    const newFilter: FilterField = {
      id: uuidv4(),
      field,
      fieldLabel: fieldDef?.label || field,
      op: '=',
      value: '',
      logicalOp: currentFilters.length > 0 ? 'AND' : undefined,
    };

    if (target === 'where') {
      setState((prev) => ({ ...prev, filters: [...prev.filters, newFilter] }));
    } else {
      setState((prev) => ({ ...prev, having: [...prev.having, newFilter] }));
    }
  }, [state.filters.length, state.having.length, model.dimensions, model.metrics]);

  const updateFilter = useCallback((id: string, updates: Partial<FilterField>, target: 'where' | 'having' = 'where') => {
    if (target === 'where') {
      setState((prev) => ({
        ...prev,
        filters: prev.filters.map((f) => (f.id === id ? { ...f, ...updates } : f)),
      }));
    } else {
      setState((prev) => ({
        ...prev,
        having: prev.having.map((h) => (h.id === id ? { ...h, ...updates } : h)),
      }));
    }
  }, []);

  const removeFilter = useCallback((id: string, target: 'where' | 'having' = 'where') => {
    if (target === 'where') {
      setState((prev) => ({
        ...prev,
        filters: prev.filters.filter((f) => f.id !== id),
      }));
    } else {
      setState((prev) => ({
        ...prev,
        having: prev.having.filter((h) => h.id !== id),
      }));
    }
  }, []);

  // GROUP BY
  const addGroupBy = useCallback((field: string) => {
    if (state.groupBy.length >= MAX_GROUP_BY) return;
    if (state.groupBy.some((g) => g.field === field)) return;

    const fieldDef = model.dimensions.find((d) => d.id === field);
    const newGroupBy: GroupByField = {
      id: uuidv4(),
      field,
      fieldLabel: fieldDef?.label || field,
    };
    setState((prev) => ({ ...prev, groupBy: [...prev.groupBy, newGroupBy] }));
  }, [state.groupBy, model.dimensions]);

  const removeGroupBy = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      groupBy: prev.groupBy.filter((g) => g.id !== id),
    }));
  }, []);

  // ORDER BY
  const addOrderBy = useCallback((field: string) => {
    if (state.orderBy.length >= MAX_ORDER_BY) return;

    const fieldDef = model.dimensions.find((d) => d.id === field) || model.metrics.find((m) => m.id === field);
    const newOrderBy: OrderField = {
      id: uuidv4(),
      field,
      fieldLabel: fieldDef?.label || field,
      direction: 'asc',
    };
    setState((prev) => ({ ...prev, orderBy: [...prev.orderBy, newOrderBy] }));
  }, [state.orderBy.length, model.dimensions, model.metrics]);

  const updateOrderBy = useCallback((id: string, updates: Partial<OrderField>) => {
    setState((prev) => ({
      ...prev,
      orderBy: prev.orderBy.map((o) => (o.id === id ? { ...o, ...updates } : o)),
    }));
  }, []);

  const removeOrderBy = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      orderBy: prev.orderBy.filter((o) => o.id !== id),
    }));
  }, []);

  const reorderOrderBy = useCallback((fromIndex: number, toIndex: number) => {
    setState((prev) => {
      const newOrderBy = [...prev.orderBy];
      const [moved] = newOrderBy.splice(fromIndex, 1);
      newOrderBy.splice(toIndex, 0, moved);
      return { ...prev, orderBy: newOrderBy };
    });
  }, []);

  // LIMIT / OFFSET
  const setLimit = useCallback((limit: number | undefined) => {
    setState((prev) => ({ ...prev, limit }));
  }, []);

  const setOffset = useCallback((offset: number | undefined) => {
    setState((prev) => ({ ...prev, offset }));
  }, []);

  // RESET
  const reset = useCallback(() => {
    setState(createInitialState());
  }, []);

  // AUTO GROUP BY
  const autoGroupBy = useCallback(() => {
    const nonAggregatedFields = state.select.filter((s) => !s.agg && !s.isMetric);
    const newGroupBy: GroupByField[] = nonAggregatedFields
      .filter((s) => !state.groupBy.some((g) => g.field === s.field))
      .map((s) => ({
        id: uuidv4(),
        field: s.field,
        fieldLabel: s.label,
      }));
    setState((prev) => ({ ...prev, groupBy: [...prev.groupBy, ...newGroupBy] }));
  }, [state.select, state.groupBy]);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // State
    state,
    validation,

    // Computed
    availableDimensions,
    availableMetrics,
    availableTables,
    allFields,

    // Builders
    buildJSON,
    buildSQL,

    // Actions
    setFrom,
    addSelect,
    updateSelect,
    removeSelect,
    reorderSelect,
    addJoin,
    updateJoin,
    removeJoin,
    addFilter,
    updateFilter,
    removeFilter,
    addGroupBy,
    removeGroupBy,
    addOrderBy,
    updateOrderBy,
    removeOrderBy,
    reorderOrderBy,
    setLimit,
    setOffset,
    reset,
    autoGroupBy,
  };
}

export type UseQueryBuilderReturn = ReturnType<typeof useQueryBuilder>;
