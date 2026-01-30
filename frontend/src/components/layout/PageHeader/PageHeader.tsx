import { type ReactNode } from 'react';
import { cn } from '@utils/cn';
import styles from './PageHeader.module.css';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div className={cn(styles.header, className)}>
      <div className={styles.headerTitle}>
        <h1>{title}</h1>
        {subtitle && <span className={styles.headerSubtitle}>{subtitle}</span>}
      </div>
      {actions && <div className={styles.headerActions}>{actions}</div>}
    </div>
  );
}
