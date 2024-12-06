

import { Router } from 'express';
import { Middelware } from "../middleware/auth";
import { SEND_FAMILY_PLANNING_ACTIVITIES_TO_DHIS2, SEND_HOUSEHOLD_ACTIVITIES_TO_DHIS2, SEND_MONTHLY_ACTIVITIES_TO_DHIS2, SEND_MORBIDITY_ACTIVITIES_TO_DHIS2, SEND_PCIMNE_NEWBORN_ACTIVITIES_TO_DHIS2, SEND_PROMOTONAL_ACTIVITIES_TO_DHIS2, SEND_RECO_MEG_SITUATION_ACTIVITIES_TO_DHIS2 } from '../controllers/send-data-to-dhis2';

const Dhis2Router = Router();

Dhis2Router.post('/send/monthly-activity', Middelware.authMiddleware, SEND_MONTHLY_ACTIVITIES_TO_DHIS2);

Dhis2Router.post('/send/family-planning-activity', Middelware.authMiddleware, SEND_FAMILY_PLANNING_ACTIVITIES_TO_DHIS2);

Dhis2Router.post('/send/household-activity', Middelware.authMiddleware, SEND_HOUSEHOLD_ACTIVITIES_TO_DHIS2);

Dhis2Router.post('/send/morbidity-activity', Middelware.authMiddleware, SEND_MORBIDITY_ACTIVITIES_TO_DHIS2);

Dhis2Router.post('/send/pcimne-newborn-activity', Middelware.authMiddleware, SEND_PCIMNE_NEWBORN_ACTIVITIES_TO_DHIS2);

Dhis2Router.post('/send/promotional-activity', Middelware.authMiddleware, SEND_PROMOTONAL_ACTIVITIES_TO_DHIS2);

Dhis2Router.post('/send/reco-meg-situation-activity', Middelware.authMiddleware, SEND_RECO_MEG_SITUATION_ACTIVITIES_TO_DHIS2);



export = Dhis2Router;
