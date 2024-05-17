import { Routes } from "./user"

export interface Roles {
    id: number
    name: string
    autorizations: string[] | null
    routes: string[] | Routes[] | null
    default_route: string | Routes | null | undefined
    isDeleted: boolean
    deletedAt: Date
}
