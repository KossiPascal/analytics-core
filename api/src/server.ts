import "reflect-metadata"
import express, { Request, Response, NextFunction } from 'express';
import { json, urlencoded } from 'body-parser';
import { logNginx, normalizePort } from './utils/functions';
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

const apiFolder = dirname(__dirname);
const projectFolder = dirname(apiFolder);
const projectParentFolder = dirname(projectFolder);
config({ path: `${projectParentFolder}/ssl/.env` });
const { NODE_ENV, APP_PROD_PORT, APP_DEV_PORT } = process.env;

const port = normalizePort((NODE_ENV === 'production' ? APP_PROD_PORT : APP_DEV_PORT) || 3000);
// var session = require('express-session');

function app() {
  const server = express()
    .use(bodyParser.json())
    .use(bodyParser.urlencoded({ extended: true }))
    .use(helmet({ contentSecurityPolicy: false }))
    .use(cors({
      origin: true,//['http://127.0.0.1:5501', 'http://127.0.0.1:5502'],
      credentials: true
    }))
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
    // .use(session({
    //   secret: 'session',
    //   cookie: {
    //     secure: true,
    //     maxAge: 60000
    //   },
    //   saveUninitialized: true,
    //   resave: true
    // }))
    .use(bearerToken())
    .get('/favicon.ico', (req, res) => {
      res.status(204).end(); // No content response
    })
    .use((req: Request, res: Response, next: NextFunction) => {
      if (req.method === 'OPTIONS') return res.status(200).end();
      // if (req.secure) next();
      // if (!req.secure) res.redirect(`https://${req.headers.host}${req.url}`);
      next();
    })

    .use('/api/auth-user', authRouter)
    .use('/api/configs', configsRouter)
    .use('/api/reports', reportsRouter)
    .use('/api/dashboards', dashboardsRouter)
    .use('/api/org-units', orgUnitsRouter)
    .use('/api/api-token', apisRouter)
    .use('/api/sync', syncRouter)
    .use('/api/database', databaseRouter)

    .use('/api/assets', express.static(__dirname + '/assets'))
    .use(express.static(join(apiFolder, "build", "browser")))
    .use("/", (req: Request, res: Response, next: NextFunction) => {
      const indexPath = join(apiFolder, "build", "browser", "index.html");
      res.sendFile(indexPath, (err: any) => {
        if (err) {
          err['noStaticFiles'] = true;
          next(err);
        }
      });
    })
    .use((req: Request, res: Response) => {
      res.status(404).send('Not found.');
    })
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
    })
    .all('*', (req: Request, res: Response, next: NextFunction) => {
      res.status(200).redirect("/");
    });

  return server;
}

AppDataSource
  .initialize()
  .then(async () => {
    logNginx("initialize success !\nApp Version: ${appVersion()}");
    await AuthUserController.DefaultAdminCreation()
    const server = app();

    //  ┌────────────── second (0 - 59) (optional)
    //  │ ┌──────────── minute (0 - 59) 
    //  │ │ ┌────────── hour (0 - 23)
    //  │ │ │ ┌──────── day of the month (1 - 31)
    //  │ │ │ │ ┌────── month (1 - 12)
    //  │ │ │ │ │ ┌──── day of the week (0 - 6) (0 and 7 both represent Sunday)
    //  │ │ │ │ │ │
    //  │ │ │ │ │ │
    //  * * * * * * 
    cron.schedule("00 59 23 * * *", function () {
      logNginx(`running this task everyday at 23h 59 min 0 seconds.`);
      AUTO_SYNC_AND_CALCULATE_COUCHDB_DATA({ userId: ADMIN_USER_ID });
    });

    // Start the server
    server.listen(port, () => {
      console.log(`Server is running at http://localhost:${port}`);
    });
  })
  .catch(error => { logNginx(`${error}`) });

