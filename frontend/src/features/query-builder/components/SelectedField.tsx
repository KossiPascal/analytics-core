/**
 * SelectedField Component
 * Affiche un champ sélectionné avec options d'agrégation
 */

import React, { useState, useRef } from 'react';
import type { SelectField, AggType } from '../types';
import { ALLOWED_AGGS, AGG_LABELS } from '../types';
import styles from '../styles/QueryBuilder.module.css';

// ============================================================================
// TYPES
// ============================================================================

interface SelectedFieldProps {
  field: SelectField;
  index: number;
  onUpdate: (updates: Partial<SelectField>) => void;
  onRemove: () => void;
  onDragStart?: (index: number) => void;
  onDragEnd?: () => void;
  onDragOver?: (index: number) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const SelectedField: React.FC<SelectedFieldProps> = ({
  field,
  index,
  onUpdate,
  onRemove,
  onDragStart,
  onDragEnd,
  onDragOver,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showAggMenu, setShowAggMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
    onDragStart?.(index);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    onDragEnd?.();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    onDragOver?.(index);
  };

  const handleAggChange = (agg: AggType | undefined) => {
    onUpdate({ agg });
    setShowAggMenu(false);
  };

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowAggMenu(false);
      }
    };

    if (showAggMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAggMenu]);

  return (
    <div
      className={`${styles.selectedField} ${isDragging ? styles.selectedFieldDragging : ''}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
      {/* Type icon */}
      <div className={`${styles.selectedFieldIcon} ${field.isMetric ? styles.fieldItemIconNumber : styles.fieldItemIconString}`}>
        {field.isMetric ? '#' : 'Aa'}
      </div>

      {/* Field name */}
      <span className={styles.selectedFieldName} title={field.label}>
        {field.label}
      </span>

      {/* Aggregation badge (click to change) */}
      {field.isMetric && (
        <div className={styles.tooltip} ref={menuRef}>
          <button
            type="button"
            className={styles.selectedFieldAgg}
            onClick={() => setShowAggMenu(!showAggMenu)}
          >
            {field.agg ? AGG_LABELS[field.agg] : 'SUM'}
          </button>
          {showAggMenu && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '4px',
                background: 'white',
                border: '1px solid var(--qb-border)',
                borderRadius: 'var(--qb-radius)',
                boxShadow: 'var(--qb-shadow-lg)',
                zIndex: 100,
                minWidth: '120px',
              }}
            >
              {ALLOWED_AGGS.map((agg) => (
                <button
                  key={agg}
                  type="button"
                  onClick={() => handleAggChange(agg)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px 12px',
                    border: 'none',
                    background: field.agg === agg ? 'var(--qb-bg-hover)' : 'transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '0.8125rem',
                  }}
                >
                  {AGG_LABELS[agg]}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Remove button */}
      <button
        type="button"
        className={styles.selectedFieldRemove}
        onClick={onRemove}
        aria-label="Supprimer"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <path d="M9.5 2.5L2.5 9.5M2.5 2.5L9.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
};

export default SelectedField;
