import { Repository } from "typeorm";
import { milisecond_to_date } from "../../utils/date-utils";
import { NewbornData, getNewbornDataRepository } from "../../entities/_Newborn-data";
import { dataTransform, getSexe } from "../../utils/functions";


export async function SyncNewbornData(report: any, _repoNewborn: Repository<NewbornData> | null = null): Promise<boolean> {
    try {
        _repoNewborn = _repoNewborn ?? await getNewbornDataRepository();

        const reported_date = milisecond_to_date(report.reported_date, 'dateOnly');
        const month = (new Date(reported_date)).getMonth() + 1;
        const fields = report.fields;

        const _newborn = new NewbornData();

        _newborn.id = report._id;
        _newborn.rev = report._rev;
        _newborn.form = report.form;
        _newborn.year = (new Date(reported_date)).getFullYear();
        _newborn.month = month < 10 ? `0${month}` : `${month}`;

        _newborn.sex = getSexe(fields.patient_sex);
        _newborn.date_of_birth = fields.patient_date_of_birth;
        _newborn.age_in_years = parseFloat(`${fields.patient_age_in_years}`);
        _newborn.age_in_months = parseFloat(`${fields.patient_age_in_months}`);
        _newborn.age_in_days = parseFloat(`${fields.patient_age_in_days}`);

        if (report.form === 'newborn_register') {
            _newborn.consultation_followup = 'consultation';
            _newborn.promptitude = dataTransform(fields.promptitude, 'number');
            _newborn.is_referred = dataTransform(fields.is_referred, 'null_false');
            _newborn.has_danger_sign = dataTransform(fields.has_danger_sign, 'null_false');
            _newborn.has_unable_to_suckle = dataTransform(fields.has_unable_to_suckle, 'null_false');
            _newborn.has_vomits_everything_consumes = dataTransform(fields.has_vomits_everything_consumes, 'null_false');
            _newborn.has_convulsion = dataTransform(fields.has_convulsion, 'null_false');
            _newborn.has_sleepy_unconscious = dataTransform(fields.has_sleepy_unconscious, 'null_false');
            _newborn.has_stiff_neck = dataTransform(fields.has_stiff_neck, 'null_false');
            _newborn.has_domed_fontanelle = dataTransform(fields.has_domed_fontanelle, 'null_false');
            _newborn.has_breathe_hard = dataTransform(fields.has_breathe_hard, 'null_false');
            _newborn.has_subcostal_indrawing = dataTransform(fields.has_subcostal_indrawing, 'null_false');
            _newborn.has_wheezing = dataTransform(fields.has_wheezing, 'null_false');
            _newborn.has_diarrhea = dataTransform(fields.has_diarrhea, 'null_false');
            _newborn.has_malnutrition = dataTransform(fields.has_malnutrition, 'null_false');
            _newborn.has_others_heath_problem = dataTransform(fields.has_others_heath_problem, 'null_false');
            _newborn.has_malaria = dataTransform(fields.has_malaria, 'null_false');
            _newborn.has_pneumonia = dataTransform(fields.has_pneumonia, 'null_false');
            _newborn.has_cough_cold = dataTransform(fields.has_cough_cold, 'null_false');
            _newborn.has_pre_reference_treatments = dataTransform(fields.has_pre_reference_treatments, 'null_false');
            _newborn.reference_pattern_other = dataTransform(fields.reference_pattern_other, 'string');
        }

        if (report.form === 'newborn_followup') {
            _newborn.consultation_followup = 'followup';
            _newborn.referal_health_center = dataTransform(fields.referal_health_center, 'null_false');
            _newborn.is_health_referred = dataTransform(fields.is_health_referred, 'null_false');
            _newborn.has_danger_sign = dataTransform(fields.has_danger_sign, 'null_false');
            _newborn.has_new_complaint = dataTransform(fields.has_new_complaint, 'null_false');
            _newborn.other_diseases = dataTransform(fields.other_diseases, 'string');
            _newborn.has_unable_to_suckle = dataTransform(fields.has_unable_to_suckle, 'null_false');
            _newborn.has_vomits_everything_consumes = dataTransform(fields.has_vomits_everything_consumes, 'null_false');
            _newborn.has_convulsion = dataTransform(fields.has_convulsion, 'null_false');
            _newborn.has_sleepy_unconscious = dataTransform(fields.has_sleepy_unconscious, 'null_false');
            _newborn.has_stiff_neck = dataTransform(fields.has_stiff_neck, 'null_false');
            _newborn.has_domed_fontanelle = dataTransform(fields.has_domed_fontanelle, 'null_false');
            _newborn.has_breathe_hard = dataTransform(fields.has_breathe_hard, 'null_false');
            _newborn.has_subcostal_indrawing = dataTransform(fields.has_subcostal_indrawing, 'null_false');
            _newborn.has_wheezing = dataTransform(fields.has_wheezing, 'null_false');
            _newborn.has_diarrhea = dataTransform(fields.has_diarrhea, 'null_false');
            _newborn.has_malnutrition = dataTransform(fields.has_malnutrition, 'null_false');
            _newborn.has_others_heath_problem = dataTransform(fields.has_others_heath_problem, 'null_false');
            _newborn.reference_pattern_other = dataTransform(fields.reference_pattern_other, 'string');
            _newborn.has_malaria = dataTransform(fields.has_malaria, 'null_false');
            _newborn.has_pneumonia = dataTransform(fields.has_pneumonia, 'null_false');
            _newborn.has_cough_cold = dataTransform(fields.has_cough_cold, 'null_false');
            _newborn.has_pre_reference_treatments = dataTransform(fields.has_pre_reference_treatments, 'null_false');
            _newborn.is_referred = dataTransform(fields.is_referred, 'null_false');
            _newborn.coupon_available = dataTransform(fields.coupon_available, 'null_false');
            _newborn.coupon_number = dataTransform(fields.coupon_number, 'string');
        }

        _newborn.country = fields.country_id;
        _newborn.region = fields.region_id;
        _newborn.prefecture = fields.prefecture_id;
        _newborn.commune = fields.commune_id;
        _newborn.hospital = fields.hospital_id;
        _newborn.district_quartier = fields.district_quartier_id;
        _newborn.village_secteur = fields.village_secteur_id;
        _newborn.family = fields.household_id;
        _newborn.reco = fields.user_id;
        _newborn.patient = fields.patient_id;
        _newborn.reported_date_timestamp = report.reported_date;
        _newborn.reported_date = reported_date;
        _newborn.reported_full_date = milisecond_to_date(report.reported_date, 'fulldate');
        _newborn.geolocation = report.geolocation;

        await _repoNewborn.save(_newborn);
        return true;
    } catch (err: any) {
        console.log(err)
        return false;
    }
}