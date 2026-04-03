import React from 'react';

import { Modal } from '@/components/ui/Modal/Modal';

import type { StoredVisualization } from '../types';
import styles from './SavedVisualizationsModal.module.css';

interface SavedVisualizationsModalProps {
  isOpen: boolean;
  savedVisualizations: StoredVisualization[];
  onClose: () => void;
  onSelect: (visualization: StoredVisualization) => void;
}

export const SavedVisualizationsModal: React.FC<SavedVisualizationsModalProps> = ({
  isOpen,
  savedVisualizations,
  onClose,
  onSelect,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Visualisations sauvegardées" size="md" closeOnBackdrop>
      {savedVisualizations.length === 0 ? (
        <div className={styles.empty}>Aucune visualisation sauvegardée.</div>
      ) : (
        <div className={styles.list}>
          {savedVisualizations.map((viz) => (
            <button
              key={viz.id}
              type="button"
              className={styles.item}
              onClick={() => {
                onSelect(viz);
                onClose();
              }}
            >
              <div className={styles.itemTitle}>{viz.name}</div>
              {viz.description && <div className={styles.itemDescription}>{viz.description}</div>}
              <div className={styles.itemMeta}>
                <span>{viz.chartType}</span>
                <span>&bull;</span>
                <span>{viz.type === 'dashboard' ? 'Tableau de bord' : 'Rapport'}</span>
                <span>&bull;</span>
                <span>{new Date(viz.updatedAt).toLocaleDateString()}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
};
