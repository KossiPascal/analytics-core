import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import styles from './PageSizeSelector.module.css';

interface PageSizeSelectorProps {
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  options?: number[];
  className?: string;
}

export const PageSizeSelector = ({
  pageSize,
  onPageSizeChange,
  options = [10, 25, 50, 100],
  className,
}: PageSizeSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (size: number) => {
    onPageSizeChange(size);
    setIsOpen(false);
  };

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <span className={styles.label}>Afficher</span>
      <div className={styles.selectContainer}>
        <button
          className={styles.selectButton}
          onClick={() => setIsOpen(!isOpen)}
          type="button"
        >
          <span>{pageSize}</span>
          <ChevronDown size={16} className={isOpen ? styles.iconOpen : ''} />
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
                {options.map((size) => (
                  <button
                    key={size}
                    className={`${styles.option} ${size === pageSize ? styles.active : ''}`}
                    onClick={() => handleSelect(size)}
                    type="button"
                  >
                    {size}
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
      <span className={styles.label}>lignes</span>
    </div>
  );
};
