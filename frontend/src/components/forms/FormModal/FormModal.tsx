import { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Modal } from '@components/ui/Modal/Modal';
import { Button } from '@components/ui/Button/Button';
import type { ButtonVariant } from '@components/ui/Button/Button';
import shared from '@components/ui/styles/shared.module.css';

export interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: ReactNode;

  /** Messages d'erreur à afficher en bannière en haut du formulaire */
  errors?: string[];

  /** Handler appelé lors du clic sur le bouton soumettre */
  onSubmit: (e?: React.FormEvent) => void;
  /** Désactive le bouton soumettre quand les champs requis ne sont pas remplis */
  isSubmitDisabled?: boolean;
  /** Affiche un spinner sur le bouton soumettre */
  isLoading?: boolean;
  /** Texte du bouton soumettre */
  submitLabel?: string;
  /** Icône du bouton soumettre */
  submitIcon?: ReactNode;
  /** Variante du bouton soumettre */
  submitVariant?: ButtonVariant;

  /** Texte du bouton annuler */
  cancelLabel?: string;

  /** Override complet du footer (pour cas spéciaux) */
  footer?: ReactNode;
}

export function FormModal({
  isOpen,
  onClose,
  title,
  size = 'md',
  children,
  errors,
  onSubmit,
  isSubmitDisabled = false,
  isLoading = false,
  submitLabel = 'Enregistrer',
  submitIcon,
  submitVariant = 'primary',
  cancelLabel = 'Annuler',
  footer,
}: FormModalProps) {
  const hasErrors = errors && errors.length > 0;

  const defaultFooter = (
    <div className={shared.modalFooter}>
      <Button variant="outline" size="sm" onClick={onClose} type="button">
        {cancelLabel}
      </Button>
      <Button
        variant={submitVariant}
        size="sm"
        onClick={() => onSubmit()}
        isLoading={isLoading}
        disabled={isSubmitDisabled || isLoading}
        type="button"
      >
        {submitIcon}
        {submitLabel}
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size={size}
      footer={footer ?? defaultFooter}
    >
      {hasErrors && (
        <div
          style={{
            background: 'rgba(220, 38, 38, 0.08)',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            borderRadius: '0.5rem',
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'flex-start',
          }}
        >
          <AlertCircle
            size={16}
            color="var(--form-error, #dc2626)"
            style={{ flexShrink: 0, marginTop: '0.125rem' }}
          />
          <div>
            {errors!.length === 1 ? (
              <p
                style={{
                  color: 'var(--form-error, #dc2626)',
                  fontSize: '0.875rem',
                  margin: 0,
                }}
              >
                {errors![0]}
              </p>
            ) : (
              <ul
                style={{
                  color: 'var(--form-error, #dc2626)',
                  fontSize: '0.875rem',
                  margin: 0,
                  paddingLeft: '1.25rem',
                }}
              >
                {errors!.map((msg, i) => (
                  <li key={i}>{msg}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
      {children}
    </Modal>
  );
}
