

import { Router } from 'express';
import { Middelware } from "../middleware/auth";
import { SEND_PROMOTONAL_ACTIVITIES_TO_DHIS2 } from '../controllers/send-data-to-dhis2';

const Dhis2Router = Router();

Dhis2Router.post('/send/promotional-activity', Middelware.authMiddleware, SEND_PROMOTONAL_ACTIVITIES_TO_DHIS2);


export = Dhis2Router;
