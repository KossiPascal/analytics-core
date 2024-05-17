import { Router } from 'express';
import { Middelware } from "../middleware/auth";
import { CHW_RECO_REPORTS_CALCULATION } from '../controllers/GET_FROM_DB/reports-calculation/chws-reco.report';
import { SYNC_ALL_FORMS_FROM_COUCHDB, SYNC_APP_USERS_FROM_COUCHDB, SYNC_ORG_UNITS_AND_CONTACTS_FROM_COUCHDB } from '../controllers/sync-from-couchdb';
import { PROMOTONAL_ACTIVITIES_REPORTS_CALCULATION } from '../controllers/GET_FROM_DB/reports-calculation/promotion-activity-report';
import { FAMILY_PLANNNING_REPORTS_CALCULATION } from '../controllers/GET_FROM_DB/reports-calculation/family-planning-report';
import { ADULT_MORBIDITY_REPORTS_CALCULATION } from '../controllers/GET_FROM_DB/reports-calculation/adult-morbidity-report';
import { HOUSEHOLD_RECAPS_REPORTS_CALCULATION } from '../controllers/GET_FROM_DB/reports-calculation/household-recaps-report';
import { PCIMNE_NEWBORN_REPORTS_CALCULATION } from '../controllers/GET_FROM_DB/reports-calculation/pcime-newborn-report';
import { SYNC_ALL_DB_DATA } from '../controllers/auto-sync-all-data';
import { RECO_MEG_STOCK_DASHBOARD_CALCULATION } from '../controllers/GET_FROM_DB/dashboards-calculation/reco-meg-stock-dashboard';
import { RECO_PERFORMANCE_DASHBOARD_CALCULATION } from '../controllers/GET_FROM_DB/dashboards-calculation/reco-performance-dashboard';
import { RECO_CHART_PERFORMANCE_DASHBOARD_CALCULATION } from '../controllers/GET_FROM_DB/dashboards-calculation/reco-chart-performance-dashboard';
import { RECO_VACCINATION_DASHBOARD_CALCULATION } from '../controllers/GET_FROM_DB/dashboards-calculation/reco-vaccine-dashboard';

const SyncRouter = Router();

//reports
SyncRouter.post('/db-chws-reco-report-calculation', Middelware.authMiddleware, CHW_RECO_REPORTS_CALCULATION);
SyncRouter.post('/db-family-planning-report-calculation', Middelware.authMiddleware, FAMILY_PLANNNING_REPORTS_CALCULATION);
SyncRouter.post('/db-adult-morbidity-report-calculation', Middelware.authMiddleware, ADULT_MORBIDITY_REPORTS_CALCULATION);
SyncRouter.post('/db-household-recaps-report-calculation', Middelware.authMiddleware, HOUSEHOLD_RECAPS_REPORTS_CALCULATION);
SyncRouter.post('/db-pcimne-newborn-report-calculation', Middelware.authMiddleware, PCIMNE_NEWBORN_REPORTS_CALCULATION);
SyncRouter.post('/db-promotional-activity-report-calculation', Middelware.authMiddleware, PROMOTONAL_ACTIVITIES_REPORTS_CALCULATION);


//dashboards
SyncRouter.post('/db-reco-meg-stock-dashboard-calculation', Middelware.authMiddleware, RECO_MEG_STOCK_DASHBOARD_CALCULATION);
SyncRouter.post('/db-reco-performance-dashboard-calculation', Middelware.authMiddleware, RECO_PERFORMANCE_DASHBOARD_CALCULATION);
SyncRouter.post('/db-reco-chart-performance-dashboard-calculation', Middelware.authMiddleware, RECO_CHART_PERFORMANCE_DASHBOARD_CALCULATION);
SyncRouter.post('/db-reco-vaccination-dashboard-calculation', Middelware.authMiddleware, RECO_VACCINATION_DASHBOARD_CALCULATION);


//others
SyncRouter.post('/couchdb-forms-data', Middelware.authMiddleware, SYNC_ALL_FORMS_FROM_COUCHDB);
SyncRouter.post('/couchdb-users', Middelware.authMiddleware, SYNC_APP_USERS_FROM_COUCHDB);
SyncRouter.post('/couchdb-orgunits-and-contacts', Middelware.authMiddleware, SYNC_ORG_UNITS_AND_CONTACTS_FROM_COUCHDB);

SyncRouter.post('/all-in-one-from-couchdb-and-calculate', Middelware.authMiddleware, SYNC_ALL_DB_DATA);
                                                                
                                                                                                                          
export = SyncRouter;



