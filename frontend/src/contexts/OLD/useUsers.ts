import { useCallback } from 'react';
import { useUsersStore, type OrgUnitsData } from '@/stores/OLD/users.store';
import { AuthApi, OrgUnitsApi } from '@/services/OLD/old';
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

// Form data for creating/updating user
export interface UserFormData {
  id?: string;
  username: string;
  fullname: string;
  email: string;
  password?: string;
  isActive: boolean;
  roles: number[];
  countries: CountryMap[];
  regions: RegionsMap[];
  prefectures: PrefecturesMap[];
  communes: CommunesMap[];
  hospitals: HospitalsMap[];
  districtQuartiers: DistrictQuartiersMap[];
  villageSecteurs: VillageSecteursMap[];
  chws?: ChwsMap[];
  recos?: RecosMap[];
}

// Form data for creating/updating role
export interface RoleFormData {
  id?: number;
  name: string;
  routes: Routes[];
  authorizations: string[];
}

export function useUsers() {
  const store = useUsersStore();

  // Fetch all users
  const fetchUsers = useCallback(async () => {
    store.setStatus('users', 'loading');
    store.setError(null);

    try {
      const response = await AuthApi.getUsers();
      if (response.status === 200) {
        store.setUsers(response.data as User[]);
        store.setStatus('users', 'success');
      } else {
        store.setError('Erreur lors du chargement des utilisateurs');
        store.setStatus('users', 'error');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      store.setError('Erreur lors du chargement des utilisateurs');
      store.setStatus('users', 'error');
    }
  }, []);

  // Fetch all roles
  const fetchRoles = useCallback(async () => {
    store.setStatus('roles', 'loading');
    store.setError(null);

    try {
      const response = await AuthApi.getRoles();
      if (response.status === 200) {
        store.setRoles(response.data as Roles[]);
        store.setStatus('roles', 'success');
      } else {
        store.setError('Erreur lors du chargement des rôles');
        store.setStatus('roles', 'error');
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      store.setError('Erreur lors du chargement des rôles');
      store.setStatus('roles', 'error');
    }
  }, []);

  // Fetch authorizations
  const fetchAuthorizations = useCallback(async () => {
    store.setStatus('authorizations', 'loading');

    try {
      const response = await AuthApi.getAuthorizations();
      if (response.status === 200) {
        store.setAuthorizations(response.data as string[]);
        store.setStatus('authorizations', 'success');
      } else {
        store.setStatus('authorizations', 'error');
      }
    } catch (error) {
      console.error('Error fetching authorizations:', error);
      store.setStatus('authorizations', 'error');
    }
  }, []);

  // Fetch routes
  const fetchRoutes = useCallback(async () => {
    store.setStatus('routes', 'loading');

    try {
      const response = await AuthApi.getRoutes();
      if (response.status === 200) {
        store.setRoutes(response.data as Routes[]);
        store.setStatus('routes', 'success');
      } else {
        store.setStatus('routes', 'error');
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
      store.setStatus('routes', 'error');
    }
  }, []);

  // Fetch all OrgUnits
  const fetchOrgUnits = useCallback(async () => {
    store.setStatus('orgUnits', 'loading');

    try {
      const [
        countriesRes,
        regionsRes,
        prefecturesRes,
        communesRes,
        hospitalsRes,
        districtQuartiersRes,
        villageSecteursRes,
        chwsRes,
        recosRes,
      ] = await Promise.all([
        OrgUnitsApi.getCountries(),
        OrgUnitsApi.getRegions(),
        OrgUnitsApi.getPrefectures(),
        OrgUnitsApi.getCommunes(),
        OrgUnitsApi.getHospitals(),
        OrgUnitsApi.getDistrictQuartiers(),
        OrgUnitsApi.getVillageSecteurs(),
        OrgUnitsApi.getChws(),
        OrgUnitsApi.getRecos(),
      ]);

      const orgUnits: OrgUnitsData = {
        countries: countriesRes.status === 200 ? (countriesRes.data as CountryMap[]) : [],
        regions: regionsRes.status === 200 ? (regionsRes.data as RegionsMap[]) : [],
        prefectures: prefecturesRes.status === 200 ? (prefecturesRes.data as PrefecturesMap[]) : [],
        communes: communesRes.status === 200 ? (communesRes.data as CommunesMap[]) : [],
        hospitals: hospitalsRes.status === 200 ? (hospitalsRes.data as HospitalsMap[]) : [],
        districtQuartiers: districtQuartiersRes.status === 200 ? (districtQuartiersRes.data as DistrictQuartiersMap[]) : [],
        villageSecteurs: villageSecteursRes.status === 200 ? (villageSecteursRes.data as VillageSecteursMap[]) : [],
        chws: chwsRes.status === 200 ? (chwsRes.data as ChwsMap[]) : [],
        recos: recosRes.status === 200 ? (recosRes.data as RecosMap[]) : [],
      };

      store.setOrgUnits(orgUnits);
      store.setStatus('orgUnits', 'success');
    } catch (error) {
      console.error('Error fetching org units:', error);
      store.setStatus('orgUnits', 'error');
    }
  }, []);

  // Initialize all data
  const initializeData = useCallback(async () => {
    await Promise.all([
      fetchUsers(),
      fetchRoles(),
      fetchAuthorizations(),
      fetchRoutes(),
      fetchOrgUnits(),
    ]);
  }, [fetchUsers, fetchRoles, fetchAuthorizations, fetchRoutes, fetchOrgUnits]);

  // Create or update user
  const saveUser = useCallback(async (data: UserFormData): Promise<{ success: boolean; message?: string }> => {
    store.setStatus('saving', 'loading');
    store.setError(null);

    try {
      const isUpdate = !!data.id;
      const apiCall = isUpdate ? AuthApi.updateUser(data as unknown as Record<string, unknown>) : AuthApi.createUser(data as unknown as Record<string, unknown>);
      const response = await apiCall;

      if (response.status === 200) {
        await fetchUsers(); // Refresh users list
        store.setStatus('saving', 'success');
        store.closeUserModal();
        return { success: true };
      } else {
        const message = typeof response.data === 'string' ? response.data : 'Erreur lors de la sauvegarde';
        store.setError(message);
        store.setStatus('saving', 'error');
        return { success: false, message };
      }
    } catch (error: any) {
      console.error('Error saving user:', error);
      const message = error?.response?.data?.message || 'Erreur lors de la sauvegarde';
      store.setError(message);
      store.setStatus('saving', 'error');
      return { success: false, message };
    }
  }, [fetchUsers]);

  // Delete user
  const deleteUser = useCallback(async (user: User, permanent = false): Promise<{ success: boolean; message?: string }> => {
    store.setStatus('deleting', 'loading');
    store.setError(null);

    try {
      const response = await AuthApi.deleteUser({ id: user.id }, permanent);

      if (response.status === 200) {
        store.removeUser(user.id);
        store.setStatus('deleting', 'success');
        store.closeDeleteUserModal();
        return { success: true };
      } else {
        const message = typeof response.data === 'string' ? response.data : 'Erreur lors de la suppression';
        store.setError(message);
        store.setStatus('deleting', 'error');
        return { success: false, message };
      }
    } catch (error: any) {
      console.error('Error deleting user:', error);
      const message = error?.response?.data?.message || 'Erreur lors de la suppression';
      store.setError(message);
      store.setStatus('deleting', 'error');
      return { success: false, message };
    }
  }, []);

  // Create or update role
  const saveRole = useCallback(async (data: RoleFormData): Promise<{ success: boolean; message?: string }> => {
    store.setStatus('saving', 'loading');
    store.setError(null);

    try {
      const isUpdate = !!data.id;
      const apiCall = isUpdate ? AuthApi.updateRole(data as unknown as Record<string, unknown>) : AuthApi.createRole(data as unknown as Record<string, unknown>);
      const response = await apiCall;

      if (response.status === 200) {
        await fetchRoles(); // Refresh roles list
        store.setStatus('saving', 'success');
        store.closeRoleModal();
        return { success: true };
      } else {
        const message = typeof response.data === 'string' ? response.data : 'Erreur lors de la sauvegarde';
        store.setError(message);
        store.setStatus('saving', 'error');
        return { success: false, message };
      }
    } catch (error: any) {
      console.error('Error saving role:', error);
      const message = error?.response?.data?.message || 'Erreur lors de la sauvegarde';
      store.setError(message);
      store.setStatus('saving', 'error');
      return { success: false, message };
    }
  }, [fetchRoles]);

  // Delete role
  const deleteRole = useCallback(async (role: Roles): Promise<{ success: boolean; message?: string }> => {
    store.setStatus('deleting', 'loading');
    store.setError(null);

    try {
      const response = await AuthApi.deleteRole({ id: role.id });

      if (response.status === 200) {
        store.removeRole(role.id);
        store.setStatus('deleting', 'success');
        store.closeDeleteRoleModal();
        return { success: true };
      } else {
        const message = typeof response.data === 'string' ? response.data : 'Erreur lors de la suppression';
        store.setError(message);
        store.setStatus('deleting', 'error');
        return { success: false, message };
      }
    } catch (error: any) {
      console.error('Error deleting role:', error);
      const message = error?.response?.data?.message || 'Erreur lors de la suppression';
      store.setError(message);
      store.setStatus('deleting', 'error');
      return { success: false, message };
    }
  }, []);

  // Utility functions
  const isSuperUser = useCallback((user: User): boolean => {
    return user.role?.isSuperUser === true;
  }, []);

  const orgUnitsIsEmpty = useCallback((user: User): boolean => {
    const data = [
      ...(user.countries ?? []),
      ...(user.regions ?? []),
      ...(user.prefectures ?? []),
      ...(user.communes ?? []),
      ...(user.hospitals ?? []),
      ...(user.districtQuartiers ?? []),
      ...(user.villageSecteurs ?? []),
    ];
    return data.length === 0;
  }, []);

  const getUserRoleNames = useCallback((user: User): string => {
    if (!user.roles || user.roles.length === 0) return '-';
    return user.roles.map((r) => r.name).join(', ');
  }, []);

  return {
    // State
    users: store.users,
    roles: store.roles,
    authorizations: store.authorizations,
    routes: store.routes,
    orgUnits: store.orgUnits,
    status: store.status,
    error: store.error,
    selectedUser: store.selectedUser,
    selectedRole: store.selectedRole,
    isUserModalOpen: store.isUserModalOpen,
    isRoleModalOpen: store.isRoleModalOpen,
    isDeleteUserModalOpen: store.isDeleteUserModalOpen,
    isDeleteRoleModalOpen: store.isDeleteRoleModalOpen,
    isShowRolesModalOpen: store.isShowRolesModalOpen,

    // Actions
    fetchUsers,
    fetchRoles,
    fetchAuthorizations,
    fetchRoutes,
    fetchOrgUnits,
    initializeData,
    saveUser,
    deleteUser,
    saveRole,
    deleteRole,
    openUserModal: store.openUserModal,
    closeUserModal: store.closeUserModal,
    openRoleModal: store.openRoleModal,
    closeRoleModal: store.closeRoleModal,
    openDeleteUserModal: store.openDeleteUserModal,
    closeDeleteUserModal: store.closeDeleteUserModal,
    openDeleteRoleModal: store.openDeleteRoleModal,
    closeDeleteRoleModal: store.closeDeleteRoleModal,
    openShowRolesModal: store.openShowRolesModal,
    closeShowRolesModal: store.closeShowRolesModal,

    // Utilities
    isSuperUser,
    orgUnitsIsEmpty,
    getUserRoleNames,
  };
}
