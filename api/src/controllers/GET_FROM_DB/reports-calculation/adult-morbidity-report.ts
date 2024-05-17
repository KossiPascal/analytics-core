import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { AppDataSource } from "../../../data_source";
import { DataSource } from "typeorm";
import { MorbidityReport, getMorbidityReportRepository } from "../../../entities/Reports";
import { MorbidityUtils, RecoCoustomQuery } from "../../../utils/Interfaces";
import { AdultData } from "../../../entities/_Adult-data";
import { RECOS_COUSTOM_QUERY } from "../../orgunit-query/org-units-coustom";


let Connection: DataSource = AppDataSource.manager.connection;

export async function ADULT_MORBIDITY_REPORTS_CALCULATION(req: Request, res: Response, next: NextFunction): Promise<any> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(201).json({ status: 201, data: 'Informations you provided are not valid' });
    }
    var { month, year } = req.body;
    const outPutData = await ADULT_MORBIDITY_REPORTS_CALCULATION_DATA({ month, year });

    if (outPutData.SuccessCount === outPutData.recos_length || outPutData.ErrorsCount === outPutData.recos_length || (outPutData.ErrorsCount + outPutData.SuccessCount) === outPutData.recos_length) {
        outPutData.status = 200;
        // outPutData.data =  await Connection.query(`SELECT * FROM chws_reco_report WHERE month = $1 AND year = $2`, [month, year]);
        return res.status(200).json(outPutData);
    }
}

export async function ADULT_MORBIDITY_REPORTS_CALCULATION_DATA({ month, year }: { month: string, year: number }): Promise<{ status: number, ErrorsCount: number, SuccessCount: number, data: any, recos_length: number }> {
    const _repoReport = await getMorbidityReportRepository();
    const recos: RecoCoustomQuery[] = await RECOS_COUSTOM_QUERY();
    const outPutData: { status: number, ErrorsCount: number, SuccessCount: number, data: any, recos_length: number } = { status: 201, ErrorsCount: 0, SuccessCount: 0, data: null, recos_length: recos.length };
    const __adults: any[] = await Connection.query(`SELECT * FROM adult_data WHERE month = $1 AND year = $2`, [month, year]);

    for (const reco of recos) {
        try {
            const adults: AdultData[] = __adults.filter(a => a.reco_id === reco.id);

            const hp_circulation_accident: MorbidityUtils = {
                indicator: 'Accident de circulation',
                nbr_5_14_years: adults.filter(a => a.traffic_accident === true && a.age_in_years >= 5 && a.age_in_years < 14).length,
                nbr_14_25_years: adults.filter(a => a.traffic_accident === true && a.age_in_years >= 14 && a.age_in_years < 25).length,
                nbr_25_60_years: adults.filter(a => a.traffic_accident === true && a.age_in_years >= 25 && a.age_in_years < 60).length,
                nbr_60_more_years: adults.filter(a => a.traffic_accident === true && a.age_in_years >= 60).length,
                nbr_pregnant_woman: adults.filter(a => a.traffic_accident === true && a.age_in_years >= 5 && a.is_pregnant === true).length,
                nbr_total: adults.filter(a => a.traffic_accident === true && a.age_in_years >= 5).length,
                nbr_referred: adults.filter(a => a.traffic_accident === true && a.age_in_years >= 5 && a.is_referred === true).length,
            };
            const hp_burn: MorbidityUtils = {
                indicator: 'Brûlure',
                nbr_5_14_years: adults.filter(a => a.burns === true && a.age_in_years >= 5 && a.age_in_years < 14).length,
                nbr_14_25_years: adults.filter(a => a.burns === true && a.age_in_years >= 14 && a.age_in_years < 25).length,
                nbr_25_60_years: adults.filter(a => a.burns === true && a.age_in_years >= 25 && a.age_in_years < 60).length,
                nbr_60_more_years: adults.filter(a => a.burns === true && a.age_in_years >= 60).length,
                nbr_pregnant_woman: adults.filter(a => a.burns === true && a.age_in_years >= 5 && a.is_pregnant === true).length,
                nbr_total: adults.filter(a => a.burns === true && a.age_in_years >= 5).length,
                nbr_referred: adults.filter(a => a.burns === true && a.age_in_years >= 5 && a.is_referred === true).length
            };
            const hp_suspected_tb_cases: MorbidityUtils = {
                indicator: 'Cas suspects de TB',
                nbr_5_14_years: adults.filter(a => a.suspected_tb === true && a.age_in_years >= 5 && a.age_in_years < 14).length,
                nbr_14_25_years: adults.filter(a => a.suspected_tb === true && a.age_in_years >= 14 && a.age_in_years < 25).length,
                nbr_25_60_years: adults.filter(a => a.suspected_tb === true && a.age_in_years >= 25 && a.age_in_years < 60).length,
                nbr_60_more_years: adults.filter(a => a.suspected_tb === true && a.age_in_years >= 60).length,
                nbr_pregnant_woman: adults.filter(a => a.suspected_tb === true && a.age_in_years >= 5 && a.is_pregnant === true).length,
                nbr_total: adults.filter(a => a.suspected_tb === true && a.age_in_years >= 5).length,
                nbr_referred: adults.filter(a => a.suspected_tb === true && a.age_in_years >= 5 && a.is_referred === true).length
            };
            const hp_dermatosis: MorbidityUtils = {
                indicator: 'Dermatose',
                nbr_5_14_years: adults.filter(a => a.dermatosis === true && a.age_in_years >= 5 && a.age_in_years < 14).length,
                nbr_14_25_years: adults.filter(a => a.dermatosis === true && a.age_in_years >= 14 && a.age_in_years < 25).length,
                nbr_25_60_years: adults.filter(a => a.dermatosis === true && a.age_in_years >= 25 && a.age_in_years < 60).length,
                nbr_60_more_years: adults.filter(a => a.dermatosis === true && a.age_in_years >= 60).length,
                nbr_pregnant_woman: adults.filter(a => a.dermatosis === true && a.age_in_years >= 5 && a.is_pregnant === true).length,
                nbr_total: adults.filter(a => a.dermatosis === true && a.age_in_years >= 5).length,
                nbr_referred: adults.filter(a => a.dermatosis === true && a.age_in_years >= 5 && a.is_referred === true).length
            };
            const hp_diarrhea: MorbidityUtils = {
                indicator: 'Diarrhées',
                nbr_5_14_years: adults.filter(a => (a.diarrhea === true || a.has_diarrhea === true) && a.age_in_years >= 5 && a.age_in_years < 14).length,
                nbr_14_25_years: adults.filter(a => (a.diarrhea === true || a.has_diarrhea === true) && a.age_in_years >= 14 && a.age_in_years < 25).length,
                nbr_25_60_years: adults.filter(a => (a.diarrhea === true || a.has_diarrhea === true) && a.age_in_years >= 25 && a.age_in_years < 60).length,
                nbr_60_more_years: adults.filter(a => (a.diarrhea === true || a.has_diarrhea === true) && a.age_in_years >= 60).length,
                nbr_pregnant_woman: adults.filter(a => (a.diarrhea === true || a.has_diarrhea === true) && a.age_in_years >= 5 && a.is_pregnant === true).length,
                nbr_total: adults.filter(a => (a.diarrhea === true || a.has_diarrhea === true) && a.age_in_years >= 5).length,
                nbr_referred: adults.filter(a => (a.diarrhea === true || a.has_diarrhea === true) && a.age_in_years >= 5 && a.is_referred === true).length
            };
            const hp_urethral_discharge: MorbidityUtils = {
                indicator: 'Ecoulement uretrale',
                nbr_5_14_years: adults.filter(a => a.urethral_discharge === true && a.age_in_years >= 5 && a.age_in_years < 14).length,
                nbr_14_25_years: adults.filter(a => a.urethral_discharge === true && a.age_in_years >= 14 && a.age_in_years < 25).length,
                nbr_25_60_years: adults.filter(a => a.urethral_discharge === true && a.age_in_years >= 25 && a.age_in_years < 60).length,
                nbr_60_more_years: adults.filter(a => a.urethral_discharge === true && a.age_in_years >= 60).length,
                nbr_pregnant_woman: adults.filter(a => a.urethral_discharge === true && a.age_in_years >= 5 && a.is_pregnant === true).length,
                nbr_total: adults.filter(a => a.urethral_discharge === true && a.age_in_years >= 5).length,
                nbr_referred: adults.filter(a => a.urethral_discharge === true && a.age_in_years >= 5 && a.is_referred === true).length
            };
            const hp_vaginal_discharge: MorbidityUtils = {
                indicator: 'Ecoulement vaginal',
                nbr_5_14_years: adults.filter(a => a.vaginal_discharge === true && a.age_in_years >= 5 && a.age_in_years < 14).length,
                nbr_14_25_years: adults.filter(a => a.vaginal_discharge === true && a.age_in_years >= 14 && a.age_in_years < 25).length,
                nbr_25_60_years: adults.filter(a => a.vaginal_discharge === true && a.age_in_years >= 25 && a.age_in_years < 60).length,
                nbr_60_more_years: adults.filter(a => a.vaginal_discharge === true && a.age_in_years >= 60).length,
                nbr_pregnant_woman: adults.filter(a => a.vaginal_discharge === true && a.age_in_years >= 5 && a.is_pregnant === true).length,
                nbr_total: adults.filter(a => a.vaginal_discharge === true && a.age_in_years >= 5).length,
                nbr_referred: adults.filter(a => a.vaginal_discharge === true && a.age_in_years >= 5 && a.is_referred === true).length
            };
            const hp_urinary_loss: MorbidityUtils = {
                indicator: 'Perte urinaire',
                nbr_5_14_years: adults.filter(a => a.loss_of_urine === true && a.age_in_years >= 5 && a.age_in_years < 14).length,
                nbr_14_25_years: adults.filter(a => a.loss_of_urine === true && a.age_in_years >= 14 && a.age_in_years < 25).length,
                nbr_25_60_years: adults.filter(a => a.loss_of_urine === true && a.age_in_years >= 25 && a.age_in_years < 60).length,
                nbr_60_more_years: adults.filter(a => a.loss_of_urine === true && a.age_in_years >= 60).length,
                nbr_pregnant_woman: adults.filter(a => a.loss_of_urine === true && a.age_in_years >= 5 && a.is_pregnant === true).length,
                nbr_total: adults.filter(a => a.loss_of_urine === true && a.age_in_years >= 5).length,
                nbr_referred: adults.filter(a => a.loss_of_urine === true && a.age_in_years >= 5 && a.is_referred === true).length
            };
            const hp_accidental_caustic_products_ingestion: MorbidityUtils = {
                indicator: 'Ingestion accidentelle des produits caustiques',
                nbr_5_14_years: adults.filter(a => a.accidental_ingestion_caustic_products === true && a.age_in_years >= 5 && a.age_in_years < 14).length,
                nbr_14_25_years: adults.filter(a => a.accidental_ingestion_caustic_products === true && a.age_in_years >= 14 && a.age_in_years < 25).length,
                nbr_25_60_years: adults.filter(a => a.accidental_ingestion_caustic_products === true && a.age_in_years >= 25 && a.age_in_years < 60).length,
                nbr_60_more_years: adults.filter(a => a.accidental_ingestion_caustic_products === true && a.age_in_years >= 60).length,
                nbr_pregnant_woman: adults.filter(a => a.accidental_ingestion_caustic_products === true && a.age_in_years >= 5 && a.is_pregnant === true).length,
                nbr_total: adults.filter(a => a.accidental_ingestion_caustic_products === true && a.age_in_years >= 5).length,
                nbr_referred: adults.filter(a => a.accidental_ingestion_caustic_products === true && a.age_in_years >= 5 && a.is_referred === true).length
            };
            const hp_food_poisoning: MorbidityUtils = {
                indicator: 'Intoxication alimentaire',
                nbr_5_14_years: adults.filter(a => a.food_poisoning === true && a.age_in_years >= 5 && a.age_in_years < 14).length,
                nbr_14_25_years: adults.filter(a => a.food_poisoning === true && a.age_in_years >= 14 && a.age_in_years < 25).length,
                nbr_25_60_years: adults.filter(a => a.food_poisoning === true && a.age_in_years >= 25 && a.age_in_years < 60).length,
                nbr_60_more_years: adults.filter(a => a.food_poisoning === true && a.age_in_years >= 60).length,
                nbr_pregnant_woman: adults.filter(a => a.food_poisoning === true && a.age_in_years >= 5 && a.is_pregnant === true).length,
                nbr_total: adults.filter(a => a.food_poisoning === true && a.age_in_years >= 5).length,
                nbr_referred: adults.filter(a => a.food_poisoning === true && a.age_in_years >= 5 && a.is_referred === true).length
            };
            const hp_oral_diseases: MorbidityUtils = {
                indicator: 'Maladies bucco-dentaires',
                nbr_5_14_years: adults.filter(a => a.oral_and_dental_diseases === true && a.age_in_years >= 5 && a.age_in_years < 14).length,
                nbr_14_25_years: adults.filter(a => a.oral_and_dental_diseases === true && a.age_in_years >= 14 && a.age_in_years < 25).length,
                nbr_25_60_years: adults.filter(a => a.oral_and_dental_diseases === true && a.age_in_years >= 25 && a.age_in_years < 60).length,
                nbr_60_more_years: adults.filter(a => a.oral_and_dental_diseases === true && a.age_in_years >= 60).length,
                nbr_pregnant_woman: adults.filter(a => a.oral_and_dental_diseases === true && a.age_in_years >= 5 && a.is_pregnant === true).length,
                nbr_total: adults.filter(a => a.oral_and_dental_diseases === true && a.age_in_years >= 5).length,
                nbr_referred: adults.filter(a => a.oral_and_dental_diseases === true && a.age_in_years >= 5 && a.is_referred === true).length
            };
            const hp_dog_bite: MorbidityUtils = {
                indicator: 'Morsure de chien',
                nbr_5_14_years: adults.filter(a => a.dog_bites === true && a.age_in_years >= 5 && a.age_in_years < 14).length,
                nbr_14_25_years: adults.filter(a => a.dog_bites === true && a.age_in_years >= 14 && a.age_in_years < 25).length,
                nbr_25_60_years: adults.filter(a => a.dog_bites === true && a.age_in_years >= 25 && a.age_in_years < 60).length,
                nbr_60_more_years: adults.filter(a => a.dog_bites === true && a.age_in_years >= 60).length,
                nbr_pregnant_woman: adults.filter(a => a.dog_bites === true && a.age_in_years >= 5 && a.is_pregnant === true).length,
                nbr_total: adults.filter(a => a.dog_bites === true && a.age_in_years >= 5).length,
                nbr_referred: adults.filter(a => a.dog_bites === true && a.age_in_years >= 5 && a.is_referred === true).length
            };
            const hp_snake_bite: MorbidityUtils = {
                indicator: 'Morsure de serpent',
                nbr_5_14_years: adults.filter(a => a.snake_bite === true && a.age_in_years >= 5 && a.age_in_years < 14).length,
                nbr_14_25_years: adults.filter(a => a.snake_bite === true && a.age_in_years >= 14 && a.age_in_years < 25).length,
                nbr_25_60_years: adults.filter(a => a.snake_bite === true && a.age_in_years >= 25 && a.age_in_years < 60).length,
                nbr_60_more_years: adults.filter(a => a.snake_bite === true && a.age_in_years >= 60).length,
                nbr_pregnant_woman: adults.filter(a => a.snake_bite === true && a.age_in_years >= 5 && a.is_pregnant === true).length,
                nbr_total: adults.filter(a => a.snake_bite === true && a.age_in_years >= 5).length,
                nbr_referred: adults.filter(a => a.snake_bite === true).length,
            };
            const hp_parasitosis: MorbidityUtils = {
                indicator: 'Parasitose',
                nbr_5_14_years: adults.filter(a => a.parasitosis === true && a.age_in_years >= 5 && a.age_in_years < 14).length,
                nbr_14_25_years: adults.filter(a => a.parasitosis === true && a.age_in_years >= 14 && a.age_in_years < 25).length,
                nbr_25_60_years: adults.filter(a => a.parasitosis === true && a.age_in_years >= 25 && a.age_in_years < 60).length,
                nbr_60_more_years: adults.filter(a => a.parasitosis === true && a.age_in_years >= 60).length,
                nbr_pregnant_woman: adults.filter(a => a.parasitosis === true && a.age_in_years >= 5 && a.is_pregnant === true).length,
                nbr_total: adults.filter(a => a.parasitosis === true && a.age_in_years >= 5).length,
                nbr_referred: adults.filter(a => a.parasitosis === true && a.age_in_years >= 5 && a.is_referred === true).length
            };
            const hp_measles: MorbidityUtils = {
                indicator: 'Rougeole',
                nbr_5_14_years: adults.filter(a => a.measles === true && a.age_in_years >= 5 && a.age_in_years < 14).length,
                nbr_14_25_years: adults.filter(a => a.measles === true && a.age_in_years >= 14 && a.age_in_years < 25).length,
                nbr_25_60_years: adults.filter(a => a.measles === true && a.age_in_years >= 25 && a.age_in_years < 60).length,
                nbr_60_more_years: adults.filter(a => a.measles === true && a.age_in_years >= 60).length,
                nbr_pregnant_woman: adults.filter(a => a.measles === true && a.age_in_years >= 5 && a.is_pregnant === true).length,
                nbr_total: adults.filter(a => a.measles === true && a.age_in_years >= 5).length,
                nbr_referred: adults.filter(a => a.measles === true && a.age_in_years >= 5 && a.is_referred === true).length
            };
            const hp_trauma: MorbidityUtils = {
                indicator: 'Traumatisme',
                nbr_5_14_years: adults.filter(a => a.trauma === true && a.age_in_years >= 5 && a.age_in_years < 14).length,
                nbr_14_25_years: adults.filter(a => a.trauma === true && a.age_in_years >= 14 && a.age_in_years < 25).length,
                nbr_25_60_years: adults.filter(a => a.trauma === true && a.age_in_years >= 25 && a.age_in_years < 60).length,
                nbr_60_more_years: adults.filter(a => a.trauma === true && a.age_in_years >= 60).length,
                nbr_pregnant_woman: adults.filter(a => a.trauma === true && a.age_in_years >= 5 && a.is_pregnant === true).length,
                nbr_total: adults.filter(a => a.trauma === true && a.age_in_years >= 5).length,
                nbr_referred: adults.filter(a => a.trauma === true && a.age_in_years >= 5 && a.is_referred === true).length
            };
            const hp_gender_based_violence: MorbidityUtils = {
                indicator: 'Violence basées sur le genre (VBG)',
                nbr_5_14_years: adults.filter(a => a.gender_based_violence === true && a.age_in_years >= 5 && a.age_in_years < 14).length,
                nbr_14_25_years: adults.filter(a => a.gender_based_violence === true && a.age_in_years >= 14 && a.age_in_years < 25).length,
                nbr_25_60_years: adults.filter(a => a.gender_based_violence === true && a.age_in_years >= 25 && a.age_in_years < 60).length,
                nbr_60_more_years: adults.filter(a => a.gender_based_violence === true && a.age_in_years >= 60).length,
                nbr_pregnant_woman: adults.filter(a => a.gender_based_violence === true && a.age_in_years >= 5 && a.is_pregnant === true).length,
                nbr_total: adults.filter(a => a.gender_based_violence === true && a.age_in_years >= 5).length,
                nbr_referred: adults.filter(a => a.gender_based_violence === true && a.age_in_years >= 5 && a.is_referred === true).length
            };

            const malaria_total_cases: MorbidityUtils = {
                indicator: 'Nombre total de cas',
                nbr_5_14_years: adults.filter(a => (a.malaria === true || a.has_malaria === true) && a.age_in_years >= 5 && a.age_in_years < 14).length,
                nbr_14_25_years: adults.filter(a => (a.malaria === true || a.has_malaria === true) && a.age_in_years >= 14 && a.age_in_years < 25).length,
                nbr_25_60_years: adults.filter(a => (a.malaria === true || a.has_malaria === true) && a.age_in_years >= 25 && a.age_in_years < 60).length,
                nbr_60_more_years: adults.filter(a => (a.malaria === true || a.has_malaria === true) && a.age_in_years >= 60).length,
                nbr_pregnant_woman: adults.filter(a => (a.malaria === true || a.has_malaria === true) && a.age_in_years >= 5 && a.is_pregnant === true).length,
                nbr_total: adults.filter(a => (a.malaria === true || a.has_malaria === true) && a.age_in_years >= 5).length,
                nbr_referred: adults.filter(a => (a.malaria === true || a.has_malaria === true) && a.age_in_years >= 5 && a.is_referred === true).length
            };
            const malaria_rdt_performed: MorbidityUtils = {
                indicator: 'Nombre de TDR effectués',
                nbr_5_14_years: adults.filter(a => (a.malaria === true || a.has_malaria === true) && a.rdt_given && a.age_in_years >= 5 && a.age_in_years < 14).length,
                nbr_14_25_years: adults.filter(a => (a.malaria === true || a.has_malaria === true) && a.rdt_given && a.age_in_years >= 14 && a.age_in_years < 25).length,
                nbr_25_60_years: adults.filter(a => (a.malaria === true || a.has_malaria === true) && a.rdt_given && a.age_in_years >= 25 && a.age_in_years < 60).length,
                nbr_60_more_years: adults.filter(a => (a.malaria === true || a.has_malaria === true) && a.rdt_given && a.age_in_years >= 60).length,
                nbr_pregnant_woman: adults.filter(a => (a.malaria === true || a.has_malaria === true) && a.rdt_given && a.age_in_years >= 5 && a.is_pregnant === true).length,
                nbr_total: adults.filter(a => (a.malaria === true || a.has_malaria === true) && a.rdt_given && a.age_in_years >= 5).length,
                nbr_referred: adults.filter(a => (a.malaria === true || a.has_malaria === true) && a.rdt_given && a.age_in_years >= 5 && a.is_referred === true).length
            };
            const malaria_positive_rdts: MorbidityUtils = {
                indicator: 'Nombre de TDR positifs',
                nbr_5_14_years: adults.filter(a => (a.malaria === true || a.has_malaria === true) && a.rdt_given && a.rdt_result === 'positive' && a.age_in_years >= 5 && a.age_in_years < 14).length,
                nbr_14_25_years: adults.filter(a => (a.malaria === true || a.has_malaria === true) && a.rdt_given && a.rdt_result === 'positive' && a.age_in_years >= 14 && a.age_in_years < 25).length,
                nbr_25_60_years: adults.filter(a => (a.malaria === true || a.has_malaria === true) && a.rdt_given && a.rdt_result === 'positive' && a.age_in_years >= 25 && a.age_in_years < 60).length,
                nbr_60_more_years: adults.filter(a => (a.malaria === true || a.has_malaria === true) && a.rdt_given && a.rdt_result === 'positive' && a.age_in_years >= 60).length,
                nbr_pregnant_woman: adults.filter(a => (a.malaria === true || a.has_malaria === true) && a.rdt_given && a.rdt_result === 'positive' && a.age_in_years >= 5 && a.is_pregnant === true).length,
                nbr_total: adults.filter(a => (a.malaria === true || a.has_malaria === true) && a.rdt_given && a.rdt_result === 'positive' && a.age_in_years >= 5).length,
                nbr_referred: adults.filter(a => (a.malaria === true || a.has_malaria === true) && a.rdt_given && a.rdt_result === 'positive' && a.age_in_years >= 5 && a.is_referred === true).length
            };
            const malaria_cases_treated_with_cta: MorbidityUtils = {
                indicator: 'Nombre de cas traités avec CTA',
                nbr_5_14_years: adults.filter(a => a.cta !== null && a.cta > 0 && a.age_in_years >= 5 && a.age_in_years < 14).length,
                nbr_14_25_years: adults.filter(a => a.cta !== null && a.cta > 0 && a.age_in_years >= 14 && a.age_in_years < 25).length,
                nbr_25_60_years: adults.filter(a => a.cta !== null && a.cta > 0 && a.age_in_years >= 25 && a.age_in_years < 60).length,
                nbr_60_more_years: adults.filter(a => a.cta !== null && a.cta > 0 && a.age_in_years >= 60).length,
                nbr_pregnant_woman: adults.filter(a => a.cta !== null && a.cta > 0 && a.age_in_years >= 5 && a.is_pregnant === true).length,
                nbr_total: adults.filter(a => a.cta !== null && a.cta > 0 && a.age_in_years >= 5).length,
                nbr_referred: adults.filter(a => a.cta !== null && a.cta > 0 && a.age_in_years >= 5 && a.is_referred === true).length
            };


            const _morbidity = new MorbidityReport();

            _morbidity.id = `${month}-${year}-${reco.id}`;
            _morbidity.month = month;
            _morbidity.year = year;
            _morbidity.hp_circulation_accident = hp_circulation_accident;
            _morbidity.hp_burn = hp_burn;
            _morbidity.hp_suspected_tb_cases = hp_suspected_tb_cases;
            _morbidity.hp_dermatosis = hp_dermatosis;
            _morbidity.hp_diarrhea = hp_diarrhea;
            _morbidity.hp_urethral_discharge = hp_urethral_discharge;
            _morbidity.hp_vaginal_discharge = hp_vaginal_discharge;
            _morbidity.hp_urinary_loss = hp_urinary_loss;
            _morbidity.hp_accidental_caustic_products_ingestion = hp_accidental_caustic_products_ingestion;
            _morbidity.hp_food_poisoning = hp_food_poisoning;
            _morbidity.hp_oral_diseases = hp_oral_diseases;
            _morbidity.hp_dog_bite = hp_dog_bite;
            _morbidity.hp_snake_bite = hp_snake_bite;
            _morbidity.hp_parasitosis = hp_parasitosis;
            _morbidity.hp_measles = hp_measles;
            _morbidity.hp_trauma = hp_trauma;
            _morbidity.hp_gender_based_violence = hp_gender_based_violence;
            _morbidity.malaria_total_cases = malaria_total_cases;
            _morbidity.malaria_rdt_performed = malaria_rdt_performed;
            _morbidity.malaria_positive_rdts = malaria_positive_rdts;
            _morbidity.malaria_cases_treated_with_cta = malaria_cases_treated_with_cta;

            _morbidity.country = reco.country;
            _morbidity.region = reco.region;
            _morbidity.prefecture = reco.prefecture;
            _morbidity.commune = reco.commune;
            _morbidity.hospital = reco.hospital;
            _morbidity.district_quartier = reco.district_quartier;
            _morbidity.chw = reco.chw;
            _morbidity.village_secteur = reco.village_secteur;
            _morbidity.reco = { id: reco.id, name: reco.name, phone: reco.phone };

            await _repoReport.save(_morbidity);
            outPutData.SuccessCount += 1;
        } catch (err) {
            outPutData.ErrorsCount += 1;
        }
    }

    return outPutData;
}