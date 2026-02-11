import { InputHTMLAttributes, ReactNode, useState, forwardRef, useRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { FormField } from '../FormField/FormField';
import styles from '../styles/forms.module.css';
import './FormInput.css';
import { FormCheckbox } from '../FormCheckbox/FormCheckbox';
import { FormSelect } from '../FormSelect/FormSelect';
import { FormTextarea } from '../FormTextarea/FormTextarea';

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


interface SelectModel {
  value: any;
  label: string;
}

interface FieldProps {
  label: string;
  name: string;
  value: any;
  onChange: (value: any) => void;
  placeholder?: string;
  required?: boolean;
  list?: SelectModel[]
  icon?: React.ReactNode;
  type?: 'text' | 'textarea' | 'number' | 'password' | 'checkbox' | 'select';
  cols?: number | undefined
  rows?: number | undefined
  simple?: boolean
}


const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
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

    const inputIdRef = useRef(id || `input-${Math.random().toString(36).substr(2, 9)}`);
    const inputId = inputIdRef.current;

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
            className={`form-input ${inputClasses}`}
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

const FormInputMultiple = forwardRef<FieldProps, FieldProps>(function Field({ label, name, value, onChange, type = "text", list = undefined, placeholder = undefined, rows = undefined, cols = undefined, required = false, icon = null, simple = false }) {

  value = value ?? "";
  const id = "host_" + name;
  let InputElement = <></>;

  if (type === 'textarea') {
    InputElement = (
      <FormTextarea
        label={label}
        required={required}
        rows={rows}
        cols={cols}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  } else if (type === 'checkbox') {
    InputElement = (
      <FormCheckbox
        label={label}
        checked={Boolean(value)}
        onChange={(e) => onChange(e.target.checked)}
      />
    );
  } else if (type === 'select') {
    InputElement = (
      <FormSelect
        label={label}
        required={required}
        leftIcon={icon}
        options={(list || []).map((item) => ({
          value: String(item.value),
          label: item.label,
        }))}
        value={String(value ?? '')}
        onChange={(val) => onChange(val)}
      />
    );
  } else {
    InputElement = (
      <FormInput
        label={label}
        required={required}
        type={type === 'number' ? 'number' : type}
        value={value}
        placeholder={placeholder}
        leftIcon={icon}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  /* ---------- SIMPLE MODE ---------- */
  if (simple) return InputElement;

  /* ---------- FULL MODE ---------- */
  return (
    <div className={styles.formGroup}>
      {InputElement}
    </div>
  );
});

FormInput.displayName = 'FormInput';

FormInputMultiple.displayName = "FormInputMultiple";

export { FormInput, FormInputMultiple };