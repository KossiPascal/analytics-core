import { FolderKanban } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Column } from "@components/ui/Table/Table";
import { FormInput } from "@components/forms/FormInput/FormInput";
import { FormTextarea } from "@components/forms/FormTextarea/FormTextarea";
import { FormSelect } from "@components/forms/FormSelect/FormSelect";
import { AdminEntityCrudModule } from "@pages/admins/AdminEntityCrudModule";

import { projectService, programService, teamScopeService } from "../services";
import { OkrProject, ProjectStatusEnum } from "../models";
import { teamService } from "@/services/identity.service";


export default function ProjectTab() {

    const [programs, setPrograms] = useState<any[]>([]);
    const [teams, setTeams] = useState<any[]>([]);
    const [okrTeams, setOkrTeams] = useState<any[]>([]);

    /**
     * 🔥 LOAD RELATIONS (safe)
     */
    useEffect(() => {
        programService.list().then(setPrograms).catch(() => {});
        teamService.list(0).then(setTeams).catch(() => {});
        teamScopeService.list().then(setOkrTeams).catch(() => {});
    }, []);

    /**
     * 🔥 OPTIONS (memo)
     */
    const programOptions = useMemo(
        () => programs.map(p => ({ label: p.name, value: p.id })),
        [programs]
    );

    const teamOptions = useMemo(
        () => teams.map(t => ({ label: t.name, value: t.id })),
        [teams]
    );

    const okrTeamOptions = useMemo(
        () => okrTeams.map(t => ({ label: t.name, value: t.id })),
        [okrTeams]
    );

    const statusOptions = Object.values(ProjectStatusEnum).map(s => ({
        label: s,
        value: s
    }));

    const currencyOptions = [
        { label: "USD", value: "USD" },
        { label: "EUR", value: "EUR" },
        { label: "XOF", value: "XOF" },
    ];

    /**
     * 🔥 DEFAULT SAFE
     */
    const DEFAULT: OkrProject = {
        id: undefined,
        tenant_id: undefined,
        program_id: undefined,
        team_id: undefined,
        scope_id: undefined,
        name: '',
        description: '',
        start_date: null,
        end_date: null,
        budget: null,
        donor: '',
        currency: "USD",
        spent_budget: 0,
        status: ProjectStatusEnum.DRAFT
    };

    /**
     * 🔥 FORMATTERS
     */
    const formatCurrency = (value?: number | null) =>
        value != null ? value.toLocaleString() : "-";

    /**
     * 🔥 COLUMNS
     */
    const columns: Column<OkrProject>[] = [
        {
            key: "name",
            header: "Project",
            searchable: true
        },
        {
            key: "program",
            header: "Program",
            render: (e) => e.program?.name || "-"
        },
        {
            key: "budget",
            header: "Budget",
            render: (e) => formatCurrency(e.budget)
        },
        {
            key: "spent_budget",
            header: "Spent",
            render: (e) => formatCurrency(e.spent_budget)
        },
        {
            key: "status",
            header: "Status"
        }
    ];

    return (
        <AdminEntityCrudModule<OkrProject>
            title="Projects"
            icon={<FolderKanban />}
            entityName="project"
            columns={columns}
            defaultValue={DEFAULT}
            service={projectService}
            isValid={(e) =>
                !!e.name &&
                e.name.trim().length > 0 &&
                !!e.currency &&
                !!e.status
            }
            onBeforeSave={(e) => ({
                ...e,
                budget: e.budget != null ? Number(e.budget) : null,
                spent_budget: Number(e.spent_budget || 0),
                program_id: e.program_id || null,
                team_id: e.team_id || null,
                scope_id: e.team_id || null,
            })}
            renderForm={(e, set) => (
                <>
                    <FormInput
                        label="Nom"
                        value={e.name}
                        onChange={(v) => set("name", v.target.value)}
                    />

                    <FormTextarea
                        label="Description"
                        value={e.description || ""}
                        onChange={(v) => set("description", v.target.value)}
                    />

                    <FormSelect
                        label="Programme"
                        value={e.program_id}
                        options={programOptions}
                        onChange={(v) => set("program_id", v)}
                    />

                    <FormSelect
                        label="Equipe"
                        value={e.team_id}
                        options={teamOptions}
                        onChange={(v) => set("team_id", v)}
                    />

                    <FormSelect
                        label="OKR SCOPE"
                        value={e.scope_id}
                        options={okrTeamOptions}
                        onChange={(v) => set("scope_id", v)}
                    />

                    <FormInput
                        label="Budget"
                        type="number"
                        value={e.budget ?? ''}
                        onChange={(v) => set("budget", v.target.value ? Number(v.target.value) : null)}
                    />

                    <FormInput
                        label="Budget dépensé"
                        type="number"
                        value={e.spent_budget ?? 0}
                        onChange={(v) => set("spent_budget", Number(v.target.value))}
                    />

                    <FormInput
                        label="Donor"
                        value={e.donor || ""}
                        onChange={(v) => set("donor", v.target.value)}
                    />

                    <FormSelect
                        label="Devise"
                        value={e.currency}
                        options={currencyOptions}
                        onChange={(v) => set("currency", v)}
                    />

                    <FormInput
                        type="date"
                        label="Date début"
                        value={e.start_date || ''}
                        onChange={(v) => set("start_date", v.target.value || null)}
                    />

                    <FormInput
                        type="date"
                        label="Date fin"
                        value={e.end_date || ''}
                        onChange={(v) => set("end_date", v.target.value || null)}
                    />

                    <FormSelect
                        label="Statut"
                        value={e.status}
                        options={statusOptions}
                        onChange={(v) => set("status", v)}
                    />
                </>
            )}
        />
    );
}