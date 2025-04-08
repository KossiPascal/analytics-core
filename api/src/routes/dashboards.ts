

import { Router } from 'express';
import { Middelware } from "../middleware/auth";
import { GET_RECO_CHART_PERFORMANCE_DASHBOARD, GET_RECO_VACCINATION_DASHBOARD, GET_RECO_PERFORMANCE_DASHBOARD } from '../controllers/DASHBOARDS/dashboars';

const Dashboards = Router();

Dashboards.post('/reco-vaccination-dashboards', Middelware.authMiddleware, GET_RECO_VACCINATION_DASHBOARD);
Dashboards.post('/reco-performance-dashboards', Middelware.authMiddleware, GET_RECO_PERFORMANCE_DASHBOARD);
Dashboards.post('/reco-chart-performance-dashboards', Middelware.authMiddleware, GET_RECO_CHART_PERFORMANCE_DASHBOARD);


export = Dashboards;