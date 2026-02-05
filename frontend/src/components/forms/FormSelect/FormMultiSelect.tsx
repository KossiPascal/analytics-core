import { useState, useRef, useEffect, ReactNode } from 'react';
import { ChevronDown, Search, X, Check } from 'lucide-react';
import { FormField } from '../FormField/FormField';
import styles from '../styles/forms.module.css';

export interface MultiSelectOption {
  value: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface FormMultiSelectProps {
  /** Label du champ */
  label?: string;
  /** Champ requis */
  required?: boolean;
  /** Message d'erreur */
  error?: string;
  /** Texte d'aide */
  hint?: string;
  /** Options du select */
  options: MultiSelectOption[];
  /** Valeurs sélectionnées */
  value?: string[];
  /** Callback de changement */
  onChange?: (values: string[]) => void;
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
  /** Nombre max de tags visibles */
  maxTagsVisible?: number;
  /** ID */
  id?: string;
  /** Classes CSS additionnelles */
  className?: string;
  /** Classes CSS pour le wrapper */
  wrapperClassName?: string;
  /** Disposition : vertical (par défaut) ou inline (label et champ alignés) */
  layout?: 'vertical' | 'inline';
}

export function FormMultiSelect({
  label,
  required,
  error,
  hint,
  options,
  value = [],
  onChange,
  placeholder = 'Sélectionner...',
  searchable = false,
  searchPlaceholder = 'Rechercher...',
  disabled = false,
  leftIcon,
  maxTagsVisible = 3,
  id,
  className = '',
  wrapperClassName = '',
  layout = 'vertical',
}: FormMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOptions = options.filter((opt) => value.includes(opt.value));

  const filteredOptions = searchTerm
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchTerm('');
    }
  };

  const handleSelect = (option: MultiSelectOption) => {
    if (option.disabled) return;

    const isSelected = value.includes(option.value);
    const newValues = isSelected
      ? value.filter((v) => v !== option.value)
      : [...value, option.value];

    onChange?.(newValues);
  };

  const handleRemoveTag = (e: React.MouseEvent, optionValue: string) => {
    e.stopPropagation();
    onChange?.(value.filter((v) => v !== optionValue));
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.([]);
  };

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const inputId = id || `multiselect-${Math.random().toString(36).substr(2, 9)}`;

  const wrapperClasses = [
    styles.inputWrapper,
    error && styles.hasError,
    disabled && styles.disabled,
    wrapperClassName,
  ]
    .filter(Boolean)
    .join(' ');

  const visibleTags = selectedOptions.slice(0, maxTagsVisible);
  const hiddenCount = selectedOptions.length - maxTagsVisible;

  return (
    <FormField
      label={label}
      required={required}
      error={error}
      hint={hint}
      htmlFor={inputId}
      layout={layout}
    >
      <div className={`${styles.selectWrapper} ${className}`} ref={wrapperRef}>
        <div className={wrapperClasses} onClick={handleToggle}>
          {leftIcon && <span className={styles.inputIcon}>{leftIcon}</span>}
          <div
            id={inputId}
            className={`${styles.selectTrigger} ${leftIcon ? styles.hasIconLeft : ''}`}
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            style={{ padding: '0.5rem 1rem', minHeight: '3rem' }}
          >
            {selectedOptions.length > 0 ? (
              <div className={styles.multiSelectTags}>
                {visibleTags.map((opt) => (
                  <span key={opt.value} className={styles.multiSelectTag}>
                    {opt.label}
                    <span
                      className={styles.multiSelectTagRemove}
                      onClick={(e) => handleRemoveTag(e, opt.value)}
                    >
                      <X size={10} />
                    </span>
                  </span>
                ))}
                {hiddenCount > 0 && (
                  <span className={styles.multiSelectTag}>
                    +{hiddenCount}
                  </span>
                )}
              </div>
            ) : (
              <span className={styles.multiSelectPlaceholder}>{placeholder}</span>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
              {value.length > 0 && !disabled && (
                <span
                  className={styles.inputIconRight}
                  onClick={handleClearAll}
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

        {isOpen && (
          <div className={styles.selectDropdown} role="listbox">
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
              filteredOptions.map((option) => {
                const isSelected = value.includes(option.value);
                return (
                  <div
                    key={option.value}
                    className={`${styles.selectOption} ${
                      isSelected ? styles.selected : ''
                    } ${option.disabled ? styles.disabled : ''}`}
                    onClick={() => handleSelect(option)}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <span
                      style={{
                        width: '1.25rem',
                        height: '1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px',
                        background: isSelected
                          ? 'rgba(255,255,255,0.2)'
                          : 'var(--form-bg)',
                        boxShadow: isSelected
                          ? 'none'
                          : 'inset 1px 1px 2px var(--form-shadow-dark), inset -1px -1px 2px var(--form-shadow-light)',
                      }}
                    >
                      {isSelected && <Check size={12} />}
                    </span>
                    {option.icon && (
                      <span className={styles.selectOptionIcon}>{option.icon}</span>
                    )}
                    {option.label}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </FormField>
  );
}
