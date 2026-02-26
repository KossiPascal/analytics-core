import { IndexedDbStorage } from "@services/storages/indexed-db.service";
import { tokenProvider } from "@/apis/token.provider";
import { authScheduler } from "@/services/auth.scheduler";
import type { LoginResponse } from "@/models/auth.model";
import { CRUDService } from "@services/acrud.service";

const AUTH_KEY = "session";
const db = new IndexedDbStorage("auth");

const auth = new CRUDService("/auth");

export const authService = {
  async login(username: string, password: string, isOnline: boolean) {
    const res = await auth.post<LoginResponse>("/login", { username, password } as any);
    if (!res) throw new Error("ERREUR");
    await this.persistSession(res as LoginResponse);
    return res;
  },

  async restore() {
    const session = await db.getOne<LoginResponse>(AUTH_KEY);
    if (!session) return null;

    await this.persistSession(session, false);
    return session;
  },

  async refresh(refresh_token: string | null) {
    const res = await auth.post<LoginResponse>("/refresh", { refresh_token } as any);
    if (!res) throw new Error("ERREUR");
    await this.persistSession(res as LoginResponse);
    return res;
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
