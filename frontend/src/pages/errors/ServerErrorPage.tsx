import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, RefreshCw } from 'lucide-react';
import { Button } from '@components/ui/Button/Button';
import { ROUTES } from '@routes/configs';
import styles from './ErrorPage.module.css';

export default function ServerErrorPage() {
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
          500
        </motion.div>

        <h1 className={styles.title}>Erreur serveur</h1>
        <p className={styles.description}>
          Une erreur inattendue s'est produite. Veuillez réessayer plus tard.
        </p>

        <div className={styles.actions}>
          <Button
            variant="ghost"
            leftIcon={<RefreshCw size={18} />}
            onClick={() => window.location.reload()}
          >
            Réessayer
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
