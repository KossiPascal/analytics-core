import { Router } from 'express';
import { Middelware } from "../middleware/auth";
import { GET_PROMOTION_REPORTS, GET_FAMILY_PLANNING_REPORTS, GET_MORBIDITY_REPORTS, GET_HOUSEHOLD_RECAP_REPORTS, GET_PCIME_REPORTS, GET_CHWS_RECO_REPORTS, GET_RECO_MEG_REPORTS } from '../controllers/GET_FROM_DB/reports';
import { CANCEL_VALIDATE_CHWS_RECO_REPORTS, CANCEL_VALIDATE_FAMILY_PLANNING_REPORTS, CANCEL_VALIDATE_HOUSEHOLD_RECAP_REPORTS, CANCEL_VALIDATE_MORBIDITY_REPORTS, CANCEL_VALIDATE_PCIME_REPORTS, CANCEL_VALIDATE_PROMOTION_REPORTS, CANCEL_VALIDATE_RECO_MEG_REPORTS, VALIDATE_CHWS_RECO_REPORTS, VALIDATE_FAMILY_PLANNING_REPORTS, VALIDATE_HOUSEHOLD_RECAP_REPORTS, VALIDATE_MORBIDITY_REPORTS, VALIDATE_PCIME_REPORTS, VALIDATE_PROMOTION_REPORTS, VALIDATE_RECO_MEG_REPORTS } from '../controllers/GET_FROM_DB/validate-reports';

const Reports = Router();

// GET REPORTS
Reports.post('/promotion-reports', Middelware.authMiddleware, GET_PROMOTION_REPORTS);
Reports.post('/family-planning-reports', Middelware.authMiddleware, GET_FAMILY_PLANNING_REPORTS);
Reports.post('/morbidity-reports', Middelware.authMiddleware, GET_MORBIDITY_REPORTS);
Reports.post('/household-recaps-reports', Middelware.authMiddleware, GET_HOUSEHOLD_RECAP_REPORTS);
Reports.post('/pcime-newborn-reports', Middelware.authMiddleware, GET_PCIME_REPORTS);
Reports.post('/chws-reco-reports', Middelware.authMiddleware, GET_CHWS_RECO_REPORTS);
Reports.post('/reco-meg-situation-reports', Middelware.authMiddleware, GET_RECO_MEG_REPORTS);


// VALIDATE REPORTS
Reports.post('/promotion-reports-validation', Middelware.authMiddleware, VALIDATE_PROMOTION_REPORTS);
Reports.post('/family-planning-reports-validation', Middelware.authMiddleware, VALIDATE_FAMILY_PLANNING_REPORTS);
Reports.post('/morbidity-reports-validation', Middelware.authMiddleware, VALIDATE_MORBIDITY_REPORTS);
Reports.post('/household-recaps-reports-validation', Middelware.authMiddleware, VALIDATE_HOUSEHOLD_RECAP_REPORTS);
Reports.post('/pcime-newborn-reports-validation', Middelware.authMiddleware, VALIDATE_PCIME_REPORTS);
Reports.post('/chws-reco-reports-validation', Middelware.authMiddleware, VALIDATE_CHWS_RECO_REPORTS);
Reports.post('/reco-meg-situation-reports-validation', Middelware.authMiddleware, VALIDATE_RECO_MEG_REPORTS);


// CANCEL VALIDATE REPORTS
Reports.post('/cancel-promotion-reports-validation', Middelware.authMiddleware, CANCEL_VALIDATE_PROMOTION_REPORTS);
Reports.post('/cancel-family-planning-reports-validation', Middelware.authMiddleware, CANCEL_VALIDATE_FAMILY_PLANNING_REPORTS);
Reports.post('/cancel-morbidity-reports-validation', Middelware.authMiddleware, CANCEL_VALIDATE_MORBIDITY_REPORTS);
Reports.post('/cancel-household-recaps-reports-validation', Middelware.authMiddleware, CANCEL_VALIDATE_HOUSEHOLD_RECAP_REPORTS);
Reports.post('/cancel-pcime-newborn-reports-validation', Middelware.authMiddleware, CANCEL_VALIDATE_PCIME_REPORTS);
Reports.post('/cancel-chws-reco-reports-validation', Middelware.authMiddleware, CANCEL_VALIDATE_CHWS_RECO_REPORTS);
Reports.post('/cancel-reco-meg-situation-reports-validation', Middelware.authMiddleware, CANCEL_VALIDATE_RECO_MEG_REPORTS);

export = Reports;