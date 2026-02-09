import React from 'react';
import { GripVertical, X } from 'lucide-react';

import styles from './LayoutDropZone.module.css';
import type { LayoutDropZoneProps } from './types';

export const LayoutDropZone: React.FC<LayoutDropZoneProps> = ({
  title,
  items,
  allItems,
  onRemove,
  placeholder = 'Glissez des éléments ici',
}) => {
  const getItemName = (id: string) => {
    const item = allItems.find((candidate) => candidate.id === id);
    return item?.name || id;
  };

  return (
    <div className={styles.layoutZone}>
      <div className={styles.layoutZoneHeader}>{title}</div>
      <div className={styles.layoutZoneContent}>
        {items.length === 0 ? (
          <div className={styles.layoutPlaceholder}>{placeholder}</div>
        ) : (
          items.map((itemId) => (
            <div key={itemId} className={styles.layoutItem}>
              <GripVertical size={14} />
              <span>{getItemName(itemId)}</span>
              <button type="button" onClick={() => onRemove(itemId)} className={styles.removeItemBtn}>
                <X size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
