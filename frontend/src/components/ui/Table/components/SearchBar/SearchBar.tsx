import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './SearchBar.module.css';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchBar = ({
  value,
  onChange,
  placeholder = 'Rechercher...',
  className,
}: SearchBarProps) => {
  const handleClear = () => {
    onChange('');
  };

  return (
    <div className={`${styles.searchContainer} ${className || ''}`}>
      <Search className={styles.searchIcon} size={18} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={styles.searchInput}
      />
      <AnimatePresence>
        {value && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={handleClear}
            className={styles.clearButton}
            type="button"
            aria-label="Effacer la recherche"
          >
            <X size={16} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};
