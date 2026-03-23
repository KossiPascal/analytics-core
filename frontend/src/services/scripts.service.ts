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

const scripts = new CRUDService("/scripts");
export const scriptService = {
    list: () => scripts.all<Script>(""),
    create: (data: Script) => scripts.create("", data, { callback: async (s) => db.upsert({ ...s }), }),
    update: (id: number, data: Script) => scripts.update("", id, data),
    remove: (id: number) => scripts.remove("", id),
    execute: (data: Script, signal: AbortSignal) => scripts.post("/execute", data, { options: { signal } })
}
