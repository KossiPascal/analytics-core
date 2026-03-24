import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, Info } from 'lucide-react';

type Variant = 'danger' | 'warning' | 'info';

interface ConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: Variant;
}

const VARIANT_CONFIG = {
  danger: {
    icon: <Trash2 size={22} />,
    iconBg: '#fef2f2',
    iconColor: '#dc2626',
    confirmBg: '#dc2626',
    confirmHover: '#b91c1c',
    borderColor: '#fca5a5',
  },
  warning: {
    icon: <AlertTriangle size={22} />,
    iconBg: '#fffbeb',
    iconColor: '#d97706',
    confirmBg: '#d97706',
    confirmHover: '#b45309',
    borderColor: '#fcd34d',
  },
  info: {
    icon: <Info size={22} />,
    iconBg: '#eff6ff',
    iconColor: '#2563eb',
    confirmBg: '#2563eb',
    confirmHover: '#1d4ed8',
    borderColor: '#93c5fd',
  },
};

export function ConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
  title = 'Confirmer la suppression',
  message = 'Cette action est irréversible. Êtes-vous sûr de vouloir continuer ?',
  confirmLabel = 'Supprimer',
  cancelLabel = 'Annuler',
  variant = 'danger',
}: ConfirmModalProps) {
  const cfg = VARIANT_CONFIG[variant];

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="confirm-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            style={{
              position: 'fixed', inset: 0, zIndex: 10000,
              background: 'rgba(15,23,42,0.55)',
              backdropFilter: 'blur(3px)',
            }}
          />

          {/* Modal */}
          <motion.div
            key="confirm-panel"
            initial={{ opacity: 0, scale: 0.88, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: -20 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            style={{
              position: 'fixed', zIndex: 10001,
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '100%', maxWidth: 420,
              background: 'white',
              borderRadius: 16,
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
              overflow: 'hidden',
            }}
          >
            {/* Barre de couleur top */}
            <div style={{ height: 4, background: cfg.confirmBg }} />

            <div style={{ padding: '1.75rem 1.5rem 1.5rem' }}>
              {/* Icône + Titre */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{
                  width: 46, height: 46, borderRadius: 12, flexShrink: 0,
                  background: cfg.iconBg, border: `1px solid ${cfg.borderColor}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: cfg.iconColor,
                }}>
                  {cfg.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>{title}</div>
                  <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: 2 }}>{message}</div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.625rem', marginTop: '1.25rem' }}>
                <button
                  onClick={onCancel}
                  style={{
                    padding: '0.5rem 1.125rem', borderRadius: 8, fontWeight: 600,
                    fontSize: '0.85rem', cursor: 'pointer',
                    border: '1px solid #e2e8f0', background: 'white', color: '#475569',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f1f5f9')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                >
                  {cancelLabel}
                </button>
                <button
                  onClick={onConfirm}
                  style={{
                    padding: '0.5rem 1.125rem', borderRadius: 8, fontWeight: 700,
                    fontSize: '0.85rem', cursor: 'pointer',
                    border: 'none', background: cfg.confirmBg, color: 'white',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = cfg.confirmHover)}
                  onMouseLeave={e => (e.currentTarget.style.background = cfg.confirmBg)}
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
