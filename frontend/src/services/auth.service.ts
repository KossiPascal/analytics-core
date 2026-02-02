import { api } from '@/apis/api';
import { onlineOrOffline } from '@/stores/stores.config';
import { IndexedDbStorage } from '@services/storages/indexed-db.service';

const AUTH_KEY = 'session';

const db = new IndexedDbStorage('auth')

export interface Session {
  access_token: string;
  payload: any;
}

export const authService = {
  async login(username: string, password: string, isOnline: boolean) {
    return onlineOrOffline({
      online: async () => {
        const res = await api.post('/auth/login', { username, password });
        await db.save({ ...res.data, id: AUTH_KEY });
        return res.data;
      },
      offline: async () => {
        throw new Error('LOGIN_OFFLINE_NOT_ALLOWED');
      },
    });
  },

  async getSession() {
    return onlineOrOffline({
      online: async () => {
        const res = await api.get('/auth/me');
        await db.save({ ...res.data, id: AUTH_KEY });
        return res.data;
      },
      offline: async () => {
        return db.getOne(AUTH_KEY);
      },
    });
  },

  async logout() {
    await db.delete(AUTH_KEY);
  },

  async refreshToken(token?: string | null) {
    if (!token) throw new Error('No refresh token available');
    // Suppose que tu as une API /auth/refresh qui prend token
    return onlineOrOffline({
      online: async () => {
        const res = await api.post('/auth/refresh', { refresh_token: token });
        await db.save({ ...res.data, id: AUTH_KEY });
        return res.data;
      },
      offline: async () => {
        // si offline → impossible de refresh
        throw new Error('Cannot refresh token while offline');
      }
    });
  },

  async changePassword(token:string|null, oldPass: string, newPass: string): Promise<void> {
    await api.post('/auth/change-password', { oldPass, newPass });
  },

};
