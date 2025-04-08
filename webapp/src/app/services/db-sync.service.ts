import { Injectable } from '@angular/core';
// import axios from 'axios';
import { RETRY_MILLIS } from '../shared/functions';
import { FamilyPlanningReport, HouseholdRecapReport, ChwsRecoReport, MorbidityReport, PromotionReport, PcimneNewbornReport, RecoMegSituationReport } from '@kossi-models/reports';
import { IndexedDbService } from './indexed-db.service';
import { ApiService } from './api.service';
import { Observable, catchError, map, of, switchMap } from 'rxjs';
import { RecoChartPerformanceDashboard, RecoPerformanceDashboard, RecoVaccinationDashboard, RecoVaccinationDashboardDbOutput } from '@kossi-models/dashboards';

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
      const d7 = await this.SyncRecoVaccinationDashboards({ months, year, recos }).toPromise();
      const d8 = await this.SyncRecoPerformanceDashboards({ months, year, recos }).toPromise();
      // const d9 = await this.SyncRecoChartPerformanceDashboards({ year, recos }).toPromise();
      const d9 = true;
      const d10 = await this.SyncRecoMegSituationReports({ months, year, recos }).toPromise();


      console.info('Successfully synced to local!');

      return d1 === true && d2 === true && d3 === true && d4 === true && d5 === true && d6 === true && d7 === true && d8 === true && d9 === true && d10 === true;
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
  SyncRecoVaccinationDashboards({ months, year, recos }: { months: string[], year: number, recos: string[] }): Observable<boolean> {
    return this.api.GetRecoVaccinationDashboards({ months, year, recos, sync: true }).pipe(
      switchMap(async (res$: { status: number, data: RecoVaccinationDashboardDbOutput[] }) => {
        if (res$.status !== 200) {
          console.error('❌ Error while syncing RecoVaccinationDashboard:');
          console.log(`🔄 Retrying in ${RETRY_MILLIS / 1000} seconds...`);
          setTimeout(() => this.SyncRecoVaccinationDashboards({ months, year, recos }), RETRY_MILLIS);
          return false;
        }
        if (res$.data.length > 0) {
          await this.indexdb.saveMany<RecoVaccinationDashboardDbOutput>({ dbName: 'reco_vaccination_dashboard', datas: res$.data, callback: () => this.SyncRecoVaccinationDashboards({ months, year, recos }) });
        }
        return true;
      }),
      catchError((err: any) => {
        console.error('❌ Error while syncing RecoVaccinationDashboard:', err);
        console.log(`🔄 Retrying in ${RETRY_MILLIS / 1000} seconds...`);
        setTimeout(() => this.SyncRecoVaccinationDashboards({ months, year, recos }), RETRY_MILLIS);
        return of(false);
      })
    );
  }

  SyncRecoPerformanceDashboards({ months, year, recos }: { months: string[], year: number, recos: string[] }): Observable<boolean> {
    return this.api.GetRecoPerformanceDashboards({ months, year, recos, sync: true }).pipe(
      switchMap(async (res$: { status: number, data: RecoPerformanceDashboard[], chart: RecoChartPerformanceDashboard[] }) => {
        if (res$.status !== 200) {
          console.error('❌ Error while syncing RecoPerformanceDashboard:');
          console.log(`🔄 Retrying in ${RETRY_MILLIS / 1000} seconds...`);
          setTimeout(() => this.SyncRecoPerformanceDashboards({ months, year, recos }), RETRY_MILLIS);
          return false;
        }
        if (res$.data.length > 0) {
          await this.indexdb.saveMany<RecoPerformanceDashboard>({ dbName: 'reco_performance_dashboard', datas: res$.data, callback: () => this.SyncRecoPerformanceDashboards({ months, year, recos }) });
        }
        if (res$.data.length > 0) {
          await this.indexdb.saveMany<RecoChartPerformanceDashboard>({ dbName: 'reco_chart_performance_dashboard', datas: res$.data, callback: () => this.SyncRecoPerformanceDashboards({ months, year, recos }) });
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
}
