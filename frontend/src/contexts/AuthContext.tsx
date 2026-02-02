import React, { createContext, useContext, ReactNode } from "react";
import { PayloadUser, LoginResponse } from "@/models/auth.model";
import { useAuthStore } from "@/stores/auth.store";
import { DEFAULT_AUTHENTICATED_ROUTE, ROUTES } from "@/routes";
import { useLocation, useNavigate } from "react-router-dom";


interface AuthContextType {
  user: PayloadUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string, callback?: () => Promise<void>) => Promise<void>;
  logout: (callback?: () => void) => Promise<void>;
  restore: (callback?: () => void) => Promise<void>;
  refresh: (callback?: () => void) => Promise<void>;
  changePassword: (oldPass: string, newPass: string, callback?: () => Promise<void>) => Promise<void>;
  hasPermission: (perms: string | string[], all?: boolean) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const store = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const login = async (username: string, password: string, callback?: () => Promise<void>) => {
    await store.login(username, password, async () => {
      if (callback) await callback();

      // 📍 Redirection après login
      const redirectTo = (location.state as { from?: Location })?.from?.pathname || ROUTES.dashboards.root();

      if (store.user?.mustChangeDefaultPassword) {
        navigate(ROUTES.auth.changePassword());
      } else {
        navigate(DEFAULT_AUTHENTICATED_ROUTE);
      }
    });
  };

  const logout = async (callback?: () => void) => {
    await store.logout(() => {
      callback?.();
      navigate(ROUTES.auth.login());
    });
  };

  const changePassword = async (oldPass: string, newPass: string, callback?: () => Promise<void>) => {
    await store.changePassword(oldPass, newPass, async () => {
      if (callback) await callback();
      if (store.user?.mustChangeDefaultPassword) {
        navigate(ROUTES.auth.changePassword());
      } else {
        navigate(DEFAULT_AUTHENTICATED_ROUTE);
      }
    });
  };

  const restore = async (callback?: () => void) => await store.restore(callback);
  const refresh = async (callback?: () => void) => await store.refresh(callback);

  const hasPermission = (perms: string | string[], all: boolean = false) => store.hasPermission(perms, all);

  const contextValue: AuthContextType = {
    user: store.user,
    loading: store.loading,
    error: store.error,
    isAuthenticated: !!store.user,
    login,
    logout,
    restore,
    refresh,
    changePassword,
    hasPermission,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
