import { motion } from 'framer-motion';
import styles from './PageLoader.module.css';

export interface PageLoaderProps {
  isFullScreen?: boolean;
}

export function PageLoader({ isFullScreen = true }: PageLoaderProps) {
  return (
    <div className={isFullScreen ? styles.fullScreen : styles.container}>
      <motion.div
        className={styles.loader}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Logo */}
        <motion.div
          className={styles.logo}
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          K
        </motion.div>

        {/* Progress bar */}
        <div className={styles.progressContainer}>
          <motion.div
            className={styles.progressBar}
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>

        {/* Text */}
        <motion.p
          className={styles.text}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Chargement de l'application...
        </motion.p>
      </motion.div>
    </div>
  );
}
