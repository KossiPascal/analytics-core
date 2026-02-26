import { IndexedDbStorage } from '@services/storages/indexed-db.service';
import { CRUDService } from './acrud.service';

const db = new IndexedDbStorage('query_builder')

export interface Script {
    id: number | null,
    name: string,
    content: string,
    language: string,
    edit_only_content?: boolean

}

const script = new CRUDService("/script");
export const scriptService = {
    all: () => script.all<Script>(""),
    create: (data: Script) => script.create("", data, { callback: async (s) => db.save({ ...s }), }),
    update: (id: number, data: Script) => script.update("", id, data),
    remove: (id: number) => script.remove("", id),
    execute: (data: Script, signal: AbortSignal) => script.post("/scripts/execute", data, { options: { signal } })
}
