import { motion, AnimatePresence } from 'framer-motion';
import styles from './GraduationLoader.module.css';

interface GraduationLoaderProps {
  isLoading: boolean;
  message?: string;
}

export function GraduationLoader({ isLoading, message = 'Chargement des données...' }: GraduationLoaderProps) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className={styles.container}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className={styles.loader}>
            <div className={styles.graduation}>
              <div className={styles.cap}>
                <div className={styles.capTop}></div>
                <div className={styles.capBase}></div>
                <div className={styles.tassel}></div>
              </div>
              <div className={styles.books}>
                <div className={styles.book} style={{ '--i': 0 } as React.CSSProperties}></div>
                <div className={styles.book} style={{ '--i': 1 } as React.CSSProperties}></div>
                <div className={styles.book} style={{ '--i': 2 } as React.CSSProperties}></div>
              </div>
            </div>
            <div className={styles.dots}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
          <p className={styles.message}>{message}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
