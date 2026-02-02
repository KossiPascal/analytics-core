import { useState } from 'react';
import type { ReportType } from '@/models/OLD/old/reports.types';
import type { ReportStatus } from '@stores/OLD/reports.store';
import styles from './ReportHeader.module.css';

interface ReportHeaderProps {
  reportName: ReportType;
  reportTitle: string;
  status: ReportStatus;
  canValidate?: boolean;
  canSendToDhis2?: boolean;
  onValidate?: () => void;
  onCancelValidation?: () => void;
  onSendToDhis2?: () => void;
  onHideZeroChange?: (hide: boolean) => void;
  onExport?: () => void;
  tableId?: string;
}

export function ReportHeader({
  reportTitle,
  status,
  canValidate = false,
  canSendToDhis2 = false,
  onValidate,
  onCancelValidation,
  onSendToDhis2,
  onHideZeroChange,
  onExport,
}: ReportHeaderProps) {
  const [hideZero, setHideZero] = useState(false);

  const handleHideZeroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setHideZero(checked);
    onHideZeroChange?.(checked);
  };

  return (
    <div className={styles.header}>
      <h2 className={styles.title}>{reportTitle}</h2>

      <div className={styles.actions}>
        {/* Hide Zero Checkbox */}
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={hideZero}
            onChange={handleHideZeroChange}
            className={styles.checkbox}
          />
          <span>Masquer les zeros</span>
        </label>

        {/* Export Button */}
        {onExport && (
          <button className={styles.exportButton} onClick={onExport}>
            <span className={styles.icon}>&#128190;</span>
            Exporter
          </button>
        )}

        {/* Validation Status */}
        <div className={styles.statusBadge}>
          {status.isValidated ? (
            <span className={styles.validated}>Valide</span>
          ) : (
            <span className={styles.notValidated}>Non valide</span>
          )}
        </div>

        {status.isOnDhis2 && (
          <div className={`${styles.statusBadge} ${styles.dhis2Badge}`}>
            <span className={styles.onDhis2}>Sur DHIS2</span>
          </div>
        )}

        {/* Validate/Cancel Buttons */}
        {canValidate && !status.isValidated && (
          <button
            className={styles.validateButton}
            onClick={onValidate}
            disabled={status.isValidating}
          >
            {status.isValidating ? (
              <>
                <span className={styles.spinner} />
                Validation...
              </>
            ) : (
              <>
                <span className={styles.icon}>&#10003;</span>
                Valider
              </>
            )}
          </button>
        )}

        {canValidate && status.isValidated && !status.isOnDhis2 && (
          <button
            className={styles.cancelButton}
            onClick={onCancelValidation}
            disabled={status.isCancellingValidation}
          >
            {status.isCancellingValidation ? (
              <>
                <span className={styles.spinner} />
                Annulation...
              </>
            ) : (
              <>
                <span className={styles.icon}>&#10007;</span>
                Annuler validation
              </>
            )}
          </button>
        )}

        {/* Send to DHIS2 Button */}
        {canSendToDhis2 && status.isValidated && !status.isOnDhis2 && (
          <button
            className={styles.dhis2Button}
            onClick={onSendToDhis2}
            disabled={status.isSendingToDhis2}
          >
            {status.isSendingToDhis2 ? (
              <>
                <span className={styles.spinner} />
                Envoi...
              </>
            ) : (
              <>
                <span className={styles.icon}>&#8593;</span>
                Envoyer au DHIS2
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default ReportHeader;
