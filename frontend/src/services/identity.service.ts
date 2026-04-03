import { Tenant, User, Role, Permission, RolePermission, Role, UsersLog, Orgunit, OrgUnitLevel, HostLinks } from '@/models/identity.model';
import { Team } from '@/models/team.model';
import { CRUDService } from '@services/acrud.service';

const identity = new CRUDService(`/identities`);


const test = async (): Promise<boolean> => {
    return true;
}

export const tenantService = {
    list: (tenant_id?:number) => identity.all<Tenant>(`/tenants`,),
    create: (tenant: Tenant) => identity.create(`/tenants`, tenant),
    update: (id: number, tenant: Tenant) => identity.update(`/tenants`, id, tenant),
    remove: (id: number) => identity.remove(`/tenants`, id),
}

export const HostLinksService = {
    list: (tenant_id:number) => identity.all<HostLinks>(`/tenant-sources`, { options: { params: { tenant_id } } }),
    create: (source: HostLinks) => identity.create(`/tenant-sources`, source),
    update: (id: number, source: HostLinks) => identity.update(`/tenant-sources`, id, source),
    remove: (id: number) => identity.remove(`/tenant-sources`, id),
}

export const teamService = {
    list: (tenant_id:number) => identity.all<Team>(`/team`, { options: { params: { tenant_id } } }),
    create: (source: Team) => identity.create(`/team`, source),
    update: (id: number, source: Team) => identity.update(`/team`, id, source),
    remove: (id: number) => identity.remove(`/team`, id),
}

export const orgunitService = {
    list: (tenant_id:number) => identity.all<Orgunit>(`/orgunits`, { options: { params: { tenant_id } } }),
    create: (ou: Orgunit) => identity.create(`/orgunits`, ou),
    update: (id: number, ou: Orgunit) => identity.update(`/orgunits`, id, ou),
    remove: (id: number) => identity.remove(`/orgunits`, id),
}

export const levelService = {
    list: (tenant_id:number) => identity.all<OrgUnitLevel>(`/levels`, { options: { params: { tenant_id } } }),
    create: (lv: OrgUnitLevel) => identity.create(`/levels`, lv),
    update: (id: number, lv: OrgUnitLevel) => identity.update(`/levels`, id, lv),
    remove: (id: number) => identity.remove(`/levels`, id),
}

export const userService = {
    list: (tenant_id:number) => identity.all<User>(`/users`, { options: { params: { tenant_id } } }),
    create: (user: User) => identity.create(`/users`, user),
    update: (id: number, user: User) => identity.update(`/users`, id, user),
    remove: (id: number) => identity.remove(`/users`, id),
}

export const roleService = {
    list: (tenant_id:number) => identity.all<Role>(`/roles`, { options: { params: { tenant_id } } }),
    create: (role: Role) => identity.create(`/roles`, role),
    update: (id: number, role: Role) => identity.update(`/roles`, id, role),
    remove: (id: number) => identity.remove(`/roles`, id),
}

export const permissionService = {
    list: (tenant_id:number) => identity.all<Permission>(`/permissions`, { options: { params: { tenant_id } } }),
    create: (permission: Permission) => identity.create(`/permissions`, permission),
    update: (id: number, permission: Permission) => identity.update(`/permissions`, id, permission),
    remove: (id: number) => identity.remove(`/permissions`, id),
}

export const rolePermissionService = {
    list: (tenant_id:number) => identity.all<RolePermission>(`/utils/roles-permissions`, { options: { params: { tenant_id } } }),
    create: (rp: RolePermission) => test(),
    update: (id: number, rp: RolePermission) => test(),
    remove: (id: number) => test(),
}

export const usersLogService = {
    list: (tenant_id:number) => identity.all<UsersLog>(`/utils/users-logs`, { options: { params: { tenant_id } } }),
    create: (ul: UsersLog) => test(),
    update: (id: number, ul: UsersLog) => test(),
    remove: (id: number) => test(),
}

export const RoleService = {
    list: (tenant_id:number) => identity.all<Role>(`/utils/users-roles`, { options: { params: { tenant_id } } }),
    create: (ur: Role) => test(),
    update: (id: number, ur: Role) => test(),
    remove: (id: number) => test(),
}

export interface SyncResult {
    created: number;
    updated: number;
    total: number;
}

export interface AscSyncResult {
    created_users: number;
    updated_users: number;
    created_employees: number;
    updated_employees: number;
    skipped: number;
    total: number;
}

export const identitySyncService = {
    syncLevels:   (tenant_id?: number | null) => identity.create<SyncResult>(`/sync/levels`,   { tenant_id } as any),
    syncOrgunits: (tenant_id?: number | null) => identity.create<SyncResult>(`/sync/orgunits`, { tenant_id } as any),
    syncAscs:     (tenant_id: number, position_code?: string) =>
        identity.create<AscSyncResult>(`/sync/ascs`, { tenant_id, position_code } as any),
}
