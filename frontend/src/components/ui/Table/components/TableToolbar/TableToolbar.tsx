import type { ReactNode } from 'react';
import { SearchBar } from '../SearchBar/SearchBar';
import { ExportButtons } from '../ExportButtons/ExportButtons';
import type { Column } from '../../Table';
import type { ExportFormat } from '../../utils/exportData';
import styles from './TableToolbar.module.css';

interface TableToolbarProps<T> {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  showSearch?: boolean;
  showExport?: boolean;
  exportData?: T[];
  exportColumns?: Column<T>[];
  exportFilename?: string;
  exportFormats?: ExportFormat[];
  className?: string;
  leftSection?: ReactNode;
  rightSection?: ReactNode;
}

export const TableToolbar = <T extends object>({
  searchValue = '',
  onSearchChange,
  searchPlaceholder,
  showSearch = true,
  showExport = true,
  exportData = [],
  exportColumns = [],
  exportFilename,
  exportFormats,
  className,
  leftSection,
  rightSection,
}: TableToolbarProps<T>) => {
  return (
    <div className={`${styles.toolbar} ${className || ''}`}>
      <div className={styles.leftSection}>
        {showExport && exportData.length > 0 && (
          <ExportButtons
            data={exportData}
            columns={exportColumns}
            filename={exportFilename}
            formats={exportFormats}
          />
        )}
        {leftSection}
      </div>

      <div className={styles.rightSection}>
        {showSearch && onSearchChange && (
          <SearchBar
            value={searchValue}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
          />
        )}
        {rightSection}
      </div>
    </div>
  );
};
