import React, { type ChangeEvent } from 'react';
import { FileText, Layers, LayoutDashboard } from 'lucide-react';

import { FormInput } from '@/components/forms/FormInput/FormInput';

import baseStyles from '@pages/builders/DashboardBuilder/DashboardBuilder.module.css';
import styles from './BuilderHeader.module.css';
import type { VisualizationType } from './types';

const VISUALIZATION_TYPE_LABELS: Record<VisualizationType, string> = {
  dashboard: 'Tableau de bord',
  report: 'Rapport',
};

interface BuilderHeaderProps {
  name: string;
  description: string;
  visualizationType: VisualizationType;
  onNameChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onDescriptionChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onOpenTypeModal: () => void;
}

export const BuilderHeader: React.FC<BuilderHeaderProps> = ({
  name,
  description,
  visualizationType,
  onNameChange,
  onDescriptionChange,
  onOpenTypeModal,
}) => {
  const typeIcon = visualizationType === 'dashboard' ? <LayoutDashboard size={14} /> : <FileText size={14} />;

  return (
    <div className={baseStyles.card}>
      <div className={baseStyles.cardHeader}>
        <h2 className={baseStyles.cardTitle}>
          <Layers size={24} />
          Créateur de visualisation
        </h2>
      </div>

      <div className={baseStyles.form}>
        <div className={styles.typeSummary}>
          <div className={styles.typeLabel}>
            <span className={styles.typeLabelText}>Type sélectionné</span>
            <span className={styles.typeBadge}>
              {typeIcon}
              {VISUALIZATION_TYPE_LABELS[visualizationType]}
            </span>
          </div>
          <button type="button" className={styles.typeChangeBtn} onClick={onOpenTypeModal}>
            Changer le type
          </button>
        </div>

        <div className={`${baseStyles.grid} ${baseStyles.grid2}`}>
          <FormInput
            label="Nom de la visualisation"
            value={name}
            onChange={onNameChange}
            placeholder="Entrez un nom..."
          />
          <FormInput
            label="Description (optionnel)"
            value={description}
            onChange={onDescriptionChange}
            placeholder="Décrivez votre visualisation..."
          />
        </div>
      </div>
    </div>
  );
};
