import { create } from "zustand";
import { authService } from "@/services/auth.service";
import { networkManager } from "@/stores/stores.config";
import type { LoginResponse, UserPayload } from "@/models/auth.model";
import { extractErrorMessage } from "@/utils/error.utils";
import { tokenProvider } from "@/apis/token.provider";
import { IndexedDbStorage } from "@services/storages/indexed-db.service";

interface AuthState {
  user: UserPayload | null;
  // token: string | null;
  loading: boolean;
  error: string | null;

  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;

  restore: () => Promise<void>;
  refresh: () => Promise<void>;

  isAuthenticated: () => boolean;
  hasPermission: (perms: string | string[], all?: boolean) => boolean;
  changePassword(oldPass: string, newPass: string): unknown;
}



const AUTH_KEY = "session";
const db = new IndexedDbStorage("auth");

const persistSession = async (session: LoginResponse, saveInDB: boolean = true) => {
  if (saveInDB) {
    await db.save({ ...session, id: AUTH_KEY });
  }

  const { access_token, access_token_exp, refresh_token_exp, refresh_token } = session;
  if (!access_token || !access_token_exp) {
    throw new Error("INVALID_REFRESH_RESPONSE");
  }
  tokenProvider.set(access_token, access_token_exp, refresh_token, refresh_token_exp);
}



export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  // token: null,
  loading: false,
  error: null,

  async login(username, password) {
    set({ loading: true, error: null });
    try {
      const isOnline = networkManager.isOnline();
      const session = await authService.login(username, password, isOnline);
      set({ user: session.payload });
      await persistSession(session);
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
      const session = await db.get<LoginResponse>(AUTH_KEY);
      if (!session) return;
      set({ user: session.payload });
      await persistSession(session, false);
    } finally {
      set({ loading: false });
    }
  },

  async refresh() {
    try {
      const session = await authService.refresh();
      set({ user: session.payload });
      await persistSession(session);
    } catch {
      await get().logout();
    }
  },

  async logout() {
    try {
      tokenProvider.clear();
      await db.delete(AUTH_KEY);
      await authService.logout();
    } finally {
      set({ user: null, loading: false, error: null });
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
}));
