
import { Router } from 'express';
import { Middelware } from "../middleware/auth";
import { OrgUnitsController } from '../controllers/orgunit-query/org-units-orm';

const OrgUnitsRouter = Router();


OrgUnitsRouter.post('/countries', Middelware.authMiddleware, OrgUnitsController.GET_COUNTRIES);
OrgUnitsRouter.post('/regions', Middelware.authMiddleware, OrgUnitsController.GET_REGIONS);
OrgUnitsRouter.post('/prefectures', Middelware.authMiddleware, OrgUnitsController.GET_PREFECTURES);
OrgUnitsRouter.post('/communes', Middelware.authMiddleware, OrgUnitsController.GET_COMMUNES);
OrgUnitsRouter.post('/hospitals', Middelware.authMiddleware, OrgUnitsController.GET_HOSPITALS);
OrgUnitsRouter.post('/district-quartiers', Middelware.authMiddleware, OrgUnitsController.GET_DISTRICTS_QUARTIERS);
OrgUnitsRouter.post('/village-secteurs', Middelware.authMiddleware, OrgUnitsController.GET_VILLAGES_SECTEURS);
OrgUnitsRouter.post('/families', Middelware.authMiddleware, OrgUnitsController.GET_FAMILIES);
OrgUnitsRouter.post('/chws', Middelware.authMiddleware, OrgUnitsController.GET_CHWS);
OrgUnitsRouter.post('/recos', Middelware.authMiddleware, OrgUnitsController.GET_RECOS);
OrgUnitsRouter.post('/patients', Middelware.authMiddleware, OrgUnitsController.GET_PATIENTS);


export = OrgUnitsRouter;