import { CRUDService } from '@services/acrud.service';
import { DataSource, DataSourceParams, DataSourcePermission, DataSourceType, TestType } from '@/models/datasource.models';

const datasource = new CRUDService("/datasources");
export const datasourceService = {
  all: (tenant_id: number, with_details: boolean = false) => {
    if (!tenant_id) throw Error("tenant_id is required");
    return datasource.all<DataSource>(`${with_details ? "/with-details" : ""}/${tenant_id}`)
  },

  getOne: (tenant_id: number, id: number) => {
    if (!tenant_id) throw Error("tenant_id is required");
    return datasource.all<DataSource>(`/${tenant_id}/${id}`)
  },
  create: (data: DataSource) => datasource.create<DataSource>("", data),
  update: (id: number, data: DataSource) => datasource.update<DataSource>("", id, data),
  remove: (id: number) => datasource.remove<DataSource>("", id),
  testTunnel: (type: TestType, data: DataSourceParams) => datasource.list<DataSource>(`/${type}`, data),
  testTunnelBy: (sourceId: string) => datasource.list<DataSource>(`/test-ssh-db`, { sourceId }),
  schema: (sourceId: string, table?: string) => {
    const addTable = table ? `?table=${encodeURIComponent(table)}` : '';
    return datasource.all<DataSource>(`/schema/${sourceId}${addTable}`);
  },
  schemaInfo: (table?: string) => {
    const addTable = table ? `?table=${encodeURIComponent(table)}` : '';
    return datasource.post<DataSource>(`/schema-info${addTable}`);
  },
  run: (payload: any) => datasource.post<DataSource>("/query-builder", payload),
  sshHealth: () => datasource.all<DataSource>("/ssh/health"),
  autoClean: () => datasource.all<DataSource>("/ssh/auto-clean"),
}

const types = new CRUDService("/datasource-types");
export const dsTypeService = {
  all: () => types.all<DataSourceType>(""),
  create: (data: DataSourceType) => types.create("", data),
  update: (id: number, data: DataSourceType) => types.update("", id, data),
  remove: (id: number) => types.remove("", id),
}

const permissions = new CRUDService("/datasource-permissions");
export const dsPermissionService = {
  all: (tenant_id: number) => {
    if (!tenant_id) throw Error("tenant_id is required");
    return permissions.all<DataSourcePermission>(`/${tenant_id}`);
  },
  listDatasources: (tenant_id: number, datasource_id: number) => {
    if (!tenant_id) throw Error("tenant_id is required");
    return permissions.all<DataSourcePermission>(`/datasource/${tenant_id}/${datasource_id}`);
  },
  listUsers: (tenant_id: number, user_id: number) => {
    if (!tenant_id) throw Error("tenant_id is required");
    return permissions.all<DataSourcePermission>(`/user/${tenant_id}/${user_id}`);
  },
  create: (data: DataSourcePermission) => permissions.create("", data),
  update: (id: number, data: DataSourcePermission) => permissions.update("", id, data),
  remove: (id: number) => permissions.remove("", id),
}



// DataSourceType
// DataSource
// DataSourceConnection
// DataSourceSSHConfig
// DataSourceCredential
// DataSourcePermission
// DataSourceHistory
