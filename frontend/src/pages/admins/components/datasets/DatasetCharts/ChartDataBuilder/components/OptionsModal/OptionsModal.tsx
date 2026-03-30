import React from 'react';

import { Modal } from '@components/ui/Modal/Modal';

import type { DatasetChart, DatasetQuery } from '@/models/dataset.models';
import { VisualOptionsStep } from '../../VisualOptionsStep';
import styles from './OptionsModal.module.css';

interface OptionsModalProps {
  isOpen: boolean;
  chart: DatasetChart;
  queries?: DatasetQuery[];
  onChange: (chart: DatasetChart) => void;
  onClose: () => void;
}

export const OptionsModal: React.FC<OptionsModalProps> = ({
  isOpen,
  chart,
  queries,
  onChange,
  onClose,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Options d'affichage" size="md" closeOnBackdrop>
      <div className={styles.optionsList}>
        <VisualOptionsStep chart={chart} queries={queries} onChange={onChange} />
      </div>
    </Modal>
  );
};
