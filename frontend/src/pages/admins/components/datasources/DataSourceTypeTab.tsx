import { Key } from 'lucide-react';
import { forwardRef } from 'react';
import { type Column } from '@components/ui/Table/Table';
import { FormInput } from '@components/forms/FormInput/FormInput';
import { FormTextarea } from '@components/forms/FormTextarea/FormTextarea';
import { AdminEntityCrudModuleRef, AdminEntityCrudModule } from '@pages/admins/AdminEntityCrudModule';
import { DataSourceType, DB_TARGET_LIST, DB_TYPE_CODE_LIST } from '@/models/datasource.models';
import { FormSelect } from '@/components/forms/FormSelect/FormSelect';
import { dsTypeService } from '@/services/datasource.service';
import { FormCheckbox } from '@/components/forms/FormCheckbox/FormCheckbox';

const defaultType: DataSourceType = {
    id: null,
    name: "",
    code: "postgresql",
    target: "db",
    config: {},
    description: "",
    is_active: false
};

const typeColumns: Column<DataSourceType>[] = [
    {
        key: "name",
        header: "Nom",
        sortable: true,
        searchable: true,
    },
    {
        key: "code",
        header: "Code",
        sortable: true,
        searchable: true,
    },
    {
        key: "target",
        header: "Target",
        sortable: true,
        searchable: true,
    },
    {
        key: "description",
        header: "Description",
        sortable: true,
        searchable: true,
        render: (p) => p.description || "-",
    },
];

export const DataSourceTypeTab = forwardRef<AdminEntityCrudModuleRef>((props, ref) => {
    return (
        <AdminEntityCrudModule<DataSourceType>
            ref={ref}
            title="Gestion des types"
            icon={<Key size={20} />}
            entityName="Type"
            columns={typeColumns}
            defaultValue={defaultType}
            service={dsTypeService}
            isValid={(p) => {
                return p.name.trim().length > 0;
                // /^can:(create|read|update|delete)$/.test(p.name);
            }}
            renderForm={(type, setValue) => (
                <>
                    <FormInput
                        label="Nom"
                        placeholder="Ex: Postgres"
                        value={type.name}
                        onChange={(e) => setValue("name", e.target.value)}
                        required={true}
                    />
                    <FormSelect
                        label={`Code`}
                        value={type.code}
                        options={DB_TYPE_CODE_LIST.map((c) => ({ value: c, label: c }))}
                        onChange={(value) => { setValue("code", value) }}
                        placeholder="Ex: postgresql"
                        required={true}
                    />
                    <FormSelect
                        label={`Target`}
                        value={type.target}
                        options={DB_TARGET_LIST.map((t) => ({ value: t, label: t }))}
                        onChange={(value) => { setValue("target", value) }}
                        placeholder="Ex: db"
                        required={true}
                    />
                    <FormTextarea
                        label="Description"
                        hint="Optionnel"
                        placeholder="Description"
                        value={type.description || ""}
                        onChange={(e) => setValue("description", e.target.value)}
                    />
                    <FormCheckbox
                        label={`Is Active`}
                        checked={Boolean(type.is_active)}
                        onChange={(e) => setValue("is_active", e.target.checked)}
                    />
                </>
            )}
        />
    );
});
