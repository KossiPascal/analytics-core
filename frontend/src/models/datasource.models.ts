import { Dataset } from "./dataset.models";
import { Tenant, User } from "./identity.model";

export type DbTypeCode = 'postgresql' | 'mysql' | 'mssql' | 'mariadb' | 'sqlite' | 'couchdb' | 'mongodb' | 'oracle' | 'other';
export type DbTarget = 'couchdb' | 'db';
export type DbPermissionRole = "none" | "read" | "write" | "admin" | "owner";
export type TestType = "test-ssh" | "test-ssh-db";
export type ConnectionStatus = "prod" | "dev" | "staging";

export const DB_TYPE_CODE_LIST: DbTypeCode[] = ['postgresql', 'mysql', 'mssql', 'mariadb', 'sqlite', 'couchdb', 'mongodb', 'oracle', 'other'];
export const DB_TARGET_LIST: DbTarget[] = ['couchdb', 'db'];
export const DB_PERMISSION_ROLE_LIST: DbPermissionRole[] = ["none", "read", "write", "admin", "owner"];

export interface DataSourceType {
  id: number | null;
  name: string;
  code: DbTypeCode;
  target: DbTarget;
  config?: Record<string, any>;
  description: string;
  datasources?: DataSource[]
  connections?:DataSourceConnection[]
  ssh_configs?:DataSourceSSHConfig[]
  credentials?:DataSourceCredential[]
  permissions?:DataSourcePermission[]
  histories?:DataSourceHistory[]
  is_active: boolean
}

export interface DataSource {
  id: number | null;
  tenant_id: number | null
  tenant?: Tenant
  type_id: number | null
  type?: DataSourceType;
  name: string;
  technical_name: string;
  description: string;
  dbname: string;
  username: string;
  password?: string;
  host: string;
  port: number;
  ssh_enabled: boolean;
  ssh_host?: string;
  ssh_port?: number;
  ssh_username?: string;
  ssh_password?: string;
  ssh_key?: string;
  ssh_key_pass?: string;
  details?: DataSourceDetails
  auto_sync: boolean;
  is_main?: boolean;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
  last_sync?: string
  last_used_at?: string
  connections?: DataSourceConnection[]
  credentials?: DataSourceCredential[]
  permissions?: DataSourcePermission[]
  datasets?: Dataset[]
}

export interface DataSourceConnection {
  id: number | null;
  tenant_id: number | null
  type_id: number | null
  datasource_id: number | null
  status: ConnectionStatus
  host: string
  port: number
  dbname: string
  ssh_enabled: boolean;
  tenant?: Tenant
  type?: DataSourceType
  datasource?: DataSource
  credential?: DataSourceCredential
  ssh_config?: DataSourceSSHConfig
  datasets?: Dataset[]
  permissions?: DataSourcePermission[]
  histories?: DataSourceHistory
}

export interface DataSourceSSHConfig {
  id: number | null;
  tenant_id: number | null
  type_id: number | null
  datasource_id: number | null
  connection_id: number | null
  use_ssh_key: boolean
  host: string
  port: number
  tenant?: Tenant
  type?: DataSourceType
  datasource?: DataSource
  connection?: DataSourceConnection
  credential?: DataSourceCredential
}

export interface DataSourceCredential {
  id: number | null;
  tenant_id: number | null
  type_id: number | null
  datasource_id: number | null
  ssh_config_id: number | null
  connection_id: number | null
  username: string
  password: string
  ssh_username: string
  ssh_password: string
  ssh_key: string
  ssh_key_pass: string
  tenant?: Tenant
  type?: DataSourceType;
  datasource?: DataSource
  ssh_config?: DataSourceSSHConfig
  connection?: DataSourceConnection
}

export interface DataSourcePermission {
  id: number | null
  tenant_id: number | null
  type_id: number | null
  datasource_id: number | null
  connection_id: number | null
  user_id: number | null
  role: DbPermissionRole
  tenant?: Tenant
  type?: DataSourceType
  user?: User
  datasource?: DataSource
  connection?: DataSourceConnection
  histories?: DataSourceHistory[]
}

export interface DataSourceDetails {
  functions: any[],
  indexes: any[],
  materialized_views: any[],
  schemas: any[],
  sequences: any[],
  tables: {
    columns: { default: string, name: string, nullable: boolean, type: string }[],
    foreign_keys: any[];
    indexes: any[],
    primary_key: string[];
    table_name: string
  }[],
  triggers: any[],
  views: any[]
}

export interface DataSourceHistory {
  id: number | null;
  tenant_id: number | null
  type_id: number | null
  datasource_id: number | null
  connection_id: number | null
  permission_id: number | null
  user_id: number | null
  action: string
  table_name: string
  record_id: string
  timestamp: string
  tenant?: Tenant
  type?: DataSourceType
  connection?: DataSourceConnection
  permission?: DataSourcePermission
  datasource?: DataSource
  user?: User
}

export interface DataSourceParams {
  id?: number | null;
  type: DbTypeCode;
  name: string;
  description: string;
  host: string;
  username: string;
  dbname: string;
  port: number;
  password?: string;
  auto_sync: boolean;
  ssh?: {
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    key?: string;
    key_pass?: string;
  } | null;
}
