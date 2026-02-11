import React, { useMemo, useState, useCallback } from 'react';
import { X } from 'lucide-react';
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
import styles from './IndicatorBuilder.module.css';

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
    return null;
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
      <div className={styles.filterControls}>
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
        <span className={styles.filterSeparator}>et</span>
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

  // 1 arg — boolean special case
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

  const availableColumns = useMemo(() => {
    const usedNames = new Set(filters.map((f) => f.columnName));
    return columns.filter((col) => !usedNames.has(col.name));
  }, [columns, filters]);

  const columnOptions = useMemo(
    () => availableColumns.map((col) => ({ value: col.name, label: `${col.name} (${col.type})` })),
    [availableColumns]
  );

  const handleAddFilter = useCallback(
    (columnName: string) => {
      const col = columns.find((c) => c.name === columnName);
      if (!col) return;
      const ops = getOpsForType(col.type);
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
        <span className={styles.cardTitle}>Filtres</span>
        <button
          type="button"
          className={styles.addFilterBtn}
          onClick={() => setShowFilterPicker(true)}
          disabled={availableColumns.length === 0}
        >
          + Ajouter filtre
        </button>
      </div>

      {showFilterPicker && (
        <div className={styles.filterPickerRow}>
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
            Annuler
          </button>
        </div>
      )}

      {filters.length > 0 && (
        <div className={styles.filtersList}>
          {filters.map((filter) => {
            const ops = getOpsForType(filter.columnType);
            const opOptions = ops.map((op) => ({ value: op, label: FILTER_OP_LABELS[op] }));

            return (
              <div key={filter.id} className={styles.filterRow}>
                <span className={styles.filterColumnLabel}>{filter.columnName}</span>
                <FormSelect
                  value={filter.op}
                  onChange={(value) => handleUpdateOp(filter.id, value as FilterOp)}
                  options={opOptions}
                />
                <div className={styles.filterValueArea}>
                  <ValueInput
                    filter={filter}
                    onChange={(value) => handleUpdateValue(filter.id, value)}
                  />
                </div>
                <button
                  type="button"
                  className={styles.filterRemove}
                  onClick={() => handleRemoveFilter(filter.id)}
                  aria-label="Supprimer le filtre"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {filters.length === 0 && !showFilterPicker && (
        <div className={styles.emptyFilters}>Aucun filtre défini</div>
      )}
    </div>
  );
};
