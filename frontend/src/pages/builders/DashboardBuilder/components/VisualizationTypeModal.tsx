import React, { type ReactNode } from 'react';
import { FileText, LayoutDashboard } from 'lucide-react';

import { Modal } from '@components/ui/Modal/Modal';
import styles from './VisualizationTypeModal.module.css';
import type { VisualizationType } from './types';

interface VisualizationTypeModalProps {
  isOpen: boolean;
  selectedType: VisualizationType;
  onClose: () => void;
  onSelectType: (type: VisualizationType) => void;
}

const TYPE_OPTIONS: Array<{
  id: VisualizationType;
  title: string;
  description: string;
  icon: ReactNode;
}> = [
  {
    id: 'dashboard',
    title: 'Tableau de bord',
    description: 'Visualisations pour le suivi opérationnel.',
    icon: <LayoutDashboard size={18} />,
  },
  {
    id: 'report',
    title: 'Rapport',
    description: 'Visualisations orientées reporting.',
    icon: <FileText size={18} />,
  },
];

export const VisualizationTypeModal: React.FC<VisualizationTypeModalProps> = ({
  isOpen,
  selectedType,
  onClose,
  onSelectType,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Choisir le type de visualisation" size="md" closeOnBackdrop>
      <div className={styles.visualizationTypeOptions}>
        {TYPE_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`${styles.visualizationTypeOption} ${selectedType === option.id ? styles.visualizationTypeOptionActive : ''}`}
            onClick={() => {
              onSelectType(option.id);
              onClose();
            }}
          >
            <div className={styles.visualizationTypeOptionTitle}>
              {option.icon}
              <span>{option.title}</span>
            </div>
            <p className={styles.visualizationTypeOptionDescription}>{option.description}</p>
          </button>
        ))}
      </div>
    </Modal>
  );
};
