import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Lock, KeyRound, Check } from 'lucide-react';
import { AuthLayout } from '@components/layout';
import { Button } from '@components/ui';
import { FormInput } from '@/components/forms';
import { changePasswordFormSchema, type ChangePasswordFormData, getPasswordStrength } from '@utils/validators';
import { useAuthActions } from '@/contexts/OLD/useAuth';
import { useAuth } from "@/contexts/AuthContext";
import styles from './ChangePasswordPage.module.css';

export default function ChangePasswordPage() {
  const { changePassword } = useAuthActions();
  const { loading, error } = useAuth();
  const [showError, setShowError] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordFormSchema),
    mode: "onChange",
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const newPassword = watch('newPassword');
  const passwordStrength = getPasswordStrength(newPassword || '');

  const onSubmit = async (data: ChangePasswordFormData) => {
    setShowError(false);
    try {
      await changePassword(data);
    } catch {
      setShowError(true);
    }
  };

  return (
    <AuthLayout
      title="Changer le mot de passe"
      subtitle="Vous devez changer votre mot de passe par défaut"
    >
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        {/* Error Message */}
        {showError && error && (
          <motion.div
            className={styles.errorAlert}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.div>
        )}

        {/* Current Password */}
        <FormInput
          type="password"
          label="Mot de passe actuel"
          placeholder="Entrez votre mot de passe actuel"
          leftIcon={<Lock size={18} />}
          error={errors.currentPassword?.message}
          autoComplete="current-password"
          required
          {...register('currentPassword')}
        />

        {/* New Password */}
        <div className={styles.passwordField}>
          <FormInput
            type="password"
            label="Nouveau mot de passe"
            placeholder="Entrez votre nouveau mot de passe"
            leftIcon={<KeyRound size={18} />}
            error={errors.newPassword?.message}
            autoComplete="new-password"
            required
            {...register('newPassword')}
          />

          {/* Password Strength Indicator */}
          {newPassword && (
            <motion.div
              className={styles.strengthIndicator}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className={styles.strengthBar}>
                <motion.div
                  className={styles.strengthFill}
                  initial={{ width: 0 }}
                  animate={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                  style={{ backgroundColor: passwordStrength.color }}
                />
              </div>
              <span className={styles.strengthLabel} style={{ color: passwordStrength.color }}>
                {passwordStrength.label}
              </span>
            </motion.div>
          )}
        </div>

        {/* Confirm Password */}
        <FormInput
          type="password"
          label="Confirmer le mot de passe"
          placeholder="Confirmez votre nouveau mot de passe"
          leftIcon={<KeyRound size={18} />}
          error={errors.confirmPassword?.message}
          autoComplete="new-password"
          required
          {...register('confirmPassword')}
        />

        {/* Password Requirements */}
        <div className={styles.requirements}>
          <p className={styles.requirementsTitle}>Le mot de passe doit contenir :</p>
          <ul className={styles.requirementsList}>
            <li className={newPassword?.length >= 8 ? styles.met : ''}>
              <Check size={14} /> Au moins 8 caractères
            </li>
            <li className={/[A-Z]/.test(newPassword || '') ? styles.met : ''}>
              <Check size={14} /> Une lettre majuscule
            </li>
            <li className={/[a-z]/.test(newPassword || '') ? styles.met : ''}>
              <Check size={14} /> Une lettre minuscule
            </li>
            <li className={/[0-9]/.test(newPassword || '') ? styles.met : ''}>
              <Check size={14} /> Un chiffre
            </li>
            <li className={/[^A-Za-z0-9]/.test(newPassword || '') ? styles.met : ''}>
              <Check size={14} /> Un caractère spécial
            </li>
          </ul>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          isFullWidth
          isLoading={loading}
          disabled={!isValid || loading}
          rightIcon={<Check size={18} />}
        >
          Changer le mot de passe
        </Button>
      </form>
    </AuthLayout>
  );
}
