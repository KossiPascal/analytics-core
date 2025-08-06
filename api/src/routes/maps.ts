

import { Router } from 'express';
import { Middelware } from "../middleware/auth";
import { GET_RECO_DATA_MAPS } from '../controllers/MAPS/maps';

const Maps = Router();

Maps.post('/reco-data-maps', Middelware.authMiddleware, GET_RECO_DATA_MAPS);


export = Maps;