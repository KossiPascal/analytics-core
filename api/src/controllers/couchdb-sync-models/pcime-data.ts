import { Repository } from "typeorm";
import { milisecond_to_date } from "../../utils/date-utils";
import { PcimneData, getPcimneDataRepository } from "../../entities/_Pcimne-data";
import { dataTransform, getSexe } from "../../utils/functions";


export async function SyncPcimneData(report: any, _repoPcimne: Repository<PcimneData> | null = null): Promise<boolean> {
    try {
        _repoPcimne = _repoPcimne ?? await getPcimneDataRepository();

        const reported_date = milisecond_to_date(report.reported_date, 'dateOnly');
        const month = (new Date(reported_date)).getMonth() + 1;
        const fields = report.fields;

        const _pcimne = new PcimneData();

        _pcimne.id = report._id;
        _pcimne.rev = report._rev;
        _pcimne.form = report.form;
        _pcimne.year = (new Date(reported_date)).getFullYear();
        _pcimne.month = month < 10 ? `0${month}` : `${month}`;

        _pcimne.sex = getSexe(fields.patient_sex);
        _pcimne.date_of_birth = fields.patient_date_of_birth;
        _pcimne.age_in_years = parseFloat(`${fields.patient_age_in_years}`);
        _pcimne.age_in_months = parseFloat(`${fields.patient_age_in_months}`);
        _pcimne.age_in_days = parseFloat(`${fields.patient_age_in_days}`);

        if (report.form === 'pcimne_register') {
            _pcimne.consultation_followup = 'consultation';
            _pcimne.promptitude = dataTransform(fields.promptitude, 'number');
            _pcimne.has_initial_danger_signs = dataTransform(fields.has_initial_danger_signs, 'null_false');
            _pcimne.has_fever = dataTransform(fields.has_fever, 'null_false');
            _pcimne.has_malaria = dataTransform(fields.has_malaria, 'null_false');
            _pcimne.has_cough_cold = dataTransform(fields.has_cough_cold, 'null_false');
            _pcimne.has_pneumonia = dataTransform(fields.has_pneumonia, 'null_false');
            _pcimne.has_normal_respiratory_rate = dataTransform(fields.has_normal_respiratory_rate, 'null_false');
            _pcimne.has_diarrhea = dataTransform(fields.has_diarrhea, 'null_false');
            _pcimne.has_malnutrition = dataTransform(fields.has_malnutrition, 'null_false');
            _pcimne.has_afp = dataTransform(fields.has_afp, 'null_false');
            _pcimne.is_danger_signs_referral = dataTransform(fields.is_danger_signs_referral, 'null_false');
            _pcimne.is_fever_referal = dataTransform(fields.is_fever_referal, 'null_false');
            _pcimne.is_cough_cold_referal = dataTransform(fields.is_cough_cold_referal, 'null_false');
            _pcimne.is_diarrhea_referal = dataTransform(fields.is_diarrhea_referal, 'null_false');
            _pcimne.is_malnutrition_referal = dataTransform(fields.is_malnutrition_referal, 'null_false');
            _pcimne.is_referred = dataTransform(fields.is_referred, 'null_false');
            _pcimne.temperature = dataTransform(fields.temperature, 'double');
            _pcimne.rdt_given = dataTransform(fields.rdt_given, 'null_false');
            _pcimne.rdt_result = dataTransform(fields.rdt_result, 'string')
            _pcimne.unable_drink_breastfeed = dataTransform(fields.unable_drink_breastfeed, 'null_false');
            _pcimne.vomits_everything = dataTransform(fields.vomits_everything, 'null_false');
            _pcimne.convulsions = dataTransform(fields.convulsions, 'null_false');
            _pcimne.sleepy_unconscious = dataTransform(fields.sleepy_unconscious, 'null_false');
            _pcimne.has_stiff_neck = dataTransform(fields.has_stiff_neck, 'null_false');
            _pcimne.has_bulging_fontanelle = dataTransform(fields.has_bulging_fontanelle, 'null_false');
            _pcimne.breathing_difficulty = dataTransform(fields.breathing_difficulty, 'null_false');
            _pcimne.cough_more_than_14days = dataTransform(fields.cough_more_than_14days, 'null_false');
            _pcimne.subcostal_indrawing = dataTransform(fields.subcostal_indrawing, 'null_false');
            _pcimne.wheezing = dataTransform(fields.wheezing, 'null_false');
            _pcimne.bloody_diarrhea = dataTransform(fields.bloody_diarrhea, 'null_false');
            _pcimne.diarrhea_more_than_14_days = dataTransform(fields.diarrhea_more_than_14_days, 'null_false');
            _pcimne.blood_in_stool = dataTransform(fields.blood_in_stool, 'null_false');
            _pcimne.restless = dataTransform(fields.restless, 'null_false');
            _pcimne.drinks_hungrily = dataTransform(fields.drinks_hungrily, 'null_false');
            _pcimne.sunken_eyes = dataTransform(fields.sunken_eyes, 'null_false');
            _pcimne.has_edema = dataTransform(fields.has_edema, 'null_false');
            _pcimne.is_principal_referal = dataTransform(fields.is_principal_referal, 'null_false');
            _pcimne.has_health_problem = dataTransform(fields.has_health_problem, 'null_false');
            _pcimne.has_serious_malaria = dataTransform(fields.has_serious_malaria, 'null_false');
            _pcimne.has_pre_reference_treatments = dataTransform(fields.has_pre_reference_treatments, 'null_false');

            _pcimne.cta = dataTransform(fields.cta_quantity, 'number');
            _pcimne.amoxicillin_250mg = dataTransform(fields.amoxicillin_250mg_quantity, 'number');
            _pcimne.amoxicillin_500mg = dataTransform(fields.amoxicillin_500mg_quantity, 'number');
            _pcimne.paracetamol_250mg = dataTransform(fields.paracetamol_250mg_quantity, 'number');
            _pcimne.paracetamol_500mg = dataTransform(fields.paracetamol_500mg_quantity, 'number');
            _pcimne.mebendazol_250mg = dataTransform(fields.mebendazole_250mg_quantity, 'number');
            _pcimne.mebendazol_500mg = dataTransform(fields.mebendazole_500mg_quantity, 'number');
            _pcimne.ors_zinc = dataTransform(fields.ors_zinc_quantity, 'number');
            _pcimne.vitamin_a = dataTransform(fields.vitamin_a_quantity, 'number');
            _pcimne.tetracycline_ointment = dataTransform(fields.tetracycline_ointment_quantity, 'number');
        }

        if (report.form === 'pcimne_followup') {
            _pcimne.consultation_followup = 'followup';
            _pcimne.is_present = dataTransform(fields.is_present, 'null_false');
            _pcimne.absence_reasons = dataTransform(fields.absence_reasons, 'string');
            _pcimne.went_to_health_center = dataTransform(fields.went_to_health_center, 'null_false');
            _pcimne.coupon_available = dataTransform(fields.coupon_available, 'null_false');
            _pcimne.coupon_number = dataTransform(fields.coupon_number, 'string');
            _pcimne.has_no_improvement = dataTransform(fields.has_no_improvement, 'null_false');
            _pcimne.has_getting_worse = dataTransform(fields.has_getting_worse, 'null_false');
            _pcimne.has_pre_reference_treatments = dataTransform(fields.has_pre_reference_treatments, 'null_false');
            _pcimne.is_referred = dataTransform(fields.is_referred, 'null_false');
        }

        _pcimne.country = fields.country_id;
        _pcimne.region = fields.region_id;
        _pcimne.prefecture = fields.prefecture_id;
        _pcimne.commune = fields.commune_id;
        _pcimne.hospital = fields.hospital_id;
        _pcimne.district_quartier = fields.district_quartier_id;
        _pcimne.village_secteur = fields.village_secteur_id;
        _pcimne.family = fields.household_id;
        _pcimne.reco = fields.user_id;
        _pcimne.patient = fields.patient_id;
        _pcimne.reported_date_timestamp = report.reported_date;
        _pcimne.reported_date = reported_date;
        _pcimne.reported_full_date = milisecond_to_date(report.reported_date, 'fulldate');
        _pcimne.geolocation = report.geolocation;

        await _repoPcimne.save(_pcimne);
        return true;
    } catch (err: any) {
        return false;
    }
}