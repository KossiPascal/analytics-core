import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { pageBlurFadeVariants } from '@animations/index';
import { cn } from '@utils/cn';
import styles from './AuthLayout.module.css';

export interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
}

export function AuthLayout({ children, title, subtitle, className }: AuthLayoutProps) {
  return (
    <div className={styles.container}>
      {/* Background decorations */}
      <div className={styles.background}>
        <div className={styles.circle1} />
        <div className={styles.circle2} />
        <div className={styles.circle3} />
      </div>

      <motion.div
        className={cn(styles.card, className)}
        variants={pageBlurFadeVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {/* Logo */}
        <div className={styles.logo}>
          <motion.span
            className={styles.logoIcon}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
          >
            K
          </motion.span>
          <motion.span
            className={styles.logoText}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            Kendeya Analytics
          </motion.span>
        </div>

        {/* Title */}
        {(title || subtitle) && (
          <motion.div
            className={styles.header}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {title && <h1 className={styles.title}>{title}</h1>}
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </motion.div>
        )}

        {/* Content */}
        <motion.div
          className={styles.content}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {children}
        </motion.div>
      </motion.div>

      {/* Footer */}
      <motion.footer
        className={styles.footer}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <p>&copy; {new Date().getFullYear()} Kendeya Analytics. Tous droits réservés.</p>
      </motion.footer>
    </div>
  );
}
