import React from 'react';

import { Modal } from '@components/ui/Modal/Modal';
import styles from './VisualizationTypeModal.module.css';
import type { ChartTypeOption, ChartVariant } from './types';

interface VisualizationTypeModalProps {
  isOpen: boolean;
  chartTypes: ChartTypeOption[];
  selectedChartType: ChartVariant;
  onClose: () => void;
  onSelectChartType: (type: ChartVariant) => void;
}

export const VisualizationTypeModal: React.FC<VisualizationTypeModalProps> = ({
  isOpen,
  chartTypes,
  selectedChartType,
  onClose,
  onSelectChartType,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Choisir le type de visualisation" size="md" closeOnBackdrop>
      <div className={styles.visualizationTypeOptions}>
        {chartTypes.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`${styles.visualizationTypeOption} ${selectedChartType === option.id ? styles.visualizationTypeOptionActive : ''}`}
            onClick={() => {
              onSelectChartType(option.id);
              onClose();
            }}
          >
            <div className={styles.visualizationTypeOptionTitle}>
              {option.icon}
              <span>{option.name}</span>
            </div>
            <p className={styles.visualizationTypeOptionDescription}>{option.description}</p>
          </button>
        ))}
      </div>
    </Modal>
  );
};
