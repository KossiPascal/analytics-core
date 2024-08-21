import "reflect-metadata";
import express, { Request, Response, NextFunction } from 'express';
import { json, urlencoded } from 'body-parser';
import helmet from 'helmet';
import cors from 'cors';
import bearerToken from 'express-bearer-token';
import bodyParser from 'body-parser';
import compression from 'compression';
import responseTime from 'response-time';
import cron from 'node-cron';
import fs from 'fs';
import session from 'express-session';
import { join } from 'path';

import { ServerStart, appVersion, getIPAddress, logNginx, normalizePort } from './utils/functions';
import { APP_ENV, ENV_FOLDER, PROJECT_FOLDER, SRC_FOLDER } from "./utils/constantes";
import { ADMIN_USER_ID, AuthUserController } from "./controllers/auth-user";
import { AUTO_SYNC_AND_CALCULATE_COUCHDB_DATA } from "./controllers/auto-sync-all-data";
import { AppDataSource } from './data_source';

import authRouter from "./routes/auth-user";
import configsRouter from "./routes/config";
import orgUnitsRouter from "./routes/org-units";
import reportsRouter from "./routes/reports";
import dashboardsRouter from "./routes/dashboards";
import apisRouter from "./routes/api-token";
import syncRouter from "./routes/sync-data";
import databaseRouter from "./routes/database";
import dhis2Router from "./routes/dhis2";

const { NODE_ENV, APP_PROD_PORT, APP_DEV_PORT, ACCESS_ALL_AVAILABE_PORT, USE_LOCALHOST, ACTIVE_SECURE_MODE } = APP_ENV;
const isSecure = ACTIVE_SECURE_MODE === 'true';

function app() {
  const server = express();

  server
    // .use(express.json({ limit: '50mb' }))
    // .use(express.urlencoded({ limit: '50mb', extended: true }))
    // .use(bodyParser.json())
    // .use(bodyParser.urlencoded({ extended: true }))
    // .use(helmet({ contentSecurityPolicy: false }))
    // .use(cors())
    // .use(json())
    // .use(responseTime())
    // .use(compression())
    // .use(urlencoded({ extended: false }))
    // .enable('trust proxy')
    // .set('strict routing', true)
    // .set('view engine', 'ejs')
    // .set('json spaces', 0)
    // .set('content-type', 'application/json; charset=utf-8')
    // .use(session({
    //   secret: 'session',
    //   cookie: {
    //     secure: isSecure,
    //     maxAge: 60000
    //   },
    //   saveUninitialized: true,
    //   resave: true
    // }))
    // .use(bearerToken())
    // .use((req: Request, res: Response, next: NextFunction) => {
    //   if (req.method === 'OPTIONS') return res.status(200).end();
    //   if (isSecure && req.secure) return next();
    //   if (isSecure && !req.secure) return res.redirect(`https://${req.headers.host}${req.url}`);
    //   next();
    // })
    .use('/api/auth-user', authRouter)
    .use('/api/configs', configsRouter)
    .use('/api/reports', reportsRouter)
    .use('/api/dashboards', dashboardsRouter)
    .use('/api/org-units', orgUnitsRouter)
    .use('/api/api-token', apisRouter)
    .use('/api/sync', syncRouter)
    .use('/api/database', databaseRouter)
    .use('/api/dhis2', dhis2Router)
    .use('/api/assets', express.static(join(__dirname, 'assets')))
    .use(express.static(join(PROJECT_FOLDER, 'views')))
    .use(express.static(join(SRC_FOLDER, 'public')))

    .get('/publics/download/kendeya-prod-apk', (req, res) => {
      const apkName = `kendeya-prod.apk`;
      const file = join(SRC_FOLDER, 'public', 'apk', apkName);
      res.download(file, apkName, (err) => {
          if (err) {
              console.error('Error downloading the file:', err);
              res.status(500).send('Error downloading the file.');
          }
      });
    })
    .get('/publics/download/kendeya-dev-apk', (req, res) => {
      const apkName = `kendeya-dev.apk`;
      const file = join(SRC_FOLDER, 'public', 'apk', apkName);
      res.download(file, apkName, (err) => {
          if (err) {
              console.error('Error downloading the file:', err);
              res.status(500).send('Error downloading the file.');
          }
      });
    })

    .get('/publics/kendeya-guide-formation', (req: Request, res: Response, next: NextFunction) => {
      const indexPath = join(SRC_FOLDER, 'public', 'guide-formation', 'index.html');
      res.sendFile(indexPath, (err: any) => {
        if (err) {
          err.noStaticFiles = true;
          next(err);
        }
      });
    })

    .get('/', (req: Request, res: Response, next: NextFunction) => {
      const indexPath = join(PROJECT_FOLDER, 'views', 'index.html');
      res.sendFile(indexPath, (err: any) => {
        if (err) {
          err.noStaticFiles = true;
          next(err);
        }
      });
    })
    // .all('*', (req: Request, res: Response) => res.status(200).redirect('/'))
    .use((req: Request, res: Response) => res.status(404).send('Not found.'))
    .use((error: any, req: Request, res: Response, next: NextFunction) => {
      console.error(error.stack);
      if (error.noStaticFiles) {
        res.status(404).sendFile(join(__dirname, 'public', '404.html'));
      } else {
        res.status(error.statusCode || 500).json({
          error: {
            message: error.message,
            data: error.data,
          },
        });
      }
    });

  return server;
}

AppDataSource
  .initialize()
  .then(async () => {
    logNginx(`initialize success!\nApp Version: ${appVersion()}`);
    await AuthUserController.DefaultAdminCreation();

    const server = app();
    const port = normalizePort(NODE_ENV === 'production' ? APP_PROD_PORT : APP_DEV_PORT || 3000);
    const hostnames = getIPAddress(ACCESS_ALL_AVAILABE_PORT === 'true');

    cron.schedule('00 59 23 * * *', () => {
      logNginx('Running this task every day at 23:59:00.');
      AUTO_SYNC_AND_CALCULATE_COUCHDB_DATA({ userId: ADMIN_USER_ID });
    });

    const credential: Record<string, any>|any = {};
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
  })
  .catch(error => logNginx(`${error}`));
