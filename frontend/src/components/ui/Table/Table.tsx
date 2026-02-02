import { type ReactNode, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { cn } from '@utils/cn';
import { listItemVariants, staggerContainerVariants } from '@animations/index';
import styles from './Table.module.css';

export interface Column<T> {
  key: string;
  header: ReactNode;
  render?: (item: T, index: number) => ReactNode;
  sortable?: boolean;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
}

export interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T, index: number) => string | number;
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T, index: number) => void;
  isRowClickable?: boolean;
  selectedRowKey?: string | number | null;
  className?: string;
  stickyHeader?: boolean;
}

export function Table<T extends Record<string, unknown>>({
  data,
  columns,
  keyExtractor,
  isLoading = false,
  emptyMessage = 'Aucune donnée disponible',
  onRowClick,
  isRowClickable = false,
  selectedRowKey,
  className,
  stickyHeader = false,
}: TableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig?.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  const getSortIcon = (key: string) => {
    if (sortConfig?.key !== key) {
      return <ChevronsUpDown size={14} />;
    }
    return sortConfig.direction === 'asc' ? (
      <ChevronUp size={14} />
    ) : (
      <ChevronDown size={14} />
    );
  };

  return (
    <div className={cn(styles.wrapper, className)}>
      <table className={styles.table}>
        <thead className={cn(styles.thead, stickyHeader && styles.stickyHeader)}>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  styles.th,
                  column.sortable && styles.sortable,
                  styles[`align-${column.align || 'left'}`]
                )}
                style={{ width: column.width }}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <span className={styles.thContent}>
                  {column.header}
                  {column.sortable && (
                    <span className={styles.sortIcon}>{getSortIcon(column.key)}</span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>

        <motion.tbody
          className={styles.tbody}
          variants={staggerContainerVariants}
          initial="initial"
          animate="animate"
        >
          <AnimatePresence mode="popLayout">
            {!isLoading && sortedData.length === 0 && (
              <motion.tr
                variants={listItemVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <td colSpan={columns.length} className={styles.emptyCell}>
                  {emptyMessage}
                </td>
              </motion.tr>
            )}

            {!isLoading &&
              sortedData.map((item, index) => {
                const key = keyExtractor(item, index);
                const isSelected = selectedRowKey === key;

                return (
                  <motion.tr
                    key={key}
                    variants={listItemVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className={cn(
                      styles.tr,
                      isRowClickable && styles.clickable,
                      isSelected && styles.selected
                    )}
                    onClick={() => onRowClick?.(item, index)}
                    whileHover={isRowClickable ? { backgroundColor: 'var(--bg-tertiary)' } : undefined}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={cn(styles.td, styles[`align-${column.align || 'left'}`])}
                      >
                        {column.render
                          ? column.render(item, index)
                          : (item[column.key] as ReactNode)}
                      </td>
                    ))}
                  </motion.tr>
                );
              })}
          </AnimatePresence>
        </motion.tbody>
      </table>

      {isLoading && (
        <div className={styles.loading}>
          <div className={styles.loadingBar} />
        </div>
      )}
    </div>
  );
}
