import { InputHTMLAttributes, forwardRef } from 'react';
import { Calendar } from 'lucide-react';
import { FormField } from '../FormField';
import styles from '../styles/forms.module.css';
import './FormDatePicker.css';

export interface FormDatePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Label du champ */
  label?: string;
  /** Champ requis */
  required?: boolean;
  /** Message d'erreur */
  error?: string;
  /** Texte d'aide */
  hint?: string;
  /** Classes CSS additionnelles pour le wrapper */
  wrapperClassName?: string;
}

export const FormDatePicker = forwardRef<HTMLInputElement, FormDatePickerProps>(
  (
    {
      label,
      required,
      error,
      hint,
      disabled,
      className = '',
      wrapperClassName = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `date-${Math.random().toString(36).substr(2, 9)}`;

    const wrapperClasses = [
      styles.inputWrapper,
      error && styles.hasError,
      disabled && styles.disabled,
      wrapperClassName,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <FormField
        label={label}
        required={required}
        error={error}
        hint={hint}
        htmlFor={inputId}
      >
        <div className={wrapperClasses}>
          <input
            ref={ref}
            id={inputId}
            type="date"
            disabled={disabled}
            className={`${styles.dateInput} ${className}`}
            {...props}
          />
          <span className={styles.inputIconRight} style={{ pointerEvents: 'none' }}>
            <Calendar size={18} />
          </span>
        </div>
      </FormField>
    );
  }
);

FormDatePicker.displayName = 'FormDatePicker';
