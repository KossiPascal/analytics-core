import React from 'react';

import { Modal } from '@components/ui/Modal/Modal';
import { FormCheckbox } from '@/components/forms/FormCheckbox/FormCheckbox';

import type { VisualizationOptions } from './types';
import styles from './OptionsModal.module.css';

interface OptionsModalProps {
  isOpen: boolean;
  options: VisualizationOptions;
  onOptionsChange: (next: VisualizationOptions) => void;
  onClose: () => void;
}

export const OptionsModal: React.FC<OptionsModalProps> = ({
  isOpen,
  options,
  onOptionsChange,
  onClose,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Options d'affichage" size="sm" closeOnBackdrop>
      <div className={styles.optionsList}>
        <div className={styles.optionItem}>
          <FormCheckbox
            label="Afficher la légende"
            checked={options.showLegend}
            onChange={(event) => onOptionsChange({ ...options, showLegend: event.target.checked })}
          />
        </div>
        <div className={styles.optionItem}>
          <FormCheckbox
            label="Afficher l'infobulle"
            checked={options.showTooltip}
            onChange={(event) => onOptionsChange({ ...options, showTooltip: event.target.checked })}
          />
        </div>
        <div className={styles.optionItem}>
          <FormCheckbox
            label="Afficher la grille"
            checked={options.showGrid}
            onChange={(event) => onOptionsChange({ ...options, showGrid: event.target.checked })}
          />
        </div>
        <div className={styles.optionItem}>
          <FormCheckbox
            label="Empilé"
            checked={options.stacked}
            onChange={(event) => onOptionsChange({ ...options, stacked: event.target.checked })}
          />
        </div>
        <div className={styles.optionItem}>
          <FormCheckbox
            label="Animation"
            checked={options.animation}
            onChange={(event) => onOptionsChange({ ...options, animation: event.target.checked })}
          />
        </div>
      </div>
    </Modal>
  );
};
