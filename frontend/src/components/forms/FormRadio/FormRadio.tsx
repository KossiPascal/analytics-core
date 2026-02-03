import { InputHTMLAttributes, forwardRef, ReactNode } from 'react';
import styles from '../styles/forms.module.css';
import './FormRadio.css';


export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface FormRadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Label du groupe */
  label?: string;
  /** Champ requis */
  required?: boolean;
  /** Message d'erreur */
  error?: string;
  /** Texte d'aide */
  hint?: string;
  /** Classes CSS additionnelles */
  wrapperClassName?: string;
}

export interface FormRadioGroupProps {
  /** Label du groupe */
  label?: string;
  /** Champ requis */
  required?: boolean;
  /** Message d'erreur */
  error?: string;
  /** Texte d'aide */
  hint?: string;
  /** Nom du groupe radio */
  name: string;
  /** Options disponibles */
  options: RadioOption[];
  /** Valeur sélectionnée */
  value?: string;
  /** Callback de changement */
  onChange?: (value: string) => void;
  /** Orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Groupe désactivé */
  disabled?: boolean;
  /** Classes CSS additionnelles */
  className?: string;
}

export const FormRadio = forwardRef<HTMLInputElement, FormRadioProps>(
  (
    {
      label,
      disabled,
      className = '',
      wrapperClassName = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `radio-${Math.random().toString(36).substr(2, 9)}`;

    const wrapperClasses = [
      styles.radioWrapper,
      disabled && styles.disabled,
      wrapperClassName,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={wrapperClasses}>
        <label className={styles.radioLabel} htmlFor={inputId}>
          <div className={styles.radioBox}>
            <input
              ref={ref}
              id={inputId}
              type="radio"
              disabled={disabled}
              className={`${styles.radioInput} ${className}`}
              {...props}
            />
            <span className={styles.radioDot} />
          </div>
          {label && <span className={styles.radioText}>{label}</span>}
        </label>
      </div>
    );
  }
);

FormRadio.displayName = 'FormRadio';

export function FormRadioGroup({
  label,
  required,
  error,
  hint,
  name,
  options,
  value,
  onChange,
  orientation = 'vertical',
  disabled,
  className = '',
}: FormRadioGroupProps) {
  const groupClasses = [
    styles.radioGroup,
    orientation === 'horizontal' && styles.radioGroupHorizontal,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.formField}>
      {label && (
        <span className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </span>
      )}
      <div className={groupClasses} role="radiogroup">
        {options.map((option) => (
          <div
            key={option.value}
            className={`${styles.radioWrapper} ${(disabled || option.disabled) ? styles.disabled : ''}`}
          >
            <label className={styles.radioLabel}>
              <div className={styles.radioBox}>
                <input
                  type="radio"
                  name={name}
                  value={option.value}
                  checked={value === option.value}
                  onChange={() => onChange?.(option.value)}
                  disabled={disabled || option.disabled}
                  className={styles.radioInput}
                />
                <span className={styles.radioDot} />
              </div>
              <div className={styles.radioContent}>
                <span className={styles.radioText}>{option.label}</span>
                {option.description && (
                  <span className={styles.radioDescription}>{option.description}</span>
                )}
              </div>
            </label>
          </div>
        ))}
      </div>
      {hint && !error && <span className={styles.hint}>{hint}</span>}
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
}
