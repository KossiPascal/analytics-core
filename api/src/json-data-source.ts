const JSONFileStorage = require('node-json-file-storage');
import { APP_ENV, JSON_DB_PATH } from './providers/constantes';
import { createDirectories } from './functions/functions';

const { NODE_ENV } = APP_ENV;

function JsonDbFile(file_Name_without_extension: string): string {
    const fileName: string = file_Name_without_extension.trim().replace(' ', '-').split('.')[0];
    const folder = NODE_ENV === 'production' ? 'prod' : 'dev';
    const dir = `${JSON_DB_PATH}/${folder}`;
    createDirectories(dir, (e: any) => { });
    return `${dir}/${fileName}.json`
}
export class JsonDatabase {
    storage: any;
    constructor(file_Name: 'districts' | 'sites' | 'zones' | 'chws' | 'families' | 'patients' | 'configs' | 'syncs') {
        this.storage = new JSONFileStorage(`${JsonDbFile(file_Name)}`);
    }

    //get from file
    get = (keys: string[]): any => this.storage.getBulk(keys);
    getBy = (key: string): any => this.storage.get(key);
    all = (): any => this.storage.all();

    // put to file 
    saveBulk = (objs: any[]) => this.storage.putBulk(objs);
    save = (obj: any) => this.storage.put(obj);

    //Remove from file
    remove = (keys: string[]): boolean => this.storage.removeBulk(keys);
    removeOne = (key: string): boolean => this.storage.remove(key);
    clear = (): boolean => this.storage.empty();
}


