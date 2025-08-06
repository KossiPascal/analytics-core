import { config } from 'dotenv';
import { dirname } from 'path';

export const SRC_FOLDER = dirname(__dirname);
export const API_FOLDER = dirname(SRC_FOLDER);
export const PROJECT_FOLDER = dirname(API_FOLDER); 
export const PROJECT_PARENT_FOLDER = dirname(PROJECT_FOLDER);
export const ENV_FOLDER = `${PROJECT_PARENT_FOLDER}/ssl/analytics`;
export const JSON_DB_PATH = `${PROJECT_FOLDER}/json-db-folder`;

export const MIGRATIONS_FOLDER = `${SRC_FOLDER}/migrations`;

config({ path: `${SRC_FOLDER}/.env` });
config({ path: `${API_FOLDER}/.env` });
config({ path: `${PROJECT_FOLDER}/.env` });
config({ path: `${PROJECT_PARENT_FOLDER}/.env` });
config({ path: `${ENV_FOLDER}/.env` });
config({ path: `${JSON_DB_PATH}/.env` });

export const APP_ENV = process.env;

export const SECRET_PRIVATE_KEY: string = 'Kossi-TSOLEGNAGBO-Pascal-secretfortoken made at 2025-04-12 16:10:23';
export const APP_AUTH_TOKEN: string = 'Kossi TSOLEGNAGBO Pascal 26/03/1989 Lomé/Kara Integrate Health (+228) 92645651 (Token du 12 Avril 2025 à 16:10:23)';

export const APP_ADMIN_PRIVILEGE: string = `${APP_AUTH_TOKEN} PRIVILEGES`;
