import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Roles, Routes } from '@/models/OLD/old/auth.types';
import type {
  CountryMap,
  RegionsMap,
  PrefecturesMap,
  CommunesMap,
  HospitalsMap,
  DistrictQuartiersMap,
  VillageSecteursMap,
  ChwsMap,
  RecosMap,
} from '@/models/OLD/old/org-unit.types';

// Status for async operations
export interface UsersStatus {
  users: 'idle' | 'loading' | 'success' | 'error';
  roles: 'idle' | 'loading' | 'success' | 'error';
  authorizations: 'idle' | 'loading' | 'success' | 'error';
  routes: 'idle' | 'loading' | 'success' | 'error';
  orgUnits: 'idle' | 'loading' | 'success' | 'error';
  saving: 'idle' | 'loading' | 'success' | 'error';
  deleting: 'idle' | 'loading' | 'success' | 'error';
}

// OrgUnits data for user assignment
export interface OrgUnitsData {
  countries: CountryMap[];
  regions: RegionsMap[];
  prefectures: PrefecturesMap[];
  communes: CommunesMap[];
  hospitals: HospitalsMap[];
  districtQuartiers: DistrictQuartiersMap[];
  villageSecteurs: VillageSecteursMap[];
  chws: ChwsMap[];
  recos: RecosMap[];
}

export interface UsersState {
  // Data
  users: User[];
  roles: Roles[];
  authorizations: string[];
  routes: Routes[];
  orgUnits: OrgUnitsData;

  // Status
  status: UsersStatus;
  error: string | null;

  // Selected items for modals
  selectedUser: User | null;
  selectedRole: Roles | null;

  // Modal states
  isUserModalOpen: boolean;
  isRoleModalOpen: boolean;
  isDeleteUserModalOpen: boolean;
  isDeleteRoleModalOpen: boolean;
  isShowRolesModalOpen: boolean;

  // Actions
  setUsers: (users: User[]) => void;
  setRoles: (roles: Roles[]) => void;
  setAuthorizations: (authorizations: string[]) => void;
  setRoutes: (routes: Routes[]) => void;
  setOrgUnits: (orgUnits: OrgUnitsData) => void;
  setStatus: (key: keyof UsersStatus, status: UsersStatus[keyof UsersStatus]) => void;
  setError: (error: string | null) => void;
  setSelectedUser: (user: User | null) => void;
  setSelectedRole: (role: Roles | null) => void;
  openUserModal: (user?: User | null) => void;
  closeUserModal: () => void;
  openRoleModal: (role?: Roles | null) => void;
  closeRoleModal: () => void;
  openDeleteUserModal: (user: User) => void;
  closeDeleteUserModal: () => void;
  openDeleteRoleModal: (role: Roles) => void;
  closeDeleteRoleModal: () => void;
  openShowRolesModal: (user: User) => void;
  closeShowRolesModal: () => void;
  addUser: (user: User) => void;
  updateUser: (user: User) => void;
  removeUser: (userId: string) => void;
  addRole: (role: Roles) => void;
  updateRole: (role: Roles) => void;
  removeRole: (roleId: number) => void;
  reset: () => void;
}

const initialOrgUnits: OrgUnitsData = {
  countries: [],
  regions: [],
  prefectures: [],
  communes: [],
  hospitals: [],
  districtQuartiers: [],
  villageSecteurs: [],
  chws: [],
  recos: [],
};

const initialStatus: UsersStatus = {
  users: 'idle',
  roles: 'idle',
  authorizations: 'idle',
  routes: 'idle',
  orgUnits: 'idle',
  saving: 'idle',
  deleting: 'idle',
};

export const useUsersStore = create<UsersState>()(
  persist(
    (set) => ({
      // Initial state
      users: [],
      roles: [],
      authorizations: [],
      routes: [],
      orgUnits: initialOrgUnits,
      status: initialStatus,
      error: null,
      selectedUser: null,
      selectedRole: null,
      isUserModalOpen: false,
      isRoleModalOpen: false,
      isDeleteUserModalOpen: false,
      isDeleteRoleModalOpen: false,
      isShowRolesModalOpen: false,

      // Actions
      setUsers: (users) => set({ users }),
      setRoles: (roles) => set({ roles }),
      setAuthorizations: (authorizations) => set({ authorizations }),
      setRoutes: (routes) => set({ routes }),
      setOrgUnits: (orgUnits) => set({ orgUnits }),

      setStatus: (key, status) =>
        set((state) => ({
          status: { ...state.status, [key]: status },
        })),

      setError: (error) => set({ error }),
      setSelectedUser: (user) => set({ selectedUser: user }),
      setSelectedRole: (role) => set({ selectedRole: role }),

      // User modal actions
      openUserModal: (user = null) =>
        set({ isUserModalOpen: true, selectedUser: user }),
      closeUserModal: () =>
        set({ isUserModalOpen: false, selectedUser: null }),

      // Role modal actions
      openRoleModal: (role = null) =>
        set({ isRoleModalOpen: true, selectedRole: role }),
      closeRoleModal: () =>
        set({ isRoleModalOpen: false, selectedRole: null }),

      // Delete user modal
      openDeleteUserModal: (user) =>
        set({ isDeleteUserModalOpen: true, selectedUser: user }),
      closeDeleteUserModal: () =>
        set({ isDeleteUserModalOpen: false, selectedUser: null }),

      // Delete role modal
      openDeleteRoleModal: (role) =>
        set({ isDeleteRoleModalOpen: true, selectedRole: role }),
      closeDeleteRoleModal: () =>
        set({ isDeleteRoleModalOpen: false, selectedRole: null }),

      // Show roles modal
      openShowRolesModal: (user) =>
        set({ isShowRolesModalOpen: true, selectedUser: user }),
      closeShowRolesModal: () =>
        set({ isShowRolesModalOpen: false, selectedUser: null }),

      // CRUD operations
      addUser: (user) =>
        set((state) => ({ users: [...state.users, user] })),

      updateUser: (user) =>
        set((state) => ({
          users: state.users.map((u) => (u.id === user.id ? user : u)),
        })),

      removeUser: (userId) =>
        set((state) => ({
          users: state.users.filter((u) => u.id !== userId),
        })),

      addRole: (role) =>
        set((state) => ({ roles: [...state.roles, role] })),

      updateRole: (role) =>
        set((state) => ({
          roles: state.roles.map((r) => (r.id === role.id ? role : r)),
        })),

      removeRole: (roleId) =>
        set((state) => ({
          roles: state.roles.filter((r) => r.id !== roleId),
        })),

      reset: () =>
        set({
          users: [],
          roles: [],
          authorizations: [],
          routes: [],
          orgUnits: initialOrgUnits,
          status: initialStatus,
          error: null,
          selectedUser: null,
          selectedRole: null,
          isUserModalOpen: false,
          isRoleModalOpen: false,
          isDeleteUserModalOpen: false,
          isDeleteRoleModalOpen: false,
          isShowRolesModalOpen: false,
        }),
    }),
    {
      name: 'users-storage',
      partialize: (state) => ({
        // Only persist these fields
        users: state.users,
        roles: state.roles,
      }),
    }
  )
);
