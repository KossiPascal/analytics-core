import { Column } from "@components/ui/Table/Table";
import { FormInput } from "@components/forms/FormInput/FormInput";
import { FormSelect } from "@components/forms/FormSelect/FormSelect";
import { AdminEntityCrudModule } from "@pages/admins/AdminEntityCrudModule";
import { OkrStrategicAxis, OkrStrategy } from "../models";
import { strategicAxisService } from "../services";

const DEFAULT: OkrStrategicAxis = {
    id: null,
    name: '',
    description: '',
    tenant_id: undefined,
    strategy_id: undefined
};

export default function StrategicAxisTab({ strategies }: { strategies: OkrStrategy[] }) {

    const columns: Column<OkrStrategicAxis>[] = [
        { key: "name", header: "Name", searchable: true },
        { key: "strategy", header: "Strategy", render: (e) => e.strategy?.name ?? "⚠ Aucun" },
    ];

    return (
        <AdminEntityCrudModule<OkrStrategicAxis>
            title="Strategic Axes"
            icon={undefined}
            entityName="strategic_axis"
            columns={columns}
            defaultValue={DEFAULT}
            service={strategicAxisService}
            isValid={(r) => !!r.name && r.name.trim().length > 0}
            renderForm={(e, set) => (
                <>
                    <FormInput
                        label="Name"
                        value={e.name}
                        onChange={(v) => set("name", v.target.value)}
                    />

                    <FormSelect
                        label="Strategy"
                        value={e.strategy_id ?? null}
                        options={strategies.map(s => ({ value: s.id!, label: s.name }))}
                        onChange={(v) => set("strategy_id", v)}
                        placeholder="Select a strategy"
                    />

                    <FormInput
                        label="Description"
                        value={e.description || ''}
                        onChange={(v) => set("description", v.target.value)}
                    />
                </>
            )}
        />
    );
}