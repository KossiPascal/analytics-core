import { useState, useEffect } from 'react';
import { AlertTriangle, Database, Trash2, RefreshCw, CheckSquare, Square } from 'lucide-react';
import { Card, CardHeader, CardBody } from '@components/ui';
import { Button } from '@components/ui/Button/Button';
import { Modal } from '@components/ui/Modal/Modal';
import { useNotification } from '@/contexts/OLD/useNotification';
import { AdminApi } from '@/services/OLD/old/api.service';
import styles from '@pages/admins/AdminPage.module.css';

interface DatabaseEntity {
  name: string;
  table: string;
}

type ActionType = 'TRUNCATE' | 'DROP';

export function TruncateDatabaseTab() {
  const [entities, setEntities] = useState<DatabaseEntity[]>([]);
  const [selectedEntities, setSelectedEntities] = useState<Set<string>>(new Set());
  const [action, setAction] = useState<ActionType>('TRUNCATE');
  const [isLoading, setIsLoading] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [result, setResult] = useState<string>('');

  const { showSuccess, showError, showWarning } = useNotification();

  const CONFIRM_TEXT = 'SUPPRIMER';

  useEffect(() => {
    loadEntities();
  }, []);

  const loadEntities = async () => {
    setIsLoading(true);
    try {
      const response = await AdminApi.getDatabaseEntities();
      if (response?.status === 200) {
        setEntities((response.data as DatabaseEntity[]) || []);
      }
    } catch (error) {
      showError('Erreur lors du chargement des entités');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedEntities.size === entities.length) {
      setSelectedEntities(new Set());
    } else {
      setSelectedEntities(new Set(entities.map((e) => e.name)));
    }
  };

  const toggleSelectEntity = (name: string) => {
    const newSelected = new Set(selectedEntities);
    if (newSelected.has(name)) {
      newSelected.delete(name);
    } else {
      newSelected.add(name);
    }
    setSelectedEntities(newSelected);
  };

  const handleOpenConfirm = () => {
    if (selectedEntities.size === 0) {
      showWarning('Veuillez sélectionner au moins une entité');
      return;
    }
    setConfirmText('');
    setIsConfirmModalOpen(true);
  };

  const handleExecute = async () => {
    if (confirmText !== CONFIRM_TEXT) {
      showWarning(`Veuillez taper "${CONFIRM_TEXT}" pour confirmer`);
      return;
    }

    setIsExecuting(true);
    setResult('');

    try {
      const selectedEntityList = entities.filter((e) => selectedEntities.has(e.name));
      const response = await AdminApi.truncateDatabase({
        procide: true,
        entities: selectedEntityList,
        action,
      });

      if (response?.status === 200) {
        const actionLabel = action === 'TRUNCATE' ? 'vidées' : 'supprimées';
        showSuccess(`${selectedEntities.size} table(s) ${actionLabel} avec succès`);
        setResult(String(response.data) || 'Opération terminée avec succès');
        setSelectedEntities(new Set());
        setIsConfirmModalOpen(false);
      } else {
        setResult(String(response?.data) || 'Erreur lors de l\'opération');
        showError('Erreur lors de l\'opération');
      }
    } catch (error) {
      setResult('Erreur lors de l\'exécution de l\'opération');
      showError('Erreur lors de l\'opération');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <Card>
      <CardHeader
        title={
          <div className={styles.cardTitle}>
            <Database size={20} />
            Tronquer / Supprimer des tables
          </div>
        }
      />
      <CardBody>
        {/* Warning */}
        <div className={`${styles.alert} ${styles.alertDanger}`} style={{ marginBottom: '1.5rem' }}>
          <AlertTriangle size={20} />
          <div>
            <strong>Danger !</strong>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>
              Cette opération est extrêmement dangereuse et irréversible.
              <br />
              <strong>TRUNCATE</strong> vide le contenu des tables.
              <br />
              <strong>DROP</strong> supprime complètement les tables.
            </p>
          </div>
        </div>

        {/* Action Selection */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Action à effectuer</label>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <label
              className={styles.checkbox}
              style={{
                padding: '0.75rem 1rem',
                border: `2px solid ${action === 'TRUNCATE' ? '#f59e0b' : '#e2e8f0'}`,
                borderRadius: '0.5rem',
                backgroundColor: action === 'TRUNCATE' ? '#fef3c7' : 'transparent',
              }}
            >
              <input
                type="radio"
                name="action"
                value="TRUNCATE"
                checked={action === 'TRUNCATE'}
                onChange={() => setAction('TRUNCATE')}
              />
              <span>
                <strong>TRUNCATE</strong> - Vider les tables
              </span>
            </label>
            <label
              className={styles.checkbox}
              style={{
                padding: '0.75rem 1rem',
                border: `2px solid ${action === 'DROP' ? '#ef4444' : '#e2e8f0'}`,
                borderRadius: '0.5rem',
                backgroundColor: action === 'DROP' ? '#fee2e2' : 'transparent',
              }}
            >
              <input
                type="radio"
                name="action"
                value="DROP"
                checked={action === 'DROP'}
                onChange={() => setAction('DROP')}
              />
              <span>
                <strong>DROP</strong> - Supprimer les tables
              </span>
            </label>
          </div>
        </div>

        {/* Entity Selection */}
        <div className={styles.formGroup}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className={styles.formLabel}>
              Tables à traiter ({selectedEntities.size}/{entities.length} sélectionnées)
            </label>
            <div className={styles.buttonGroup}>
              <Button variant="ghost" size="sm" onClick={loadEntities} disabled={isLoading}>
                <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              </Button>
              <Button variant="outline" size="sm" onClick={toggleSelectAll}>
                {selectedEntities.size === entities.length ? (
                  <>
                    <CheckSquare size={14} />
                    Désélectionner
                  </>
                ) : (
                  <>
                    <Square size={14} />
                    Tout sélectionner
                  </>
                )}
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className={styles.loading}>
              <RefreshCw size={24} className="animate-spin" />
            </div>
          ) : entities.length === 0 ? (
            <div className={styles.emptyState}>
              <Database size={48} />
              <p>Aucune entité trouvée</p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '0.5rem',
                maxHeight: '300px',
                overflowY: 'auto',
                padding: '0.5rem',
                border: '1px solid #e2e8f0',
                borderRadius: '0.5rem',
              }}
            >
              {entities.map((entity) => (
                <label
                  key={entity.name}
                  className={styles.checkbox}
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.375rem',
                    backgroundColor: selectedEntities.has(entity.name) ? '#fee2e2' : 'transparent',
                    border: `1px solid ${selectedEntities.has(entity.name) ? '#ef4444' : 'transparent'}`,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedEntities.has(entity.name)}
                    onChange={() => toggleSelectEntity(entity.name)}
                  />
                  <span style={{ fontSize: '0.875rem' }}>{entity.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Execute Button */}
        <div style={{ marginTop: '1.5rem' }}>
          <Button
            variant="danger"
            onClick={handleOpenConfirm}
            disabled={selectedEntities.size === 0}
          >
            <Trash2 size={16} />
            {action === 'TRUNCATE' ? 'Vider' : 'Supprimer'} les tables sélectionnées
          </Button>
        </div>

        {/* Result */}
        {result && (
          <div
            className={`${styles.alert} ${styles.alertInfo}`}
            style={{ marginTop: '1.5rem' }}
          >
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
              {result}
            </pre>
          </div>
        )}
      </CardBody>

      {/* Confirm Modal */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Confirmation requise"
      >
        <div className={styles.form}>
          <div className={`${styles.alert} ${styles.alertDanger}`}>
            <AlertTriangle size={20} />
            <div>
              <strong>ATTENTION !</strong>
              <p style={{ margin: '0.5rem 0 0 0' }}>
                Vous êtes sur le point de{' '}
                <strong>{action === 'TRUNCATE' ? 'VIDER' : 'SUPPRIMER'}</strong>{' '}
                <strong>{selectedEntities.size}</strong> table(s) :
              </p>
              <ul style={{ margin: '0.5rem 0', paddingLeft: '1.25rem' }}>
                {Array.from(selectedEntities)
                  .slice(0, 5)
                  .map((name) => (
                    <li key={name} style={{ fontSize: '0.875rem' }}>
                      {name}
                    </li>
                  ))}
                {selectedEntities.size > 5 && (
                  <li style={{ fontSize: '0.875rem' }}>
                    ... et {selectedEntities.size - 5} autres
                  </li>
                )}
              </ul>
              <p style={{ margin: '0.5rem 0 0 0', fontWeight: 600 }}>
                Cette action est IRRÉVERSIBLE !
              </p>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Tapez <strong>{CONFIRM_TEXT}</strong> pour confirmer
            </label>
            <input
              type="text"
              className={styles.formInput}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={CONFIRM_TEXT}
              style={{
                borderColor: confirmText === CONFIRM_TEXT ? '#22c55e' : undefined,
              }}
            />
          </div>

          <div className={styles.buttonGroup}>
            <Button variant="outline" onClick={() => setIsConfirmModalOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="danger"
              onClick={handleExecute}
              disabled={confirmText !== CONFIRM_TEXT || isExecuting}
            >
              {isExecuting ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Exécution...
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  {action === 'TRUNCATE' ? 'Vider' : 'Supprimer'} définitivement
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}
