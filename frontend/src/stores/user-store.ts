import { create } from 'zustand';
import { UserPayload } from '@/models/auth.model';
import { extractErrorMessage } from '@/utils/error.utils';

const userService: any = {} as any

interface UserState {
  // CRUD utilisateurs
  users: UserPayload[];
  loading: boolean;
  error: string | null;
  loadUsers: () => Promise<void>;
  addUser: (user: UserPayload) => Promise<boolean>;
  updateUser: (user: UserPayload) => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>;
  getUser: (id: string) => Promise<UserPayload | undefined>;
}

export const useAuthStore = create<UserState>((set, get) => ({
  loading: false,
  error: null,
  users: [],

  // ---------------- CRUD Users ----------------
  loadUsers: async () => {
    set({ loading: true });
    try {
      const allUsers = await userService.getAll();
      set({ users: allUsers, loading: false });
    } catch (err: unknown) {
      console.error('Erreur loadUsers:', err);
      set({ error: extractErrorMessage(err, 'Erreur chargement users'), loading: false });
    }
  },

  addUser: async (user: UserPayload) => {
    const result = await userService.upsert(user);
    if (result) await get().loadUsers();
    return result;
  },

  updateUser: async (user: UserPayload) => {
    const result = await userService.update(user);
    if (result) await get().loadUsers();
    return result;
  },

  deleteUser: async (id: string) => {
    const result = await userService.delete(id);
    if (result) await get().loadUsers();
    return result;
  },

  getUser: async (id: string) => {
    return await userService.get(id);
  },
}));
