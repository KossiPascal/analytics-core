import React, { useEffect, useState } from 'react';
import { FileText, LayoutDashboard, Save, Edit3 } from 'lucide-react';

import { Modal } from '@/components/ui/Modal/Modal';
import { FormInput } from '@/components/forms/FormInput/FormInput';

import type { VisualizationType } from '../types';
import styles from './SaveModal.module.css';

interface SaveModalProps {
  isOpen: boolean;
  isEditing: boolean;
  initialName: string;
  initialDescription: string;
  initialVisualizationType: VisualizationType;
  onClose: () => void;
  onConfirm: (name: string, description: string, visualizationType: VisualizationType) => void;
}

export const SaveModal: React.FC<SaveModalProps> = ({
  isOpen,
  isEditing,
  initialName,
  initialDescription,
  initialVisualizationType,
  onClose,
  onConfirm,
}) => {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [vizType, setVizType] = useState<VisualizationType>(initialVisualizationType);

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setDescription(initialDescription);
      setVizType(initialVisualizationType);
    }
  }, [isOpen, initialName, initialDescription, initialVisualizationType]);

  const handleSubmit = () => {
    onConfirm(name, description, vizType);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Modifier la visualisation' : 'Enregistrer la visualisation'}
      size="md"
      closeOnBackdrop
    >
      <div className={styles.form}>
        <FormInput
          label="Nom de la visualisation"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Entrez un nom..."
        />

        <FormInput
          label="Description (optionnel)"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Décrivez votre visualisation..."
        />

        <div className={styles.typeSelector}>
          <span className={styles.typeLabel}>Type de visualisation</span>
          <div className={styles.typeOptions}>
            <button
              type="button"
              className={`${styles.typeOption} ${vizType === 'dashboard' ? styles.typeOptionActive : ''}`}
              onClick={() => setVizType('dashboard')}
            >
              <LayoutDashboard size={16} />
              Tableau de bord
            </button>
            <button
              type="button"
              className={`${styles.typeOption} ${vizType === 'report' ? styles.typeOptionActive : ''}`}
              onClick={() => setVizType('report')}
            >
              <FileText size={16} />
              Rapport
            </button>
          </div>
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.btnOutline} onClick={onClose}>
            Annuler
          </button>
          <button type="button" className={styles.btnPrimary} onClick={handleSubmit}>
            {isEditing ? <Edit3 size={16} /> : <Save size={16} />}
            {isEditing ? 'Modifier' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
