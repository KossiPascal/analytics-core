import { openDB, IDBPDatabase } from 'idb';

const DB_VERSION = 1;
const DB_NAME = 'app-db';
const RETRY_MILLIS = 5000;
const STORES = {AUTH: 'auth',USERS: 'users',TOKENS: 'tokens'} as const;
type StoreName = typeof STORES[keyof typeof STORES];

type DbCallback<T = any> = {
  onSuccess?: (data?: T) => void;
  onError?: (error: unknown) => void;
  retry?: () => void;
};


export class IndexedDbStorage<T extends { id: string }> {
    private dbPromise: Promise<IDBPDatabase> | null = null;
    private storeName: StoreName;
    private keyPath: string;

    constructor(storeName: StoreName, keyPath: string='id') {
        this.storeName = storeName;
        this.keyPath = keyPath;
    }

    // 🔑 Singleton DB
    private async getDB(): Promise<IDBPDatabase> {
        if (!this.dbPromise) {
            const mainkeyPath = this.keyPath;
            const keyPath = this.keyPath ?? 'id';
            const mainstoreName = this.storeName;
            this.dbPromise = openDB(DB_NAME, DB_VERSION, {
                upgrade:(db, oldVersion, newVersion) => {
                    [...Object.values(STORES), mainstoreName].forEach((storeName) => {
                        if (!db.objectStoreNames.contains(storeName)) {
                            const store = db.createObjectStore(storeName, { keyPath, autoIncrement: mainkeyPath === 'id' });
                            if (keyPath !== 'id') store.createIndex(keyPath, keyPath, { unique: true });
                        }
                    });
                },
                blocked:() => console.warn('⚠️ IndexedDB blocked (another tab still open)'),
                blocking:() => console.warn('⚠️ IndexedDB blocking older version'),
                terminated:() => console.error('❌ IndexedDB connection terminated'),
            });
        }
        return this.dbPromise;
    }

    // ===================== HELPERS =====================
    private async safeExec<R>(
        exec: () => Promise<R>,
        callback?: DbCallback<R>
    ): Promise<R | null> {
        try {
            const result = await exec();
            callback?.onSuccess?.(result);
            return result;
        } catch (err) {
            console.error(`❌ IndexedDB [${this.storeName}] error`, err);
            callback?.onError?.(err);
            if (callback?.retry) setTimeout(callback.retry, RETRY_MILLIS);
            return null;
        }
    }

    // ===================== CRUD =====================

    async save(data: T, callback?: DbCallback<boolean>): Promise<boolean> {
        return (
            (await this.safeExec(async () => {
                const db = await this.getDB();
                await db.add(this.storeName, data);
                return true;
            }, callback)) ?? false
        );
    }

    async update(data: T, callback?: DbCallback<boolean>): Promise<boolean> {
        return (
            (await this.safeExec(async () => {
                const db = await this.getDB();
                await db.put(this.storeName, data);
                return true;
            }, callback)) ?? false
        );
    }

    async upsert(data: T, callback?: DbCallback<boolean>): Promise<boolean> {
        return (
            (await this.safeExec(async () => {
                const db = await this.getDB();
                await db.put(this.storeName, data);
                return true;
            }, callback)) ?? false
        );
    }

    async saveMany(datas: T[], callback?: DbCallback<boolean>): Promise<boolean> {
        return (
            (await this.safeExec(async () => {
                const db = await this.getDB();
                const tx = db.transaction(this.storeName, 'readwrite');
                for (const item of datas) {
                    tx.store.put(item);
                }
                await tx.done;
                return true;
            }, callback)) ?? false
        );
    }

    async getOne(id: string, callback?: DbCallback<T | undefined>): Promise<T | undefined> {
        return (
            (await this.safeExec(async () => {
                const db = await this.getDB();
                return db.get(this.storeName, id);
            }, callback)) ?? undefined
        );
    }

    async getAll(callback?: DbCallback<T[]>): Promise<T[]> {
        return (
            (await this.safeExec(async () => {
                const db = await this.getDB();
                return db.getAll(this.storeName);
            }, callback)) ?? []
        );
    }

    async delete(id: string, callback?: DbCallback<boolean>): Promise<boolean> {
        return (
            (await this.safeExec(async () => {
                const db = await this.getDB();
                await db.delete(this.storeName, id);
                return true;
            }, callback)) ?? false
        );
    }

    async deleteMany(ids: string[], callback?: DbCallback<boolean>): Promise<boolean> {
        return (
            (await this.safeExec(async () => {
                const db = await this.getDB();
                const tx = db.transaction(this.storeName, 'readwrite');
                ids.forEach((id) => tx.store.delete(id));
                await tx.done;
                return true;
            }, callback)) ?? false
        );
    }

    async clear(callback?: DbCallback<boolean>): Promise<boolean> {
        return (
            (await this.safeExec(async () => {
                const db = await this.getDB();
                await db.clear(this.storeName);
                return true;
            }, callback)) ?? false
        );
    }
}
