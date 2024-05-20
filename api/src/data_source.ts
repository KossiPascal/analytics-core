import { DataSource } from "typeorm"
import { dirname } from "path";
import { config } from 'dotenv';

const projectFolder = dirname(dirname(__dirname));
const projectParentFolder = dirname(projectFolder);
config({ path: `${projectParentFolder}/ssl/analytics/.env` });

const { NODE_ENV, PG_HOST, PG_PORT, PG_PROD_DB_NAME, PG_DEV_DB_NAME, PG_DB_USER, PG_DB_PASS } = process.env;

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: PG_HOST,
    port: parseInt(`${PG_PORT}`),
    username: PG_DB_USER,
    password: PG_DB_PASS,
    database: NODE_ENV === 'production' ? PG_PROD_DB_NAME : PG_DEV_DB_NAME,
    synchronize: true,
    logging: ["query", "error"],
    entities: [__dirname + '/entities/*{.ts,.js}'],
    migrations: [__dirname + "/migration/*.sql"],
    migrationsTableName: "custom_migration_table",
    subscribers: [__dirname + "/subscriber/*{.ts,.js}"],
});

