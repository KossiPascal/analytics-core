import { api } from "@/apis/api";
import { IndexedDbStorage } from "@services/storages/indexed-db.service";
import { tokenProvider } from "@/apis/token.provider";
import { authScheduler } from "@/services/auth.scheduler";
import { onlineOrOffline } from "@/stores/stores.config";
import type { LoginResponse } from "@/models/auth.model";

const AUTH_KEY = "session";
const db = new IndexedDbStorage("auth");

export const authService = {
  async login(username: string, password: string, isOnline: boolean) {
    return onlineOrOffline({
      online: async () => {
        const res = await api.post<LoginResponse>("/auth/login", { username, password });
        if (!res.success || !res.data) throw new Error(res.message);

        await this.persistSession(res.data);
        return res.data;
      },
      offline: async () => {
        throw new Error("LOGIN_OFFLINE_NOT_ALLOWED");
      },
    });
  },

  async restore() {
    const session = await db.getOne<LoginResponse>(AUTH_KEY);
    if (!session) return null;

    await this.persistSession(session, false);
    return session;
  },

  async refresh(refresh_token: string | null) {
    const res = await api.post<LoginResponse>("/auth/refresh", { refresh_token });
    if (!res.success || !res.data) throw new Error(res.message);

    await this.persistSession(res.data);
    return res.data;
  },

  async logout() {
    authScheduler.clear();
    tokenProvider.clear();
    await db.delete(AUTH_KEY);
  },

  async persistSession(session: LoginResponse, saveInDB: boolean = true) {
    const { access_token, access_token_exp, refresh_token_exp, refresh_token } = session;
    if (!access_token || !access_token_exp) {
      throw new Error("INVALID_REFRESH_RESPONSE");
    }
    tokenProvider.set(access_token, access_token_exp, refresh_token, refresh_token_exp);
    authScheduler.schedule(access_token_exp, refresh_token);
    if (saveInDB) {
      await db.save({ ...session, id: AUTH_KEY });
    }
  }
};
