import { Injectable } from '@angular/core';
// import axios from 'axios';
import { RETRY_MILLIS } from '../utils/functions';
import { FamilyPlanningReport, HouseholdRecapReport, ChwsRecoReport, MorbidityReport, PromotionReport, PcimneNewbornReport } from '@kossi-models/reports';
import { IndexedDbService } from './indexed-db.service';
import { ApiService } from './api.service';
import { DBUtils } from '@kossi-models/db';
import { Observable, catchError, map, of } from 'rxjs';
import { RecoChartPerformanceDashboard, RecoMegDashboard, RecoPerformanceDashboard, RecoVaccinationDashboard } from '@kossi-models/dashboards';

@Injectable({
  providedIn: 'root'
})
export class DbSyncService {
  private readonly keyPath: string = 'id';

  constructor(private indexdb: IndexedDbService, private api: ApiService) {
  }

  async all({ months, year, recos }: { months: string[], year: number, recos: string[] }): Promise<boolean> {
    console.info('Initiating changes service');
    try {
      const d1 = await this.SyncChwsRecoReports({ months, year, recos }).toPromise();
      const d2 = await this.SyncPromotionReports({ months, year, recos }).toPromise();
      const d3 = await this.SyncFamilyPlanningReports({ months, year, recos }).toPromise();
      const d4 = await this.SyncMorbidityReports({ months, year, recos }).toPromise();
      const d5 = await this.SyncHouseholdRecapReports({ months, year, recos }).toPromise();
      const d6 = await this.SyncPcimneNewbornReports({ months, year, recos }).toPromise();
      const d7 = await this.SyncRecoMegDashboards({ months, year, recos }).toPromise();
      const d8 = await this.SyncRecoVaccinationDashboards({ months, year, recos }).toPromise();
      const d9 = await this.SyncRecoPerformanceDashboards({ months, year, recos }).toPromise();
      const d10 = await this.SyncRecoChartPerformanceDashboards({ year, recos }).toPromise();
      return d1 === true && d2 === true && d3 === true && d4 === true && d5 === true && d6 === true && d7 === true && d8 === true && d9 === true && d10 === true;
    } catch (err) {
      console.error('Error initialising watching for db changes (changes.service.ts: 108)', err);
      console.log('Attempting changes initialisation in ' + (RETRY_MILLIS / 1000) + ' seconds');
      setTimeout(() => this.all({ months, year, recos }), RETRY_MILLIS);
      return false;
    }
  }

  async saveToLocalStorage<T>({ dbName, data, callback }: { dbName: DBUtils['dbName'], data: T[], callback?: () => void }): Promise<boolean> {
    var len: number = data.length;
    try {
      for (let i = 0; i < data.length; i++) {
        const dt = data[i];
        const res = await this.indexdb.updateData<T>({ dbName: dbName, keyPath: this.keyPath, newData: dt }).then((val) => { return val }).catch((err) => { return false; });
        if (res) {
          len -= 1;
        } else {
          len += 1;
        }
      }
    } catch (error) {
      len = data.length;
    }
    return len == 0;
  }

  SyncPromotionReports({ months, year, recos }: { months: string[], year: number, recos: string[] }): Observable<boolean> {
    return this.api.GetPromotionReports({ months, year, recos }).pipe(
      map((res$: { status: number, data: PromotionReport[] }) => {
        if (res$.status !== 200) {
          console.error('Error while syncing PromotionReport:');
          console.log('Attempting changes initialization in ' + (RETRY_MILLIS / 1000) + ' seconds');
          setTimeout(() => this.SyncPromotionReports({ months, year, recos }), RETRY_MILLIS);
          return false;
        }
        this.saveToLocalStorage<PromotionReport>({ dbName: 'promotion_reports', data: res$.data, callback: () => this.SyncPromotionReports({ months, year, recos }) });
        return true;
      }),
      catchError((err: any) => {
        console.error('Error while syncing PromotionReport:', err);
        console.log('Attempting changes initialisation in ' + (RETRY_MILLIS / 1000) + ' seconds');
        setTimeout(() => this.SyncPromotionReports({ months, year, recos }), RETRY_MILLIS);
        return of(false);
      })
    );
  }

  SyncFamilyPlanningReports({ months, year, recos }: { months: string[], year: number, recos: string[] }): Observable<boolean> {
    return this.api.GetFamilyPlanningReports({ months, year, recos }).pipe(
      map((res$: { status: number, data: FamilyPlanningReport[] }) => {
        if (res$.status !== 200) {
          console.error('Error while syncing FamilyPlanningReport:');
          console.log('Attempting changes initialization in ' + (RETRY_MILLIS / 1000) + ' seconds');
          setTimeout(() => this.SyncFamilyPlanningReports({ months, year, recos }), RETRY_MILLIS);
          return false;
        }
        this.saveToLocalStorage<FamilyPlanningReport>({ dbName: 'family_planning_reports', data: res$.data, callback: () => this.SyncFamilyPlanningReports({ months, year, recos }) });
        return true;
      }),
      catchError((err: any) => {
        console.error('Error while syncing FamilyPlanningReport:', err);
        console.log('Attempting changes initialisation in ' + (RETRY_MILLIS / 1000) + ' seconds');
        setTimeout(() => this.SyncFamilyPlanningReports({ months, year, recos }), RETRY_MILLIS);
        return of(false);
      })
    );
  }

  SyncMorbidityReports({ months, year, recos }: { months: string[], year: number, recos: string[] }): Observable<boolean> {
    return this.api.GetMorbidityReports({ months, year, recos }).pipe(
      map((res$: { status: number, data: MorbidityReport[] }) => {
        if (res$.status !== 200) {
          console.error('Error while syncing MorbidityReport:');
          console.log('Attempting changes initialization in ' + (RETRY_MILLIS / 1000) + ' seconds');
          setTimeout(() => this.SyncMorbidityReports({ months, year, recos }), RETRY_MILLIS);
          return false;
        }
        this.saveToLocalStorage<MorbidityReport>({ dbName: 'morbidity_reports', data: res$.data, callback: () => this.SyncMorbidityReports({ months, year, recos }) });
        return true;
      }),
      catchError((err: any) => {
        console.error('Error while syncing HealthProblemsMorbidityReport:', err);
        console.log('Attempting changes initialisation in ' + (RETRY_MILLIS / 1000) + ' seconds');
        setTimeout(() => this.SyncMorbidityReports({ months, year, recos }), RETRY_MILLIS);
        return of(false);
      })
    );
  }

  SyncHouseholdRecapReports({ months, year, recos }: { months: string[], year: number, recos: string[] }): Observable<boolean> {
    return this.api.GetHouseholdRecapReports({ months, year, recos }).pipe(
      map((res$: { status: number, data: HouseholdRecapReport[] }) => {
        if (res$.status !== 200) {
          console.error('Error while syncing HouseholdRecapReport:');
          console.log('Attempting changes initialization in ' + (RETRY_MILLIS / 1000) + ' seconds');
          setTimeout(() => this.SyncHouseholdRecapReports({ months, year, recos }), RETRY_MILLIS);
          return false;
        }
        this.saveToLocalStorage<HouseholdRecapReport>({ dbName: 'household_recaps_reports', data: res$.data, callback: () => this.SyncHouseholdRecapReports({ months, year, recos }) });
        return true;
      }),
      catchError((err: any) => {
        console.error('Error while syncing HouseholdRecapReport:', err);
        console.log('Attempting changes initialisation in ' + (RETRY_MILLIS / 1000) + ' seconds');
        setTimeout(() => this.SyncHouseholdRecapReports({ months, year, recos }), RETRY_MILLIS);
        return of(false);
      })
    );
  }

  SyncPcimneNewbornReports({ months, year, recos }: { months: string[], year: number, recos: string[] }): Observable<boolean> {
    return this.api.GetPcimneNewbornReports({ months, year, recos }).pipe(
      map((res$: { status: number, data: PcimneNewbornReport[] }) => {
        if (res$.status !== 200) {
          console.error('Error while syncing PcimneNewbornReport:');
          console.log('Attempting changes initialization in ' + (RETRY_MILLIS / 1000) + ' seconds');
          setTimeout(() => this.SyncPcimneNewbornReports({ months, year, recos }), RETRY_MILLIS);
          return false;
        }
        this.saveToLocalStorage<PcimneNewbornReport>({ dbName: 'pcime_newborn_reports', data: res$.data, callback: () => this.SyncPcimneNewbornReports({ months, year, recos }) });
        return true;
      }),
      catchError((err: any) => {
        console.error('Error while syncing PcimneNewbornReport:', err);
        console.log('Attempting changes initialisation in ' + (RETRY_MILLIS / 1000) + ' seconds');
        setTimeout(() => this.SyncPcimneNewbornReports({ months, year, recos }), RETRY_MILLIS);
        return of(false);
      })
    );
  }

  SyncChwsRecoReports({ months, year, recos }: { months: string[], year: number, recos: string[] }): Observable<boolean> {
    return this.api.GetChwsRecoReports({ months, year, recos }).pipe(
      map((res$: { status: number, data: ChwsRecoReport[] }) => {
        if (res$.status !== 200) {
          console.error('Error while syncing ChwsRecoReport:');
          console.log('Attempting changes initialization in ' + (RETRY_MILLIS / 1000) + ' seconds');
          setTimeout(() => this.SyncChwsRecoReports({ months, year, recos }), RETRY_MILLIS);
          return false;
        }
        this.saveToLocalStorage<ChwsRecoReport>({ dbName: 'chws_reco_reports', data: res$.data, callback: () => this.SyncChwsRecoReports({ months, year, recos }) });
        return true;
      }),
      catchError((err: any) => {
        console.error('Error while syncing ChwsRecoReport:', err);
        console.log('Attempting changes initialization in ' + (RETRY_MILLIS / 1000) + ' seconds');
        setTimeout(() => this.SyncChwsRecoReports({ months, year, recos }), RETRY_MILLIS);
        return of(false);
      })
    );
  }


  // ##################### DASHBOARDS #####################

  SyncRecoMegDashboards({ months, year, recos }: { months: string[], year: number, recos: string[] }): Observable<boolean> {
    return this.api.GetRecoMegDashboards({ months, year, recos }).pipe(
      map((res$: { status: number, data: RecoMegDashboard[] }) => {
        if (res$.status !== 200) {
          console.error('Error while syncing RecoMegDashboard:');
          console.log('Attempting changes initialization in ' + (RETRY_MILLIS / 1000) + ' seconds');
          setTimeout(() => this.SyncRecoMegDashboards({ months, year, recos }), RETRY_MILLIS);
          return false;
        }
        this.saveToLocalStorage<RecoMegDashboard>({ dbName: 'reco_meg_dashboard', data: res$.data, callback: () => this.SyncRecoMegDashboards({ months, year, recos }) });
        return true;
      }),
      catchError((err: any) => {
        console.error('Error while syncing RecoMegDashboard:', err);
        console.log('Attempting changes initialization in ' + (RETRY_MILLIS / 1000) + ' seconds');
        setTimeout(() => this.SyncRecoMegDashboards({ months, year, recos }), RETRY_MILLIS);
        return of(false);
      })
    );
  }

  SyncRecoVaccinationDashboards({ months, year, recos }: { months: string[], year: number, recos: string[] }): Observable<boolean> {
    return this.api.GetRecoVaccinationDashboards({ months, year, recos }).pipe(
      map((res$: { status: number, data: RecoVaccinationDashboard[] }) => {
        if (res$.status !== 200) {
          console.error('Error while syncing RecoVaccinationDashboard:');
          console.log('Attempting changes initialization in ' + (RETRY_MILLIS / 1000) + ' seconds');
          setTimeout(() => this.SyncRecoVaccinationDashboards({ months, year, recos }), RETRY_MILLIS);
          return false;
        }
        this.saveToLocalStorage<RecoVaccinationDashboard>({ dbName: 'reco_vaccination_dashboard', data: res$.data, callback: () => this.SyncRecoVaccinationDashboards({ months, year, recos }) });
        return true;
      }),
      catchError((err: any) => {
        console.error('Error while syncing RecoVaccinationDashboard:', err);
        console.log('Attempting changes initialization in ' + (RETRY_MILLIS / 1000) + ' seconds');
        setTimeout(() => this.SyncRecoVaccinationDashboards({ months, year, recos }), RETRY_MILLIS);
        return of(false);
      })
    );
  }

  SyncRecoPerformanceDashboards({ months, year, recos }: { months: string[], year: number, recos: string[] }): Observable<boolean> {
    return this.api.GetRecoPerformanceDashboards({ months, year, recos }).pipe(
      map((res$: { status: number, data: RecoPerformanceDashboard[] }) => {
        if (res$.status !== 200) {
          console.error('Error while syncing RecoPerformanceDashboard:');
          console.log('Attempting changes initialization in ' + (RETRY_MILLIS / 1000) + ' seconds');
          setTimeout(() => this.SyncRecoPerformanceDashboards({ months, year, recos }), RETRY_MILLIS);
          return false;
        }
        this.saveToLocalStorage<RecoPerformanceDashboard>({ dbName: 'reco_performance_dashboard', data: res$.data, callback: () => this.SyncRecoPerformanceDashboards({ months, year, recos }) });
        return true;
      }),
      catchError((err: any) => {
        console.error('Error while syncing RecoPerformanceDashboard:', err);
        console.log('Attempting changes initialization in ' + (RETRY_MILLIS / 1000) + ' seconds');
        setTimeout(() => this.SyncRecoPerformanceDashboards({ months, year, recos }), RETRY_MILLIS);
        return of(false);
      })
    );
  }

  SyncRecoChartPerformanceDashboards({ year, recos }: { year: number, recos: string[] }): Observable<boolean> {
    return this.api.GetRecoChartPerformanceDashboards({ year, recos }).pipe(
      map((res$: { status: number, data: RecoChartPerformanceDashboard[] }) => {
        if (res$.status !== 200) {
          console.error('Error while syncing RecoChartPerformanceDashboard:');
          console.log('Attempting changes initialization in ' + (RETRY_MILLIS / 1000) + ' seconds');
          setTimeout(() => this.SyncRecoChartPerformanceDashboards({ year, recos }), RETRY_MILLIS);
          return false;
        }
        this.saveToLocalStorage<RecoChartPerformanceDashboard>({ dbName: 'reco_chart_performance_dashboard', data: res$.data, callback: () => this.SyncRecoChartPerformanceDashboards({ year, recos }) });
        return true;
      }),
      catchError((err: any) => {
        console.error('Error while syncing RecoChartPerformanceDashboard:', err);
        console.log('Attempting changes initialization in ' + (RETRY_MILLIS / 1000) + ' seconds');
        setTimeout(() => this.SyncRecoChartPerformanceDashboards({ year, recos }), RETRY_MILLIS);
        return of(false);
      })
    );
  }


}
