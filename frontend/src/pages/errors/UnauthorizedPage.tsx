import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, LogIn } from 'lucide-react';
import { Button } from '@components/ui';
import { ROUTES } from '@routes/index';
import styles from './ErrorPage.module.css';

export default function UnauthorizedPage() {
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
          401
        </motion.div>

        <h1 className={styles.title}>Accès non autorisé</h1>
        <p className={styles.description}>
          Vous n'avez pas les autorisations nécessaires pour accéder à cette page.
        </p>

        <div className={styles.actions}>
          <Link to={ROUTES.auth.login()}>
            <Button variant="ghost" leftIcon={<LogIn size={18} />}>
              Se connecter
            </Button>
          </Link>
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
