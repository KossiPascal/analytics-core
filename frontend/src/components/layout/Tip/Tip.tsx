import React, { useState } from 'react';

import { Modal } from '@components/ui/Modal/Modal';
import styles from './Tip.module.css';

export type TipImportance = 'low' | 'medium' | 'high';
export type TipSize = 'sm' | 'md' | 'lg';

interface TipProps {
  message: React.ReactNode;
  title?: string;
  importance?: TipImportance;
  size?: TipSize;
  color?: string;
  className?: string;
  modalTitle?: string;
  showInlineMessage?: boolean;
}

export const Tip: React.FC<TipProps> = ({
  message,
  title = 'Astuce',
  importance = 'low',
  size = 'md',
  color,
  className,
  modalTitle,
  showInlineMessage = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={`${styles.tip} ${styles[`tip-${importance}`]} ${styles[`tip-${size}`]} ${showInlineMessage ? styles.tipWithMessage : ''} ${className ?? ''}`}
        style={color ? ({ '--tip-color': color } as React.CSSProperties) : undefined}
        onClick={() => setIsOpen(true)}
        title={title}
        aria-label={title}
      >
        <span className={styles.icon} aria-hidden="true">i</span>
        {showInlineMessage && (
          <span className={styles.content}>
            <strong>{title} :</strong> {message}
          </span>
        )}
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={modalTitle ?? title}
        size="sm"
        closeOnBackdrop
      >
        <div className={styles.modalBody}>
          <span className={styles.icon} aria-hidden="true">i</span>
          <p>{message}</p>
        </div>
      </Modal>
    </>
  );
};
