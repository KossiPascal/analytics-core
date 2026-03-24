import React, { useMemo, useState, useCallback } from 'react';
import { WarningIcon3D, AddIcon3D, DeleteIcon3D, ErrorIcon3D, icon3dStyles } from '@/components/ui/icons';
import { FormInput } from '@/components/forms/FormInput/FormInput';
import { FormSelect } from '@/components/forms/FormSelect/FormSelect';
import { FormDatePicker } from '@/components/forms/FormDatePicker/FormDatePicker';
import { Table, type Column } from '@components/ui/Table/Table';
import type { ColumnType, FilterOp } from '@models/builders.models';
import {
  ALLOWED_FILTER_OPS_NUMERIC,
  ALLOWED_FILTER_OPS_STRING,
  ALLOWED_FILTER_OPS_DATE,
  ALLOWED_FILTER_OPS,
  FILTER_OP_LABELS,
} from '@models/builders.models';
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
  [key: string]: unknown; // index signature for Table<T extends Record<string, unknown>>
}

interface IndicatorFilterBuilderProps {
  columns: SidebarColumn[];
  filters: IndicatorFilter[];
  onFiltersChange: (filters: IndicatorFilter[]) => void;
}

// ============================================================================
// CONTRADICTION RULES
// ============================================================================

const CONTRADICTORY_PAIRS: [FilterOp, FilterOp][] = [
  ['is_null', 'is_not_null'],
  ['like', 'not_like'],
  ['in', 'not_in'],
];

const VALUE_OPS: FilterOp[] = ['=', '!=', '>', '>=', '<', '<=', 'in', 'not_in', 'between', 'like', 'not_like'];

function getFilterWarnings(filter: IndicatorFilter, allFilters: IndicatorFilter[]): string[] {
  const siblings = allFilters.filter(
    (f) => f.id !== filter.id && f.columnName === filter.columnName
  );
  if (siblings.length === 0) return [];

  const warnings: string[] = [];

  for (const sibling of siblings) {
    for (const [a, b] of CONTRADICTORY_PAIRS) {
      if (
        (filter.op === a && sibling.op === b) ||
        (filter.op === b && sibling.op === a)
      ) {
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

    if (filter.op === '=' && sibling.op === '=') {
      const v1 = String(filter.value ?? '');
      const v2 = String(sibling.value ?? '');
      if (v1 && v2 && v1 !== v2) {
        warnings.push(`Contradiction : deux "Égal à" avec des valeurs différentes ("${v1}" et "${v2}")`);
      }
    }

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
    for (const [a, b] of CONTRADICTORY_PAIRS) {
      if (op === a && siblingOps.has(b)) return false;
      if (op === b && siblingOps.has(a)) return false;
    }
    if (op === 'is_null' && siblings.some((s) => VALUE_OPS.includes(s.op))) return false;
    if (VALUE_OPS.includes(op) && siblingOps.has('is_null')) return false;
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

  if (op === 'is_null' || op === 'is_not_null') {
    return <span className={styles.noValue}>—</span>;
  }

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

  if (columnType === 'date') {
    return (
      <FormDatePicker
        value={(value as string) || ''}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

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

  const columnOptions = useMemo(
    () => columns.map((col) => ({ value: col.name, label: `${col.name} (${col.type})` })),
    [columns]
  );

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

  // Table columns definition
  const tableColumns = useMemo((): Column<IndicatorFilter>[] => [
    {
      key: 'columnName',
      header: 'Colonne',
      width: 160,
      sortable: false,
      searchable: false,
      render: (item) => (
        <div className={styles.cellColumn}>
          <span className={styles.columnName}>{item.columnName}</span>
          <span className={styles.columnType}>{item.columnType}</span>
        </div>
      ),
    },
    {
      key: 'op',
      header: 'Opérateur',
      width: 200,
      sortable: false,
      searchable: false,
      render: (item) => {
        const availableOps = getAvailableOps(
          item.columnName,
          item.columnType,
          filters,
          item.id
        );
        const opsForSelect = availableOps.includes(item.op)
          ? availableOps
          : [item.op, ...availableOps];
        const opOptions = opsForSelect.map((op) => ({
          value: op,
          label: FILTER_OP_LABELS[op],
        }));
        return (
          <FormSelect
            value={item.op}
            onChange={(value) => handleUpdateOp(item.id, value as FilterOp)}
            options={opOptions}
          />
        );
      },
    },
    {
      key: 'value',
      header: 'Valeur',
      sortable: false,
      searchable: false,
      render: (item) => (
        <ValueInput
          filter={item}
          onChange={(value) => handleUpdateValue(item.id, value)}
        />
      ),
    },
    {
      key: 'actions',
      header: '',
      width: 72,
      align: 'center',
      sortable: false,
      searchable: false,
      render: (item) => {
        const filterWarnings = warningsMap.get(item.id);
        return (
          <div className={styles.cellActions}>
            {filterWarnings && (
              <span className={styles.warningIcon} title={filterWarnings.join('\n')}>
                <WarningIcon3D size={14} color="warning" className={icon3dStyles.pulse} />
              </span>
            )}
            <button
              type="button"
              onClick={() => handleRemoveFilter(item.id)}
              aria-label="Supprimer le filtre"
            >
              <DeleteIcon3D size={14} color="danger" className={icon3dStyles.clickable} />
            </button>
          </div>
        );
      },
    },
  ], [filters, warningsMap, handleUpdateOp, handleUpdateValue, handleRemoveFilter]);

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
          <AddIcon3D size={14} color="success" className={icon3dStyles.inline} />
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
            placeholder="yyyyyyyyyyyyyyyChoisir une colonne..."
            options={columnOptions}
            searchable
          />
          <button
            type="button"
            className={styles.btnCancel}
            onClick={() => setShowFilterPicker(false)}
          >
            <ErrorIcon3D size={14} color="danger" className={icon3dStyles.clickable} />
          </button>
        </div>
      )}

      {hasWarnings && (
        <div className={styles.globalWarning}>
          <WarningIcon3D size={14} color="warning" className={icon3dStyles.inline} />
          <span>Certains filtres sont contradictoires et ne retourneront aucun résultat.</span>
        </div>
      )}

      {filters.length > 0 && (
        <Table<IndicatorFilter>
          data={filters}
          columns={tableColumns}
          keyExtractor={(item) => item.id}
          emptyMessage="Aucun filtre défini"
          features={{ animate: true, scrollable: true }}
          scrollable
          maxHeight="300px"
          className={styles.filterTable}
        />
      )}

      {filters.length === 0 && !showFilterPicker && (
        <div className={styles.emptyFilters}>Aucun filtre défini</div>
      )}
    </div>
  );
};
