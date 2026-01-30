import { motion } from 'framer-motion';
import { cn } from '@utils/cn';
import styles from './Spinner.module.css';

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerVariant = 'primary' | 'secondary' | 'white' | 'current';

export interface SpinnerProps {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  className?: string;
  label?: string;
}

export function Spinner({
  size = 'md',
  variant = 'primary',
  className,
  label = 'Chargement...',
}: SpinnerProps) {
  return (
    <motion.div
      className={cn(styles.spinner, styles[size], styles[variant], className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="status"
      aria-label={label}
    >
      <svg
        className={styles.svg}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          className={styles.track}
          cx="12"
          cy="12"
          r="10"
          strokeWidth="3"
        />
        <path
          className={styles.indicator}
          d="M12 2C6.47715 2 2 6.47715 2 12C2 14.5361 2.94409 16.8517 4.5 18.6177"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </motion.div>
  );
}
