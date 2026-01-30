import { motion } from 'framer-motion';
import styles from './SuspenseLoader.module.css';

export interface SuspenseLoaderProps {
  message?: string;
}

export function SuspenseLoader({ message = 'Chargement...' }: SuspenseLoaderProps) {
  return (
    <div className={styles.container}>
      <motion.div
        className={styles.loader}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Animated circles */}
        <div className={styles.circles}>
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className={styles.circle}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: index * 0.15,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>

        {/* Message */}
        <motion.p
          className={styles.message}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {message}
        </motion.p>
      </motion.div>
    </div>
  );
}
