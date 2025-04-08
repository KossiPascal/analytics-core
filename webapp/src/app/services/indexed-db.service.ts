// indexed-db.service.ts

import { Injectable } from '@angular/core';
import { RETRY_MILLIS } from '../shared/functions';
import { DatabaseName } from '@kossi-models/db';

@Injectable({
  providedIn: 'root'
})
export class IndexedDbService {
  constructor() { }
  // private readonly dbName = 'APP_DATABASE';
  private dbVersion = 1;
  private readonly keyPath: string = 'id';


  private async openDatabase({ dbName, keyPath, callBack }: { dbName: DatabaseName, keyPath?: string; callBack?: () => void }): Promise<IDBDatabase> {
    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(dbName, this.dbVersion);
      request.onerror = () => {
        reject(`❌ Error opening IndexedDB '${dbName}'`);
      };
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        // console.log(`🔄 Upgrading IndexedDB '${dbName}'...`);
        if (callBack) callBack();
        if (!db.objectStoreNames.contains(dbName)) {
          const objectStore = db.createObjectStore(dbName, { keyPath: keyPath ?? this.keyPath, autoIncrement: keyPath ? false : true });
          // ✅ Ensuring the key index is correctly set
          objectStore.createIndex(keyPath ?? this.keyPath, keyPath ?? this.keyPath, { unique: true });
          // console.log(`🟢 Object store '${dbName}' created with keyPath: ${keyPath ?? this.keyPath}`);
          // objectStore.createIndex('username', 'username', { unique: true }); // Crée un index sur le nom d'utilisateur
          // objectStore.createIndex('email', 'email', { unique: true }); // Crée un index sur l'e-mail avec contrainte d'unicité
        }
      };

      request.onsuccess = (event) => {
        resolve((event.target as IDBOpenDBRequest).result);
        // console.log(`✅ IndexedDB '${dbName}' opened successfully.`);
      };
    });
  }

  async save<T>({ dbName, keyPath, data, callback }: { dbName: DatabaseName, keyPath?: string; data: T, callback?: () => void }): Promise<boolean> {
    try {
      const db = await this.openDatabase({ dbName, keyPath });
      const transaction = db.transaction(dbName, 'readwrite');
      const store = transaction.objectStore(dbName);
      store.add(data);

      return new Promise<boolean>((resolve) => {
        transaction.oncomplete = () => {
          this.watchChanges(dbName);
          resolve(true);
        };
        transaction.onerror = () => {
          console.error(`❌ Erreur lors de l'ajout des données dans '${dbName}'`);
          if (callback) setTimeout(callback, RETRY_MILLIS);
          resolve(false);
        };
      });

    } catch (error) {
      console.error(`❌ Erreur dans save:`, error);
      if (callback) setTimeout(callback, RETRY_MILLIS);
      return false;
    }
  }

  async update<T>({ dbName, keyPath, newData, callback }: { dbName: DatabaseName, keyPath?: string; newData: T, callback?: () => void }): Promise<boolean> {
    try {
      const db = await this.openDatabase({ dbName, keyPath });
      const transaction = db.transaction(dbName, 'readwrite');
      const store = transaction.objectStore(dbName);
      store.put(newData);

      return new Promise<boolean>((resolve) => {
        transaction.oncomplete = () => {
          this.watchChanges(dbName);
          resolve(true);
        };
        transaction.onerror = () => {
          console.error(`❌ Erreur lors de la mise à jour des données dans '${dbName}'`);
          if (callback) setTimeout(callback, RETRY_MILLIS);
          resolve(false);
        };
      });

    } catch (error) {
      console.error(`❌ Erreur dans update:`, error);
      if (callback) setTimeout(callback, RETRY_MILLIS);
      return false;
    }
  }



  async createOrUpdate<T>({ dbName, keyPath, data, callback }: { dbName: DatabaseName, keyPath?: string; data: T, callback?: () => void }): Promise<boolean> {
    try {
      const db = await this.openDatabase({ dbName, keyPath });
      const transaction = db.transaction(dbName, 'readwrite');
      const store = transaction.objectStore(dbName);

      const primaryKey = keyPath ?? this.keyPath;
      const key = (data as any)[primaryKey];

      if (!key) {
        console.error(`❌ Missing key '${primaryKey}' in data object for IndexedDB store '${dbName}'. Data:`, data);
        return false;
      }

      // console.log(`🔹 Attempting to add/update record with key '${key}' in '${dbName}'. Data:`, data);

      return new Promise<boolean>((resolve, reject) => {
        const getRequest = store.get(key);

        getRequest.onsuccess = () => {
          if (getRequest.result) {
            // console.log(`🟡 Record with key '${key}' exists. Updating...`);
            store.put(data); // ✅ Update existing record
          } else {
            // console.log(`🟢 Record with key '${key}' does not exist. Adding new...`);
            store.add(data); // ✅ Add new record
          }
          this.watchChanges(dbName);
          resolve(true);
        };

        getRequest.onerror = () => {
          console.error(`❌ Failed to fetch record with key '${key}' from '${dbName}'`);
          resolve(false);
        };
      });
    } catch (error) {
      if (callback) {
        setTimeout(() => callback(), RETRY_MILLIS);
      }
      console.error(`❌ Error in createOrUpdate() for ${dbName}:`, error);
    }
    return false;
  }



  // 🔹 Enregistre plusieurs données dans IndexedDB (Ajout ou Mise à jour)
  async saveMany<T>({ dbName, datas, keyPath, callback }: { dbName: DatabaseName, datas: T[], keyPath?: string, callback?: () => void }): Promise<boolean> {
    try {
      const db = await this.openDatabase({ dbName, keyPath });
      const transaction = db.transaction(dbName, 'readwrite');
      const store = transaction.objectStore(dbName);

      const savePromises = datas.map(dt => {
        return new Promise<boolean>((resolve, reject) => {
          const primaryKey = keyPath ?? this.keyPath;
          const key = (dt as any)[primaryKey];

          if (!key) {
            console.error(`❌ Clé absente pour l'objet :`, dt);
            return resolve(false);
          }

          const request = store.put(dt); // `put()` ajoute ou met à jour

          request.onsuccess = () => resolve(true);
          request.onerror = (event) => {
            console.error(`❌ Erreur enregistrement clé '${key}'`, (event.target as IDBRequest).error);
            resolve(false);
          };
        });
      });

      const results = await Promise.all(savePromises);
      const allSaved = results.every(res => res);

      return new Promise<boolean>((resolve) => {
        transaction.oncomplete = () => {
          this.watchChanges(dbName);
          resolve(allSaved);
        };
        transaction.onerror = () => {
          console.error(`❌ Erreur lors de l'enregistrement des données`);
          if (callback) setTimeout(callback, RETRY_MILLIS);
          resolve(false);
        };
      });

    } catch (error) {
      console.error(`❌ Erreur dans saveMany:`, error);
      if (callback) setTimeout(callback, RETRY_MILLIS);
      return false;
    }
  }

  // 🔹 Récupère un seul élément par son ID
  async getOne<T>(dbName: DatabaseName, id: any, keyPath?: string, filter?: (item: T) => boolean, callback?: () => void): Promise<T | undefined> {
    try {
      const db = await this.openDatabase({ dbName, keyPath });
      const transaction = db.transaction(dbName, 'readonly');
      const store = transaction.objectStore(dbName);
      const request = store.get(id);

      return new Promise<T | undefined>((resolve) => {
        request.onsuccess = () => {
          let data = request.result as T | undefined;
          if (data && filter && !filter(data)) data = undefined;
          resolve(data);
        };
        request.onerror = () => {
          console.error(`❌ Erreur récupération ID '${id}' dans IndexedDB '${dbName}'`);
          resolve(undefined);
        };
      });

    } catch (error) {
      console.error(`❌ Erreur dans getOne:`, error);
      return undefined;
    }
  }

  // 🔹 Récupère tous les éléments avec option de filtrage
  async getAll<T>(dbName: DatabaseName, keyPath?: string, filter?: (item: T) => boolean, callback?: () => void): Promise<T[]> {
    try {
      const db = await this.openDatabase({ dbName, keyPath });
      const transaction = db.transaction(dbName, 'readonly');
      const store = transaction.objectStore(dbName);
      const request = store.getAll();

      return new Promise<T[]>((resolve) => {
        request.onsuccess = () => {
          let data = request.result as T[];
          if (filter) data = data.filter(filter);
          resolve(data);
        };
        request.onerror = () => {
          console.error(`❌ Erreur récupération des données dans IndexedDB '${dbName}'`);
          resolve([]);
        };
      });

    } catch (error) {
      console.error(`❌ Erreur dans getAll:`, error);
      return [];
    }
  }



  async delete<T>({ dbName, keyPath, id, callback }: { dbName: DatabaseName, keyPath?: string, id: T, callback?: () => void }): Promise<boolean> {
    try {
      const db = await this.openDatabase({ dbName, keyPath });
      const transaction = db.transaction(dbName, 'readwrite');
      const store = transaction.objectStore(dbName);
      const request = store.delete(id as any);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          this.watchChanges(dbName);
          resolve(true);
        };
        request.onerror = (event) => {
          console.error("Error deleting record:", (event.target as IDBRequest).error);
          if (callback) setTimeout(callback, RETRY_MILLIS);
          reject(false);
        };
      });
    } catch (error) {
      console.error("Delete operation failed:", error);
      if (callback) setTimeout(callback, RETRY_MILLIS);
      return false;
    }
  }

  async deleteMany<T>({ dbName, dataIds, callback }: { dbName: DatabaseName, dataIds: T[], callback?: () => void }): Promise<boolean> {
    try {
      const db = await this.openDatabase({ dbName });
      const transaction = db.transaction(dbName, 'readwrite');
      const store = transaction.objectStore(dbName);
      const deletePromises = dataIds.map(id =>
        new Promise<boolean>((resolve, reject) => {
          const request = store.delete(id as any);
          request.onsuccess = () => resolve(true);
          request.onerror = (event) => {
            console.error("Error deleting record:", (event.target as IDBRequest).error);
            resolve(false);
          };
        })
      );
      const results = await Promise.all(deletePromises);
      const allDeleted = results.every(res => res);
      if (!allDeleted && callback) setTimeout(callback, RETRY_MILLIS);
      return allDeleted;
    } catch (error) {
      console.error("DeleteMany operation failed:", error);
      if (callback) setTimeout(callback, RETRY_MILLIS);
      return false;
    }
  }

  async deleteAllFromDB({ dbName, callback }: { dbName: DatabaseName, callback?: () => void }): Promise<boolean> {
    try {
      const db = await this.openDatabase({ dbName });
      const transaction = db.transaction(dbName, 'readwrite'); // 🔥 Important pour modifier la base
      const store = transaction.objectStore(dbName);

      const request = store.clear(); // 🔥 Supprime tout le contenu de l'object store

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          if (callback) callback();
          resolve(true);
        };
        request.onerror = () => reject("Erreur lors de la suppression des tokens");
      });

    } catch (error) {
      console.error("Erreur dans deleteAllTokensFromIndexedDB:", error);
      return false;
    }
  }





  watchChanges(dbName: DatabaseName, callback?: () => void) {
    const request = indexedDB.open(dbName, this.dbVersion);

    request.onsuccess = (event: Event) => {
      const db = (event.target as IDBRequest).result as IDBDatabase;
      const transaction = db.transaction(dbName, 'readonly');
      const objectStore = transaction.objectStore(dbName);

      objectStore.openCursor().onsuccess = (cursorEvent: Event) => {
        const cursor = (cursorEvent.target as IDBRequest).result as IDBCursorWithValue | null;
        if (cursor) {
          this.onChangeHandler(cursor.value, callback);
          cursor.continue();
        }
      };

      transaction.oncomplete = () => {
        console.debug(`✅ Transaction complète pour la surveillance des changements sur '${dbName}'`);
      };

      transaction.onerror = () => {
        console.error(`❌ Erreur dans la transaction de surveillance sur '${dbName}'`);
      };
    };

    request.onerror = (event: Event) => {
      this.onErrorHandler({ err: (event.target as IDBRequest).error, dbName, callback });
    };
  }

  private onChangeHandler(data: any, callback?: () => void) {
    console.debug('🔄 Changement détecté', data);
    if (callback) callback();
  }

  private onErrorHandler({ err, dbName, callback }: { err: DOMException | null, dbName: DatabaseName, callback?: () => void }) {
    console.error(`❌ Erreur lors de la surveillance des changements ou de l'ouverture de la base '${dbName}'`, err);
    console.error(`🔄 Nouvelle tentative dans ${(RETRY_MILLIS / 1000)} secondes...`);
    setTimeout(() => this.watchChanges(dbName, callback), RETRY_MILLIS);
  }

}
