import { DataSource } from "typeorm"
import { APP_ENV } from "./providers/constantes";

const { NODE_ENV, PG_HOST, PG_PORT, PG_PROD_DB_NAME, PG_DEV_DB_NAME, PG_DB_USER, PG_DB_PASS } = APP_ENV;


export const AppDataSource = new DataSource({
    type: 'postgres',
    host: PG_HOST,
    port: parseInt(`${PG_PORT}`),
    username: PG_DB_USER,
    password: PG_DB_PASS,
    database: NODE_ENV === 'production' ? PG_PROD_DB_NAME : PG_DEV_DB_NAME,
    entities: [
        __dirname + '/entities/*{.ts,.js}',
        __dirname + '/entities/**/*{.ts,.js}'
    ],
    synchronize: true,
    logging: [
        "query",
        "error"
    ],
    migrations: [
        __dirname + '/migrations/*.{ts,js}'
        // __dirname + '/migrations/mat/*.{ts,js}',
        // __dirname + '/migrations/functions/*.{ts,js}',
    ],
    migrationsTableName: "typeorm_migrations",
    subscribers: [
        __dirname + "/subscriber/*{.ts,.js}"
    ],
});