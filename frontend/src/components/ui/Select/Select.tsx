import { forwardRef, type SelectHTMLAttributes } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, AlertCircle } from 'lucide-react';
import { cn } from '@utils/cn';
import styles from './Select.module.css';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
  isFullWidth?: boolean;
  onChange?: (value: string) => void;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      hint,
      options,
      placeholder = 'Sélectionner...',
      isFullWidth = true,
      className,
      disabled,
      id,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const selectId = id || props.name || `select-${Math.random().toString(36).substring(7)}`;

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      onChange?.(e.target.value);
    };

    return (
      <motion.div
        className={cn(styles.wrapper, isFullWidth && styles.fullWidth)}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {label && (
          <label htmlFor={selectId} className={styles.label}>
            {label}
            {props.required && <span className={styles.required}>*</span>}
          </label>
        )}

        <div className={cn(styles.selectContainer, error && styles.hasError)}>
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            value={value}
            onChange={handleChange}
            className={cn(
              styles.select,
              !value && styles.placeholder,
              error && styles.selectError,
              disabled && styles.disabled,
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>

          <span className={styles.icon}>
            <ChevronDown size={18} />
          </span>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              id={`${selectId}-error`}
              className={styles.error}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              role="alert"
            >
              <AlertCircle size={14} />
              <span>{error}</span>
            </motion.div>
          )}

          {!error && hint && (
            <motion.p
              id={`${selectId}-hint`}
              className={styles.hint}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {hint}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }
);

Select.displayName = 'Select';

export { Select };
