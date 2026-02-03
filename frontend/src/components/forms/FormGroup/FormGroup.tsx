import { ReactNode } from 'react';
import styles from '../styles/forms.module.css';
import './FormGroup.css';

export interface FormGroupProps {
  /** Nombre de colonnes (2, 3 ou 4) */
  columns?: 2 | 3 | 4;
  /** Gap entre les éléments */
  gap?: 'sm' | 'md' | 'lg';
  /** Classes CSS additionnelles */
  className?: string;
  /** Contenu du groupe */
  children: ReactNode;
}

export function FormGroup({
  columns = 2,
  gap = 'md',
  className = '',
  children,
}: FormGroupProps) {
  const gapSizes = {
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
  };

  const columnClasses = {
    2: styles.formGroupRow,
    3: styles.formGroupCol3,
    4: styles.formGroupCol4,
  };

  return (
    <div
      className={`${styles.formGroup} ${columnClasses[columns]} ${className}`}
      style={{ gap: gapSizes[gap] }}
    >
      {children}
    </div>
  );
}
