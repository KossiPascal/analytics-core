import { Router } from 'express';
import { Middelware } from "../middleware/auth";
import { GET_PROMOTION_REPORTS, GET_FAMILY_PLANNING_REPORTS, MORBIDITY_REPORTS, GET_HOUSEHOLD_RECAP_REPORTS, GET_PCIME_REPORTS, GET_CHWS_RECO_REPORTS } from '../controllers/GET_FROM_DB/reports';

const Reports = Router();

Reports.post('/promotion-reports', Middelware.authMiddleware, GET_PROMOTION_REPORTS);
Reports.post('/family-planning-reports', Middelware.authMiddleware, GET_FAMILY_PLANNING_REPORTS);
Reports.post('/morbidity-reports', Middelware.authMiddleware, MORBIDITY_REPORTS);
Reports.post('/household-recaps-reports', Middelware.authMiddleware, GET_HOUSEHOLD_RECAP_REPORTS);
Reports.post('/pcime-newborn-reports', Middelware.authMiddleware, GET_PCIME_REPORTS);
Reports.post('/chws-reco-reports', Middelware.authMiddleware, GET_CHWS_RECO_REPORTS);

export = Reports;