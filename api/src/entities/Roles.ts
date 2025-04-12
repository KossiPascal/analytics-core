import { Entity, Column, Repository, DataSource, PrimaryGeneratedColumn } from "typeorm"
import { AppDataSource } from '../data-source';
import { notEmpty } from "../functions/functions";
import { Routes, FullRolesUtils } from "./User";

let Connection: DataSource = AppDataSource.manager.connection;

@Entity("roles", {
    orderBy: {
        name: "ASC",
        id: "DESC"
    }
})
export class Roles {
    constructor() { };
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ unique: true, type: 'varchar', nullable: false })
    name!: string

    @Column({ type: 'jsonb', nullable: true })
    authorizations!: string[]

    @Column({ type: 'jsonb', nullable: true })
    routes!: Routes[]

    @Column({ nullable: false, default: false })
    isDeleted!: boolean

    @Column({ type: 'timestamp', nullable: true })
    deletedAt!: Date;
}
export async function getRolesRepository(): Promise<Repository<Roles>> {
    return Connection.getRepository(Roles);
}

export async function GetRolesAndNamesPagesAuthorizations(rolesIds: number[]): Promise<FullRolesUtils | undefined> {
    try {
        if (rolesIds && notEmpty(rolesIds)) {
            const repo = await getRolesRepository();
            var rolesList: Roles[] = await repo.find();

            if (rolesList && notEmpty(rolesList)) {
                const rolesObj: Roles[] = Array.from(new Set(rolesIds
                    .map(roleId => rolesList.find(role => role.id === roleId))
                    .filter(role => role && role?.name && role?.authorizations)))
                    .filter(role => role != undefined);

                const authorizations: string[] = Array.from(new Set(rolesObj.flatMap(role => role?.authorizations as string[])));

                const roles: Roles[] = rolesObj.filter(role => role && hasCommunAuthorizations(role.routes, authorizations));
                // const routesAuthorizations = Array.from(new Set(roles.flatMap(role => role?.routes ?? []).map(role => role.authorizations).reduce((acc, curr) => acc.concat(curr), [])));
                const rolesIdsOut: number[] = Array.from(new Set(roles.flatMap(role => role.id)));
                const rolesNames: string[] = Array.from(new Set(roles.flatMap(role => role.name)));
                const routes: Routes[] = Array.from(new Set(roles.flatMap(role => role.routes)));

                return { rolesIds: rolesIdsOut, rolesNames: rolesNames, rolesObj: roles, routes: routes, authorizations: authorizations }
            }
        }
    } catch (error) { }
    return undefined;
}

function hasCommunAuthorizations(routesList: Routes[], authorizations: string[]): boolean {
    if (routesList.length > 0 && authorizations.length > 0) {
        const routeAuthorizations = routesList.flatMap(role => role.authorizations).reduce((unique: string[], r: string | null | undefined) => {
            if (r && !(unique.find(i => i === r))) {
                unique.push(r);
            }
            return unique;
        }, []);;

        // const routeAuthorizations = routesList.map(role => role.authorizations).reduce((acc, curr) => acc.concat(curr), [])
        for (const auth of routeAuthorizations) {
            if (authorizations.includes(auth)) {
                return true;
            }
        }
    }
    return false;
}



