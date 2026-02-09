import { ReactNode, TextareaHTMLAttributes, forwardRef, useRef } from 'react';
import { FormField } from '../FormField/FormField';
import styles from '../styles/forms.module.css';
import './FormTextarea.css';

export interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Label du champ */
  label?: string;
  /** Champ requis */
  required?: boolean;
  /** Message d'erreur */
  error?: string;
  /** Texte d'aide */
  hint?: string;
  /** Nombre de lignes visibles */
  rows?: number;
  cols?: number;
  /** Redimensionnement autorisé */
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  /** Classes CSS additionnelles pour le wrapper */
  wrapperClassName?: string;
  /** Disposition : vertical (par défaut) ou inline (label et champ alignés) */
  layout?: 'vertical' | 'inline';
  leftIcon?: ReactNode;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  (
    {
      leftIcon,
      label,
      required,
      error,
      hint,
      disabled,
      rows = 4,
      cols = 4,
      resize = 'vertical',
      className = '',
      wrapperClassName = '',
      layout = 'vertical',
      id,
      ...props
    },
    ref
  ) => {
    
    const inputIdRef = useRef(id || `textarea-${Math.random().toString(36).substr(2, 9)}`);
    const inputId = inputIdRef.current;


    rows = rows > 0 ? rows : 3;
    // cols = cols > 0 ? cols : 3;

    const wrapperClasses = [
      styles.textareaWrapper,
      error && styles.hasError,
      disabled && styles.disabled,
      wrapperClassName,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <>
        <FormField
          {...props}

          label={label}
          required={required}
          error={error}
          hint={hint}
          htmlFor={inputId}
          layout={layout}
        >
          {leftIcon && <span className={styles.inputIcon}>{leftIcon}</span>}

          <div className={wrapperClasses}>
            <textarea
              {...props}
              ref={ref}
              id={inputId}
              rows={rows}
              cols={cols}
              disabled={disabled}
              className={`${styles.textarea} ${className}`}
              style={{ resize }}
            />
          </div>
        </FormField>
      </>
    );
  }
);

FormTextarea.displayName = 'FormTextarea';
