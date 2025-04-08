import { ChwsRecoReport, ChwsRecoReportElements, DomainsThemesUtils, FamilyPlanningReport, FP_Utils, HouseholdRecapReport, MorbidityReport, PcimneNewbornReport, PcimneNewbornReportUtils, PromotionReport, RecoMegQuantityUtils, RecoMegSituationReport } from "../../models/reports";
import { IndicatorsDataOutput, } from "../../models/Interfaces";


export async function TransformChwsRecoReports(reports: ChwsRecoReport[]): Promise<IndicatorsDataOutput<ChwsRecoReport> | undefined> {
  if (reports.length > 0) {
    const summedReport: Record<string, ChwsRecoReportElements> = {
      reco_monitoring: {} as ChwsRecoReportElements,
      demography: {} as ChwsRecoReportElements,
      child_health_0_59_months: {} as ChwsRecoReportElements,
      mother_health: {} as ChwsRecoReportElements,
      pcimne_activity: {} as ChwsRecoReportElements,
      morbidity_activities: {} as ChwsRecoReportElements,
      malaria_more_5_years: {} as ChwsRecoReportElements,
      home_visit: {} as ChwsRecoReportElements,
      educational_talk: {} as ChwsRecoReportElements,
      developed_areas: {} as ChwsRecoReportElements,
      diseases_alerts: {} as ChwsRecoReportElements,
    };

    for (const category of Object.keys(summedReport)) {
      for (const r of reports) {
        const cible = (r as any)[category] as ChwsRecoReportElements;
        if (!cible) continue;
        if (!summedReport[category].index) summedReport[category].index = cible.index;
        if (!summedReport[category].group) summedReport[category].group = cible.group;
        if (!summedReport[category].position) summedReport[category].position = cible.position;
        if (!summedReport[category].bigGroup) summedReport[category].bigGroup = cible.bigGroup;
        if (!summedReport[category].data) (summedReport[category].data as any) = {};

        for (const d of cible.data) {
          if (!(d.index in summedReport[category].data)) {
            summedReport[category].data[d.index] = { ...d }; // Clonage
          } else {
            summedReport[category].data[d.index].de_number += Number(d.de_number);
          }
        }
      }
    }

    const recoNames = reports.map(r => r.reco).reduce((unique: { id: string, name: string, phone: string }[], r: { id: string, name: string, phone: string } | null) => {
      if (r && !(unique.find(i => i.id === r.id))) unique.push(r);
      return unique;
    }, []);

    const GetChwsRecoReportElementsUtils = (elem: ChwsRecoReportElements): ChwsRecoReportElements => ({
      index: elem.index,
      group: elem.group,
      position: elem.position,
      bigGroup: elem.bigGroup,
      data: Object.values(elem.data).sort((a, b) => a.index - b.index),
    });

    const summedChwsRecoReport: Record<string, ChwsRecoReportElements> = Object.fromEntries(
      Object.entries(summedReport).map(([key, value]) => [key, GetChwsRecoReportElementsUtils(value)])
    );

    const firstReport = reports[0];

    const outPutReport: IndicatorsDataOutput<ChwsRecoReport> = {
      country: firstReport.country,
      region: firstReport.region,
      prefecture: firstReport.prefecture,
      commune: firstReport.commune,
      hospital: firstReport.hospital,
      district_quartier: firstReport.district_quartier,
      // chw: firstReport.chw,
      village_secteur: firstReport.village_secteur,
      reco: recoNames.length !== 1 ? null : recoNames[0],
      reco_asc_type: recoNames.length !== 1 ? 'ASC' : 'RECO',
      is_validate: reports.map(d => d.is_validate).reduce((acc, val) => val !== true ? acc + 1 : acc, 0) === 0,
      already_on_dhis2: reports.map(d => d.already_on_dhis2).reduce((acc, val) => val !== true ? acc + 1 : acc, 0) === 0,
      data: (summedChwsRecoReport as any) as ChwsRecoReport,
    }
    return outPutReport;
  }
  return;
}

export async function TransformPromotionReports(reports: PromotionReport[]): Promise<IndicatorsDataOutput<PromotionReport> | undefined> {
  if (reports.length === 0) return;

  const createDomainsThemes = (): DomainsThemesUtils => {
    return {
      label: '',
      vad: { F: 0, M: 0 },
      talk: { F: 0, M: 0 },
      personal: { F: 0, M: 0 },
      total: { F: 0, M: 0 },
      bigtotal: 0
    };
  }

  const summedReportDomains: Record<string, DomainsThemesUtils> = {
    maternel_childhealth: createDomainsThemes(),
    education: createDomainsThemes(),
    gbv: createDomainsThemes(),
    nutrition: createDomainsThemes(),
    water_hygiene: createDomainsThemes(),
    ist_vih: createDomainsThemes(),
    disease_control: createDomainsThemes(),
    others: createDomainsThemes(),
  };

  const summedReportThemes: Record<string, DomainsThemesUtils> = {
    prenatal_consultation: createDomainsThemes(),
    birth_attended: createDomainsThemes(),
    delivery: createDomainsThemes(),
    birth_registration: createDomainsThemes(),
    post_natal: createDomainsThemes(),
    post_abortion: createDomainsThemes(),
    obstetric_fistula: createDomainsThemes(),
    family_planning: createDomainsThemes(),
    oral_contraceptive: createDomainsThemes(),
    vaccination: createDomainsThemes(),
    newborn_care_home: createDomainsThemes(),
    care_home_illness_case: createDomainsThemes(),
    child_development_care: createDomainsThemes(),
    advice_for_child_development: createDomainsThemes(),
    child_abuse: createDomainsThemes(),
    female_genital_mutilation: createDomainsThemes(),
    exclusive_breastfeeding: createDomainsThemes(),
    vitamin_a_supp: createDomainsThemes(),
    suppl_feeding: createDomainsThemes(),
    malnutrition: createDomainsThemes(),
    combating_iodine: createDomainsThemes(),
    hand_washing: createDomainsThemes(),
    community_led: createDomainsThemes(),
    tuberculosis: createDomainsThemes(),
    leprosy: createDomainsThemes(),
    buruli_ulcer: createDomainsThemes(),
    onchocerciasis: createDomainsThemes(),
    bilharzia: createDomainsThemes(),
    mass_deworming: createDomainsThemes(),
    human_african_trypanosomiasis: createDomainsThemes(),
    lymphatic: createDomainsThemes(),
    trachoma: createDomainsThemes(),
    sti_and_hepatitis: createDomainsThemes(),
    hypertension: createDomainsThemes(),
    diabetes: createDomainsThemes(),
    cancers: createDomainsThemes(),
    sickle_cell_disease: createDomainsThemes(),
    malaria: createDomainsThemes(),
    diarrhea: createDomainsThemes(),
    bloody_diarrhea: createDomainsThemes(),
    pneumonia: createDomainsThemes(),
    yellow_fever: createDomainsThemes(),
    cholera: createDomainsThemes(),
    tetanus: createDomainsThemes(),
    viral_diseases: createDomainsThemes(),
    meningitis: createDomainsThemes(),
    pfa: createDomainsThemes(),
    urine_loss: createDomainsThemes(),
    blood_pressure: createDomainsThemes(),
    hiv: createDomainsThemes(),
    ist: createDomainsThemes(),
  };

  const exclude = [undefined, null, 'undefined', 'null', '', ' ', '{}'];

  const processReports = (reportData: Record<string, DomainsThemesUtils>, keySuffix: string) => {
    for (const key of Object.keys(reportData)) {
      for (const report of reports) {
        try {
          const data = (report as any)?.[key + keySuffix];

          if (data) {
            if (!exclude.includes(data.label)) (reportData as any)[key].label = data.label;

            if (!exclude.includes(data.vad?.F)) {
              const vad_F = parseInt(data.vad.F);
              (reportData as any)[key].vad.F += vad_F;
              (reportData as any)[key].total.F += vad_F;
              (reportData as any)[key].bigtotal += vad_F;
            }
            if (!exclude.includes(data.vad?.M)) {
              const vad_M = parseInt(data.vad.M);
              (reportData as any)[key].vad.M += vad_M;
              (reportData as any)[key].total.M += vad_M;
              (reportData as any)[key].bigtotal += vad_M;
            }
            if (!exclude.includes(data.talk?.F)) {
              const talk_F = parseInt(data.talk.F);
              (reportData as any)[key].talk.F += talk_F;
              (reportData as any)[key].total.F += talk_F;
              (reportData as any)[key].bigtotal += talk_F;
            }
            if (!exclude.includes(data.talk?.M)) {
              const talk_M = parseInt(data.talk.M);
              (reportData as any)[key].talk.M += talk_M;
              (reportData as any)[key].total.M += talk_M;
              (reportData as any)[key].bigtotal += talk_M;
            }
            if (!exclude.includes(data.personal?.F)) {
              const personal_F = parseInt(data.personal.F);
              (reportData as any)[key].personal.F += personal_F;
              (reportData as any)[key].total.F += personal_F;
              (reportData as any)[key].bigtotal += personal_F;
            }
            if (!exclude.includes(data.personal?.M)) {
              const personal_M = parseInt(data.personal.M);
              (reportData as any)[key].personal.M += personal_M;
              (reportData as any)[key].total.M += personal_M;
              (reportData as any)[key].bigtotal += personal_M;
            }
          }
        } catch (e) {
          console.error(`Error processing ${key}${keySuffix}:`, e);
        }
      }
    }
  }

  processReports(summedReportDomains, '_domain');
  processReports(summedReportThemes, '_theme');

  const reco_names = reports
    .map((r) => r.reco)
    .reduce(
      (unique: { id: string; name: string; phone: string }[], r) => {
        if (r && !unique.find((i) => i.id === r.id)) {
          unique.push(r);
        }
        return unique;
      },
      []
    );

  const firstReport = reports[0];

  const outPutReport: IndicatorsDataOutput<PromotionReport> = {
    country: firstReport.country,
    region: firstReport.region,
    prefecture: firstReport.prefecture,
    commune: firstReport.commune,
    hospital: firstReport.hospital,
    district_quartier: firstReport.district_quartier,
    village_secteur: firstReport.village_secteur,
    reco: reco_names.length !== 1 ? null : reco_names[0],
    reco_asc_type: reco_names.length !== 1 ? 'ASC' : 'RECO',
    is_validate: reports.every((d) => d.is_validate),
    already_on_dhis2: reports.every((d) => d.already_on_dhis2),
    data: {
      domains: summedReportDomains,
      themes: summedReportThemes,
    } as any,
  };

  return outPutReport;
}

export async function TransformFamilyPlanningReports(reports: FamilyPlanningReport[]): Promise<IndicatorsDataOutput<FamilyPlanningReport> | undefined> {

  if (reports.length > 0) {
    const createOutput = (): FP_Utils => {
      return {
        label: '',
        nbr_new_user: 0,
        nbr_regular_user: 0,
        nbr_total_user: 0,
        nbr_delivered: 0,
        nbr_in_stock: 0,
        nbr_referred: 0,
        nbr_side_effect: 0,
      };
    }

    const summedReport: Record<string, FP_Utils> = {
      pill_coc: createOutput(),
      pill_cop: createOutput(),
      condoms: createOutput(),
      depo_provera_im: createOutput(),
      dmpa_sc: createOutput(),
      cycle_necklace: createOutput(),
      diu: createOutput(),
      implant: createOutput(),
      tubal_ligation: createOutput(),
    }

    const exclude = [undefined, null, 'undefined', 'null', '', ' ', '{}'];

    for (const key of Object.keys(summedReport)) {
      for (const report of reports) {
        try {
          const data = (report as any)?.[key];
          if (data) {
            for (const subKey of Object.keys(data)) {
              if (!exclude.includes(data[subKey])) {
                if (subKey == 'label') (summedReport as any)[key][subKey] = data[subKey];
                if (subKey != 'label') (summedReport as any)[key][subKey] += parseInt(data[subKey]);
              }
            }
          }
        } catch (e) {
          console.error(`Error processing ${key}`, e);
        }

      }
    }

    const reco_names = reports.map(r => r.reco).reduce((unique: { id: string, name: string, phone: string }[], r: { id: string, name: string, phone: string } | null) => {
      if (r && !(unique.find(i => i.id === r.id))) {
        unique.push(r);
      }
      return unique;
    }, []);

    const firstReport = reports[0];

    const outPutReport: IndicatorsDataOutput<FamilyPlanningReport> = {
      country: firstReport.country,
      region: firstReport.region,
      prefecture: firstReport.prefecture,
      commune: firstReport.commune,
      hospital: firstReport.hospital,
      district_quartier: firstReport.district_quartier,
      // chw: firstReport.chw,
      village_secteur: firstReport.village_secteur,
      reco: reco_names.length !== 1 ? null : reco_names[0],
      reco_asc_type: reco_names.length !== 1 ? 'ASC' : 'RECO',
      is_validate: reports.map(d => d.is_validate).reduce((acc, val) => val !== true ? acc + 1 : acc, 0) === 0,
      already_on_dhis2: reports.map(d => d.already_on_dhis2).reduce((acc, val) => val !== true ? acc + 1 : acc, 0) === 0,
      data: { methods: summedReport } as any
    };
    return outPutReport;
  }
  return;
}

export async function TransformMorbidityReports(reports: MorbidityReport[]): Promise<IndicatorsDataOutput<MorbidityReport> | undefined> {

  if (reports.length > 0) {
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
      for (const r of reports) {
        for (const sousCategory of Object.keys((r as any)[category])) {
          if (sousCategory === 'indicator') {
            if (!(sousCategory in summedReport[category])) {
              summedReport[category][sousCategory] = (r as any)[category][sousCategory];
            }
          } else {
            if (!(sousCategory in summedReport[category])) {
              summedReport[category][sousCategory] = 0;
            }
            if ((r as any)[category][sousCategory] == undefined) {
              summedReport[category][sousCategory] = undefined;
            } else {
              summedReport[category][sousCategory] += parseInt((r as any)[category][sousCategory]);
            }

          }
        }
      }
    }

    const reco_names = reports.map(r => r.reco).reduce((unique: { id: string, name: string, phone: string }[], r: { id: string, name: string, phone: string } | null) => {
      if (r && !(unique.find(i => i.id === r.id))) {
        unique.push(r);
      }
      return unique;
    }, []);

    const firstReport = reports[0];

    const outPutReport: IndicatorsDataOutput<MorbidityReport> = {
      country: firstReport.country,
      region: firstReport.region,
      prefecture: firstReport.prefecture,
      commune: firstReport.commune,
      hospital: firstReport.hospital,
      district_quartier: firstReport.district_quartier,
      // chw: firstReport.chw,
      village_secteur: firstReport.village_secteur,
      reco: reco_names.length !== 1 ? null : reco_names[0],
      reco_asc_type: reco_names.length !== 1 ? 'ASC' : 'RECO',
      is_validate: reports.map(d => d.is_validate).reduce((acc, val) => val !== true ? acc + 1 : acc, 0) === 0,
      already_on_dhis2: reports.map(d => d.already_on_dhis2).reduce((acc, val) => val !== true ? acc + 1 : acc, 0) === 0,
      data: summedReport
    };
    return outPutReport;
  }
  return;
}

export async function TransformHouseholdRecapReports(reports: HouseholdRecapReport[]): Promise<IndicatorsDataOutput<HouseholdRecapReport[]> | undefined> {

  if (reports.length > 0) {
    const reco_names = reports.map(r => r.reco).reduce((unique: { id: string, name: string, phone: string }[], r: { id: string, name: string, phone: string } | null) => {
      if (r !== null && !(unique.find(i => i !== null && i.id === r.id))) {
        unique.push(r);
      }
      return unique;
    }, []);

    const outPutData: any[] = (reports.map(r => {
      return {
        id: r.id,
        index: r.household_code.replaceAll('-', ''),//parseInt(r.household_code),
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
    })).sort((a, b) => a.index.localeCompare(b.index, 'fr', { sensitivity: 'base' }))

    // const totalData: any = {
    //   total_household_members: outPutData.map(d => d.total_household_members).reduce((total, num) => total + num, 0),
    //   total_women_15_50_years: outPutData.map(d => d.total_women_15_50_years).reduce((total, num) => total + num, 0),
    //   total_children_under_5_years: outPutData.map(d => d.total_children_under_5_years).reduce((total, num) => total + num, 0),
    //   total_children_0_12_months: outPutData.map(d => d.total_children_0_12_months).reduce((total, num) => total + num, 0),
    //   total_children_12_60_months: outPutData.map(d => d.total_children_12_60_months).reduce((total, num) => total + num, 0),
    //   has_functional_latrine: outPutData.map(d => d.has_functional_latrine).reduce((acc, val) => val === true ? acc + 1 : acc, 0),
    //   has_drinking_water_access: outPutData.map(d => d.has_drinking_water_access).reduce((acc, val) => val === true ? acc + 1 : acc, 0)
    // };

    const firstReport = reports[0];

    const outPutReport: IndicatorsDataOutput<HouseholdRecapReport[]> = {
      country: firstReport.country,
      region: firstReport.region,
      prefecture: firstReport.prefecture,
      commune: firstReport.commune,
      hospital: firstReport.hospital,
      district_quartier: firstReport.district_quartier,
      // chw: firstReport.chw,
      village_secteur: firstReport.village_secteur,
      reco: reco_names.length !== 1 ? null : reco_names[0],
      reco_asc_type: reco_names.length !== 1 ? 'ASC' : 'RECO',
      is_validate: reports.map(d => d.is_validate).reduce((acc, val) => val !== true ? acc + 1 : acc, 0) === 0,
      already_on_dhis2: reports.map(d => d.already_on_dhis2).reduce((acc, val) => val !== true ? acc + 1 : acc, 0) === 0,
      data: outPutData
    };
    return outPutReport;
  }
  return;
}

export async function TransformPcimneNewbornReports(reports: PcimneNewbornReport[]): Promise<IndicatorsDataOutput<PcimneNewbornReportUtils[]> | undefined> {

  if (reports.length > 0) {

    const createOutput = (): PcimneNewbornReportUtils => {
      return {
        index: 0,
        indicator: "",
        malaria_0_2: { F: null, M: null },
        malaria_2_12: { F: null, M: null },
        malaria_12_60: { F: null, M: null },
        cough_pneumonia_0_2: { F: null, M: null },
        cough_pneumonia_2_12: { F: null, M: null },
        cough_pneumonia_12_60: { F: null, M: null },
        diarrhea_0_2: { F: null, M: null },
        diarrhea_2_12: { F: null, M: null },
        diarrhea_12_60: { F: null, M: null },
        malnutrition_0_2: { F: null, M: null },
        malnutrition_2_12: { F: null, M: null },
        malnutrition_12_60: { F: null, M: null },
        total: { F: 0, M: 0 },
        bigtotal: 0
      };
    }

    const summedReport: Record<string, PcimneNewbornReportUtils> = {
      cases_received: createOutput(),
      given_rdt: createOutput(),
      positive_rdt: createOutput(),
      case_cta_treated: createOutput(),
      case_amoxicilline_treated: createOutput(),
      case_ors_zinc_treated: createOutput(),
      case_paracetamol_treated: createOutput(),
      case_24h_treated: createOutput(),
      followup_made: createOutput(),
      pre_referal_traitment: createOutput(),
      referal_case: createOutput(),
      case_malnutrition_detected: createOutput(),
      case_cough_detected: createOutput(),
      counter_referrals_received: createOutput(),
      deaths_registered: createOutput(),
    }

    const exclude = [undefined, null, 'undefined', 'null', '', ' ', '{}'];


    for (const key of Object.keys(summedReport)) {
      for (const report of reports) {
        try {
          const data = (report as any)?.[key];
          if (data) {
            for (const subKey of Object.keys(data)) {
              if (subKey == 'index' && !exclude.includes(data[subKey])) (summedReport as any)[key][subKey] = data[subKey];
              if (subKey == 'indicator' && !exclude.includes(data[subKey])) (summedReport as any)[key][subKey] = data[subKey];
              if (!['index', 'indicator'].includes(subKey) && !exclude.includes(data[subKey])) {
                if (data[subKey].F != null) {
                  const female = parseInt(data[subKey].F);
                  if ((summedReport as any)[key][subKey].F == null) (summedReport as any)[key][subKey].F = 0;
                  (summedReport as any)[key][subKey].F += female;
                  (summedReport as any)[key].total.F += female;
                  (summedReport as any)[key].bigtotal += female;
                }
                if (data[subKey].M != null) {
                  const male = parseInt(data[subKey].M);
                  if ((summedReport as any)[key][subKey].M == null) (summedReport as any)[key][subKey].M = 0;
                  (summedReport as any)[key][subKey].M += male;
                  (summedReport as any)[key].total.M += male;
                  (summedReport as any)[key].bigtotal += male;
                }
              }
            }
          }
        } catch (e) {
          console.error(`Error processing ${key}`, e);
        }

      }
    }

    const dataToOut: PcimneNewbornReportUtils[] = Object.entries(summedReport).map(([key, value]) => value);

    const reco_names = reports.map(r => r.reco).reduce((unique: { id: string, name: string, phone: string }[], r: { id: string, name: string, phone: string } | null) => {
      if (r && !(unique.find(i => i.id === r.id))) {
        unique.push(r);
      }
      return unique;
    }, []);

    const firstReport = reports[0];

    const outPutReport: IndicatorsDataOutput<PcimneNewbornReportUtils[]> = {
      country: firstReport.country,
      region: firstReport.region,
      prefecture: firstReport.prefecture,
      commune: firstReport.commune,
      hospital: firstReport.hospital,
      district_quartier: firstReport.district_quartier,
      // chw: firstReport.chw,
      village_secteur: firstReport.village_secteur,
      reco: reco_names.length !== 1 ? null : reco_names[0],
      reco_asc_type: reco_names.length !== 1 ? 'ASC' : 'RECO',
      is_validate: reports.map(d => d.is_validate).reduce((acc, val) => val !== true ? acc + 1 : acc, 0) === 0,
      already_on_dhis2: reports.map(d => d.already_on_dhis2).reduce((acc, val) => val !== true ? acc + 1 : acc, 0) === 0,
      data: dataToOut.sort((a, b) => a.index - b.index),
    }
    return outPutReport;
  }
  return;
}

export async function TransformRecoMegSituationReports(reports: RecoMegSituationReport[]): Promise<IndicatorsDataOutput<RecoMegQuantityUtils[]> | undefined> {

  if (reports.length > 0) {

    const createOutput = (): RecoMegQuantityUtils => {
      return {
        index: 0,
        label: '',
        month_beginning: 0,
        month_received: 0,
        month_total_start: 0,
        month_consumption: 0,
        month_theoreticaly: 0,
        month_inventory: 0,
        month_loss: 0,
        month_damaged: 0,
        month_broken: 0,
        month_expired: 0,
      };
    }

    const summedReport: Record<string, RecoMegQuantityUtils> = {
      amoxicillin_250mg: createOutput(),
      amoxicillin_500mg: createOutput(),
      paracetamol_100mg: createOutput(),
      paracetamol_250mg: createOutput(),
      paracetamol_500mg: createOutput(),
      mebendazol_250mg: createOutput(),
      mebendazol_500mg: createOutput(),
      ors: createOutput(),
      zinc: createOutput(),
      cta_nn: createOutput(),
      cta_pe: createOutput(),
      cta_ge: createOutput(),
      cta_ad: createOutput(),
      tdr: createOutput(),
      vitamin_a: createOutput(),
      pill_coc: createOutput(),
      pill_cop: createOutput(),
      condoms: createOutput(),
      dmpa_sc: createOutput(),
      implant: createOutput(),
    }
    const exclude = [undefined, null, 'undefined', 'null', '', ' ', '{}'];

    for (const key of Object.keys(summedReport)) {
      for (const report of reports) {
        try {
          const data = (report as any)?.[key];
          if (data) {
            for (const subKey of Object.keys(data)) {
              if (!exclude.includes(data[subKey])) {
                if (subKey == 'index') (summedReport as any)[key][subKey] = parseInt(data[subKey]);
                if (subKey == 'label') (summedReport as any)[key][subKey] = data[subKey];
                if (!['index', 'label'].includes(subKey)) (summedReport as any)[key][subKey] += parseInt(data[subKey]);
              }
            }
          }
        } catch (e) {
          console.error(`Error processing ${key}`, e);
        }

      }
    }

    const reco_names = reports.map(r => r.reco).reduce((unique: { id: string, name: string, phone: string }[], r: { id: string, name: string, phone: string } | null) => {
      if (r && !(unique.find(i => i.id === r.id))) {
        unique.push(r);
      }
      return unique;
    }, []);

    const firstReport = reports[0];

    const outPutReport: IndicatorsDataOutput<RecoMegQuantityUtils[]> = {
      country: firstReport.country,
      region: firstReport.region,
      prefecture: firstReport.prefecture,
      commune: firstReport.commune,
      hospital: firstReport.hospital,
      district_quartier: firstReport.district_quartier,
      // chw: firstReport.chw,
      village_secteur: firstReport.village_secteur,
      reco: reco_names.length !== 1 ? null : reco_names[0],
      reco_asc_type: reco_names.length !== 1 ? 'ASC' : 'RECO',
      is_validate: reports.map(d => d.is_validate).reduce((acc, val) => val !== true ? acc + 1 : acc, 0) === 0,
      already_on_dhis2: reports.map(d => d.already_on_dhis2).reduce((acc, val) => val !== true ? acc + 1 : acc, 0) === 0,
      data: Object.values(summedReport).sort((a, b) => a.index - b.index)
    };
    return outPutReport;
  }
  return;
}