import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { User, Lock, LogIn } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthLayout } from "@components/layout";
import { Input, Button } from "@components/ui";
import { loginFormSchema, type LoginFormData } from "@utils/validators";
import { useAuth } from "@/contexts/AuthContext";
import { ROUTES } from "@routes/index";

import styles from "./LoginPage.module.css";

export default function LoginPage() {
  const { login, error, loading } = useAuth();
  const location = useLocation();

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
        <Input
          label="Nom d'utilisateur"
          placeholder="Entrez votre nom d'utilisateur"
          leftIcon={<User size={18} />}
          error={errors.username?.message}
          autoComplete="username"
          aria-invalid={!!errors.username}
          {...register("username")}
        />

        {/* Password */}
        <Input
          type="password"
          label="Mot de passe"
          placeholder="Entrez votre mot de passe"
          leftIcon={<Lock size={18} />}
          error={errors.password?.message}
          autoComplete="current-password"
          aria-invalid={!!errors.password}
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
