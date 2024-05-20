import "reflect-metadata"
import express, { Request, Response, NextFunction } from 'express';
import { json, urlencoded } from 'body-parser';
import { ServerStart, getIPAddress, logNginx, normalizePort } from './utils/functions';
import { AppDataSource } from './data_source';

import authRouter from "./routes/auth-user";
import configsRouter from "./routes/config";
import orgUnitsRouter from "./routes/org-units";
import reportsRouter from "./routes/reports";
import dashboardsRouter from "./routes/dashboards";
import apisRouter from "./routes/api-token";
import syncRouter from "./routes/sync-data";
import databaseRouter from "./routes/database";

import { ADMIN_USER_ID, AuthUserController } from "./controllers/auth-user";
import cors from "cors";
import bearerToken from "express-bearer-token";
import bodyParser from 'body-parser';
import { dirname, join } from 'path';
import { config } from 'dotenv';
import { AUTO_SYNC_AND_CALCULATE_COUCHDB_DATA } from "./controllers/auto-sync-all-data";

import helmet from 'helmet';
import cron from "node-cron";
import compression from "compression";
import responseTime from 'response-time';

// import http from 'http';
import fs from 'fs';

const apiFolder = dirname(__dirname);
const projectFolder = dirname(apiFolder);
const projectParentFolder = dirname(projectFolder);
const sslFolder = `${projectParentFolder}/ssl`;
config({ path: `${sslFolder}/.env` });
const { NODE_ENV, APP_PROD_PORT, APP_DEV_PORT, ACTIVE_SECURE_MODE, ACCESS_ALL_AVAILABE_PORT, USE_LOCALHOST } = process.env;

const isSecure = ACTIVE_SECURE_MODE === 'true';

var session = require('express-session');

function app() {
  const server = express()
    .use((req: Request, res: Response, next: NextFunction) => {
      if (req.method === 'OPTIONS') return res.status(200).end();
      if (isSecure) {
        if (req.secure) next();
        if (!req.secure) res.redirect(`https://${req.headers.host}${req.url}`);
      } else {
        next();
      }
    })
    .use(bodyParser.json())
    .use(bodyParser.urlencoded({ extended: true }))
    .use(helmet({ contentSecurityPolicy: false }))
    .use(cors())
    // .use(cors({
    //   origin: true,//['http://127.0.0.1:5501', 'http://127.0.0.1:5502'],
    //   credentials: true
    // }))
    .use(json())
    .use(responseTime())
    .use(compression())
    .use(urlencoded({ extended: false }))
    .enable('trust proxy')
    .set('strict routing', true)
    .set('trust proxy', true)
    // .set('trust proxy', 1)
    .set("view engine", "ejs")
    .set('json spaces', 0)
    .set('content-type', 'application/json; charset=utf-8')
    .use(session({
      secret: 'session',
      cookie: {
        secure: true,
        maxAge: 60000
      },
      saveUninitialized: true,
      resave: true
    }))
    .use(bearerToken())
    .use('/api/auth-user', authRouter)
    .use('/api/configs', configsRouter)
    .use('/api/reports', reportsRouter)
    .use('/api/dashboards', dashboardsRouter)
    .use('/api/org-units', orgUnitsRouter)
    .use('/api/api-token', apisRouter)
    .use('/api/sync', syncRouter)
    .use('/api/database', databaseRouter)
    .use('/api/assets', express.static(__dirname + '/assets'))
    // .use(express.static(join(projectFolder, "views"), {
    //   setHeaders: (res, path) => {
    //     // if (path.endsWith('.html')) {
    //     res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    //     res.setHeader('Pragma', 'no-cache');
    //     res.setHeader('Expires', '0');
    //     // }
    //   }
    // }))
    .use(express.static(join(projectFolder, "views")))
    .use("/", (req: Request, res: Response, next: NextFunction) => {
      const indexPath = join(projectFolder, "views", "index.html");
      res.sendFile(indexPath, (err: any) => {
        if (err) {
          err['noStaticFiles'] = true;
          next(err);
        }
      });
    })
    .all('*', (req: Request, res: Response, next: NextFunction) => res.status(200).redirect("/"))
    .use((req: Request, res: Response) => res.status(404).send('Not found.'))
    .use((error: any, req: Request, res: Response, next: NextFunction) => {
      console.error(error.stack);
      if (error.noStaticFiles == true) {
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
    logNginx("initialize success !\nApp Version: ${appVersion()}");
    await AuthUserController.DefaultAdminCreation()
    const server = app();
    const port = normalizePort((NODE_ENV === 'production' ? APP_PROD_PORT : APP_DEV_PORT) || 3000);
    const hostnames = getIPAddress(ACCESS_ALL_AVAILABE_PORT === 'true');

    //  ┌────────────── second (0 - 59) (optional)
    //  │  ┌──────────── minute (0 - 59) 
    //  │  │  ┌────────── hour (0 - 23)
    //  │  │  │ ┌──────── day of the month (1 - 31)
    //  │  │  │ │ ┌────── month (1 - 12)
    //  │  │  │ │ │ ┌──── day of the week (0 - 6) (0 and 7 both represent Sunday)
    //  │  │  │ │ │ │
    //  │  │  │ │ │ │
    //  *  *  * * * * 
    cron.schedule("00 59 23 * * *", function () {
      logNginx(`running this task everyday at 23h 59 min 0 seconds.`);
      AUTO_SYNC_AND_CALCULATE_COUCHDB_DATA({ userId: ADMIN_USER_ID });
    });

    const credential: any = {};
    if (isSecure) {
      credential['key'] = fs.readFileSync(`${sslFolder}/analytics/server.key`, 'utf8');
      credential['ca'] = fs.readFileSync(`${sslFolder}/analytics/server-ca.crt`, 'utf8');
      credential['cert'] = fs.readFileSync(`${sslFolder}/analytics/server.crt`, 'utf8');
    }

    ServerStart({
      credential: credential,
      isSecure: isSecure,
      server: server,
      access_all_host: ACCESS_ALL_AVAILABE_PORT === 'true',
      port: port,
      hostnames: hostnames,
      useLocalhost: USE_LOCALHOST === 'true'
    });

  })
  .catch(error => { logNginx(`${error}`) });

