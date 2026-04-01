// src/models/tenant.ts
export interface Tenant {
  id: string;
  name: string;
  created_at?: string;
}

export interface Permission {
  id: string;
  name: string;       // ex: "dashboard", "chart"
  description?: string;
  deleted?: boolean;
  deleted_at?: string;
}

export interface Role {
  id: string;
  name: string;
  tenant_id?: string;     // nullable pour roles système
  is_system?: boolean;
  deleted?: boolean;
  deleted_at?: string;
  permissions?: Permission[]; // relations
}


export interface RolePermission {
  role_id: string;
  permission_id: string;
}


export interface Role {
  user_id: string;
  role_id: string;
}























