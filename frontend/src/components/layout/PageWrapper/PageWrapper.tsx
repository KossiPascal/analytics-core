import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { pageVariants } from '@animations/index';
import { cn } from '@utils/cn';
import { PageHeader } from '../PageHeader';
import styles from './PageWrapper.module.css';

export interface PageWrapperProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
  noPadding?: boolean;
  fullWidth?: boolean;
}

export function PageWrapper({
  children,
  title,
  subtitle,
  actions,
  className,
  noPadding = false,
  fullWidth = false,
}: PageWrapperProps) {
  return (
    <motion.div
      className={cn(
        styles.wrapper,
        noPadding && styles.noPadding,
        fullWidth && styles.fullWidth,
        className
      )}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {(title || actions) && (
        <PageHeader title={title || ''} subtitle={subtitle} actions={actions} />
      )}

      <motion.div
        className={styles.content}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
