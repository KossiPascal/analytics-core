// import { OkrProgram, OkrProject, OkrTeamScope, OkrActivity } from "@/pages/okr_manager/models";
// import { Tenant, Role, User } from "./identity.model";


export interface Team {
    id: number | null;
    tenant_id: number | null;
    parent_id: number | null;
    role_id: number | null;
    name: string;

    // tenant?: Tenant
    // parent?: Team
    // role?: Role

    // children?:Team;
    // programs?:OkrProgram;
    // projects?:OkrProject;
    // teams?:OkrTeamScope;
    // activities?:OkrActivity;
}

export interface Membership {
    team_id: number | null;
    user_id: number | null;

    // team?:Team;
    // user?:User;
}
