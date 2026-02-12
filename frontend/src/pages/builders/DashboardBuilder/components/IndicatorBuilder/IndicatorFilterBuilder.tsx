import React, { useMemo, useState, useCallback } from 'react';
import { AlertTriangle, Plus, Trash2, X } from 'lucide-react';
import { FormInput } from '@/components/forms/FormInput/FormInput';
import { FormSelect } from '@/components/forms/FormSelect/FormSelect';
import { FormDatePicker } from '@/components/forms/FormDatePicker/FormDatePicker';
import type { ColumnType, FilterOp } from '../../../builders.models';
import {
  ALLOWED_FILTER_OPS_NUMERIC,
  ALLOWED_FILTER_OPS_STRING,
  ALLOWED_FILTER_OPS_DATE,
  ALLOWED_FILTER_OPS,
  FILTER_OP_LABELS,
} from '../../../builders.models';
import type { SidebarColumn } from './IndicatorBuilder';
import styles from './IndicatorFilterBuilder.module.css';

// ============================================================================
// TYPES
// ============================================================================

export interface IndicatorFilter {
  id: string;
  columnName: string;
  columnType: ColumnType;
  op: FilterOp;
  value: unknown;
}

interface IndicatorFilterBuilderProps {
  columns: SidebarColumn[];
  filters: IndicatorFilter[];
  onFiltersChange: (filters: IndicatorFilter[]) => void;
}

// ============================================================================
// CONTRADICTION RULES
// ============================================================================

/** Pairs of operators that are always contradictory on the same column */
const CONTRADICTORY_PAIRS: [FilterOp, FilterOp][] = [
  ['is_null', 'is_not_null'],
  ['like', 'not_like'],
  ['in', 'not_in'],
];

/** Operators that imply the column has a non-null value */
const VALUE_OPS: FilterOp[] = ['=', '!=', '>', '>=', '<', '<=', 'in', 'not_in', 'between', 'like', 'not_like'];

/**
 * Returns a list of warnings for a given filter based on other filters on the same column.
 */
function getFilterWarnings(filter: IndicatorFilter, allFilters: IndicatorFilter[]): string[] {
  const siblings = allFilters.filter(
    (f) => f.id !== filter.id && f.columnName === filter.columnName
  );
  if (siblings.length === 0) return [];

  const warnings: string[] = [];

  for (const sibling of siblings) {
    // 1. Direct contradictory pairs (is_null/is_not_null, like/not_like, in/not_in)
    for (const [a, b] of CONTRADICTORY_PAIRS) {
      if (
        (filter.op === a && sibling.op === b) ||
        (filter.op === b && sibling.op === a)
      ) {
        // For like/not_like and in/not_in, only contradict if same value
        if ((a === 'like' && b === 'not_like') || (a === 'in' && b === 'not_in')) {
          if (JSON.stringify(filter.value) === JSON.stringify(sibling.value) && filter.value !== '' && filter.value !== null) {
            warnings.push(
              `Contradiction : "${FILTER_OP_LABELS[filter.op]}" et "${FILTER_OP_LABELS[sibling.op]}" avec la même valeur`
            );
          }
        } else {
          warnings.push(
            `Contradiction : "${FILTER_OP_LABELS[filter.op]}" et "${FILTER_OP_LABELS[sibling.op]}" sur la même colonne`
          );
        }
      }
    }

    // 2. is_null + any value-based operator
    if (filter.op === 'is_null' && VALUE_OPS.includes(sibling.op)) {
      warnings.push(
        `Contradiction : "Est vide" avec "${FILTER_OP_LABELS[sibling.op]}" (qui suppose une valeur non vide)`
      );
    }
    if (sibling.op === 'is_null' && VALUE_OPS.includes(filter.op)) {
      warnings.push(
        `Contradiction : "${FILTER_OP_LABELS[filter.op]}" avec "Est vide" sur la même colonne`
      );
    }

    // 3. = val1 + = val2 (different values → always false)
    if (filter.op === '=' && sibling.op === '=') {
      const v1 = String(filter.value ?? '');
      const v2 = String(sibling.value ?? '');
      if (v1 && v2 && v1 !== v2) {
        warnings.push(`Contradiction : deux "Égal à" avec des valeurs différentes ("${v1}" et "${v2}")`);
      }
    }

    // 4. = val + != val (same value)
    if (
      (filter.op === '=' && sibling.op === '!=') ||
      (filter.op === '!=' && sibling.op === '=')
    ) {
      const v1 = String(filter.value ?? '');
      const v2 = String(sibling.value ?? '');
      if (v1 && v2 && v1 === v2) {
        warnings.push(`Contradiction : "Égal à" et "Différent de" avec la même valeur ("${v1}")`);
      }
    }

    // 5. Numeric range contradictions: > val1 + < val2 where val1 >= val2
    if (filter.columnType === 'number' || filter.columnType === 'date') {
      const v1 = Number(filter.value);
      const v2 = Number(sibling.value);
      if (!isNaN(v1) && !isNaN(v2)) {
        if ((filter.op === '>' || filter.op === '>=') && (sibling.op === '<' || sibling.op === '<=')) {
          const strictLeft = filter.op === '>';
          const strictRight = sibling.op === '<';
          if (strictLeft && strictRight && v1 >= v2) {
            warnings.push(`Plage impossible : > ${v1} et < ${v2}`);
          } else if (strictLeft && !strictRight && v1 >= v2) {
            warnings.push(`Plage impossible : > ${v1} et ≤ ${v2}`);
          } else if (!strictLeft && strictRight && v1 >= v2) {
            warnings.push(`Plage impossible : ≥ ${v1} et < ${v2}`);
          } else if (!strictLeft && !strictRight && v1 > v2) {
            warnings.push(`Plage impossible : ≥ ${v1} et ≤ ${v2}`);
          }
        }
      }
    }
  }

  return warnings;
}

/**
 * Returns filtered ops for a new filter, excluding operators that would
 * immediately create a contradiction with existing filters on the same column.
 */
function getAvailableOps(
  columnName: string,
  columnType: ColumnType,
  existingFilters: IndicatorFilter[],
  currentFilterId?: string,
): FilterOp[] {
  const allOps = getOpsForType(columnType);
  const siblings = existingFilters.filter(
    (f) => f.columnName === columnName && f.id !== currentFilterId
  );
  if (siblings.length === 0) return allOps;

  const siblingOps = new Set(siblings.map((f) => f.op));

  return allOps.filter((op) => {
    // Block direct contradictory pair
    for (const [a, b] of CONTRADICTORY_PAIRS) {
      if (op === a && siblingOps.has(b)) return false;
      if (op === b && siblingOps.has(a)) return false;
    }
    // Block is_null if any value-based op exists
    if (op === 'is_null' && siblings.some((s) => VALUE_OPS.includes(s.op))) return false;
    // Block value ops if is_null exists
    if (VALUE_OPS.includes(op) && siblingOps.has('is_null')) return false;
    // Block duplicate = (allow only one = per column)
    if (op === '=' && siblingOps.has('=')) return false;

    return true;
  });
}

// ============================================================================
// HELPERS
// ============================================================================

const getOpsForType = (type: ColumnType): FilterOp[] => {
  switch (type) {
    case 'number':
      return ALLOWED_FILTER_OPS_NUMERIC;
    case 'string':
      return ALLOWED_FILTER_OPS_STRING;
    case 'date':
      return ALLOWED_FILTER_OPS_DATE;
    case 'boolean':
      return ['=', '!=', 'is_null', 'is_not_null'];
    default:
      return ALLOWED_FILTER_OPS;
  }
};

const getDefaultValue = (op: FilterOp): unknown => {
  if (op === 'is_null' || op === 'is_not_null') return null;
  if (op === 'between') return ['', ''];
  if (op === 'in' || op === 'not_in') return [];
  return '';
};

const generateId = () =>
  `filter-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

// ============================================================================
// VALUE INPUT
// ============================================================================

interface ValueInputProps {
  filter: IndicatorFilter;
  onChange: (value: unknown) => void;
}

const ValueInput: React.FC<ValueInputProps> = ({ filter, onChange }) => {
  const { op, columnType, value } = filter;

  // 0 args
  if (op === 'is_null' || op === 'is_not_null') {
    return <span className={styles.noValue}>—</span>;
  }

  // N args (in / not_in)
  if (op === 'in' || op === 'not_in') {
    return (
      <FormInput
        placeholder="Valeurs séparées par des virgules"
        value={Array.isArray(value) ? (value as string[]).join(', ') : ''}
        onChange={(e) => {
          const values = e.target.value
            .split(',')
            .map((v) => v.trim())
            .filter(Boolean);
          onChange(values);
        }}
      />
    );
  }

  // 2 args (between)
  if (op === 'between') {
    const [start, end] = Array.isArray(value) ? (value as string[]) : ['', ''];
    return (
      <div className={styles.betweenGroup}>
        {columnType === 'date' ? (
          <FormDatePicker
            value={start || ''}
            onChange={(e) => onChange([e.target.value, end])}
          />
        ) : (
          <FormInput
            type={columnType === 'number' ? 'number' : 'text'}
            placeholder="Début"
            value={start || ''}
            onChange={(e) => onChange([e.target.value, end])}
          />
        )}
        <span className={styles.betweenSep}>et</span>
        {columnType === 'date' ? (
          <FormDatePicker
            value={end || ''}
            onChange={(e) => onChange([start, e.target.value])}
          />
        ) : (
          <FormInput
            type={columnType === 'number' ? 'number' : 'text'}
            placeholder="Fin"
            value={end || ''}
            onChange={(e) => onChange([start, e.target.value])}
          />
        )}
      </div>
    );
  }

  // 1 arg — boolean
  if (columnType === 'boolean') {
    return (
      <FormSelect
        value={(value as string) || ''}
        onChange={(v) => onChange(v)}
        placeholder="Sélectionner..."
        options={[
          { value: 'true', label: 'Vrai' },
          { value: 'false', label: 'Faux' },
        ]}
      />
    );
  }

  // 1 arg — date
  if (columnType === 'date') {
    return (
      <FormDatePicker
        value={(value as string) || ''}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  // 1 arg — number / string
  return (
    <FormInput
      type={columnType === 'number' ? 'number' : 'text'}
      placeholder="Valeur"
      value={(value as string) || ''}
      onChange={(e) => onChange(e.target.value)}
    />
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const IndicatorFilterBuilder: React.FC<IndicatorFilterBuilderProps> = ({
  columns,
  filters,
  onFiltersChange,
}) => {
  const [showFilterPicker, setShowFilterPicker] = useState(false);

  // All columns are always available (same column can appear in multiple filters)
  const columnOptions = useMemo(
    () => columns.map((col) => ({ value: col.name, label: `${col.name} (${col.type})` })),
    [columns]
  );

  // Pre-compute warnings for all filters
  const warningsMap = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const filter of filters) {
      const w = getFilterWarnings(filter, filters);
      if (w.length > 0) map.set(filter.id, w);
    }
    return map;
  }, [filters]);

  const hasWarnings = warningsMap.size > 0;

  const handleAddFilter = useCallback(
    (columnName: string) => {
      const col = columns.find((c) => c.name === columnName);
      if (!col) return;
      const ops = getAvailableOps(columnName, col.type, filters);
      if (ops.length === 0) return;
      const defaultOp = ops[0];
      const newFilter: IndicatorFilter = {
        id: generateId(),
        columnName: col.name,
        columnType: col.type,
        op: defaultOp,
        value: getDefaultValue(defaultOp),
      };
      onFiltersChange([...filters, newFilter]);
      setShowFilterPicker(false);
    },
    [columns, filters, onFiltersChange]
  );

  const handleUpdateOp = useCallback(
    (filterId: string, newOp: FilterOp) => {
      onFiltersChange(
        filters.map((f) =>
          f.id === filterId ? { ...f, op: newOp, value: getDefaultValue(newOp) } : f
        )
      );
    },
    [filters, onFiltersChange]
  );

  const handleUpdateValue = useCallback(
    (filterId: string, newValue: unknown) => {
      onFiltersChange(
        filters.map((f) => (f.id === filterId ? { ...f, value: newValue } : f))
      );
    },
    [filters, onFiltersChange]
  );

  const handleRemoveFilter = useCallback(
    (filterId: string) => {
      onFiltersChange(filters.filter((f) => f.id !== filterId));
    },
    [filters, onFiltersChange]
  );

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.cardTitleGroup}>
          <span className={styles.cardTitle}>Filtres</span>
          {filters.length > 0 && (
            <span className={styles.filterCount}>{filters.length}</span>
          )}
        </div>
        <button
          type="button"
          className={styles.addFilterBtn}
          onClick={() => setShowFilterPicker(true)}
          disabled={columns.length === 0}
        >
          <Plus size={14} />
          Ajouter filtre
        </button>
      </div>

      {showFilterPicker && (
        <div className={styles.pickerRow}>
          <FormSelect
            value=""
            onChange={(value) => {
              if (value) handleAddFilter(value);
            }}
            placeholder="Choisir une colonne..."
            options={columnOptions}
            searchable
          />
          <button
            type="button"
            className={styles.btnCancel}
            onClick={() => setShowFilterPicker(false)}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {hasWarnings && (
        <div className={styles.globalWarning}>
          <AlertTriangle size={14} />
          <span>Certains filtres sont contradictoires et ne retourneront aucun resultat.</span>
        </div>
      )}

      {filters.length > 0 && (
        <div className={styles.filterTable}>
          <div className={styles.filterTableHead}>
            <span>Colonne</span>
            <span>Operateur</span>
            <span>Valeur</span>
            <span></span>
          </div>

          {filters.map((filter) => {
            const availableOps = getAvailableOps(
              filter.columnName,
              filter.columnType,
              filters,
              filter.id
            );
            // Always include current op so the select doesn't break
            const opsForSelect = availableOps.includes(filter.op)
              ? availableOps
              : [filter.op, ...availableOps];
            const opOptions = opsForSelect.map((op) => ({
              value: op,
              label: FILTER_OP_LABELS[op],
            }));
            const filterWarnings = warningsMap.get(filter.id);

            return (
              <div
                key={filter.id}
                className={`${styles.filterTableRow} ${filterWarnings ? styles.filterTableRowWarning : ''}`}
              >
                <div className={styles.cellColumn}>
                  <span className={styles.columnName}>{filter.columnName}</span>
                  <span className={styles.columnType}>{filter.columnType}</span>
                </div>

                <div className={styles.cellOp}>
                  <FormSelect
                    value={filter.op}
                    onChange={(value) => handleUpdateOp(filter.id, value as FilterOp)}
                    options={opOptions}
                  />
                </div>

                <div className={styles.cellValue}>
                  <ValueInput
                    filter={filter}
                    onChange={(value) => handleUpdateValue(filter.id, value)}
                  />
                </div>

                <div className={styles.cellActions}>
                  {filterWarnings && (
                    <span className={styles.warningIcon} title={filterWarnings.join('\n')}>
                      <AlertTriangle size={14} />
                    </span>
                  )}
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => handleRemoveFilter(filter.id)}
                    aria-label="Supprimer le filtre"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {filterWarnings && (
                  <div className={styles.rowWarning}>
                    {filterWarnings.map((w, i) => (
                      <span key={i}>{w}</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {filters.length === 0 && !showFilterPicker && (
        <div className={styles.emptyFilters}>Aucun filtre defini</div>
      )}
    </div>
  );
};
