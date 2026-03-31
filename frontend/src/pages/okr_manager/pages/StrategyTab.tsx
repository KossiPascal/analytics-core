import { Target } from "lucide-react";
import { Column } from "@components/ui/Table/Table";
import { FormInput } from "@components/forms/FormInput/FormInput";
import { FormTextarea } from "@components/forms/FormTextarea/FormTextarea";
import { AdminEntityCrudModule } from "@pages/admins/AdminEntityCrudModule";
import { strategyService } from "../services";
import { OkrStrategy } from "../models";

const DEFAULT: OkrStrategy = {
    id: null,
    name: '',
    description: '',
    tenant_id: undefined,
};

const columns: Column<OkrStrategy>[] = [
    { key: "name", header: "Name", sortable: true, searchable: true },
    { key: "description", header: "Description" },
    { key: "axes", header: "Axes", render: (s) => s.axes?.length ?? 0 },
];

export default function StrategyTab({ tenant_id }: { tenant_id?: number }) {
    return (
        <AdminEntityCrudModule<OkrStrategy>
            title="Strategies"
            icon={<Target size={18} />}
            entityName="strategy"
            columns={columns}
            defaultValue={{ ...DEFAULT, tenant_id }}
            service={strategyService}
            isValid={(r) => !!r.name && r.name.trim().length > 0}
            renderForm={(e, set) => (
                <>
                    <FormInput
                        label="Name"
                        value={e.name}
                        onChange={(ev) => set("name", ev.target.value)}
                    />
                    <FormTextarea
                        label="Description"
                        value={e.description || ''}
                        onChange={(ev) => set("description", ev.target.value)}
                    />
                </>
            )}
        />
    );
}