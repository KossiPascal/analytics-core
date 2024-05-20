const JSONFileStorage = require('node-json-file-storage');
import {dirname} from 'path';
import {config} from 'dotenv';
import { createDirectories } from './utils/functions';


const apiFolder = dirname(__dirname);
const projectFolder = dirname(apiFolder);
const projectParentFolder = dirname(projectFolder);
config({ path: `${projectParentFolder}/ssl/analytics/.env` });
const { NODE_ENV, APP_PROD_PORT, APP_DEV_PORT } = process.env;

function JsonDbFile(file_Name_without_extension: string): string {
    const fileName: string = file_Name_without_extension.trim().replace(' ', '-').split('.')[0];
    const folder = NODE_ENV === 'production' ? 'prod' : 'dev';
    const dir = `${projectFolder}/json-db-folder/${folder}`;
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


