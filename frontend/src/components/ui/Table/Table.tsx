import { type ReactNode, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { cn } from '@utils/cn';
import { listItemVariants, staggerContainerVariants } from '@animations/list.variants';
import { TableToolbar } from './components/TableToolbar/TableToolbar';
import { Pagination } from './components/Pagination/Pagination';
import { PageSizeSelector } from './components/PageSizeSelector/PageSizeSelector';
import { ColumnVisibilityToggle } from './components/ColumnVisibilityToggle/ColumnVisibilityToggle';
import type { ExportFormat } from './utils/exportData';
import styles from './Table.module.css';

export interface Column<T> {
  key: string;
  header: ReactNode;
  render?: (item: T, index: number) => ReactNode;
  sortable?: boolean;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  searchable?: boolean;
}

export interface TableFeatures {
  search?: boolean;
  export?: boolean;
  pagination?: boolean;
  pageSize?: boolean;
  animate?: boolean;
  columnVisibility?: boolean;
  scrollable?: boolean;
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

  // Advanced features
  features?: TableFeatures;
  searchPlaceholder?: string;
  exportFilename?: string;
  exportFormats?: ExportFormat[];
  defaultPageSize?: number;
  pageSizeOptions?: number[];
  showFirstLastButtons?: boolean;
  toolbarLeftSection?: ReactNode;
  toolbarRightSection?: ReactNode;
  scrollable?: boolean;
  maxHeight?: string | number;
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
  features = {},
  searchPlaceholder = 'Rechercher...',
  exportFilename = 'export',
  exportFormats = ['csv', 'json', 'excel'],
  defaultPageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  showFirstLastButtons = true,
  toolbarLeftSection,
  toolbarRightSection,
  scrollable = false,
  maxHeight = '600px',
}: TableProps<T>) {
  const {
    search: enableSearch = false,
    export: enableExport = false,
    pagination: enablePagination = false,
    pageSize: enablePageSize = false,
    animate: enableAnimate = true,
    columnVisibility: enableColumnVisibility = false,
    scrollable: enableScrollable = false,
  } = features;

  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    columns.map((col) => col.key)
  );

  // Filter columns based on visibility
  const displayColumns = useMemo(() => {
    if (!enableColumnVisibility) return columns;
    return columns.filter((col) => visibleColumns.includes(col.key));
  }, [columns, visibleColumns, enableColumnVisibility]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig?.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Filter by search query
  const filteredData = useMemo(() => {
    if (!enableSearch || !searchQuery.trim()) return data;

    const query = searchQuery.toLowerCase();
    return data.filter((item) => {
      return columns.some((column) => {
        if (column.searchable === false) return false;
        const value = item[column.key];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(query);
      });
    });
  }, [data, searchQuery, columns, enableSearch]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!enablePagination) return sortedData;

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, pageSize, enablePagination]);

  const totalPages = useMemo(() => {
    return Math.ceil(sortedData.length / pageSize);
  }, [sortedData.length, pageSize]);

  // Reset to page 1 when search query changes
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const displayData = paginatedData;

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

  const showToolbar = enableSearch || enableExport || enableColumnVisibility || toolbarLeftSection || toolbarRightSection;

  return (
    <div className={cn(styles.container, className)}>
      {showToolbar && (
        <TableToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder={searchPlaceholder}
          showSearch={enableSearch}
          showExport={enableExport}
          exportData={sortedData}
          exportColumns={displayColumns}
          exportFilename={exportFilename}
          exportFormats={exportFormats}
          leftSection={
            <>
              {toolbarLeftSection}
              {enableColumnVisibility && (
                <ColumnVisibilityToggle
                  columns={columns}
                  visibleColumns={visibleColumns}
                  onVisibilityChange={setVisibleColumns}
                />
              )}
            </>
          }
          rightSection={toolbarRightSection}
        />
      )}

      <div
        className={styles.wrapper}
        style={(enableScrollable || scrollable) ? {
          maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight,
          overflowY: 'auto',
          overflowX: 'auto',
        } : undefined}
      >
        <table className={styles.table}>
        <thead className={cn(styles.thead, stickyHeader && styles.stickyHeader)}>
          <tr>
            {displayColumns.map((column) => (
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

        {enableAnimate ? (
          <motion.tbody
            className={styles.tbody}
            variants={staggerContainerVariants}
            initial="initial"
            animate="animate"
          >
            <AnimatePresence mode="popLayout">
              {!isLoading && displayData.length === 0 && (
                <motion.tr
                  variants={listItemVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <td colSpan={displayColumns.length} className={styles.emptyCell}>
                    {emptyMessage}
                  </td>
                </motion.tr>
              )}

              {!isLoading &&
                displayData.map((item, index) => {
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
                      whileHover={
                        isRowClickable ? { backgroundColor: 'var(--bg-tertiary)' } : undefined
                      }
                    >
                      {displayColumns.map((column) => (
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
        ) : (
          <tbody className={styles.tbody}>
            {!isLoading && displayData.length === 0 && (
              <tr>
                <td colSpan={columns.length} className={styles.emptyCell}>
                  {emptyMessage}
                </td>
              </tr>
            )}

            {!isLoading &&
              displayData.map((item, index) => {
                const key = keyExtractor(item, index);
                const isSelected = selectedRowKey === key;

                return (
                  <tr
                    key={key}
                    className={cn(
                      styles.tr,
                      isRowClickable && styles.clickable,
                      isSelected && styles.selected
                    )}
                    onClick={() => onRowClick?.(item, index)}
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
                  </tr>
                );
              })}
          </tbody>
        )}
        </table>

        {isLoading && (
          <div className={styles.loading}>
            <div className={styles.loadingBar} />
          </div>
        )}
      </div>

      {(enablePagination || enablePageSize) && (
        <div className={styles.footer}>
          {enablePageSize && (
            <PageSizeSelector
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
              options={pageSizeOptions}
            />
          )}
          {enablePagination && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              showFirstLast={showFirstLastButtons}
            />
          )}
        </div>
      )}
    </div>
  );
}
