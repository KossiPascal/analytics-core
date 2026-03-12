import { Key } from 'lucide-react';
import { forwardRef, useEffect, useMemo, useState } from 'react';
import { type Column } from '@components/ui/Table/Table';
import { AdminEntityCrudModuleRef, AdminEntityCrudModule } from '@pages/admins/AdminEntityCrudModule';
import { DataSource, DataSourcePermission, DataSourceType, DB_PERMISSION_ROLE_LIST } from '@/models/datasource.models';
import { datasourceService, dsPermissionService, dsTypeService } from '@/services/datasource.service';
import { FormSelect } from '@/components/forms/FormSelect/FormSelect';
import { Tenant, User } from '@/models/identity.model';
import { userService } from '@/services/identity.service';

const createDefaultForm = (tenant_id: number): DataSourcePermission => ({
    id: null,
    tenant_id: tenant_id,
    type_id: null,
    datasource_id: null,
    connection_id: null,
    user_id: null,
    role: "read",
});

const dsPermissionColumns: Column<DataSourcePermission>[] = [
    {
        key: "tenant",
        header: "Tenant",
        render: (p) => p.tenant?.name ?? "-",
        sortable: true,
        searchable: true,
    },
    {
        key: "type",
        header: "Type",
        render: (p) => p.type?.name ?? "-",
        sortable: true,
        searchable: true,
    },
    {
        key: "user",
        header: "User",
        render: (p) => p.user?.username ?? "-",
        sortable: true,
        searchable: true,
    },
    {
        key: "role",
        header: "Role",
        render: (p) => p.role || "-",
        sortable: true,
        searchable: true,
    },
    {
        key: "datasource",
        header: "Datasource",
        render: (p) => p.datasource?.name ?? "-",
        sortable: true,
        searchable: true,
    },
    {
        key: "connection",
        header: "Connection",
        render: (p) => p.connection?.id ?? "-",
        sortable: true,
        searchable: true,
    },
];

interface DataSourcePermissionTabProps {
    tenants: Tenant[];
    tenant_id: number
}

export const DataSourcePermissionTab = forwardRef<AdminEntityCrudModuleRef, DataSourcePermissionTabProps>(({ tenants, tenant_id }, ref) => {
    const [types, setTypes] = useState<DataSourceType[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [datasources, setDatasources] = useState<DataSource[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const typeRes = await dsTypeService.all();
            const userRes = await userService.all();
            let datasourceRes: DataSource[] = [];
            if (tenant_id) datasourceRes = await datasourceService.all(tenant_id);

            setTypes(typeRes || []);
            setUsers(userRes || []);
            setDatasources(datasourceRes || []);
        } catch {
            // showError(`Erreur chargement`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    const DEFAULT_FORM = useMemo(() => createDefaultForm(tenant_id), [tenant_id])

    return (
        <AdminEntityCrudModule<DataSourcePermission>
            ref={ref}
            title="Gestion des permissions"
            icon={<Key size={20} />}
            entityName="Permission"
            columns={dsPermissionColumns}
            defaultValue={DEFAULT_FORM}
            service={dsPermissionService}
            // isValid={(p) => {
            //     return p.name.trim().length > 0;
            //     // /^can:(create|read|update|delete)$/.test(p.name);
            // }}
            renderForm={(permission, setValue) => (
                <>
                    {/* <FormSelect
                        label={`Tenant`}
                        value={permission.tenant_id || tenant_id}
                        options={tenants.map((c) => ({ value: c.id, label: c.name }))}
                        onChange={(value) => { setValue("tenant_id", value) }}
                        placeholder="Ex: postgresql"
                        required={true}
                    /> */}
                    <FormSelect
                        label={`Type`}
                        value={permission.type_id}
                        options={types.map((t) => ({ value: t.id, label: t.name }))}
                        onChange={(value) => { setValue("type_id", value) }}
                        placeholder="Ex: db"
                        required={true}
                    />
                    <FormSelect
                        label={`User`}
                        value={permission.user_id}
                        options={users.map((u) => ({ value: u.id, label: u.fullname ?? u.username }))}
                        onChange={(value) => { setValue("user_id", value) }}
                        placeholder="Ex: postgresql"
                        required={true}
                    />
                    <FormSelect
                        label={`Role`}
                        value={permission.role}
                        options={DB_PERMISSION_ROLE_LIST.map((r) => ({ value: r, label: r }))}
                        onChange={(value) => { setValue("role", value) }}
                        placeholder="Ex: db"
                        required={true}
                    />
                    <FormSelect
                        label={`Datasource`}
                        value={permission.datasource_id}
                        options={datasources.map((s) => ({ value: s.id, label: s.name }))}
                        onChange={(value) => { setValue("datasource_id", value) }}
                        placeholder="Ex: db"
                        required={true}
                    />
                    <FormSelect
                        label={`Connection`}
                        value={permission.connection_id}
                        options={[{ id: "", name: "" }].map((c) => ({ value: c.id, label: c.name }))}
                        onChange={(value) => { setValue("connection_id", value) }}
                        placeholder="Ex: db"
                        required={true}
                    />
                </>
            )}
        />
    );
});
