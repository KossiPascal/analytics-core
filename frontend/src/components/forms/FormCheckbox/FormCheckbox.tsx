import { InputHTMLAttributes, ReactNode, forwardRef, useRef } from 'react';
import { Check } from 'lucide-react';
import styles from '../styles/forms.module.css';
import './FormCheckbox.css';

export interface FormCheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Label du checkbox */
  label?: string;
  /** Message d'erreur */
  error?: string;
  /** Classes CSS additionnelles */
  wrapperClassName?: string;
  /** Disposition : vertical (par défaut) ou inline (label et champ alignés) */
  layout?: 'vertical' | 'inline';
  
  leftIcon?: ReactNode;
}

export const FormCheckbox = forwardRef<HTMLInputElement, FormCheckboxProps>(
  (
    {
      leftIcon,
      label,
      error,
      checked,
      value,
      disabled,
      className = '',
      wrapperClassName = '',
      id,
      ...props
    },
    ref
  ) => {
    
    const inputIdRef = useRef(id || `checkbox-${Math.random().toString(36).substr(2, 9)}`);
    const inputId = inputIdRef.current;

    const checkedValue = Boolean(checked ?? value);

    return (
      <div className={wrapperClassName}>
        <label
          htmlFor={inputId}
          className={`${styles.checkboxWrapper} ${disabled ? styles.disabled : ''} ${className}`}
        >
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            checked={checkedValue}
            disabled={disabled}
            className={styles.checkboxInput}
            {...props}
          />
          {leftIcon && <span className={styles.inputIcon}>{leftIcon}</span>}

          <span className={`${styles.checkboxBox} ${checkedValue ? styles.checked : ''}`}>
             <Check size={14} strokeWidth={3} />
          </span>
          {label && <span className={styles.checkboxLabel}>{label}</span>}
        </label>
        {error && (
          <span className={styles.errorMessage} style={{ marginTop: '0.25rem', marginLeft: '2.25rem' }}>
            {error}
          </span>
        )}
      </div>
    );
  }
);

FormCheckbox.displayName = 'FormCheckbox';
