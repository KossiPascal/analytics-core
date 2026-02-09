import { TextareaHTMLAttributes, forwardRef } from 'react';
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
  /** Redimensionnement autorisé */
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  /** Classes CSS additionnelles pour le wrapper */
  wrapperClassName?: string;
  /** Disposition : vertical (par défaut) ou inline (label et champ alignés) */
  layout?: 'vertical' | 'inline';
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  (
    {
      label,
      required,
      error,
      hint,
      disabled,
      rows = 4,
      resize = 'vertical',
      className = '',
      wrapperClassName = '',
      layout = 'vertical',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

    const wrapperClasses = [
      styles.textareaWrapper,
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
          <textarea
            ref={ref}
            id={inputId}
            rows={rows}
            disabled={disabled}
            className={`${styles.textarea} ${className}`}
            style={{ resize }}
            {...props}
          />
        </div>
      </FormField>
    );
  }
);

FormTextarea.displayName = 'FormTextarea';
