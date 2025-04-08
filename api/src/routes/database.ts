import { body } from "express-validator";
import { DeleteFromCouchDb, databaseEntitiesList, GetRecoDataToBeDeleteFromCouchDb, DeleteAllDataFromDatabase, UpdateUserFacilityIdAndContactPlace } from "../controllers/databases";
import { Middelware } from "../middleware/auth";

const express = require('express');
const databaseRouter = express.Router();


databaseRouter.post('/postgres/entities', Middelware.authMiddleware, databaseEntitiesList);

databaseRouter.post('/postgres/truncate',
  [
    body('procide').isBoolean().not().isEmpty(),
    body('entities').isArray().not().isEmpty(),
    body('action').not().isEmpty(),
  ],
  Middelware.authMiddleware, DeleteAllDataFromDatabase);

databaseRouter.post('/couchdb/update-user-facility-contact-place', Middelware.authMiddleware, UpdateUserFacilityIdAndContactPlace);

databaseRouter.post('/couchdb/list-data-to-delete', Middelware.authMiddleware, GetRecoDataToBeDeleteFromCouchDb);

databaseRouter.post('/couchdb/detele-data', Middelware.authMiddleware, DeleteFromCouchDb);



export = databaseRouter;


