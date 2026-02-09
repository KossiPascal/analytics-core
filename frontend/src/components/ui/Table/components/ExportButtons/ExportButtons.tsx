import { Download, FileText, FileJson, FileSpreadsheet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import type { Column } from '../../Table';
import { exportToCSV, exportToJSON, exportToExcel, type ExportFormat } from '../../utils/exportData';
import styles from './ExportButtons.module.css';

interface ExportButtonsProps<T> {
  data: T[];
  columns: Column<T>[];
  filename?: string;
  formats?: ExportFormat[];
  className?: string;
}

export const ExportButtons = <T extends Record<string, unknown>>({
  data,
  columns,
  filename = 'export',
  formats = ['csv', 'json', 'excel'],
  className,
}: ExportButtonsProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleExport = (format: ExportFormat) => {
    switch (format) {
      case 'csv':
        exportToCSV(data, columns, filename);
        break;
      case 'json':
        exportToJSON(data, filename);
        break;
      case 'excel':
        exportToExcel(data, columns, filename);
        break;
    }
    setIsOpen(false);
  };

  const getFormatIcon = (format: ExportFormat) => {
    switch (format) {
      case 'csv':
        return <FileText size={16} />;
      case 'json':
        return <FileJson size={16} />;
      case 'excel':
        return <FileSpreadsheet size={16} />;
    }
  };

  const getFormatLabel = (format: ExportFormat) => {
    switch (format) {
      case 'csv':
        return 'CSV';
      case 'json':
        return 'JSON';
      case 'excel':
        return 'Excel';
    }
  };

  return (
    <div className={`${styles.exportContainer} ${className || ''}`}>
      <button
        className={styles.exportButton}
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        aria-label="Export data"
      >
        <Download size={18} />
        <span>Exporter</span>
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
              {formats.map((format) => (
                <button
                  key={format}
                  className={styles.dropdownItem}
                  onClick={() => handleExport(format)}
                  type="button"
                >
                  {getFormatIcon(format)}
                  <span>{getFormatLabel(format)}</span>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
