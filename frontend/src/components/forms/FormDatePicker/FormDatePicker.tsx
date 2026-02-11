import { InputHTMLAttributes, forwardRef, useRef } from 'react';
import { Calendar } from 'lucide-react';
import { FormField } from '../FormField/FormField';
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
  /** Disposition : vertical (par défaut) ou inline (label et champ alignés) */
  layout?: 'vertical' | 'inline';
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
      layout = 'vertical',
      id,
      ...props
    },
    ref
  ) => {

    const inputIdRef = useRef(id || `date-${Math.random().toString(36).substr(2, 9)}`);
    const inputId = inputIdRef.current;

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
        layout={layout}
      >
        <div className={wrapperClasses}>
          <input
            {...props}
            ref={ref}
            id={inputId}
            type="date"
            disabled={disabled} 
            className={`date-input ${className}`}
            
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
