

import { Router } from 'express';
import { Middelware } from "../middleware/auth";
import { GET_RECO_VACCINATION_ALL_DONE_DASHBOARD, GET_RECO_VACCINATION_NOT_DONE_DASHBOARD, GET_RECO_VACCINATION_PARTIAL_DONE_DASHBOARD } from '../controllers/DASHBOARDS/dashboars-realtime';
import { GET_RECO_PERFORMANCE_DASHBOARD, GET_RECO_TASKS_STATE_DASHBOARD, GET_ACTIVE_RECO_DASHBOARD } from '../controllers/DASHBOARDS/dashboars-monthly';


const Dashboards = Router();

Dashboards.post('/reco-vaccination-not-done-dashboards', Middelware.authMiddleware, GET_RECO_VACCINATION_NOT_DONE_DASHBOARD);
Dashboards.post('/reco-vaccination-all-done-dashboards', Middelware.authMiddleware, GET_RECO_VACCINATION_ALL_DONE_DASHBOARD);
Dashboards.post('/reco-vaccination-partial-done-dashboards', Middelware.authMiddleware, GET_RECO_VACCINATION_PARTIAL_DONE_DASHBOARD);

Dashboards.post('/reco-performance-dashboards', Middelware.authMiddleware, GET_RECO_PERFORMANCE_DASHBOARD);
Dashboards.post('/active-reco-dashboards', Middelware.authMiddleware, GET_ACTIVE_RECO_DASHBOARD);
Dashboards.post('/reco-tasks-state-dashboards', Middelware.authMiddleware, GET_RECO_TASKS_STATE_DASHBOARD);



export = Dashboards;GET_RECO_VACCINATION_NOT_DONE_DASHBOARD