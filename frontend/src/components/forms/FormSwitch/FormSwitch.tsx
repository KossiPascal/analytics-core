import { InputHTMLAttributes, forwardRef } from 'react';
import styles from '../styles/forms.module.css';

export interface FormSwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /** Label du switch */
  label?: string;
  /** Description additionnelle */
  description?: string;
  /** Taille du switch */
  size?: 'sm' | 'md' | 'lg';
  /** Classes CSS additionnelles */
  wrapperClassName?: string;
}

export const FormSwitch = forwardRef<HTMLInputElement, FormSwitchProps>(
  (
    {
      label,
      description,
      size = 'md',
      disabled,
      className = '',
      wrapperClassName = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `switch-${Math.random().toString(36).substr(2, 9)}`;

    const sizeClasses = {
      sm: styles.switchSm,
      md: styles.switchMd,
      lg: styles.switchLg,
    };

    const wrapperClasses = [
      styles.switchWrapper,
      disabled && styles.disabled,
      wrapperClassName,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={wrapperClasses}>
        <label className={styles.switchLabel} htmlFor={inputId}>
          <div className={`${styles.switchTrack} ${sizeClasses[size]}`}>
            <input
              ref={ref}
              id={inputId}
              type="checkbox"
              disabled={disabled}
              className={`${styles.switchInput} ${className}`}
              {...props}
            />
            <span className={styles.switchThumb} />
          </div>
          {(label || description) && (
            <div className={styles.switchContent}>
              {label && <span className={styles.switchText}>{label}</span>}
              {description && <span className={styles.switchDescription}>{description}</span>}
            </div>
          )}
        </label>
      </div>
    );
  }
);

FormSwitch.displayName = 'FormSwitch';
