import { motion } from 'framer-motion';
import styles from './GoogleLoader.module.css';

export interface GoogleLoaderProps {
  size?: number;
}

export function GoogleLoader({ size = 48 }: GoogleLoaderProps) {
  return (
    <div className={styles.container}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className={styles.svg}
      >
        <motion.circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          initial={{ pathLength: 0, rotate: 0 }}
          animate={{
            pathLength: [0, 0.5, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            stroke: 'var(--primary)',
          }}
        />
      </svg>
    </div>
  );
}
