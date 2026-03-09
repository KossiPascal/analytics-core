import React, { useEffect, createContext, useContext, ReactNode } from "react";
import { UserPayload } from "@/models/auth.model";
import { useAuthStore } from "@/stores/auth.store";
import { DEFAULT_AUTHENTICATED_ROUTE, ROUTES } from "@/routes";
import { useLocation, useNavigate } from "react-router-dom";

interface AuthContextType {
    user: UserPayload | null;
    isAuthenticated: boolean;
    isSuperAdmin: boolean;
    isAdmin: boolean;
    loading: boolean;
    error: string | null;
    login: (username: string, password: string, callback?: () => Promise<void>) => Promise<void>;
    logout: (callback?: () => Promise<void>) => Promise<void>;
    restore: (callback?: () => Promise<void>) => Promise<void>;
    refresh: (callback?: () => void) => Promise<void>;
    changePassword: (oldPass: string, newPass: string, callback?: () => Promise<void>) => Promise<void>;
    hasPermission: (perms: string | string[], all?: boolean) => boolean;
    redirectToPage: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const store = useAuthStore();
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const init = async () => {
            try {
                await store.restore();
            } catch (err) {
                console.error("Failed to restore session", err);
            }
        };
        init();

        const logoutKey = "auth:logout";

        const onLogout = () => logout();
        window.addEventListener(logoutKey, onLogout);
        return () => window.removeEventListener(logoutKey, onLogout);
    }, [navigate]); // 👈 UNE FOIS

    const redirectToPage = () => {

        // 📍 Redirection après login
        // const redirectTo = (location.state as { from?: Location })?.from?.pathname || ROUTES.dashboards.root();
        const from = (location.state as { from?: { pathname: string } })?.from?.pathname;

        if (store.user?.mustChangeDefaultPassword) {
            navigate(ROUTES.auth.changePassword(), { replace: true });
        } else if (from) {
            navigate(from, { replace: true });
        } else {
            navigate(DEFAULT_AUTHENTICATED_ROUTE, { replace: true });
        }

    }

    const login = async (username: string, password: string, callback?: () => Promise<void>) => {
        await store.login(username, password);
        if (callback) await callback();
        redirectToPage();
    };

    const logout = async (callback?: () => Promise<void>) => {
        await store.logout();
        await callback?.();
        navigate(ROUTES.auth.login(), { replace: true })
        // window.dispatchEvent(new Event("auth:logout"));
    };

    const changePassword = async (oldPass: string, newPass: string, callback?: () => Promise<void>) => {
        await store.changePassword(oldPass, newPass);

        if (callback) await callback();
        if (store.user?.mustChangeDefaultPassword) {
            navigate(ROUTES.auth.changePassword());
        } else {
            navigate(DEFAULT_AUTHENTICATED_ROUTE);
        }
    };

    const restore = async (callback?: () => void) => {
        await store.restore();
        callback?.();
    }
    const refresh = async (callback?: () => void) => {
        await store.refresh();
        callback?.();
    }

    // const hasPermission = (perms: string | string[], all: boolean = false) => store.hasPermission(perms, all);
    const hasPermission = (perms: string | string[], all: boolean = false) => {
        const userPerms = store.user?.permissions ?? [];
        const required = Array.isArray(perms) ? perms : [perms];

        return all
            ? required.every(p => userPerms.includes(p))
            : required.some(p => userPerms.includes(p));
    };
    const contextValue: AuthContextType = {
        user: store.user,
        loading: store.loading,
        error: store.error,
        isAuthenticated: !!store.user,
        isSuperAdmin: (store.user?.permissions ?? []).includes('_superadmin'),
        isAdmin: (store.user?.permissions ?? []).includes('_admin') || (store.user?.permissions ?? []).includes('_superadmin'),
        login,
        logout,
        restore,
        refresh,
        changePassword,
        hasPermission,
        redirectToPage
    };

    return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};
