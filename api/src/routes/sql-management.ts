import { Router } from 'express';
import { Middelware } from "../middleware/auth";
import { getAllMigrationsPathList, runAllMigrationsAvailable, getOneMigrationsPath, runOneMigrationAvailable } from '../controllers/sql-views-manage';
import { body } from 'express-validator';

const SqlManageRouter = Router();

SqlManageRouter.post('/getall', Middelware.authMiddleware, getAllMigrationsPathList);

SqlManageRouter.post('/runall',
    [
        body('runAllMigrations').isBoolean().not().isEmpty(),
        body('userId').not().isEmpty(),
    ],
    Middelware.authMiddleware, runAllMigrationsAvailable);

SqlManageRouter.post('/getone', 
    [
        body('migrationName').isString().not().isEmpty(),
        body('userId').not().isEmpty(),
    ],
    Middelware.authMiddleware, getOneMigrationsPath);

SqlManageRouter.post('/runone',
    [
        body('runOneMigrations').isBoolean().not().isEmpty(),
        body('migrationName').isString().not().isEmpty(),
        body('userId').not().isEmpty(),
    ],
    Middelware.authMiddleware, runOneMigrationAvailable);


export = SqlManageRouter;