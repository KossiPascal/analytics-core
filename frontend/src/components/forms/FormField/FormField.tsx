import { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import styles from '../styles/forms.module.css';

export interface FormFieldProps {
  name?: string;
  /** Label du champ */
  label?: string;
  /** Champ requis */
  required?: boolean;
  /** Message d'erreur */
  error?: string;
  /** Texte d'aide */
  hint?: string;
  /** ID pour le label */
  htmlFor?: string;
  /** Contenu du champ */
  children: ReactNode;
  /** Classes CSS additionnelles */
  className?: string;
  /** Disposition : vertical (par défaut) ou inline (label et champ alignés) */
  layout?: 'vertical' | 'inline';
}

export function FormField({
  name,
  label,
  required,
  error,
  hint,
  htmlFor,
  children,
  className = '',
  layout = 'vertical',
}: FormFieldProps) {
  const fieldClasses = [
    styles.formField,
    layout === 'inline' && styles.formFieldInline,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={fieldClasses}>
      {label && (
        <label className={styles.label} htmlFor={htmlFor}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      <div className={layout === 'inline' ? styles.formFieldInlineContent : undefined}>
        {children}
        {hint && !error && <span className={styles.hint}>{hint}</span>}
        {error && (
          <span className={styles.errorMessage}>
            <AlertCircle size={12} />
            {error}
          </span>
        )}
      </div>
    </div>
  );
}
