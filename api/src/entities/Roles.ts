import { Entity, Column, Repository, DataSource, PrimaryGeneratedColumn } from "typeorm"
import { AppDataSource } from '../data_source';
import { notEmpty } from "../utils/functions";
import { FullRolesUtils, Routes } from "../utils/Interfaces";

let Connection: DataSource = AppDataSource.manager.connection;

@Entity()
export class Roles {
    constructor() { };
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ unique: true, type: 'varchar', nullable: false })
    name!: string

    @Column({ type: 'jsonb', nullable: true })
    autorizations!: string[]

    @Column({ type: 'jsonb', nullable: true })
    routes!: Routes[]

    @Column({ type: 'jsonb', nullable: true })
    default_route!: Routes

    @Column({ nullable: false, default: false })
    isDeleted!: boolean

    @Column({ type: 'timestamp', nullable: true })
    deletedAt!: Date;
}

export async function getRolesRepository(): Promise<Repository<Roles>> {
    return Connection.getRepository(Roles);
}

export async function GetRolesAndNamesPagesAutorizations(rolesIds: string[]): Promise<FullRolesUtils | undefined> {
    try {
        if (rolesIds && notEmpty(rolesIds)) {
            const repo = await getRolesRepository();
            var rolesList: Roles[] = await repo.find();

            if (rolesList && notEmpty(rolesList)) {
                const rolesObj: Roles[] = Array.from(new Set(rolesIds
                    .map(roleId => rolesList.find(role => role.id === parseInt(roleId.trim(), 10)))
                    .filter(role => notEmpty(role?.name) && notEmpty(role?.autorizations)) as Roles[]));

                const autorizations: string[] = Array.from(new Set(rolesObj.flatMap(role => role?.autorizations as string[])));

                const roles: Roles[] = rolesObj.filter(role => role && hasCommunAutorisations(role.routes, autorizations));
                // const routesAutorizations = Array.from(new Set(roles.flatMap(role => role?.routes ?? []).map(role => role.autorisations).reduce((acc, curr) => acc.concat(curr), [])));
                const default_routes: Routes[] = Array.from(new Set(roles.map(role => role.default_route).filter(droute => notEmpty(droute)) as Routes[]));
                const rolesNames: string[] = Array.from(new Set(roles.map(role => (role as Roles).name)));
                const routes: Routes[] = Array.from(new Set(roles.flatMap(role => role?.routes as Routes[])));

                return { roles: rolesNames, rolesObj: roles, routes: routes, default_routes: default_routes, autorizations: autorizations }
            }
        }
    } catch (error) { }
    return undefined;
}

function hasCommunAutorisations(routesList: Routes[], autorizations: string[]): boolean {
    if (routesList.length > 0 && autorizations.length > 0) {
        const routeAutorizations = routesList.flatMap(role => role.autorisations).reduce((unique: string[], r: string|null|undefined) => {
            if (r && !(unique.find(i => i === r))) {
              unique.push(r);
            }
            return unique;
          }, []);;

        console.log(routesList)
        // const routeAutorizations = routesList.map(role => role.autorisations).reduce((acc, curr) => acc.concat(curr), [])
        for (const auth of routeAutorizations) {
            if (autorizations.includes(auth)) {
                return true;
            }
        }
    }
    return false;
}



