// import "reflect-metadata";
// import { ServerStart, getIPAddress, logNginx, normalizePort } from './utils/functions';
// import { APP_ENV, ENV_FOLDER, PROJECT_FOLDER } from "./utils/constantes";
// import { ADMIN_USER_ID, AuthUserController } from "./controllers/auth-user";
// import { AUTO_SYNC_AND_CALCULATE_COUCHDB_DATA } from "./controllers/auto-sync-all-data";
// import express, { Request, Response, NextFunction } from 'express';
// import { json, urlencoded } from 'body-parser';
// import { AppDataSource } from './data_source';
// import { join } from 'path';
// import authRouter from "./routes/auth-user";
// import configsRouter from "./routes/config";
// import orgUnitsRouter from "./routes/org-units";
// import reportsRouter from "./routes/reports";
// import dashboardsRouter from "./routes/dashboards";
// import apisRouter from "./routes/api-token";
// import syncRouter from "./routes/sync-data";
// import databaseRouter from "./routes/database";
// import dhis2Router from "./routes/dhis2";
// import cors from "cors";
// import bearerToken from "express-bearer-token";
// import bodyParser from 'body-parser';
// import helmet from 'helmet';
// import cron from "node-cron";
// import compression from "compression";
// import responseTime from 'response-time';
// import fs from 'fs';

// const { NODE_ENV, APP_PROD_PORT, APP_DEV_PORT, ACCESS_ALL_AVAILABE_PORT, USE_LOCALHOST, ACTIVE_SECURE_MODE } = APP_ENV;
// const isSecure = ACTIVE_SECURE_MODE === 'true';
// const session = require('express-session');
 
// function app() {
//   const server = express()
//     .use(bodyParser.json())
//     .use(bodyParser.urlencoded({ extended: true }))
//     .use(helmet({ contentSecurityPolicy: false }))
//     .use(cors())
//     // .use(cors({
//     //   origin: true,//['http://127.0.0.1:5501', 'http://127.0.0.1:5502'],
//     //   credentials: true
//     // }))
//     .use(json())
//     .use(responseTime())
//     .use(compression())
//     .use(urlencoded({ extended: false }))
//     .enable('trust proxy')
//     .set('strict routing', true)
//     .set('trust proxy', true)
//     // .set('trust proxy', 1)
//     .set("view engine", "ejs")
//     .set('json spaces', 0)
//     .set('content-type', 'application/json; charset=utf-8')

//     .use(express.json({ limit: '200mb' }))
//     .use(express.urlencoded({ limit: '200mb', extended: true }))
    
//     .use(session({
//       secret: 'session',
//       cookie: {
//         secure: true,
//         maxAge: 60000
//       },
//       saveUninitialized: true,
//       resave: true
//     }))
//     .use(bearerToken())
//     .use((req: Request, res: Response, next: NextFunction) => {
//       if (req.method === 'OPTIONS') return res.status(200).end();
//       if (isSecure && req.secure) return next();
//       if (isSecure && !req.secure) return res.redirect(`https://${req.headers.host}${req.url}`);
//       if (!isSecure) return next();
//     })
//     .use('/api/auth-user', authRouter)
//     .use('/api/configs', configsRouter)
//     .use('/api/reports', reportsRouter)
//     .use('/api/dashboards', dashboardsRouter)
//     .use('/api/org-units', orgUnitsRouter)
//     .use('/api/api-token', apisRouter)
//     .use('/api/sync', syncRouter)
//     .use('/api/database', databaseRouter)
//     .use('/api/dhis2', dhis2Router)
//     .use('/api/assets', express.static(__dirname + '/assets'))
//     // .use(express.static(join(projectFolder, "views"), {
//     //   setHeaders: (res, path) => {
//     //     // if (path.endsWith('.html')) {
//     //     res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
//     //     res.setHeader('Pragma', 'no-cache');
//     //     res.setHeader('Expires', '0');
//     //     // }
//     //   }
//     // }))
//     .use(express.static(join(PROJECT_FOLDER, "views")))
//     .use("/", (req: Request, res: Response, next: NextFunction) => {
//       const indexPath = join(PROJECT_FOLDER, "views", "index.html");
//       res.sendFile(indexPath, (err: any) => {
//         if (err) {
//           err['noStaticFiles'] = true;
//           next(err);
//         }
//       });
//     })
//     .all('*', (req: Request, res: Response, next: NextFunction) => res.status(200).redirect("/"))
//     .use((req: Request, res: Response) => res.status(404).send('Not found.'))
//     .use((error: any, req: Request, res: Response, next: NextFunction) => {
//       console.error(error.stack);
//       if (error.noStaticFiles == true) {
//         res.status(404).sendFile(join(__dirname, 'public', '404.html'));
//       } else {
//         res.status(error.statusCode || 500).json({
//           error: {
//             message: error.message,
//             data: error.data,
//           },
//         });
//       }
//     });

//   return server;
// }

// AppDataSource
//   .initialize()
//   .then(async () => {
//     logNginx("initialize success !\nApp Version: ${appVersion()}");
//     await AuthUserController.DefaultAdminCreation()
//     const server = app();
//     const port = normalizePort((NODE_ENV === 'production' ? APP_PROD_PORT : APP_DEV_PORT) || 3000);
//     const hostnames = getIPAddress(ACCESS_ALL_AVAILABE_PORT === 'true');
//                 //  ┌────────────── second (0 - 59) (optional)
//                 //  │  ┌──────────── minute (0 - 59) 
//                 //  │  │  ┌────────── hour (0 - 23)
//                 //  │  │  │ ┌──────── day of the month (1 - 31)
//                 //  │  │  │ │ ┌────── month (1 - 12)
//                 //  │  │  │ │ │ ┌──── day of the week (0 - 6) (0 and 7 both represent Sunday)
//                 //  │  │  │ │ │ │
//                 //  │  │  │ │ │ │
//                 //  *  *  * * * * 
//     cron.schedule("00 59 23 * * *", function () {
//       logNginx(`running this task everyday at 23h 59 min 0 seconds.`);
//       AUTO_SYNC_AND_CALCULATE_COUCHDB_DATA({ userId: ADMIN_USER_ID });
//     });
//     const credential: any = {};
//     if (isSecure) {
//       credential['key'] = fs.readFileSync(`${ENV_FOLDER}/server.key`, 'utf8');
//       credential['ca'] = fs.readFileSync(`${ENV_FOLDER}/server-ca.crt`, 'utf8');
//       credential['cert'] = fs.readFileSync(`${ENV_FOLDER}/server.crt`, 'utf8');
//     }
//     ServerStart({
//       credential: credential,
//       isSecure: isSecure,
//       server: server,
//       access_all_host: ACCESS_ALL_AVAILABE_PORT === 'true',
//       port: port,
//       hostnames: hostnames,
//       useLocalhost: USE_LOCALHOST === 'true'
//     });
//   })
//   .catch(error => { logNginx(`${error}`) });

