export interface Tenant {
  id: number | null;
  name: string;
  description?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CountryDatasource {
  id: number | null;
  tenant_id: number | null;
  fetch_limit: number;
  chunk_size: number;
  name: string;
  host: string;
  target: 'cht' | 'dhis2';
  username?: string;
  password?: string;
  https: boolean;
  is_active: boolean;
  update_auth: boolean;
  config?: Record<string, any>
  tenant?: Tenant
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/** Niveau hiérarchique de l'arborescence (style DHIS2). */
export interface OrgUnitLevel {
  id: number | null;
  tenant_id: number | null;
  name: string;
  code: string;            // code DHIS2
  level: number;           // 1 = National, 2 = Régional, …
  display_name?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Orgunit {
  id: number | null;
  name: string;
  tenant_id: number | null;
  tenant?: Tenant;
  level_id?: number | null;
  level?: OrgUnitLevel;
  code?: string;
  external_id?: string;
  parent_id?: number | null;
  parent?: Orgunit;
  children_ids?: number[];
  children?: Orgunit[];
  path?: string;
  description?: string;
  is_active?: boolean;
  coordinates?: Coordinates;
  metadata?: Record<string, unknown>;
}

export interface Permission {
  id: number | null;
  name: string; //can:create, can:read, can:update, can:delete
  description?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Role {
  id: number | null;
  name: string;
  description: string;
  tenant_id: number | null;
  tenant?: Tenant;
  permission_ids: number[];
  permissions?: Permission[];
  is_system: boolean;
  deleted?: boolean;
}

export interface User {
  id: number | null;
  username: string;
  lastname: string;
  firstname: string;
  fullname?: string;
  password: string;
  password_confirm: string;
  email: string;
  phone: string;
  tenant_id: number | null;
  tenant?: Tenant;
  role_ids: number[];
  roles?: Role[];
  permission_ids: number[];
  permissions?: Permission[];
  orgunit_ids: number[];
  orgunits?: Orgunit[];
  is_active?: boolean;
  deleted?: boolean;
  deleted_at?: Date | null;
  created_at?: string;
  updated_at?: string;
}

export interface RolePermission {
  id: number | null;
  role_id: number | null;
  role?: Role;
  permission_id: number | null;
  permission?: Permission;
}

export interface Role {
  id: number | null;
  user_id: number | null;
  user?: User;
  role_id: number | null;
  role?: Role;
}

export interface UsersLog {
  id: number | null;
  user_id: number;
  user_agent: string;
}
