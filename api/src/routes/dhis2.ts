

import { Router } from 'express';
import { Middelware } from "../middleware/auth";
import { SEND_FAMILY_PLANNING_ACTIVITIES_TO_DHIS2, SEND_HOUSEHOLD_ACTIVITIES_TO_DHIS2, SEND_MONTHLY_ACTIVITIES_TO_DHIS2, SEND_MORBIDITY_ACTIVITIES_TO_DHIS2, SEND_PCIMNE_NEWBORN_ACTIVITIES_TO_DHIS2, SEND_PROMOTONAL_ACTIVITIES_TO_DHIS2, SEND_RECO_MEG_SITUATION_ACTIVITIES_TO_DHIS2 } from '../controllers/REPORTS/send-to-dhis2';

const Dhis2Router = Router();

Dhis2Router.post('/send/monthly-activity', Middelware.authMiddleware, Middelware.sendReportsToDhis2Middleware, SEND_MONTHLY_ACTIVITIES_TO_DHIS2);
Dhis2Router.post('/send/family-planning-activity', Middelware.authMiddleware, Middelware.sendReportsToDhis2Middleware,SEND_FAMILY_PLANNING_ACTIVITIES_TO_DHIS2);
Dhis2Router.post('/send/household-activity', Middelware.authMiddleware, Middelware.sendReportsToDhis2Middleware,SEND_HOUSEHOLD_ACTIVITIES_TO_DHIS2);
Dhis2Router.post('/send/morbidity-activity', Middelware.authMiddleware, Middelware.sendReportsToDhis2Middleware,SEND_MORBIDITY_ACTIVITIES_TO_DHIS2);
Dhis2Router.post('/send/pcimne-newborn-activity', Middelware.authMiddleware, Middelware.sendReportsToDhis2Middleware,SEND_PCIMNE_NEWBORN_ACTIVITIES_TO_DHIS2);
Dhis2Router.post('/send/promotional-activity', Middelware.authMiddleware, Middelware.sendReportsToDhis2Middleware,SEND_PROMOTONAL_ACTIVITIES_TO_DHIS2);
Dhis2Router.post('/send/reco-meg-situation-activity', Middelware.authMiddleware, Middelware.sendReportsToDhis2Middleware,SEND_RECO_MEG_SITUATION_ACTIVITIES_TO_DHIS2);



export = Dhis2Router;
