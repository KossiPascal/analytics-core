import { useState } from 'react';

export interface FieldRule {
  required?: boolean;
  message?: string;
  validate?: (value: any) => string | undefined;
}

export type ValidationRules = Record<string, FieldRule>;

export function useFormValidation(rules: ValidationRules) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  function validateField(name: string, value: any): string {
    const rule = rules[name];
    if (!rule) return '';
    if (rule.required) {
      const isEmpty =
        value === undefined ||
        value === null ||
        value === '' ||
        (typeof value === 'string' && !value.trim()) ||
        (Array.isArray(value) && value.length === 0);
      if (isEmpty) return rule.message || 'Ce champ est requis';
    }
    if (rule.validate) {
      return rule.validate(value) || '';
    }
    return '';
  }

  /** Marque un champ comme touché et valide sa valeur (à appeler onBlur ou onChange) */
  function touchField(name: string, value: any) {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  }

  /** Valide tous les champs, retourne true si tout est valide. À appeler avant soumission. */
  function validateAll(fields: Record<string, any>): boolean {
    const newErrors: Record<string, string> = {};
    const newTouched: Record<string, boolean> = {};
    for (const name of Object.keys(rules)) {
      newTouched[name] = true;
      newErrors[name] = validateField(name, fields[name]);
    }
    setTouched(newTouched);
    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  }

  /** Retourne l'erreur d'un champ uniquement s'il a été touché */
  function getFieldError(name: string): string {
    return touched[name] ? errors[name] || '' : '';
  }

  /** Retourne tous les messages d'erreur non vides (pour la bannière) */
  function getErrorMessages(): string[] {
    return Object.values(errors).filter(Boolean);
  }

  /** Vérifie si tous les champs requis sont remplis (pour désactiver le bouton soumettre) */
  function isFormValid(fields: Record<string, any>): boolean {
    for (const [name, rule] of Object.entries(rules)) {
      if (rule.required) {
        const val = fields[name];
        const isEmpty =
          val === undefined ||
          val === null ||
          val === '' ||
          (typeof val === 'string' && !val.trim()) ||
          (Array.isArray(val) && val.length === 0);
        if (isEmpty) return false;
      }
    }
    return true;
  }

  /** Réinitialise les erreurs et l'état touché */
  function reset() {
    setErrors({});
    setTouched({});
  }

  return { errors, touched, touchField, validateAll, getFieldError, getErrorMessages, isFormValid, reset };
}
