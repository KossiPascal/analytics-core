// src/models/auth.ts

export interface Role {
  id: string;
  name: string;
  permissions: string[];
}

export interface User {
  id: string;               // UUID
  tenant_id: string;       // UUID of the tenant
  email?: string;
  email_verified_at?: string;
  username: string;
  password: string;
  fullname: string;
  roles: Role[];        // relations
  permissions: string[];
  password_hash?: string;
  is_admin?: boolean;
  is_superadmin?: boolean;
  // [key: string]: any;       // pour propriétés supplémentaires dynamiques
  phone?: string;
  is_active?: boolean;
  deleted?: boolean;
  must_login?: boolean;
  has_changed_default_password?: boolean;
  created_at?: string;      // ISO timestamp
  updated_at?: string;
}

export interface PayloadUser {
    id: string;
    username: string;
    fullname: string;
    tenant_id: string | undefined;
    roles: string[];
    mustChangeDefaultPassword:boolean;
    token:string;
  }

export interface LoginResponse {
  access_token: string;
  access_token_exp: number,
  refresh_token: string;
  refresh_token_exp: number,
  payload: PayloadUser
}

export type ApiResponse<T> = {
  status: number;
  success: boolean;
  data?: T;
  error?: any;
  headers?: Headers | any;
};