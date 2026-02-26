/**
 * DraggableField Component
 * Champ draggable pour le Query Builder
 */

import React, { useRef } from 'react';
import styles from '@pages/builders/SqlBuilder/SqlBuilder.module.css';
import { ColumnType, DimensionDef, MetricDef } from '../../../../models/builders.models';

// ============================================================================
// TYPES
// ============================================================================

interface DraggableFieldProps {
  field: DimensionDef | MetricDef;
  type: 'dimension' | 'metric';
  onDragStart?: (field: DimensionDef | MetricDef, type: 'dimension' | 'metric') => void;
  onDragEnd?: () => void;
  onClick?: (field: DimensionDef | MetricDef, type: 'dimension' | 'metric') => void;
}

// ============================================================================
// ICON HELPER
// ============================================================================

const getTypeIcon = (type: ColumnType | 'number'): { icon: string; className: string } => {
  switch (type) {
    case 'string':
      return { icon: 'Aa', className: styles.fieldItemIconString };
    case 'number':
      return { icon: '#', className: styles.fieldItemIconNumber };
    case 'date':
      return { icon: '📅', className: styles.fieldItemIconDate };
    case 'boolean':
      return { icon: '✓', className: styles.fieldItemIconBoolean };
    default:
      return { icon: '?', className: styles.fieldItemIconString };
  }
};

// ============================================================================
// COMPONENT
// ============================================================================

export const DraggableField: React.FC<DraggableFieldProps> = ({
  field,
  type,
  onDragStart,
  onDragEnd,
  onClick,
}) => {
  const dragRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const fieldType = type === 'metric' ? 'number' : (field as DimensionDef).type;
  const { icon, className: iconClassName } = getTypeIcon(fieldType);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData('application/json', JSON.stringify({
      type,
      field: field.id,
      label: field.label,
    }));
    e.dataTransfer.effectAllowed = 'copy';
    onDragStart?.(field, type);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    onDragEnd?.();
  };

  const handleClick = () => {
    onClick?.(field, type);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.(field, type);
    }
  };

  return (
    <div
      ref={dragRef}
      className={`${styles.fieldItem} ${isDragging ? styles.fieldItemDragging : ''}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`${field.label} - ${type}`}
    >
      <div className={`${styles.fieldItemIcon} ${iconClassName}`}>
        {icon}
      </div>
      <div className={styles.fieldItemInfo}>
        <div className={styles.fieldItemName}>{field.label}</div>
        <div className={styles.fieldItemTable}>{field.table}</div>
      </div>
      <div className={styles.fieldItemDragHandle}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <circle cx="3" cy="2" r="1" />
          <circle cx="3" cy="6" r="1" />
          <circle cx="3" cy="10" r="1" />
          <circle cx="9" cy="2" r="1" />
          <circle cx="9" cy="6" r="1" />
          <circle cx="9" cy="10" r="1" />
        </svg>
      </div>
    </div>
  );
};

export default DraggableField;
