/**
 * SelectedField Component
 * Affiche un champ sélectionné avec options d'agrégation
 */

import React, { useState } from 'react';
import { RemoveIcon } from '@/components/ui/icons';
import type { SelectField } from '../models';
import { AGG_LABELS } from '../models';
import styles from '@pages/queries/SqlBuilder/SqlBuilder.module.css';

// ============================================================================
// TYPES
// ============================================================================

interface SelectedFieldProps {
  field: SelectField;
  index: number;
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
  onRemove,
  onDragStart,
  onDragEnd,
  onDragOver,
}) => {
  const [isDragging, setIsDragging] = useState(false);

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

      {/* Aggregation badge (read-only) */}
      {field.isMetric && (
        <span className={styles.selectedFieldAgg}>
          {field.agg ? AGG_LABELS[field.agg] : 'SUM'}
        </span>
      )}

      {/* Remove button */}
      <span
        
        onClick={onRemove}
        aria-label="Supprimer"
      >
        <RemoveIcon size={14} variant="cross" />
      </span>
    </div>
  );
};

export default SelectedField;
