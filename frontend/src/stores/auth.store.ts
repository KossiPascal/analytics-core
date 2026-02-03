import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '@services/auth.service';
import { encryptedStorage, RETRY_MILLIS, networkManager } from '@/stores/stores.config';
import { LoginResponse, PayloadUser } from '@/models/auth.model';



interface AuthState {
  user: PayloadUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;

  login: (username: string, password: string, callback?: () => void) => Promise<void>;
  logout: (callback?: () => void) => Promise<void>;
  restore: (callback?: () => void) => Promise<void>;
  refresh: (callback?: () => void) => Promise<void>;
  changePassword: (oldPass: string, newPass: string, callback?: () => void) => Promise<void>;
  hasPermission: (perms: string | string[], all?: boolean) => boolean;
  getToken: () => string | null;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,
      error: null,

      // --- LOGIN ---
      login: async (username, password, callback) => {
        set({ loading: true, error: null });
        try {
          const isOnline = networkManager.isOnline();
          const session: LoginResponse = await authService.login(username, password, isOnline);
          set({ user: session.payload, token: session.access_token, loading: false, error: null });

          // auto-refresh token avant expiration
          const expiresIn = session.access_token_exp * 1000 - Date.now() - 5000;
          if (expiresIn > 0) setTimeout(() => get().refresh(callback), expiresIn);

          if (callback) callback();
        } catch (err: any) {
          set({ error: err.message ?? 'Login failed', loading: false });
          if (callback) setTimeout(callback, RETRY_MILLIS);
        }
      },

      // --- RESTORE ---
      restore: async (callback) => {
        set({ loading: true, error: null });
        try {
          const session = await authService.getSession();
          set({
            user: session?.payload ?? null,
            token: session?.access_token ?? null,
            loading: false,
            error: null,
          });
          if (callback) callback();
        } catch (err: any) {
          set({ error: err.message ?? 'Restore failed', loading: false });
          if (callback) setTimeout(callback, RETRY_MILLIS);
        }
      },

      // --- LOGOUT ---
      logout: async (callback) => {
        set({ loading: true, error: null });
        try {
          await authService.logout();
        } finally {
          set({ user: null, token: null, loading: false, error: null });
          if (callback) callback();
        }
      },

      // --- REFRESH TOKEN ---
      refresh: async (callback) => {
        set({ loading: true, error: null });
        try {
          const token = get().token;
          if (!token) throw new Error('No token to refresh');
          const session = (await authService.refreshToken(token))?.data;
          set({ user: session.payload, token: session.access_token, loading: false, error: null });

          // planifier prochain refresh
          const expiresIn = session.access_token_exp * 1000 - Date.now() - 5000;
          if (expiresIn > 0) setTimeout(() => get().refresh(callback), expiresIn);

          if (callback) callback();
        } catch (err: any) {
          set({ error: err.message ?? 'Refresh failed', user: null, token: null, loading: false });
          if (callback) setTimeout(callback, RETRY_MILLIS);
        }
      },

      // --- CHANGE PASSWORD ---
      changePassword: async (oldPass, newPass, callback) => {
        set({ loading: true, error: null });
        try {
          if (!get().token) throw new Error('User not authenticated');
          await authService.changePassword(get().token!, oldPass, newPass);
          if (callback) callback();
        } catch (err: any) {
          set({ error: err.message ?? 'Change password failed' });
          if (callback) setTimeout(callback, RETRY_MILLIS);
        } finally {
          set({ loading: false });
        }
      },

      // --- PERMISSIONS ---
      hasPermission: (perms, all = false) => {
        const user = get().user;
        if (!user) return false;
        const userPermissions = new Set(user.permissions ?? []);
        if (userPermissions.has('_admin') || userPermissions.has('_superadmin')) return true;
        const required = Array.isArray(perms) ? perms : [perms];
        if (all) return required.every(p => userPermissions.has(p));
        return required.some(p => userPermissions.has(p));
      },

      // --- HELPERS ---
      getToken: () => get().token,
      isAuthenticated: () => !!get().user,
    }),
    {
      name: 'auth-store',
      storage: encryptedStorage,
    }
  )
);
