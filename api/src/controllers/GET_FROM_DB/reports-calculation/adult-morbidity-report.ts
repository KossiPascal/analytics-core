import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { AppDataSource } from "../../../data_source";
import { DataSource } from "typeorm";
import { MorbidityReport, getMorbidityReportRepository } from "../../../entities/Reports";
import { MorbidityUtils } from "../../../utils/Interfaces";
import { AdultData } from "../../../entities/_Adult-data";
import { RECOS_COUSTOM_QUERY } from "../../orgunit-query/org-units-coustom";
import { isvalidCta } from "../../../utils/functions";


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


function getMorbidityUtils<T>(data: T[] | any[], name:string, field: string) : MorbidityUtils {
    return {
        indicator: name,
        nbr_5_14_years: data.filter(a => a[field] === true && a.age_in_years >= 5 && a.age_in_years < 14).length,
        nbr_14_25_years: data.filter(a => a[field] === true && a.age_in_years >= 14 && a.age_in_years < 25).length,
        nbr_25_60_years: data.filter(a => a[field] === true && a.age_in_years >= 25 && a.age_in_years < 60).length,
        nbr_60_more_years: data.filter(a => a[field] === true && a.age_in_years >= 60).length,
        nbr_pregnant_woman: data.filter(a => a[field] === true && a.age_in_years >= 5 && a.is_pregnant === true).length,
        nbr_total: data.filter(a => a[field] === true && a.age_in_years >= 5).length,
        nbr_referred: data.filter(a => a[field] === true && a.age_in_years >= 5 && a.is_referred === true).length,
    };
}

export async function ADULT_MORBIDITY_REPORTS_CALCULATION_DATA({ month, year }: { month: string, year: number }): Promise<{ status: number, ErrorsCount: number, SuccessCount: number, data: any, recos_length: number }> {
    const _repoReport = await getMorbidityReportRepository();
    const recos = await RECOS_COUSTOM_QUERY();
    const outPutData: { status: number, ErrorsCount: number, SuccessCount: number, data: any, recos_length: number } = { status: 201, ErrorsCount: 0, SuccessCount: 0, data: null, recos_length: recos.length };
    const __adults: any[] = await Connection.query(`SELECT * FROM adult_data WHERE month = $1 AND year = $2`, [month, year]);

    for (const reco of recos) {
        try {
            const adults: AdultData[] = __adults.filter(a => a.reco_id === reco.id);

            const hp_circulation_accident = getMorbidityUtils(adults, 'Accident de circulation', 'traffic_accident');
            const hp_burn = getMorbidityUtils(adults, 'Brûlure', 'burns');
            const hp_suspected_tb_cases = getMorbidityUtils(adults, 'Cas suspects de TB', 'suspected_tb');

            const hp_dermatosis = getMorbidityUtils(adults, 'Dermatose', 'dermatosis');
            const hp_diarrhea = getMorbidityUtils(adults, 'Diarrhées', 'diarrhea');
            const hp_urethral_discharge = getMorbidityUtils(adults, 'Ecoulement uretrale', 'urethral_discharge');
            const hp_vaginal_discharge = getMorbidityUtils(adults, 'Ecoulement vaginal', 'vaginal_discharge');
            const hp_urinary_loss = getMorbidityUtils(adults, 'Perte urinaire', 'loss_of_urine');
            const hp_accidental_caustic_products_ingestion = getMorbidityUtils(adults, 'Ingestion accidentelle des produits caustiques', 'accidental_ingestion_caustic_products');
            const hp_food_poisoning = getMorbidityUtils(adults, 'Intoxication alimentaire', 'food_poisoning');
            const hp_oral_diseases = getMorbidityUtils(adults, 'Maladies bucco-dentaires', 'oral_and_dental_diseases');
            const hp_dog_bite = getMorbidityUtils(adults, 'Morsure de chien', 'dog_bites');
            const hp_snake_bite = getMorbidityUtils(adults, 'Morsure de serpent', 'snake_bite');
            const hp_parasitosis = getMorbidityUtils(adults, 'Parasitose', 'parasitosis');
            const hp_measles = getMorbidityUtils(adults, 'Rougeole', 'measles');
            const hp_trauma = getMorbidityUtils(adults, 'Traumatisme', 'trauma');
            const hp_gender_based_violence = getMorbidityUtils(adults, 'Violence basées sur le genre (VBG)', 'gender_based_violence');
            
            // ##################################################
            const malaria_5_14_years = adults.filter(a => (a.malaria === true || a.has_malaria === true) && a.age_in_years >= 5 && a.age_in_years < 14);
            const malaria_14_25_years = adults.filter(a => (a.malaria === true || a.has_malaria === true) && a.age_in_years >= 14 && a.age_in_years < 25);
            const malaria_25_60_years = adults.filter(a => (a.malaria === true || a.has_malaria === true) && a.age_in_years >= 25 && a.age_in_years < 60);
            const malaria_60_more_years = adults.filter(a => (a.malaria === true || a.has_malaria === true) && a.age_in_years >= 60);
            const malaria_pregnant_woman = adults.filter(a => (a.malaria === true || a.has_malaria === true) && a.age_in_years >= 5 && a.is_pregnant === true);
            const malaria_total = adults.filter(a => (a.malaria === true || a.has_malaria === true) && a.age_in_years >= 5);
            const malaria_referred = adults.filter(a => (a.malaria === true || a.has_malaria === true) && a.age_in_years >= 5 && a.is_referred === true);


            const malaria_total_cases: MorbidityUtils = {
                indicator: 'Nombre total de cas',
                nbr_5_14_years: malaria_5_14_years.length,
                nbr_14_25_years: malaria_14_25_years.length,
                nbr_25_60_years: malaria_25_60_years.length,
                nbr_60_more_years: malaria_60_more_years.length,
                nbr_pregnant_woman: malaria_pregnant_woman.length,
                nbr_total: malaria_total.length,
                nbr_referred: malaria_referred.length
            };
            const malaria_rdt_performed: MorbidityUtils = {
                indicator: 'Nombre de TDR effectués',
                nbr_5_14_years: malaria_5_14_years.filter(a => a.rdt_given).length,
                nbr_14_25_years: malaria_14_25_years.filter(a => a.rdt_given).length,
                nbr_25_60_years: malaria_25_60_years.filter(a => a.rdt_given).length,
                nbr_60_more_years: malaria_60_more_years.filter(a => a.rdt_given).length,
                nbr_pregnant_woman: malaria_pregnant_woman.filter(a => a.rdt_given).length,
                nbr_total: malaria_total.filter(a => a.rdt_given).length,
                nbr_referred: malaria_referred.filter(a => a.rdt_given).length
            };
            const malaria_positive_rdts: MorbidityUtils = {
                indicator: 'Nombre de TDR positifs',
                nbr_5_14_years: malaria_5_14_years.filter(a => a.rdt_given && a.rdt_result === 'positive').length,
                nbr_14_25_years: malaria_14_25_years.filter(a => a.rdt_given && a.rdt_result === 'positive').length,
                nbr_25_60_years: malaria_25_60_years.filter(a => a.rdt_given && a.rdt_result === 'positive').length,
                nbr_60_more_years: malaria_60_more_years.filter(a => a.rdt_given && a.rdt_result === 'positive').length,
                nbr_pregnant_woman: malaria_pregnant_woman.filter(a => a.rdt_given && a.rdt_result === 'positive').length,
                nbr_total: malaria_total.filter(a => a.rdt_given && a.rdt_result === 'positive').length,
                nbr_referred: malaria_referred.filter(a => a.rdt_given && a.rdt_result === 'positive').length
            };
            // ##################################################
            const malaria_cases_treated_with_cta: MorbidityUtils = {
                indicator: 'Nombre de cas traités avec CTA',
                nbr_5_14_years: adults.filter(a => isvalidCta(a) && a.age_in_years >= 5 && a.age_in_years < 14).length,
                nbr_14_25_years: adults.filter(a => isvalidCta(a) && a.age_in_years >= 14 && a.age_in_years < 25).length,
                nbr_25_60_years: adults.filter(a => isvalidCta(a) && a.age_in_years >= 25 && a.age_in_years < 60).length,
                nbr_60_more_years: adults.filter(a => isvalidCta(a) && a.age_in_years >= 60).length,
                nbr_pregnant_woman: adults.filter(a => isvalidCta(a) && a.age_in_years >= 5 && a.is_pregnant === true).length,
                nbr_total: adults.filter(a => isvalidCta(a) && a.age_in_years >= 5).length,
                nbr_referred: adults.filter(a => isvalidCta(a) && a.age_in_years >= 5 && a.is_referred === true).length
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