import { Dataset } from "./dataset.models";
import { Tenant, User } from "./identity.model";

export type DbSourceType = 'postgresql' | 'mysql' | 'mssql' | 'mariadb' | 'sqlite' | 'mongodb' | 'oracle' | 'other';
export type DbPermissionRole = "none" | "read" | "write" | "admin" | "owner";
export type TestType = "test-ssh" | "test-ssh-db";
export type ConnectionStatus = "prod" | "dev" | "staging";

export const DB_TYPE_CODE_LIST: DbSourceType[] = ['postgresql', 'mysql', 'mssql', 'mariadb', 'sqlite', 'mongodb', 'oracle', 'other'];
export const DB_PERMISSION_ROLE_LIST: DbPermissionRole[] = ["none", "read", "write", "admin", "owner"];

export const DB_SOURCE_TYPES: { value: DbSourceType, name: string }[] = [
  { value: "postgresql", name: "PostgreSQL" },
  { value: "mysql", name: "MySQL" },
  { value: "mariadb", name: "MariaDB" },
  { value: "mssql", name: "SQL Server" },
  { value: "oracle", name: "Oracle" },
  { value: "mongodb", name: "MongoDB" },
  { value: "sqlite", name: "SQLite" },
  { value: "other", name: "Autre" },
]

export interface DataSource {
  id: number | null;
  tenant_id: number | null
  tenant?: Tenant
  type: DbSourceType
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
  type: DbSourceType
  datasource_id: number | null
  status: ConnectionStatus
  host: string
  port: number
  dbname: string
  ssh_enabled: boolean;
  tenant?: Tenant
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
  type: DbSourceType
  datasource_id: number | null
  connection_id: number | null
  use_ssh_key: boolean
  host: string
  port: number
  tenant?: Tenant
  datasource?: DataSource
  connection?: DataSourceConnection
  credential?: DataSourceCredential
}

export interface DataSourceCredential {
  id: number | null;
  tenant_id: number | null
  type: DbSourceType
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
  datasource?: DataSource
  ssh_config?: DataSourceSSHConfig
  connection?: DataSourceConnection
}

export interface DataSourcePermission {
  id: number | null
  tenant_id: number | null
  type: DbSourceType
  datasource_id: number | null
  connection_id: number | null
  user_id: number | null
  role: DbPermissionRole
  tenant?: Tenant
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
  type: DbSourceType
  datasource_id: number | null
  connection_id: number | null
  permission_id: number | null
  user_id: number | null
  action: string
  table_name: string
  record_id: string
  timestamp: string
  tenant?: Tenant
  connection?: DataSourceConnection
  permission?: DataSourcePermission
  datasource?: DataSource
  user?: User
}

export interface DataSourceParams {
  id?: number | null;
  type: DbSourceType;
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
