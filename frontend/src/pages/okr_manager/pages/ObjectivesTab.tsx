import { Target } from 'lucide-react';
import { forwardRef } from 'react';
import { Column } from "@components/ui/Table/Table";
import { FormInput } from "@components/forms/FormInput/FormInput";
import { FormTextarea } from "@components/forms/FormTextarea/FormTextarea";
import { StatusBadge } from "@components/ui/Badge/Badge";
import { AdminEntityCrudModule, AdminEntityCrudModuleRef } from "@pages/admins/AdminEntityCrudModule";

import { objectivesService } from "../services";
import { OkrGlobalStatusEnum, OkrObjective } from "../models";
import { FormSelect } from '@/components/forms/FormSelect/FormSelect';

export const ObjectiveTab = forwardRef<AdminEntityCrudModuleRef>((_, ref) => {

    const DEFAULT: OkrObjective = {
        id: undefined,
        tenant_id: undefined,
        name: '',
        description: '',
        initiative_id: undefined,
        team_id: undefined,
        start_date: null,
        end_date: null,
        status: OkrGlobalStatusEnum.DRAFT
    };

    const columns: Column<OkrObjective>[] = [
        {
            key: "name",
            header: "Objectif",
            searchable: true
        },
        {
            key: "start_date",
            header: "Début",
            render: (e) => e.start_date || "-"
        },
        {
            key: "end_date",
            header: "Fin",
            render: (e) => e.end_date || "-"
        },
        {
            key: "status",
            header: "Statut",
            render: (e) => e.status
        },
        {
            key: "keyresults",
            header: "KRs",
            render: (e) => e.keyresults?.length
                ? e.keyresults.length
                : "⚠ Aucun"
        }
    ];

    return (
        <AdminEntityCrudModule<OkrObjective>
            ref={ref}
            title="Objectifs"
            icon={<Target />}
            entityName="objective"
            columns={columns}
            defaultValue={DEFAULT}
            service={objectivesService}

            isValid={(e) =>
                !!e.name &&
                e.name.trim().length > 0 &&
                (!e.start_date || !e.end_date || e.start_date <= e.end_date)
            }

            renderForm={(e, set) => (
                <>
                    <FormInput
                        label="Nom"
                        value={e.name}
                        onChange={(ev) => set("name", ev.target.value)}
                    />

                    <FormTextarea
                        label="Description"
                        value={e.description}
                        onChange={(ev) => set("description", ev.target.value)}
                    />

                    <FormInput
                        type="date"
                        label="Date de début"
                        value={e.start_date || ""}
                        onChange={(ev) => set("start_date", ev.target.value)}
                    />

                    <FormInput
                        type="date"
                        label="Date de fin"
                        value={e.end_date || ""}
                        onChange={(ev) => set("end_date", ev.target.value)}
                    />

                    <FormSelect
                        label="Statut"
                        value={e.status}
                        options={Object.values(OkrGlobalStatusEnum).map(s => ({
                            label: s,
                            value: s
                        }))}
                        onChange={(val) => set("status", val)}
                    />
                </>
            )}
        />
    );
});