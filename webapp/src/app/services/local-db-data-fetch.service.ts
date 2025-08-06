import { Injectable } from '@angular/core';
// import axios from 'axios';
import { ChwsRecoReport, FamilyPlanningReport, HouseholdRecapReport, MorbidityReport, PcimneNewbornReport, PcimneNewbornReportUtils, PromotionReport, RecoMegQuantityUtils, RecoMegSituationReport } from '@kossi-models/reports';
import { IndexedDbService } from './indexed-db.service';
import { ApiService } from './api.service';
import { ActiveRecoDashboard, ActiveRecoDashboardDbOutput, RecoPerformanceDashboard, RecoPerformanceDashboardDbOutput, RecoPerformanceDashboardFullYearDbOutput, RecoTasksStateDashboard, RecoTasksStateDashboardDbOutput, RecoVaccinationDashboard, RecoVaccinationDashboardDbOutput } from '@kossi-models/dashboards';
import { generateStartEndDate, notNull } from '../shared/functions';
import { UserContextService } from './user-context.service';
import { catchError, firstValueFrom, map, of } from 'rxjs';
import { IndicatorsDataOutput } from '@kossi-models/interfaces';
import { FunctionsService } from './functions.service';
import { DbSyncService } from './db-sync.service';
import { RecoDataMaps, RecoDataMapsDbOutput } from '@kossi-models/maps';


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
        if (promotionReport && promotionReport.length > 0 && USER?.role.canUseOfflineMode === true) {
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
        if (familyPlanningReport && familyPlanningReport.length > 0 && USER?.role.canUseOfflineMode === true) {
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
        if (morbidityReport && morbidityReport.length > 0 && USER?.role.canUseOfflineMode === true) {
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
        if (householdRecapReport && householdRecapReport.length > 0 && USER?.role.canUseOfflineMode === true) {
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
        if (pcimneNewbornReport && pcimneNewbornReport.length > 0 && USER?.role.canUseOfflineMode === true) {
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
        if (chwsRecoReports && chwsRecoReports.length > 0 && USER?.role.canUseOfflineMode === true) {
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
        if (recoMegReports && recoMegReports.length > 0 && USER?.role.canUseOfflineMode === true) {
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

  async GetRecoVaccinationNotDoneDashboard({ months, year, recos }: { months: string[], year: number, recos: string[] }, isOnline: boolean): Promise<IndicatorsDataOutput<RecoVaccinationDashboard[][]> | undefined> {
    const USER = await this.userCtx.currentUser();
    let recoVaccineDashboard: RecoVaccinationDashboardDbOutput[] | undefined;

    if (USER?.role.canUseOfflineMode === true && !isOnline) {
      recoVaccineDashboard = await this.indexdb.getAll<RecoVaccinationDashboardDbOutput>('reco_vaccine_not_done_dashboard', this.keyPath, (item) => {
        return months.includes(item.month) && year === parseInt(`${item.year}`) && notNull(item.reco?.id) && recos.includes(item.reco!.id);
      });
    } else {
      try {
        recoVaccineDashboard = await firstValueFrom(
          this.api.GetRecoVaccinationNotDoneDashboards({ months, year, recos }).pipe(
            map((res$: { status: number; data: RecoVaccinationDashboardDbOutput[] }) => res$.status === 200 ? res$.data : undefined),
            catchError(() => of(undefined))
          )
        );
        if (recoVaccineDashboard && recoVaccineDashboard.length > 0 && USER?.role.canUseOfflineMode === true) {
          await this.indexdb.saveMany<RecoVaccinationDashboardDbOutput>({ dbName: 'reco_vaccine_not_done_dashboard', datas: recoVaccineDashboard, callback: () => this.db.SyncRecoVaccinationNotDoneDashboards({ months, year, recos }) });
        }
      } catch (error) {
        console.error("Error fetching ChwsRecoReports:", error);
        return undefined;
      }
    }
    return await this.func.executeIndexDBStoredFunction<RecoVaccinationDashboardDbOutput>('vaccineTransformFunction', recoVaccineDashboard) as IndicatorsDataOutput<RecoVaccinationDashboard[][]> | undefined;
  }

  async GetRecoVaccinationPartialDoneDashboard({ months, year, recos }: { months: string[], year: number, recos: string[] }, isOnline: boolean): Promise<IndicatorsDataOutput<RecoVaccinationDashboard[][]> | undefined> {
    const USER = await this.userCtx.currentUser();
    let recoVaccineDashboard: RecoVaccinationDashboardDbOutput[] | undefined;

    if (USER?.role.canUseOfflineMode === true && !isOnline) {
      recoVaccineDashboard = await this.indexdb.getAll<RecoVaccinationDashboardDbOutput>('reco_vaccine_partial_done_dashboard', this.keyPath, (item) => {
        return months.includes(item.month) && year === parseInt(`${item.year}`) && notNull(item.reco?.id) && recos.includes(item.reco!.id);
      });
    } else {
      try {
        recoVaccineDashboard = await firstValueFrom(
          this.api.GetRecoVaccinationPartialDoneDashboards({ months, year, recos }).pipe(
            map((res$: { status: number; data: RecoVaccinationDashboardDbOutput[] }) => res$.status === 200 ? res$.data : undefined),
            catchError(() => of(undefined))
          )
        );
        if (recoVaccineDashboard && recoVaccineDashboard.length > 0 && USER?.role.canUseOfflineMode === true) {
          await this.indexdb.saveMany<RecoVaccinationDashboardDbOutput>({ dbName: 'reco_vaccine_partial_done_dashboard', datas: recoVaccineDashboard, callback: () => this.db.SyncRecoVaccinationPartialDoneDashboards({ months, year, recos }) });
        }
      } catch (error) {
        console.error("Error fetching RecoVaccinationPartialDoneDashboard:", error);
        return undefined;
      }
    }
    return await this.func.executeIndexDBStoredFunction<RecoVaccinationDashboardDbOutput>('vaccineTransformFunction', recoVaccineDashboard) as IndicatorsDataOutput<RecoVaccinationDashboard[][]> | undefined;
  }

  async GetRecoVaccinationAllDoneDashboard({ months, year, recos }: { months: string[], year: number, recos: string[] }, isOnline: boolean): Promise<IndicatorsDataOutput<RecoVaccinationDashboard[][]> | undefined> {
    const USER = await this.userCtx.currentUser();
    let recoVaccineDashboard: RecoVaccinationDashboardDbOutput[] | undefined;

    if (USER?.role.canUseOfflineMode === true && !isOnline) {
      recoVaccineDashboard = await this.indexdb.getAll<RecoVaccinationDashboardDbOutput>('reco_vaccine_all_done_dashboard', this.keyPath, (item) => {
        return months.includes(item.month) && year === parseInt(`${item.year}`) && notNull(item.reco?.id) && recos.includes(item.reco!.id);
      });
    } else {
      try {
        recoVaccineDashboard = await firstValueFrom(
          this.api.GetRecoVaccinationAllDoneDashboards({ months, year, recos }).pipe(
            map((res$: { status: number; data: RecoVaccinationDashboardDbOutput[] }) => res$.status === 200 ? res$.data : undefined),
            catchError(() => of(undefined))
          )
        );
        if (recoVaccineDashboard && recoVaccineDashboard.length > 0 && USER?.role.canUseOfflineMode === true) {
          await this.indexdb.saveMany<RecoVaccinationDashboardDbOutput>({ dbName: 'reco_vaccine_all_done_dashboard', datas: recoVaccineDashboard, callback: () => this.db.SyncRecoVaccinationAllDoneDashboards({ months, year, recos }) });
        }
      } catch (error) {
        console.error("Error fetching RecoVaccinationAllDoneDashboard:", error);
        return undefined;
      }
    }
    return await this.func.executeIndexDBStoredFunction<RecoVaccinationDashboardDbOutput>('vaccineTransformFunction', recoVaccineDashboard) as IndicatorsDataOutput<RecoVaccinationDashboard[][]> | undefined;
  }

  async GetRecoPerformanceDashboard({ months, year, recos }: { months: string[], year: number, recos: string[] }, isOnline: boolean): Promise<IndicatorsDataOutput<RecoPerformanceDashboard> | undefined> {
    const USER = await this.userCtx.currentUser();
    let recoPerfData: RecoPerformanceDashboardDbOutput[] | undefined;
    let recoYearPerfData: RecoPerformanceDashboardFullYearDbOutput[] | undefined;

    if (USER?.role.canUseOfflineMode === true && !isOnline) {
      recoPerfData = await this.indexdb.getAll<RecoPerformanceDashboardDbOutput>('reco_performance_dashboard', this.keyPath, (item) => {
        return months.includes(item.month) && year === parseInt(`${item.year}`) && notNull(item.reco?.id) && recos.includes(item.reco!.id);
      });
      recoYearPerfData = await this.indexdb.getAll<RecoPerformanceDashboardFullYearDbOutput>('reco_full_year_performance_dashboard', this.keyPath, (item) => {
        return year === parseInt(`${item.year}`) && notNull(item.reco?.id) && recos.includes(item.reco!.id);
      });
    } else {
      try {
        const outPut = await firstValueFrom(
          this.api.GetRecoPerformanceDashboards({ months, year, recos }).pipe(
            map((res$: { status: number; data: RecoPerformanceDashboardDbOutput[], yearData: RecoPerformanceDashboardFullYearDbOutput[] }) => res$.status === 200 ? { data: res$.data, yearData: res$.yearData } : undefined),
            catchError(() => of(undefined))
          )
        );

        recoPerfData = outPut?.data ?? [];
        recoYearPerfData = outPut?.yearData ?? [];

        if (recoPerfData && recoPerfData.length > 0 && USER?.role.canUseOfflineMode === true) {
          await this.indexdb.saveMany<RecoPerformanceDashboardDbOutput>({ dbName: 'reco_performance_dashboard', datas: recoPerfData, callback: () => this.db.SyncRecoPerformanceDashboards({ months, year, recos }) });
        }

        if (recoYearPerfData && recoYearPerfData.length > 0 && USER?.role.canUseOfflineMode === true) {
          await this.indexdb.saveMany<RecoPerformanceDashboardFullYearDbOutput>({ dbName: 'reco_full_year_performance_dashboard', datas: recoYearPerfData, callback: () => this.db.SyncRecoPerformanceDashboards({ months, year, recos }) });
        }
      } catch (error) {
        console.error("Error fetching ChwsRecoReports:", error);
        return undefined;
      }
    }

    return await this.func.executeIndexDBStoredFunction<RecoPerformanceDashboardDbOutput>('recoPerformanceTransformFunction', recoPerfData, recoYearPerfData, true) as IndicatorsDataOutput<RecoPerformanceDashboard> | undefined;
  }

  async GetActiveRecoDashboard({ year, recos }: { year: number, recos: string[] }, isOnline: boolean): Promise<IndicatorsDataOutput<ActiveRecoDashboard> | undefined> {

    const USER = await this.userCtx.currentUser();
    let activeReco: ActiveRecoDashboardDbOutput[] | undefined;

    if (USER?.role.canUseOfflineMode === true && !isOnline) {
      activeReco = await this.indexdb.getAll<ActiveRecoDashboardDbOutput>('active_reco_dashboard', this.keyPath, (item) => {
        return year === parseInt(`${item.year}`) && notNull(item.reco?.id) && recos.includes(item.reco!.id);
      });
    } else {
      try {
        activeReco = await firstValueFrom(
          this.api.GetActiveRecoDashboards({ year, recos }).pipe(
            map((res$: { status: number; data: ActiveRecoDashboardDbOutput[] }) => res$.status === 200 ? res$.data : undefined),
            catchError(() => of(undefined))
          )
        );
        if (activeReco && activeReco.length > 0 && USER?.role.canUseOfflineMode === true) {
          await this.indexdb.saveMany<ActiveRecoDashboardDbOutput>({ dbName: 'active_reco_dashboard', datas: activeReco, callback: () => this.db.SyncActiveRecoDashboards({ year, recos }) });
        }
      } catch (error) {
        console.error("Error fetching ActiveRecoDashboard:", error);
        return undefined;
      }
    }

    return await this.func.executeIndexDBStoredFunction<ActiveRecoDashboardDbOutput>('activeRecoTransformFunction', activeReco) as IndicatorsDataOutput<ActiveRecoDashboard> | undefined;
  }


  async GetRecoTasksStateDashboard({ months, year, recos }: { months: string[], year: number, recos: string[] }, isOnline: boolean): Promise<IndicatorsDataOutput<RecoTasksStateDashboard[]> | undefined> {
    const { start_date, end_date } = generateStartEndDate(months, year);


    const USER = await this.userCtx.currentUser();
    let tasksState: RecoTasksStateDashboardDbOutput[] | undefined;

    if (USER?.role.canUseOfflineMode === true && !isOnline) {
      // tasksState = await this.indexdb.getAll<RecoTasksStateDashboardDbOutput>('reco_tasks_state_dashboard', this.keyPath, (item) => {
      //   return year === parseInt(`${item.year}`) && notNull(item.reco?.id) && recos.includes(item.reco!.id);
      // });
    } else {
      try {
        tasksState = await firstValueFrom(
          this.api.GetRecoTasksStateDashboards({ start_date, end_date, recos }).pipe(
            map((res$: { status: number; data: RecoTasksStateDashboardDbOutput[] }) => res$.status === 200 ? res$.data : undefined),
            catchError(() => of(undefined))
          )
        );
        if (tasksState && tasksState.length > 0 && USER?.role.canUseOfflineMode === true) {
          await this.indexdb.saveMany<RecoTasksStateDashboardDbOutput>({ dbName: 'reco_tasks_state_dashboard', datas: tasksState, callback: () => this.db.SyncRecoTasksStateDashboards({ start_date, end_date, recos }) });
        }
      } catch (error) {
        console.error("Error fetching RecoTasksStateDashboard:", error);
        return undefined;
      }
    }

    return await this.func.executeIndexDBStoredFunction<RecoTasksStateDashboardDbOutput>('recoTasksStateTransformFunction', tasksState) as IndicatorsDataOutput<RecoTasksStateDashboard[]> | undefined;
  }



  


  async GetRecoDataMaps({ months, year, recos }: { months: string[], year: number, recos: string[] }, isOnline: boolean): Promise<IndicatorsDataOutput<{ withMap: RecoDataMaps[], withoutMap: RecoDataMaps[] }> | undefined> {
    const USER = await this.userCtx.currentUser();
    let recoMaps: RecoDataMapsDbOutput[] | undefined;

    if (USER?.role.canUseOfflineMode === true && !isOnline) {
      recoMaps = await this.indexdb.getAll<RecoDataMapsDbOutput>('reco_data_maps', this.keyPath, (item) => {
        return months.includes(item.month) && year === parseInt(`${item.year}`) && notNull(item.reco?.id) && recos.includes(item.reco!.id);
      });
    } else {
      try {
        recoMaps = await firstValueFrom(
          this.api.GetRecoDataMaps({ months, year, recos }).pipe(
            map((res$: { status: number; data: RecoDataMapsDbOutput[] }) => res$.status === 200 ? res$.data : undefined),
            catchError(() => of(undefined))
          )
        );
        if (recoMaps && recoMaps.length > 0 && USER?.role.canUseOfflineMode === true) {
          await this.indexdb.saveMany<RecoDataMapsDbOutput>({ dbName: 'reco_data_maps', datas: recoMaps, callback: () => this.db.SyncRecoDataMaps({ months, year, recos }) });
        }
      } catch (error) {
        console.error("Error fetching RecoDataMaps:", error);
        return undefined;
      }
    }
    return await this.func.executeIndexDBStoredFunction<RecoDataMapsDbOutput>('recoDataMapsTransformFunction', recoMaps) as IndicatorsDataOutput<{ withMap: RecoDataMaps[], withoutMap: RecoDataMaps[] }> | undefined;
  }

}
