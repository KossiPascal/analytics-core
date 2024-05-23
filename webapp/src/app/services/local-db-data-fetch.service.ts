import { Injectable } from '@angular/core';
// import axios from 'axios';
import { ChwsRecoReport, ChwsRecoReportElements, FamilyPlanningReport, HouseholdRecapReport, IndicatorsDataOutput, MorbidityReport, PcimneNewbornReport, PcimneNewbornReportUtils, PromotionReport } from '@kossi-models/reports';
import { IndexedDbService } from './indexed-db.service';
import { ApiService } from './api.service';
import { RecoChartPerformanceDashboard, RecoMegDashboard, RecoMegDashboardUtils, RecoPerformanceDashboard, RecoPerformanceDashboardUtils, RecoVaccinationDashboard, RecoVaccinationDashboardUtils } from '@kossi-models/dashboards';
import { monthByArg, notNull } from '../utils/functions';
import { UserContextService } from './user-context.service';
import { User } from '@kossi-models/user';
import { catchError, map, of } from 'rxjs';



@Injectable({
  providedIn: 'root'
})
export class LocalDbDataFetchService {
  private readonly keyPath: string = 'id';

  USER: User | null;

  constructor(private indexdb: IndexedDbService, private api: ApiService, private userCtx: UserContextService) {
    this.USER = this.userCtx.currentUserCtx;
  }

  // ############################## REPORTS ################################

  async GetPromotionReports({ months, year, recos }: { months: string[], year: number, recos: string[] }): Promise<IndicatorsDataOutput<PromotionReport> | undefined> {
    var promotionReport: PromotionReport[] = [];

    if (this.USER?.can_use_offline_mode !== true) {
      promotionReport = (await (this.api.GetPromotionReports({ months, year, recos }).
        pipe(map((res$: { status: number, data: PromotionReport[] }) => { return res$.status === 200 ? res$.data : []; }),
          catchError((err: any) => { return of(undefined); }))).toPromise()) ?? [];
    } else {
      promotionReport = await this.indexdb.getAllData<PromotionReport>('promotion_reports', this.keyPath, (item) => {
        return months.includes(item.month) && year === parseInt(`${item.year}`) && notNull(item.reco?.id) && recos.includes(item.reco!.id);
      });
    }

    if (promotionReport.length > 0) {
      const summedReport: any = {
        malaria_nbr_touched_by_VAD_F: 0,
        malaria_nbr_touched_by_VAD_M: 0,
        malaria_nbr_touched_by_CE_F: 0,
        malaria_nbr_touched_by_CE_M: 0,
        malaria_nbr_total_F: 0,
        malaria_nbr_total_M: 0,

        vaccination_nbr_touched_by_VAD_F: 0,
        vaccination_nbr_touched_by_VAD_M: 0,
        vaccination_nbr_touched_by_CE_F: 0,
        vaccination_nbr_touched_by_CE_M: 0,
        vaccination_nbr_total_F: 0,
        vaccination_nbr_total_M: 0,

        child_health_nbr_touched_by_VAD_F: 0,
        child_health_nbr_touched_by_VAD_M: 0,
        child_health_nbr_touched_by_CE_F: 0,
        child_health_nbr_touched_by_CE_M: 0,
        child_health_nbr_total_F: 0,
        child_health_nbr_total_M: 0,

        cpn_cpon_nbr_touched_by_VAD_F: 0,
        cpn_cpon_nbr_touched_by_VAD_M: 0,
        cpn_cpon_nbr_touched_by_CE_F: 0,
        cpn_cpon_nbr_touched_by_CE_M: 0,
        cpn_cpon_nbr_total_F: 0,
        cpn_cpon_nbr_total_M: 0,

        family_planning_nbr_touched_by_VAD_F: 0,
        family_planning_nbr_touched_by_VAD_M: 0,
        family_planning_nbr_touched_by_CE_F: 0,
        family_planning_nbr_touched_by_CE_M: 0,
        family_planning_nbr_total_F: 0,
        family_planning_nbr_total_M: 0,

        hygienic_water_sanitation_nbr_touched_by_VAD_F: 0,
        hygienic_water_sanitation_nbr_touched_by_VAD_M: 0,
        hygienic_water_sanitation_nbr_touched_by_CE_F: 0,
        hygienic_water_sanitation_nbr_touched_by_CE_M: 0,
        hygienic_water_sanitation_nbr_total_F: 0,
        hygienic_water_sanitation_nbr_total_M: 0,

        other_diseases_nbr_touched_by_VAD_F: 0,
        other_diseases_nbr_touched_by_VAD_M: 0,
        other_diseases_nbr_touched_by_CE_F: 0,
        other_diseases_nbr_touched_by_CE_M: 0,
        other_diseases_nbr_total_F: 0,
        other_diseases_nbr_total_M: 0,
      };
      for (const category of Object.keys(summedReport)) {
        for (const r of promotionReport) {
          summedReport[category] += parseInt((r as any)[category]);
        }
      }
      const reco_names = promotionReport.map(r => r.reco).reduce((unique: { id: string, name: string, phone: string }[], r: { id: string, name: string, phone: string } | null) => {
        if (r && !(unique.find(i => i.id === r.id))) {
          unique.push(r);
        }
        return unique;
      }, []);

      promotionReport.map(d => d.is_validate).reduce((acc, val) => val !== true ? acc + 1 : acc, 0)

      const outPutReport: IndicatorsDataOutput<PromotionReport> = {
        country: promotionReport[0].country,
        region: promotionReport[0].region,
        prefecture: promotionReport[0].prefecture,
        commune: promotionReport[0].commune,
        hospital: promotionReport[0].hospital,
        district_quartier: promotionReport[0].district_quartier,
        chw: promotionReport[0].chw,
        village_secteur: promotionReport[0].village_secteur,
        reco: reco_names.length !== 1 ? null : reco_names[0],
        reco_asc_type: reco_names.length !== 1 ? 'ASC' : 'RECO',
        is_validate: promotionReport.map(d => d.is_validate).reduce((acc, val) => val !== true ? acc + 1 : acc, 0) === 0,
        data: summedReport
      };
      return outPutReport;
    }
    return;
  }

  async GetFamilyPlanningReports({ months, year, recos }: { months: string[], year: number, recos: string[] }): Promise<IndicatorsDataOutput<FamilyPlanningReport> | undefined> {
    var familyPlanningReport: FamilyPlanningReport[] = [];
    if (this.USER?.can_use_offline_mode !== true) {
      familyPlanningReport = (await (this.api.GetFamilyPlanningReports({ months, year, recos }).
        pipe(map((res$: { status: number, data: FamilyPlanningReport[] }) => { return res$.status === 200 ? res$.data : []; }),
          catchError((err: any) => { return of(undefined); }))).toPromise()) ?? [];
    } else {
      familyPlanningReport = await this.indexdb.getAllData<FamilyPlanningReport>('family_planning_reports', this.keyPath, (item) => {
        return months.includes(item.month) && year === parseInt(`${item.year}`) && notNull(item.reco?.id) && recos.includes(item.reco!.id);
      });
    }

    if (familyPlanningReport.length > 0) {
      const summedReport: any = {
        pill_coc: {},
        pill_cop: {},
        condoms: {},
        depo_provera_im: {},
        dmpa_sc: {},
        cycle_necklace: {},
        diu: {},
        implant: {},
        tubal_ligation: {},
      }
      for (const category of Object.keys(summedReport)) {
        for (const r of familyPlanningReport) {
          for (const sousCategory of Object.keys((r as any)[category])) {
            if (!(sousCategory in summedReport[category])) {
              summedReport[category][sousCategory] = 0;
            }
            summedReport[category][sousCategory] += parseInt((r as any)[category][sousCategory]);
          }
        }
      }
      const reco_names = familyPlanningReport.map(r => r.reco).reduce((unique: { id: string, name: string, phone: string }[], r: { id: string, name: string, phone: string } | null) => {
        if (r && !(unique.find(i => i.id === r.id))) {
          unique.push(r);
        }
        return unique;
      }, []);

      const outPutReport: IndicatorsDataOutput<FamilyPlanningReport> = {
        country: familyPlanningReport[0].country,
        region: familyPlanningReport[0].region,
        prefecture: familyPlanningReport[0].prefecture,
        commune: familyPlanningReport[0].commune,
        hospital: familyPlanningReport[0].hospital,
        district_quartier: familyPlanningReport[0].district_quartier,
        chw: familyPlanningReport[0].chw,
        village_secteur: familyPlanningReport[0].village_secteur,
        reco: reco_names.length !== 1 ? null : reco_names[0],
        reco_asc_type: reco_names.length !== 1 ? 'ASC' : 'RECO',
        is_validate: familyPlanningReport.map(d => d.is_validate).reduce((acc, val) => val !== true ? acc + 1 : acc, 0) === 0,
        data: summedReport
      };
      return outPutReport;
    }
    return;
  }

  async GetMorbidityReports({ months, year, recos }: { months: string[], year: number, recos: string[] }): Promise<IndicatorsDataOutput<MorbidityReport> | undefined> {
    var morbidityReport: MorbidityReport[] = [];
    if (this.USER?.can_use_offline_mode !== true) {
      morbidityReport = (await (this.api.GetMorbidityReports({ months, year, recos }).
        pipe(map((res$: { status: number, data: MorbidityReport[] }) => { return res$.status === 200 ? res$.data : []; }),
          catchError((err: any) => { return of(undefined); }))).toPromise()) ?? [];
    } else {
      morbidityReport = await this.indexdb.getAllData<MorbidityReport>('morbidity_reports', this.keyPath, (item) => {
        return months.includes(item.month) && year === parseInt(`${item.year}`) && notNull(item.reco?.id) && recos.includes(item.reco!.id);
      });
    }

    if (morbidityReport.length > 0) {
      const summedReport: any = {
        hp_circulation_accident: {},
        hp_burn: {},
        hp_suspected_tb_cases: {},
        hp_dermatosis: {},
        hp_diarrhea: {},
        hp_urethral_discharge: {},
        hp_vaginal_discharge: {},
        hp_urinary_loss: {},
        hp_accidental_caustic_products_ingestion: {},
        hp_food_poisoning: {},
        hp_oral_diseases: {},
        hp_dog_bite: {},
        hp_snake_bite: {},
        hp_parasitosis: {},
        hp_measles: {},
        hp_trauma: {},
        hp_gender_based_violence: {},

        malaria_total_cases: {},
        malaria_rdt_performed: {},
        malaria_positive_rdts: {},
        malaria_cases_treated_with_cta: {},
      }
      for (const category of Object.keys(summedReport)) {
        for (const r of morbidityReport) {
          for (const sousCategory of Object.keys((r as any)[category])) {
            if (sousCategory === 'indicator') {
              if (!(sousCategory in summedReport[category])) {
                summedReport[category][sousCategory] = (r as any)[category][sousCategory];
              }
            } else {
              if (!(sousCategory in summedReport[category])) {
                summedReport[category][sousCategory] = 0;
              }
              summedReport[category][sousCategory] += parseInt((r as any)[category][sousCategory]);
            }
          }
        }
      }

      const reco_names = morbidityReport.map(r => r.reco).reduce((unique: { id: string, name: string, phone: string }[], r: { id: string, name: string, phone: string } | null) => {
        if (r && !(unique.find(i => i.id === r.id))) {
          unique.push(r);
        }
        return unique;
      }, []);
      const outPutReport: IndicatorsDataOutput<MorbidityReport> = {
        country: morbidityReport[0].country,
        region: morbidityReport[0].region,
        prefecture: morbidityReport[0].prefecture,
        commune: morbidityReport[0].commune,
        hospital: morbidityReport[0].hospital,
        district_quartier: morbidityReport[0].district_quartier,
        chw: morbidityReport[0].chw,
        village_secteur: morbidityReport[0].village_secteur,
        reco: reco_names.length !== 1 ? null : reco_names[0],
        reco_asc_type: reco_names.length !== 1 ? 'ASC' : 'RECO',
        is_validate: morbidityReport.map(d => d.is_validate).reduce((acc, val) => val !== true ? acc + 1 : acc, 0) === 0,
        data: summedReport
      };
      return outPutReport;
    }
    return;
  }

  async GetHouseholdRecapReports({ months, year, recos }: { months: string[], year: number, recos: string[] }): Promise<{ total: HouseholdRecapReport, out: IndicatorsDataOutput<HouseholdRecapReport[]> } | undefined> {
    var householdRecapReport: HouseholdRecapReport[] = [];
    if (this.USER?.can_use_offline_mode !== true) {
      householdRecapReport = (await (this.api.GetHouseholdRecapReports({ months, year, recos }).
        pipe(map((res$: { status: number, data: HouseholdRecapReport[] }) => { return res$.status === 200 ? res$.data : []; }),
          catchError((err: any) => { return of(undefined); }))).toPromise()) ?? [];
    } else {
      householdRecapReport = await this.indexdb.getAllData<HouseholdRecapReport>('household_recaps_reports', this.keyPath, (item) => {
        return months.includes(item.month) && year === parseInt(`${item.year}`) && notNull(item.reco?.id) && recos.includes(item.reco!.id);
      });
    }
    if (householdRecapReport.length > 0) {
      // const summedReport: any = {
      //   household_code: '',
      //   household_name: '',
      //   total_household_members: 0,
      //   total_women_15_50_years: 0,
      //   total_children_under_5_years: 0,
      //   total_children_0_12_months: 0,
      //   total_children_12_60_months: 0,
      //   has_functional_latrine: false,
      //   has_drinking_water_access: false
      // }
      // for (const category of Object.keys(summedReport)) {
      //   for (const r of householdRecapReport) {
      //     if (['household_code', 'household_name'].includes(category) && summedReport[category] === '') {
      //       summedReport[category] = (r as any)[category];
      //     } else if (['has_functional_latrine', 'has_drinking_water_access'].includes(category) && ['yes', 'true', true].includes((r as any)[category])) {
      //       summedReport[category] = true;
      //     } else {
      //       const d1 = summedReport[category];
      //       const d2 = parseInt((r as any)[category]);
      //       if (d2 > d1) summedReport[category] = d2;
      //     }
      //   }
      // }
      // const reco_names = householdRecapReport.map(r => r.reco).reduce((unique: { id: string, name: string, phone: string }[], r: { id: string, name: string, phone: string } | null) => {
      //   if (r && !(unique.find(i => i.id === r.id))) {
      //     unique.push(r);
      //   }
      //   return unique;
      // }, []);
      // summedReport['country'] = householdRecapReport[0].country;
      // summedReport['region'] = householdRecapReport[0].region;
      // summedReport['prefecture'] = householdRecapReport[0].prefecture;
      // summedReport['commune'] = householdRecapReport[0].commune;
      // summedReport['hospital'] = householdRecapReport[0].hospital;
      // summedReport['district_quartier'] = householdRecapReport[0].district_quartier;
      // summedReport['chw'] = householdRecapReport[0].chw;
      // summedReport['village_secteur'] = householdRecapReport[0].village_secteur;
      // summedReport['reco'] = reco_names.length !== 1 ? null : reco_names[0];
      // summedReport['reco_asc_type'] = reco_names.length !== 1 ? 'ASC' : 'RECO';

      //########################################################################################

      const reco_names = householdRecapReport.map(r => r.reco).reduce((unique: { id: string, name: string, phone: string }[], r: { id: string, name: string, phone: string } | null) => {
        if (r !== null && !(unique.find(i => i !== null && i.id === r.id))) {
          unique.push(r);
        }
        return unique;
      }, []);

      const outPutData: any[] = (householdRecapReport.map(r => {
        return {
          index: parseInt(r.household_code),
          household_code: r.household_code,
          household_name: r.household_name.replace(`${r.household_code} - `, ''),
          total_household_members: parseInt(`${r.total_household_members}`),
          total_women_15_50_years: parseInt(`${r.total_women_15_50_years}`),
          total_children_under_5_years: parseInt(`${r.total_children_under_5_years}`),
          total_children_0_12_months: parseInt(`${r.total_children_0_12_months}`),
          total_children_12_60_months: parseInt(`${r.total_children_12_60_months}`),
          has_functional_latrine: r.has_functional_latrine === true,
          has_drinking_water_access: r.has_drinking_water_access === true
        }
      })).sort((a, b) => a.index - b.index)

      const totalData: any = {
        total_household_members: outPutData.map(d => d.total_household_members).reduce((total, num) => total + num, 0),
        total_women_15_50_years: outPutData.map(d => d.total_women_15_50_years).reduce((total, num) => total + num, 0),
        total_children_under_5_years: outPutData.map(d => d.total_children_under_5_years).reduce((total, num) => total + num, 0),
        total_children_0_12_months: outPutData.map(d => d.total_children_0_12_months).reduce((total, num) => total + num, 0),
        total_children_12_60_months: outPutData.map(d => d.total_children_12_60_months).reduce((total, num) => total + num, 0),
        has_functional_latrine: outPutData.map(d => d.has_functional_latrine).reduce((acc, val) => val === true ? acc + 1 : acc, 0),
        has_drinking_water_access: outPutData.map(d => d.has_drinking_water_access).reduce((acc, val) => val === true ? acc + 1 : acc, 0)
      };
      const outPutReport: IndicatorsDataOutput<HouseholdRecapReport[]> = {
        country: householdRecapReport[0].country,
        region: householdRecapReport[0].region,
        prefecture: householdRecapReport[0].prefecture,
        commune: householdRecapReport[0].commune,
        hospital: householdRecapReport[0].hospital,
        district_quartier: householdRecapReport[0].district_quartier,
        chw: householdRecapReport[0].chw,
        village_secteur: householdRecapReport[0].village_secteur,
        reco: reco_names.length !== 1 ? null : reco_names[0],
        reco_asc_type: reco_names.length !== 1 ? 'ASC' : 'RECO',
        is_validate: householdRecapReport.map(d => d.is_validate).reduce((acc, val) => val !== true ? acc + 1 : acc, 0) === 0,
        data: outPutData
      };
      return { total: totalData, out: outPutReport };
    }
    return;
  }

  async GetPcimneNewbornReports({ months, year, recos }: { months: string[], year: number, recos: string[] }): Promise<PcimneNewbornReport | undefined> {
    var pcimneNewbornReport: PcimneNewbornReport[] = [];
    if (this.USER?.can_use_offline_mode !== true) {
      pcimneNewbornReport = (await (this.api.GetPcimneNewbornReports({ months, year, recos }).
        pipe(map((res$: { status: number, data: PcimneNewbornReport[] }) => { return res$.status === 200 ? res$.data : []; }),
          catchError((err: any) => { return of(undefined); }))).toPromise()) ?? [];
    } else {
      pcimneNewbornReport = await this.indexdb.getAllData<PcimneNewbornReport>('pcime_newborn_reports', this.keyPath, (item) => {
        return months.includes(item.month) && year === parseInt(`${item.year}`) && notNull(item.reco?.id) && recos.includes(item.reco!.id);
      });
    }
    if (pcimneNewbornReport.length > 0) {
      const summedReport: any = {
        // index: 0,
        // indicator: "",
        nbr_malaria_0_2_months_F: 0,
        nbr_malaria_0_2_months_M: 0,
        nbr_malaria_2_12_months_F: 0,
        nbr_malaria_2_12_months_M: 0,
        nbr_malaria_12_60_months_F: 0,
        nbr_malaria_12_60_months_M: 0,
        nbr_cough_pneumonia_0_2_months_F: 0,
        nbr_cough_pneumonia_0_2_months_M: 0,
        nbr_cough_pneumonia_2_12_months_F: 0,
        nbr_cough_pneumonia_2_12_months_M: 0,
        nbr_cough_pneumonia_12_60_months_F: 0,
        nbr_cough_pneumonia_12_60_months_M: 0,
        nbr_diarrhea_0_2_months_F: 0,
        nbr_diarrhea_0_2_months_M: 0,
        nbr_diarrhea_2_12_months_F: 0,
        nbr_diarrhea_2_12_months_M: 0,
        nbr_diarrhea_12_60_months_F: 0,
        nbr_diarrhea_12_60_months_M: 0,
        nbr_malnutrition_0_2_months_F: 0,
        nbr_malnutrition_0_2_months_M: 0,
        nbr_malnutrition_2_12_months_F: 0,
        nbr_malnutrition_2_12_months_M: 0,
        nbr_malnutrition_12_60_months_F: 0,
        nbr_malnutrition_12_60_months_M: 0,
        nbr_total: 0
      };

      const dataToOut: PcimneNewbornReportUtils[] = [];

      for (const pnr of pcimneNewbornReport) {
        const reports = pnr.pcimne_newborn;
        for (const r of reports) {
          const [found, index] = (() => {
            let foundIndex = -1;
            const foundObject = dataToOut.find((dt, idx) => {
              if (dt.index === r.index) {
                foundIndex = idx;
                return true;
              }
              return false;
            });
            return [foundObject, foundIndex];
          })();

          if (found) {
            for (const category of Object.keys(summedReport)) {
              const nrb = parseInt(`${(found as any)[category]}`) + parseInt(`${(r as any)[category]}`);
              (found as any)[category] = nrb;
            }
            dataToOut[index] = found;
          } else {
            dataToOut.push(r);
          }
        }
      }

      const reco_names = pcimneNewbornReport.map(r => r.reco).reduce((unique: { id: string, name: string, phone: string }[], r: { id: string, name: string, phone: string } | null) => {
        if (r && !(unique.find(i => i.id === r.id))) {
          unique.push(r);
        }
        return unique;
      }, []);

      const outPutReport: any = {
        country: pcimneNewbornReport[0].country,
        region: pcimneNewbornReport[0].region,
        prefecture: pcimneNewbornReport[0].prefecture,
        commune: pcimneNewbornReport[0].commune,
        hospital: pcimneNewbornReport[0].hospital,
        district_quartier: pcimneNewbornReport[0].district_quartier,
        chw: pcimneNewbornReport[0].chw,
        village_secteur: pcimneNewbornReport[0].village_secteur,
        reco: reco_names.length !== 1 ? null : reco_names[0],
        reco_asc_type: reco_names.length !== 1 ? 'ASC' : 'RECO',
        is_validate: pcimneNewbornReport.map(d => d.is_validate).reduce((acc, val) => val !== true ? acc + 1 : acc, 0) === 0,
        pcimne_newborn: dataToOut.sort((a, b) => a.index - b.index),
      }
      return outPutReport;
    }
    return;
  }

  async GetChwsRecoReports({ months, year, recos }: { months: string[], year: number, recos: string[] }): Promise<IndicatorsDataOutput<ChwsRecoReport> | undefined> {
    var chwsRecoReports: ChwsRecoReport[] = [];
    if (this.USER?.can_use_offline_mode !== true) {
      chwsRecoReports = (await (this.api.GetChwsRecoReports({ months, year, recos }).
        pipe(map((res$: { status: number, data: ChwsRecoReport[] }) => { return res$.status === 200 ? res$.data : []; }),
          catchError((err: any) => { return of(undefined); }))).toPromise()) ?? [];
    } else {
      chwsRecoReports = await this.indexdb.getAllData<ChwsRecoReport>('chws_reco_reports', this.keyPath, (item) => {
        return months.includes(item.month) && year === parseInt(`${item.year}`) && notNull(item.reco?.id) && recos.includes(item.reco!.id);
      });
    }
    if (chwsRecoReports.length > 0) {
      const summedReport: any = {
        reco_monitoring: {},
        demography: {},
        child_health_0_59_months: {},
        mother_health: {},
        pcimne_activity: {},
        morbidity_activities: {},
        malaria_more_5_years: {},
        home_visit: {},
        educational_chat: {},
        developed_areas: {},
        diseases_alerts: {},
      };

      for (const category of Object.keys(summedReport)) {
        for (const r of chwsRecoReports) {
          const cible = ((r as any)[category]) as ChwsRecoReportElements
          if (!('index' in summedReport[category])) summedReport[category]['index'] = cible.index;
          if (!('group' in summedReport[category])) summedReport[category]['group'] = cible.group;
          if (!('position' in summedReport[category])) summedReport[category]['position'] = cible.position;
          if (!('bigGroup' in summedReport[category])) summedReport[category]['bigGroup'] = cible.bigGroup;
          if (!('data' in summedReport[category])) summedReport[category]['data'] = {};

          for (const d of cible.data) {
            if (!(d.index in summedReport[category]['data'])) {
              summedReport[category]['data'][d.index] = JSON.parse(JSON.stringify(d)); // Deep copy
            } else {
              const de_number = parseInt(`${summedReport[category]['data'][d.index]['de_number']}`) + d.de_number;
              summedReport[category]['data'][d.index]['de_number'] = de_number;
            }
          }
        }
      }

      const reco_names = chwsRecoReports.map(r => r.reco).reduce((unique: { id: string, name: string, phone: string }[], r: { id: string, name: string, phone: string } | null) => {
        if (r && !(unique.find(i => i.id === r.id))) {
          unique.push(r);
        }
        return unique;
      }, []);

      const summedChwsRecoReport: any = {
        reco_monitoring: this.GetChwsRecoReportElementsUtils(summedReport['reco_monitoring'] as ChwsRecoReportElements),
        demography: this.GetChwsRecoReportElementsUtils(summedReport['demography'] as ChwsRecoReportElements),
        child_health_0_59_months: this.GetChwsRecoReportElementsUtils(summedReport['child_health_0_59_months'] as ChwsRecoReportElements),
        mother_health: this.GetChwsRecoReportElementsUtils(summedReport['mother_health'] as ChwsRecoReportElements),
        pcimne_activity: this.GetChwsRecoReportElementsUtils(summedReport['pcimne_activity'] as ChwsRecoReportElements),
        morbidity_activities: this.GetChwsRecoReportElementsUtils(summedReport['morbidity_activities'] as ChwsRecoReportElements),
        malaria_more_5_years: this.GetChwsRecoReportElementsUtils(summedReport['malaria_more_5_years'] as ChwsRecoReportElements),
        home_visit: this.GetChwsRecoReportElementsUtils(summedReport['home_visit'] as ChwsRecoReportElements),
        educational_chat: this.GetChwsRecoReportElementsUtils(summedReport['educational_chat'] as ChwsRecoReportElements),
        developed_areas: this.GetChwsRecoReportElementsUtils(summedReport['developed_areas'] as ChwsRecoReportElements),
        diseases_alerts: this.GetChwsRecoReportElementsUtils(summedReport['diseases_alerts'] as ChwsRecoReportElements),
      };

      const outPutReport: IndicatorsDataOutput<ChwsRecoReport> = {
        country: chwsRecoReports[0].country,
        region: chwsRecoReports[0].region,
        prefecture: chwsRecoReports[0].prefecture,
        commune: chwsRecoReports[0].commune,
        hospital: chwsRecoReports[0].hospital,
        district_quartier: chwsRecoReports[0].district_quartier,
        chw: chwsRecoReports[0].chw,
        village_secteur: chwsRecoReports[0].village_secteur,
        reco: reco_names.length !== 1 ? null : reco_names[0],
        reco_asc_type: reco_names.length !== 1 ? 'ASC' : 'RECO',
        is_validate: chwsRecoReports.map(d => d.is_validate).reduce((acc, val) => val !== true ? acc + 1 : acc, 0) === 0,
        data: summedChwsRecoReport,
      }
      return outPutReport;
    }
    return;
  }
  GetChwsRecoReportElementsUtils(elem: ChwsRecoReportElements): ChwsRecoReportElements {
    return {
      index: elem.index,
      group: elem.group,
      position: elem.position,
      bigGroup: elem.bigGroup,
      data: Object.values(elem.data).sort((a, b) => a.index - b.index)
    }
  }

  // ############################## DASHBOARDS ################################

  async GetRecoMegDashboard({ months, year, recos }: { months: string[], year: number, recos: string[] }): Promise<IndicatorsDataOutput<RecoMegDashboardUtils[]> | undefined> {
    var recoMegDashboard: RecoMegDashboard[] = [];
    if (this.USER?.can_use_offline_mode !== true) {
      recoMegDashboard = (await (this.api.GetRecoMegDashboards({ months, year, recos }).
        pipe(map((res$: { status: number, data: RecoMegDashboard[] }) => { return res$.status === 200 ? res$.data : []; }),
          catchError((err: any) => { return of(undefined); }))).toPromise()) ?? [];
    } else {
      recoMegDashboard = await this.indexdb.getAllData<RecoMegDashboard>('reco_meg_dashboard', this.keyPath, (item) => {
        return months.includes(item.month) && year === parseInt(`${item.year}`) && notNull(item.reco?.id) && recos.includes(item.reco!.id);
      });
    }
    if (recoMegDashboard.length > 0) {
      const smDash: { [key: number]: RecoMegDashboardUtils } = {}
      for (const r of recoMegDashboard) {
        for (const m of r.meg_data) {
          if (!(m.index in smDash)) {
            smDash[m.index] = m;
          } else {
            smDash[m.index].month_stock = parseInt(`${smDash[m.index].month_stock}`) + parseInt(`${m.month_stock}`);
            smDash[m.index].available_stock = parseInt(`${smDash[m.index].available_stock}`) + parseInt(`${m.available_stock}`);
            smDash[m.index].consumption = parseInt(`${smDash[m.index].consumption}`) + parseInt(`${m.consumption}`);
            smDash[m.index].loss = parseInt(`${smDash[m.index].loss}`) + parseInt(`${m.loss}`);
            smDash[m.index].damaged = parseInt(`${smDash[m.index].damaged}`) + parseInt(`${m.damaged}`);
            smDash[m.index].broken = parseInt(`${smDash[m.index].broken}`) + parseInt(`${m.broken}`);
            smDash[m.index].obselete = parseInt(`${smDash[m.index].obselete}`) + parseInt(`${m.obselete}`);
          }
        }
      }

      const reco_names = recoMegDashboard.map(r => r.reco).reduce((unique: { id: string, name: string, phone: string }[], r: { id: string, name: string, phone: string } | null) => {
        if (r && !(unique.find(i => i.id === r.id))) {
          unique.push(r);
        }
        return unique;
      }, []);

      const outPutReport: IndicatorsDataOutput<RecoMegDashboardUtils[]> = {
        country: recoMegDashboard[0].country,
        region: recoMegDashboard[0].region,
        prefecture: recoMegDashboard[0].prefecture,
        commune: recoMegDashboard[0].commune,
        hospital: recoMegDashboard[0].hospital,
        district_quartier: recoMegDashboard[0].district_quartier,
        chw: recoMegDashboard[0].chw,
        village_secteur: recoMegDashboard[0].village_secteur,
        reco: reco_names.length !== 1 ? null : reco_names[0],
        reco_asc_type: reco_names.length !== 1 ? 'ASC' : 'RECO',
        is_validate: recoMegDashboard.map(d => d.is_validate).reduce((acc, val) => val !== true ? acc + 1 : acc, 0) === 0,
        data: Object.values(smDash).sort((a, b) => a.index - b.index)
      };
      return outPutReport;
    }
    return;
  }

  async GetRecoVaccinationDashboard({ months, year, recos }: { months: string[], year: number, recos: string[] }): Promise<IndicatorsDataOutput<RecoVaccinationDashboard[]> | undefined> {
    var recoVaccineDashboard: RecoVaccinationDashboard[] = [];
    if (this.USER?.can_use_offline_mode !== true) {
      recoVaccineDashboard = (await (this.api.GetRecoVaccinationDashboards({ months, year, recos }).
        pipe(map((res$: { status: number, data: RecoVaccinationDashboard[] }) => { return res$.status === 200 ? res$.data : []; }),
          catchError((err: any) => { return of(undefined); }))).toPromise()) ?? [];
    } else {
      recoVaccineDashboard = await this.indexdb.getAllData<RecoVaccinationDashboard>('reco_vaccination_dashboard', this.keyPath, (item) => {
        return months.includes(item.month) && year === parseInt(`${item.year}`) && notNull(item.reco?.id) && recos.includes(item.reco!.id);
      });
    }
    if (recoVaccineDashboard.length > 0) {
      const reco_names = recoVaccineDashboard.map(r => r.reco).reduce((unique: { id: string, name: string, phone: string }[], r: { id: string, name: string, phone: string } | null) => {
        if (r && !(unique.find(i => i.id === r.id))) {
          unique.push(r);
        }
        return unique;
      }, []);
      const outPutReport: IndicatorsDataOutput<RecoVaccinationDashboard[]> = {
        country: recoVaccineDashboard[0].country,
        region: recoVaccineDashboard[0].region,
        prefecture: recoVaccineDashboard[0].prefecture,
        commune: recoVaccineDashboard[0].commune,
        hospital: recoVaccineDashboard[0].hospital,
        district_quartier: recoVaccineDashboard[0].district_quartier,
        chw: recoVaccineDashboard[0].chw,
        village_secteur: recoVaccineDashboard[0].village_secteur,
        reco: reco_names.length !== 1 ? null : reco_names[0],
        reco_asc_type: reco_names.length !== 1 ? 'ASC' : 'RECO',
        is_validate: recoVaccineDashboard.map(d => d.is_validate).reduce((acc, val) => val !== true ? acc + 1 : acc, 0) === 0,
        data: recoVaccineDashboard
      };
      return outPutReport;
    }
    return;
  }

  async GetRecoPerformanceDashboard({ months, year, recos }: { months: string[], year: number, recos: string[] }): Promise<IndicatorsDataOutput<RecoPerformanceDashboard> | undefined> {
    var recoPerfDashboard: RecoPerformanceDashboard[] = [];
    if (this.USER?.can_use_offline_mode !== true) {
      recoPerfDashboard = (await (this.api.GetRecoPerformanceDashboards({ months, year, recos }).
        pipe(map((res$: { status: number, data: RecoPerformanceDashboard[] }) => { return res$.status === 200 ? res$.data : []; }),
          catchError((err: any) => { return of(undefined); }))).toPromise()) ?? [];
    } else {
      recoPerfDashboard = await this.indexdb.getAllData<RecoPerformanceDashboard>('reco_performance_dashboard', this.keyPath, (item) => {
        return months.includes(item.month) && year === parseInt(`${item.year}`) && notNull(item.reco?.id) && recos.includes(item.reco!.id);
      });
    }
    const smDash: any = {
      householdCount: 0,
      patientCount: 0,
      newborn0To2MonthsCount: 0,
      child2To60MonthsCount: 0,
      child5To14YearsCount: 0,
      adultOver14YearsCount: 0,
      consultationCount: 0,
      followupCount: 0,
      allActionsCount: 0,
      lineChart: {
        type: 'line',
        absisseLabels: [],
        datasets: []
      },
      barChart: {
        type: 'bar',
        absisseLabels: [],
        datasets: []
      },
      yearLineChart: {
        type: 'line',
        absisseLabels: [],
        datasets: []
      },
      yearBarChart: {
        type: 'bar',
        absisseLabels: [],
        datasets: []
      }
    }
    var recoChartPerfDashboard: RecoChartPerformanceDashboard[] = [];
    if (recos.length === 1) {

      if (this.USER?.can_use_offline_mode !== true) {
        recoChartPerfDashboard = (await (this.api.GetRecoChartPerformanceDashboards({ year, recos }).
          pipe(map((res$: { status: number, data: RecoChartPerformanceDashboard[] }) => { return res$.status === 200 ? res$.data : []; }),
            catchError((err: any) => { return of(undefined); }))).toPromise()) ?? [];
      } else {
        recoChartPerfDashboard = await this.indexdb.getAllData<RecoChartPerformanceDashboard>('reco_chart_performance_dashboard', this.keyPath, (item) => {
          return year === parseInt(`${item.year}`) && notNull(item.reco?.id) && recos.includes(item.reco!.id);
        });
      }

      const ry = recoChartPerfDashboard[0];
      if (ry) {
        smDash.yearLineChart = ry.lineChart;
        smDash.yearBarChart = ry.barChart;

        smDash.yearLineChart.absisseLabels = ry.lineChart.absisseLabels.map(d => monthByArg(`${d}`).labelFR)
        smDash.yearBarChart.absisseLabels = ry.lineChart.absisseLabels.map(d => monthByArg(`${d}`).labelFR)
      }
    }
    if (recoPerfDashboard.length > 0) {
      for (const r of recoPerfDashboard) {
        smDash.householdCount = parseInt(`${smDash.householdCount}`) + parseInt(`${r.householdCount}`);
        smDash.patientCount = parseInt(`${smDash.patientCount}`) + parseInt(`${r.patientCount}`);
        smDash.newborn0To2MonthsCount = parseInt(`${smDash.newborn0To2MonthsCount}`) + parseInt(`${r.newborn0To2MonthsCount}`);
        smDash.child2To60MonthsCount = parseInt(`${smDash.child2To60MonthsCount}`) + parseInt(`${r.child2To60MonthsCount}`);
        smDash.child5To14YearsCount = parseInt(`${smDash.child5To14YearsCount}`) + parseInt(`${r.child5To14YearsCount}`);
        smDash.adultOver14YearsCount = parseInt(`${smDash.adultOver14YearsCount}`) + parseInt(`${r.adultOver14YearsCount}`);
        smDash.consultationCount = parseInt(`${smDash.consultationCount}`) + parseInt(`${r.consultationCount}`);
        smDash.followupCount = parseInt(`${smDash.followupCount}`) + parseInt(`${r.followupCount}`);
        smDash.allActionsCount = parseInt(`${smDash.allActionsCount}`) + parseInt(`${r.allActionsCount}`);
        smDash.lineChart.absisseLabels = r.lineChart.absisseLabels;
        smDash.barChart.absisseLabels = r.barChart.absisseLabels;
        smDash.lineChart.datasets = [...smDash.lineChart.datasets, ...r.lineChart.datasets];
        smDash.barChart.datasets = [...smDash.barChart.datasets, ...r.barChart.datasets];
      }
      const reco_names = recoPerfDashboard.map(r => r.reco).reduce((unique: { id: string, name: string, phone: string }[], r: { id: string, name: string, phone: string } | null) => {
        if (r && !(unique.find(i => i.id === r.id))) {
          unique.push(r);
        }
        return unique;
      }, []);
      const outPutReport: IndicatorsDataOutput<RecoPerformanceDashboard> = {
        country: recoPerfDashboard[0].country,
        region: recoPerfDashboard[0].region,
        prefecture: recoPerfDashboard[0].prefecture,
        commune: recoPerfDashboard[0].commune,
        hospital: recoPerfDashboard[0].hospital,
        district_quartier: recoPerfDashboard[0].district_quartier,
        chw: recoPerfDashboard[0].chw,
        village_secteur: recoPerfDashboard[0].village_secteur,
        reco: reco_names.length !== 1 ? null : reco_names[0],
        reco_asc_type: reco_names.length !== 1 ? 'ASC' : 'RECO',
        is_validate: recoPerfDashboard.map(d => d.is_validate).reduce((acc, val) => val !== true ? acc + 1 : acc, 0) === 0,
        data: smDash
      };
      return outPutReport;
    }
    return;
  }
}
