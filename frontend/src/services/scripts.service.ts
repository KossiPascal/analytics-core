import { api } from '@/apis/api';
import { onlineOrOffline } from '@/stores/stores.config';
import { IndexedDbStorage } from '@services/storages/indexed-db.service';

const db = new IndexedDbStorage('query_builder')

export interface Script {
    id: string | null,
    name: string,
    content: string,
    language: string,
    edit_only_content?:boolean

}

export const qbService = {
    async getALl() {
        return onlineOrOffline({
            online: async () => {
                // ,config:AxiosRequestConfig<any> | undefined
                const res = await api.get('/scripts');
                await db.save({ ...res.data });
                return res.data;
            },
            offline: async () => {
                throw new Error('QUERY_BUILDER_GET_NOT_ALLOWED');
            },
        });
    },

    async save(script: Script) {
        return onlineOrOffline({
            online: async () => {
                const res = await api.post("/scripts", script);
                await db.save({ ...res.data });
                return res.data;
            },
            offline: async () => {
                throw new Error('QUERY_BUILDER_SAVE_NOT_ALLOWED');
            },
        });
    },

    async update(id: string, script: Script) {
        return onlineOrOffline({
            online: async () => {
                const res = await api.put(`/scripts/${script.id}`, script);
                await db.update({ ...res.data });
                return res.data;
            },
            offline: async () => {
                throw new Error('QUERY_BUILDER_SAVE_NOT_ALLOWED');
            },
        });
    },

    async delete(id: string):Promise<boolean> {
        return onlineOrOffline({
            online: async () => {
                const res = await api.delete(`/scripts/${id}`);
                const success = res.data.success === true;
                if(success) await db.delete(id);
                return success;
            },
            offline: async () => {
                throw new Error('QUERY_BUILDER_SAVE_NOT_ALLOWED');
            },
        });
    },

    async execute(data:Script, signal:AbortSignal) {
        return onlineOrOffline({
            online: async () => {
                const res = await api.post("/scripts/execute", data, { signal } );
                return res.data;
            },
            offline: async () => {
                throw new Error('QUERY_BUILDER_EXECUTE_NOT_ALLOWED');
            },
        });
    }


      
}