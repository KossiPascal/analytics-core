import { Injectable } from '@angular/core';
// import axios from 'axios';
import { generateStartEndDate, RETRY_MILLIS } from '../shared/functions';
import { FamilyPlanningReport, HouseholdRecapReport, ChwsRecoReport, MorbidityReport, PromotionReport, PcimneNewbornReport, RecoMegSituationReport } from '@kossi-models/reports';
import { IndexedDbService } from './indexed-db.service';
import { ApiService } from './api.service';
import { Observable, catchError, map, of, switchMap } from 'rxjs';
import { ActiveRecoDashboard, RecoPerformanceDashboard, RecoPerformanceDashboardFullYearDbOutput, RecoTasksStateDashboard, RecoVaccinationDashboard, RecoVaccinationDashboardDbOutput } from '@kossi-models/dashboards';
import { RecoDataMapsDbOutput } from '@kossi-models/maps';

@Injectable({
  providedIn: 'root'
})
export class DbSyncService {
  private readonly keyPath: string = 'id';

  constructor(private indexdb: IndexedDbService, private api: ApiService) {
  }

  async all({ months, year, recos }: { months: string[], year: number, recos: string[] }): Promise<boolean> {
    console.info('Start sync from cloud to local ...');
    try {
      const d1 = await this.SyncChwsRecoReports({ months, year, recos }).toPromise();
      const d2 = await this.SyncPromotionReports({ months, year, recos }).toPromise();
      const d3 = await this.SyncFamilyPlanningReports({ months, year, recos }).toPromise();
      const d4 = await this.SyncMorbidityReports({ months, year, recos }).toPromise();
      const d5 = await this.SyncHouseholdRecapReports({ months, year, recos }).toPromise();
      const d6 = await this.SyncPcimneNewbornReports({ months, year, recos }).toPromise();
      const d7 = await this.SyncRecoMegSituationReports({ months, year, recos }).toPromise();

      const d8 = await this.SyncRecoVaccinationNotDoneDashboards({ months, year, recos }).toPromise();
      const d9 = await this.SyncRecoVaccinationPartialDoneDashboards({ months, year, recos }).toPromise();
      const d10 = await this.SyncRecoVaccinationAllDoneDashboards({ months, year, recos }).toPromise();
      const d11 = await this.SyncRecoPerformanceDashboards({ months, year, recos }).toPromise();
      // const d12 = await this.SyncRecoChartPerformanceDashboards({ year, recos }).toPromise();
      const d13 = await this.SyncActiveRecoDashboards({ year, recos }).toPromise();

      const d14 = await this.SyncRecoDataMaps({ months, year, recos }).toPromise();

      const start_end_date = generateStartEndDate(months, year);
      const d15 = await this.SyncRecoTasksStateDashboards({ ...start_end_date, recos }).toPromise();


      console.info('Successfully synced to local!');

      return d1 === true && d2 === true && d3 === true && d4 === true && d5 === true && d6 === true && d7 === true && d8 === true && d9 === true && d10 === true && d11 === true && d13 === true && d14 === true && d15 === true;
    } catch (err) {
      console.error('Error initialising watching for db changes (changes.service.ts: 108)', err);
      console.log(`🔄 Retrying in ${RETRY_MILLIS / 1000} seconds...`);
      setTimeout(() => this.all({ months, year, recos }), RETRY_MILLIS);
      return false;
    }
  }


  SyncPromotionReports({ months, year, recos }: { months: string[], year: number, recos: string[] }): Observable<boolean> {
    return this.api.GetPromotionReports({ months, year, recos, sync: true }).pipe(
      switchMap(async (res$: { status: number, data: PromotionReport[] }) => {
        if (res$.status !== 200) {
          console.error('❌ Error while syncing PromotionReport.');
          console.log(`🔄 Retrying in ${RETRY_MILLIS / 1000} seconds...`);
          setTimeout(() => this.SyncPromotionReports({ months, year, recos }).subscribe(), RETRY_MILLIS);
          return false;
        }
        if (res$.data.length > 0) {
          await this.indexdb.saveMany<PromotionReport>({ dbName: 'promotion_reports', datas: res$.data, callback: () => this.SyncPromotionReports({ months, year, recos }).subscribe() });
        }
        return true;
      }),
      catchError((err: any) => {
        console.error('❌ Error while syncing PromotionReport:', err);
        console.log(`🔄 Retrying in ${RETRY_MILLIS / 1000} seconds...`);
        setTimeout(() => this.SyncPromotionReports({ months, year, recos }).subscribe(), RETRY_MILLIS);
        return of(false);
      })
    );
  }



  SyncFamilyPlanningReports({ months, year, recos }: { months: string[], year: number, recos: string[] }): Observable<boolean> {
    return this.api.GetFamilyPlanningReports({ months, year, recos, sync: true }).pipe(
      switchMap(async (res$: { status: number, data: FamilyPlanningReport[] }) => {
        if (res$.status !== 200) {
          console.error('❌ Error while syncing FamilyPlanningReport:');
          console.log(`🔄 Retrying in ${RETRY_MILLIS / 1000} seconds...`);
          setTimeout(() => this.SyncFamilyPlanningReports({ months, year, recos }), RETRY_MILLIS);
          return false;
        }
        if (res$.data.length > 0) {
          await this.indexdb.saveMany<FamilyPlanningReport>({ dbName: 'family_planning_reports', datas: res$.data, callback: () => this.SyncFamilyPlanningReports({ months, year, recos }).subscribe() });
        }
        return true;
      }),
      catchError((err: any) => {
        console.error('❌ Error while syncing FamilyPlanningReport:', err);
        console.log(`🔄 Retrying in ${RETRY_MILLIS / 1000} seconds...`);
        setTimeout(() => this.SyncFamilyPlanningReports({ months, year, recos }), RETRY_MILLIS);
        return of(false);
      })
    );
  }

  SyncMorbidityReports({ months, year, recos }: { months: string[], year: number, recos: string[] }): Observable<boolean> {
    return this.api.GetMorbidityReports({ months, year, recos, sync: true }).pipe(
      switchMap(async (res$: { status: number, data: MorbidityReport[] }) => {
        if (res$.status !== 200) {
          console.error('❌ Error while syncing MorbidityReport:');
          console.log(`🔄 Retrying in ${RETRY_MILLIS / 1000} seconds...`);
          setTimeout(() => this.SyncMorbidityReports({ months, year, recos }), RETRY_MILLIS);
          return false;
        }
        if (res$.data.length > 0) {
          await this.indexdb.saveMany<MorbidityReport>({ dbName: 'morbidity_reports', datas: res$.data, callback: () => this.SyncMorbidityReports({ months, year, recos }).subscribe() });
        }
        return true;
      }),
      catchError((err: any) => {
        console.error('❌ Error while syncing HealthProblemsMorbidityReport:', err);
        console.log(`🔄 Retrying in ${RETRY_MILLIS / 1000} seconds...`);
        setTimeout(() => this.SyncMorbidityReports({ months, year, recos }), RETRY_MILLIS);
        return of(false);
      })
    );
  }

  SyncHouseholdRecapReports({ months, year, recos }: { months: string[], year: number, recos: string[] }): Observable<boolean> {
    return this.api.GetHouseholdRecapReports({ months, year, recos, sync: true }).pipe(
      switchMap(async (res$: { status: number, data: HouseholdRecapReport[] }) => {
        if (res$.status !== 200) {
          console.error('❌ Error while syncing HouseholdRecapReport:');
          console.log(`🔄 Retrying in ${RETRY_MILLIS / 1000} seconds...`);
          setTimeout(() => this.SyncHouseholdRecapReports({ months, year, recos }), RETRY_MILLIS);
          return false;
        }
        if (res$.data.length > 0) {
          await this.indexdb.saveMany<HouseholdRecapReport>({ dbName: 'household_recaps_reports', datas: res$.data, callback: () => this.SyncHouseholdRecapReports({ months, year, recos }).subscribe() });
        }
        return true;
      }),
      catchError((err: any) => {
        console.error('❌ Error while syncing HouseholdRecapReport:', err);
        console.log(`🔄 Retrying in ${RETRY_MILLIS / 1000} seconds...`);
        setTimeout(() => this.SyncHouseholdRecapReports({ months, year, recos }), RETRY_MILLIS);
        return of(false);
      })
    );
  }

  SyncPcimneNewbornReports({ months, year, recos }: { months: string[], year: number, recos: string[] }): Observable<boolean> {
    return this.api.GetPcimneNewbornReports({ months, year, recos, sync: true }).pipe(
      switchMap(async (res$: { status: number, data: PcimneNewbornReport[] }) => {
        if (res$.status !== 200) {
          console.error('❌ Error while syncing PcimneNewbornReport:');
          console.log(`🔄 Retrying in ${RETRY_MILLIS / 1000} seconds...`);
          setTimeout(() => this.SyncPcimneNewbornReports({ months, year, recos }), RETRY_MILLIS);
          return false;
        }
        if (res$.data.length > 0) {
          await this.indexdb.saveMany<PcimneNewbornReport>({ dbName: 'pcime_newborn_reports', datas: res$.data, callback: () => this.SyncPcimneNewbornReports({ months, year, recos }).subscribe() });
        }
        return true;
      }),
      catchError((err: any) => {
        console.error('❌ Error while syncing PcimneNewbornReport:', err);
        console.log(`🔄 Retrying in ${RETRY_MILLIS / 1000} seconds...`);
        setTimeout(() => this.SyncPcimneNewbornReports({ months, year, recos }), RETRY_MILLIS);
        return of(false);
      })
    );
  }

  SyncChwsRecoReports({ months, year, recos }: { months: string[], year: number, recos: string[] }): Observable<boolean> {
    return this.api.GetChwsRecoReports({ months, year, recos, sync: true }).pipe(
      switchMap(async (res$: { status: number, data: ChwsRecoReport[] }) => {
        if (res$.status !== 200) {
          console.error('❌ Error while syncing ChwsRecoReport:');
          console.log(`🔄 Retrying in ${RETRY_MILLIS / 1000} seconds...`);
          setTimeout(() => this.SyncChwsRecoReports({ months, year, recos }), RETRY_MILLIS);
          return false;
        }
        if (res$.data.length > 0) {
          await this.indexdb.saveMany<ChwsRecoReport>({ dbName: 'chws_reco_reports', datas: res$.data, callback: () => this.SyncChwsRecoReports({ months, year, recos }).subscribe() });
        }
        return true;
      }),
      catchError((err: any) => {
        console.error('❌ Error while syncing ChwsRecoReport:', err);
        console.log(`🔄 Retrying in ${RETRY_MILLIS / 1000} seconds...`);
        setTimeout(() => this.SyncChwsRecoReports({ months, year, recos }), RETRY_MILLIS);
        return of(false);
      })
    );
  }

  SyncRecoMegSituationReports({ months, year, recos }: { months: string[], year: number, recos: string[] }): Observable<boolean> {
    return this.api.GetRecoMegSituationReports({ months, year, recos, sync: true }).pipe(
      switchMap(async (res$: { status: number, data: RecoMegSituationReport[] }) => {
        if (res$.status !== 200) {
          console.error('❌ Error while syncing RecoMegSituationReports:');
          console.log(`🔄 Retrying in ${RETRY_MILLIS / 1000} seconds...`);
          setTimeout(() => this.SyncRecoMegSituationReports({ months, year, recos }), RETRY_MILLIS);
          return false;
        }
        if (res$.data.length > 0) {
          await this.indexdb.saveMany<RecoMegSituationReport>({ dbName: 'reco_meg_situation_reports', datas: res$.data, callback: () => this.SyncRecoMegSituationReports({ months, year, recos }).subscribe() });
        }
        return true;
      }),
      catchError((err: any) => {
        console.error('❌ Error while syncing RecoMegSituationReports:', err);
        console.log(`🔄 Retrying in ${RETRY_MILLIS / 1000} seconds...`);
        setTimeout(() => this.SyncRecoMegSituationReports({ months, year, recos }), RETRY_MILLIS);
        return of(false);
      })
    );
  }

  // ##################### DASHBOARDS #####################
  SyncRecoVaccinationNotDoneDashboards({ months, year, recos }: { months: string[], year: number, recos: string[] }): Observable<boolean> {
    return this.api.GetRecoVaccinationNotDoneDashboards({ months, year, recos, sync: true }).pipe(
      switchMap(async (res$: { status: number, data: RecoVaccinationDashboardDbOutput[] }) => {
        if (res$.status !== 200) {
          console.error('❌ Error while syncing RecoVaccinationNotDoneDashboards:');
          console.log(`🔄 Retrying in ${RETRY_MILLIS / 1000} seconds...`);
          setTimeout(() => this.SyncRecoVaccinationNotDoneDashboards({ months, year, recos }), RETRY_MILLIS);
          return false;
        }
        if (res$.data.length > 0) {
          await this.indexdb.saveMany<RecoVaccinationDashboardDbOutput>({ dbName: 'reco_vaccine_not_done_dashboard', datas: res$.data, callback: () => this.SyncRecoVaccinationNotDoneDashboards({ months, year, recos }) });
        }
        return true;
      }),
      catchError((err: any) => {
        console.error('❌ Error while syncing RecoVaccinationNotDoneDashboards:', err);
        console.log(`🔄 Retrying in ${RETRY_MILLIS / 1000} seconds...`);
        setTimeout(() => this.SyncRecoVaccinationNotDoneDashboards({ months, year, recos }), RETRY_MILLIS);
        return of(false);
      })
    );
  }

  SyncRecoVaccinationPartialDoneDashboards({ months, year, recos }: { months: string[], year: number, recos: string[] }): Observable<boolean> {
    return this.api.GetRecoVaccinationPartialDoneDashboards({ months, year, recos, sync: true }).pipe(
      switchMap(async (res$: { status: number, data: RecoVaccinationDashboardDbOutput[] }) => {
        if (res$.status !== 200) {
          console.error('❌ Error while syncing RecoVaccinationPartialDoneDashboards:');
          console.log(`🔄 Retrying in ${RETRY_MILLIS / 1000} seconds...`);
          setTimeout(() => this.SyncRecoVaccinationPartialDoneDashboards({ months, year, recos }), RETRY_MILLIS);
          return false;
        }
        if (res$.data.length > 0) {
          await this.indexdb.saveMany<RecoVaccinationDashboardDbOutput>({ dbName: 'reco_vaccine_partial_done_dashboard', datas: res$.data, callback: () => this.SyncRecoVaccinationPartialDoneDashboards({ months, year, recos }) });
        }
        return true;
      }),
      catchError((err: any) => {
        console.error('❌ Error while syncing RecoVaccinationPartialDoneDashboards:', err);
        console.log(`🔄 Retrying in ${RETRY_MILLIS / 1000} seconds...`);
        setTimeout(() => this.SyncRecoVaccinationPartialDoneDashboards({ months, year, recos }), RETRY_MILLIS);
        return of(false);
      })
    );
  }

  SyncRecoVaccinationAllDoneDashboards({ months, year, recos }: { months: string[], year: number, recos: string[] }): Observable<boolean> {
    return this.api.GetRecoVaccinationAllDoneDashboards({ months, year, recos, sync: true }).pipe(
      switchMap(async (res$: { status: number, data: RecoVaccinationDashboardDbOutput[] }) => {
        if (res$.status !== 200) {
          console.error('❌ Error while syncing RecoVaccinationAllDoneDashboards:');
          console.log(`🔄 Retrying in ${RETRY_MILLIS / 1000} seconds...`);
          setTimeout(() => this.SyncRecoVaccinationAllDoneDashboards({ months, year, recos }), RETRY_MILLIS);
          return false;
        }
        if (res$.data.length > 0) {
          await this.indexdb.saveMany<RecoVaccinationDashboardDbOutput>({ dbName: 'reco_vaccine_all_done_dashboard', datas: res$.data, callback: () => this.SyncRecoVaccinationAllDoneDashboards({ months, year, recos }) });
        }
        return true;
      }),
      catchError((err: any) => {
        console.error('❌ Error while syncing RecoVaccinationAllDoneDashboards:', err);
        console.log(`🔄 Retrying in ${RETRY_MILLIS / 1000} seconds...`);
        setTimeout(() => this.SyncRecoVaccinationAllDoneDashboards({ months, year, recos }), RETRY_MILLIS);
        return of(false);
      })
    );
  }



  SyncRecoPerformanceDashboards({ months, year, recos }: { months: string[], year: number, recos: string[] }): Observable<boolean> {
    return this.api.GetRecoPerformanceDashboards({ months, year, recos, sync: true }).pipe(
      switchMap(async (res$: { status: number, data: RecoPerformanceDashboard[], yearData: RecoPerformanceDashboardFullYearDbOutput[] }) => {
        if (res$.status !== 200) {
          console.error('❌ Error while syncing RecoPerformanceDashboard:');
          console.log(`🔄 Retrying in ${RETRY_MILLIS / 1000} seconds...`);
          setTimeout(() => this.SyncRecoPerformanceDashboards({ months, year, recos }), RETRY_MILLIS);
          return false;
        }
        if (res$.data && res$.data.length > 0) {
          await this.indexdb.saveMany<RecoPerformanceDashboard>({ dbName: 'reco_performance_dashboard', datas: res$.data, callback: () => this.SyncRecoPerformanceDashboards({ months, year, recos }) });
        }
        if (res$.data && res$.yearData.length > 0) {
          await this.indexdb.saveMany<RecoPerformanceDashboardFullYearDbOutput>({ dbName: 'reco_full_year_performance_dashboard', datas: res$.yearData, callback: () => this.SyncRecoPerformanceDashboards({ months, year, recos }) });
        }
        return true;
      }),
      catchError((err: any) => {
        console.error('❌ Error while syncing RecoPerformanceDashboard:', err);
        console.log(`🔄 Retrying in ${RETRY_MILLIS / 1000} seconds...`);
        setTimeout(() => this.SyncRecoPerformanceDashboards({ months, year, recos }), RETRY_MILLIS);
        return of(false);
      })
    );
  }

  // SyncRecoChartPerformanceDashboards({ year, recos }: { year: number, recos: string[] }): Observable<boolean> {
  //   return this.api.GetRecoChartPerformanceDashboards({ year, recos, sync: true }).pipe(
  //     switchMap(async (res$: { status: number, data: RecoChartPerformanceDashboard[] }) => {
  //       if (res$.status !== 200) {
  //         console.error('❌ Error while syncing RecoChartPerformanceDashboard:');
  //         console.log(`🔄 Retrying in ${RETRY_MILLIS / 1000} seconds...`);
  //         setTimeout(() => this.SyncRecoChartPerformanceDashboards({ year, recos }), RETRY_MILLIS);
  //         return false;
  //       }
  //       if (res$.data.length > 0) {
  //         await this.indexdb.saveMany<RecoChartPerformanceDashboard>({ dbName: 'reco_chart_performance_dashboard', datas: res$.data, callback: () => this.SyncRecoChartPerformanceDashboards({ year, recos }) });
  //       }
  //       return true;
  //     }),
  //     catchError((err: any) => {
  //       console.error('❌ Error while syncing RecoChartPerformanceDashboard:', err);
  //       console.log(`🔄 Retrying in ${RETRY_MILLIS / 1000} seconds...`);
  //       setTimeout(() => this.SyncRecoChartPerformanceDashboards({ year, recos }), RETRY_MILLIS);
  //       return of(false);
  //     })
  //   );
  // }


  SyncActiveRecoDashboards({ year, recos }: { year: number, recos: string[] }): Observable<boolean> {
    return this.api.GetActiveRecoDashboards({ year, recos, sync: true }).pipe(
      switchMap(async (res$: { status: number, data: ActiveRecoDashboard[] }) => {
        if (res$.status !== 200) {
          console.error('❌ Error while syncing ActiveRecoDashboards:');
          console.log(`🔄 Retrying in ${RETRY_MILLIS / 1000} seconds...`);
          setTimeout(() => this.SyncActiveRecoDashboards({ year, recos }), RETRY_MILLIS);
          return false;
        }
        if (res$.data.length > 0) {
          await this.indexdb.saveMany<ActiveRecoDashboard>({ dbName: 'active_reco_dashboard', datas: res$.data, callback: () => this.SyncActiveRecoDashboards({ year, recos }) });
        }
        return true;
      }),
      catchError((err: any) => {
        console.error('❌ Error while syncing ActiveRecoDashboards:', err);
        console.log(`🔄 Retrying in ${RETRY_MILLIS / 1000} seconds...`);
        setTimeout(() => this.SyncActiveRecoDashboards({ year, recos }), RETRY_MILLIS);
        return of(false);
      })
    );
  }

  SyncRecoTasksStateDashboards({ start_date, end_date, recos }: { start_date: string, end_date: string, recos: string[] }): Observable<boolean> {
    return this.api.GetRecoTasksStateDashboards({ start_date, end_date, recos, sync: true }).pipe(
      switchMap(async (res$: { status: number, data: RecoTasksStateDashboard[] }) => {
        if (res$.status !== 200) {
          console.error('❌ Error while syncing RecoTasksStateDashboards:');
          console.log(`🔄 Retrying in ${RETRY_MILLIS / 1000} seconds...`);
          setTimeout(() => this.SyncRecoTasksStateDashboards({ start_date, end_date, recos }), RETRY_MILLIS);
          return false;
        }
        if (res$.data.length > 0) {
          await this.indexdb.saveMany<RecoTasksStateDashboard>({ dbName: 'reco_tasks_state_dashboard', datas: res$.data, callback: () => this.SyncRecoTasksStateDashboards({ start_date, end_date, recos }) });
        }
        return true;
      }),
      catchError((err: any) => {
        console.error('❌ Error while syncing RecoTasksStateDashboards:', err);
        console.log(`🔄 Retrying in ${RETRY_MILLIS / 1000} seconds...`);
        setTimeout(() => this.SyncRecoTasksStateDashboards({ start_date, end_date, recos }), RETRY_MILLIS);
        return of(false);
      })
    );
  }


  // ##################### MAPS #####################
  SyncRecoDataMaps({ months, year, recos }: { months: string[], year: number, recos: string[] }): Observable<boolean> {
    return this.api.GetRecoDataMaps({ months, year, recos, sync: true }).pipe(
      switchMap(async (res$: { status: number, data: RecoDataMapsDbOutput[] }) => {
        if (res$.status !== 200) {
          console.error('❌ Error while syncing RecoDataMaps:');
          console.log(`🔄 Retrying in ${RETRY_MILLIS / 1000} seconds...`);
          setTimeout(() => this.SyncRecoDataMaps({ months, year, recos }), RETRY_MILLIS);
          return false;
        }
        if (res$.data.length > 0) {
          await this.indexdb.saveMany<RecoDataMapsDbOutput>({ dbName: 'reco_data_maps', datas: res$.data, callback: () => this.SyncRecoDataMaps({ months, year, recos }) });
        }
        return true;
      }),
      catchError((err: any) => {
        console.error('❌ Error while syncing RecoDataMaps:', err);
        console.log(`🔄 Retrying in ${RETRY_MILLIS / 1000} seconds...`);
        setTimeout(() => this.SyncRecoDataMaps({ months, year, recos }), RETRY_MILLIS);
        return of(false);
      })
    );
  }

}
