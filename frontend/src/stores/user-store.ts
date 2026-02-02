import { create } from 'zustand';
import { persist } from 'zustand/middleware';
// import { userService } from '@services/user.service';
import { encryptedStorage, RETRY_MILLIS, networkManager } from '@/stores/stores.config';
import { PayloadUser } from '@/models/auth.model';

const userService:any = {} as any

interface UserState {
  // CRUD utilisateurs
  users: PayloadUser[];
  loading: boolean;
  error: string | null;
  loadUsers: () => Promise<void>;
  addUser: (user: PayloadUser) => Promise<boolean>;
  updateUser: (user: PayloadUser) => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>;
  getUser: (id: string) => Promise<PayloadUser | undefined>;
}

export const useAuthStore = create<UserState>()(
  persist(
    (set, get) => ({
      loading: false,
      error: null,
      users: [],

      // ---------------- CRUD Users ----------------
      loadUsers: async () => {
        set({ loading: true });
        try {
          const allUsers = await userService.getAll();
          set({ users: allUsers, loading: false });
        } catch (err: any) {
          console.error('Erreur loadUsers:', err);
          set({ error: err.message ?? 'Erreur chargement users', loading: false });
        }
      },

      addUser: async (user: PayloadUser) => {
        const result = await userService.upsert(user);
        if (result) await get().loadUsers();
        return result;
      },

      updateUser: async (user: PayloadUser) => {
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
        return await userService.getOne(id);
      },
    }),
    {
      name: 'user-store',
      storage: encryptedStorage,
    }
  )
);
