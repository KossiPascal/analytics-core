import React, { useMemo, useCallback } from 'react';
import { FormInput } from '@/components/forms/FormInput/FormInput';
import { FormSelect } from '@/components/forms/FormSelect/FormSelect';
import { FormDatePicker } from '@/components/forms/FormDatePicker/FormDatePicker';
import type { ColumnType, FilterOp } from '../../../builders.models';
import {
  ALLOWED_FILTER_OPS_NUMERIC,
  ALLOWED_FILTER_OPS_DATE,
  FILTER_OP_LABELS,
} from '../../../builders.models';
import type { SidebarColumn } from './IndicatorBuilder';
import styles from './IndicatorPeriodBuilder.module.css';

// ============================================================================
// TYPES
// ============================================================================

export type PeriodGranularity =
  | 'yearly'
  | 'semi_annual'
  | 'quarterly'
  | 'monthly'
  | 'weekly'
  | 'daily';

export interface IndicatorPeriodConfig {
  columnName: string;
  columnType: ColumnType;
  granularity: PeriodGranularity;
  op: FilterOp;
  value: unknown;
}

interface IndicatorPeriodBuilderProps {
  columns: SidebarColumn[];
  config: IndicatorPeriodConfig | null;
  onConfigChange: (config: IndicatorPeriodConfig | null) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const GRANULARITY_OPTIONS: { value: PeriodGranularity; label: string }[] = [
  { value: 'yearly', label: 'Annuel' },
  { value: 'semi_annual', label: 'Semestriel' },
  { value: 'quarterly', label: 'Trimestriel' },
  { value: 'monthly', label: 'Mensuel' },
  { value: 'weekly', label: 'Hebdomadaire' },
  { value: 'daily', label: 'Journalier' },
];

// ============================================================================
// HELPERS
// ============================================================================

const getOpsForType = (type: ColumnType): FilterOp[] => {
  if (type === 'date') return ALLOWED_FILTER_OPS_DATE;
  if (type === 'number') return ALLOWED_FILTER_OPS_NUMERIC;
  return ALLOWED_FILTER_OPS_DATE;
};

const getDefaultValue = (op: FilterOp): unknown => {
  if (op === 'is_null' || op === 'is_not_null') return null;
  if (op === 'between') return ['', ''];
  if (op === 'in') return [];
  return '';
};

// ============================================================================
// VALUE INPUT
// ============================================================================

interface ValueInputProps {
  columnType: ColumnType;
  op: FilterOp;
  value: unknown;
  onChange: (value: unknown) => void;
}

const PeriodValueInput: React.FC<ValueInputProps> = ({ columnType, op, value, onChange }) => {
  // 0 args
  if (op === 'is_null' || op === 'is_not_null') {
    return <span className={styles.noValue}>—</span>;
  }

  // N args (in)
  if (op === 'in') {
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
            type="number"
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
            type="number"
            placeholder="Fin"
            value={end || ''}
            onChange={(e) => onChange([start, e.target.value])}
          />
        )}
      </div>
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

  // 1 arg — number
  return (
    <FormInput
      type="number"
      placeholder="Valeur"
      value={(value as string) || ''}
      onChange={(e) => onChange(e.target.value)}
    />
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const IndicatorPeriodBuilder: React.FC<IndicatorPeriodBuilderProps> = ({
  columns,
  config,
  onConfigChange,
}) => {
  // Only date and number columns
  const eligibleColumns = useMemo(
    () => columns.filter((col) => col.type === 'date' || col.type === 'number'),
    [columns]
  );

  const columnOptions = useMemo(
    () => eligibleColumns.map((col) => ({ value: col.name, label: `${col.name} (${col.type})` })),
    [eligibleColumns]
  );

  const opOptions = useMemo(() => {
    if (!config) return [];
    return getOpsForType(config.columnType).map((op) => ({
      value: op,
      label: FILTER_OP_LABELS[op],
    }));
  }, [config]);

  const handleColumnChange = useCallback(
    (columnName: string) => {
      const col = eligibleColumns.find((c) => c.name === columnName);
      if (!col) return;
      const ops = getOpsForType(col.type);
      const defaultOp = ops[0];
      onConfigChange({
        columnName: col.name,
        columnType: col.type,
        granularity: config?.granularity ?? 'monthly',
        op: defaultOp,
        value: getDefaultValue(defaultOp),
      });
    },
    [eligibleColumns, config, onConfigChange]
  );

  const handleGranularityChange = useCallback(
    (granularity: string) => {
      if (!config) return;
      onConfigChange({ ...config, granularity: granularity as PeriodGranularity });
    },
    [config, onConfigChange]
  );

  const handleOpChange = useCallback(
    (op: string) => {
      if (!config) return;
      onConfigChange({ ...config, op: op as FilterOp, value: getDefaultValue(op as FilterOp) });
    },
    [config, onConfigChange]
  );

  const handleValueChange = useCallback(
    (value: unknown) => {
      if (!config) return;
      onConfigChange({ ...config, value });
    },
    [config, onConfigChange]
  );

  const handleClear = useCallback(() => {
    onConfigChange(null);
  }, [onConfigChange]);

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.cardTitle}>Période</span>
        {config && (
          <button type="button" className={styles.clearBtn} onClick={handleClear}>
            Réinitialiser
          </button>
        )}
      </div>

      {eligibleColumns.length === 0 ? (
        <div className={styles.emptyState}>
          Aucune colonne de type date ou entier disponible.
        </div>
      ) : (
        <div className={styles.formGrid}>
          {/* Row 1: Column + Granularity */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Colonne</label>
            <FormSelect
              value={config?.columnName ?? ''}
              onChange={handleColumnChange}
              options={columnOptions}
              placeholder="Sélectionner une colonne..."
              searchable
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Granularité</label>
            <FormSelect
              value={config?.granularity ?? ''}
              onChange={handleGranularityChange}
              options={GRANULARITY_OPTIONS}
              placeholder="Sélectionner..."
              disabled={!config}
            />
          </div>

          {/* Row 2: Operator + Value */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Opérateur</label>
            <FormSelect
              value={config?.op ?? ''}
              onChange={handleOpChange}
              options={opOptions}
              placeholder="Sélectionner..."
              disabled={!config}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Valeur</label>
            {config ? (
              <PeriodValueInput
                columnType={config.columnType}
                op={config.op}
                value={config.value}
                onChange={handleValueChange}
              />
            ) : (
              <span className={styles.noValue}>—</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
