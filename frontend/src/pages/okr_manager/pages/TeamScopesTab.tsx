import { useEffect, useState, useMemo, forwardRef } from "react";
import { AdminEntityCrudModule, AdminEntityCrudModuleRef } from "@pages/admins/AdminEntityCrudModule";
import { Column } from "@components/ui/Table/Table";
import { FormInput } from "@components/forms/FormInput/FormInput";
import { FormTextarea } from "@components/forms/FormTextarea/FormTextarea";
import { FormSelect } from "@components/forms/FormSelect/FormSelect";
import { OkrTeamScope, OkrGlobalStatusEnum } from "../models";
import { teamScopeService } from "../services";

const DEFAULT: OkrTeamScope = {
  id: null,
  tenant_id: undefined,
  team_id: undefined,
  global_id: undefined,
  name: '',
  description: '',
  status: OkrGlobalStatusEnum.DRAFT,
};

export const TeamScopesTab = forwardRef<AdminEntityCrudModuleRef>((_, ref) => {
  const [globals, setGlobals] = useState<{ id: number; name: string }[]>([]); // pour select OKR Global
  const [teams, setTeams] = useState<{ id: number; name: string }[]>([]); // pour select Team

  const columns: Column<OkrTeamScope>[] = [
    { key: "name", header: "Nom", searchable: true },
    { key: "team", header: "Équipe", render: (t) => t.team?.name || `#${t.team_id}` },
    { key: "global", header: "OKR Global", render: (t) => t.global?.name || `#${t.global_id}` },
    { key: "status", header: "Statut" },
  ];

  useEffect(() => {
    // TODO: récupérer la liste des équipes et des OKR Global pour les selects
    // Exemple :
    // teamsService.list().then(setTeams);
    // okrGlobalService.list().then(setGlobals);
  }, []);

  return (
    <AdminEntityCrudModule<OkrTeamScope>
      ref={ref}
       icon={undefined} 
      title="Team Scopes"
      entityName="team_scope"
      service={teamScopeService} // teamScopeService
      columns={columns}
      defaultValue={DEFAULT}
      isValid={(t) => !!t.name && t.name.trim().length > 0}
      renderForm={(e, set) => (
        <>
          <FormInput label="Nom" value={e.name} onChange={(v) => set("name", v.target.value)} />
          <FormTextarea label="Description" value={e.description} onChange={(v) => set("description", v.target.value)} />

          <FormSelect
            label="Équipe"
            value={e.team_id}
            options={teams.map((team) => ({ value: team.id, label: team.name }))}
            onChange={(v) => set("team_id", v)} />

          <FormSelect
            label="OKR Global"
            value={e.global_id}
            options={globals.map((g) => ({ value: g.id, label: g.name }))}
            onChange={(v) => set("global_id", v)} />

          <FormSelect
            label="Statut"
            value={e.status}
            options={Object.values(OkrGlobalStatusEnum).map((s) => ({ value: s, label: s }))}
            onChange={(v) => set("status", v)} />
        </>
      )}   />
  );
});