import "reflect-metadata";
import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import bearerToken from 'express-bearer-token';
import compression from 'compression';
import responseTime from 'response-time';
import fs from 'fs';
import session from 'express-session';
import { join } from 'path';

import { ServerStart, appVersion, getIPAddress, logNginx, normalizePort } from './functions/functions';
import { APP_ENV, ENV_FOLDER, PROJECT_FOLDER, SRC_FOLDER } from "./providers/constantes";
import { AuthUserController } from "./controllers/auth-user";
import { AppDataSource } from './data-source';

import authRouter from "./routes/auth-user";
import configsRouter from "./routes/config";
import orgUnitsRouter from "./routes/org-units";
import reportsRouter from "./routes/reports";
import dashboardsRouter from "./routes/dashboards";
import apisRouter from "./routes/api-token";
import syncRouter from "./routes/sync-data";
import databaseRouter from "./routes/database";
import dhis2Router from "./routes/dhis2";
import smsRouter from "./routes/sms";

// import functionsRouter from "./routes/handel-functions";

import { Errors } from "./routes/error";
import { syncCouchDBToPostgres } from "./couch2pg/couch2pg";
import { userLoggerMiddleware } from "./middleware/logger";



const { NODE_ENV, APP_PROD_PORT, APP_DEV_PORT, ACCESS_ALL_AVAILABE_PORT, USE_LOCALHOST, ACTIVE_SECURE_MODE } = APP_ENV;
const isSecure = ACTIVE_SECURE_MODE === 'true';

function app() {
  const server = express();

  server
    .enable('trust proxy')
    .set('trust proxy', 1)
    .set('view engine', 'ejs')
    .set('json spaces', 2)
    .set('content-type', 'application/json; charset=utf-8')
    // .set('strict routing', true)
    .use(helmet({ contentSecurityPolicy: false }))
    .use(cors())
    // .use(json())
    .use(responseTime())
    .use(compression())
    // .use(urlencoded({ extended: false }))
    .use(express.json({ limit: '50mb' }))
    .use(express.urlencoded({ limit: '50mb', extended: true }))
    // .use(bodyParser.json({ limit: '10mb' }))
    // .use(bodyParser.urlencoded({ limit: '10mb', extended: true }))
    .use(session({
      secret: 'session',
      cookie: {
        secure: isSecure,
        maxAge: 60000
      },
      saveUninitialized: true,
      resave: true
    }))
    .use(bearerToken())

    .use(userLoggerMiddleware)

    .use('/api/auth-user', authRouter)
    .use('/api/configs', configsRouter)
    .use('/api/reports', reportsRouter)
    .use('/api/dashboards', dashboardsRouter)
    .use('/api/org-units', orgUnitsRouter)
    .use('/api/api-token', apisRouter)
    .use('/api/sync', syncRouter)
    .use('/api/database', databaseRouter)
    .use('/api/dhis2', dhis2Router)
    .use('/api/sms', smsRouter)
    // .use('/api/functions', functionsRouter)
    .use('/api/assets', express.static(join(__dirname, 'assets')))
    .use(express.static(join(PROJECT_FOLDER, 'views')))
    .use(express.static(join(SRC_FOLDER, 'public')))

    .use('/publics/download/kendeya-prod-apk', (req, res) => {
      const apkName = `kendeya-prod.apk`;
      const file = join(SRC_FOLDER, `public/apk/${apkName}`);
      res.download(file, apkName, (err) => {
        if (err) {
          console.error('Error downloading the file:', err);
          res.status(500).send('Error downloading the file.');
        }
      });
    })
    .use('/publics/download/kendeya-dev-apk', (req, res) => {
      const apkName = `kendeya-dev.apk`;
      const file = join(SRC_FOLDER, `public/apk/${apkName}`);
      res.download(file, apkName, (err) => {
        if (err) {
          console.error('Error downloading the file:', err);
          res.status(500).send('Error downloading the file.');
        }
      });
    })
    .use('/', (req: Request, res: Response, next: NextFunction) => {
      const indexPath = join(PROJECT_FOLDER, 'views/index.html');
      res.sendFile(indexPath, (err: any) => {
        if (err) {
          err.noStaticFiles = true;
          next(err);
        }
      });
    })
    .all('*', (req: Request, res: Response) => res.status(200).redirect('/'))
    .use(Errors.getErrors)
    .use(Errors.get404)
    // .get('/publics/kendeya-guide-formation', (req: Request, res: Response, next: NextFunction) => {
    //   const indexPath = join(SRC_FOLDER, 'public/guide-formation/index.html');
    //   res.sendFile(indexPath, (err: any) => {
    //     if (err) {
    //       err.noStaticFiles = true;
    //       next(err);
    //     }
    //   });
    // })
    ;
  return server;
}

AppDataSource
  .initialize()
  .then(async () => {
    logNginx(`📦 Database connected successfully!\nApp Version: ${appVersion().app_version}`);

    // npx typeorm migration:create src/migrations/materialised-views/reports/RecoMegSituationReportsView
    // npx typeorm migration:create src/migrations/materialised-views/dashboards/RecoVaccinationDashboardView
    // npx typeorm migration:create src/migrations/materialised-views/views/UsersView


    // npx typeorm migration:create src/migrations/materialised-views/manages/recos/RecosMapFamilyUidView
    // npx typeorm migration:create src/migrations/materialised-views/manages/recos/RecosMapPatientsUidView
    // npx typeorm migration:create src/migrations/materialised-views/manages/recos/RecosMapDataUidView

    // npx typeorm migration:create src/migrations/materialised-views/manages/recos/ZoneMapRecosUidView
    // npx typeorm migration:create src/migrations/materialised-views/manages/recos/ZoneMapDatasUidView
    // npx typeorm migration:create src/migrations/materialised-views/manages/recos/ZoneMapFamiliesUidView
    // npx typeorm migration:create src/migrations/materialised-views/manages/recos/ZoneMapFamiliesDatasUidView
    // npx typeorm migration:create src/migrations/materialised-views/manages/recos/ZoneMapPatientsUidView
    // npx typeorm migration:create src/migrations/materialised-views/manages/recos/ZoneMapRecosUidView
    // npx typeorm migration:create src/migrations/materialised-views/manages/recos/ZoneMapRecosUidView
    // npx typeorm migration:create src/migrations/materialised-views/manages/recos/ZoneMapRecosUidView


    // await DropOrTruncateDataFromDatabase({ procide:true, entities:[{name:'', table:'typeorm_migrations'}], action:'TRUNCATE' })

    await AppDataSource.runMigrations();

    await AuthUserController.DefaultAdminCreation();

    const server = app();
    const port = normalizePort(NODE_ENV === 'production' ? APP_PROD_PORT : APP_DEV_PORT || 3000);
    const hostnames = getIPAddress(ACCESS_ALL_AVAILABE_PORT === 'true');

    // cron.schedule('00 59 23 * * *', () => {
    //   logNginx('Running this task every day at 23:59:00.');
    // });

    const credential: Record<string, any> | any = {};

    if (isSecure) {
      credential.key = fs.readFileSync(`${ENV_FOLDER}/server.key`, 'utf8');
      credential.ca = fs.readFileSync(`${ENV_FOLDER}/server-ca.crt`, 'utf8');
      credential.cert = fs.readFileSync(`${ENV_FOLDER}/server.crt`, 'utf8');
    }

    ServerStart({
      credential,
      isSecure,
      server,
      access_all_host: ACCESS_ALL_AVAILABE_PORT === 'true',
      port,
      hostnames,
      useLocalhost: USE_LOCALHOST === 'true',
    });

    syncCouchDBToPostgres();

  })
  .catch(error => logNginx(`${error}`));
