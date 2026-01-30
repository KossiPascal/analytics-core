import { z } from 'zod';

// ============================================
// COMMON VALIDATION SCHEMAS
// ============================================

/**
 * Email validation
 */
export const emailSchema = z
  .string()
  .min(1, 'L\'email est requis')
  .email('Format d\'email invalide');

/**
 * Password validation
 */
export const passwordSchema = z
  .string()
  .min(1, 'Le mot de passe est requis')
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères');

/**
 * Strong password validation
 */
export const strongPasswordSchema = z
  .string()
  .min(1, 'Le mot de passe est requis')
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
  .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
  .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
  .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')
  .regex(/[^A-Za-z0-9]/, 'Le mot de passe doit contenir au moins un caractère spécial');

/**
 * Username validation
 */
export const usernameSchema = z
  .string()
  .min(1, 'Le nom d\'utilisateur est requis')
  .min(3, 'Le nom d\'utilisateur doit contenir au moins 3 caractères')
  .max(50, 'Le nom d\'utilisateur ne peut pas dépasser 50 caractères')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores');

/**
 * Phone number validation (Guinea)
 */
export const phoneSchema = z
  .string()
  .min(1, 'Le numéro de téléphone est requis')
  .regex(/^(\+224)?[0-9]{9}$/, 'Format de numéro de téléphone invalide');

/**
 * Required string
 */
export const requiredString = (fieldName: string) =>
  z.string().min(1, `${fieldName} est requis`);

/**
 * Optional string that transforms empty to undefined
 */
export const optionalString = z
  .string()
  .optional()
  .transform(val => (val === '' ? undefined : val));

// ============================================
// FORM SCHEMAS
// ============================================

/**
 * Login form schema
 */
export const loginFormSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
});

/**
 * Change password form schema
 */
export const changePasswordFormSchema = z
  .object({
    currentPassword: passwordSchema,
    newPassword: strongPasswordSchema,
    confirmPassword: z.string().min(1, 'Veuillez confirmer le mot de passe'),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })
  .refine(data => data.currentPassword !== data.newPassword, {
    message: 'Le nouveau mot de passe doit être différent de l\'ancien',
    path: ['newPassword'],
  });

/**
 * User form schema
 */
export const userFormSchema = z.object({
  username: usernameSchema,
  email: emailSchema.optional(),
  fullName: requiredString('Le nom complet'),
  phone: phoneSchema.optional(),
  roleIds: z.array(z.string()).min(1, 'Veuillez sélectionner au moins un rôle'),
  isActive: z.boolean().default(true),
});

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Check if email is valid
 */
export function isValidEmail(email: string): boolean {
  return emailSchema.safeParse(email).success;
}

/**
 * Check if phone is valid
 */
export function isValidPhone(phone: string): boolean {
  return phoneSchema.safeParse(phone).success;
}

/**
 * Check if password is strong
 */
export function isStrongPassword(password: string): boolean {
  return strongPasswordSchema.safeParse(password).success;
}

/**
 * Get password strength
 */
export function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { score: 0, label: 'Très faible', color: 'var(--danger)' },
    { score: 2, label: 'Faible', color: 'var(--warning)' },
    { score: 4, label: 'Moyen', color: 'var(--info)' },
    { score: 5, label: 'Fort', color: 'var(--success)' },
    { score: 6, label: 'Très fort', color: 'var(--success)' },
  ];

  const level = [...levels].reverse().find((l) => score >= l.score) || levels[0];

  return {
    score,
    label: level.label,
    color: level.color,
  };
}

// Export types
export type LoginFormData = z.infer<typeof loginFormSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordFormSchema>;
export type UserFormData = z.infer<typeof userFormSchema>;
