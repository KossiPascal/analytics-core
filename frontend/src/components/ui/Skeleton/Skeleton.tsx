import { motion } from 'framer-motion';
import { cn } from '@utils/cn';
import styles from './Skeleton.module.css';

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  animation?: 'pulse' | 'wave' | 'none';
  className?: string;
  count?: number;
}

export function Skeleton({
  width,
  height,
  variant = 'text',
  animation = 'pulse',
  className,
  count = 1,
}: SkeletonProps) {
  const style = {
    width: width,
    height: height,
  };

  if (count > 1) {
    return (
      <div className={styles.group}>
        {Array.from({ length: count }).map((_, index) => (
          <motion.div
            key={index}
            className={cn(
              styles.skeleton,
              styles[variant],
              animation !== 'none' && styles[animation],
              className
            )}
            style={style}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.05 }}
          />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className={cn(
        styles.skeleton,
        styles[variant],
        animation !== 'none' && styles[animation],
        className
      )}
      style={style}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    />
  );
}

// Preset skeleton components
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn(styles.textGroup, className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          variant="text"
          width={index === lines - 1 ? '60%' : '100%'}
        />
      ))}
    </div>
  );
}

export function SkeletonAvatar({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <Skeleton
      variant="circular"
      width={size}
      height={size}
      className={className}
    />
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn(styles.card, className)}>
      <Skeleton variant="rectangular" height={200} />
      <div className={styles.cardContent}>
        <Skeleton variant="text" width="80%" />
        <Skeleton variant="text" width="60%" />
        <div className={styles.cardFooter}>
          <SkeletonAvatar size={32} />
          <Skeleton variant="text" width={100} />
        </div>
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4, className }: { rows?: number; columns?: number; className?: string }) {
  return (
    <div className={cn(styles.table, className)}>
      <div className={styles.tableHeader}>
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} variant="text" height={20} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className={styles.tableRow}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} variant="text" height={16} />
          ))}
        </div>
      ))}
    </div>
  );
}
