import { useState, useMemo } from 'react';
import styles from './DataTable.module.css';

export interface Column<T> {
  key: string;
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T, index: number) => string;
  pageSize?: number;
  showPagination?: boolean;
  emptyMessage?: string;
  isLoading?: boolean;
  onRowClick?: (row: T) => void;
  className?: string;
  stickyHeader?: boolean;
  striped?: boolean;
  compact?: boolean;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  pageSize = 10,
  showPagination = true,
  emptyMessage = 'Aucune donnee disponible',
  isLoading = false,
  onRowClick,
  className = '',
  stickyHeader = false,
  striped = true,
  compact = false,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  // Sorting logic
  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      const column = columns.find(col => col.key === sortConfig.key);
      if (!column) return 0;

      let aValue: unknown;
      let bValue: unknown;

      if (typeof column.accessor === 'function') {
        aValue = column.accessor(a);
        bValue = column.accessor(b);
      } else {
        aValue = a[column.accessor];
        bValue = b[column.accessor];
      }

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });
  }, [data, sortConfig, columns]);

  // Pagination logic
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = useMemo(() => {
    if (!showPagination) return sortedData;
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize, showPagination]);

  // Handle sort
  const handleSort = (key: string) => {
    const column = columns.find(col => col.key === key);
    if (!column?.sortable) return;

    setSortConfig(current => {
      if (current?.key === key) {
        return current.direction === 'asc'
          ? { key, direction: 'desc' }
          : null;
      }
      return { key, direction: 'asc' };
    });
  };

  // Get cell value
  const getCellValue = (row: T, column: Column<T>): React.ReactNode => {
    if (typeof column.accessor === 'function') {
      return column.accessor(row);
    }
    const value = row[column.accessor];
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
    return String(value);
  };

  // Render pagination
  const renderPagination = () => {
    if (!showPagination || totalPages <= 1) return null;

    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }

    return (
      <div className={styles.pagination}>
        <div className={styles.pageInfo}>
          Affichage {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, sortedData.length)} sur {sortedData.length}
        </div>
        <div className={styles.pageButtons}>
          <button
            className={styles.pageButton}
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
            &laquo;
          </button>
          <button
            className={styles.pageButton}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            &lsaquo;
          </button>
          {pages.map((page, index) => (
            typeof page === 'number' ? (
              <button
                key={index}
                className={`${styles.pageButton} ${currentPage === page ? styles.active : ''}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ) : (
              <span key={index} className={styles.ellipsis}>{page}</span>
            )
          ))}
          <button
            className={styles.pageButton}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            &rsaquo;
          </button>
          <button
            className={styles.pageButton}
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
          >
            &raquo;
          </button>
        </div>
      </div>
    );
  };

  const tableClasses = [
    styles.table,
    striped ? styles.striped : '',
    compact ? styles.compact : '',
    stickyHeader ? styles.stickyHeader : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.tableWrapper}>
        <table className={tableClasses}>
          <thead>
            <tr>
              {columns.map(column => (
                <th
                  key={column.key}
                  className={`${styles.th} ${column.sortable ? styles.sortable : ''} ${column.className || ''}`}
                  style={{ width: column.width, textAlign: column.align || 'left' }}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className={styles.headerContent}>
                    {column.header}
                    {column.sortable && (
                      <span className={styles.sortIcon}>
                        {sortConfig?.key === column.key ? (
                          sortConfig.direction === 'asc' ? '▲' : '▼'
                        ) : '⇅'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className={styles.loadingCell}>
                  <div className={styles.loadingSpinner} />
                  Chargement...
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className={styles.emptyCell}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, index) => (
                <tr
                  key={keyExtractor(row, index)}
                  className={`${styles.tr} ${onRowClick ? styles.clickable : ''}`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map(column => (
                    <td
                      key={column.key}
                      className={`${styles.td} ${column.className || ''}`}
                      style={{ textAlign: column.align || 'left' }}
                    >
                      {getCellValue(row, column)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {renderPagination()}
    </div>
  );
}

export default DataTable;
