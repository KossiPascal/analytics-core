import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { User, Lock, LogIn } from "lucide-react";
import { AuthLayout } from "@components/layout/AuthLayout/AuthLayout";
import { Button } from "@components/ui/Button/Button";
import { FormInput } from "@/components/forms/FormInput/FormInput";
import { loginFormSchema, type LoginFormData } from "@utils/validators";
import { useAuth } from "@/contexts/AuthContext";
import { ROUTES } from "@routes/configs";

import styles from "./LoginPage.module.css";

export default function LoginPage() {
  const { login, error, loading, isAuthenticated, redirectToPage } = useAuth();

  if (isAuthenticated) {
    redirectToPage();
    return <></>;
  }

  const { register, handleSubmit, formState: { errors, isValid } } = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    mode: "onChange", // 🔥 validation temps réel
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = async ({ username, password }: LoginFormData) => {
    try {
      const res = await login(username, password);
    } catch(e) {
    }
  };

  return (
    <AuthLayout title="Connexion" subtitle="Connectez-vous pour accéder à votre tableau de bord">
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
        {/* Error Message */}
        {error && (
          <motion.div
            className={styles.errorAlert}
            role="alert"
            aria-live="assertive"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.div>
        )}

        {/* Username */}
        <FormInput
          label="Nom d'utilisateur"
          placeholder="Entrez votre nom d'utilisateur"
          leftIcon={<User size={18} />}
          error={errors.username?.message}
          autoComplete="username"
          required
          {...register("username")}
        />

        {/* Password */}
        <FormInput
          type="password"
          label="Mot de passe"
          placeholder="Entrez votre mot de passe"
          leftIcon={<Lock size={18} />}
          error={errors.password?.message}
          autoComplete="current-password"
          required
          {...register("password")}
        />

        {/* Forgot Password */}
        <div className={styles.forgotPassword}>
          <a href={ROUTES.auth.forgotPassword()}>
            Mot de passe oublié ?
          </a>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          isFullWidth
          isLoading={loading}
          disabled={!isValid || loading}
          rightIcon={<LogIn size={18} />}
        >
          Se connecter
        </Button>
      </form>
    </AuthLayout>
  );
}
