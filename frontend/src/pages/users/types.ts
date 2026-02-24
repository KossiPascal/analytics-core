export interface ApiUser {
  id: string;
  username: string;
  fullname: string | null;
  email: string | null;
  phone: string | null;
  tenant_id: string | null;
  roles: string[];
  permissions: string[];
  is_active: boolean;
  created_at: string;
}

export interface ApiRole {
  id: string;
  name: string;
  tenant_id: string | null;
  is_system: boolean;
}

export interface ApiPerm {
  id: string;
  name: string;
  description: string | null;
}

export interface ApiTenant {
  id: string;
  name: string;
}
