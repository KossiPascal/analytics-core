import { InputHTMLAttributes, ReactNode, useState, forwardRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { FormField } from '../FormField';
import styles from '../styles/forms.module.css';
import './FormInput.css';

export interface FormInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Label du champ */
  label?: string;
  /** Champ requis */
  required?: boolean;
  /** Message d'erreur */
  error?: string;
  /** Texte d'aide */
  hint?: string;
  /** Icône à gauche */
  leftIcon?: ReactNode;
  /** Icône à droite */
  rightIcon?: ReactNode;
  /** Type de champ (avec support password toggle) */
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  /** Classes CSS additionnelles pour le wrapper */
  wrapperClassName?: string;
  /** Disposition : vertical (par défaut) ou inline (label et champ alignés) */
  layout?: 'vertical' | 'inline';
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      label,
      required,
      error,
      hint,
      leftIcon,
      rightIcon,
      type = 'text',
      disabled,
      className = '',
      wrapperClassName = '',
      layout = 'vertical',
      id,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;

    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    const wrapperClasses = [
      styles.inputWrapper,
      error && styles.hasError,
      disabled && styles.disabled,
      wrapperClassName,
    ]
      .filter(Boolean)
      .join(' ');

    const inputClasses = [
      styles.input,
      leftIcon && styles.inputWithIconLeft,
      (rightIcon || isPassword) && styles.inputWithIconRight,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <FormField
        label={label}
        required={required}
        error={error}
        hint={hint}
        htmlFor={inputId}
        layout={layout}
      >
        <div className={wrapperClasses}>
          {leftIcon && <span className={styles.inputIcon}>{leftIcon}</span>}
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            disabled={disabled}
            className={inputClasses}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              className={styles.inputIconRight}
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
          {rightIcon && !isPassword && (
            <span className={styles.inputIconRight}>{rightIcon}</span>
          )}
        </div>
      </FormField>
    );
  }
);

FormInput.displayName = 'FormInput';
