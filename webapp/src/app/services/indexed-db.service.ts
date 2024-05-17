// indexed-db.service.ts

import { Injectable } from '@angular/core';
import { RETRY_MILLIS } from '../utils/functions';
import { DBUtils } from '@kossi-models/db';

@Injectable({
  providedIn: 'root'
})
export class IndexedDbService {
  constructor() { }
  // private readonly dbName = 'APP_DATABASE';
  private dbVersion = 1;
  private readonly keyPath: string = 'id';

  private async openDatabase({ dbName, keyPath, callBack }: { dbName: DBUtils['dbName'], keyPath?: string, callBack?: () => void }): Promise<IDBDatabase> {
    const request = indexedDB.open(dbName, this.dbVersion);
    return new Promise<IDBDatabase>((resolve, reject) => {
      request.onerror = (event) => {
        reject(`Error opening IndexedDB '${dbName}'`);
      };
      request.onupgradeneeded = (event) => {
        const db = request.result;
        // const db = (event.target as IDBOpenDBRequest).result;
        if (callBack) callBack();
        if (!db.objectStoreNames.contains(dbName)) {
          const objectStore = db.createObjectStore(dbName, { keyPath: keyPath, autoIncrement: false });
          objectStore.createIndex(keyPath ?? this.keyPath, keyPath ?? this.keyPath, { unique: true }); // Créer un index sur la clé id
          // objectStore.createIndex('username', 'username', { unique: true }); // Crée un index sur le nom d'utilisateur
          // objectStore.createIndex('email', 'email', { unique: true }); // Crée un index sur l'e-mail avec contrainte d'unicité
        }
      };
      request.onsuccess = (event) => {
        resolve((event.target as IDBOpenDBRequest).result);
      };
    });
  }


  async saveData<T>({ dbName, keyPath, data }: { dbName: DBUtils['dbName'], keyPath?: string; data: T }): Promise<boolean> {
    try {
      const db = await this.openDatabase({ dbName, keyPath });
      const transaction = db.transaction(dbName, 'readwrite');
      const store = transaction.objectStore(dbName);
      store.add(data);
      this.watchChanges(dbName);
      return true;
    } catch (error) { console.log(error) }
    return false;
  }

  async updateData<T>({ dbName, keyPath, newData }: { dbName: DBUtils['dbName'], keyPath?: string; newData: T }): Promise<boolean> {
    try {
      const db = await this.openDatabase({ dbName, keyPath });
      const transaction = db.transaction(dbName, 'readwrite');
      const store = transaction.objectStore(dbName);
      store.put(newData);
      this.watchChanges(dbName);
      return true;
    } catch (error) { console.log(error) }
    return false;
  }

  // async getAllData<T>(dbName: DBUtils['dbName'], keyPath?: string): Promise<T[]> {
  //   try {
  //     const db = await this.openDatabase({ dbName, keyPath });
  //     const transaction = db.transaction(dbName, 'readonly');
  //     const store = transaction.objectStore(dbName);
  //     const request = store.getAll();
  //     return new Promise<T[]>((resolve, reject) => {
  //       request.onerror = () => {
  //         reject(`Error retrieving data from IndexedDB '${dbName}'`);
  //       };
  //       request.onsuccess = () => {
  //         resolve(request.result as T[]);
  //       };
  //     });
  //   } catch (error) {
  //     console.log(error)
  //     return [];
  //   }
  // }


  async getAllData<T>(dbName: DBUtils['dbName'], keyPath?: string, filterFunction?: (item: T) => boolean): Promise<T[]> {
    try {
      const db = await this.openDatabase({ dbName, keyPath });
      const transaction = db.transaction(dbName, 'readonly');
      const store = transaction.objectStore(dbName);
      const request = store.getAll();

      return new Promise<T[]>((resolve, reject) => {
        request.onerror = () => {
          reject(`Error retrieving data from IndexedDB '${dbName}'`);
        };

        request.onsuccess = () => {
          let data: T[] = request.result as T[];

          if (filterFunction) {
            data = data.filter(filterFunction);
          }
          resolve(data);
        };
      });
    } catch (error) {
      console.error(error);
      return [];
    }
  }


  async deleteData({ dbName, keyPath, id }: { dbName: DBUtils['dbName'], keyPath?: string, id: any }): Promise<boolean> {
    try {
      const db = await this.openDatabase({ dbName, keyPath });
      const transaction = db.transaction(dbName, 'readwrite');
      const store = transaction.objectStore(dbName);
      store.delete(id);
      this.watchChanges(dbName);
      return true;
    } catch (error) { console.log(error) }
    return false;
  }

  watchChanges(dbName: DBUtils['dbName'], callback?: () => void) {
    const request = indexedDB.open(dbName, this.dbVersion);
    request.onsuccess = (event: Event) => {
      const db = (event.target as any).result;
      const transaction = db.transaction(dbName, 'readonly');
      const objectStore = transaction.objectStore(dbName);
      objectStore.openCursor().onsuccess = (cursorEvent: Event) => {
        const cursor = (cursorEvent.target as any).result;
        if (cursor) {
          this.onChangeHandler(cursor.value, callback);
          cursor.continue();
        }
      };
    };
    request.onerror = (event: Event) => {
      this.onErrorHandler({err:(event.target as any).error, dbName, callback})
    };
  }

  private onChangeHandler(data: any, callback?: () => void) {
    console.debug('Change notification firing', data);

    if (callback) {
      callback();
    }
  }

  private onErrorHandler({ err, dbName, callback }: { err: any, dbName: DBUtils['dbName'], callback?: () => void }) {
    console.error('Error watching for db changes or opening database', err);
    console.error('Attempting changes reconnection in ' + (RETRY_MILLIS / 1000) + ' seconds');
    setTimeout(() => {
      this.watchChanges(dbName, callback);
    }, RETRY_MILLIS);
  }
}
