/**
 * FilterBuilder Component
 * Constructeur de filtres avec opérateurs et valeurs
 */
import React from 'react';
import {
  FilterField, FilterOp, LogicalOperator, DimensionDef, MetricDef, ColumnType,
  FILTER_OP_LABELS, ALLOWED_FILTER_OPS_NUMERIC, ALLOWED_FILTER_OPS_STRING, ALLOWED_FILTER_OPS_DATE, ALLOWED_FILTER_OPS,
} from '../models';
import styles from '@pages/query-builder/SqlBuilder/SqlBuilder.module.css';

// ============================================================================
// TYPES
// ============================================================================

interface FilterBuilderProps {
  filters: FilterField[];
  availableFields: (DimensionDef | MetricDef)[];
  onAdd: (field: string) => void;
  onUpdate: (id: string, updates: Partial<FilterField>) => void;
  onRemove: (id: string) => void;
  title?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

const getOpsForType = (type: ColumnType | 'number'): FilterOp[] => {
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

// ============================================================================
// VALUE INPUT COMPONENT
// ============================================================================

interface ValueInputProps {
  filter: FilterField;
  fieldType: ColumnType | 'number';
  onChange: (value: unknown) => void;
}

const ValueInput: React.FC<ValueInputProps> = ({ filter, fieldType, onChange }) => {
  // No value needed for null checks
  if (filter.op === 'is_null' || filter.op === 'is_not_null') {
    return null;
  }

  // IN / NOT IN - comma separated values
  if (filter.op === 'in' || filter.op === 'not_in') {
    return (
      <input
        type="text"
        className={styles.filterInput}
        placeholder="Valeurs séparées par des virgules"
        value={Array.isArray(filter.value) ? filter.value.join(', ') : ''}
        onChange={(e) => {
          const values = e.target.value.split(',').map((v) => v.trim()).filter(Boolean);
          onChange(values);
        }}
      />
    );
  }

  // BETWEEN - two values
  if (filter.op === 'between') {
    const [start, end] = Array.isArray(filter.value) ? filter.value : ['', ''];
    return (
      <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
        <input
          type={fieldType === 'date' ? 'date' : fieldType === 'number' ? 'number' : 'text'}
          className={styles.filterInput}
          placeholder="Début"
          value={start || ''}
          onChange={(e) => onChange([e.target.value, end])}
          style={{ flex: 1 }}
        />
        <span style={{ alignSelf: 'center', color: 'var(--qb-text-muted)' }}>et</span>
        <input
          type={fieldType === 'date' ? 'date' : fieldType === 'number' ? 'number' : 'text'}
          className={styles.filterInput}
          placeholder="Fin"
          value={end || ''}
          onChange={(e) => onChange([start, e.target.value])}
          style={{ flex: 1 }}
        />
      </div>
    );
  }

  // Default single value input
  return (
    <input
      type={fieldType === 'date' ? 'date' : fieldType === 'number' ? 'number' : 'text'}
      className={styles.filterInput}
      placeholder="Valeur"
      value={(filter.value as string) || ''}
      onChange={(e) => onChange(e.target.value)}
    />
  );
};

// ============================================================================
// FILTER ITEM COMPONENT
// ============================================================================

interface FilterItemProps {
  filter: FilterField;
  index: number;
  availableFields: (DimensionDef | MetricDef)[];
  onUpdate: (updates: Partial<FilterField>) => void;
  onRemove: () => void;
}

const FilterItem: React.FC<FilterItemProps> = ({
  filter,
  index,
  availableFields,
  onUpdate,
  onRemove,
}) => {
  const selectedField = availableFields.find((f) => f.id === filter.field);
  const fieldType: ColumnType | 'number' = selectedField
    ? 'type' in selectedField
      ? (selectedField as DimensionDef).type
      : 'number'
    : 'string';

  const availableOps = getOpsForType(fieldType);

  const toggleLogicalOp = () => {
    onUpdate({
      logicalOp: filter.logicalOp === 'AND' ? 'OR' : 'AND',
    });
  };

  return (
    <div className={styles.filterItem}>
      {/* Logical operator (AND/OR) for non-first filters */}
      {index > 0 && (
        <button
          type="button"
          className={styles.filterLogical}
          onClick={toggleLogicalOp}
          title="Cliquez pour changer"
        >
          {filter.logicalOp || 'AND'}
        </button>
      )}

      {/* Filter content */}
      <div className={styles.filterField}>
        {/* Field selector */}
        <select
          className={styles.filterSelect}
          value={filter.field}
          onChange={(e) => onUpdate({ field: e.target.value, value: '' })}
        >
          <option value="">Sélectionner un champ</option>
          {availableFields.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>

        {/* Operator selector */}
        <select
          className={styles.filterSelect}
          value={filter.op}
          onChange={(e) => onUpdate({ op: e.target.value as FilterOp, value: '' })}
        >
          {availableOps.map((op) => (
            <option key={op} value={op}>
              {FILTER_OP_LABELS[op]}
            </option>
          ))}
        </select>

        {/* Value input */}
        <ValueInput
          filter={filter}
          fieldType={fieldType}
          onChange={(value) => onUpdate({ value })}
        />
      </div>

      {/* Remove button */}
      <button
        type="button"
        className={styles.filterRemove}
        onClick={onRemove}
        aria-label="Supprimer le filtre"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const FilterBuilder: React.FC<FilterBuilderProps> = ({
  filters,
  availableFields,
  onAdd,
  onUpdate,
  onRemove,
  title = 'Filtres',
}) => {
  const [showFieldPicker, setShowFieldPicker] = React.useState(false);

  const handleAddFilter = (fieldId: string) => {
    onAdd(fieldId);
    setShowFieldPicker(false);
  };

  return (
    <div>
      {/* Filter list */}
      {filters.length > 0 && (
        <div className={styles.filterList}>
          {filters.map((filter, index) => (
            <FilterItem
              key={filter.id}
              filter={filter}
              index={index}
              availableFields={availableFields}
              onUpdate={(updates) => onUpdate(filter.id, updates)}
              onRemove={() => onRemove(filter.id)}
            />
          ))}
        </div>
      )}

      {/* Add filter button */}
      <div style={{ marginTop: filters.length > 0 ? '12px' : 0 }}>
        {showFieldPicker ? (
          <div
            style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              padding: '8px',
              background: 'var(--qb-bg)',
              borderRadius: 'var(--qb-radius)',
            }}
          >
            <select
              className={styles.filterSelect}
              autoFocus
              onChange={(e) => {
                if (e.target.value) {
                  handleAddFilter(e.target.value);
                }
              }}
              style={{ flex: 1 }}
            >
              <option value="">Choisir un champ...</option>
              {availableFields.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnSmall} ${styles.btnSecondary}`}
              onClick={() => setShowFieldPicker(false)}
            >
              Annuler
            </button>
          </div>
        ) : (
          <button
            type="button"
            className={styles.addButton}
            onClick={() => setShowFieldPicker(true)}
          >
            <span className={styles.addButtonIcon}>+</span>
            Ajouter un filtre
          </button>
        )}
      </div>

      {/* Empty state */}
      {filters.length === 0 && !showFieldPicker && (
        <div className={styles.emptyState} style={{ padding: '20px' }}>
          <div className={styles.emptyStateIcon} style={{ width: '48px', height: '48px', fontSize: '1.5rem' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
          </div>
          <div className={styles.emptyStateText}>Aucun filtre défini</div>
        </div>
      )}
    </div>
  );
};

export default FilterBuilder;
