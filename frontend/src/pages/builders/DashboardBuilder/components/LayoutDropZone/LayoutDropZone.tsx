import React, { useState } from 'react';
import { GripVertical, X } from 'lucide-react';

import styles from './LayoutDropZone.module.css';
import type { LayoutDropZoneProps, LayoutZone } from '../types';

const DRAG_KEY = 'layout-dnd';

export const LayoutDropZone: React.FC<LayoutDropZoneProps> = ({
  zone,
  title,
  items,
  allItems,
  onRemove,
  onMoveItem,
  placeholder = 'Glissez des éléments ici',
  children,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const getItemName = (id: string) => {
    const item = allItems.find((candidate) => candidate.id === id);
    return item?.name || id;
  };

  // ── Drag handlers (source) ────────────────────────────

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData(DRAG_KEY, JSON.stringify({ itemId, fromZone: zone }));
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove(styles.dragging);
  };

  // ── Drop handlers (target zone) ───────────────────────

  const handleDragOver = (e: React.DragEvent) => {
    // Only accept drops from our own DnD key
    if (e.dataTransfer.types.includes(DRAG_KEY)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only reset when leaving the zone itself, not a child
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const raw = e.dataTransfer.getData(DRAG_KEY);
    if (!raw) return;

    const { itemId, fromZone } = JSON.parse(raw) as { itemId: string; fromZone: LayoutZone };

    // Don't move to same zone
    if (fromZone === zone) return;

    // Don't add duplicate
    if (items.includes(itemId)) return;

    onMoveItem(itemId, fromZone, zone);
  };

  return (
    <div
      className={`${styles.layoutZone} ${isDragOver ? styles.layoutZoneDragOver : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className={styles.layoutZoneHeader}>{title}</div>
      <div className={styles.layoutZoneContent}>
        {items.length === 0 && !children ? (
          <div className={styles.layoutPlaceholder}>{placeholder}</div>
        ) : (
          <>
            {items.map((itemId) => (
              <div
                key={itemId}
                className={styles.layoutItem}
                draggable
                onDragStart={(e) => handleDragStart(e, itemId)}
                onDragEnd={handleDragEnd}
              >
                <GripVertical size={14} />
                <span>{getItemName(itemId)}</span>
                <button type="button" onClick={() => onRemove(itemId)} className={styles.removeItemBtn}>
                  <X size={14} />
                </button>
              </div>
            ))}
            {children}
          </>
        )}
      </div>
    </div>
  );
};
