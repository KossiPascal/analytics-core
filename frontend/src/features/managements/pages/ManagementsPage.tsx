import { useState, useEffect } from 'react';
import {
  Database,
  RefreshCw,
  Play,
  PlayCircle,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  List,
} from 'lucide-react';
import { PageWrapper } from '@components/layout';
import { Card, CardHeader, CardBody } from '@components/ui';
import { Button } from '@components/ui/Button/Button';
import { useNotification } from '@/hooks/useNotification';
import { MigrationsApi } from '@/services/api/api.service';
import styles from './ManagementsPage.module.css';

interface Migration {
  name: string;
  path: string;
  time: number;
}

export default function ManagementsPage() {
  const [migrations, setMigrations] = useState<Migration[]>([]);
  const [runMigrations, setRunMigrations] = useState<Migration[]>([]);
  const [selectedMigrations, setSelectedMigrations] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [runningMigration, setRunningMigration] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    loadMigrations();
  }, []);

  const loadMigrations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await MigrationsApi.getAllMigrations();
      if (response?.status === 200) {
        setMigrations((response.data as Migration[]) || []);
      } else {
        setError('Erreur lors du chargement des migrations');
      }
    } catch (err) {
      setError('Erreur de connexion');
      showError('Impossible de charger les migrations');
    } finally {
      setIsLoading(false);
    }
  };

  const runAllMigrations = async () => {
    setIsRunningAll(true);
    setError(null);
    try {
      const response = await MigrationsApi.runAllMigrations(true);
      if (response?.status === 200) {
        const migrationsData = (response.data as Migration[]) || [];
        setRunMigrations(migrationsData);
        setSelectedMigrations(new Set(migrationsData.map((m) => m.name)));
        showSuccess(`${migrationsData.length} migration(s) exécutée(s) avec succès`);
      } else {
        setError('Erreur lors de l\'exécution des migrations');
        showError('Erreur lors de l\'exécution');
      }
    } catch (err) {
      setError('Erreur de connexion');
      showError('Erreur lors de l\'exécution des migrations');
    } finally {
      setIsRunningAll(false);
    }
  };

  const runOneMigration = async (migrationName: string) => {
    setRunningMigration(migrationName);
    try {
      const response = await MigrationsApi.runOneMigration(migrationName, true);
      if (response?.status === 200) {
        setRunMigrations((prev) => [...prev, response.data as Migration]);
        setSelectedMigrations((prev) => new Set([...prev, migrationName]));
        showSuccess(`Migration "${migrationName}" exécutée avec succès`);
      } else {
        showError(`Erreur lors de l'exécution de "${migrationName}"`);
      }
    } catch (err) {
      showError(`Erreur lors de l'exécution de "${migrationName}"`);
    } finally {
      setRunningMigration(null);
    }
  };

  const getMigrationStatus = (name: string): 'success' | 'pending' | 'not_run' => {
    if (runMigrations.some((m) => m.name === name)) {
      return 'success';
    }
    if (selectedMigrations.has(name)) {
      return 'pending';
    }
    return 'not_run';
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <PageWrapper
      title="Gestion du système"
      subtitle="Maintenance et reconstruction des vues SQL"
    >
      {/* Actions Card */}
      <Card className={styles.actionsCard}>
        <CardHeader
          title={
            <div className={styles.cardTitle}>
              <Database size={20} />
              Migrations SQL
            </div>
          }
          action={
            <div className={styles.actions}>
              <Button variant="ghost" size="sm" onClick={loadMigrations} disabled={isLoading}>
                <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                Actualiser
              </Button>
              <Button
                variant="primary"
                onClick={runAllMigrations}
                disabled={isRunningAll || migrations.length === 0}
              >
                {isRunningAll ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Exécution...
                  </>
                ) : (
                  <>
                    <PlayCircle size={16} />
                    Exécuter tout
                  </>
                )}
              </Button>
            </div>
          }
        />
        <CardBody>
          {/* Info Alert */}
          <div className={styles.infoAlert}>
            <AlertCircle size={20} />
            <div>
              <strong>Information</strong>
              <p>
                Les migrations SQL reconstruisent les vues et procédures stockées de la base de données.
                Cette opération est sûre et peut être exécutée à tout moment.
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className={styles.errorAlert}>
              <XCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {/* Stats */}
          <div className={styles.stats}>
            <div className={styles.statItem}>
              <List size={18} />
              <span>{migrations.length} migration(s) disponible(s)</span>
            </div>
            <div className={styles.statItem}>
              <CheckCircle size={18} style={{ color: '#22c55e' }} />
              <span>{runMigrations.length} exécutée(s)</span>
            </div>
          </div>

          {/* Migrations List */}
          {isLoading ? (
            <div className={styles.loading}>
              <RefreshCw size={32} className="animate-spin" />
              <span>Chargement des migrations...</span>
            </div>
          ) : migrations.length === 0 ? (
            <div className={styles.emptyState}>
              <Database size={48} />
              <p>Aucune migration disponible</p>
            </div>
          ) : (
            <div className={styles.migrationsList}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Chemin</th>
                    <th>Durée</th>
                    <th>Statut</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {migrations.map((migration) => {
                    const status = getMigrationStatus(migration.name);
                    const runData = runMigrations.find((m) => m.name === migration.name);

                    return (
                      <tr key={migration.name}>
                        <td className={styles.migrationName}>
                          <code>{migration.name}</code>
                        </td>
                        <td className={styles.migrationPath}>
                          <span title={migration.path}>
                            .../{migration.path.split('/').slice(-2).join('/')}
                          </span>
                        </td>
                        <td>
                          {runData ? (
                            <span className={styles.duration}>
                              <Clock size={14} />
                              {formatDuration(runData.time)}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td>
                          {status === 'success' && (
                            <span className={`${styles.status} ${styles.statusSuccess}`}>
                              <CheckCircle size={14} />
                              Succès
                            </span>
                          )}
                          {status === 'pending' && (
                            <span className={`${styles.status} ${styles.statusPending}`}>
                              <RefreshCw size={14} className="animate-spin" />
                              En cours
                            </span>
                          )}
                          {status === 'not_run' && (
                            <span className={`${styles.status} ${styles.statusNotRun}`}>
                              <Clock size={14} />
                              En attente
                            </span>
                          )}
                        </td>
                        <td>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => runOneMigration(migration.name)}
                            disabled={
                              runningMigration === migration.name ||
                              isRunningAll ||
                              status === 'success'
                            }
                          >
                            {runningMigration === migration.name ? (
                              <RefreshCw size={14} className="animate-spin" />
                            ) : (
                              <Play size={14} />
                            )}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Summary after run */}
          {runMigrations.length > 0 && (
            <div className={styles.summary}>
              <h4>Résumé de l'exécution</h4>
              <div className={styles.summaryStats}>
                <div className={styles.summaryItem}>
                  <CheckCircle size={20} style={{ color: '#22c55e' }} />
                  <span>
                    <strong>{runMigrations.length}</strong> migration(s) réussie(s)
                  </span>
                </div>
                <div className={styles.summaryItem}>
                  <Clock size={20} style={{ color: '#3b82f6' }} />
                  <span>
                    Temps total:{' '}
                    <strong>
                      {formatDuration(runMigrations.reduce((acc, m) => acc + m.time, 0))}
                    </strong>
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </PageWrapper>
  );
}
