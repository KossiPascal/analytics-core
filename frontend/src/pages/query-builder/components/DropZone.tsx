/**
 * DropZone Component
 * Zone de dépôt pour le drag and drop
 */

import React, { useState, useCallback } from 'react';
import styles from '@pages/query-builder/QueryBuilder.module.css';
// 
// ============================================================================
// TYPES
// ============================================================================

interface DropZoneProps {
  onDrop: (data: { type: string; field: string; label: string }) => void;
  acceptTypes?: string[];
  children?: React.ReactNode;
  emptyText?: string;
  emptyHint?: string;
  emptyIcon?: React.ReactNode;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const DropZone: React.FC<DropZoneProps> = ({
  onDrop,
  acceptTypes = ['dimension', 'metric'],
  children,
  emptyText = 'Glissez des champs ici',
  emptyHint = 'ou cliquez sur un champ pour l\'ajouter',
  emptyIcon,
  className = '',
}) => {
  const [isOver, setIsOver] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if we're leaving the drop zone (not entering a child)
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsOver(false);
      setIsDragActive(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOver(true);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOver(false);
    setIsDragActive(false);

    try {
      const jsonData = e.dataTransfer.getData('application/json');
      if (!jsonData) return;

      const data = JSON.parse(jsonData);

      if (acceptTypes.includes(data.type)) {
        onDrop(data);
      }
    } catch (error) {
      console.error('Failed to parse drop data:', error);
    }
  }, [onDrop, acceptTypes]);

  const isEmpty = !children || (React.Children.count(children) === 0);

  const dropZoneClasses = [
    styles.dropZone,
    isDragActive && styles.dropZoneActive,
    isOver && styles.dropZoneHover,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={dropZoneClasses}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {isEmpty ? (
        <>
          <div className={styles.dropZoneIcon}>
            {emptyIcon || (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            )}
          </div>
          <div className={styles.dropZoneText}>{emptyText}</div>
          <div className={styles.dropZoneHint}>{emptyHint}</div>
        </>
      ) : (
        <div className={styles.selectedFields}>
          {children}
        </div>
      )}
    </div>
  );
};

export default DropZone;
