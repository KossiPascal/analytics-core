import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authService } from "@/services/auth.service";
import { encryptedStorage, RETRY_MILLIS, networkManager } from "@/stores/stores.config";
import type { LoginResponse, PayloadUser } from "@/models/auth.model";
import { extractErrorMessage } from "@/utils/error.utils";

interface AuthState {
  user: PayloadUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;

  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;

  restore: () => Promise<void>;
  refresh: (refresh_token: string | null) => Promise<void>;

  isAuthenticated: () => boolean;
  hasPermission: (perms: string | string[], all?: boolean) => boolean;
  changePassword(oldPass: string, newPass: string): unknown;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,
      error: null,

      async login(username, password) {
        set({ loading: true, error: null });
        try {
          const isOnline = networkManager.isOnline();
          const session = await authService.login(username, password, isOnline);
          set({ user: session.payload, token: session.access_token });
        } catch (err) {
          set({ error: extractErrorMessage(err, "Login failed") });
        } finally {
          set({ loading: false });
        }

        console.log("AUTH STATE", useAuthStore.getState());
      },

      async changePassword(oldPass, newPass) {

      },

      async restore() {
        set({ loading: true });
        try {
          const session = await authService.restore();
          if (!session) return;
          set({ user: session.payload, token: session.access_token });
        } finally {
          set({ loading: false });
        }
      },

      async refresh(refresh_token) {
        try {
          const session = await authService.refresh(refresh_token);
          set({ user: session.payload, token: session.access_token });
        } catch {
          await get().logout();
        }
      },

      async logout() {
        try {
          await authService.logout();
        } finally {
          set({ user: null, token: null, loading: false, error: null });
        }
      },

      isAuthenticated: () => !!get().user,

      hasPermission(perms, all = false) {
        const user = get().user;
        if (!user) return false;
        const owned = new Set(user.permissions ?? []);
        const required = Array.isArray(perms) ? perms : [perms];
        return all ? required.every(p => owned.has(p)) : required.some(p => owned.has(p));
      }
    }),
    {
      name: "auth-store",
      storage: encryptedStorage,
      partialize: (s) => ({ user: s.user, token: s.token }),
    }
  )
);
