import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '@components/ui';
import { ROUTES } from '@routes';
import styles from './ErrorPage.module.css';

export default function NotFoundPage() {
  return (
    <div className={styles.container}>
      <motion.div
        className={styles.content}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className={styles.errorCode}
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 15, stiffness: 200 }}
        >
          404
        </motion.div>

        <h1 className={styles.title}>Page non trouvée</h1>
        <p className={styles.description}>
          Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
        </p>

        <div className={styles.actions}>
          <Button
            variant="ghost"
            leftIcon={<ArrowLeft size={18} />}
            onClick={() => window.history.back()}
          >
            Retour
          </Button>
          <Link to={ROUTES.home()}>
            <Button leftIcon={<Home size={18} />}>
              Accueil
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
