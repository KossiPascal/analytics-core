/**
 * CollapsibleSection Component
 * Section collapsible animée pour le Query Builder
 */

import React, { useState } from 'react';
import styles from '../styles/QueryBuilder.module.css';

// ============================================================================
// TYPES
// ============================================================================

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  iconClassName?: string;
  badge?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  iconClassName = '',
  badge,
  defaultOpen = true,
  children,
  actions,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={styles.section}>
      {/* Header */}
      <div
        className={`${styles.sectionHeader} ${isOpen ? styles.sectionHeaderOpen : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        aria-expanded={isOpen}
      >
        <div className={styles.sectionTitle}>
          <div className={`${styles.sectionIcon} ${iconClassName}`}>
            {icon}
          </div>
          <span className={styles.sectionName}>{title}</span>
          {badge !== undefined && badge > 0 && (
            <span className={styles.sectionBadge}>{badge}</span>
          )}
        </div>
        <div className={styles.sectionActions}>
          {actions && (
            <div onClick={(e) => e.stopPropagation()}>
              {actions}
            </div>
          )}
          <svg
            className={`${styles.sectionChevron} ${isOpen ? styles.sectionChevronOpen : ''}`}
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M4 6L8 10L12 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Content */}
      <div className={`${styles.sectionContent} ${!isOpen ? styles.sectionContentHidden : ''}`}>
        {children}
      </div>
    </div>
  );
};

export default CollapsibleSection;
