import { Request, Response, NextFunction } from "express";
import { JsonDatabase } from "../json-data-source";
import request from 'request';
import { getUsersRepository } from "../entities/User";
import { getDateInFormat } from "../utils/date-utils";
import { ADULT_MORBIDITY_REPORTS_CALCULATION_DATA } from "./GET_FROM_DB/reports-calculation/adult-morbidity-report";
import { CHW_RECO_REPORTS_CALCULATION_DATA } from "./GET_FROM_DB/reports-calculation/chws-reco.report";
import { FAMILY_PLANNNING_REPORTS_CALCULATION_DATA } from "./GET_FROM_DB/reports-calculation/family-planning-report";
import { HOUSEHOLD_RECAPS_REPORTS_CALCULATION_DATA } from "./GET_FROM_DB/reports-calculation/household-recaps-report";
import { PCIMNE_NEWBORN_REPORTS_CALCULATION_DATA } from "./GET_FROM_DB/reports-calculation/pcime-newborn-report";
import { PROMOTONAL_ACTIVITIES_REPORTS_CALCULATION_DATA } from "./GET_FROM_DB/reports-calculation/promotion-activity-report";
import { RECO_PERFORMANCE_DASHBOARD_CALCULATION_DATA } from "./GET_FROM_DB/dashboards-calculation/reco-performance-dashboard";
import { RECO_CHART_PERFORMANCE_DASHBOARD_CALCULATION_DATA } from "./GET_FROM_DB/dashboards-calculation/reco-chart-performance-dashboard";
import { RECO_VACCINATION_DASHBOARD_CALCULATION_DATA } from "./GET_FROM_DB/dashboards-calculation/reco-vaccine-dashboard";
import { normalizePort, logNginx, notEmpty } from "../utils/functions";
import { APP_ENV } from "../utils/constantes";
import { RECO_MEG_SITUATION_REPORTS_CALCULATION_DATA } from "./GET_FROM_DB/reports-calculation/reco-meg-situation-report";

const { NODE_ENV, APP_HOST, ACTIVE_SECURE_MODE, APP_PROD_PORT, APP_DEV_PORT } = APP_ENV;


export async function SYNC_ALL_DB_DATA(req: Request, res: Response, next: NextFunction) {
  const data = { userId: req.body.userId, wait: false, customDate: { start_date: req.body.start_date, end_date: req.body.end_date, month: req.body.month, year: req.body.year }, createOutputFile: false };

  return await AUTO_SYNC_AND_CALCULATE_COUCHDB_DATA(data, req, res, next);
}

export async function AUTO_SYNC_AND_CALCULATE_COUCHDB_DATA(params: { wait?: boolean, customDate?: { start_date?: string, end_date?: string, month?: string, year?: number }, createOutputFile?: boolean, userId: string }, req?: Request, res?: Response, next?: NextFunction) {
  var output: { orgunit: any, data: any, reports: any, dashboards: any, globalError: any, successDetails: any } = { orgunit: null, data: null, reports: [], dashboards: [], globalError: null, successDetails: null };
  try {

    const port = normalizePort((NODE_ENV === 'production' ? APP_PROD_PORT : APP_DEV_PORT) || 3000);
    const createOutputFile = params.createOutputFile === true;
    // const wait = data!=null && notEmpty(data.wait) && data.wait != null ? data.wait : true;
    // if(data.wait == true) await delay(60000);
    const startDate = new Date();
    const startAt = (startDate).getTime();
    const customDate = params.customDate;

    if ((params.userId ?? '') !== '') {
      const _userRepo = await getUsersRepository();
      const _repoSync = new JsonDatabase('syncs');
      const user = await _userRepo.findOneBy({ id: params.userId });
      if (user) {
        var START_DATE: string;
        var END_DATE: string;
        const YEARS: number[] = [];
        const MONTHS: string[] = [];

        if (customDate) {
          if ((customDate.start_date ?? '') !== '' && (customDate.end_date ?? '') !== '') {
            START_DATE = customDate.start_date!;
            END_DATE = customDate.end_date!;

            const ds = customDate.start_date!.split('-');
            const de = customDate.end_date!.split('-');

            const yearDiff = parseInt(de[0]) - parseInt(ds[0]);
            const ms = parseInt(ds[1]);
            const me = parseInt(de[1]);

            for (var i = 0; i <= yearDiff; i++) {
              YEARS.push(parseInt(ds[0]) + i);
            }

            if (yearDiff === 0) {
              for (var j = ms; j <= me; j++) {
                MONTHS.push(String(j).padStart(2, '0'));
              }
            } else if (yearDiff === 1) {
              for (var k = ms; k <= 12; k++) {
                const dtm = String(k).padStart(2, '0');
                if (!(MONTHS.includes(dtm))) {
                  MONTHS.push(dtm);
                }
              }
              for (var l = 1; l <= me; l++) {
                const dtm = String(l).padStart(2, '0');
                if (!(MONTHS.includes(dtm))) {
                  MONTHS.push(dtm);
                }
              }
            } else {
              for (var m = 1; m <= 12; m++) {
                MONTHS.push(String(m).padStart(2, '0'));
              }
            }

            for (var j = 0; j <= yearDiff; j++) {
              YEARS.push(parseInt(ds[0]) + j);
            }
          } else if ((customDate.month ?? '') !== '' && (customDate.year ?? '') !== '') {
            const lastDay = String(new Date(customDate.year!, parseInt(customDate.month!) - 1, 0).getDate()).padStart(2, '0');
            START_DATE = `${customDate.year}-${customDate.month}-01`;
            END_DATE = `${customDate.year}-${customDate.month}-${lastDay}`;
            MONTHS.push(customDate.month!);
            YEARS.push(customDate.year!);
          } else {
            output.globalError = "Month or Year or date not provided!"
            if (res) return res.status(201).json({ status: 201, data: output });
            return;
          }

        } else {
          const date = new Date();
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = date.getDate();
          const lastDate = String((new Date(year, 0, 0)).getDate()).padStart(2, '0');
          var _year: number = year;
          var _month: string = month;
          YEARS.push(year);
          MONTHS.push(month)
          const _day = String(day <= 15 ? 15 : 1).padStart(2, '0');
          if (date.getMonth() === 0 && day <= 15) {
            _year = year - 1;
            _month = '12';
            YEARS.push(year - 1);
            MONTHS.push('12')
          }
          START_DATE = `${_year}-${_month}-${_day}`;
          END_DATE = `${year}-${month}-${lastDate}`;
        }

        const APP_API_HOST = `${ACTIVE_SECURE_MODE === 'true' ? 'https' : 'http'}://${APP_HOST}:${port}/api`;
        const headers = { "Content-Type": "application/json" };
        logNginx('\n\nstart fetching orgunits\n');
        request({
          url: `${APP_API_HOST}/sync/couchdb-orgunits-and-contacts`,
          method: 'POST',
          body: JSON.stringify({
            start_date: START_DATE,
            end_date: END_DATE,
            country: true,
            region: true,
            prefecture: true,
            commune: true,
            hospital: true,
            country_manager: true,
            region_manager: true,
            prefecture_manager: true,
            commune_manager: true,
            hospital_manager: true,
            district_quartier: true,
            chw: true,
            village_secteur: true,
            reco: true,
            family: true,
            patient: true,
            userId: user.id,
            privileges: true
          }),
          headers: headers
        }, async function (error1: any, response1: any, body1: any) {
          if (!error1 && notEmpty(body1)) output.orgunit = JSON.parse(`${body1}`);
          logNginx('\n\nstart fetching data\n');
          request({
            url: `${APP_API_HOST}/sync/couchdb-forms-data`,
            method: 'POST',
            body: JSON.stringify({
              start_date: START_DATE,
              end_date: END_DATE,
              userId: user.id,
              privileges: true
            }),
            headers: headers
          }, async function (error2: any, response2: any, body2: any) {
            if (!error2 && notEmpty(body2)) output.data = JSON.parse(`${body2}`);
            logNginx('\n\nstart data calculation\n');

            for (const year of YEARS) {
              for (const month of MONTHS) {
                //REPORTS
                const d1 = await CHW_RECO_REPORTS_CALCULATION_DATA({ year, month });
                const d2 = await FAMILY_PLANNNING_REPORTS_CALCULATION_DATA({ year, month });
                const d3 = await ADULT_MORBIDITY_REPORTS_CALCULATION_DATA({ year, month });
                const d4 = await HOUSEHOLD_RECAPS_REPORTS_CALCULATION_DATA({ year, month });
                const d5 = await PCIMNE_NEWBORN_REPORTS_CALCULATION_DATA({ year, month });
                const d6 = await PROMOTONAL_ACTIVITIES_REPORTS_CALCULATION_DATA({ year, month });
                const d7 = await RECO_MEG_SITUATION_REPORTS_CALCULATION_DATA({ year, month });
                output.reports.push({ cible: `CHW RECO REPORTS ( ${month}-${year} )`, data: d1 });
                output.reports.push({ cible: `FAMILY PLANNNING REPORTS ( ${month}-${year} )`, data: d2 });
                output.reports.push({ cible: `ADULT MORBIDITY REPORTS ( ${month}-${year} )`, data: d3 });
                output.reports.push({ cible: `HOUSEHOLD RECAPS REPORTS ( ${month}-${year} )`, data: d4 });
                output.reports.push({ cible: `PCIMNE NEWBORN REPORTS ( ${month}-${year} )`, data: d5 });
                output.reports.push({ cible: `PROMOTONAL ACTIVITIES REPORTS ( ${month}-${year} )`, data: d6 });
                output.reports.push({ cible: `RECO MEG SITUATION ( ${month}-${year} )`, data: d7 });

                //DASHBOARDS
                const d8 = await RECO_PERFORMANCE_DASHBOARD_CALCULATION_DATA({ year, month });
                const d9 = await RECO_VACCINATION_DASHBOARD_CALCULATION_DATA({ year, month });

                output.dashboards.push({ cible: `RECO PERFORMANCE DASHBOARD ( ${month}-${year} )`, data: d8 });
                output.dashboards.push({ cible: `RECO VACCINATION DASHBOARD ( ${month}-${year} )`, data: d9 });

              }
              const d99 = await RECO_CHART_PERFORMANCE_DASHBOARD_CALCULATION_DATA(year);
              output.dashboards.push({ cible: `RECO PERFORMANCE DASHBOARD CHART ( ${year} )`, data: d99 });
            }

            const now = new Date();
            const seconds = (now.getTime() - startAt) / 1000;
            const display = seconds <= 60 ? `${seconds} sec` : (seconds / 60) <= 60 ? `${(seconds / 60).toFixed(2)} min` : `${((seconds / 60) / 60).toFixed(2)} h`;
            const starts = getDateInFormat(startDate, 0, `en`, true);
            const ends = getDateInFormat(now, 0, `en`, true);
            const details = {
              start_at: starts.split(' ')[1],
              start_at_timestamp: startAt,
              end_at: ends.split(' ')[1],
              end_at_timestamp: now.getTime(),
              duration: display,
              start_date_filter: START_DATE,
              end_date_filter: END_DATE
            };
            if (createOutputFile == true) {
              const syncFound = await _repoSync.getBy(getDateInFormat(now));
              var sync: any;
              if (!syncFound) {
                sync = {
                  id: ends.split(' ')[0],
                  details: [
                    details
                  ]
                }
              } else {
                syncFound.details.push(details);
                sync = syncFound;
              }
              await _repoSync.save(sync);
            }
            logNginx(`\n\nDurée de l'action: ${display}\n`);
            output.successDetails = {
              date: ends.split(' ')[0],
              start_at: starts.split(' ')[1],
              start_at_timestamp: startAt,
              end_at: ends.split(' ')[1],
              end_at_timestamp: now.getTime(),
              duration: display,
              start_date_filter: START_DATE,
              end_date_filter: END_DATE
            }
            if (res != null) return res.status(200).json({ status: 200, data: output });

          });
        });
      }
    }
  } catch (err: any) {
    output.globalError = `${err}`;
    if (res != null) return res.status(500).json({ status: 500, data: output });
  }

}




