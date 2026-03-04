import { Tenant, User, Role, Permission, RolePermissionLink, UserRole, UsersLog, Orgunit, OrgUnitLevel } from '@/models/identity.model';
import { CRUDService } from '@services/acrud.service';

const identity = new CRUDService("/identities");


const test = async (): Promise<boolean> => {
    return true;
}

export const tenantService = {
    all: (tenant_id?:number) => identity.all<Tenant>("/tenants",),
    create: (tenant: Tenant) => identity.create("/tenants", tenant),
    update: (id: number, tenant: Tenant) => identity.update("/tenants", id, tenant),
    remove: (id: number) => identity.remove("/tenants", id),
}

export const orgunitService = {
    all: (tenant_id?:number) => identity.all<Orgunit>("/orgunits"),
    create: (ou: Orgunit) => identity.create("/orgunits", ou),
    update: (id: number, ou: Orgunit) => identity.update("/orgunits", id, ou),
    remove: (id: number) => identity.remove("/orgunits", id),
}

export const levelService = {
    all: () => identity.all<OrgUnitLevel>("/levels"),
    create: (lv: OrgUnitLevel) => identity.create("/levels", lv),
    update: (id: number, lv: OrgUnitLevel) => identity.update("/levels", id, lv),
    remove: (id: number) => identity.remove("/levels", id),
}

export const userService = {
    all: (tenant_id?:number) => identity.all<User>("/users"),
    create: (user: User) => identity.create("/users", user),
    update: (id: number, user: User) => identity.update("/users", id, user),
    remove: (id: number) => identity.remove("/users", id),
}

export const roleService = {
    all: (tenant_id?:number) => identity.all<Role>("/roles"),
    create: (role: Role) => identity.create("/roles", role),
    update: (id: number, role: Role) => identity.update("/roles", id, role),
    remove: (id: number) => identity.remove("/roles", id),
}

export const permissionService = {
    all: (tenant_id?:number) => identity.all<Permission>("/permissions"),
    create: (permission: Permission) => identity.create("/permissions", permission),
    update: (id: number, permission: Permission) => identity.update("/permissions", id, permission),
    remove: (id: number) => identity.remove("/permissions", id),
}

export const rolePermissionService = {
    all: (tenant_id?:number) => identity.all<RolePermissionLink>("/utils/roles-permissions"),
    create: (rp: RolePermissionLink) => test(),
    update: (id: number, rp: RolePermissionLink) => test(),
    remove: (id: number) => test(),
}

export const usersLogService = {
    all: (tenant_id?:number) => identity.all<UsersLog>("/utils/users-logs"),
    create: (ul: UsersLog) => test(),
    update: (id: number, ul: UsersLog) => test(),
    remove: (id: number) => test(),
}

export const userRoleService = {
    all: (tenant_id?:number) => identity.all<UserRole>("/utils/users-roles"),
    create: (ur: UserRole) => test(),
    update: (id: number, ur: UserRole) => test(),
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
    syncLevels:   (tenant_id?: number | null) => identity.create<SyncResult>("/sync/levels",   { tenant_id }),
    syncOrgunits: (tenant_id?: number | null) => identity.create<SyncResult>("/sync/orgunits", { tenant_id }),
    syncAscs:     (tenant_id: number, position_code?: string) =>
        identity.create<AscSyncResult>("/sync/ascs", { tenant_id, position_code }),
}
