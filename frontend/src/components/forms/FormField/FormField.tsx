import { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import styles from '../styles/forms.module.css';

export interface FormFieldProps {
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
}

export function FormField({
  label,
  required,
  error,
  hint,
  htmlFor,
  children,
  className = '',
}: FormFieldProps) {
  return (
    <div className={`${styles.formField} ${className}`}>
      {label && (
        <label className={styles.label} htmlFor={htmlFor}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      {children}
      {hint && !error && <span className={styles.hint}>{hint}</span>}
      {error && (
        <span className={styles.errorMessage}>
          <AlertCircle size={12} />
          {error}
        </span>
      )}
    </div>
  );
}
