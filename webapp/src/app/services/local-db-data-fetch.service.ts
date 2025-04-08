import { Injectable } from '@angular/core';
// import axios from 'axios';
import { ChwsRecoReport, FamilyPlanningReport, HouseholdRecapReport, MorbidityReport, PcimneNewbornReport, PcimneNewbornReportUtils, PromotionReport, RecoMegQuantityUtils, RecoMegSituationReport } from '@kossi-models/reports';
import { IndexedDbService } from './indexed-db.service';
import { ApiService } from './api.service';
import { RecoChartPerformanceDashboard, RecoPerformanceDashboard, RecoVaccinationDashboard, RecoVaccinationDashboardDbOutput } from '@kossi-models/dashboards';
import { notNull } from '../shared/functions';
import { UserContextService } from './user-context.service';
import { catchError, firstValueFrom, map, of } from 'rxjs';
import { IndicatorsDataOutput } from '@kossi-models/interfaces';
import { FunctionsService } from './functions.service';
import { DbSyncService } from './db-sync.service';


@Injectable({
  providedIn: 'root'
})
export class LocalDbDataFetchService {
  private readonly keyPath: string = 'id';

  constructor(private indexdb: IndexedDbService, private db: DbSyncService, private api: ApiService, private userCtx: UserContextService, private func: FunctionsService) { }

  // ############################## REPORTS ################################



  async GetPromotionReports({ months, year, recos }: { months: string[], year: number, recos: string[] }, isOnline: boolean): Promise<IndicatorsDataOutput<PromotionReport> | undefined> {
    const USER = await this.userCtx.currentUser();
    let promotionReport: PromotionReport[] | undefined;

    if (USER?.role.canUseOfflineMode === true && !isOnline) {
      promotionReport = await this.indexdb.getAll<PromotionReport>('promotion_reports', this.keyPath, (item) => {
        return months.includes(item.month) && year === parseInt(`${item.year}`) && notNull(item.reco?.id) && recos.includes(item.reco!.id);
      });
    } else {
      try {
        promotionReport = await firstValueFrom(
          this.api.GetPromotionReports({ months, year, recos }).pipe(
            map((res$: { status: number; data: PromotionReport[] }) => res$.status === 200 ? res$.data : undefined),
            catchError(() => of(undefined))
          )
        );
        if (promotionReport && promotionReport.length > 0) {
          await this.indexdb.saveMany<PromotionReport>({ dbName: 'promotion_reports', datas: promotionReport, callback: () => this.db.SyncPromotionReports({ months, year, recos }).subscribe() });

        }

      } catch (error) {
        console.error("Error fetching ChwsRecoReports:", error);
        return undefined;
      }
    }

    return await this.func.executeIndexDBStoredFunction<PromotionReport>('promotionTransformFunction', promotionReport) as IndicatorsDataOutput<PromotionReport> | undefined;

  }

  async GetFamilyPlanningReports({ months, year, recos }: { months: string[], year: number, recos: string[] }, isOnline: boolean): Promise<IndicatorsDataOutput<FamilyPlanningReport> | undefined> {
    const USER = await this.userCtx.currentUser();
    let familyPlanningReport: FamilyPlanningReport[] | undefined;

    if (USER?.role.canUseOfflineMode === true && !isOnline) {
      familyPlanningReport = await this.indexdb.getAll<FamilyPlanningReport>('family_planning_reports', this.keyPath, (item) => {
        return months.includes(item.month) && year === parseInt(`${item.year}`) && notNull(item.reco?.id) && recos.includes(item.reco!.id);
      });
    } else {
      try {
        familyPlanningReport = await firstValueFrom(
          this.api.GetFamilyPlanningReports({ months, year, recos }).pipe(
            map((res$: { status: number; data: FamilyPlanningReport[] }) => res$.status === 200 ? res$.data : undefined),
            catchError(() => of(undefined))
          )
        );
        if (familyPlanningReport && familyPlanningReport.length > 0) {
          await this.indexdb.saveMany<FamilyPlanningReport>({ dbName: 'family_planning_reports', datas: familyPlanningReport, callback: () => this.db.SyncFamilyPlanningReports({ months, year, recos }).subscribe() });
        }
      } catch (error) {
        console.error("Error fetching ChwsRecoReports:", error);
        return undefined;
      }
    }
    return await this.func.executeIndexDBStoredFunction<FamilyPlanningReport>('familyPlanningTransformFunction', familyPlanningReport) as IndicatorsDataOutput<FamilyPlanningReport> | undefined;

  }

  async GetMorbidityReports({ months, year, recos }: { months: string[], year: number, recos: string[] }, isOnline: boolean): Promise<IndicatorsDataOutput<MorbidityReport> | undefined> {
    const USER = await this.userCtx.currentUser();
    let morbidityReport: MorbidityReport[] | undefined;

    if (USER?.role.canUseOfflineMode === true && !isOnline) {
      morbidityReport = await this.indexdb.getAll<MorbidityReport>('morbidity_reports', this.keyPath, (item) => {
        return months.includes(item.month) && year === parseInt(`${item.year}`) && notNull(item.reco?.id) && recos.includes(item.reco!.id);
      });
    } else {
      try {
        morbidityReport = await firstValueFrom(
          this.api.GetMorbidityReports({ months, year, recos }).pipe(
            map((res$: { status: number; data: MorbidityReport[] }) => res$.status === 200 ? res$.data : undefined),
            catchError(() => of(undefined))
          )
        );
        if (morbidityReport && morbidityReport.length > 0) {
          await this.indexdb.saveMany<MorbidityReport>({ dbName: 'morbidity_reports', datas: morbidityReport, callback: () => this.db.SyncMorbidityReports({ months, year, recos }).subscribe() });
        }
      } catch (error) {
        console.error("Error fetching ChwsRecoReports:", error);
        return undefined;
      }
    }
    return await this.func.executeIndexDBStoredFunction<MorbidityReport>('morbidityTransformFunction', morbidityReport) as IndicatorsDataOutput<MorbidityReport> | undefined;
  }

  async GetHouseholdRecapReports({ months, year, recos }: { months: string[], year: number, recos: string[] }, isOnline: boolean): Promise<IndicatorsDataOutput<HouseholdRecapReport[]> | undefined> {
    const USER = await this.userCtx.currentUser();
    let householdRecapReport: HouseholdRecapReport[] | undefined;

    if (USER?.role.canUseOfflineMode === true && !isOnline) {
      householdRecapReport = await this.indexdb.getAll<HouseholdRecapReport>('household_recaps_reports', this.keyPath, (item) => {
        return months.includes(item.month) && year === parseInt(`${item.year}`) && notNull(item.reco?.id) && recos.includes(item.reco!.id);
      });
    } else {
      try {
        householdRecapReport = await firstValueFrom(
          this.api.GetHouseholdRecapReports({ months, year, recos }).pipe(
            map((res$: { status: number; data: HouseholdRecapReport[] }) => res$.status === 200 ? res$.data : undefined),
            catchError(() => of(undefined))
          )
        );
        if (householdRecapReport && householdRecapReport.length > 0) {
          await this.indexdb.saveMany<HouseholdRecapReport>({ dbName: 'household_recaps_reports', datas: householdRecapReport, callback: () => this.db.SyncHouseholdRecapReports({ months, year, recos }).subscribe() });
        }
      } catch (error) {
        console.error("Error fetching ChwsRecoReports:", error);
        return undefined;
      }
    }
    return await this.func.executeIndexDBStoredFunction<HouseholdRecapReport>('householdTransformFunction', householdRecapReport) as IndicatorsDataOutput<HouseholdRecapReport[]> | undefined;

  }

  async GetPcimneNewbornReports({ months, year, recos }: { months: string[], year: number, recos: string[] }, isOnline: boolean): Promise<IndicatorsDataOutput<PcimneNewbornReportUtils[]> | undefined> {
    const USER = await this.userCtx.currentUser();
    let pcimneNewbornReport: PcimneNewbornReport[] | undefined;

    if (USER?.role.canUseOfflineMode === true && !isOnline) {
      pcimneNewbornReport = await this.indexdb.getAll<PcimneNewbornReport>('pcime_newborn_reports', this.keyPath, (item) => {
        return months.includes(item.month) && year === parseInt(`${item.year}`) && notNull(item.reco?.id) && recos.includes(item.reco!.id);
      });
    } else {
      try {
        pcimneNewbornReport = await firstValueFrom(
          this.api.GetPcimneNewbornReports({ months, year, recos }).pipe(
            map((res$: { status: number; data: PcimneNewbornReport[] }) => res$.status === 200 ? res$.data : undefined),
            catchError(() => of(undefined))
          )
        );
        if (pcimneNewbornReport && pcimneNewbornReport.length > 0) {
          await this.indexdb.saveMany<PcimneNewbornReport>({ dbName: 'pcime_newborn_reports', datas: pcimneNewbornReport, callback: () => this.db.SyncPcimneNewbornReports({ months, year, recos }).subscribe() });
        }
      } catch (error) {
        console.error("Error fetching ChwsRecoReports:", error);
        return undefined;
      }
    }
    return await this.func.executeIndexDBStoredFunction<PcimneNewbornReport>('pcimneNewbornTransformFunction', pcimneNewbornReport) as IndicatorsDataOutput<PcimneNewbornReportUtils[]> | undefined;

  }

  async GetChwsRecoReports({ months, year, recos }: { months: string[]; year: number; recos: string[] }, isOnline: boolean): Promise<IndicatorsDataOutput<ChwsRecoReport> | undefined> {
    const USER = await this.userCtx.currentUser();
    let chwsRecoReports: ChwsRecoReport[] | undefined;

    if (USER?.role.canUseOfflineMode === true && !isOnline) {
      chwsRecoReports = await this.indexdb.getAll<ChwsRecoReport>('chws_reco_reports', this.keyPath, (item) => {
        return months.includes(item.month) && year === parseInt(`${item.year}`) && notNull(item.reco?.id) && recos.includes(item.reco!.id);
      });
    } else {
      try {
        chwsRecoReports = await firstValueFrom(
          this.api.GetChwsRecoReports({ months, year, recos }).pipe(
            map((res$: { status: number; data: ChwsRecoReport[] }) => res$.status === 200 ? res$.data : undefined),
            catchError(() => of(undefined))
          )
        );
        if (chwsRecoReports && chwsRecoReports.length > 0) {
          await this.indexdb.saveMany<ChwsRecoReport>({ dbName: 'chws_reco_reports', datas: chwsRecoReports, callback: () => this.db.SyncChwsRecoReports({ months, year, recos }).subscribe() });
        }
      } catch (error) {
        console.error("Error fetching ChwsRecoReports:", error);
        return undefined;
      }
    }
    return await this.func.executeIndexDBStoredFunction<ChwsRecoReport>('chwsRecoTransformFunction', chwsRecoReports) as IndicatorsDataOutput<ChwsRecoReport> | undefined;
  }

  async GetRecoMegSituationReports({ months, year, recos }: { months: string[], year: number, recos: string[] }, isOnline: boolean): Promise<IndicatorsDataOutput<RecoMegQuantityUtils[]> | undefined> {
    const USER = await this.userCtx.currentUser();
    let recoMegReports: RecoMegSituationReport[] | undefined;

    if (USER?.role.canUseOfflineMode === true && !isOnline) {
      recoMegReports = await this.indexdb.getAll<RecoMegSituationReport>('reco_meg_situation_reports', this.keyPath, (item) => {
        return months.includes(item.month) && year === parseInt(`${item.year}`) && notNull(item.reco?.id) && recos.includes(item.reco!.id);
      });
    } else {
      try {
        recoMegReports = await firstValueFrom(
          this.api.GetRecoMegSituationReports({ months, year, recos }).pipe(
            map((res$: { status: number, data: RecoMegSituationReport[] }) => res$.status === 200 ? res$.data : undefined),
            catchError(() => of(undefined))
          )
        );
        if (recoMegReports && recoMegReports.length > 0) {
          await this.indexdb.saveMany<RecoMegSituationReport>({ dbName: 'reco_meg_situation_reports', datas: recoMegReports, callback: () => this.db.SyncRecoMegSituationReports({ months, year, recos }).subscribe() });
        }
      } catch (error) {
        console.error("Error fetching ChwsRecoReports:", error);
        return undefined;
      }
    }
    return await this.func.executeIndexDBStoredFunction<RecoMegSituationReport>('recoMegTransformFunction', recoMegReports) as IndicatorsDataOutput<RecoMegQuantityUtils[]> | undefined;

  }

  // ############################## DASHBOARDS ################################

  async GetRecoVaccinationDashboard({ months, year, recos }: { months: string[], year: number, recos: string[] }, isOnline: boolean): Promise<IndicatorsDataOutput<RecoVaccinationDashboard[][]> | undefined> {
    const USER = await this.userCtx.currentUser();
    let recoVaccineDashboard: RecoVaccinationDashboardDbOutput[] | undefined;

    if (USER?.role.canUseOfflineMode === true && !isOnline) {
      recoVaccineDashboard = await this.indexdb.getAll<RecoVaccinationDashboardDbOutput>('reco_vaccination_dashboard', this.keyPath, (item) => {
        return months.includes(item.month) && year === parseInt(`${item.year}`) && notNull(item.reco?.id) && recos.includes(item.reco!.id);
      });
    } else {
      try {
        recoVaccineDashboard = await firstValueFrom(
          this.api.GetRecoVaccinationDashboards({ months, year, recos }).pipe(
            map((res$: { status: number; data: RecoVaccinationDashboardDbOutput[] }) => res$.status === 200 ? res$.data : undefined),
            catchError(() => of(undefined))
          )
        );
        if (recoVaccineDashboard && recoVaccineDashboard.length > 0) {
          await this.indexdb.saveMany<RecoVaccinationDashboardDbOutput>({ dbName: 'reco_vaccination_dashboard', datas: recoVaccineDashboard, callback: () => this.db.SyncRecoVaccinationDashboards({ months, year, recos }) });
        }
      } catch (error) {
        console.error("Error fetching ChwsRecoReports:", error);
        return undefined;
      }
    }
    return await this.func.executeIndexDBStoredFunction<RecoVaccinationDashboardDbOutput>('vaccineTransformFunction', recoVaccineDashboard) as IndicatorsDataOutput<RecoVaccinationDashboard[][]> | undefined;

  }

  async GetRecoPerformanceDashboard({ months, year, recos }: { months: string[], year: number, recos: string[] }, isOnline: boolean): Promise<IndicatorsDataOutput<RecoPerformanceDashboard> | undefined> {
    const USER = await this.userCtx.currentUser();
    let recoPerfDashboard: RecoPerformanceDashboard[] | undefined;
    let recoChartPerfDashboard: RecoChartPerformanceDashboard[] = [];

    if (USER?.role.canUseOfflineMode === true && !isOnline) {
      recoPerfDashboard = await this.indexdb.getAll<RecoPerformanceDashboard>('reco_performance_dashboard', this.keyPath, (item) => {
        return months.includes(item.month) && year === parseInt(`${item.year}`) && notNull(item.reco?.id) && recos.includes(item.reco!.id);
      });
      if (recos.length === 1) {
        recoChartPerfDashboard = await this.indexdb.getAll<RecoChartPerformanceDashboard>('reco_chart_performance_dashboard', this.keyPath, (item) => {
          return year === parseInt(`${item.year}`) && notNull(item.reco?.id) && recos.includes(item.reco!.id);
        });
      }
    } else {
      try {
        const output = await firstValueFrom(
          this.api.GetRecoPerformanceDashboards({ months, year, recos }).pipe(
            map((res$: { status: number; data: RecoPerformanceDashboard[], chart: RecoChartPerformanceDashboard[] }) => res$.status === 200 ? { perf: res$.data, chart: res$.chart } : undefined),
            catchError(() => of(undefined))
          )
        );

        if (output) {
          recoPerfDashboard = output.perf;
          recoChartPerfDashboard = output.chart ?? [];

          if (recoPerfDashboard && recoPerfDashboard.length > 0) {
            await this.indexdb.saveMany<RecoPerformanceDashboard>({ dbName: 'reco_performance_dashboard', datas: recoPerfDashboard, callback: () => this.db.SyncRecoPerformanceDashboards({ months, year, recos }) });
          }
          if (recoChartPerfDashboard && recoChartPerfDashboard.length > 0) {
            await this.indexdb.saveMany<RecoChartPerformanceDashboard>({ dbName: 'reco_chart_performance_dashboard', datas: recoChartPerfDashboard, callback: () => this.db.SyncRecoPerformanceDashboards({ months, year, recos }) });
          }
        }
      } catch (error) {
        console.error("Error fetching ChwsRecoReports:", error);
        return undefined;
      }
    }
    return await this.func.executeIndexDBStoredFunction<RecoPerformanceDashboard>('performanceChartTransformFunction', recoPerfDashboard, recoChartPerfDashboard, true) as IndicatorsDataOutput<RecoPerformanceDashboard> | undefined;

  }
}
