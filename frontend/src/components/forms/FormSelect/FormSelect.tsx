import { useState, useRef, useEffect, ReactNode, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, X } from 'lucide-react';
import { FormField } from '../FormField/FormField';
import styles from '../styles/forms.module.css';

export interface SelectOption {
  value: any;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface FormSelectProps <T>{
  name?: string;
  /** Label du champ */
  label?: string;
  /** Champ requis */
  required?: boolean;
  /** Message d'erreur */
  error?: string;
  /** Texte d'aide */
  hint?: string;
  /** Options du select */
  options: SelectOption[];
  /** Valeur sélectionnée */
  value?: T;
  /** Callback de changement */
  onChange?: (value: T) => void;
  /** Placeholder */
  placeholder?: string;
  /** Activer la recherche/autocomplétion */
  searchable?: boolean;
  /** Placeholder de recherche */
  searchPlaceholder?: string;
  /** Désactivé */
  disabled?: boolean;
  /** Icône à gauche */
  leftIcon?: ReactNode;
  /** ID */
  id?: string;
  /** Classes CSS additionnelles */
  className?: string;
  /** Classes CSS pour le wrapper */
  wrapperClassName?: string;
  /** Disposition : vertical (par défaut) ou inline (label et champ alignés) */
  layout?: 'vertical' | 'inline';
  /** Variante visuelle : 'dark' pour fond sombre (ex: header) */
  variant?: 'default' | 'dark';
}

export function FormSelect<T=any>({
  name,
  label,
  required,
  error,
  hint,
  options,
  value,
  onChange,
  placeholder = 'Sélectionner...',
  searchable = true,
  searchPlaceholder = 'Rechercher...',
  disabled = false,
  leftIcon,
  id,
  className = '',
  wrapperClassName = '',
  layout = 'vertical',
  variant = 'default',
}: FormSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const updateDropdownPosition = useCallback(() => {
    if (!wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const maxH = 260;
    const openUpward = spaceBelow < maxH && rect.top > maxH;
    setDropdownStyle({
      position: 'fixed',
      left: rect.left,
      width: rect.width,
      right: 'auto',
      zIndex: 9999,
      ...(openUpward ? { bottom: window.innerHeight - rect.top + 4 } : { top: rect.bottom + 4 }),
    });
  }, []);

  const filteredOptions = searchTerm
    ? options.filter((opt) =>
      opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    )
    : options;

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) updateDropdownPosition();
    setIsOpen(!isOpen);
    if (!isOpen) setSearchTerm('');
  };

  const handleSelect = (option: SelectOption) => {
    if (option.disabled) return;
    onChange?.(option.value);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.('' as T);
  };

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current && !wrapperRef.current.contains(event.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reposition on scroll/resize
  useEffect(() => {
    if (!isOpen) return;
    const update = () => updateDropdownPosition();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [isOpen, updateDropdownPosition]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);


  const inputIdRef = useRef(id || `select-${Math.random().toString(36).substr(2, 9)}`);
  const inputId = inputIdRef.current;

  const wrapperClasses = [
    styles.inputWrapper,
    error && styles.hasError,
    disabled && styles.disabled,
    wrapperClassName,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <FormField
      name={name}
      label={label}
      required={required}
      error={error}
      hint={hint}
      htmlFor={inputId}
      layout={layout}
    >
      <div className={`${styles.selectWrapper} ${className}`} ref={wrapperRef}>
        <div
          className={wrapperClasses}
          onClick={handleToggle}
          style={variant === 'dark' ? {
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: 8,
            color: 'white',
            boxShadow: 'none',
            height: '100%',
            minHeight: 34,
          } : undefined}
        >
          {leftIcon && <span className={styles.inputIcon}>{leftIcon}</span>}
          <div
            id={inputId}
            className={`${styles.selectTrigger} ${leftIcon ? styles.hasIconLeft : ''}`}
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            style={variant === 'dark' ? { color: 'white', fontSize: '0.8rem' } : undefined}
          >
            {selectedOption ? (
              <span className={styles.selectValue} style={variant === 'dark' ? { color: 'white' } : undefined}>
                {selectedOption.icon && (
                  <span className={styles.selectOptionIcon}>{selectedOption.icon}</span>
                )}
                {selectedOption.label}
              </span>
            ) : (
              <span className={styles.selectPlaceholder} style={variant === 'dark' ? { color: 'rgba(255,255,255,0.5)' } : undefined}>{placeholder}</span>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              {value && !disabled && (
                <span
                  className={styles.inputIconRight}
                  onClick={handleClear}
                  style={{ position: 'static', padding: '0.125rem' }}
                >
                  <X size={14} />
                </span>
              )}
              <span className={`${styles.selectArrow} ${isOpen ? styles.open : ''}`}>
                <ChevronDown size={18} />
              </span>
            </div>
          </div>
        </div>

        {isOpen && createPortal(
          <div
            ref={dropdownRef}
            className={styles.selectDropdown}
            role="listbox"
            style={{
              ...dropdownStyle,
              ...(variant === 'dark' ? { background: '#1e293b', border: '1px solid rgba(255,255,255,0.15)', color: 'white' } : {}),
            }}
          >
            {searchable && (
              <div style={{ position: 'relative' }}>
                <Search
                  size={14}
                  style={{
                    position: 'absolute',
                    left: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--form-text-muted)',
                  }}
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  className={styles.selectSearch}
                  style={{ paddingLeft: '2rem' }}
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
            {filteredOptions.length === 0 ? (
              <div className={styles.selectNoResults}>Aucun résultat</div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={`${styles.selectOption} ${option.value === value ? styles.selected : ''
                    } ${option.disabled ? styles.disabled : ''} ${variant === 'dark' ? styles.selectOptionDark : ''}`}
                  onClick={() => handleSelect(option)}
                  role="option"
                  aria-selected={option.value === value}
                  style={variant === 'dark' && option.value !== value ? { color: '#cbd5e1' } : undefined}
                >
                  {option.icon && (
                    <span className={styles.selectOptionIcon}>{option.icon}</span>
                  )}
                  {option.label}
                </div>
              ))
            )}
          </div>,
          document.body
        )}
      </div>
    </FormField>
  );
}
