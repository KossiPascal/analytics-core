import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/OLD';
import { authService } from '@/services/OLD/auth.old';
import { ROUTES, DEFAULT_AUTHENTICATED_ROUTE } from '@routes/index';
import type { LoginCredentials, ChangePasswordPayload } from '@/models/OLD/old';

export function useAuthActions() {
  const navigate = useNavigate();
  const { login: storeLogin, logout: storeLogout, setLoading, setError, updateUser } = useStore();

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      setLoading(true);
      setError(null);

      try {
        const response = await authService.login(credentials);
        storeLogin(response.user, response.token, response.refreshToken ?? '');

        // Redirect based on user state
        if (response.user.mustChangeDefaultPassword) {
          navigate(ROUTES.auth.changePassword());
        } else {
          navigate(DEFAULT_AUTHENTICATED_ROUTE);
        }

        return response;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Erreur de connexion';
        setError(message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [navigate, setError, setLoading, storeLogin]
  );

  const logout = useCallback(async () => {
    setLoading(true);

    try {
      await authService.logout();
    } catch {
      // Ignore logout errors
    } finally {
      storeLogout();
      setLoading(false);
      navigate(ROUTES.auth.login());
    }
  }, [navigate, setLoading, storeLogout]);

  const changePassword = useCallback(
    async (payload: ChangePasswordPayload) => {
      setLoading(true);
      setError(null);

      try {
        await authService.changePassword(payload);
        updateUser({ mustChangeDefaultPassword: false });
        navigate(DEFAULT_AUTHENTICATED_ROUTE);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Erreur lors du changement de mot de passe';
        setError(message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [navigate, setError, setLoading, updateUser]
  );

  const refreshUserData = useCallback(async () => {
    try {
      const user = await authService.getCurrentUser();
      updateUser(user);
      return user;
    } catch (error) {
      storeLogout();
      throw error;
    }
  }, [storeLogout, updateUser]);

  return {
    login,
    logout,
    changePassword,
    refreshUserData,
  };
}
