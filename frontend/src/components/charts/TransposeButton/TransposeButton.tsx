import React from 'react';
import { ArrowRightLeft } from 'lucide-react';
import styles from './TransposeButton.module.css';

export interface TransposeButtonProps {
  isTransposed: boolean;
  onToggle: () => void;
  label?: string;
  className?: string;
}

/**
 * Reusable button to toggle chart/table transposition.
 * Can be used anywhere a transpose toggle is needed.
 */
export const TransposeButton: React.FC<TransposeButtonProps> = ({
  isTransposed,
  onToggle,
  label = 'Transposer',
  className,
}) => {
  return (
    <button
      type="button"
      className={`${styles.transposeBtn} ${isTransposed ? styles.transposeBtnActive : ''} ${className ?? ''}`}
      onClick={onToggle}
      title={isTransposed ? 'Revenir à la vue normale' : 'Transposer les axes'}
    >
      <ArrowRightLeft size={16} />
      {label}
    </button>
  );
};
