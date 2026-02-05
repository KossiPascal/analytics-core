import { Eye, EyeOff, Columns } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import type { Column } from '../../Table';
import styles from './ColumnVisibilityToggle.module.css';

interface ColumnVisibilityToggleProps<T> {
  columns: Column<T>[];
  visibleColumns: string[];
  onVisibilityChange: (columnKeys: string[]) => void;
  className?: string;
}

export const ColumnVisibilityToggle = <T extends Record<string, unknown>>({
  columns,
  visibleColumns,
  onVisibilityChange,
  className,
}: ColumnVisibilityToggleProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleColumn = (key: string) => {
    if (visibleColumns.includes(key)) {
      // Don't allow hiding the last column
      if (visibleColumns.length === 1) return;
      onVisibilityChange(visibleColumns.filter((k) => k !== key));
    } else {
      onVisibilityChange([...visibleColumns, key]);
    }
  };

  const toggleAll = () => {
    if (visibleColumns.length === columns.length) {
      // Hide all except first
      onVisibilityChange([columns[0].key]);
    } else {
      // Show all
      onVisibilityChange(columns.map((col) => col.key));
    }
  };

  const allVisible = visibleColumns.length === columns.length;
  const visibleCount = visibleColumns.length;
  const totalCount = columns.length;

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <button
        className={styles.toggleButton}
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        aria-label="Toggle column visibility"
      >
        <Columns size={18} />
        <span>Colonnes ({visibleCount}/{totalCount})</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className={styles.backdrop}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              className={styles.dropdown}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className={styles.header}>
                <h4 className={styles.title}>Visibilité des colonnes</h4>
                <button
                  className={styles.toggleAllButton}
                  onClick={toggleAll}
                  type="button"
                >
                  {allVisible ? (
                    <>
                      <EyeOff size={14} />
                      <span>Tout masquer</span>
                    </>
                  ) : (
                    <>
                      <Eye size={14} />
                      <span>Tout afficher</span>
                    </>
                  )}
                </button>
              </div>

              <div className={styles.columnList}>
                {columns.map((column) => {
                  const isVisible = visibleColumns.includes(column.key);
                  const isLastVisible = visibleColumns.length === 1 && isVisible;

                  return (
                    <label
                      key={column.key}
                      className={`${styles.columnItem} ${isLastVisible ? styles.disabled : ''}`}
                      title={isLastVisible ? 'Au moins une colonne doit être visible' : ''}
                    >
                      <input
                        type="checkbox"
                        checked={isVisible}
                        onChange={() => toggleColumn(column.key)}
                        disabled={isLastVisible}
                        className={styles.checkbox}
                      />
                      <span className={styles.columnIcon}>
                        {isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                      </span>
                      <span className={styles.columnLabel}>
                        {typeof column.header === 'string' ? column.header : column.key}
                      </span>
                    </label>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
