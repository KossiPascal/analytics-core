import { useState } from 'react';
import { Database, RefreshCw, HardDrive, Server, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardBody } from '@components/ui';
import { Button } from '@components/ui/Button/Button';
import { useNotification } from '@/contexts/OLD/useNotification';
import { AdminApi } from '@/services/OLD/old/api.service';
import styles from '@pages/admins/AdminPage.module.css';

interface DatabaseAction {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  action: () => Promise<void>;
  danger?: boolean;
}

export function DatabaseActionsTab() {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [lastResults, setLastResults] = useState<Record<string, string>>({});

  const { showSuccess, showError, showInfo } = useNotification();

  const executeAction = async (actionId: string, actionFn: () => Promise<void>) => {
    setLoadingAction(actionId);
    try {
      await actionFn();
      setLastResults((prev) => ({ ...prev, [actionId]: 'success' }));
    } catch (error) {
      setLastResults((prev) => ({ ...prev, [actionId]: 'error' }));
    } finally {
      setLoadingAction(null);
    }
  };

  const actions: DatabaseAction[] = [
    {
      id: 'sync-db',
      label: 'Synchroniser la base',
      description: 'Synchronise les données entre CouchDB et PostgreSQL',
      icon: <RefreshCw size={20} />,
      action: async () => {
        const response = await AdminApi.syncDatabase();
        if (response?.status === 200) {
          showSuccess('Synchronisation terminée avec succès');
        } else {
          showError('Erreur lors de la synchronisation');
        }
      },
    },
    {
      id: 'rebuild-indexes',
      label: 'Reconstruire les index',
      description: 'Reconstruit les index de la base de données pour améliorer les performances',
      icon: <HardDrive size={20} />,
      action: async () => {
        const response = await AdminApi.rebuildIndexes();
        if (response?.status === 200) {
          showSuccess('Index reconstruits avec succès');
        } else {
          showError('Erreur lors de la reconstruction des index');
        }
      },
    },
    {
      id: 'vacuum-db',
      label: 'Nettoyer la base',
      description: 'Effectue un VACUUM ANALYZE sur PostgreSQL pour optimiser l\'espace',
      icon: <Server size={20} />,
      action: async () => {
        const response = await AdminApi.vacuumDatabase();
        if (response?.status === 200) {
          showSuccess('Nettoyage terminé avec succès');
        } else {
          showError('Erreur lors du nettoyage');
        }
      },
    },
    {
      id: 'check-health',
      label: 'Vérifier la santé',
      description: 'Vérifie l\'état de santé des connexions aux bases de données',
      icon: <CheckCircle size={20} />,
      action: async () => {
        const response = await AdminApi.checkDatabaseHealth();
        if (response?.status === 200) {
          const data = response.data as { message?: string } | undefined;
          showInfo(`État: ${data?.message || 'OK'}`);
        } else {
          showError('Erreur lors de la vérification');
        }
      },
    },
  ];

  return (
    <Card>
      <CardHeader
        title={
          <div className={styles.cardTitle}>
            <Database size={20} />
            Actions sur la base de données
          </div>
        }
      />
      <CardBody>
        <div className={`${styles.grid} ${styles.grid2}`}>
          {actions.map((action) => (
            <div key={action.id} className={styles.card} style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div
                  style={{
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    backgroundColor: action.danger ? '#fee2e2' : '#dbeafe',
                    color: action.danger ? '#ef4444' : '#3b82f6',
                  }}
                >
                  {action.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    {action.label}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem' }}>
                    {action.description}
                  </p>
                  <Button
                    variant={action.danger ? 'danger' : 'primary'}
                    size="sm"
                    onClick={() => executeAction(action.id, action.action)}
                    disabled={loadingAction !== null}
                  >
                    {loadingAction === action.id ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        Exécution...
                      </>
                    ) : (
                      'Exécuter'
                    )}
                  </Button>
                  {lastResults[action.id] && (
                    <span
                      style={{
                        marginLeft: '0.75rem',
                        fontSize: '0.8125rem',
                        color: lastResults[action.id] === 'success' ? '#22c55e' : '#ef4444',
                      }}
                    >
                      {lastResults[action.id] === 'success' ? '✓ Succès' : '✗ Erreur'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={`${styles.alert} ${styles.alertInfo}`} style={{ marginTop: '1.5rem' }}>
          <Database size={20} />
          <div>
            <strong>Information</strong>
            <p style={{ margin: 0, fontSize: '0.875rem' }}>
              Ces actions peuvent prendre du temps en fonction de la taille de la base de données.
              Ne fermez pas la page pendant l'exécution.
            </p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
